import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  DEFAULT_ENRICH_BATCH_SIZE,
  DEFAULT_ENRICH_INTERVAL_MIN,
  DEFAULT_RELEVANCE_THRESHOLD,
} from '../config.js';
import { logger } from '../logger.js';
import {
  getUnprocessedArticles,
  updateArticle,
  type NewsArticle,
  type ArticleStatus,
} from '../db.js';
import { NEWS_ANALYST_SYSTEM_PROMPT, buildArticlePrompt } from './prompts.js';

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

let shutdownRequested = false;
let activeTimer: ReturnType<typeof setTimeout> | null = null;

function handleShutdown(signal: string): void {
  logger.info(`Received ${signal}, shutting down enricher gracefully...`);
  shutdownRequested = true;
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  setTimeout(() => process.exit(0), 5_000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Claude client
// ---------------------------------------------------------------------------

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }
  return new Anthropic({ apiKey });
}

// ---------------------------------------------------------------------------
// Enrichment response type
// ---------------------------------------------------------------------------

interface EnrichmentResult {
  title: string;
  summary: string;
  workerImpact: string;
  relevanceScore: number;
  tags: string[];
  shouldPublish: boolean;
}

const VALID_TAGS = new Set([
  'contract',
  'safety',
  'dispatch',
  'vessel',
  'strike',
  'pension',
  'weather',
  'automation',
  'expansion',
  'cargo',
  'regulation',
  'wages',
  'hours',
  'training',
]);

/**
 * Validate and sanitize the enrichment result from Claude.
 * Returns null if the response is fundamentally broken.
 */
function validateEnrichment(raw: unknown): EnrichmentResult | null {
  if (typeof raw !== 'object' || raw === null) return null;

  const obj = raw as Record<string, unknown>;

  const title = typeof obj.title === 'string' ? obj.title.slice(0, 80) : null;
  const summary = typeof obj.summary === 'string' ? obj.summary : null;
  const workerImpact =
    typeof obj.workerImpact === 'string' ? obj.workerImpact : null;

  const relevanceScore =
    typeof obj.relevanceScore === 'number'
      ? Math.max(0, Math.min(100, Math.round(obj.relevanceScore)))
      : null;

  if (!title || !summary || !workerImpact || relevanceScore === null) {
    return null;
  }

  // Filter tags to only valid values
  let tags: string[] = [];
  if (Array.isArray(obj.tags)) {
    tags = obj.tags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.toLowerCase().trim())
      .filter((t) => VALID_TAGS.has(t));
  }
  if (tags.length === 0) {
    tags = ['cargo']; // Default fallback tag
  }

  const shouldPublish =
    typeof obj.shouldPublish === 'boolean'
      ? obj.shouldPublish
      : relevanceScore >= (parseInt(
          process.env.RELEVANCE_THRESHOLD ??
            String(DEFAULT_RELEVANCE_THRESHOLD),
          10
        ));

  return { title, summary, workerImpact, relevanceScore, tags, shouldPublish };
}

// ---------------------------------------------------------------------------
// Core enrichment
// ---------------------------------------------------------------------------

async function enrichArticle(
  client: Anthropic,
  article: NewsArticle
): Promise<boolean> {
  const articleId = article.id;
  if (!articleId) {
    logger.error('Article missing ID, skipping');
    return false;
  }

  try {
    const userPrompt = buildArticlePrompt(article);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: NEWS_ANALYST_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    // Extract text content from the response
    const textBlock = response.content.find((block) => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      logger.error('No text in Claude response', { articleId });
      await updateArticle(articleId, { status: 'error' });
      return false;
    }

    // Parse JSON response
    let parsed: unknown;
    try {
      // Strip any markdown fencing if Claude included it despite instructions
      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText
          .replace(/^```(?:json)?\s*\n?/, '')
          .replace(/\n?```\s*$/, '');
      }
      parsed = JSON.parse(jsonText);
    } catch (parseErr) {
      logger.error('Failed to parse Claude JSON response', {
        articleId,
        rawResponse: textBlock.text.slice(0, 200),
      });
      await updateArticle(articleId, { status: 'error' });
      return false;
    }

    const enrichment = validateEnrichment(parsed);
    if (!enrichment) {
      logger.error('Claude response failed validation', {
        articleId,
        parsed,
      });
      await updateArticle(articleId, { status: 'error' });
      return false;
    }

    // Determine final status
    const relevanceThreshold = parseInt(
      process.env.RELEVANCE_THRESHOLD ??
        String(DEFAULT_RELEVANCE_THRESHOLD),
      10
    );

    const status: ArticleStatus =
      enrichment.shouldPublish && enrichment.relevanceScore >= relevanceThreshold
        ? 'published'
        : 'rejected';

    await updateArticle(articleId, {
      title: enrichment.title,
      summary: enrichment.summary,
      worker_impact: enrichment.workerImpact,
      relevance_score: enrichment.relevanceScore,
      tags: enrichment.tags,
      status,
      enriched_at: new Date().toISOString(),
    });

    logger.info(`Enriched article: ${enrichment.title}`, {
      articleId,
      relevanceScore: enrichment.relevanceScore,
      status,
      tags: enrichment.tags,
    });

    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    // Handle rate limiting specifically
    if (
      err instanceof Anthropic.RateLimitError ||
      (err instanceof Anthropic.APIError && err.status === 429)
    ) {
      logger.warn('Rate limited by Anthropic API, will retry next cycle', {
        articleId,
      });
      // Don't mark as error -- leave as 'fetched' so it gets retried
      return false;
    }

    logger.error(`Failed to enrich article`, {
      articleId,
      error: message,
    });
    await updateArticle(articleId, { status: 'error' });
    return false;
  }
}

async function processEnrichmentBatch(): Promise<void> {
  const batchSize = parseInt(
    process.env.ENRICH_BATCH_SIZE ?? String(DEFAULT_ENRICH_BATCH_SIZE),
    10
  );

  logger.info('Starting enrichment cycle', { batchSize });

  const articles = await getUnprocessedArticles(batchSize);

  if (articles.length === 0) {
    logger.info('No unprocessed articles to enrich');
    return;
  }

  logger.info(`Found ${articles.length} articles to enrich`);

  const client = getAnthropicClient();

  let enriched = 0;
  let failed = 0;

  for (const article of articles) {
    if (shutdownRequested) {
      logger.info('Shutdown requested, stopping enrichment early');
      break;
    }

    const success = await enrichArticle(client, article);
    if (success) {
      enriched++;
    } else {
      failed++;
    }

    // Small delay between API calls to be respectful of rate limits
    if (!shutdownRequested) {
      await new Promise((resolve) => setTimeout(resolve, 1_500));
    }
  }

  logger.info('Enrichment cycle complete', {
    total: articles.length,
    enriched,
    failed,
  });
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const intervalMin = parseInt(
    process.env.ENRICH_INTERVAL_MIN ?? String(DEFAULT_ENRICH_INTERVAL_MIN),
    10
  );
  const intervalMs = intervalMin * 60 * 1000;

  logger.info('News enricher starting', { intervalMin });

  // Validate API key is present on startup
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    logger.error('ANTHROPIC_API_KEY not set, exiting');
    process.exit(1);
  }

  // Run immediately on startup
  await processEnrichmentBatch();

  // Then run on interval
  function scheduleNext(): void {
    if (shutdownRequested) return;

    logger.info(`Next enrichment cycle in ${intervalMin} minutes`);
    activeTimer = setTimeout(async () => {
      if (shutdownRequested) return;

      try {
        await processEnrichmentBatch();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Unhandled error in enrichment cycle', {
          error: message,
        });
      }

      scheduleNext();
    }, intervalMs);
  }

  scheduleNext();
}

main().catch((err) => {
  logger.error('Fatal error in enricher', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});

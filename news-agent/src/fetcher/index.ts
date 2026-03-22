import 'dotenv/config';
import {
  NEWS_SOURCES,
  DEFAULT_FETCH_INTERVAL_MIN,
  NewsSourceConfig,
} from '../config.js';
import { logger } from '../logger.js';
import {
  articleExistsByUrl,
  insertArticle,
  updateSourceLastChecked,
} from '../db.js';
import { fetchRss } from './rss-fetcher.js';
import { fetchHtml } from './html-fetcher.js';
import type { FetchedArticle } from './rss-fetcher.js';

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

let shutdownRequested = false;
let activeTimer: ReturnType<typeof setTimeout> | null = null;

function handleShutdown(signal: string): void {
  logger.info(`Received ${signal}, shutting down fetcher gracefully...`);
  shutdownRequested = true;
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
  // Give in-flight work a moment to finish, then exit
  setTimeout(() => process.exit(0), 5_000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Core logic
// ---------------------------------------------------------------------------

async function fetchSource(
  source: NewsSourceConfig
): Promise<FetchedArticle[]> {
  if (source.feedType === 'rss') {
    return fetchRss(source);
  }
  return fetchHtml(source);
}

async function processSources(): Promise<void> {
  logger.info('Starting fetch cycle', {
    sources: NEWS_SOURCES.length,
  });

  let totalFound = 0;
  let totalNew = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const source of NEWS_SOURCES) {
    if (shutdownRequested) {
      logger.info('Shutdown requested, stopping fetch cycle early');
      break;
    }

    let sourceArticles: FetchedArticle[] = [];
    let sourceError: string | undefined;

    try {
      sourceArticles = await fetchSource(source);
    } catch (err) {
      sourceError = err instanceof Error ? err.message : String(err);
      logger.error(`Unexpected error fetching ${source.name}`, {
        error: sourceError,
      });
      totalErrors++;
    }

    let sourceNew = 0;

    for (const article of sourceArticles) {
      totalFound++;

      // Deduplicate by URL
      const exists = await articleExistsByUrl(article.url);
      if (exists) {
        totalSkipped++;
        continue;
      }

      const result = await insertArticle({
        source_name: source.name,
        category: source.category,
        external_url: article.url,
        title: article.title,
        raw_title: article.title,
        raw_summary: article.summary,
        published_at: article.publishedAt ?? undefined,
        status: 'fetched',
      });

      if (result) {
        totalNew++;
        sourceNew++;
      }
    }

    // Track source metadata
    await updateSourceLastChecked(source.name);

    logger.info(`Source complete: ${source.name}`, {
      found: sourceArticles.length,
      new: sourceNew,
      error: sourceError ?? null,
    });
  }

  logger.info('Fetch cycle complete', {
    totalFound,
    totalNew,
    totalSkipped,
    totalErrors,
  });
}

// ---------------------------------------------------------------------------
// Main loop
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const intervalMin = parseInt(
    process.env.FETCH_INTERVAL_MIN ?? String(DEFAULT_FETCH_INTERVAL_MIN),
    10
  );
  const intervalMs = intervalMin * 60 * 1000;

  logger.info('News fetcher starting', {
    intervalMin,
    sourceCount: NEWS_SOURCES.length,
    sources: NEWS_SOURCES.map((s) => s.name),
  });

  // Run immediately on startup
  await processSources();

  // Then run on interval
  function scheduleNext(): void {
    if (shutdownRequested) return;

    logger.info(`Next fetch cycle in ${intervalMin} minutes`);
    activeTimer = setTimeout(async () => {
      if (shutdownRequested) return;

      try {
        await processSources();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('Unhandled error in fetch cycle', { error: message });
      }

      scheduleNext();
    }, intervalMs);
  }

  scheduleNext();
}

main().catch((err) => {
  logger.error('Fatal error in fetcher', {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});

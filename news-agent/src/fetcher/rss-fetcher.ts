import Parser from 'rss-parser';
import { NewsSourceConfig, USER_AGENT } from '../config.js';
import { logger } from '../logger.js';

export interface FetchedArticle {
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
}

const parser = new Parser({
  timeout: 30_000,
  headers: { 'User-Agent': USER_AGENT },
  maxRedirects: 5,
});

/**
 * Fetch articles from an RSS feed source.
 * Returns an array of raw articles (title, summary, url, publishedAt).
 * On failure, logs the error and returns an empty array.
 */
export async function fetchRss(
  source: NewsSourceConfig
): Promise<FetchedArticle[]> {
  try {
    logger.info(`Fetching RSS: ${source.name}`, { url: source.url });

    const feed = await parser.parseURL(source.url);
    const articles: FetchedArticle[] = [];

    for (const item of feed.items) {
      const url = item.link?.trim();
      if (!url) continue;

      const title = (item.title ?? '').trim();
      if (!title) continue;

      // Use contentSnippet (plain text) over content (HTML) for summary
      const summary = (
        item.contentSnippet ??
        item.content ??
        item.summary ??
        ''
      )
        .trim()
        .slice(0, 500);

      const publishedAt = item.isoDate ?? item.pubDate ?? null;

      articles.push({ title, summary, url, publishedAt });
    }

    logger.info(`RSS fetched: ${source.name}`, {
      articlesFound: articles.length,
    });

    return articles;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`RSS fetch failed: ${source.name}`, {
      url: source.url,
      error: message,
    });
    return [];
  }
}

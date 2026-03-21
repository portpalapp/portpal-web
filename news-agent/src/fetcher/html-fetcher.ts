import { parse as parseHtml } from 'node-html-parser';
import {
  NewsSourceConfig,
  USER_AGENT,
  MAX_BODY_CHARS,
  SCRAPE_DELAY_MS,
} from '../config.js';
import { logger } from '../logger.js';

export interface FetchedArticle {
  title: string;
  summary: string;
  url: string;
  publishedAt: string | null;
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a single URL and return its HTML text.
 * Returns null on failure.
 */
async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!response.ok) {
      logger.warn(`HTTP ${response.status} fetching ${url}`);
      return null;
    }

    return await response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn(`Failed to fetch page: ${url}`, { error: message });
    return null;
  }
}

/**
 * Resolve a potentially relative URL against a base URL.
 */
function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

/**
 * Extract plain text body from an article page HTML.
 * Strips scripts, styles, nav, footer, and returns the first N characters.
 */
function extractBodyText(html: string, maxChars: number): string {
  const root = parseHtml(html);

  // Remove non-content elements
  for (const tag of ['script', 'style', 'nav', 'footer', 'header', 'aside']) {
    for (const el of root.querySelectorAll(tag)) {
      el.remove();
    }
  }

  // Try common article body selectors first
  const bodySelectors = [
    'article',
    '.entry-content',
    '.post-content',
    '.article-body',
    '.article-content',
    '.content-body',
    'main',
    '[role="main"]',
  ];

  for (const selector of bodySelectors) {
    const el = root.querySelector(selector);
    if (el) {
      const text = el.textContent.replace(/\s+/g, ' ').trim();
      if (text.length > 50) {
        return text.slice(0, maxChars);
      }
    }
  }

  // Fallback: grab body text
  const body = root.querySelector('body');
  if (body) {
    const text = body.textContent.replace(/\s+/g, ' ').trim();
    return text.slice(0, maxChars);
  }

  return '';
}

/**
 * Extract the page title from HTML.
 */
function extractTitle(html: string): string {
  const root = parseHtml(html);

  // Try og:title meta tag first
  const ogTitle = root.querySelector('meta[property="og:title"]');
  if (ogTitle) {
    const content = ogTitle.getAttribute('content')?.trim();
    if (content) return content;
  }

  // Try h1
  const h1 = root.querySelector('h1');
  if (h1) {
    const text = h1.textContent.trim();
    if (text) return text;
  }

  // Try title tag
  const titleTag = root.querySelector('title');
  if (titleTag) {
    return titleTag.textContent.trim();
  }

  return '';
}

/**
 * Scrape articles from an HTML page by finding article links,
 * then fetching each link to extract title and body text.
 */
export async function fetchHtml(
  source: NewsSourceConfig
): Promise<FetchedArticle[]> {
  try {
    logger.info(`Fetching HTML: ${source.name}`, { url: source.url });

    const indexHtml = await fetchPage(source.url);
    if (!indexHtml) {
      logger.error(`Failed to fetch index page: ${source.name}`);
      return [];
    }

    const root = parseHtml(indexHtml);
    const selector = source.scrapeSelector ?? 'article a';
    const linkElements = root.querySelectorAll(selector);

    // Collect unique article URLs
    const seenUrls = new Set<string>();
    const candidateUrls: string[] = [];

    for (const el of linkElements) {
      const href = el.getAttribute('href');
      if (!href) continue;

      const resolved = resolveUrl(href, source.url);
      if (!resolved) continue;

      // Skip anchors, javascript links, and non-article patterns
      if (
        resolved.includes('#') && resolved.split('#')[0] === source.url ||
        resolved.startsWith('javascript:') ||
        resolved.startsWith('mailto:')
      ) {
        continue;
      }

      // Skip if same as the index page
      if (resolved === source.url || resolved === source.url + '/') continue;

      if (!seenUrls.has(resolved)) {
        seenUrls.add(resolved);
        candidateUrls.push(resolved);
      }
    }

    // Limit to first 15 links to avoid hammering the server
    const urlsToFetch = candidateUrls.slice(0, 15);

    logger.info(`Found ${candidateUrls.length} links on ${source.name}, fetching ${urlsToFetch.length}`);

    const articles: FetchedArticle[] = [];

    for (const articleUrl of urlsToFetch) {
      // Rate-limit: delay between requests to the same domain
      await sleep(SCRAPE_DELAY_MS);

      const articleHtml = await fetchPage(articleUrl);
      if (!articleHtml) continue;

      const title = extractTitle(articleHtml);
      if (!title) continue;

      const summary = extractBodyText(articleHtml, MAX_BODY_CHARS);

      // Try to extract publish date from meta tags
      const articleRoot = parseHtml(articleHtml);
      const dateMeta =
        articleRoot.querySelector('meta[property="article:published_time"]') ??
        articleRoot.querySelector('meta[name="date"]') ??
        articleRoot.querySelector('meta[name="pubdate"]') ??
        articleRoot.querySelector('time');

      let publishedAt: string | null = null;
      if (dateMeta) {
        const dateValue =
          dateMeta.getAttribute('content') ??
          dateMeta.getAttribute('datetime') ??
          null;
        if (dateValue) {
          try {
            publishedAt = new Date(dateValue).toISOString();
          } catch {
            // Invalid date, leave as null
          }
        }
      }

      articles.push({ title, summary, url: articleUrl, publishedAt });
    }

    logger.info(`HTML fetched: ${source.name}`, {
      articlesFound: articles.length,
    });

    return articles;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`HTML fetch failed: ${source.name}`, {
      url: source.url,
      error: message,
    });
    return [];
  }
}

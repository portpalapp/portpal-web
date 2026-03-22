export type FeedType = 'rss' | 'html_scrape';

export type SourceCategory =
  | 'union'
  | 'employer'
  | 'port'
  | 'terminal'
  | 'government'
  | 'industry'
  | 'labour';

export interface NewsSourceConfig {
  name: string;
  url: string;
  feedType: FeedType;
  category: SourceCategory;
  /** CSS selector to find article links on an HTML page (used for html_scrape sources) */
  scrapeSelector?: string;
}

export const NEWS_SOURCES: NewsSourceConfig[] = [
  // --- Union sources ---
  {
    name: 'ILWU International',
    url: 'https://www.ilwu.org/feed/',
    feedType: 'rss',
    category: 'union',
  },
  {
    name: 'ILWU Local 500',
    url: 'https://ilwu500.org/feed/',
    feedType: 'rss',
    category: 'union',
  },
  {
    name: 'ILWU Local 502',
    url: 'https://www.ilwu502.ca/',
    feedType: 'html_scrape',
    category: 'union',
    scrapeSelector: 'article a, .entry-title a, .post-title a, .news-item a',
  },

  // --- Employer ---
  {
    name: 'BCMEA',
    url: 'https://www.bcmaritime.com/feed/',
    feedType: 'rss',
    category: 'employer',
  },

  // --- Port authority ---
  // Port of Vancouver direct site is behind Cloudflare (403 challenge).
  // Using Google News RSS to aggregate coverage from CBC, Globe and Mail, Vancouver Sun, etc.
  {
    name: 'Port of Vancouver',
    url: 'https://news.google.com/rss/search?q=%22port+of+vancouver%22+when:7d&hl=en-CA&gl=CA&ceid=CA:en',
    feedType: 'rss',
    category: 'port',
  },

  // --- Terminal operators ---
  // DP World site is a Next.js SPA — content is client-side rendered, so HTML scraping
  // returns 0 articles. Using Google News RSS to aggregate DP World coverage instead.
  {
    name: 'DP World',
    url: 'https://news.google.com/rss/search?q=%22DP+World%22+port+OR+terminal+OR+container+when:7d&hl=en-CA&gl=CA&ceid=CA:en',
    feedType: 'rss',
    category: 'terminal',
  },
  {
    name: 'GCT Global',
    url: 'https://globalterminals.com/news/',
    feedType: 'html_scrape',
    category: 'terminal',
    scrapeSelector: 'article a, .news-item a, .post-title a, .entry-title a',
  },

  // --- Government ---
  // Transport Canada marine page is a static topic hub with no news items.
  // No RSS feed available on tc.canada.ca. Using Google News RSS for TC marine coverage.
  {
    name: 'Transport Canada',
    url: 'https://news.google.com/rss/search?q=%22Transport+Canada%22+marine+OR+shipping+OR+port+when:14d&hl=en-CA&gl=CA&ceid=CA:en',
    feedType: 'rss',
    category: 'government',
  },

  // --- Industry RSS feeds ---
  {
    name: 'gCaptain',
    url: 'https://gcaptain.com/feed/',
    feedType: 'rss',
    category: 'industry',
  },
  {
    name: 'Splash247',
    url: 'https://splash247.com/feed/',
    feedType: 'rss',
    category: 'industry',
  },
  {
    name: 'FreightWaves',
    url: 'https://www.freightwaves.com/feed',
    feedType: 'rss',
    category: 'industry',
  },
  // JOC RSS is dead (returns HTML, site paywalled). Replaced with Hellenic Shipping News.
  {
    name: 'Hellenic Shipping News',
    url: 'https://www.hellenicshippingnews.com/feed/',
    feedType: 'rss',
    category: 'industry',
  },

  // --- Labour relations ---
  {
    name: 'BC Labour Relations',
    url: 'https://www.lrb.bc.ca/',
    feedType: 'html_scrape',
    category: 'labour',
    scrapeSelector: 'article a, .news-item a, .views-row a, .field-content a',
  },
];

/**
 * Keywords used for initial relevance filtering before sending to Claude.
 * Articles matching any of these keywords get prioritized.
 */
export const RELEVANCE_KEYWORDS: string[] = [
  'port',
  'longshoreman',
  'longshoremen',
  'longshore',
  'ILWU',
  'BCMEA',
  'dispatch',
  'container',
  'terminal',
  'crane',
  'vessel',
  'dock',
  'waterfront',
  'cargo',
  'maritime',
  'stevedore',
  'wharf',
  'berth',
  'shipping',
  'freight',
  'union',
  'labour',
  'labor',
  'strike',
  'lockout',
  'collective agreement',
  'bargaining',
  'arbitration',
  'seniority',
  'casual worker',
  'gang',
  'hatch',
  'gantry',
  'TEU',
  'bulk cargo',
  'container ship',
  'Vancouver port',
  'Deltaport',
  'Vanterm',
  'Centerm',
  'Fraser Surrey',
  'Roberts Bank',
  'Burrard Inlet',
  'DP World',
  'GCT',
  'safety',
  'automation',
  'pension',
  'wages',
  'overtime',
];

/** Default fetch interval in minutes */
export const DEFAULT_FETCH_INTERVAL_MIN = 90;

/** Default enrich interval in minutes */
export const DEFAULT_ENRICH_INTERVAL_MIN = 360;

/** Default batch size for enrichment */
export const DEFAULT_ENRICH_BATCH_SIZE = 20;

/** Default relevance threshold (0-100) */
export const DEFAULT_RELEVANCE_THRESHOLD = 20;

/** User agent string for HTTP requests */
export const USER_AGENT =
  'PortpalNewsAgent/1.0 (news aggregation for port workers)';

/** Max body text to extract from HTML articles (characters) */
export const MAX_BODY_CHARS = 500;

/** Delay between requests to the same domain (milliseconds) */
export const SCRAPE_DELAY_MS = 2500;

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
    url: 'https://www.ilwu.org/news/',
    feedType: 'html_scrape',
    category: 'union',
    scrapeSelector: 'article a, .entry-title a, .post-title a, .news-item a',
  },
  {
    name: 'ILWU Local 500',
    url: 'https://ilwu500.org/',
    feedType: 'html_scrape',
    category: 'union',
    scrapeSelector: 'article a, .entry-title a, .post-title a, .news-item a',
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
    url: 'https://www.bcmea.com/news/',
    feedType: 'html_scrape',
    category: 'employer',
    scrapeSelector: '.news-item a, article a, .post-title a, .entry-title a',
  },

  // --- Port authority ---
  {
    name: 'Port of Vancouver',
    url: 'https://www.portvancouver.com/news-and-media/news-releases/',
    feedType: 'html_scrape',
    category: 'port',
    scrapeSelector: '.news-release a, article a, .media-item a, .post-title a',
  },

  // --- Terminal operators ---
  {
    name: 'DP World',
    url: 'https://www.dpworld.com/en/news',
    feedType: 'html_scrape',
    category: 'terminal',
    scrapeSelector: '.news-card a, article a, .media-card a, .card a',
  },
  {
    name: 'GCT Global',
    url: 'https://globalterminals.com/news/',
    feedType: 'html_scrape',
    category: 'terminal',
    scrapeSelector: 'article a, .news-item a, .post-title a, .entry-title a',
  },

  // --- Government ---
  {
    name: 'Transport Canada',
    url: 'https://tc.canada.ca/en/marine-transportation',
    feedType: 'html_scrape',
    category: 'government',
    scrapeSelector: 'article a, .views-row a, .field-content a, .news-item a',
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
  {
    name: 'JOC',
    url: 'https://www.joc.com/rss',
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

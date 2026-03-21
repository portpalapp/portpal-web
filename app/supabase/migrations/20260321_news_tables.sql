-- News sources configuration
CREATE TABLE IF NOT EXISTS public.news_sources (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  url text NOT NULL,
  feed_type text NOT NULL DEFAULT 'rss' CHECK (feed_type IN ('rss', 'html_scrape', 'api')),
  category text NOT NULL DEFAULT 'industry' CHECK (category IN ('union', 'employer', 'port', 'terminal', 'government', 'industry', 'labour')),
  check_interval_min int NOT NULL DEFAULT 90,
  last_checked_at timestamptz,
  last_article_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  scrape_selector text,
  created_at timestamptz DEFAULT now()
);

-- News articles
CREATE TABLE IF NOT EXISTS public.news_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id int REFERENCES public.news_sources(id),
  source_name text,
  external_url text NOT NULL,
  external_id text,
  raw_title text NOT NULL,
  raw_summary text,
  title text,
  summary text,
  worker_impact text,
  category text NOT NULL DEFAULT 'industry' CHECK (category IN ('union', 'employer', 'port', 'terminal', 'government', 'industry', 'labour')),
  tags text[] DEFAULT '{}',
  relevance_score int DEFAULT 50 CHECK (relevance_score >= 0 AND relevance_score <= 100),
  status text NOT NULL DEFAULT 'fetched' CHECK (status IN ('fetched', 'processing', 'published', 'rejected', 'error')),
  processing_error text,
  published_at timestamptz,
  fetched_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  url_hash text GENERATED ALWAYS AS (md5(external_url)) STORED,
  UNIQUE(url_hash)
);

CREATE INDEX idx_news_status ON public.news_articles(status);
CREATE INDEX idx_news_published ON public.news_articles(published_at DESC);
CREATE INDEX idx_news_category ON public.news_articles(category);

-- RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read published news" ON public.news_articles FOR SELECT USING (status = 'published');
CREATE POLICY "Anyone can read news sources" ON public.news_sources FOR SELECT USING (true);

-- Seed: news sources
INSERT INTO public.news_sources (name, url, feed_type, category, check_interval_min, scrape_selector) VALUES
  ('ILWU Canada',            'https://ilwu.ca/news/',                          'html_scrape', 'union',      90,  'article.post'),
  ('ILWU International',     'https://www.ilwu.org/news/',                     'html_scrape', 'union',      120, 'article.post'),
  ('BCMEA',                  'https://www.bcmea.com/news/',                    'html_scrape', 'employer',   90,  '.news-item'),
  ('Vancouver Fraser Port',  'https://www.portvancouver.com/news/',            'html_scrape', 'port',       60,  '.news-card'),
  ('Port of Prince Rupert',  'https://www.rupertport.com/news/',               'html_scrape', 'port',       120, '.news-item'),
  ('GCT Terminals',          'https://globalterminals.com/news/',              'html_scrape', 'terminal',   120, 'article'),
  ('DP World Vancouver',     'https://www.dpworld.com/en/canada/news',         'html_scrape', 'terminal',   120, '.news-card'),
  ('Transport Canada',       'https://tc.canada.ca/en/marine-transportation',  'html_scrape', 'government', 180, '.news-item'),
  ('BC Government News',     'https://news.gov.bc.ca/ministries/transportation-and-transit', 'html_scrape', 'government', 180, '.news-release'),
  ('Journal of Commerce',    'https://www.joc.com/feed',                       'rss',         'industry',   60,  NULL),
  ('Splash 247',             'https://splash247.com/feed/',                    'rss',         'industry',   90,  NULL),
  ('Canadian Sailings',      'https://www.canadiansailings.ca/feed/',          'rss',         'industry',   90,  NULL),
  ('BC Federation of Labour','https://bcfed.ca/news',                          'html_scrape', 'labour',     120, '.news-item');

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ArticleStatus = 'fetched' | 'enriched' | 'published' | 'rejected' | 'error';

export interface NewsArticle {
  id?: string;
  source_name: string;
  source_category: string;
  url: string;
  title: string;
  raw_title?: string;
  summary?: string;
  raw_summary?: string;
  body_text?: string;
  worker_impact?: string;
  relevance_score?: number;
  tags?: string[];
  published_at?: string;
  fetched_at?: string;
  enriched_at?: string;
  status: ArticleStatus;
}

export interface NewsSource {
  id?: string;
  name: string;
  url: string;
  category: string;
  last_checked_at?: string;
  last_error?: string;
  articles_found?: number;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables'
    );
  }

  supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  return supabase;
}

// ---------------------------------------------------------------------------
// Article helpers
// ---------------------------------------------------------------------------

export async function insertArticle(
  article: Omit<NewsArticle, 'id'>
): Promise<{ id: string } | null> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('news_articles')
    .insert({
      ...article,
      fetched_at: article.fetched_at ?? new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to insert article', {
      url: article.url,
      error: error.message,
    });
    return null;
  }

  return data as { id: string };
}

export async function updateArticle(
  id: string,
  updates: Partial<NewsArticle>
): Promise<boolean> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('news_articles')
    .update(updates)
    .eq('id', id);

  if (error) {
    logger.error('Failed to update article', { id, error: error.message });
    return false;
  }

  return true;
}

export async function getUnprocessedArticles(
  limit: number
): Promise<NewsArticle[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('news_articles')
    .select('*')
    .eq('status', 'fetched')
    .order('fetched_at', { ascending: true })
    .limit(limit);

  if (error) {
    logger.error('Failed to fetch unprocessed articles', {
      error: error.message,
    });
    return [];
  }

  return (data ?? []) as NewsArticle[];
}

export async function articleExistsByUrl(url: string): Promise<boolean> {
  const client = getSupabaseClient();

  const { count, error } = await client
    .from('news_articles')
    .select('id', { count: 'exact', head: true })
    .eq('url', url);

  if (error) {
    logger.error('Failed to check article existence', {
      url,
      error: error.message,
    });
    // On error, assume it exists to avoid duplicates
    return true;
  }

  return (count ?? 0) > 0;
}

export async function updateSourceLastChecked(
  sourceName: string,
  articlesFound: number,
  lastError?: string
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('news_sources')
    .upsert(
      {
        name: sourceName,
        last_checked_at: new Date().toISOString(),
        articles_found: articlesFound,
        last_error: lastError ?? null,
      },
      { onConflict: 'name' }
    );

  if (error) {
    logger.warn('Failed to update source last_checked', {
      sourceName,
      error: error.message,
    });
  }
}

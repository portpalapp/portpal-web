import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger.js';

// ---------------------------------------------------------------------------
// Types — matched to actual Supabase schema
// ---------------------------------------------------------------------------

export type ArticleStatus = 'fetched' | 'enriched' | 'published' | 'rejected' | 'error';

export interface NewsArticle {
  id?: string;
  source_id?: number;
  source_name: string;
  category: string;
  external_url: string;
  external_id?: string;
  title: string;
  raw_title?: string;
  summary?: string;
  raw_summary?: string;
  worker_impact?: string;
  relevance_score?: number;
  tags?: string[];
  published_at?: string;
  fetched_at?: string;
  processed_at?: string;
  url_hash?: string;
  status: ArticleStatus;
  processing_error?: string;
}

export interface NewsSource {
  id?: string;
  name: string;
  url: string;
  feed_type?: string;
  category: string;
  last_checked_at?: string;
  last_article_at?: string;
  is_active?: boolean;
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
      source_name: article.source_name,
      category: article.category,
      external_url: article.external_url,
      title: article.title,
      raw_title: article.raw_title,
      raw_summary: article.raw_summary,
      published_at: article.published_at,
      status: article.status,
      fetched_at: article.fetched_at ?? new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    logger.error('Failed to insert article', {
      url: article.external_url,
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
    .eq('external_url', url);

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
  sourceName: string
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('news_sources')
    .update({
      last_checked_at: new Date().toISOString(),
    })
    .eq('name', sourceName);

  if (error) {
    logger.warn('Failed to update source last_checked', {
      sourceName,
      error: error.message,
    });
  }
}

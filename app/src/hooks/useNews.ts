import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface NewsArticle {
  id: string;
  source_name: string;
  external_url: string;
  title: string;
  summary: string;
  worker_impact: string | null;
  category: 'union' | 'employer' | 'port' | 'terminal' | 'government' | 'industry' | 'labour';
  tags: string[];
  relevance_score: number;
  published_at: string;
  fetched_at: string;
}

/** Fetch published news articles, optionally filtered by category. */
export function useNews(category?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['news', category],
    queryFn: async () => {
      let query = supabase
        .from('news_articles')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[useNews] fetch error:', error.message);
        return [];
      }
      return (data ?? []) as NewsArticle[];
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    articles: data ?? [],
    loading: isLoading,
  };
}

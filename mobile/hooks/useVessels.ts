import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Vessel {
  imo: number;
  name: string;
  year_built: number | null;
  teu: number | null;
  bays: number | null;
  width: number | null;
  deck_lashing: string[];
  walkways: string[];
  lashing: string[];
  bars: string[];
  turnbuckles: string[];
  stackers: string[];
  notes: string[];
  former_names: string | null;
  scraped_at: string;
}

/** Search vessels by name (debounced externally). Returns up to 8 matches. */
export function useVesselSearch(query: string) {
  return useQuery({
    queryKey: ['vessels', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('vessels')
        .select('imo, name, year_built, teu, bays')
        .ilike('name', `%${query}%`)
        .order('name')
        .limit(8);

      if (error) {
        console.warn('[useVessels] search error:', error.message);
        return [];
      }
      return (data ?? []) as Pick<Vessel, 'imo' | 'name' | 'year_built' | 'teu' | 'bays'>[];
    },
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Fetch full vessel details by IMO number. */
export function useVesselDetails(imo: number | null) {
  return useQuery({
    queryKey: ['vessels', 'details', imo],
    queryFn: async () => {
      if (!imo) return null;
      const { data, error } = await supabase
        .from('vessels')
        .select('imo, name, year_built, teu, bays, width, deck_lashing, walkways, lashing, bars, turnbuckles, stackers, notes, former_names, scraped_at')
        .eq('imo', imo)
        .single();

      if (error) {
        console.warn('[useVessels] details error:', error.message);
        return null;
      }
      return data as Vessel;
    },
    enabled: imo !== null,
    staleTime: 30 * 60 * 1000, // 30 minutes — vessel data rarely changes
  });
}

/** Browse/list all vessels with pagination. */
export function useVesselList(page = 0, pageSize = 50) {
  return useQuery({
    queryKey: ['vessels', 'list', page],
    queryFn: async () => {
      const from = page * pageSize;
      const { data, error, count } = await supabase
        .from('vessels')
        .select('imo, name, year_built, teu, bays', { count: 'exact' })
        .order('name')
        .range(from, from + pageSize - 1);

      if (error) {
        console.warn('[useVessels] list error:', error.message);
        return { vessels: [], total: 0 };
      }
      return {
        vessels: (data ?? []) as Pick<Vessel, 'imo' | 'name' | 'year_built' | 'teu' | 'bays'>[],
        total: count ?? 0,
      };
    },
    staleTime: 10 * 60 * 1000,
  });
}

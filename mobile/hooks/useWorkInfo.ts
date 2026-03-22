import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShiftTotal {
  shift: string;
  date: string;
  pre: string;
  at: string;
}

export interface JobSection {
  section: string;
  totals: ShiftTotal[];
  jobs: {
    job: string;
    sites: {
      name: string;
      dates: ShiftTotal[];
    }[] | null;
  }[];
}

export interface WorkInfoSnapshot {
  id: string;
  location: string;
  scraped_at: string;
  stamp: string;
  totals: ShiftTotal[];
  sections: JobSection[];
}

// ---------------------------------------------------------------------------
// Location mapping
// ---------------------------------------------------------------------------

const LOCAL_TO_LOCATIONS: Record<string, string[]> = {
  '500': ['vancouver', 'squamish', 'coastwise'],
  '502': ['vancouver', 'squamish', 'coastwise'],
  '514': ['vancouver', 'squamish', 'coastwise'],
  '517': ['vancouver', 'squamish', 'coastwise'],
};

/** Get the BCMEA work-info locations for a given union local. */
export function getLocationsForLocal(unionLocal: string): string[] {
  return LOCAL_TO_LOCATIONS[unionLocal] ?? ['vancouver'];
}

// Untyped client for tables not in the Database type definition.
// work_info_snapshots is a system table managed by the scraper pipeline.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Fetch latest work-info snapshots for the given locations. */
export function useWorkInfo(locations: string[] = ['vancouver', 'squamish', 'coastwise']) {
  const { data, isLoading } = useQuery({
    queryKey: ['work-info', locations.join(',')],
    queryFn: async () => {
      try {
        const { data: rows, error } = await db
          .from('work_info_snapshots')
          .select('*')
          .in('location', locations)
          .order('location');

        if (error) {
          console.warn('[useWorkInfo] fetch error:', error.message);
          return [];
        }
        return (rows ?? []) as WorkInfoSnapshot[];
      } catch (err) {
        console.warn('[useWorkInfo] fetch failed:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    snapshots: data ?? [],
    loading: isLoading,
  };
}

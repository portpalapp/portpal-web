import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/useAuth';

export interface Profile {
  id: string;
  name: string;
  seniority: number;
  board: string;
  pensionGoal: number;
  union_local: string;
  home_terminal: string | null;
}

/** DB row shape (snake_case) for profiles table */
interface ProfileRow {
  id: string;
  name: string | null;
  seniority: number | null;
  board: string | null;
  pension_goal: number | null;
  union_local: string | null;
  home_terminal: string | null;
}

const DEFAULT_PROFILE: Profile = {
  id: '',
  name: 'Longshoreman',
  seniority: 0,
  board: 'A',
  pensionGoal: 120000,
  union_local: '500',
  home_terminal: null,
};

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile = DEFAULT_PROFILE, isLoading: loading, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return DEFAULT_PROFILE;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.warn('[useProfile] fetch error:', error.message);
          // Still use defaults with user metadata if available
          return {
            ...DEFAULT_PROFILE,
            id: user.id,
            name: user.user_metadata?.name || 'Longshoreman',
          };
        }

        if (data) {
          const row = data as ProfileRow;
          return {
            id: row.id,
            name: row.name || user.user_metadata?.name || 'Longshoreman',
            seniority: row.seniority ?? 0,
            board: row.board || 'A',
            pensionGoal: row.pension_goal ?? 120000,
            union_local: row.union_local || '500',
            home_terminal: row.home_terminal || null,
          } as Profile;
        }

        return {
          ...DEFAULT_PROFILE,
          id: user.id,
          name: user.user_metadata?.name || 'Longshoreman',
        };
      } catch (err) {
        console.warn('[useProfile] fetch failed:', err);
        return {
          ...DEFAULT_PROFILE,
          id: user.id,
          name: user.user_metadata?.name || 'Longshoreman',
        };
      }
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes — profile changes rarely
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<Omit<Profile, 'id'>>) => {
      if (!user) throw new Error('Not authenticated');

      const dbUpdates: Record<string, string | number | boolean | null> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.seniority !== undefined) dbUpdates.seniority = updates.seniority;
      if (updates.board !== undefined) dbUpdates.board = updates.board;
      if (updates.pensionGoal !== undefined) dbUpdates.pension_goal = updates.pensionGoal;
      if (updates.union_local !== undefined) dbUpdates.union_local = updates.union_local;
      if (updates.home_terminal !== undefined) dbUpdates.home_terminal = updates.home_terminal;

      // Supabase generated types may not include 'profiles' table — cast result
      const result = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', user.id)
        .select()
        .single();
      const { error } = result;
      const data = result.data as ProfileRow | null;

      if (error) throw error;
      if (!data) throw new Error('No data returned from profile update');
      return {
        id: data.id,
        name: data.name || 'Longshoreman',
        seniority: data.seniority ?? 0,
        board: data.board || 'A',
        pensionGoal: data.pension_goal ?? 120000,
        union_local: data.union_local || '500',
        home_terminal: data.home_terminal || null,
      } as Profile;
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile', user?.id], updatedProfile);
    },
  });

  const updateProfile = async (updates: Partial<Omit<Profile, 'id'>>) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      await updateProfileMutation.mutateAsync(updates);
      return { error: null };
    } catch (err) {
      console.warn('[useProfile] updateProfile failed:', err);
      return { error: err as Error };
    }
  };

  return { profile, loading, updateProfile, refetch };
}

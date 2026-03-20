import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Shift } from '../data/mockData';

/** DB row shape (snake_case) */
interface ShiftRow {
  id: string;
  user_id: string;
  date: string;
  job: string;
  location: string;
  subjob: string | null;
  shift: 'DAY' | 'NIGHT' | 'GRAVEYARD';
  reg_hours: number;
  ot_hours: number;
  reg_rate: number;
  ot_rate: number;
  total_pay: number;
  notes: string | null;
  attachments: { url: string; name: string; type: string }[] | null;
  created_at: string;
}

/** Map DB row -> app Shift type (camelCase) */
function toShift(row: ShiftRow): Shift {
  return {
    id: row.id,
    date: row.date,
    job: row.job,
    location: row.location,
    subjob: row.subjob ?? undefined,
    shift: row.shift,
    regHours: row.reg_hours,
    otHours: row.ot_hours,
    regRate: row.reg_rate,
    otRate: row.ot_rate,
    totalPay: row.total_pay,
    attachments: row.attachments ?? undefined,
  };
}

/** Attachment metadata stored in the shifts.attachments JSONB column */
export interface ShiftAttachment {
  url: string;
  name: string;
  type: string;
}

/** Input for adding a new shift (camelCase from the form) */
export interface AddShiftInput {
  date: string;
  job: string;
  location: string;
  subjob?: string;
  shift: 'DAY' | 'NIGHT' | 'GRAVEYARD';
  regHours: number;
  otHours: number;
  regRate: number;
  otRate: number;
  totalPay: number;
  notes?: string;
  attachments?: ShiftAttachment[];
}

export function useShifts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['shifts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const { data, error } = await supabase
          .from('shifts')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(2000);

        if (error) {
          console.warn('[useShifts] fetch error:', error.message);
          return [];
        }
        return (data as ShiftRow[]).map(toShift);
      } catch (err) {
        console.warn('[useShifts] fetch failed:', err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const addShiftMutation = useMutation({
    mutationFn: async (input: AddShiftInput) => {
      if (!user) throw new Error('Not authenticated');
      const row: Record<string, any> = {
        user_id: user.id,
        date: input.date,
        job: input.job,
        location: input.location,
        subjob: input.subjob || null,
        shift: input.shift,
        reg_hours: input.regHours,
        ot_hours: input.otHours,
        reg_rate: input.regRate,
        ot_rate: input.otRate,
        total_pay: input.totalPay,
        notes: input.notes || null,
        attachments: input.attachments ?? [],
      };
      const { data, error } = await supabase
        .from('shifts')
        .insert(row as any)
        .select()
        .single();

      if (error) throw error;
      return toShift(data as ShiftRow);
    },
    onSuccess: (newShift) => {
      // Optimistic: prepend to cache immediately
      queryClient.setQueryData(['shifts', user?.id], (old: Shift[] | undefined) =>
        [newShift, ...(old || [])]
      );
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('shifts').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      // Optimistic: remove from cache before server confirms
      await queryClient.cancelQueries({ queryKey: ['shifts', user?.id] });
      queryClient.setQueryData(['shifts', user?.id], (old: Shift[] | undefined) =>
        (old || []).filter(s => s.id !== id)
      );
    },
  });

  const updateAttachmentsMutation = useMutation({
    mutationFn: async ({ shiftId, attachments }: { shiftId: string; attachments: ShiftAttachment[] }) => {
      const { error } = await (supabase.from('shifts') as any)
        .update({ attachments })
        .eq('id', shiftId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', user?.id] });
    },
  });

  const addShift = async (input: AddShiftInput) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    try {
      const result = await addShiftMutation.mutateAsync(input);
      return { data: result, error: null };
    } catch (error) {
      console.warn('[useShifts] addShift failed:', error);
      return { data: null, error: error as Error };
    }
  };

  const deleteShift = async (id: string) => {
    try {
      await deleteShiftMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      console.warn('[useShifts] deleteShift failed:', error);
      return { error: error as Error };
    }
  };

  const updateShiftAttachments = async (shiftId: string, attachments: ShiftAttachment[]) => {
    try {
      await updateAttachmentsMutation.mutateAsync({ shiftId, attachments });
      return { error: null };
    } catch (error) {
      console.warn('[useShifts] updateShiftAttachments failed:', error);
      return { error: error as Error };
    }
  };

  return { shifts, loading, addShift, deleteShift, updateShiftAttachments, refetch };
}

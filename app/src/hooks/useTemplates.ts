import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';

export interface TemplateRecord {
  id: string;
  user_id: string;
  name: string;
  job: string;
  location: string;
  subjob: string | null;
  shift: string;
  created_at: string;
}

export function useTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      if (!user) return [];
      try {
        const { data, error } = await supabase
          .from('templates')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('[useTemplates] fetch error:', error.message);
          return [];
        }
        return (data || []) as TemplateRecord[];
      } catch (err) {
        console.warn('[useTemplates] fetch failed:', err);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30 * 60 * 1000, // 30 minutes — templates change rarely
  });

  const addTemplateMutation = useMutation({
    mutationFn: async (template: {
      name: string;
      job: string;
      location: string;
      subjob?: string;
      shift: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('templates')
        .insert({ ...template, user_id: user.id } as any)
        .select()
        .single();

      if (error) throw error;
      return data as TemplateRecord;
    },
    onSuccess: (newTemplate) => {
      queryClient.setQueryData(['templates', user?.id], (old: TemplateRecord[] | undefined) =>
        [newTemplate, ...(old || [])]
      );
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('templates').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['templates', user?.id] });
      queryClient.setQueryData(['templates', user?.id], (old: TemplateRecord[] | undefined) =>
        (old || []).filter(t => t.id !== id)
      );
    },
  });

  const addTemplate = async (template: {
    name: string;
    job: string;
    location: string;
    subjob?: string;
    shift: string;
  }) => {
    if (!user) return { data: null, error: new Error('Not authenticated') };
    try {
      const result = await addTemplateMutation.mutateAsync(template);
      return { data: result, error: null };
    } catch (error) {
      console.warn('[useTemplates] addTemplate failed:', error);
      return { data: null, error: error as Error };
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await deleteTemplateMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      console.warn('[useTemplates] deleteTemplate failed:', error);
      return { error: error as Error };
    }
  };

  return { templates, loading, addTemplate, deleteTemplate, refetch };
}

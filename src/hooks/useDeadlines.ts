import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Deadline = Tables<'deadlines'>;
export type DeadlineInsert = TablesInsert<'deadlines'>;
export type DeadlineUpdate = TablesUpdate<'deadlines'>;

export const useDeadlines = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deadlines', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Deadline[];
    },
    enabled: !!user,
  });
};

export const useUpcomingDeadlines = (days: number = 7) => {
  const { user } = useAuth();
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return useQuery({
    queryKey: ['deadlines', 'upcoming', user?.id, days],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', user.id)
        .gte('due_date', now.toISOString())
        .lte('due_date', futureDate.toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Deadline[];
    },
    enabled: !!user,
  });
};

export const useCreateDeadline = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (deadline: Omit<DeadlineInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('deadlines')
        .insert({ ...deadline, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast.success('Deadline created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create deadline: ' + error.message);
    },
  });
};

export const useUpdateDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: DeadlineUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('deadlines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
    },
    onError: (error) => {
      toast.error('Failed to update deadline: ' + error.message);
    },
  });
};

export const useDeleteDeadline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deadlines'] });
      toast.success('Deadline deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete deadline: ' + error.message);
    },
  });
};

// Detect conflicts - deadlines on the same day
export const detectConflicts = (deadlines: Deadline[]): Map<string, Deadline[]> => {
  const conflictMap = new Map<string, Deadline[]>();
  
  deadlines.forEach(deadline => {
    const dateKey = new Date(deadline.due_date).toDateString();
    const existing = conflictMap.get(dateKey) || [];
    existing.push(deadline);
    conflictMap.set(dateKey, existing);
  });

  // Filter to only days with multiple deadlines
  const conflicts = new Map<string, Deadline[]>();
  conflictMap.forEach((value, key) => {
    if (value.length > 1) {
      conflicts.set(key, value);
    }
  });

  return conflicts;
};

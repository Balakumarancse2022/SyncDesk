import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Meeting = Tables<'meetings'> & {
  mode?: string | null;
  meeting_link?: string | null;
};
export type MeetingInsert = TablesInsert<'meetings'>;
export type MeetingUpdate = TablesUpdate<'meetings'>;

export interface MeetingWithFiles extends Meeting {
  file_count: number;
}

export const useMeetings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['meetings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .order('meeting_date', { ascending: false });

      if (error) throw error;
      return data as Meeting[];
    },
    enabled: !!user,
  });
};

export const useUpcomingMeetings = (limit: number = 5) => {
  const { user } = useAuth();
  const now = new Date();

  return useQuery({
    queryKey: ['meetings', 'upcoming', user?.id, limit],
    queryFn: async (): Promise<MeetingWithFiles[]> => {
      if (!user) return [];
      
      const { data: meetings, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('user_id', user.id)
        .gte('meeting_date', now.toISOString())
        .order('meeting_date', { ascending: true })
        .limit(limit);

      if (error) throw error;

      const meetingsWithFiles = await Promise.all(
        (meetings || []).map(async (meeting) => {
          const { count } = await supabase
            .from('meeting_files')
            .select('*', { count: 'exact', head: true })
            .eq('meeting_id', meeting.id);

          return {
            ...meeting,
            file_count: count || 0,
          } as MeetingWithFiles;
        })
      );

      return meetingsWithFiles;
    },
    enabled: !!user,
  });
};

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (meeting: Omit<MeetingInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('meetings')
        .insert({ ...meeting, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create meeting: ' + error.message);
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...meeting }: MeetingUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('meetings')
        .update(meeting)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update meeting: ' + error.message);
    },
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (meetingId: string) => {
      // First delete associated files from storage
      const { data: files } = await supabase
        .from('meeting_files')
        .select('file_path')
        .eq('meeting_id', meetingId);

      if (files && files.length > 0) {
        await supabase.storage
          .from('meeting-files')
          .remove(files.map(f => f.file_path));

        await supabase
          .from('meeting_files')
          .delete()
          .eq('meeting_id', meetingId);
      }

      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('Meeting deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete meeting: ' + error.message);
    },
  });
};

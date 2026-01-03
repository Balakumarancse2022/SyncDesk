import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

export type MeetingFile = Tables<'meeting_files'>;

export const useMeetingFiles = (meetingId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['meeting-files', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      
      const { data, error } = await supabase
        .from('meeting_files')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MeetingFile[];
    },
    enabled: !!meetingId,
  });

  const uploadFiles = async (files: File[], targetMeetingId: string) => {
    if (!user) throw new Error('Not authenticated');

    const uploadPromises = files.map(async (file) => {
      const filePath = `${user.id}/${targetMeetingId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('meeting-files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('meeting_files')
        .insert({
          meeting_id: targetMeetingId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;
    });

    await Promise.all(uploadPromises);
    queryClient.invalidateQueries({ queryKey: ['meeting-files', targetMeetingId] });
    queryClient.invalidateQueries({ queryKey: ['meetings'] });
    toast.success(`${files.length} file(s) uploaded successfully`);
  };

  const deleteFile = useMutation({
    mutationFn: async (file: MeetingFile) => {
      const { error: storageError } = await supabase.storage
        .from('meeting-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('meeting_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-files', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('File deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete file: ' + error.message);
    },
  });

  const getFileUrl = (filePath: string) => {
    const { data } = supabase.storage
      .from('meeting-files')
      .getPublicUrl(filePath);
    return data.publicUrl;
  };

  const downloadFile = async (file: MeetingFile) => {
    const { data, error } = await supabase.storage
      .from('meeting-files')
      .download(file.file_path);

    if (error) {
      toast.error('Failed to download file');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.file_name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return {
    files: query.data || [],
    isLoading: query.isLoading,
    uploadFiles,
    deleteFile,
    getFileUrl,
    downloadFile,
  };
};

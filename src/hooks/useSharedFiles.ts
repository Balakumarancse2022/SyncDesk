import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type SharedFile = Tables<'shared_files'>;
export type FileChange = Tables<'file_changes'>;
export type SharedFileInsert = TablesInsert<'shared_files'>;

export const useSharedFiles = () => {
  return useQuery({
    queryKey: ['shared-files'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('shared_files')
        .select('*')
        .order('last_modified_at', { ascending: false });

      if (error) throw error;
      return data as SharedFile[];
    },
  });
};

export const useFileChanges = (fileId: string) => {
  return useQuery({
    queryKey: ['file-changes', fileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_changes')
        .select('*')
        .eq('shared_file_id', fileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FileChange[];
    },
    enabled: !!fileId,
  });
};

export const useUploadSharedFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, description }: { file: File; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload file to storage
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meeting-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create shared file record
      const { data: fileRecord, error: fileError } = await supabase
        .from('shared_files')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: uploadData.path,
          last_modified_by: user.id,
          version: 1,
        })
        .select()
        .single();

      if (fileError) throw fileError;

      // Log the upload
      await supabase.from('file_changes').insert({
        shared_file_id: fileRecord.id,
        changed_by: user.id,
        change_type: 'upload',
        change_description: description || `Uploaded ${file.name}`,
      });

      return fileRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-files'] });
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload file: ' + error.message);
    },
  });
};

export const useUpdateSharedFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      fileId, 
      file, 
      description 
    }: { 
      fileId: string; 
      file: File; 
      description?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get existing file record
      const { data: existingFile, error: fetchError } = await supabase
        .from('shared_files')
        .select('*')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Upload new version
      const fileName = `${user.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meeting-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Update file record with new version
      const { data: updatedFile, error: updateError } = await supabase
        .from('shared_files')
        .update({
          file_name: file.name,
          file_path: uploadData.path,
          last_modified_by: user.id,
          last_modified_at: new Date().toISOString(),
          version: (existingFile.version || 1) + 1,
        })
        .eq('id', fileId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Log the change
      await supabase.from('file_changes').insert({
        shared_file_id: fileId,
        changed_by: user.id,
        change_type: 'update',
        change_description: description || `Updated to version ${updatedFile.version}`,
      });

      return updatedFile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-files'] });
      queryClient.invalidateQueries({ queryKey: ['file-changes'] });
      toast.success('File updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update file: ' + error.message);
    },
  });
};

export const useDeleteSharedFile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fileId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get file to delete from storage
      const { data: file, error: fetchError } = await supabase
        .from('shared_files')
        .select('file_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      await supabase.storage.from('meeting-files').remove([file.file_path]);

      // Delete file record (will cascade delete file_changes due to FK)
      const { error: deleteError } = await supabase
        .from('shared_files')
        .delete()
        .eq('id', fileId);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-files'] });
      toast.success('File deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete file: ' + error.message);
    },
  });
};

export const useDownloadSharedFile = () => {
  return useMutation({
    mutationFn: async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('meeting-files')
        .download(filePath);

      if (error) throw error;
      return data;
    },
    onError: (error) => {
      toast.error('Failed to download file: ' + error.message);
    },
  });
};

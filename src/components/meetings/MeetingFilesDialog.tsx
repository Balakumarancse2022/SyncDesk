import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMeetingFiles, type MeetingFile } from '@/hooks/useMeetingFiles';
import { FileText, Download, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface MeetingFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meetingId: string;
  meetingTitle: string;
}

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (fileType: string | null) => {
  if (!fileType) return FileText;
  if (fileType.includes('pdf')) return FileText;
  if (fileType.includes('image')) return FileText;
  if (fileType.includes('spreadsheet') || fileType.includes('excel')) return FileText;
  return FileText;
};

const MeetingFilesDialog: React.FC<MeetingFilesDialogProps> = ({
  open,
  onOpenChange,
  meetingId,
  meetingTitle,
}) => {
  const { files, isLoading, deleteFile, downloadFile, getFileUrl } = useMeetingFiles(meetingId);

  const handleOpenFile = (file: MeetingFile) => {
    const url = getFileUrl(file.file_path);
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Files for: {meetingTitle}</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No files attached to this meeting yet.
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => {
              const Icon = getFileIcon(file.file_type);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.file_size)} • {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenFile(file)}
                      title="Open file"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadFile(file)}
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFile.mutate(file)}
                      disabled={deleteFile.isPending}
                      title="Delete file"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MeetingFilesDialog;

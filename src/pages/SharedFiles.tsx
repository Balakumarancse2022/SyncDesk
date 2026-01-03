import React, { useState } from 'react';
import { 
  FolderOpen, Upload, Download, Trash2, History, FileText, 
  Clock, User, RefreshCw, Eye, MoreVertical, Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import FileUpload from '@/components/ui/file-upload';
import { 
  useSharedFiles, 
  useFileChanges, 
  useUploadSharedFile, 
  useUpdateSharedFile,
  useDeleteSharedFile,
  useDownloadSharedFile,
  type SharedFile 
} from '@/hooks/useSharedFiles';
import { cn } from '@/lib/utils';

const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return '📄';
    case 'doc':
    case 'docx': return '📝';
    case 'xls':
    case 'xlsx': return '📊';
    case 'ppt':
    case 'pptx': return '📽️';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return '🖼️';
    case 'zip':
    case 'rar': return '📦';
    default: return '📁';
  }
};

const FileHistorySheet: React.FC<{ file: SharedFile | null; onClose: () => void }> = ({ file, onClose }) => {
  const { data: changes = [], isLoading } = useFileChanges(file?.id || '');

  return (
    <Sheet open={!!file} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Change History
          </SheetTitle>
          <SheetDescription>
            {file?.file_name} - Version {file?.version || 1}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-150px)] mt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          ) : changes.length > 0 ? (
            <div className="space-y-4">
              {changes.map((change, index) => (
                <div 
                  key={change.id} 
                  className={cn(
                    'relative pl-6 pb-4',
                    index !== changes.length - 1 && 'border-l-2 border-border ml-2'
                  )}
                >
                  <div className="absolute left-0 top-0 w-4 h-4 rounded-full bg-primary -translate-x-[7px]" />
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={change.change_type === 'upload' ? 'default' : 'secondary'}>
                        {change.change_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(change.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm">{change.change_description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No change history available</p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

const SharedFiles = () => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyFile, setHistoryFile] = useState<SharedFile | null>(null);
  const [selectedFile, setSelectedFile] = useState<SharedFile | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');

  const { data: files = [], isLoading, refetch } = useSharedFiles();
  const uploadFile = useUploadSharedFile();
  const updateFile = useUpdateSharedFile();
  const deleteFile = useDeleteSharedFile();
  const downloadFile = useDownloadSharedFile();

  const handleUpload = async () => {
    if (newFiles.length > 0) {
      await uploadFile.mutateAsync({ file: newFiles[0], description });
      setNewFiles([]);
      setDescription('');
      setUploadDialogOpen(false);
    }
  };

  const handleUpdate = async () => {
    if (selectedFile && newFiles.length > 0) {
      await updateFile.mutateAsync({ 
        fileId: selectedFile.id, 
        file: newFiles[0], 
        description 
      });
      setNewFiles([]);
      setDescription('');
      setSelectedFile(null);
      setUpdateDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    if (selectedFile) {
      await deleteFile.mutateAsync(selectedFile.id);
      setSelectedFile(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleDownload = async (file: SharedFile) => {
    const blob = await downloadFile.mutateAsync(file.file_path);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shared Files</h1>
          <p className="text-muted-foreground mt-1">Centralized file storage with version control and change tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Upload New File
                </DialogTitle>
                <DialogDescription>
                  Upload a file to share with your team. Changes will be tracked.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <FileUpload 
                  onUpload={(files) => setNewFiles(files)} 
                  maxFiles={1}
                />
                {newFiles.length > 0 && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="font-medium">{newFiles[0].name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(newFiles[0].size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes about this file..."
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={newFiles.length === 0 || uploadFile.isPending}
                    className="gradient-primary text-primary-foreground"
                  >
                    {uploadFile.isPending ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Files Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="hover:shadow-lg transition-all hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{getFileIcon(file.file_name)}</div>
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate">{file.file_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">v{file.version || 1}</Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setSelectedFile(file);
                        setUpdateDialogOpen(true);
                      }}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Update Version
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setHistoryFile(file)}>
                        <History className="w-4 h-4 mr-2" />
                        View History
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedFile(file);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Modified {format(new Date(file.last_modified_at || file.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>You</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-16">
          <CardContent className="text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No shared files yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload your first file to start sharing and tracking changes
            </p>
            <Button onClick={() => setUploadDialogOpen(true)} className="gradient-primary text-primary-foreground">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Update Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Update File Version
            </DialogTitle>
            <DialogDescription>
              Upload a new version of {selectedFile?.file_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <FileUpload 
              onUpload={(files) => setNewFiles(files)} 
              maxFiles={1}
            />
            {newFiles.length > 0 && (
              <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-medium">{newFiles[0].name}</p>
                <p className="text-sm text-muted-foreground">
                  {(newFiles[0].size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Change description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What changed in this version?"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={newFiles.length === 0 || updateFile.isPending}
                className="gradient-primary text-primary-foreground"
              >
                {updateFile.isPending ? 'Updating...' : 'Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedFile?.file_name}" and all its version history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History Sheet */}
      <FileHistorySheet file={historyFile} onClose={() => setHistoryFile(null)} />
    </div>
  );
};

export default SharedFiles;

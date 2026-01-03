import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface FileUploadProps {
  onUpload: (files: File[]) => void | Promise<void>;
  accept?: Record<string, string[]>;
  maxSize?: number;
  maxFiles?: number;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = 5,
  className,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setFiles(prev => [...prev, ...newFiles]);
    setIsUploading(true);

    try {
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setFiles(prev => 
          prev.map(f => 
            newFiles.some(nf => nf.file.name === f.file.name)
              ? { ...f, progress: Math.min(i, 90) }
              : f
          )
        );
      }

      await onUpload(acceptedFiles);

      setFiles(prev =>
        prev.map(f =>
          newFiles.some(nf => nf.file.name === f.file.name)
            ? { ...f, progress: 100, status: 'success' as const }
            : f
        )
      );
    } catch (error) {
      setFiles(prev =>
        prev.map(f =>
          newFiles.some(nf => nf.file.name === f.file.name)
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
  });

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isDragActive ? 'bg-primary/10' : 'bg-muted'
          )}>
            <Upload className={cn(
              'w-6 h-6 transition-colors',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <div>
            <p className="font-medium">
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse (max {formatFileSize(maxSize)})
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile) => (
            <div
              key={uploadedFile.file.name}
              className="flex items-center gap-3 p-3 bg-card border rounded-lg"
            >
              <div className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                uploadedFile.status === 'success' ? 'bg-success/10' :
                uploadedFile.status === 'error' ? 'bg-destructive/10' : 'bg-muted'
              )}>
                {uploadedFile.status === 'uploading' ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : uploadedFile.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : uploadedFile.status === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                ) : (
                  <File className="w-5 h-5 text-muted-foreground" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{uploadedFile.file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
                {uploadedFile.status === 'uploading' && (
                  <Progress value={uploadedFile.progress} className="h-1 mt-2" />
                )}
                {uploadedFile.error && (
                  <p className="text-sm text-destructive mt-1">{uploadedFile.error}</p>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => removeFile(uploadedFile.file.name)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

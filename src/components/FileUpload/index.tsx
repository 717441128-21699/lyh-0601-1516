import { useState, useRef, useCallback, useMemo } from 'react';
import { Upload, X, File, Image, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import type { Attachment } from '@/types';

type AttachmentCategory = 'general' | 'task' | 'asset' | 'permission' | 'settlement';

interface FileUploadProps {
  category?: AttachmentCategory;
  multiple?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function isImageType(type: string): boolean {
  return type.startsWith('image/');
}

function getFileIcon(type: string) {
  if (isImageType(type)) {
    return <Image className="w-5 h-5 text-green-500" />;
  }
  if (type.includes('pdf')) {
    return <File className="w-5 h-5 text-red-500" />;
  }
  if (type.includes('sheet') || type.includes('excel')) {
    return <File className="w-5 h-5 text-green-600" />;
  }
  if (type.includes('word') || type.includes('document')) {
    return <File className="w-5 h-5 text-blue-500" />;
  }
  return <File className="w-5 h-5 text-gray-500" />;
}

export default function FileUpload({ category = 'general', multiple = true }: FileUploadProps) {
  const { attachments, currentUser, resignationForm, addAttachment, removeAttachment } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredAttachments = useMemo(() => {
    if (!resignationForm) return attachments;
    return attachments.filter(a => a.formId === resignationForm.id);
  }, [attachments, resignationForm]);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (!resignationForm) return;

    for (const file of fileArray) {
      let dataUrl: string | undefined;

      if (isImageType(file.type)) {
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      addAttachment({
        formId: resignationForm.id,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedBy: currentUser.id,
        dataUrl,
      });
    }
  }, [resignationForm, currentUser.id, addAttachment]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string) => {
    removeAttachment(id);
  };

  const handlePreview = (attachment: Attachment) => {
    if (attachment.dataUrl) {
      setPreviewUrl(attachment.dataUrl);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
            isDragging ? 'bg-blue-100' : 'bg-gray-100'
          )}>
            <Upload className={cn(
              'w-6 h-6 transition-colors',
              isDragging ? 'text-blue-500' : 'text-gray-400'
            )} />
          </div>
          <div>
            <p className={cn(
              'text-sm font-medium',
              isDragging ? 'text-blue-600' : 'text-gray-700'
            )}>
              {isDragging ? '释放以上传文件' : '点击或拖拽文件到此处'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              支持图片、PDF、文档等格式{multiple ? '，可多选' : ''}
            </p>
          </div>
        </div>
      </div>

      {filteredAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">
            已上传文件 ({filteredAttachments.length})
          </p>
          <div className="space-y-2">
            {filteredAttachments.map((attachment: Attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group"
              >
                {attachment.dataUrl ? (
                  <img
                    src={attachment.dataUrl}
                    alt={attachment.name}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {getFileIcon(attachment.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {attachment.dataUrl && (
                    <button
                      onClick={() => handlePreview(attachment)}
                      className="p-1.5 rounded-md text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      title="预览"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(attachment.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    title="删除"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewUrl}
              alt="预览"
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

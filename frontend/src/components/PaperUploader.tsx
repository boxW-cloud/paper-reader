import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaperUploaderProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  isAnalyzing: boolean;
}

export function PaperUploader({ onFileSelect, onFileRemove, selectedFile, isAnalyzing }: PaperUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDropAccepted: () => setIsDragOver(false),
    onDropRejected: () => setIsDragOver(false),
  });

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-500" />
          <div>
            <p className="font-medium text-gray-900">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        {!isAnalyzing && (
          <button
            onClick={onFileRemove}
            className="p-2 hover:bg-red-100 rounded-full transition-colors"
            title="移除文件"
          >
            <X className="w-5 h-5 text-red-500" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300',
        isDragOver
          ? 'border-blue-500 bg-blue-50 scale-105'
          : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
        isAnalyzing && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} disabled={isAnalyzing} />
      <div className="flex flex-col items-center gap-4">
        <div className={cn(
          'p-4 rounded-full transition-colors',
          isDragOver ? 'bg-blue-100' : 'bg-gray-100'
        )}>
          <Upload className={cn(
            'w-8 h-8',
            isDragOver ? 'text-blue-500' : 'text-gray-400'
          )} />
        </div>
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isDragOver ? '释放以上传论文' : '拖拽 PDF 论文到此处'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            或点击选择文件
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <FileText className="w-4 h-4" />
          <span>支持 PDF 格式</span>
        </div>
      </div>
      {isAnalyzing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-gray-600 font-medium">正在解析论文...</p>
          </div>
        </div>
      )}
    </div>
  );
}

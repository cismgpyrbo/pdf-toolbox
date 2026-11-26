import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';

interface PDFUploaderProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({ onFileUpload, isLoading }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isLoading
  });

  return (
    <div
      {...getRootProps()}
      className={`
        flex flex-col items-center justify-center w-full h-96 
        border-2 border-dashed rounded-xl cursor-pointer
        transition-all duration-300 ease-in-out
        ${isDragActive 
          ? 'border-blue-500 bg-blue-50 scale-105' 
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center space-y-4">
        {isLoading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        ) : (
          <div className="relative">
            <FileText className="w-16 h-16 text-gray-400" />
            <Upload className="w-6 h-6 text-blue-500 absolute -top-1 -right-1 bg-white rounded-full p-1" />
          </div>
        )}
        
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-2">
            {isLoading ? '載入PDF中...' : '上傳PDF文件'}
          </p>
          <p className="text-sm text-gray-500">
            {isDragActive
              ? '將PDF檔案拖放到這裡'
              : '拖放PDF檔案到這裡，或點擊選擇檔案'
            }
          </p>
          <p className="text-xs text-gray-400 mt-2">
            支援最大50MB的PDF檔案
          </p>
        </div>
      </div>
    </div>
  );
};
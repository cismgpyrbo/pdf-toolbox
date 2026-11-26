import React, { useCallback, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
import { PDFFile } from '../types';

interface FileUploaderProps {
  onFilesAdded: (files: PDFFile[]) => void;
  disabled?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.type !== 'application/pdf') {
        setError('僅允許PDF檔案');
        continue;
      }
      
      if (file.size > maxSize) {
        setError(`檔案 ${file.name} 太大。最大檔案大小為50MB`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    return validFiles;
  };

  const handleFiles = useCallback(async (files: FileList) => {
    setError('');
    const validFiles = validateFiles(files);
    
    if (validFiles.length === 0) return;
    
    const pdfFiles: PDFFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
    }));
    
    onFilesAdded(pdfFiles);
  }, [onFilesAdded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, [handleFiles, disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // 重置輸入值
    e.target.value = '';
  }, [handleFiles]);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
          ${isDragOver && !disabled
            ? 'border-blue-500 bg-blue-50 scale-105' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full transition-colors duration-300
            ${isDragOver && !disabled ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <Upload className={`
              w-8 h-8 transition-colors duration-300
              ${isDragOver && !disabled ? 'text-blue-600' : 'text-gray-600'}
            `} />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              將PDF檔案拖放到此處
            </h3>
            <p className="text-gray-600">
              或 <span className="text-blue-600 font-medium">瀏覽</span> 選擇檔案
            </p>
            <p className="text-sm text-gray-500">
              最大檔案大小：每個檔案50MB
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
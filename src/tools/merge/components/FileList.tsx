import React, { useEffect, useState } from 'react';
import { FileText, X, GripVertical, Eye } from 'lucide-react';
import { PDFFile } from '../types';
import { formatFileSize, getPDFPageCount } from '../utils/pdfUtils';

interface FileListProps {
  files: PDFFile[];
  onRemoveFile: (id: string) => void;
  onReorderFiles: (files: PDFFile[]) => void;
  disabled?: boolean;
}

export const FileList: React.FC<FileListProps> = ({ 
  files, 
  onRemoveFile, 
  onReorderFiles, 
  disabled 
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [filesWithPageCount, setFilesWithPageCount] = useState<PDFFile[]>(files);

  useEffect(() => {
    const updatePageCounts = async () => {
      const updatedFiles = await Promise.all(
        files.map(async (file) => {
          if (file.pages === undefined) {
            const pages = await getPDFPageCount(file.file);
            return { ...file, pages };
          }
          return file;
        })
      );
      setFilesWithPageCount(updatedFiles);
    };

    updatePageCounts();
  }, [files]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (disabled || draggedIndex === null) return;
    
    if (index !== draggedIndex) {
      const newFiles = [...filesWithPageCount];
      const draggedFile = newFiles[draggedIndex];
      newFiles.splice(draggedIndex, 1);
      newFiles.splice(index, 0, draggedFile);
      
      setFilesWithPageCount(newFiles);
      setDraggedIndex(index);
      onReorderFiles(newFiles);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          待合併檔案 ({files.length})
        </h3>
        <p className="text-sm text-gray-600">
          拖拽以重新排序
        </p>
      </div>
      
      <div className="space-y-2">
        {filesWithPageCount.map((file, index) => (
          <div
            key={file.id}
            draggable={!disabled}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`
              group flex items-center p-4 bg-white border rounded-lg shadow-sm transition-all duration-200
              ${disabled ? 'opacity-50' : 'hover:shadow-md cursor-grab active:cursor-grabbing'}
              ${draggedIndex === index ? 'opacity-50 scale-95' : ''}
            `}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {!disabled && (
                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
              
              <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {file.name}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  {file.pages !== undefined && (
                    <span className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{file.pages} 頁</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {!disabled && (
              <button
                onClick={() => onRemoveFile(file.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="移除檔案"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
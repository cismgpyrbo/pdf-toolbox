import React from 'react';
import { PDFPage } from '../types';
import { Trash2, GripVertical } from 'lucide-react';

interface PageThumbnailsProps {
  pages: PDFPage[];
  currentPageId: string | null;
  onPageSelect: (pageId: string) => void;
  onPageDelete?: (pageId: string) => void;
}

export const PageThumbnails: React.FC<PageThumbnailsProps> = ({
  pages,
  currentPageId,
  onPageSelect,
  onPageDelete
}) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          頁面 ({pages.length})
        </h3>
      </div>
      
      <div className="p-2 space-y-2">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`
              relative group cursor-pointer rounded-lg border-2 transition-all duration-200
              ${page.id === currentPageId
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => onPageSelect(page.id)}
          >
            <div className="p-3">
              <div className="relative">
                <img
                  src={page.thumbnail}
                  alt={`第 ${page.pageNumber} 頁`}
                  className="w-full h-auto rounded shadow-sm"
                />
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded" />
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-medium text-gray-600">
                  第 {page.pageNumber} 頁
                </span>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1 hover:bg-gray-200 rounded text-gray-500">
                    <GripVertical className="w-3 h-3" />
                  </button>
                  
                  {onPageDelete && pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPageDelete(page.id);
                      }}
                      className="p-1 hover:bg-red-100 rounded text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
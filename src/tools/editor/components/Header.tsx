import React from 'react';
import { FileText, Upload, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface HeaderProps {
  onNewDocument: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  isLoading?: boolean;
  documentName?: string;
  currentPage?: number;
  totalPages?: number;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNewDocument,
  onPreviousPage,
  onNextPage,
  isLoading = false,
  documentName = '未命名文件',
  currentPage = 1,
  totalPages = 1,
  canGoPrevious = false,
  canGoNext = false
}) => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">PDF編輯器</h1>
              <p className="text-xs text-gray-500">專業PDF編輯工具</p>
            </div>
          </div>
          
          <div className="h-6 w-px bg-gray-300" />
          
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <FileText className="w-4 h-4" />
            <span className="font-medium">{documentName}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Page Navigation */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
              <button
                onClick={onPreviousPage}
                disabled={!canGoPrevious}
                className={`
                  p-1 rounded transition-colors
                  ${canGoPrevious
                    ? 'hover:bg-gray-200 text-gray-700'
                    : 'text-gray-400 cursor-not-allowed'
                  }
                `}
                title="上一頁"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              
              <button
                onClick={onNextPage}
                disabled={!canGoNext}
                className={`
                  p-1 rounded transition-colors
                  ${canGoNext
                    ? 'hover:bg-gray-200 text-gray-700'
                    : 'text-gray-400 cursor-not-allowed'
                  }
                `}
                title="下一頁"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={onNewDocument}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">新文件</span>
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};
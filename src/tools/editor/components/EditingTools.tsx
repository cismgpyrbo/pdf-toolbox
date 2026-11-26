import React, { useState } from 'react';
import { MousePointer, Type, CreditCard as Edit3, Minus, Eraser, Grid3x3 as Grid3X3, Download, Undo, Redo, ZoomIn, ZoomOut } from 'lucide-react';
import { ExportDialog, type ExportMode } from './ExportDialog';

interface EditingToolsProps {
  selectedTool: 'text' | 'edit-text' | 'line' | 'eraser' | 'table';
  onToolSelect: (tool: 'text' | 'edit-text' | 'line' | 'eraser' | 'table') => void;
  onExport: (paperSize: string, mode: ExportMode) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isLoading?: boolean;
  zoom?: number;
}

export const EditingTools: React.FC<EditingToolsProps> = ({
  selectedTool,
  onToolSelect,
  onExport,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  canUndo = false,
  canRedo = false,
  isLoading = false,
  zoom = 1
}) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const tools = [
    { id: 'select', icon: MousePointer, label: '選取', description: '選取和移動元素' },
    { id: 'text', icon: Type, label: '文字', description: '新增文字元素' },
    { id: 'edit-text', icon: Edit3, label: '編輯文字', description: '編輯現有文字' },
    { id: 'line', icon: Minus, label: '線條', description: '繪製線條' },
    { id: 'table', icon: Grid3X3, label: '表格', description: '新增表格' },
    { id: 'eraser', icon: Eraser, label: '橡皮擦', description: '刪除元素' }
  ] as const;

  return (
    <div className="w-64 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          工具
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolSelect(tool.id as any)}
              className={`
                flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200
                ${selectedTool === tool.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600'
                }
              `}
              title={tool.description}
            >
              <tool.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">歷史記錄</h4>
        <div className="flex space-x-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`
              flex-1 flex items-center justify-center p-2 rounded-lg transition-colors
              ${canUndo
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Undo className="w-4 h-4 mr-1" />
            <span className="text-xs">復原</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`
              flex-1 flex items-center justify-center p-2 rounded-lg transition-colors
              ${canRedo
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            <Redo className="w-4 h-4 mr-1" />
            <span className="text-xs">重做</span>
          </button>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">檢視</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
            <span>縮放比例</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onZoomIn}
              disabled={zoom >= 3}
              className={`
                flex-1 flex items-center justify-center p-2 rounded-lg transition-colors
                ${zoom < 3
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <ZoomIn className="w-4 h-4 mr-1" />
              <span className="text-xs">放大</span>
            </button>
            <button
              onClick={onZoomOut}
              disabled={zoom <= 0.3}
              className={`
                flex-1 flex items-center justify-center p-2 rounded-lg transition-colors
                ${zoom > 0.3
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              <ZoomOut className="w-4 h-4 mr-1" />
              <span className="text-xs">縮小</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <button
          onClick={() => setShowExportDialog(true)}
          disabled={isLoading}
          className={`
            w-full flex items-center justify-center p-3 rounded-lg font-medium transition-colors
            ${isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
          `}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {isLoading ? '匯出中...' : '匯出PDF'}
        </button>
      </div>

      <ExportDialog
        isOpen={showExportDialog}
        isLoading={isLoading}
        onExport={(paperSize, mode) => {
          onExport(paperSize, mode);
          setShowExportDialog(false);
        }}
        onClose={() => setShowExportDialog(false)}
      />
    </div>
  );
};
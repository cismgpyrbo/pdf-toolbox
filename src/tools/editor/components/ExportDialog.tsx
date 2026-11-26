import React, { useState } from 'react';
import { Download, X } from 'lucide-react';

export interface PaperSize {
  label: string;
  value: string;
  width: number;
  height: number;
}

export const PAPER_SIZES: PaperSize[] = [
  { label: 'A4 (210 × 297 mm)', value: 'a4', width: 595, height: 842 },
  { label: 'A3 (297 × 420 mm)', value: 'a3', width: 842, height: 1191 },
  { label: 'A5 (148 × 210 mm)', value: 'a5', width: 420, height: 595 },
  { label: 'Letter (8.5 × 11 in)', value: 'letter', width: 612, height: 792 },
  { label: 'Legal (8.5 × 14 in)', value: 'legal', width: 612, height: 1008 },
  { label: '原始大小', value: 'original', width: 0, height: 0 },
];

interface ExportDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  onExport: (paperSize: string) => void;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  isLoading,
  onExport,
  onClose
}) => {
  const [selectedSize, setSelectedSize] = useState('a4');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">匯出PDF</h2>
              <p className="text-xs text-gray-500">選擇輸出格式和尺寸</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              選擇紙張尺寸
            </label>
            <div className="space-y-2">
              {PAPER_SIZES.map(size => (
                <label
                  key={size.value}
                  className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="radio"
                    name="paper-size"
                    value={size.value}
                    checked={selectedSize === size.value}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    disabled={isLoading}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="ml-3 text-sm text-gray-900 flex-1">
                    {size.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <span className="font-semibold">提示：</span> 選擇「原始大小」將保持PDF的原始尺寸。其他選項會調整至相應的紙張規格。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={() => onExport(selectedSize)}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isLoading ? '匯出中...' : '匯出'}
          </button>
        </div>
      </div>
    </div>
  );
};

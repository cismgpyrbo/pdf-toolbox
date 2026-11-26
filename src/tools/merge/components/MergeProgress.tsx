import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';
import { MergeProgress as MergeProgressType } from '../types';

interface MergeProgressProps {
  progress: MergeProgressType;
}

export const MergeProgress: React.FC<MergeProgressProps> = ({ progress }) => {
  if (!progress.isProcessing) return null;

  const isComplete = progress.progress >= 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            {isComplete ? (
              <CheckCircle className="w-16 h-16 text-green-600" />
            ) : (
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {isComplete ? '合併完成！' : '正在合併PDF...'}
            </h3>
            <p className="text-gray-600">
              {isComplete ? '您的PDF已成功合併' : progress.currentFile}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              {Math.round(progress.progress)}% 完成
            </p>
          </div>
          
          {!isComplete && (
            <p className="text-sm text-gray-500">
              正在處理 {progress.totalFiles} 個檔案...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
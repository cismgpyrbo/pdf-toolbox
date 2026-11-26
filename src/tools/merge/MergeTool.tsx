import React, { useState, useCallback } from 'react';
import { Download, FileText, Zap, Shield, Globe } from 'lucide-react';
import { FileUploader } from './components/FileUploader';
import { FileList } from './components/FileList';
import { MergeProgress } from './components/MergeProgress';
import { PDFFile, MergeProgress as MergeProgressType } from './types';
import { mergePDFs, downloadBlob } from './utils/pdfUtils';

export default function MergeTool() {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [mergeProgress, setMergeProgress] = useState<MergeProgressType>({
    isProcessing: false,
    currentFile: '',
    progress: 0,
    totalFiles: 0,
  });

  const handleFilesAdded = useCallback((newFiles: PDFFile[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const handleReorderFiles = useCallback((reorderedFiles: PDFFile[]) => {
    setFiles(reorderedFiles);
  }, []);

  const handleMergePDFs = useCallback(async () => {
    if (files.length < 2) return;

    setMergeProgress({
      isProcessing: true,
      currentFile: '',
      progress: 0,
      totalFiles: files.length,
    });

    try {
      const mergedPdfBytes = await mergePDFs(files, (progress, currentFile) => {
        setMergeProgress(prev => ({
          ...prev,
          progress,
          currentFile,
        }));
      });

      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      downloadBlob(blob, `合併PDF-${timestamp}.pdf`);

      // 保持進度視窗顯示一段時間以顯示完成狀態
      setTimeout(() => {
        setMergeProgress({
          isProcessing: false,
          currentFile: '',
          progress: 0,
          totalFiles: 0,
        });
        setFiles([]);
      }, 2000);

    } catch (error) {
      console.error('合併PDF時發生錯誤:', error);
      setMergeProgress({
        isProcessing: false,
        currentFile: '',
        progress: 0,
        totalFiles: 0,
      });
      alert('合併PDF時發生錯誤，請重試。');
    }
  }, [files]);

  const features = [
    {
      icon: Zap,
      title: '快速處理',
      description: '使用優化的處理引擎快速合併PDF檔案'
    },
    {
      icon: Shield,
      title: '安全隱私',
      description: '所有處理都在您的瀏覽器中進行 - 檔案不會離開您的裝置'
    },
    {
      icon: Globe,
      title: '隨處可用',
      description: '無需安裝 - 在任何具有現代瀏覽器的裝置上都能使用'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* 標題列 */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF合併工具</h1>
              <p className="text-gray-600">將多個PDF檔案合併為一個文件</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* 上傳區域 */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  上傳您的PDF檔案
                </h2>
                <p className="text-gray-600">
                  新增多個PDF檔案以將它們合併為單一文件
                </p>
              </div>
              
              <FileUploader 
                onFilesAdded={handleFilesAdded}
                disabled={mergeProgress.isProcessing}
              />
            </div>
          </div>

          {/* 檔案清單區域 */}
          {files.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <FileList
                files={files}
                onRemoveFile={handleRemoveFile}
                onReorderFiles={handleReorderFiles}
                disabled={mergeProgress.isProcessing}
              />
              
              {files.length >= 2 && (
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={handleMergePDFs}
                    disabled={mergeProgress.isProcessing}
                    className="
                      inline-flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white font-medium rounded-xl
                      hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
                      shadow-lg hover:shadow-xl transform hover:scale-105
                    "
                  >
                    <Download className="w-5 h-5" />
                    <span>合併並下載PDF</span>
                  </button>
                </div>
              )}
              
              {files.length === 1 && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-center">
                    請至少再新增一個PDF檔案以啟用合併功能
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 功能特色區域 */}
          {files.length === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="space-y-4">
                    <div className="p-3 bg-blue-100 rounded-lg w-fit">
                      <feature.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 頁尾 */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>安全的PDF合併 - 所有處理都在您的瀏覽器本地進行</p>
          </div>
        </div>
      </footer>

      {/* 進度視窗 */}
      <MergeProgress progress={mergeProgress} />
    </div>
  );
}


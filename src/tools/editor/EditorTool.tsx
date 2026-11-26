import React, { useState } from 'react';
import { usePDFEditor } from './hooks/usePDFEditor';
import { PDFUploader } from './components/PDFUploader';
import { Header } from './components/Header';
import { PageThumbnails } from './components/PageThumbnails';
import { EditingCanvas } from './components/EditingCanvas';
import { EditingTools } from './components/EditingTools';

export default function EditorTool() {
  const { state, actions } = usePDFEditor();
  const [showUploader, setShowUploader] = useState(true);

  const handleFileUpload = (file: File) => {
    actions.loadPDF(file);
    setShowUploader(false);
  };

  const handleNewDocument = () => {
    setShowUploader(true);
  };

  const currentPage = state.pages.find(page => page.id === state.currentPageId);
  const currentPageIndex = state.pages.findIndex(page => page.id === state.currentPageId);

  if (showUploader || state.pages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header 
          onNewDocument={handleNewDocument}
          isLoading={state.isLoading}
        />
        
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-2xl w-full">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                專業PDF編輯器
              </h2>
              <p className="text-lg text-gray-600 mb-2">
                輕鬆編輯、註釋和增強您的PDF文件
              </p>
              <p className="text-sm text-gray-500">
                無需註冊 • 注重隱私 • 完全在瀏覽器中運行
              </p>
            </div>
            
            <PDFUploader 
              onFileUpload={handleFileUpload}
              isLoading={state.isLoading}
            />
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div className="p-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✏️</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">文字編輯</h3>
                <p className="text-sm text-gray-600">新增、修改和刪除文字，具有完整的格式控制</p>
              </div>
              
              <div className="p-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">編輯文字</h3>
                <p className="text-sm text-gray-600">直接編輯現有的文字內容</p>
              </div>
              
              <div className="p-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📏</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">線條繪製</h3>
                <p className="text-sm text-gray-600">繪製各種線條和形狀</p>
              </div>
              
              <div className="p-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🧹</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">橡皮擦</h3>
                <p className="text-sm text-gray-600">輕鬆刪除不需要的元素</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onNewDocument={handleNewDocument}
        onPreviousPage={actions.goToPreviousPage}
        onNextPage={actions.goToNextPage}
        isLoading={state.isLoading}
        currentPage={currentPageIndex + 1}
        totalPages={state.pages.length}
        canGoPrevious={currentPageIndex > 0}
        canGoNext={currentPageIndex < state.pages.length - 1}
      />
      
      <div className="flex-1 flex">
        <PageThumbnails
          pages={state.pages}
          currentPageId={state.currentPageId}
          onPageSelect={actions.setCurrentPage}
        />
        
        {currentPage && (
          <EditingCanvas
            page={currentPage}
            textElements={state.textElements[currentPage.id] || []}
            imageElements={state.imageElements[currentPage.id] || []}
            lineElements={state.lineElements[currentPage.id] || []}
            tableElements={state.tableElements[currentPage.id] || []}
            selectedTool={state.selectedTool}
            zoom={state.zoom}
            onAddText={(x, y) => actions.addTextElement(currentPage.id, x, y)}
            onUpdateText={(elementId, updates) => actions.updateTextElement(currentPage.id, elementId, updates)}
            onDeleteText={(elementId) => actions.deleteTextElement(currentPage.id, elementId)}
            onAddImage={(file, x, y) => actions.addImageElement(currentPage.id, file, x, y)}
            onUpdateImage={(elementId, updates) => actions.updateImageElement(currentPage.id, elementId, updates)}
            onDeleteImage={(elementId) => actions.deleteImageElement(currentPage.id, elementId)}
            onAddLine={(startX, startY, endX, endY) => actions.addLineElement(currentPage.id, startX, startY, endX, endY)}
            onDeleteLine={(elementId) => actions.deleteLineElement(currentPage.id, elementId)}
            onAddTable={(x, y) => actions.addTableElement(currentPage.id, x, y)}
            onUpdateTable={(elementId, updates) => actions.updateTableElement(currentPage.id, elementId, updates)}
            onDeleteTable={(elementId) => actions.deleteTableElement(currentPage.id, elementId)}
            onErase={(x, y) => actions.eraseElement(currentPage.id, x, y)}
          />
        )}
        
        <EditingTools
          selectedTool={state.selectedTool}
          onToolSelect={actions.setSelectedTool}
          onExport={(paperSize) => actions.exportPDF(paperSize)}
          onUndo={actions.undo}
          onRedo={actions.redo}
          onZoomIn={actions.zoomIn}
          onZoomOut={actions.zoomOut}
          canUndo={state.historyIndex >= 0}
          canRedo={state.historyIndex < state.history.length - 1}
          isLoading={state.isLoading}
          zoom={state.zoom}
        />
      </div>
    </div>
  );
}


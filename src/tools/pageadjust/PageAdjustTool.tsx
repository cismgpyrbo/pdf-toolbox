
import { useState } from "react"
import { Grid2x2 as Grid, List, Download } from "lucide-react"
import { Button } from "@/components/ui"
import { Card, CardContent } from "@/components/ui"
import { toast } from "@/components/toast"
import { PDFUploader } from "./components/pdf-uploader"
import { PDFPageGridVirtualized } from "./components/pdf-page-grid-virtualized"
import { PDFControls } from "./components/pdf-controls"
import { StatsDisplay } from "./components/stats-display"
import { LoadingSpinner } from "./components/loading-spinner"
import { usePDFProcessor } from "./hooks/use-pdf-processor"

export default function PageAdjustTool() {
  const {
    pdfPages,
    selectedPages,
    loadedFiles,
    isLoading,
    handleFiles,
    togglePageSelection,
    selectAll,
    deselectAll,
    selectRange,
    rotatePage,
    rotateSelected,
    deletePage,
    deleteSelected,
    reorderPages,
    exportPDF,
  } = usePDFProcessor()

  const [currentView, setCurrentView] = useState<"grid" | "horizontal">("grid")
  const [exportName, setExportName] = useState("reordered.pdf")
  const [rangeStart, setRangeStart] = useState("")
  const [rangeEnd, setRangeEnd] = useState("")

  const handleSelectRange = () => {
    const start = Number.parseInt(rangeStart)
    const end = Number.parseInt(rangeEnd)

    if (start && end && start <= end && start >= 1 && end <= pdfPages.length) {
      selectRange(start, end)
      toast({
        title: "範圍已選取",
        description: `已選取頁面 ${start} 到 ${end}`,
      })
    } else {
      toast({
        title: "錯誤",
        description: "無效的頁碼範圍",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    if (pdfPages.length === 0) {
      toast({
        title: "錯誤",
        description: "沒有頁面可以匯出",
        variant: "destructive",
      })
      return
    }

    try {
      await exportPDF(exportName)
      toast({
        title: "匯出成功",
        description: `PDF已成功匯出：${exportName}`,
      })
    } catch (error) {
      toast({
        title: "匯出失敗",
        description: error instanceof Error ? error.message : "未知錯誤",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-purple-600">
          <CardContent className="p-8 text-center text-white">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">📌 PDF 頁面調整工具</h1>
            <p className="text-lg opacity-90">輕鬆調整、重新排序和編輯您的PDF頁面</p>
          </CardContent>
        </Card>

        {/* Upload Area */}
        <PDFUploader onFilesSelected={handleFiles} />

        {/* Stats */}
        <StatsDisplay totalPages={pdfPages.length} selectedPages={selectedPages.size} totalFiles={loadedFiles.length} />

        {/* Controls */}
        {pdfPages.length > 0 && (
          <PDFControls
            onSelectAll={selectAll}
            onDeselectAll={deselectAll}
            onDeleteSelected={deleteSelected}
            onRotateSelected={rotateSelected}
            onSelectRange={handleSelectRange}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onRangeStartChange={setRangeStart}
            onRangeEndChange={setRangeEnd}
            maxPages={pdfPages.length}
            exportName={exportName}
            onExportNameChange={setExportName}
            selectedCount={selectedPages.size}
          />
        )}

        {/* Pages Container */}
        {pdfPages.length > 0 && (
          <Card className="mb-8">
            <CardContent className="p-6">
              {/* View Toggle */}
              <div className="flex justify-center gap-2 mb-6">
                <Button
                  variant={currentView === "grid" ? "default" : "outline"}
                  onClick={() => setCurrentView("grid")}
                  className="flex items-center gap-2"
                >
                  <Grid className="w-4 h-4" />
                  格狀檢視
                </Button>
                <Button
                  variant={currentView === "horizontal" ? "default" : "outline"}
                  onClick={() => setCurrentView("horizontal")}
                  className="flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  水平檢視
                </Button>
              </div>

              {/* Loading */}
              {isLoading && <LoadingSpinner />}

              {/* Pages Grid */}
              {!isLoading && (
                <PDFPageGridVirtualized
                  pages={pdfPages}
                  selectedPages={selectedPages}
                  viewMode={currentView}
                  onToggleSelection={togglePageSelection}
                  onRotatePage={rotatePage}
                  onDeletePage={deletePage}
                  onReorderPages={reorderPages}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Export Section */}
        {pdfPages.length > 0 && (
          <Card className="text-center">
            <CardContent className="p-6">
              <Button
                onClick={handleExport}
                disabled={isLoading}
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 text-lg shadow-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                匯出PDF
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

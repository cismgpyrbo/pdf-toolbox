
import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { FixedSizeGrid as Grid } from "react-window"
import { RotateCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui"
import { Card, CardContent } from "@/components/ui"
import type { PDFPageData } from "../hooks/use-pdf-processor"

const ROW_HEIGHT = 345 // 容納縮圖 + 頁碼/來源文字 + 單頁旋轉/刪除按鈕

interface PDFPageGridVirtualizedProps {
  pages: PDFPageData[]
  selectedPages: Set<number>
  viewMode: "grid" | "horizontal"
  onToggleSelection: (pageId: number) => void
  onRotatePage: (pageId: number, degrees: number) => void
  onDeletePage: (pageId: number) => void
  onReorderPages: (newOrder: number[]) => void
}

interface PageCardProps {
  page: PDFPageData
  index: number
  isSelected: boolean
  isDragging: boolean
  onToggleSelection: (pageId: number) => void
  onRotatePage: (pageId: number, degrees: number) => void
  onDeletePage: (pageId: number) => void
  onDragStart: (e: React.DragEvent, pageId: number) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, pageId: number) => void
}

function PageCard({
  page,
  index,
  isSelected,
  isDragging,
  onToggleSelection,
  onRotatePage,
  onDeletePage,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: PageCardProps) {
  const [imageError, setImageError] = useState(false)
  const sideways = page.rotation % 180 !== 0

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, page.id)}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, page.id)}
      className={`cursor-move transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
        isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""
      } ${isDragging ? "opacity-50 rotate-2" : ""}`}
      onClick={() => onToggleSelection(page.id)}
    >
      <CardContent className="p-3">
        <div className="relative flex h-44 items-center justify-center overflow-hidden">
          {imageError || !page.thumbnail ? (
            <div className="flex h-32 w-full items-center justify-center rounded-lg bg-gray-200">
              <div className="text-center text-gray-500">
                <div className="text-sm">縮圖載入失敗</div>
                <div className="mt-1 text-xs">頁面 {index + 1}</div>
              </div>
            </div>
          ) : (
            <img
              src={page.thumbnail}
              alt={`頁面 ${index + 1}`}
              className="max-h-full max-w-full rounded-lg shadow-md transition-transform"
              style={{
                transform: `rotate(${page.rotation}deg)${sideways ? ` scale(${Math.min(page.aspect, 1 / page.aspect)})` : ""}`,
              }}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
        </div>

        <div className="mt-3 text-center text-sm">
          <div className="font-bold text-blue-600">頁面 {index + 1}</div>
          <div className="text-gray-600 truncate">來源：{page.originalFile.name}</div>
          <div className="text-gray-500">原始頁碼：{page.pageNumber}</div>
        </div>

        <div className="flex justify-center gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onRotatePage(page.id, 90)
            }}
            className="p-1 h-8 w-8"
          >
            <RotateCw className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onDeletePage(page.id)
            }}
            className="p-1 h-8 w-8 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function PDFPageGridVirtualized({
  pages,
  selectedPages,
  viewMode,
  onToggleSelection,
  onRotatePage,
  onDeletePage,
  onReorderPages,
}: PDFPageGridVirtualizedProps) {
  const [draggedId, setDraggedId] = useState<number | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, pageId: number) => {
    setDraggedId(pageId)
    e.dataTransfer.effectAllowed = "move"
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: number) => {
      e.preventDefault()

      if (draggedId === null || draggedId === targetId) return

      const draggedIndex = pages.findIndex((p) => p.id === draggedId)
      const targetIndex = pages.findIndex((p) => p.id === targetId)

      if (draggedIndex === -1 || targetIndex === -1) return

      const newOrder = [...pages]
      const [draggedPage] = newOrder.splice(draggedIndex, 1)
      newOrder.splice(targetIndex, 0, draggedPage)

      onReorderPages(newOrder.map((p) => p.id))
    },
    [draggedId, pages, onReorderPages],
  )

  const columnCount = useMemo(() => {
    if (viewMode === "horizontal") return pages.length
    if (typeof window === "undefined") return 6
    const width = window.innerWidth - 40
    return Math.max(2, Math.floor(width / 200))
  }, [viewMode, pages.length])

  const rowCount = useMemo(() => {
    if (viewMode === "horizontal") return 1
    return Math.ceil(pages.length / columnCount)
  }, [viewMode, pages.length, columnCount])

  const Cell = ({ columnIndex, rowIndex, style }: { columnIndex: number; rowIndex: number; style: React.CSSProperties }) => {
    const pageIndex = rowIndex * columnCount + columnIndex
    if (pageIndex >= pages.length) return null

    const page = pages[pageIndex]
    return (
      <div style={style} className="p-2.5">
        <PageCard
          page={page}
          index={pageIndex}
          isSelected={selectedPages.has(page.id)}
          isDragging={draggedId === page.id}
          onToggleSelection={onToggleSelection}
          onRotatePage={onRotatePage}
          onDeletePage={onDeletePage}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      </div>
    )
  }

  if (pages.length === 0) return null

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={180}
      height={Math.min(800, rowCount * ROW_HEIGHT)}
      rowCount={rowCount}
      rowHeight={ROW_HEIGHT}
      width={typeof window === "undefined" ? 1200 : window.innerWidth - 40}
    >
      {Cell}
    </Grid>
  )
}

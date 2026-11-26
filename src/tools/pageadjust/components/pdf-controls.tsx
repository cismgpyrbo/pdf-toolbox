
import { RotateCw, Trash2, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui"
import { Input } from "@/components/ui"
import { Card, CardContent } from "@/components/ui"

interface PDFControlsProps {
  onSelectAll: () => void
  onDeselectAll: () => void
  onDeleteSelected: () => void
  onRotateSelected: (degrees: number) => void
  onSelectRange: () => void
  rangeStart: string
  rangeEnd: string
  onRangeStartChange: (value: string) => void
  onRangeEndChange: (value: string) => void
  maxPages: number
  exportName: string
  onExportNameChange: (value: string) => void
  selectedCount: number
}

export function PDFControls({
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onRotateSelected,
  onSelectRange,
  rangeStart,
  rangeEnd,
  onRangeStartChange,
  onRangeEndChange,
  maxPages,
  exportName,
  onExportNameChange,
  selectedCount,
}: PDFControlsProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6 space-y-4">
        {/* Selection Controls */}
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="outline" onClick={onSelectAll}>
            <CheckSquare className="w-4 h-4 mr-2" />
            全選
          </Button>
          <Button variant="outline" onClick={onDeselectAll}>
            <Square className="w-4 h-4 mr-2" />
            取消選取
          </Button>
          <Button
            variant="outline"
            onClick={onDeleteSelected}
            disabled={selectedCount === 0}
            className="text-red-600 hover:text-red-700 bg-transparent"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            刪除所選
          </Button>
          <Button variant="outline" onClick={() => onRotateSelected(90)} disabled={selectedCount === 0}>
            <RotateCw className="w-4 h-4 mr-2" />
            旋轉90°
          </Button>
          <Button variant="outline" onClick={() => onRotateSelected(180)} disabled={selectedCount === 0}>
            <RotateCw className="w-4 h-4 mr-2" />
            旋轉180°
          </Button>
          <Button variant="outline" onClick={() => onRotateSelected(270)} disabled={selectedCount === 0}>
            <RotateCw className="w-4 h-4 mr-2" />
            旋轉270°
          </Button>
        </div>

        {/* Range Selection */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium">頁碼範圍：</span>
          <Input
            type="number"
            placeholder="起始"
            min="1"
            max={maxPages}
            value={rangeStart}
            onChange={(e) => onRangeStartChange(e.target.value)}
            className="w-20"
          />
          <span>-</span>
          <Input
            type="number"
            placeholder="結束"
            min="1"
            max={maxPages}
            value={rangeEnd}
            onChange={(e) => onRangeEndChange(e.target.value)}
            className="w-20"
          />
          <Button variant="outline" onClick={onSelectRange}>
            選取範圍
          </Button>
        </div>

        {/* Export Name */}
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-sm font-medium">匯出檔名：</span>
          <Input
            value={exportName}
            onChange={(e) => onExportNameChange(e.target.value)}
            placeholder="檔案名稱"
            className="w-48"
          />
        </div>
      </CardContent>
    </Card>
  )
}

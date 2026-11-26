import { useState } from "react"
import { Button, Modal } from "@/components/ui"
import { Download, FileText, FileJson, FileSpreadsheet } from "lucide-react"
import { generateDiffReport, exportDifferencesAsJSON, exportDifferencesAsCSV, type DiffResult } from "../lib/pdf-utils"

interface ExportDialogProps {
  differences: DiffResult[]
  file1Name: string
  file2Name: string
  similarity: number
  totalPages: number
}

export function ExportDialog({ differences, file1Name, file2Name, similarity, totalPages }: ExportDialogProps) {
  const [format, setFormat] = useState<"txt" | "json" | "csv">("txt")
  const [open, setOpen] = useState(false)

  const handleExport = () => {
    const totalDifferences = differences.reduce((sum, diff) => sum + diff.changes.length, 0)
    const timestamp = new Date().toISOString().slice(0, 10)

    let content: string
    let mimeType: string
    let extension: string

    switch (format) {
      case "json":
        content = exportDifferencesAsJSON(differences, {
          file1: file1Name,
          file2: file2Name,
          similarity,
          totalPages,
          totalDifferences,
        })
        mimeType = "application/json"
        extension = "json"
        break

      case "csv":
        content = "\uFEFF" + exportDifferencesAsCSV(differences) // BOM：讓 Excel 正確顯示中文
        mimeType = "text/csv"
        extension = "csv"
        break

      case "txt":
      default:
        content = generateDiffReport(differences, {
          file1: file1Name,
          file2: file2Name,
          similarity,
          totalPages,
          totalDifferences,
        })
        mimeType = "text/plain"
        extension = "txt"
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pdf-comparison-${timestamp}.${extension}`
    a.click()
    URL.revokeObjectURL(url)

    setOpen(false)
  }

  const options = [
    { value: "txt", Icon: FileText, title: "純文字 (TXT)", desc: "易於閱讀的文字格式報告" },
    { value: "json", Icon: FileJson, title: "JSON", desc: "結構化數據格式，適合程式處理" },
    { value: "csv", Icon: FileSpreadsheet, title: "CSV", desc: "可在 Excel 或試算表中開啟" },
  ] as const

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Download className="mr-2 h-4 w-4" />
        匯出報告
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="匯出比對報告" description="選擇您想要的匯出格式">
        <div className="space-y-2 py-4">
          {options.map(({ value, Icon, title, desc }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center space-x-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
            >
              <input
                type="radio"
                name="export-format"
                value={value}
                checked={format === value}
                onChange={() => setFormat(value)}
              />
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            匯出
          </Button>
        </div>
      </Modal>
    </>
  )
}

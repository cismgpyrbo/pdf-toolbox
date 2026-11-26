
import type React from "react"

import { useCallback } from "react"
import { Upload, FileText, X } from "lucide-react"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { PDFPreview } from "./pdf-preview"

interface FileUploadProps {
  file1: File | null
  file2: File | null
  onFile1Change: (file: File | null) => void
  onFile2Change: (file: File | null) => void
  onCompare: () => void
}

export function FileUpload({ file1, file2, onFile1Change, onFile2Change, onCompare }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, fileNumber: 1 | 2) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile && droppedFile.type === "application/pdf") {
        if (fileNumber === 1) {
          onFile1Change(droppedFile)
        } else {
          onFile2Change(droppedFile)
        }
      }
    },
    [onFile1Change, onFile2Change],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, fileNumber: 1 | 2) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      if (fileNumber === 1) {
        onFile1Change(selectedFile)
      } else {
        onFile2Change(selectedFile)
      }
    }
  }

  const removeFile = (fileNumber: 1 | 2) => {
    if (fileNumber === 1) {
      onFile1Change(null)
    } else {
      onFile2Change(null)
    }
  }

  const canCompare = file1 && file2

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* File 1 Upload */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">原始文件</h3>
          {!file1 ? (
            <div
              onDrop={(e) => handleDrop(e, 1)}
              onDragOver={(e) => e.preventDefault()}
              className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-center text-sm font-medium text-foreground">拖放 PDF 文件到此處</p>
              <p className="mb-4 text-center text-xs text-muted-foreground">或</p>
              <label htmlFor="file1-input">
                <span className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
                  選擇文件
                </span>
              </label>
              <input
                id="file1-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 1)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-foreground">{file1.name}</p>
                  <p className="text-xs text-muted-foreground">{(file1.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeFile(1)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>

        {/* File 2 Upload */}
        <Card className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">比較文件</h3>
          {!file2 ? (
            <div
              onDrop={(e) => handleDrop(e, 2)}
              onDragOver={(e) => e.preventDefault()}
              className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary hover:bg-muted/50"
            >
              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-2 text-center text-sm font-medium text-foreground">拖放 PDF 文件到此處</p>
              <p className="mb-4 text-center text-xs text-muted-foreground">或</p>
              <label htmlFor="file2-input">
                <span className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md bg-secondary px-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80">
                  選擇文件
                </span>
              </label>
              <input
                id="file2-input"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e, 2)}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium text-foreground">{file2.name}</p>
                  <p className="text-xs text-muted-foreground">{(file2.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeFile(2)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {file1 && file2 && (
        <div className="space-y-4">
          <div className="border-t border-border pt-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">文件預覽</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <PDFPreview file={file1} title="原始文件" />
              <PDFPreview file={file2} title="比較文件" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <Button size="lg" onClick={onCompare} disabled={!canCompare} className="min-w-[200px]">
          開始比對
        </Button>
      </div>
    </div>
  )
}

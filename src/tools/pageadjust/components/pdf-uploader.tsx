
import type React from "react"

import { useCallback, useState } from "react"
import { Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui"
import { Card, CardContent } from "@/components/ui"

interface PDFUploaderProps {
  onFilesSelected: (files: File[]) => void
}

export function PDFUploader({ onFilesSelected }: PDFUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")

      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected],
  )

  return (
    <Card
      className={`mb-8 border-3 border-dashed transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
        isDragOver ? "border-green-500 bg-green-50" : "border-blue-400 bg-white"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <CardContent className="p-12 text-center">
        <div className="text-6xl mb-6 text-blue-500">
          <FileText className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold mb-2">拖曳PDF檔案到這裡或點擊選擇</h3>
        <p className="text-gray-600 mb-6">支援單檔或多檔上傳並自動合併</p>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3">
          <Upload className="w-5 h-5 mr-2" />
          選擇檔案
        </Button>
        <input id="fileInput" type="file" multiple accept=".pdf" className="hidden" onChange={handleFileSelect} />
      </CardContent>
    </Card>
  )
}

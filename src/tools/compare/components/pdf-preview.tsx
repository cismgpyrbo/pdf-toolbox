
import { useState, useEffect, useRef } from "react"
import { openPdf } from "@/shared/pdfjs"
import { Card } from "@/components/ui"
import { Button } from "@/components/ui"
import { Loader2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'


interface PDFPreviewProps {
  file: File
  title: string
}

export function PDFPreview({ file, title }: PDFPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfDocRef = useRef<any>(null)

  useEffect(() => {
    const loadPDF = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const pdf = await openPdf(await file.arrayBuffer())
        pdfDocRef.current = pdf
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading PDF:", err)
        setError("無法載入 PDF 文件")
        setIsLoading(false)
      }
    }

    loadPDF()
  }, [file])

  useEffect(() => {
    if (pdfDocRef.current && currentPage > 0) {
      renderPage(pdfDocRef.current, currentPage)
    }
  }, [currentPage])

  const renderPage = async (pdf: any, pageNum: number) => {
    try {
      const page = await pdf.getPage(pageNum)
      const viewport = page.getViewport({ scale: 1.2 })

      const canvas = canvasRef.current
      if (!canvas) return

      const context = canvas.getContext("2d")
      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width

      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise
    } catch (err) {
      console.error("Error rendering page:", err)
      setError("無法渲染頁面")
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-muted/30 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
          </div>
          {totalPages > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-7 w-7"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-7 w-7"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-muted/20 p-4">
        {isLoading && (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        {!isLoading && !error && (
          <div className="flex justify-center overflow-auto">
            <canvas ref={canvasRef} className="max-w-full shadow-sm" />
          </div>
        )}
      </div>
    </Card>
  )
}

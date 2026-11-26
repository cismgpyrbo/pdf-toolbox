
import { useState, useEffect, useRef } from "react"
import { openPdf } from "@/shared/pdfjs"
import { Card } from "@/components/ui"
import { Loader2 } from 'lucide-react'


interface PDFViewerProps {
  file: File
  title: string
  pageNumber: number
  highlights?: Array<{ value: string; type: string; context?: string }>
  highlightColor?: string
}

interface TextItem {
  str: string
  transform: number[]
  width: number
  height: number
}

interface TextPosition {
  text: string
  x: number
  y: number
  width: number
  height: number
}

export function PDFViewer({ file, title, pageNumber, highlights = [] }: PDFViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const renderPage = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const pdf = await openPdf(await file.arrayBuffer())

        if (pageNumber > pdf.numPages) {
          setError("頁碼超出範圍")
          setIsLoading(false)
          return
        }

        const page = await pdf.getPage(pageNumber)
        const viewport = page.getViewport({ scale: 1.5 })

        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext("2d")
        if (!context) return

        canvas.height = viewport.height
        canvas.width = viewport.width

        // Render the PDF page
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        if (highlights.length > 0) {
          const textContent = await page.getTextContent()
          const textItems = textContent.items as TextItem[]

          // Build a map of text positions
          const textPositions: TextPosition[] = textItems.map((item) => {
            const tx = item.transform[4]
            const ty = item.transform[5]
            const [x, y] = viewport.convertToViewportPoint(tx, ty)
            const width = item.width * viewport.scale
            const height = item.height * viewport.scale || 12 * viewport.scale

            return {
              text: item.str,
              x,
              y: y - height,
              width,
              height,
            }
          })

          const fullPageText = textItems.map((item) => item.str).join(" ")

          const highlightColor = "rgba(250, 204, 21, 0.5)" // Yellow highlight

          highlights.forEach((highlight) => {
            const searchText = highlight.value.trim()
            const searchContext = highlight.context?.trim()

            if (!searchText) return

            let startIndex = -1

            if (searchContext && searchContext.length > searchText.length) {
              // Find the context in the full text
              const contextIndex = fullPageText.indexOf(searchContext)
              if (contextIndex !== -1) {
                // Find the search text within the context
                const relativeIndex = searchContext.indexOf(searchText)
                if (relativeIndex !== -1) {
                  startIndex = contextIndex + relativeIndex
                }
              }
            }

            if (startIndex === -1 && searchText.length > 3) {
              startIndex = fullPageText.indexOf(searchText)
            }

            if (startIndex === -1) {
              return
            }

            const endIndex = startIndex + searchText.length

            let currentIndex = 0
            textPositions.forEach((pos) => {
              const itemStart = currentIndex
              const itemEnd = currentIndex + pos.text.length

              // Check if this item overlaps with our search range
              if (itemStart < endIndex && itemEnd > startIndex) {
                context.fillStyle = highlightColor
                context.fillRect(pos.x, pos.y, pos.width, pos.height)
              }

              currentIndex = itemEnd + 1
            })
          })
        }

        setIsLoading(false)
      } catch (err) {
        console.error("Error rendering PDF:", err)
        setError("無法載入 PDF 頁面")
        setIsLoading(false)
      }
    }

    renderPage()
  }, [file, pageNumber, highlights])

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <Card className="relative overflow-hidden bg-muted/30 p-4">
        {isLoading && (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="flex min-h-[400px] items-center justify-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        <div className="relative">
          <canvas ref={canvasRef} className="mx-auto max-w-full" />
          {highlights.length > 0 && (
            <div className="mt-2 rounded border border-border bg-card p-2">
              <p className="text-xs font-medium text-muted-foreground">此頁面有 {highlights.length} 處差異</p>
              <div className="mt-1 flex gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-3 w-3 rounded bg-yellow-400/50 border border-yellow-500"></div>
                  <span className="text-muted-foreground">差異處</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

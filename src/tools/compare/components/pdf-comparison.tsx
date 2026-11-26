
import { useState, useEffect } from "react"
import { Button } from "@/components/ui"
import { Card } from "@/components/ui"
import { PDFViewer } from "./pdf-viewer"
import { DifferencePanel } from "./difference-panel"
import { ExportDialog } from "./export-dialog"
import { ArrowLeft, Loader2, FileText } from "lucide-react"
import { extractTextFromPDF, comparePDFTexts, calculateSimilarity, type DiffResult } from "../lib/pdf-utils"

interface PDFComparisonProps {
  file1: File
  file2: File
  onReset: () => void
}

export function PDFComparison({ file1, file2, onReset }: PDFComparisonProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [differences, setDifferences] = useState<DiffResult[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [similarity, setSimilarity] = useState(100)
  const [text1, setText1] = useState<string[]>([])
  const [text2, setText2] = useState<string[]>([])

  useEffect(() => {
    const comparePDFs = async () => {
      setIsLoading(true)
      try {
        const extractedText1 = await extractTextFromPDF(file1)
        const extractedText2 = await extractTextFromPDF(file2)
        setText1(extractedText1)
        setText2(extractedText2)

        const diffs = comparePDFTexts(extractedText1, extractedText2)
        setDifferences(diffs)
        setTotalPages(Math.max(extractedText1.length, extractedText2.length))

        // Calculate overall similarity
        const allText1 = extractedText1.join(" ")
        const allText2 = extractedText2.join(" ")
        const sim = calculateSimilarity(allText1, allText2)
        setSimilarity(sim)
      } catch (error) {
        console.error("[v0] Error comparing PDFs:", error)
      } finally {
        setIsLoading(false)
      }
    }

    comparePDFs()
  }, [file1, file2])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-foreground">正在分析文件...</p>
          <p className="text-sm text-muted-foreground">這可能需要幾秒鐘</p>
        </div>
      </div>
    )
  }

  const currentDiff = differences[currentPage - 1]
  const diffCount = currentDiff?.changes.length || 0
  const totalDifferences = differences.reduce((sum, diff) => sum + diff.changes.length, 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={onReset}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex flex-wrap items-center gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                相似度: <span className="font-semibold text-foreground">{similarity}%</span>
              </span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <span className="text-sm text-muted-foreground">
              總差異: <span className="font-semibold text-foreground">{totalDifferences}</span>
            </span>
          </Card>
          <ExportDialog
            differences={differences}
            file1Name={file1.name}
            file2Name={file2.name}
            similarity={similarity}
            totalPages={totalPages}
          />
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">文件比對結果</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              上一頁
            </Button>
            <span className="text-sm text-muted-foreground">
              第 {currentPage} / {totalPages} 頁
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              下一頁
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <PDFViewer
            file={file1}
            title="原始文件"
            pageNumber={currentPage}
            highlights={currentDiff?.changes.filter((c) => c.type === "removed") || []}
            highlightColor="bg-red-100 dark:bg-red-900/30"
          />
          <PDFViewer
            file={file2}
            title="比較文件"
            pageNumber={currentPage}
            highlights={currentDiff?.changes.filter((c) => c.type === "added") || []}
            highlightColor="bg-blue-100 dark:bg-blue-900/30"
          />
        </div>

        <DifferencePanel
          differences={currentDiff?.changes || []}
          pageNumber={currentPage}
          text1={text1[currentPage - 1] || ""}
          text2={text2[currentPage - 1] || ""}
        />
      </Card>
    </div>
  )
}


import { useState } from "react"
import { FileUpload } from "./components/file-upload"
import { PDFComparison } from "./components/pdf-comparison"
import { FileText } from "lucide-react"

export default function CompareTool() {
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [isComparing, setIsComparing] = useState(false)

  const handleCompare = () => {
    if (file1 && file2) {
      setIsComparing(true)
    }
  }

  const handleReset = () => {
    setFile1(null)
    setFile2(null)
    setIsComparing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">PDF Compare</h1>
                <p className="text-sm text-muted-foreground">專業文件比對工具</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!isComparing ? (
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-3xl font-bold text-foreground">比較 PDF 文件</h2>
              <p className="text-balance text-muted-foreground">上傳兩份 PDF 文件，快速找出內容差異並高亮顯示</p>
            </div>

            <FileUpload
              file1={file1}
              file2={file2}
              onFile1Change={setFile1}
              onFile2Change={setFile2}
              onCompare={handleCompare}
            />
          </div>
        ) : (
          <PDFComparison file1={file1!} file2={file2!} onReset={handleReset} />
        )}
      </main>
    </div>
  )
}

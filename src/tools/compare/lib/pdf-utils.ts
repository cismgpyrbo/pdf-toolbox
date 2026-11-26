import { diffWords } from "diff"
import { openPdf } from "@/shared/pdfjs"

export interface DiffResult {
  pageNumber: number
  changes: Array<{
    type: "added" | "removed"
    value: string
    context?: string
  }>
}

/**
 * Extract text content from a PDF file
 * Returns an array of strings, one for each page
 */
export async function extractTextFromPDF(file: File): Promise<string[]> {
  try {
    const pdf = await openPdf(await file.arrayBuffer())
    const numPages = pdf.numPages
    const pages: string[] = []

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(" ")
      pages.push(pageText)
    }

    return pages
  } catch (error) {
    console.error("Error extracting text from PDF:", error)
    throw new Error("無法提取 PDF 文字內容")
  }
}

/**
 * Compare two arrays of page texts and return differences
 */
export function comparePDFTexts(text1: string[], text2: string[]): DiffResult[] {
  const maxPages = Math.max(text1.length, text2.length)
  const results: DiffResult[] = []

  for (let i = 0; i < maxPages; i++) {
    const page1Text = text1[i] || ""
    const page2Text = text2[i] || ""

    const diff = diffWords(page1Text, page2Text)

    const changes: Array<{
      type: "added" | "removed"
      value: string
      context?: string
    }> = []

    let pos1 = 0 // Position in text1
    let pos2 = 0 // Position in text2

    diff.forEach((part) => {
      if (part.added) {
        // For added parts, get context from text2
        const contextStart = Math.max(0, pos2 - 30)
        const contextEnd = Math.min(page2Text.length, pos2 + part.value.length + 30)
        const context = page2Text.substring(contextStart, contextEnd)

        changes.push({
          type: "added",
          value: part.value.trim(),
          context: context.trim(),
        })
        pos2 += part.value.length
      } else if (part.removed) {
        // For removed parts, get context from text1
        const contextStart = Math.max(0, pos1 - 30)
        const contextEnd = Math.min(page1Text.length, pos1 + part.value.length + 30)
        const context = page1Text.substring(contextStart, contextEnd)

        changes.push({
          type: "removed",
          value: part.value.trim(),
          context: context.trim(),
        })
        pos1 += part.value.length
      } else {
        // Unchanged text advances both positions
        pos1 += part.value.length
        pos2 += part.value.length
      }
    })

    const filteredChanges = changes.filter((change) => change.value.length > 0)

    results.push({
      pageNumber: i + 1,
      changes: filteredChanges,
    })
  }

  return results
}

/**
 * Generate a text report of differences
 */
export function generateDiffReport(
  differences: DiffResult[],
  metadata?: {
    file1: string
    file2: string
    similarity: number
    totalPages: number
    totalDifferences: number
  },
): string {
  let report = "PDF 比對報告\n"
  report += "=".repeat(60) + "\n\n"

  if (metadata) {
    report += `原始文件: ${metadata.file1}\n`
    report += `比較文件: ${metadata.file2}\n`
    report += `相似度: ${metadata.similarity}%\n`
    report += `總頁數: ${metadata.totalPages}\n`
    report += `總差異數: ${metadata.totalDifferences}\n`
    report += `生成時間: ${new Date().toLocaleString("zh-TW")}\n\n`
  }

  report += "=".repeat(60) + "\n\n"

  differences.forEach((diff) => {
    if (diff.changes.length > 0) {
      report += `第 ${diff.pageNumber} 頁 (${diff.changes.length} 處差異)\n`
      report += "-".repeat(60) + "\n"

      diff.changes.forEach((change, index) => {
        const prefix = change.type === "added" ? "[新增]" : "[刪除]"
        report += `${index + 1}. ${prefix} ${change.value}\n`
        if (change.context) {
          report += `   環境: ${change.context}\n`
        }
      })

      report += "\n"
    }
  })

  return report
}

/**
 * Export differences as JSON
 */
export function exportDifferencesAsJSON(
  differences: DiffResult[],
  metadata?: {
    file1: string
    file2: string
    similarity: number
    totalPages: number
    totalDifferences: number
  },
): string {
  const exportData = {
    metadata: {
      ...metadata,
      exportDate: new Date().toISOString(),
    },
    differences: differences.map((diff) => ({
      pageNumber: diff.pageNumber,
      changeCount: diff.changes.length,
      changes: diff.changes,
    })),
  }

  return JSON.stringify(exportData, null, 2)
}

/**
 * Export differences as CSV
 */
export function exportDifferencesAsCSV(differences: DiffResult[]): string {
  let csv = "頁碼,類型,內容,環境\n"

  differences.forEach((diff) => {
    diff.changes.forEach((change) => {
      const type = change.type === "added" ? "新增" : "刪除"
      const value = change.value.replace(/"/g, '""') // Escape quotes
      const context = change.context ? change.context.replace(/"/g, '""') : ""
      csv += `${diff.pageNumber},"${type}","${value}","${context}"\n`
    })
  })

  return csv
}

/**
 * Calculate similarity percentage between two texts
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const diff = diffWords(text1, text2)
  const totalLength = Math.max(text1.length, text2.length)

  if (totalLength === 0) return 100

  const unchangedLength = diff
    .filter((part) => !part.added && !part.removed)
    .reduce((sum, part) => sum + part.value.length, 0)

  return Math.round((unchangedLength / totalLength) * 100)
}

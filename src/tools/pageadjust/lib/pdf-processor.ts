import { PDFDocument, degrees } from "pdf-lib"
import { openPdf } from "@/shared/pdfjs"

export interface PDFProcessingResult {
  pages: Array<{
    id: number
    originalFile: File
    pageNumber: number
    thumbnail: string
    rotation: number
    aspect: number // 縮圖寬/高，旋轉預覽縮放用
  }>
  errors: string[]
}

export async function processPDFFiles(files: File[]): Promise<PDFProcessingResult> {
  const pages: PDFProcessingResult["pages"] = []
  const errors: string[] = []
  let pageId = 0

  for (const file of files) {
    try {
      const doc = await openPdf(await file.arrayBuffer())

      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        try {
          const page = await doc.getPage(pageNum)
          const viewport = page.getViewport({ scale: 0.6 })

          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            throw new Error("Failed to get canvas context")
          }

          canvas.width = Math.min(viewport.width, 1200)
          canvas.height = Math.min(viewport.height, 1600)

          await page.render({
            canvasContext: ctx,
            viewport: page.getViewport({
              scale: Math.min(canvas.width / viewport.width, canvas.height / viewport.height),
            }),
          }).promise

          const thumbnail = await new Promise<string>((resolve) => {
            canvas.toBlob(
              (blob) => resolve(blob ? URL.createObjectURL(blob) : ""),
              "image/jpeg",
              0.7,
            )
          })

          pages.push({
            id: pageId++,
            originalFile: file,
            pageNumber: pageNum,
            thumbnail,
            rotation: 0,
            aspect: canvas.width / canvas.height,
          })
        } catch (err) {
          errors.push(`Page ${pageNum} of ${file.name}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }
    } catch (err) {
      errors.push(`File ${file.name}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { pages, errors }
}

type ExportPage = { pageNumber: number; originalFile: File; rotation: number }

// 依目前的頁面順序與旋轉組出新的 PDF（只在記憶體裡，不下載）。
export async function buildPDFBytes(pages: ExportPage[], loadedFiles: File[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()

  // 以 File 物件當 key（不是檔名），避免兩個同名檔案互相覆蓋。
  const sourceDocuments = new Map<File, PDFDocument>()
  for (const file of loadedFiles) {
    sourceDocuments.set(file, await PDFDocument.load(await file.arrayBuffer()))
  }

  for (const page of pages) {
    const sourceDoc = sourceDocuments.get(page.originalFile)
    if (!sourceDoc) {
      throw new Error(`找不到來源檔案：${page.originalFile.name}`)
    }
    const [copiedPage] = await pdfDoc.copyPages(sourceDoc, [page.pageNumber - 1])

    if (page.rotation !== 0) {
      // 在原本的頁面旋轉角度上再加，而不是直接覆蓋（原本就有旋轉的 PDF 才不會被轉回去）。
      copiedPage.setRotation(degrees((copiedPage.getRotation().angle + page.rotation) % 360))
    }

    pdfDoc.addPage(copiedPage)
  }

  return pdfDoc.save()
}

export function withPdfExtension(filename: string): string {
  return filename.endsWith(".pdf") ? filename : filename + ".pdf"
}

export async function exportPDF(pages: ExportPage[], loadedFiles: File[], filename: string): Promise<void> {
  const pdfBytes = await buildPDFBytes(pages, loadedFiles)
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = withPdfExtension(filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

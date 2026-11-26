
import { useState, useCallback, useEffect } from "react"
import { toast } from "@/components/toast"

export interface PDFPageData {
  id: number
  originalFile: File
  pageNumber: number
  thumbnail: string
  rotation: number
  aspect: number
}

export function usePDFProcessor() {
  const [pdfPages, setPdfPages] = useState<PDFPageData[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())
  const [loadedFiles, setLoadedFiles] = useState<File[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    return () => {
      thumbnailUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url)
        }
      })
    }
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    if (typeof window === "undefined") {
      console.error("[usePDFProcessor] Not in browser")
      return
    }

    console.log("[usePDFProcessor] Processing", files.length, "files")
    setIsLoading(true)
    setLoadedFiles(files)

    try {
      // Dynamically import the PDF processor to avoid server-side dependencies
      const { processPDFFiles } = await import("../lib/pdf-processor")
      console.log("[usePDFProcessor] PDF processor imported")

      const result = await processPDFFiles(files)

      if (result.errors.length > 0) {
        console.warn("[usePDFProcessor] Errors during processing:", result.errors)
        result.errors.forEach((error) => {
          toast({
            title: "處理警告",
            description: error,
            variant: "destructive",
          })
        })
      }

      setPdfPages(result.pages)

      // Build thumbnail URL map
      const urlMap = new Map<number, string>()
      result.pages.forEach((page) => {
        if (page.thumbnail) {
          urlMap.set(page.id, page.thumbnail)
        }
      })
      setThumbnailUrls(urlMap)
      setSelectedPages(new Set())

      if (result.pages.length > 0) {
        toast({
          title: "載入成功",
          description: `成功載入 ${files.length} 個檔案，共 ${result.pages.length} 頁`,
        })
      } else {
        toast({
          title: "載入失敗",
          description: "沒有成功處理任何頁面，請檢查 PDF 檔案是否有效",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[usePDFProcessor] Error:", error)
      const message = error instanceof Error ? error.message : String(error)
      toast({
        title: "載入失敗",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const togglePageSelection = useCallback((pageId: number) => {
    setSelectedPages((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(pageId)) {
        newSet.delete(pageId)
      } else {
        newSet.add(pageId)
      }
      return newSet
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedPages(new Set(pdfPages.map((page) => page.id)))
  }, [pdfPages])

  const deselectAll = useCallback(() => {
    setSelectedPages(new Set())
  }, [])

  const selectRange = useCallback(
    (start: number, end: number) => {
      const newSelected = new Set<number>()
      for (let i = start - 1; i < end && i < pdfPages.length; i++) {
        newSelected.add(pdfPages[i].id)
      }
      setSelectedPages(newSelected)
    },
    [pdfPages],
  )

  const rotatePage = useCallback((pageId: number, degrees: number) => {
    setPdfPages((prev) =>
      prev.map((page) => {
        if (page.id === pageId) {
          const newRotation = (page.rotation + degrees) % 360
          return { ...page, rotation: newRotation }
        }
        return page
      }),
    )

    toast({
      title: "旋轉完成",
      description: `頁面已旋轉 ${degrees}°`,
    })
  }, [])

  const rotateSelected = useCallback(
    async (degrees: number) => {
      if (selectedPages.size === 0) {
        toast({
          title: "錯誤",
          description: "請先選擇要旋轉的頁面",
          variant: "destructive",
        })
        return
      }

      setIsLoading(true)

      setPdfPages((prev) =>
        prev.map((page) => {
          if (selectedPages.has(page.id)) {
            return { ...page, rotation: (page.rotation + degrees) % 360 }
          }
          return page
        }),
      )

      setIsLoading(false)

      toast({
        title: "旋轉完成",
        description: `${selectedPages.size} 個頁面已旋轉 ${degrees}°`,
      })
    },
    [selectedPages],
  )

  const deletePage = useCallback((pageId: number) => {
    const url = thumbnailUrls.get(pageId)
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url)
    }

    setPdfPages((prev) => prev.filter((p) => p.id !== pageId))
    setSelectedPages((prev) => {
      const newSet = new Set(prev)
      newSet.delete(pageId)
      return newSet
    })
    setThumbnailUrls((prev) => {
      const newMap = new Map(prev)
      newMap.delete(pageId)
      return newMap
    })

    toast({
      title: "刪除完成",
      description: "頁面已刪除",
    })
  }, [thumbnailUrls])

  const deleteSelected = useCallback(() => {
    if (selectedPages.size === 0) {
      toast({
        title: "錯誤",
        description: "請先選擇要刪除的頁面",
        variant: "destructive",
      })
      return
    }

    const deletedCount = selectedPages.size

    selectedPages.forEach((pageId) => {
      const url = thumbnailUrls.get(pageId)
      if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url)
      }
    })

    setPdfPages((prev) => prev.filter((p) => !selectedPages.has(p.id)))
    setSelectedPages(new Set())

    setThumbnailUrls((prev) => {
      const newMap = new Map(prev)
      selectedPages.forEach((id) => newMap.delete(id))
      return newMap
    })

    toast({
      title: "刪除完成",
      description: `已刪除 ${deletedCount} 個頁面`,
    })
  }, [selectedPages, thumbnailUrls])

  const reorderPages = useCallback(
    (newOrder: number[]) => {
      const reorderedPages = newOrder.map((id) => pdfPages.find((page) => page.id === id)!).filter(Boolean)
      setPdfPages(reorderedPages)
    },
    [pdfPages],
  )

  const exportPDF = useCallback(
    async (filename: string) => {
      if (typeof window === "undefined") return

      if (pdfPages.length === 0) {
        throw new Error("沒有頁面可以匯出")
      }

      setIsLoading(true)

      try {
        const { exportPDF: doExport } = await import("../lib/pdf-processor")
        await doExport(pdfPages, loadedFiles, filename)
      } finally {
        setIsLoading(false)
      }
    },
    [pdfPages, loadedFiles],
  )

  // 組出目前頁面的 PDF 檔（不下載），給「送到編輯」用。
  const buildPDFFile = useCallback(
    async (filename: string): Promise<File> => {
      if (pdfPages.length === 0) {
        throw new Error("沒有頁面可以送出")
      }

      setIsLoading(true)

      try {
        const { buildPDFBytes, withPdfExtension } = await import("../lib/pdf-processor")
        const bytes = await buildPDFBytes(pdfPages, loadedFiles)
        return new File([new Uint8Array(bytes)], withPdfExtension(filename), { type: "application/pdf" })
      } finally {
        setIsLoading(false)
      }
    },
    [pdfPages, loadedFiles],
  )

  return {
    pdfPages,
    selectedPages,
    loadedFiles,
    isLoading,
    handleFiles,
    togglePageSelection,
    selectAll,
    deselectAll,
    selectRange,
    rotatePage,
    rotateSelected,
    deletePage,
    deleteSelected,
    reorderPages,
    exportPDF,
    buildPDFFile,
  }
}

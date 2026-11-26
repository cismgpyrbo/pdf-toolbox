import { createWorker, type Worker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { openPdf } from '@/shared/pdfjs';

// 辨識用的影像解析度：PDF 頁面以 3 倍（約 216 dpi）轉成圖片，太大的圖片縮到長邊 4000px 以內。
const PDF_SCALE = 3;
const MAX_SIDE = 4000;
// 圖片檔輸出成 A4 大小（長邊 842pt）。
const IMAGE_PAGE_LONG_SIDE_PT = 842;

export const ACCEPTED_IMAGE = /\.(jpe?g|png)$/i;

// worker 在 blob 裡執行，無法解析相對路徑，所以一律用絕對網址。
const asset = (path: string) => new URL(`${import.meta.env.BASE_URL}tesseract/${path}`, location.href).href;

export async function createOcrWorker(onProgress: (pct: number) => void): Promise<Worker> {
  return createWorker(['chi_tra', 'eng'], 1, {
    workerPath: asset('worker.min.js'),
    corePath: asset('core'),
    langPath: asset('lang'),
    // 不使用瀏覽器儲存空間：語言資料靠一般 HTTP 快取，重複使用時不會重新下載。
    cacheMethod: 'none',
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress(m.progress);
    },
  });
}

export interface PageImage {
  canvas: HTMLCanvasElement;
  /** 讓輸出頁面維持原本尺寸所需的 dpi（pt = px / dpi * 72）。 */
  dpi: number;
}

export async function renderPdfPages(bytes: ArrayBuffer) {
  const pdf = await openPdf(bytes);
  return {
    total: pdf.numPages,
    async render(i: number): Promise<PageImage> {
      const page = await pdf.getPage(i);
      let scale = PDF_SCALE;
      const base = page.getViewport({ scale: 1 });
      scale = Math.min(scale, MAX_SIDE / Math.max(base.width, base.height));
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
      page.cleanup();
      return { canvas, dpi: scale * 72 };
    },
    destroy: () => pdf.destroy(),
  };
}

export async function imageFileToPage(file: File): Promise<PageImage> {
  // createImageBitmap 會依 EXIF 方向轉正，避免手機照片被辨識成橫躺的。
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return { canvas, dpi: (Math.max(canvas.width, canvas.height) / IMAGE_PAGE_LONG_SIDE_PT) * 72 };
}

export async function recognizePage(worker: Worker, page: PageImage) {
  await worker.setParameters({ user_defined_dpi: String(Math.round(page.dpi)) });
  const { data } = await worker.recognize(page.canvas, {}, { pdf: true });
  if (!data.pdf) throw new Error('辨識結果沒有產生 PDF');
  return { pdf: new Uint8Array(data.pdf), confidence: data.confidence as number };
}

export async function mergePagePdfs(parts: Uint8Array[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const part of parts) {
    const src = await PDFDocument.load(part);
    (await out.copyPages(src, src.getPageIndices())).forEach((p) => out.addPage(p));
  }
  out.setProducer('PDF 工具箱 OCR');
  return out.save({ useObjectStreams: true });
}

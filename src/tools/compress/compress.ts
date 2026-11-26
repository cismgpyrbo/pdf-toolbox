import { PDFDocument } from 'pdf-lib';
import { openPdf } from '@/shared/pdfjs';

export type Mode = 'basic' | 'image';
export type Quality = 'high' | 'medium' | 'low';

export const QUALITY_PRESETS: Record<Quality, { scale: number; jpegQuality: number; label: string }> = {
  high: { scale: 1.5, jpegQuality: 0.85, label: '高畫質' },
  medium: { scale: 1.1, jpegQuality: 0.7, label: '標準' },
  low: { scale: 0.8, jpegQuality: 0.45, label: '高壓縮' },
};

export type ProgressFn = (label: string, pct: number) => void;

// 基本優化：重新整理檔案結構、移除多餘資料，文字維持可選取、可搜尋。
export async function compressBasic(bytes: ArrayBuffer, onProgress: ProgressFn): Promise<Uint8Array> {
  onProgress('重新整理檔案結構…', 50);
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  doc.setProducer('');
  doc.setCreator('');
  const saved = await doc.save({ useObjectStreams: true });
  onProgress('完成', 100);
  return saved;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) return reject(new Error('無法產生圖片（頁面可能太大）'));
        resolve(new Uint8Array(await blob.arrayBuffer()));
      },
      'image/jpeg',
      quality,
    );
  });
}

// 影像壓縮：每頁轉成 JPEG 後重組。檔案可大幅縮小，但文字無法選取或搜尋。
export async function compressImage(
  bytes: ArrayBuffer,
  preset: (typeof QUALITY_PRESETS)[Quality],
  onProgress: ProgressFn,
): Promise<Uint8Array> {
  const pdf = await openPdf(bytes);
  try {
    const out = await PDFDocument.create();
    const total = pdf.numPages;

    for (let i = 1; i <= total; i++) {
      onProgress(`正在處理第 ${i} / ${total} 頁…`, Math.round(((i - 1) / total) * 100));

      const page = await pdf.getPage(i);
      // 輸出頁面維持原本的尺寸（以 scale 1 計），只有圖片的解析度依畫質調整，
      // 這樣列印或歸檔時頁面大小不會變。
      const pageSize = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: preset.scale });

      const canvas = document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('無法建立繪圖區');

      await page.render({ canvasContext: ctx, viewport }).promise;

      const jpeg = await out.embedJpg(await canvasToJpeg(canvas, preset.jpegQuality));
      const newPage = out.addPage([pageSize.width, pageSize.height]);
      newPage.drawImage(jpeg, { x: 0, y: 0, width: pageSize.width, height: pageSize.height });

      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }

    onProgress('組合檔案中…', 100);
    return await out.save();
  } finally {
    await pdf.destroy();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// 同名檔案放進 ZIP 時加上 (2)、(3)，避免後面的蓋掉前面的。
export function uniqueName(name: string, taken: Set<string>): string {
  if (!taken.has(name)) {
    taken.add(name);
    return name;
  }
  const dot = name.lastIndexOf('.');
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let n = 2;
  while (taken.has(`${base} (${n})${ext}`)) n++;
  const unique = `${base} (${n})${ext}`;
  taken.add(unique);
  return unique;
}

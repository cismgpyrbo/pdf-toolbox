// 所有工具共用的 pdf.js 設定：worker 與 CJK 字型對照表都從本站載入，不依賴外部 CDN。
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const base = import.meta.env.BASE_URL;

export function openPdf(data: ArrayBuffer | Uint8Array) {
  return pdfjsLib.getDocument({
    data,
    cMapUrl: `${base}cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}standard_fonts/`,
  }).promise;
}

export { pdfjsLib };

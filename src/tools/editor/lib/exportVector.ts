import { PDFDocument, PDFFont, PDFImage, PDFPage, degrees, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { EditorState } from '../types';

// 向量匯出：原始頁面內容原封不動，編輯的文字、線條、表格、圖片以 PDF 向量物件疊加上去。
// 原始文字、連結、書籤、表單欄位因此都保留；只有「整頁影像化」才會把頁面轉成圖片。

export class VectorExportUnsupported extends Error {}

export interface VectorExportInput {
  original: ArrayBuffer;
  /** 各頁在畫面上的尺寸（像素，DISPLAY_SCALE 倍）。 */
  pages: { id: string; width: number; height: number }[];
  textElements: EditorState['textElements'];
  imageElements: EditorState['imageElements'];
  lineElements: EditorState['lineElements'];
  tableElements: EditorState['tableElements'];
  displayScale: number;
  paperSize: string;
  fontUrl: string;
}

const PAPER: Record<string, [number, number]> = {
  a4: [595, 842],
  a3: [842, 1191],
  a5: [420, 595],
  letter: [612, 792],
  legal: [612, 1008],
};

const hexToRgb = (hex: string) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255) : rgb(0, 0, 0);
};

async function toPdfImage(doc: PDFDocument, src: string): Promise<PDFImage | null> {
  const bytes = () => Uint8Array.from(atob(src.split(',')[1]), (c) => c.charCodeAt(0));
  if (/^data:image\/jpe?g/i.test(src)) return doc.embedJpg(bytes());
  if (/^data:image\/png/i.test(src)) return doc.embedPng(bytes());
  // 其他格式（gif、webp…）先用瀏覽器轉成 PNG。
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => resolve(null);
    i.src = src;
  });
  if (!img) return null;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext('2d')!.drawImage(img, 0, 0);
  return doc.embedPng(Uint8Array.from(atob(c.toDataURL('image/png').split(',')[1]), (ch) => ch.charCodeAt(0)));
}

/** @returns 字型沒有的字元（匯出後這些字會顯示成空白），供介面提示。 */
export async function exportVector(input: VectorExportInput): Promise<{ bytes: Uint8Array; missingChars: string[] }> {
  const { displayScale: D, paperSize } = input;
  const src = await PDFDocument.load(input.original, { ignoreEncryption: true, updateMetadata: false });
  if (src.isEncrypted) throw new VectorExportUnsupported('加密的 PDF');

  const srcPages = src.getPages();
  const keepOriginal = paperSize === 'original' || !PAPER[paperSize];
  if (!keepOriginal && srcPages.some((p) => p.getRotation().angle % 360 !== 0)) {
    throw new VectorExportUnsupported('含旋轉頁面，無法縮放到其他紙張');
  }

  // 原始大小：直接在原文件上疊加（保留書籤、連結、表單等）；其他尺寸：新文件嵌入原頁面。
  const out = keepOriginal ? src : await PDFDocument.create();
  const outPages: PDFPage[] = [];
  const scales: number[] = [];
  if (keepOriginal) {
    srcPages.forEach((p) => {
      outPages.push(p);
      scales.push(1 / D);
    });
  } else {
    const [tw, th] = PAPER[paperSize];
    for (let i = 0; i < srcPages.length; i++) {
      const ps = input.pages[i];
      const pw = ps.width / D;
      const ph = ps.height / D;
      const s = Math.min(tw / pw, th / ph);
      const embedded = await out.embedPage(srcPages[i]);
      const page = out.addPage([tw, th]);
      page.drawPage(embedded, { x: 0, y: th - ph * s, width: pw * s, height: ph * s });
      outPages.push(page);
      scales.push(s / D); // 畫面像素 → 輸出點數
    }
  }

  const hasText = input.pages.some(
    (p) =>
      (input.textElements[p.id]?.length ?? 0) > 0 ||
      (input.tableElements[p.id] ?? []).some((t) => Object.values(t.cells).some(Boolean)),
  );
  let font: PDFFont | null = null;
  const missing = new Set<string>();
  if (hasText) {
    const res = await fetch(input.fontUrl);
    if (!res.ok) throw new Error('字型檔載入失敗');
    out.registerFontkit(fontkit);
    font = await out.embedFont(new Uint8Array(await res.arrayBuffer()), { subset: true });
  }
  const charSet = font ? new Set(font.getCharacterSet()) : new Set<number>();

  for (let i = 0; i < outPages.length; i++) {
    const page = outPages[i];
    const id = input.pages[i].id;
    const k = scales[i];
    const rot = ((page.getRotation().angle % 360) + 360) % 360;
    const box = keepOriginal ? page.getCropBox() : { x: 0, y: 0, ...page.getSize() };
    const W = box.width;
    const H = box.height;
    // 畫面座標（左上為原點、向下，單位：輸出點數）→ PDF 使用者空間。
    const vis = (u: number, v: number) => {
      switch (rot) {
        case 90: return { x: box.x + v, y: box.y + u };
        case 180: return { x: box.x + W - u, y: box.y + v };
        case 270: return { x: box.x + W - v, y: box.y + H - u };
        default: return { x: box.x + u, y: box.y + H - v };
      }
    };
    const line = (x1: number, y1: number, x2: number, y2: number, color: ReturnType<typeof rgb>, thickness: number, dash?: number[]) =>
      page.drawLine({ start: vis(x1, y1), end: vis(x2, y2), color, thickness, dashArray: dash });

    // 文字：u、v 為基線左端的畫面座標（點數）。
    const drawText = (text: string, u: number, v: number, size: number, color: ReturnType<typeof rgb>, bold = false, italic = false) => {
      const clean = text.replace(/\t/g, '  ');
      for (const ch of clean) if (!charSet.has(ch.codePointAt(0)!)) missing.add(ch);
      const draw = (du: number) =>
        page.drawText(clean, {
          ...vis(u + du, v),
          size,
          font: font!,
          color,
          rotate: degrees(rot),
          xSkew: italic ? degrees(-12) : undefined,
        });
      draw(0);
      if (bold) draw(size * 0.025);
    };
    const widthOf = (t: string, size: number) => {
      try {
        return font!.widthOfTextAtSize(t.replace(/\t/g, '  '), size);
      } catch {
        return 0;
      }
    };

    // 表格（底色 → 框線 → 文字）
    for (const t of input.tableElements[id] ?? []) {
      const tx = t.x * k, ty = t.y * k, tw = t.width * k, th = t.height * k;
      const cw = tw / t.cols, ch = th / t.rows;
      const bw = t.borderWidth * k;
      const borderColor = hexToRgb(t.borderColor);
      if (t.backgroundColor && t.backgroundColor !== '#ffffff') {
        const a = vis(tx, ty), b = vis(tx + tw, ty + th);
        page.drawRectangle({
          x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
          width: Math.abs(a.x - b.x), height: Math.abs(a.y - b.y),
          color: hexToRgb(t.backgroundColor),
        });
      }
      for (let r = 0; r < t.rows; r++) {
        for (let c = 0; c < t.cols; c++) {
          const b = t.cellStyles?.[`${r}-${c}`]?.borders || { top: 'solid', bottom: 'solid', left: 'solid', right: 'solid' };
          const cx = tx + c * cw, cy = ty + r * ch;
          if (b.top && b.top !== 'none') line(cx, cy, cx + cw, cy, borderColor, bw);
          if (b.left && b.left !== 'none') line(cx, cy, cx, cy + ch, borderColor, bw);
          if (b.right && b.right !== 'none') line(cx + cw, cy, cx + cw, cy + ch, borderColor, bw);
          if (b.bottom && b.bottom !== 'none') {
            if (b.bottom === 'double-underline') {
              const off = Math.max(0.25, bw);
              line(cx, cy + ch - off, cx + cw, cy + ch - off, borderColor, bw);
              line(cx, cy + ch + off, cx + cw, cy + ch + off, borderColor, bw);
            } else {
              line(cx, cy + ch, cx + cw, cy + ch, borderColor, b.bottom === 'underline' ? bw * 2 : bw);
            }
          }
        }
      }
      for (let r = 0; r < t.rows; r++) {
        for (let c = 0; c < t.cols; c++) {
          const text = t.cells[`${r}-${c}`];
          if (!text) continue;
          const size = (t.cellStyles?.[`${r}-${c}`]?.fontSize || t.defaultFontSize || 12) * k;
          // 畫面上文字垂直置中於儲存格；基線約在中線下方 0.35 個字高。
          drawText(text, tx + c * cw + 5 * k, ty + r * ch + ch / 2 + size * 0.35, size, rgb(0, 0, 0));
        }
      }
    }

    // 線條
    for (const l of input.lineElements[id] ?? []) {
      const dash = l.style === 'dashed' ? [5 * k, 5 * k] : l.style === 'dotted' ? [2 * k, 2 * k] : undefined;
      line(l.startX * k, l.startY * k, l.endX * k, l.endY * k, hexToRgb(l.color), l.width * k, dash);
    }

    // 文字
    for (const t of input.textElements[id] ?? []) {
      const size = t.fontSize * k;
      t.text.split('\n').forEach((ln, idx) => {
        const w = widthOf(ln, size);
        let u = t.x * k;
        if (t.textAlign === 'center') u -= w / 2;
        else if (t.textAlign === 'right') u -= w;
        const v = t.y * k + size + idx * size * 1.2;
        drawText(ln, u, v, size, hexToRgb(t.color), t.fontWeight === 'bold', t.fontStyle === 'italic');
        if (t.textDecoration === 'underline') line(u, v + 2 * k, u + w, v + 2 * k, hexToRgb(t.color), Math.max(0.5, size / 16));
      });
    }

    // 圖片（可旋轉）
    for (const im of input.imageElements[id] ?? []) {
      const pdfImg = await toPdfImage(out, im.src);
      if (!pdfImg) continue;
      const w = im.width * k, h = im.height * k;
      const cx = im.x * k + w / 2, cy = im.y * k + h / 2;
      const th = (im.rotation * Math.PI) / 180;
      // 畫面上以中心順時針旋轉；先算旋轉後左下角的畫面座標。
      const dx = -w / 2, dy = h / 2;
      const u = cx + dx * Math.cos(th) - dy * Math.sin(th);
      const v = cy + dx * Math.sin(th) + dy * Math.cos(th);
      page.drawImage(pdfImg, { ...vis(u, v), width: w, height: h, rotate: degrees(rot - im.rotation) });
    }
  }

  out.setProducer('PDF 工具箱');
  return { bytes: await out.save({ useObjectStreams: true }), missingChars: [...missing] };
}

// 讓「合併」「頁面調整」把產生好的 PDF 直接交給「編輯」分頁。
// 檔案只在瀏覽器記憶體裡傳遞，不經過下載與重新上傳；重新整理網頁後就不在了。
let pending: File | null = null;
const listeners = new Set<() => void>();

export function sendToEditor(file: File) {
  pending = file;
  listeners.forEach((listener) => listener());
}

// 取走待處理的檔案（取走後就清空，避免重複載入）。
export function takePendingEditorFile(): File | null {
  const file = pending;
  pending = null;
  return file;
}

export function onEditorHandoff(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

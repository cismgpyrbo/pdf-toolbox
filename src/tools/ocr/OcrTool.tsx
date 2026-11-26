import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, X, Loader2, Trash2, Square } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatBytes } from '@/tools/compress/compress';
import {
  ACCEPTED_IMAGE,
  createOcrWorker,
  imageFileToPage,
  mergePagePdfs,
  recognizePage,
  renderPdfPages,
} from './ocr';

type Status = 'pending' | 'processing' | 'done' | 'cancelled' | 'error';

interface Item {
  id: number;
  file: File;
  status: Status;
  label: string;
  pct: number;
  confidence?: number;
  size?: number;
  url?: string;
  downloadName?: string;
  error?: string;
}

let nextId = 1;

export default function OcrTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const cancelled = useRef(false);
  const workerRef = useRef<Awaited<ReturnType<typeof createOcrWorker>> | null>(null);

  const patch = useCallback((id: number, changes: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    setItems((prev) => [
      ...prev,
      ...accepted.map<Item>((file) => ({ id: nextId++, file, status: 'pending', label: '', pct: 0 })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    multiple: true,
  });

  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));
  const clearAll = () => {
    items.forEach((it) => it.url && URL.revokeObjectURL(it.url));
    setItems([]);
  };

  const cancel = () => {
    cancelled.current = true;
    // 辨識是在背景 worker 執行，直接終止它才能立刻停下來。
    workerRef.current?.terminate().catch(() => {});
  };

  const run = async () => {
    const queue = items.filter((it) => it.status === 'pending');
    if (queue.length === 0) return;
    cancelled.current = false;
    setRunning(true);

    let current = queue[0];
    // 目前頁面內的辨識進度（0~1），由 worker 回報。
    let pageProgress = 0;
    let onPageProgress: (p: number) => void = () => {};
    try {
      queue.forEach((it) => patch(it.id, { label: '等待中', pct: 0 }));
      patch(current.id, { status: 'processing', label: '載入辨識引擎與語言資料…', pct: 1 });
      const worker = await createOcrWorker((p) => {
        pageProgress = p;
        onPageProgress(p);
      });
      workerRef.current = worker;

      for (const item of queue) {
        if (cancelled.current) break;
        current = item;
        patch(item.id, { status: 'processing', label: '讀取檔案…', pct: 2 });
        const isImage = ACCEPTED_IMAGE.test(item.file.name) || item.file.type.startsWith('image/');
        const parts: Uint8Array[] = [];
        const confs: number[] = [];
        let doc: Awaited<ReturnType<typeof renderPdfPages>> | null = null;
        try {
          let total = 1;
          if (!isImage) {
            doc = await renderPdfPages(await item.file.arrayBuffer());
            total = doc.total;
          }
          for (let i = 1; i <= total; i++) {
            if (cancelled.current) break;
            const base = ((i - 1) / total) * 100;
            const label = `辨識第 ${i} / ${total} 頁…`;
            patch(item.id, { label, pct: Math.max(2, Math.round(base)) });
            onPageProgress = (p) => patch(item.id, { label, pct: Math.round(base + (p / total) * 100) });
            pageProgress = 0;
            const page = isImage ? await imageFileToPage(item.file) : await doc!.render(i);
            const r = await recognizePage(worker, page);
            parts.push(r.pdf);
            confs.push(r.confidence);
            page.canvas.width = page.canvas.height = 0; // 釋放記憶體
          }
          if (cancelled.current) break;
          patch(item.id, { label: '組合 PDF…', pct: 99 });
          const bytes = await mergePagePdfs(parts);
          const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
          patch(item.id, {
            status: 'done',
            pct: 100,
            size: bytes.byteLength,
            url,
            confidence: confs.reduce((a, b) => a + b, 0) / confs.length,
            downloadName: item.file.name.replace(/\.(pdf|jpe?g|png)$/i, '') + '-ocr.pdf',
          });
        } catch (err) {
          if (cancelled.current) break;
          console.error(err);
          patch(item.id, { status: 'error', error: '此檔案可能已加密、已損毀，或格式不受支援。' });
        } finally {
          void doc?.destroy();
        }
      }
    } catch (err) {
      if (!cancelled.current) {
        console.error(err);
        patch(current.id, { status: 'error', error: '辨識引擎載入失敗，請重新整理頁面後再試。' });
      }
    } finally {
      void pageProgress;
      workerRef.current?.terminate().catch(() => {});
      workerRef.current = null;
      if (cancelled.current) {
        setItems((prev) =>
          prev.map((it) => (it.status === 'processing' || (it.status === 'pending' && queue.includes(it)) ? { ...it, status: 'cancelled' } : it)),
        );
      }
      setRunning(false);
    }
  };

  const pendingCount = items.filter((it) => it.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="mb-8 bg-gradient-to-r from-violet-500 to-purple-600">
          <CardContent className="p-8 text-center text-white">
            <h2 className="mb-3 text-3xl font-bold drop-shadow-lg md:text-4xl">OCR 文字辨識</h2>
            <p className="opacity-90">把掃描檔或圖片變成可搜尋、可選取文字的 PDF，在瀏覽器內完成，不會上傳。</p>
          </CardContent>
        </Card>

        <div
          {...getRootProps()}
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed bg-white p-10 text-center transition-colors',
            isDragActive ? 'border-violet-500 bg-violet-50' : 'border-gray-300 hover:border-violet-500 hover:bg-violet-50/50',
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-3 h-9 w-9 text-violet-600" />
          <p className="font-medium text-gray-900">拖曳 PDF 或圖片（JPG、PNG）到這裡，或點擊選擇檔案</p>
          <p className="mt-1 text-sm text-gray-500">辨識語言：繁體中文＋英文，可一次選取多個檔案</p>
        </div>

        {items.length > 0 && (
          <Card className="mt-6">
            <CardContent className="space-y-3 p-6">
              <p className="rounded-md bg-gray-100 p-3 text-sm text-gray-600">
                原本的畫面會保留，並在上面加上看不見的文字層，所以輸出檔會比原檔大。第一次使用需載入辨識引擎與語言資料（約 16 MB），之後通常會使用瀏覽器快取。辨識需要一些時間，頁數越多越久；結果仍可能有錯字，重要內容請再核對。
              </p>
              {running ? (
                <Button onClick={cancel} variant="outline" size="lg" className="w-full text-base">
                  <Square className="mr-2 h-4 w-4" />
                  停止辨識
                </Button>
              ) : (
                <Button
                  onClick={run}
                  disabled={pendingCount === 0}
                  size="lg"
                  className="w-full bg-violet-600 text-base hover:bg-violet-700"
                >
                  {pendingCount === 0 ? '沒有待辨識的檔案' : `開始辨識（${pendingCount} 個檔案）`}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {items.length > 0 && (
          <div className="mt-6 divide-y overflow-hidden rounded-lg border bg-white shadow-sm">
            {items.map((it) => (
              <div key={it.id} className="p-4">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1 truncate text-sm font-medium" title={it.file.name}>
                    {it.file.name}
                  </div>
                  {it.status !== 'processing' && !(running && it.status === 'pending') && (
                    <button
                      type="button"
                      onClick={() => {
                        if (it.url) URL.revokeObjectURL(it.url);
                        removeItem(it.id);
                      }}
                      className="rounded p-1 text-gray-400 hover:text-red-600"
                      aria-label={`移除 ${it.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm text-gray-500">
                  <span>{formatBytes(it.file.size)}</span>
                  {it.status === 'done' && (
                    <>
                      <span>→ {formatBytes(it.size!)}</span>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                        平均信心度 {Math.round(it.confidence!)}%
                      </span>
                    </>
                  )}
                  {it.status === 'pending' && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">等待辨識</span>}
                  {it.status === 'processing' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      處理中
                    </span>
                  )}
                  {it.status === 'cancelled' && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">已停止</span>
                  )}
                  {it.status === 'error' && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">辨識失敗</span>
                  )}
                </div>

                {it.status === 'processing' && (
                  <>
                    <div className="mt-3 h-1 overflow-hidden rounded bg-gray-100">
                      <div className="h-full bg-violet-500 transition-all" style={{ width: `${Math.min(99, it.pct)}%` }} />
                    </div>
                    <div className="mt-1.5 text-xs text-gray-500">{it.label}</div>
                  </>
                )}

                {it.status === 'error' && <p className="mt-2 text-sm text-red-700">{it.error}</p>}

                {it.status === 'done' && (
                  <a
                    href={it.url}
                    download={it.downloadName}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    下載可搜尋的 PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={clearAll} disabled={running}>
              <Trash2 className="mr-2 h-4 w-4" />
              清除全部
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

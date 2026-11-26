import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Download, Archive, X, Loader2, Info, Trash2 } from 'lucide-react';
import { Button, Card, CardContent } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  compressBasic,
  compressImage,
  formatBytes,
  uniqueName,
  QUALITY_PRESETS,
  type Mode,
  type Quality,
} from './compress';

type Status = 'pending' | 'processing' | 'done' | 'kept' | 'error';

interface Item {
  id: number;
  file: File;
  status: Status;
  originalSize: number;
  newSize?: number;
  blob?: Blob;
  url?: string;
  downloadName?: string;
  label: string;
  pct: number;
  error?: string;
}

const MODE_NOTES: Record<Mode, string> = {
  basic: '重新整理檔案結構、移除多餘資料。文字維持可選取、可搜尋，壓縮效果較有限，適合一般文件。',
  image:
    '每一頁會轉換成圖片後重新組成 PDF，檔案可大幅縮小，但文字將無法選取或搜尋。適合掃描件或圖片較多的檔案。頁數多或檔案較大時，處理需要較長時間，請耐心等候。',
};

let nextId = 1;

function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 px-2 py-2.5 text-sm transition-colors',
            i > 0 && 'border-l',
            value === o.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function CompressTool() {
  const [items, setItems] = useState<Item[]>([]);
  const [mode, setMode] = useState<Mode>('basic');
  const [quality, setQuality] = useState<Quality>('medium');
  const [running, setRunning] = useState(false);
  const [zipping, setZipping] = useState(false);

  const patch = useCallback((id: number, changes: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...changes } : it)));
  }, []);

  const onDrop = useCallback((accepted: File[]) => {
    setItems((prev) => [
      ...prev,
      ...accepted.map<Item>((file) => ({
        id: nextId++,
        file,
        status: 'pending',
        originalSize: file.size,
        label: '',
        pct: 0,
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  });

  const removeItem = (id: number) => setItems((prev) => prev.filter((it) => it.id !== id));

  const clearAll = () => {
    items.forEach((it) => it.url && URL.revokeObjectURL(it.url));
    setItems([]);
  };

  const run = async () => {
    const queue = items.filter((it) => it.status === 'pending');
    if (queue.length === 0) return;
    setRunning(true);

    for (const item of queue) {
      patch(item.id, { status: 'processing', label: '讀取檔案…', pct: 5 });
      try {
        const bytes = await item.file.arrayBuffer();
        const onProgress = (label: string, pct: number) => patch(item.id, { label, pct });
        const result =
          mode === 'basic'
            ? await compressBasic(bytes, onProgress)
            : await compressImage(bytes, QUALITY_PRESETS[quality], onProgress);

        if (result.byteLength >= item.originalSize) {
          // 壓縮後沒有比較小就不要給壓縮檔，保留原檔。
          patch(item.id, { status: 'kept', newSize: result.byteLength });
        } else {
          const blob = new Blob([new Uint8Array(result)], { type: 'application/pdf' });
          patch(item.id, {
            status: 'done',
            newSize: blob.size,
            blob,
            url: URL.createObjectURL(blob),
            downloadName: item.file.name.replace(/\.pdf$/i, '') + '-compressed.pdf',
          });
        }
      } catch (err) {
        console.error(err);
        patch(item.id, { status: 'error', error: '此檔案可能已加密、已損毀，或格式不受支援。' });
      }
    }
    setRunning(false);
  };

  const downloadZip = async () => {
    setZipping(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const taken = new Set<string>();
      items
        .filter((it) => it.status === 'done' && it.blob)
        .forEach((it) => zip.file(uniqueName(it.downloadName!, taken), it.blob!));
      const url = URL.createObjectURL(await zip.generateAsync({ type: 'blob' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'compressed-pdfs.zip';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipping(false);
    }
  };

  const pendingCount = items.filter((it) => it.status === 'pending').length;
  const doneCount = items.filter((it) => it.status === 'done').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Card className="mb-8 bg-gradient-to-r from-emerald-500 to-teal-600">
          <CardContent className="p-8 text-center text-white">
            <h2 className="mb-3 text-3xl font-bold drop-shadow-lg md:text-4xl">PDF 壓縮工具</h2>
            <p className="opacity-90">在瀏覽器內完成壓縮，檔案不會上傳到任何伺服器。</p>
          </CardContent>
        </Card>

        <div
          {...getRootProps()}
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed bg-white p-10 text-center transition-colors',
            isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/50',
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-3 h-9 w-9 text-emerald-600" />
          <p className="font-medium text-gray-900">拖曳 PDF 檔案到這裡，或點擊選擇檔案</p>
          <p className="mt-1 text-sm text-gray-500">支援一次選取多個檔案</p>
        </div>

        {items.length > 0 && (
          <Card className="mt-6">
            <CardContent className="space-y-4 p-6">
              <div>
                <div className="mb-2 text-sm font-medium text-gray-500">壓縮方式</div>
                <Segmented
                  label="壓縮方式"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: 'basic', label: '基本優化（保留文字）' },
                    { value: 'image', label: '影像壓縮（檔案更小）' },
                  ]}
                />
                <p className="mt-3 rounded-md bg-gray-100 p-3 text-sm text-gray-600">{MODE_NOTES[mode]}</p>
              </div>

              {mode === 'image' && (
                <div>
                  <div className="mb-2 text-sm font-medium text-gray-500">壓縮程度</div>
                  <Segmented
                    label="壓縮程度"
                    value={quality}
                    onChange={setQuality}
                    options={(Object.keys(QUALITY_PRESETS) as Quality[]).map((q) => ({
                      value: q,
                      label: QUALITY_PRESETS[q].label,
                    }))}
                  />
                </div>
              )}

              <Button
                onClick={run}
                disabled={running || pendingCount === 0}
                size="lg"
                className="w-full bg-emerald-600 text-base hover:bg-emerald-700"
              >
                {running ? '壓縮中…' : pendingCount === 0 ? '沒有待壓縮的檔案' : `開始壓縮（${pendingCount} 個檔案）`}
              </Button>
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
                  {it.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => removeItem(it.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-600"
                      aria-label={`移除 ${it.file.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-sm text-gray-500">
                  {it.status === 'done' ? (
                    <>
                      <span>
                        {formatBytes(it.originalSize)} → {formatBytes(it.newSize!)}
                      </span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                        縮小 {Math.min(99, Math.round((1 - it.newSize! / it.originalSize) * 100))}%
                      </span>
                    </>
                  ) : (
                    <span>{formatBytes(it.originalSize)}</span>
                  )}
                  {it.status === 'pending' && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">等待壓縮</span>
                  )}
                  {it.status === 'processing' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      處理中
                    </span>
                  )}
                  {it.status === 'kept' && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      已保留原檔
                    </span>
                  )}
                  {it.status === 'error' && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      壓縮失敗
                    </span>
                  )}
                </div>

                {it.status === 'processing' && (
                  <>
                    <div className="mt-3 h-1 overflow-hidden rounded bg-gray-100">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${it.pct}%` }} />
                    </div>
                    <div className="mt-1.5 text-xs text-gray-500">{it.label}</div>
                  </>
                )}

                {it.status === 'kept' && (
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-amber-800">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    壓縮後是 {formatBytes(it.newSize!)}，沒有比原檔（{formatBytes(it.originalSize)}）小，所以沒有產生壓縮檔，請繼續使用原檔。
                    {mode === 'basic' && ' 可以改試「影像壓縮」，但文字會變成無法選取。'}
                  </p>
                )}

                {it.status === 'error' && <p className="mt-2 text-sm text-red-700">{it.error}</p>}

                {it.status === 'done' && (
                  <a
                    href={it.url}
                    download={it.downloadName}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4" />
                    下載
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button variant="outline" onClick={clearAll} disabled={running}>
              <Trash2 className="mr-2 h-4 w-4" />
              清除全部
            </Button>
            {doneCount > 1 && (
              <Button variant="outline" onClick={downloadZip} disabled={zipping} className="border-gray-900">
                <Archive className="mr-2 h-4 w-4" />
                {zipping ? '打包中…' : '下載全部（ZIP）'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

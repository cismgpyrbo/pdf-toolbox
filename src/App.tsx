import { lazy, Suspense, useEffect, useState } from 'react';
import { FileStack, LayoutGrid, GitCompare, PenLine, Loader2 } from 'lucide-react';
import { Toaster } from '@/components/toast';
import { cn } from '@/lib/cn';

// 各工具用到才載入，首頁不會一次下載全部程式。
const tools = [
  { id: 'merge', label: '合併', Icon: FileStack, Component: lazy(() => import('./tools/merge/MergeTool')) },
  { id: 'pages', label: '頁面調整', Icon: LayoutGrid, Component: lazy(() => import('./tools/pageadjust/PageAdjustTool')) },
  { id: 'compare', label: '比對', Icon: GitCompare, Component: lazy(() => import('./tools/compare/CompareTool')) },
  { id: 'editor', label: '編輯', Icon: PenLine, Component: lazy(() => import('./tools/editor/EditorTool')) },
] as const;

type ToolId = (typeof tools)[number]['id'];

const readHash = (): ToolId => {
  const id = window.location.hash.replace('#', '');
  return tools.find((t) => t.id === id)?.id ?? 'merge';
};

export default function App() {
  const [active, setActive] = useState<ToolId>(readHash);
  // 切換分頁時保留已開過的工具（不卸載），這樣載入的 PDF 與編輯內容不會消失。
  const [visited, setVisited] = useState<Set<ToolId>>(() => new Set([readHash()]));

  useEffect(() => {
    const onHash = () => select(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const select = (id: ToolId) => {
    setActive(id);
    setVisited((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    if (window.location.hash !== `#${id}`) window.history.replaceState(null, '', `#${id}`);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2">
          <h1 className="text-lg font-bold text-gray-900">PDF 工具箱</h1>
          <nav className="flex flex-wrap gap-1" role="tablist" aria-label="PDF 工具">
            {tools.map(({ id, label, Icon }) => (
              <button
                key={id}
                role="tab"
                aria-selected={active === id}
                onClick={() => select(id)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  active === id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>
          <span className="ml-auto text-xs text-gray-500">檔案只在你的瀏覽器處理，不會上傳</span>
        </div>
      </header>

      <main>
        {tools.map(({ id, Component }) =>
          visited.has(id) ? (
            <div key={id} role="tabpanel" hidden={active !== id}>
              <Suspense
                fallback={
                  <div className="flex min-h-[50vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                }
              >
                <Component />
              </Suspense>
            </div>
          ) : null,
        )}
      </main>
      <Toaster />
    </div>
  );
}

// 把 pdfjs-dist 的 CJK 字型對照表(cmaps)與標準字型複製到 public/，
// 讓 PDF 預覽不必連外部 CDN。public/cmaps 與 public/standard_fonts 不進版控。
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pdfjs-dist');
for (const dir of ['cmaps', 'standard_fonts']) {
  mkdirSync(join(root, 'public', dir), { recursive: true });
  cpSync(join(src, dir), join(root, 'public', dir), { recursive: true });
}
console.log('pdfjs assets copied to public/');

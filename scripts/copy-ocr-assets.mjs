// 把 OCR 需要的 worker、wasm 核心與語言資料複製到 public/tesseract/，
// 讓 OCR 不必連外部 CDN。public/tesseract 不進版控。
// 語言資料用 best_int 版本（體積小、專供 LSTM 引擎使用）。
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'tesseract');
const nm = (...p) => join(root, 'node_modules', ...p);
const MODEL = process.env.OCR_MODEL_DIR ?? '4.0.0_best_int';

mkdirSync(join(out, 'core'), { recursive: true });
mkdirSync(join(out, 'lang'), { recursive: true });
cpSync(nm('tesseract.js', 'dist', 'worker.min.js'), join(out, 'worker.min.js'));
for (const f of ['tesseract-core-lstm', 'tesseract-core-simd-lstm', 'tesseract-core-relaxedsimd-lstm']) {
  cpSync(nm('tesseract.js-core', `${f}.wasm.js`), join(out, 'core', `${f}.wasm.js`));
}
for (const l of ['chi_tra', 'eng']) {
  cpSync(nm('@tesseract.js-data', l, MODEL, `${l}.traineddata.gz`), join(out, 'lang', `${l}.traineddata.gz`));
}
console.log(`tesseract assets copied to public/tesseract (${MODEL})`);

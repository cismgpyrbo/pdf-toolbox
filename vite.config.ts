import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// GitHub Pages 的網址帶有倉庫名稱（/pdf-toolbox/），由 CI 以 VITE_BASE 指定；本機與 Netlify 預設為 /。
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
});

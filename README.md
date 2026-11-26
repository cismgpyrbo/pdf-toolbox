# PDF 工具箱

四個 PDF 工具整合成一個網站，分頁切換。**所有處理都在瀏覽器內完成，檔案不會上傳到任何伺服器。**

| 分頁 | 功能 | 來源倉庫 |
|---|---|---|
| 合併 | 多個 PDF 合併成一份 | `pdf` |
| 頁面調整 | 頁面選取、旋轉、刪除、拖曳排序、匯出 | `-PDF-page-adjustment-tool` |
| 比對 | 兩份 PDF 文字差異、相似度、匯出 TXT / JSON / CSV | `v0-pdf-comparison-tool` |
| 編輯 | 加文字、線條、表格、橡皮擦、復原重做、匯出 | `PDF-Editor` |

## 開發

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 輸出到 dist/
```

`predev` / `prebuild` 會把 pdf.js 的 CJK 字型對照表（`cmaps`）與標準字型複製到 `public/`（不進版控），
讓中文 PDF 預覽不必連外部 CDN。

## 部署

**GitHub Pages（目前使用）**：推送到 `main` 會由 `.github/workflows/deploy.yml` 自動建置並發布。
第一次需要在倉庫 Settings → Pages 把 Source 設為 **GitHub Actions**。
網址：`https://cismgpyrbo.github.io/pdf-toolbox/`

**Netlify（之後想用再接）**：連結 GitHub 倉庫即可，`netlify.toml` 已設定（build 指令 `npm run build`、發布資料夾 `dist`、Node 22）。
GitHub Pages 的網址帶倉庫名稱，所以 CI 會用 `VITE_BASE=/pdf-toolbox/` 建置；本機與 Netlify 不設定，預設為 `/`。

## 技術

Vite + React 18 + TypeScript + Tailwind CSS 3、`pdf-lib`（產生 PDF）、`pdfjs-dist` 4（顯示 PDF）。
各工具用 `React.lazy` 分開載入；切換分頁時已開啟的工具不會被卸載，載入的檔案與編輯內容會保留。

## 與原本 4 個倉庫的差異

- 統一用 `pdfjs-dist` 4.10.38，worker 與字型都從本站載入（原本各工具用不同版本、並連 cdnjs / unpkg）。
- 不帶入 `-PDF-page-adjustment-tool` 的 `sw.js`（載入第三方 `shoukigaigoors.net` 的 service worker），也不含 Google AdSense 廣告碼。
- 頁面調整：
  - 匯出時以檔案物件（而非檔名）對應來源，兩個**同名**檔案不會再互相覆蓋。
  - 旋轉改為在頁面原有角度上累加，不會把原本就有旋轉的頁面轉回去。
  - 格狀檢視每格高度不足，頁碼與單頁旋轉／刪除按鈕被截掉，已加高；旋轉後縮圖會縮放，不再蓋到隔壁卡片。
  - 原本沒有渲染 Toast 元件，提示訊息從來不會顯示，現在會顯示。
- 比對：CSV 加上 UTF-8 BOM，Excel 開啟中文不會亂碼；移除獨立的「功能說明」頁。
- 編輯：型別修正（`zoom` 一定有值）。
- 改用原生元件取代 shadcn / Radix（Dialog、RadioGroup、ScrollArea、Toast），少了 8 個相依套件。

## 已知狀況

- **OCR 尚未實作。** 原本 `PDF-Editor` 只在 package.json 列了 `tesseract.js`，原始碼中沒有任何 OCR 功能，所以沒有可搬的程式。

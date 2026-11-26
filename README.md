# PDF 工具箱

PDF 工具整合成一個網站，分頁切換。**所有處理都在瀏覽器內完成，檔案不會上傳到任何伺服器。**

| 分頁 | 功能 | 來源倉庫 |
|---|---|---|
| 合併 | 多個 PDF 合併成一份 | `pdf` |
| 頁面調整 | 頁面選取、旋轉、刪除、拖曳排序、匯出 | `-PDF-page-adjustment-tool` |
| 壓縮 | 基本優化（保留文字）或影像壓縮（每頁轉 JPEG，三種畫質）、多檔、ZIP 打包；壓縮後沒有變小就保留原檔 | 自行提供的 `pdf-compressor.html` |
| OCR | 掃描檔或圖片（PDF、JPG、PNG）轉成可搜尋的 PDF，繁體中文＋英文，保留原頁面大小，可中途停止 | 新增（tesseract.js，辨識引擎與語言資料自行託管） |
| 比對 | 兩份 PDF 文字差異、相似度、匯出 TXT / JSON / CSV | `v0-pdf-comparison-tool` |
| 編輯 | 加文字、線條、表格、圖片、橡皮擦、復原重做；匯出預設保留原始內容（向量），也可選整頁影像化 | `PDF-Editor`（匯出重寫） |

「合併」與「頁面調整」都有**送到編輯**按鈕：產生的 PDF 直接在瀏覽器記憶體交給編輯分頁，不必下載再上傳。
編輯分頁已有文件時會先詢問是否取代；重新整理網頁後內容不會保留。

## 開發

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 輸出到 dist/
```

`predev` / `prebuild` 會把 pdf.js 的 CJK 字型對照表（`cmaps`）與標準字型複製到 `public/`（不進版控），
讓中文 PDF 預覽不必連外部 CDN。OCR 的辨識引擎與語言資料（約 16 MB）同樣在建置時複製到 `public/tesseract/`（不進版控）。

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

## 編輯分頁的匯出

預設「保留原始內容」：原始頁面原封不動，新增的文字、線條、表格、圖片以 PDF 向量物件加上去，
所以原本的文字可選取搜尋，連結、書籤、表單欄位、頁面旋轉都會保留（選「原始大小」時；選其他紙張會重建文件，書籤與連結不保留）。
新增的文字使用內建的 Noto Sans TC 子集字型（`public/fonts/`，約 6 MB，只在有新增文字時才載入，匯出只嵌入用到的字），
字型沒有的罕用字會顯示成空白並提示。加密 PDF、含旋轉頁面又要換紙張大小時，會自動改用「整頁影像化」並提示。
數位簽章只要內容被修改就會失效，這是 PDF 的特性，任何方式都一樣。

## 已知狀況

- **OCR**：原本各倉庫都沒有可搬的 OCR 程式，是新寫的。輸出檔會比原檔大（保留原圖加文字層）；辨識結果可能有錯字，重要內容請核對。

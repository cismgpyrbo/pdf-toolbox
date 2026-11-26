import { useState, useCallback, useRef } from 'react';
import { EditorState, PDFPage, TextElement, ImageElement, LineElement, TableElement, EditAction } from '../types';
import { openPdf } from '@/shared/pdfjs';
import { PDFDocument, rgb } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { toast } from '@/components/toast';
import { exportVector } from '../lib/exportVector';

export const usePDFEditor = () => {
  const [state, setState] = useState<EditorState>({
    pages: [],
    currentPageId: null,
    textElements: {},
    imageElements: {},
    lineElements: {},
    tableElements: {},
    history: [],
    historyIndex: -1,
    isLoading: false,
    selectedTool: 'text',
    zoom: 1
  });

  const canvasRefs = useRef<Record<string, HTMLCanvasElement>>({});
  const pdfDocRef = useRef<any>(null);
  // pdf.js 會接手（分離）傳入的 buffer，所以另外留一份給向量匯出使用。
  const originalBytesRef = useRef<ArrayBuffer | null>(null);
  const DISPLAY_SCALE = 1.5;
  const EXPORT_SCALE = 3;

  // History management
  const saveToHistory = useCallback((action: EditAction) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(action);
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < 0) return prev;
      
      const action = prev.history[prev.historyIndex];
      let newState = { ...prev };
      
      // Reverse the action
      switch (action.type) {
        case 'add-text':
          newState.textElements = {
            ...prev.textElements,
            [action.pageId]: prev.textElements[action.pageId]?.filter(el => el.id !== action.data.id) || []
          };
          break;
        case 'modify-text':
          if (action.data.previousState) {
            newState.textElements = {
              ...prev.textElements,
              [action.pageId]: prev.textElements[action.pageId]?.map(el => 
                el.id === action.data.id ? action.data.previousState : el
              ) || []
            };
          }
          break;
        case 'delete-text':
          newState.textElements = {
            ...prev.textElements,
            [action.pageId]: [...(prev.textElements[action.pageId] || []), action.data]
          };
          break;
        case 'add-image':
          newState.imageElements = {
            ...prev.imageElements,
            [action.pageId]: prev.imageElements[action.pageId]?.filter(el => el.id !== action.data.id) || []
          };
          break;
        case 'add-line':
          newState.lineElements = {
            ...prev.lineElements,
            [action.pageId]: prev.lineElements[action.pageId]?.filter(el => el.id !== action.data.id) || []
          };
          break;
        case 'add-table':
          newState.tableElements = {
            ...prev.tableElements,
            [action.pageId]: prev.tableElements[action.pageId]?.filter(el => el.id !== action.data.id) || []
          };
          break;
        case 'modify-table':
          if (action.data.previousState) {
            newState.tableElements = {
              ...prev.tableElements,
              [action.pageId]: prev.tableElements[action.pageId]?.map(el => 
                el.id === action.data.id ? action.data.previousState : el
              ) || []
            };
          }
          break;
        case 'delete-table':
          newState.tableElements = {
            ...prev.tableElements,
            [action.pageId]: [...(prev.tableElements[action.pageId] || []), action.data]
          };
          break;
      }
      
      return {
        ...newState,
        historyIndex: prev.historyIndex - 1
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      
      const nextIndex = prev.historyIndex + 1;
      const action = prev.history[nextIndex];
      let newState = { ...prev };
      
      // Apply the action
      switch (action.type) {
        case 'add-text':
          newState.textElements = {
            ...prev.textElements,
            [action.pageId]: [...(prev.textElements[action.pageId] || []), action.data]
          };
          break;
        case 'modify-text':
          newState.textElements = {
            ...prev.textElements,
            [action.pageId]: prev.textElements[action.pageId]?.map(el => 
              el.id === action.data.id ? { ...el, ...action.data.updates } : el
            ) || []
          };
          break;
        case 'delete-text':
          newState.textElements = {
            ...prev.textElements,
            [action.pageId]: prev.textElements[action.pageId]?.filter(el => el.id !== action.data.id) || []
          };
          break;
        case 'add-image':
          newState.imageElements = {
            ...prev.imageElements,
            [action.pageId]: [...(prev.imageElements[action.pageId] || []), action.data]
          };
          break;
        case 'add-line':
          newState.lineElements = {
            ...prev.lineElements,
            [action.pageId]: [...(prev.lineElements[action.pageId] || []), action.data]
          };
          break;
        case 'add-table':
          newState.tableElements = {
            ...prev.tableElements,
            [action.pageId]: [...(prev.tableElements[action.pageId] || []), action.data]
          };
          break;
        case 'modify-table':
          newState.tableElements = {
            ...prev.tableElements,
            [action.pageId]: prev.tableElements[action.pageId]?.map(el => 
              el.id === action.data.id ? { ...el, ...action.data.updates } : el
            ) || []
          };
          break;
        case 'delete-table':
          newState.tableElements = {
            ...prev.tableElements,
            [action.pageId]: prev.tableElements[action.pageId]?.filter(el => el.id !== action.data.id) || []
          };
          break;
      }
      
      return {
        ...newState,
        historyIndex: nextIndex
      };
    });
  }, []);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, 3)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, 0.3)
    }));
  }, []);

  // Page navigation
  const goToPreviousPage = useCallback(() => {
    setState(prev => {
      const currentIndex = prev.pages.findIndex(p => p.id === prev.currentPageId);
      if (currentIndex > 0) {
        return {
          ...prev,
          currentPageId: prev.pages[currentIndex - 1].id
        };
      }
      return prev;
    });
  }, []);

  const goToNextPage = useCallback(() => {
    setState(prev => {
      const currentIndex = prev.pages.findIndex(p => p.id === prev.currentPageId);
      if (currentIndex < prev.pages.length - 1) {
        return {
          ...prev,
          currentPageId: prev.pages[currentIndex + 1].id
        };
      }
      return prev;
    });
  }, []);

  const loadPDF = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      originalBytesRef.current = arrayBuffer.slice(0);
      const pdf = await openPdf(arrayBuffer);
      pdfDocRef.current = pdf;
      const pages: PDFPage[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: DISPLAY_SCALE });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;

        const thumbnail = canvas.toDataURL('image/jpeg', 0.3);
        
        const pageData: PDFPage = {
          id: `page-${i}`,
          pageNumber: i,
          canvas,
          thumbnail,
          width: viewport.width,
          height: viewport.height
        };
        
        pages.push(pageData);
        canvasRefs.current[pageData.id] = canvas;
      }

      setState(prev => ({
        ...prev,
        pages,
        currentPageId: pages[0]?.id || null,
        textElements: {},
        imageElements: {},
        lineElements: {},
        tableElements: {},
        history: [],
        historyIndex: -1,
        isLoading: false,
        zoom: 1
      }));
    } catch (error) {
      console.error('載入PDF時發生錯誤:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const addTextElement = useCallback((pageId: string, x: number, y: number) => {
    const newElement: TextElement = {
      id: `text-${Date.now()}`,
      text: '點擊編輯文字',
      x,
      y,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left'
    };

    setState(prev => ({
      ...prev,
      textElements: {
        ...prev.textElements,
        [pageId]: [...(prev.textElements[pageId] || []), newElement]
      }
    }));

    // Save to history
    saveToHistory({
      id: `action-${Date.now()}`,
      type: 'add-text',
      pageId,
      data: newElement,
      timestamp: Date.now()
    });
  }, [saveToHistory]);

  const updateTextElement = useCallback((pageId: string, elementId: string, updates: Partial<TextElement>) => {
    setState(prev => {
      const currentElement = prev.textElements[pageId]?.find(el => el.id === elementId);
      
      if (currentElement) {
        // Save to history
        saveToHistory({
          id: `action-${Date.now()}`,
          type: 'modify-text',
          pageId,
          data: {
            id: elementId,
            updates,
            previousState: currentElement
          },
          timestamp: Date.now()
        });
      }

      return {
        ...prev,
        textElements: {
          ...prev.textElements,
          [pageId]: prev.textElements[pageId]?.map(el => 
            el.id === elementId ? { ...el, ...updates } : el
          ) || []
        }
      };
    });
  }, [saveToHistory]);

  const deleteTextElement = useCallback((pageId: string, elementId: string) => {
    setState(prev => {
      const elementToDelete = prev.textElements[pageId]?.find(el => el.id === elementId);
      
      if (elementToDelete) {
        // Save to history
        saveToHistory({
          id: `action-${Date.now()}`,
          type: 'delete-text',
          pageId,
          data: elementToDelete,
          timestamp: Date.now()
        });
      }

      return {
        ...prev,
        textElements: {
          ...prev.textElements,
          [pageId]: prev.textElements[pageId]?.filter(el => el.id !== elementId) || []
        }
      };
    });
  }, [saveToHistory]);

  const addImageElement = useCallback((pageId: string, file: File, x: number, y: number) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newElement: ImageElement = {
        id: `image-${Date.now()}`,
        src: e.target?.result as string,
        x,
        y,
        width: 100,
        height: 100,
        rotation: 0
      };

      setState(prev => ({
        ...prev,
        imageElements: {
          ...prev.imageElements,
          [pageId]: [...(prev.imageElements[pageId] || []), newElement]
        }
      }));

      // Save to history
      saveToHistory({
        id: `action-${Date.now()}`,
        type: 'add-image',
        pageId,
        data: newElement,
        timestamp: Date.now()
      });
    };
    reader.readAsDataURL(file);
  }, [saveToHistory]);

  const updateImageElement = useCallback((pageId: string, elementId: string, updates: Partial<ImageElement>) => {
    setState(prev => ({
      ...prev,
      imageElements: {
        ...prev.imageElements,
        [pageId]: prev.imageElements[pageId]?.map(el => 
          el.id === elementId ? { ...el, ...updates } : el
        ) || []
      }
    }));
  }, []);

  const deleteImageElement = useCallback((pageId: string, elementId: string) => {
    setState(prev => ({
      ...prev,
      imageElements: {
        ...prev.imageElements,
        [pageId]: prev.imageElements[pageId]?.filter(el => el.id !== elementId) || []
      }
    }));
  }, []);

  const addLineElement = useCallback((pageId: string, startX: number, startY: number, endX: number, endY: number) => {
    const newElement: LineElement = {
      id: `line-${Date.now()}`,
      startX,
      startY,
      endX,
      endY,
      color: '#000000',
      width: 2,
      style: 'solid'
    };

    setState(prev => ({
      ...prev,
      lineElements: {
        ...prev.lineElements,
        [pageId]: [...(prev.lineElements[pageId] || []), newElement]
      }
    }));

    // Save to history
    saveToHistory({
      id: `action-${Date.now()}`,
      type: 'add-line',
      pageId,
      data: newElement,
      timestamp: Date.now()
    });
  }, [saveToHistory]);

  const deleteLineElement = useCallback((pageId: string, elementId: string) => {
    setState(prev => ({
      ...prev,
      lineElements: {
        ...prev.lineElements,
        [pageId]: prev.lineElements[pageId]?.filter(el => el.id !== elementId) || []
      }
    }));
  }, []);

  const addTableElement = useCallback((pageId: string, x: number, y: number) => {
    const newElement: TableElement = {
      id: `table-${Date.now()}`,
      x,
      y,
      width: 300,
      height: 150,
      rows: 3,
      cols: 3,
      cellWidth: 100,
      cellHeight: 50,
      borderColor: '#000000',
      borderWidth: 1,
      backgroundColor: '#ffffff',
      cells: {}
    };

    setState(prev => ({
      ...prev,
      tableElements: {
        ...prev.tableElements,
        [pageId]: [...(prev.tableElements[pageId] || []), newElement]
      }
    }));

    // Save to history
    saveToHistory({
      id: `action-${Date.now()}`,
      type: 'add-table',
      pageId,
      data: newElement,
      timestamp: Date.now()
    });
  }, [saveToHistory]);

  const updateTableElement = useCallback((pageId: string, elementId: string, updates: Partial<TableElement>) => {
    setState(prev => {
      const currentElement = prev.tableElements[pageId]?.find(el => el.id === elementId);
      
      if (currentElement) {
        // Save to history
        saveToHistory({
          id: `action-${Date.now()}`,
          type: 'modify-table',
          pageId,
          data: {
            id: elementId,
            updates,
            previousState: currentElement
          },
          timestamp: Date.now()
        });
      }

      return {
        ...prev,
        tableElements: {
          ...prev.tableElements,
          [pageId]: prev.tableElements[pageId]?.map(el => 
            el.id === elementId ? { ...el, ...updates } : el
          ) || []
        }
      };
    });
  }, [saveToHistory]);

  const deleteTableElement = useCallback((pageId: string, elementId: string) => {
    setState(prev => {
      const elementToDelete = prev.tableElements[pageId]?.find(el => el.id === elementId);
      
      if (elementToDelete) {
        // Save to history
        saveToHistory({
          id: `action-${Date.now()}`,
          type: 'delete-table',
          pageId,
          data: elementToDelete,
          timestamp: Date.now()
        });
      }

      return {
        ...prev,
        tableElements: {
          ...prev.tableElements,
          [pageId]: prev.tableElements[pageId]?.filter(el => el.id !== elementId) || []
        }
      };
    });
  }, [saveToHistory]);

  const eraseElement = useCallback((pageId: string, x: number, y: number) => {
    setState(prev => {
      let elementDeleted = false;
      let newState = { ...prev };

      // Check text elements
      const textElements = prev.textElements[pageId] || [];
      for (const textEl of textElements) {
        if (
          x >= textEl.x - 10 &&
          x <= textEl.x + 100 &&
          y >= textEl.y - 10 &&
          y <= textEl.y + textEl.fontSize + 10
        ) {
          newState.textElements = {
            ...prev.textElements,
            [pageId]: textElements.filter(el => el.id !== textEl.id)
          };
          elementDeleted = true;
          break;
        }
      }

      // Check image elements if no text element was deleted
      if (!elementDeleted) {
        const imageElements = prev.imageElements[pageId] || [];
        for (const imgEl of imageElements) {
          if (
            x >= imgEl.x &&
            x <= imgEl.x + imgEl.width &&
            y >= imgEl.y &&
            y <= imgEl.y + imgEl.height
          ) {
            newState.imageElements = {
              ...prev.imageElements,
              [pageId]: imageElements.filter(el => el.id !== imgEl.id)
            };
            elementDeleted = true;
            break;
          }
        }
      }

      // Check table elements if no other element was deleted
      if (!elementDeleted) {
        const tableElements = prev.tableElements[pageId] || [];
        for (const tableEl of tableElements) {
          if (
            x >= tableEl.x &&
            x <= tableEl.x + tableEl.width &&
            y >= tableEl.y &&
            y <= tableEl.y + tableEl.height
          ) {
            newState.tableElements = {
              ...prev.tableElements,
              [pageId]: tableElements.filter(el => el.id !== tableEl.id)
            };
            break;
          }
        }
      }

      // Check line elements if no other element was deleted
      if (!elementDeleted) {
        const lineElements = prev.lineElements[pageId] || [];
        for (const lineEl of lineElements) {
          // Simple line hit detection
          const distance = Math.abs((lineEl.endY - lineEl.startY) * x - (lineEl.endX - lineEl.startX) * y + lineEl.endX * lineEl.startY - lineEl.endY * lineEl.startX) / 
                          Math.sqrt(Math.pow(lineEl.endY - lineEl.startY, 2) + Math.pow(lineEl.endX - lineEl.startX, 2));
          
          if (distance < 10) {
            newState.lineElements = {
              ...prev.lineElements,
              [pageId]: lineElements.filter(el => el.id !== lineEl.id)
            };
            break;
          }
        }
      }

      return newState;
    });
  }, []);

  const setCurrentPage = useCallback((pageId: string) => {
    setState(prev => ({ ...prev, currentPageId: pageId }));
  }, []);

  const setSelectedTool = useCallback((tool: EditorState['selectedTool']) => {
    setState(prev => ({ ...prev, selectedTool: tool }));
  }, []);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 0, g: 0, b: 0 };
  };

  const getPaperDimensions = (paperSize: string, originalWidth: number, originalHeight: number): [number, number] => {
    const paperSizes: Record<string, [number, number]> = {
      'a4': [595, 842],
      'a3': [842, 1191],
      'a5': [420, 595],
      'letter': [612, 792],
      'legal': [612, 1008],
      'original': [originalWidth, originalHeight]
    };
    return paperSizes[paperSize] || [originalWidth, originalHeight];
  };

  const scaleContent = (
    ctx: CanvasRenderingContext2D,
    originalWidth: number,
    originalHeight: number,
    targetWidth: number,
    targetHeight: number
  ) => {
    const scaleX = targetWidth / originalWidth;
    const scaleY = targetHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY);
    ctx.scale(scale, scale);
    return scale;
  };

  const exportRaster = useCallback(async (paperSize: string = 'a4') => {
    if (state.pages.length === 0) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const pdfDoc = await PDFDocument.create();
      // Overlay coordinates were captured in DISPLAY_SCALE space.
      // We render the export at EXPORT_SCALE for higher DPI, so scale overlays accordingly.
      const ratio = EXPORT_SCALE / DISPLAY_SCALE;

      for (let pageIndex = 0; pageIndex < state.pages.length; pageIndex++) {
        const page = state.pages[pageIndex];

        // Original PDF point dimensions (page.width/height are at DISPLAY_SCALE pixels)
        const pointWidth = page.width / DISPLAY_SCALE;
        const pointHeight = page.height / DISPLAY_SCALE;

        // Output canvas at EXPORT_SCALE for high-res rasterization
        const outWidth = Math.round(pointWidth * EXPORT_SCALE);
        const outHeight = Math.round(pointHeight * EXPORT_SCALE);

        // Get target paper dimensions
        const [targetWidth, targetHeight] = getPaperDimensions(paperSize, pointWidth, pointHeight);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width = Math.round(targetWidth * EXPORT_SCALE);
        canvas.height = Math.round(targetHeight * EXPORT_SCALE);
        ctx.imageSmoothingEnabled = true;
        (ctx as any).imageSmoothingQuality = 'high';

        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Calculate scaling to fit original content into target paper size
        const contentScale = Math.min(
          (targetWidth * EXPORT_SCALE) / outWidth,
          (targetHeight * EXPORT_SCALE) / outHeight
        );
        
        ctx.save();
        ctx.scale(contentScale, contentScale);

        // Re-render the original PDF page at EXPORT_SCALE if pdfjs doc is available;
        // otherwise upscale the cached display canvas.
        if (pdfDocRef.current) {
          try {
            const pdfjsPage = await pdfDocRef.current.getPage(pageIndex + 1);
            const viewport = pdfjsPage.getViewport({ scale: EXPORT_SCALE });
            await pdfjsPage.render({
              canvasContext: ctx,
              viewport,
            }).promise;
          } catch {
            ctx.drawImage(page.canvas, 0, 0, outWidth, outHeight);
          }
        } else {
          ctx.drawImage(page.canvas, 0, 0, outWidth, outHeight);
        }

        // Sharper line rendering
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';

        // Draw text elements (scaled by ratio)
        const textElements = state.textElements[page.id] || [];
        textElements.forEach((textEl) => {
          const fontSize = textEl.fontSize * ratio;
          ctx.font = `${textEl.fontWeight === 'bold' ? 'bold ' : ''}${textEl.fontStyle === 'italic' ? 'italic ' : ''}${fontSize}px ${textEl.fontFamily}`;
          ctx.fillStyle = textEl.color;
          ctx.textBaseline = 'alphabetic';
          ctx.textAlign = 'left';

          const lines = textEl.text.split('\n');
          lines.forEach((line, index) => {
            let x = textEl.x * ratio;
            const lineWidth = ctx.measureText(line).width;
            if (textEl.textAlign === 'center') {
              x = textEl.x * ratio - lineWidth / 2;
            } else if (textEl.textAlign === 'right') {
              x = textEl.x * ratio - lineWidth;
            }

            const baselineY = textEl.y * ratio + fontSize + index * fontSize * 1.2;
            ctx.fillText(line, x, baselineY);

            if (textEl.textDecoration === 'underline') {
              ctx.save();
              ctx.strokeStyle = textEl.color;
              ctx.lineWidth = Math.max(1, fontSize / 16);
              ctx.beginPath();
              ctx.moveTo(x, baselineY + 2);
              ctx.lineTo(x + lineWidth, baselineY + 2);
              ctx.stroke();
              ctx.restore();
            }
          });
        });

        // Draw line elements (scaled)
        const lineElements = state.lineElements[page.id] || [];
        lineElements.forEach((lineEl) => {
          ctx.beginPath();
          ctx.moveTo(lineEl.startX * ratio, lineEl.startY * ratio);
          ctx.lineTo(lineEl.endX * ratio, lineEl.endY * ratio);
          ctx.strokeStyle = lineEl.color;
          ctx.lineWidth = lineEl.width * ratio;
          if (lineEl.style === 'dashed') {
            ctx.setLineDash([5 * ratio, 5 * ratio]);
          } else if (lineEl.style === 'dotted') {
            ctx.setLineDash([2 * ratio, 2 * ratio]);
          }
          ctx.stroke();
          ctx.setLineDash([]);
        });

        // Draw table elements (scaled, honoring per-cell font + border styles)
        const tableElements = state.tableElements[page.id] || [];
        tableElements.forEach((tableEl) => {
          const tx = tableEl.x * ratio;
          const ty = tableEl.y * ratio;
          const tw = tableEl.width * ratio;
          const th = tableEl.height * ratio;
          const cellWidth = tw / tableEl.cols;
          const cellHeight = th / tableEl.rows;
          const borderWidth = tableEl.borderWidth * ratio;
          const defaultFontFamily = tableEl.defaultFontFamily || 'Arial, sans-serif';
          const defaultFontSize = tableEl.defaultFontSize || 12;

          // Background
          if (tableEl.backgroundColor && tableEl.backgroundColor !== '#ffffff') {
            ctx.fillStyle = tableEl.backgroundColor;
            ctx.fillRect(tx, ty, tw, th);
          }

          // Per-cell borders
          for (let row = 0; row < tableEl.rows; row++) {
            for (let col = 0; col < tableEl.cols; col++) {
              const cellKey = `${row}-${col}`;
              const cellStyle = tableEl.cellStyles?.[cellKey];
              const borders = cellStyle?.borders || {
                top: 'solid', bottom: 'solid', left: 'solid', right: 'solid'
              };

              const cx = tx + col * cellWidth;
              const cy = ty + row * cellHeight;

              const drawBorder = (
                style: string | undefined,
                x1: number, y1: number, x2: number, y2: number,
                isBottom: boolean
              ) => {
                if (!style || style === 'none') return;
                ctx.strokeStyle = tableEl.borderColor;

                if (style === 'double-underline' && isBottom) {
                  // Two parallel lines for double underline
                  const offset = Math.max(1, borderWidth);
                  ctx.lineWidth = borderWidth;
                  ctx.beginPath();
                  ctx.moveTo(x1, y1 - offset);
                  ctx.lineTo(x2, y2 - offset);
                  ctx.stroke();
                  ctx.beginPath();
                  ctx.moveTo(x1, y1 + offset);
                  ctx.lineTo(x2, y2 + offset);
                  ctx.stroke();
                  return;
                }

                if (style === 'underline' && isBottom) {
                  ctx.lineWidth = borderWidth * 2;
                } else {
                  ctx.lineWidth = borderWidth;
                }
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
              };

              drawBorder(borders.top, cx, cy, cx + cellWidth, cy, false);
              drawBorder(borders.bottom, cx, cy + cellHeight, cx + cellWidth, cy + cellHeight, true);
              drawBorder(borders.left, cx, cy, cx, cy + cellHeight, false);
              drawBorder(borders.right, cx + cellWidth, cy, cx + cellWidth, cy + cellHeight, false);
            }
          }

          // Cell text
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';

          for (let row = 0; row < tableEl.rows; row++) {
            for (let col = 0; col < tableEl.cols; col++) {
              const cellKey = `${row}-${col}`;
              const cellText = tableEl.cells[cellKey] || '';
              if (cellText) {
                const cellStyle = tableEl.cellStyles?.[cellKey];
                const fontFamily = cellStyle?.fontFamily || defaultFontFamily;
                const fontSize = (cellStyle?.fontSize || defaultFontSize) * ratio;
                ctx.font = `${fontSize}px ${fontFamily}`;
                const x = tx + col * cellWidth + 5 * ratio;
                const y = ty + row * cellHeight + cellHeight / 2;
                ctx.fillText(cellText, x, y);
              }
            }
          }
        });

        // Draw image elements (scaled)
        const imageElements = state.imageElements[page.id] || [];
        for (const imgEl of imageElements) {
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const w = imgEl.width * ratio;
              const h = imgEl.height * ratio;
              const cx = imgEl.x * ratio + w / 2;
              const cy = imgEl.y * ratio + h / 2;
              ctx.save();
              ctx.translate(cx, cy);
              ctx.rotate((imgEl.rotation * Math.PI) / 180);
              ctx.drawImage(img, -w / 2, -h / 2, w, h);
              ctx.restore();
              resolve();
            };
            img.onerror = () => resolve();
            img.src = imgEl.src;
          });
        }

        ctx.restore();

        // Embed as high-quality JPEG (much smaller than PNG, no visible quality loss
        // at this resolution). Page is created at target paper size, so the
        // high-res raster is rendered at high effective DPI when printed/viewed.
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const jpegBytes = jpegDataUrl.split(',')[1];
        const jpegImage = await pdfDoc.embedJpg(jpegBytes);

        const pdfPage = pdfDoc.addPage([targetWidth, targetHeight]);
        pdfPage.drawImage(jpegImage, {
          x: 0,
          y: 0,
          width: targetWidth,
          height: targetHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, '編輯後的文件.pdf');
    } catch (error) {
      console.error('匯出PDF時發生錯誤:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.pages, state.textElements, state.imageElements, state.lineElements, state.tableElements]);

  const exportPDF = useCallback(async (paperSize: string = 'a4', mode: 'vector' | 'raster' = 'vector') => {
    if (state.pages.length === 0) return;
    if (mode === 'raster' || !originalBytesRef.current) return exportRaster(paperSize);

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { bytes, missingChars } = await exportVector({
        original: originalBytesRef.current,
        pages: state.pages,
        textElements: state.textElements,
        imageElements: state.imageElements,
        lineElements: state.lineElements,
        tableElements: state.tableElements,
        displayScale: DISPLAY_SCALE,
        paperSize,
        fontUrl: `${import.meta.env.BASE_URL}fonts/NotoSansTC-subset.ttf`,
      });
      saveAs(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), '編輯後的文件.pdf');
      if (missingChars.length > 0) {
        toast({
          title: '部分文字無法顯示',
          description: `內建字型沒有這些字，匯出後會是空白：${missingChars.slice(0, 20).join(' ')}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('向量匯出失敗，改用整頁影像化：', error);
      toast({
        title: '無法保留原始內容，改用整頁影像化匯出',
        description: '這個檔案不適合向量匯出（例如已加密或含旋轉頁面）。匯出的檔案文字將無法選取。',
        variant: 'destructive',
      });
      setState(prev => ({ ...prev, isLoading: false }));
      return exportRaster(paperSize);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.pages, state.textElements, state.imageElements, state.lineElements, state.tableElements, exportRaster]);

  return {
    state,
    actions: {
      loadPDF,
      addTextElement,
      updateTextElement,
      deleteTextElement,
      addImageElement,
      updateImageElement,
      deleteImageElement,
      addLineElement,
      deleteLineElement,
      addTableElement,
      updateTableElement,
      deleteTableElement,
      eraseElement,
      setCurrentPage,
      setSelectedTool,
      exportPDF,
      undo,
      redo,
      zoomIn,
      zoomOut,
      goToPreviousPage,
      goToNextPage
    }
  };
};

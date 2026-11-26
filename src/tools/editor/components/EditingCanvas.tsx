import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PDFPage, TextElement, ImageElement, LineElement, TableElement } from '../types';
import { TextEditor } from './TextEditor';
import { TableEditor } from './TableEditor';

interface EditingCanvasProps {
  page: PDFPage;
  textElements: TextElement[];
  imageElements: ImageElement[];
  lineElements: LineElement[];
  tableElements: TableElement[];
  selectedTool: 'text' | 'edit-text' | 'line' | 'eraser' | 'table';
  zoom: number;
  onAddText: (x: number, y: number) => void;
  onUpdateText: (elementId: string, updates: Partial<TextElement>) => void;
  onDeleteText: (elementId: string) => void;
  onAddImage: (file: File, x: number, y: number) => void;
  onUpdateImage: (elementId: string, updates: Partial<ImageElement>) => void;
  onDeleteImage: (elementId: string) => void;
  onAddLine: (startX: number, startY: number, endX: number, endY: number) => void;
  onDeleteLine: (elementId: string) => void;
  onAddTable: (x: number, y: number) => void;
  onUpdateTable: (elementId: string, updates: Partial<TableElement>) => void;
  onDeleteTable: (elementId: string) => void;
  onErase: (x: number, y: number) => void;
}

export const EditingCanvas: React.FC<EditingCanvasProps> = ({
  page,
  textElements,
  imageElements,
  lineElements,
  tableElements,
  selectedTool,
  zoom,
  onAddText,
  onUpdateText,
  onDeleteText,
  onAddImage,
  onUpdateImage,
  onDeleteImage,
  onAddLine,
  onDeleteLine,
  onAddTable,
  onUpdateTable,
  onDeleteTable,
  onErase
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineStart, setLineStart] = useState<{ x: number; y: number } | null>(null);
  const [currentLineEnd, setCurrentLineEnd] = useState<{ x: number; y: number } | null>(null);
  const [editingTextElement, setEditingTextElement] = useState<TextElement | null>(null);
  const [editingTableElement, setEditingTableElement] = useState<TableElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Render PDF page to canvas
  useEffect(() => {
    if (canvasRef.current && page.canvas) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        canvasRef.current.width = page.width;
        canvasRef.current.height = page.height;
        ctx.drawImage(page.canvas, 0, 0);
      }
    }
  }, [page]);

  const getRelativeCoordinates = useCallback((e: React.MouseEvent): { x: number; y: number } => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    return { x, y };
  }, [zoom]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const { x, y } = getRelativeCoordinates(e);

    switch (selectedTool) {
      case 'text':
        onAddText(x, y);
        break;
      case 'table':
        onAddTable(x, y);
        break;
      case 'eraser':
        onErase(x, y);
        break;
      default:
        setSelectedElement(null);
        break;
    }
  }, [selectedTool, getRelativeCoordinates, onAddText, onAddTable, onErase]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (selectedTool === 'line') {
      const { x, y } = getRelativeCoordinates(e);
      setIsDrawingLine(true);
      setLineStart({ x, y });
      setCurrentLineEnd({ x, y });
    }
  }, [selectedTool, getRelativeCoordinates]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawingLine && lineStart) {
      const { x, y } = getRelativeCoordinates(e);
      setCurrentLineEnd({ x, y });
    }
    
    if (isDragging && selectedElement) {
      const { x, y } = getRelativeCoordinates(e);
      
      // Update text element position
      const textElement = textElements.find(el => el.id === selectedElement);
      if (textElement) {
        onUpdateText(selectedElement, {
          x: x - dragOffset.x,
          y: y - dragOffset.y
        });
      }
      
      // Update image element position
      const imageElement = imageElements.find(el => el.id === selectedElement);
      if (imageElement) {
        onUpdateImage(selectedElement, {
          x: x - dragOffset.x,
          y: y - dragOffset.y
        });
      }
      
      // Update table element position
      const tableElement = tableElements.find(el => el.id === selectedElement);
      if (tableElement) {
        onUpdateTable(selectedElement, {
          x: x - dragOffset.x,
          y: y - dragOffset.y
        });
      }
    }
  }, [isDrawingLine, lineStart, getRelativeCoordinates, isDragging, selectedElement, textElements, imageElements, tableElements, dragOffset, onUpdateText, onUpdateImage, onUpdateTable]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDrawingLine && lineStart) {
      const { x, y } = getRelativeCoordinates(e);
      onAddLine(lineStart.x, lineStart.y, x, y);
      setIsDrawingLine(false);
      setLineStart(null);
      setCurrentLineEnd(null);
    }
    
    setIsDragging(false);
  }, [isDrawingLine, lineStart, getRelativeCoordinates, onAddLine]);

  const handleTextElementClick = useCallback((e: React.MouseEvent, element: TextElement) => {
    e.stopPropagation();
    
    if (selectedTool === 'edit-text') {
      setEditingTextElement(element);
    } else if (selectedTool === 'eraser') {
      onDeleteText(element.id);
    } else {
      setSelectedElement(element.id);
      const { x, y } = getRelativeCoordinates(e);
      setDragOffset({ x: x - element.x, y: y - element.y });
    }
  }, [selectedTool, onDeleteText, getRelativeCoordinates]);

  const handleTextElementMouseDown = useCallback((e: React.MouseEvent, element: TextElement) => {
    if (selectedTool !== 'edit-text' && selectedTool !== 'eraser') {
      e.stopPropagation();
      setSelectedElement(element.id);
      setIsDragging(true);
      const { x, y } = getRelativeCoordinates(e);
      setDragOffset({ x: x - element.x, y: y - element.y });
    }
  }, [selectedTool, getRelativeCoordinates]);

  const handleImageElementClick = useCallback((e: React.MouseEvent, element: ImageElement) => {
    e.stopPropagation();
    
    if (selectedTool === 'eraser') {
      onDeleteImage(element.id);
    } else {
      setSelectedElement(element.id);
      const { x, y } = getRelativeCoordinates(e);
      setDragOffset({ x: x - element.x, y: y - element.y });
    }
  }, [selectedTool, onDeleteImage, getRelativeCoordinates]);

  const handleImageElementMouseDown = useCallback((e: React.MouseEvent, element: ImageElement) => {
    if (selectedTool !== 'eraser') {
      e.stopPropagation();
      setSelectedElement(element.id);
      setIsDragging(true);
      const { x, y } = getRelativeCoordinates(e);
      setDragOffset({ x: x - element.x, y: y - element.y });
    }
  }, [selectedTool, getRelativeCoordinates]);

  const handleLineElementClick = useCallback((e: React.MouseEvent, element: LineElement) => {
    e.stopPropagation();
    
    if (selectedTool === 'eraser') {
      onDeleteLine(element.id);
    } else {
      setSelectedElement(element.id);
    }
  }, [selectedTool, onDeleteLine]);

  const handleTableElementClick = useCallback((e: React.MouseEvent, element: TableElement) => {
    e.stopPropagation();
    
    if (selectedTool === 'edit-text') {
      setEditingTableElement(element);
    } else if (selectedTool === 'eraser') {
      onDeleteTable(element.id);
    } else {
      setSelectedElement(element.id);
      const { x, y } = getRelativeCoordinates(e);
      setDragOffset({ x: x - element.x, y: y - element.y });
    }
  }, [selectedTool, onDeleteTable, getRelativeCoordinates]);

  const handleTableElementMouseDown = useCallback((e: React.MouseEvent, element: TableElement) => {
    if (selectedTool !== 'edit-text' && selectedTool !== 'eraser') {
      e.stopPropagation();
      setSelectedElement(element.id);
      setIsDragging(true);
      const { x, y } = getRelativeCoordinates(e);
      setDragOffset({ x: x - element.x, y: y - element.y });
    }
  }, [selectedTool, getRelativeCoordinates]);

  const getCursorStyle = (): string => {
    switch (selectedTool) {
      case 'text':
        return 'text';
      case 'edit-text':
        return 'pointer';
      case 'line':
        return 'crosshair';
      case 'eraser':
        return 'pointer';
      case 'table':
        return 'cell';
      default:
        return 'default';
    }
  };

  return (
    <div className="flex-1 bg-gray-100 overflow-auto p-8">
      <div 
        ref={containerRef}
        className="relative bg-white shadow-lg mx-auto"
        style={{
          width: page.width * zoom,
          height: page.height * zoom,
          cursor: getCursorStyle()
        }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* PDF Page Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0"
          style={{
            width: page.width * zoom,
            height: page.height * zoom
          }}
        />

        {/* Text Elements */}
        {textElements.map((element) => (
          <div
            key={element.id}
            className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              left: element.x * zoom,
              top: element.y * zoom,
              fontSize: element.fontSize * zoom,
              fontFamily: element.fontFamily,
              color: element.color,
              fontWeight: element.fontWeight || 'normal',
              fontStyle: element.fontStyle || 'normal',
              textDecoration: element.textDecoration || 'none',
              textAlign: element.textAlign || 'left',
              whiteSpace: 'pre-wrap',
              minWidth: '20px',
              minHeight: '20px',
              padding: '2px'
            }}
            onClick={(e) => handleTextElementClick(e, element)}
            onMouseDown={(e) => handleTextElementMouseDown(e, element)}
          >
            {element.text || '新增文字'}
          </div>
        ))}

        {/* Image Elements */}
        {imageElements.map((element) => (
          <div
            key={element.id}
            className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              left: element.x * zoom,
              top: element.y * zoom,
              width: element.width * zoom,
              height: element.height * zoom,
              transform: `rotate(${element.rotation}deg)`
            }}
            onClick={(e) => handleImageElementClick(e, element)}
            onMouseDown={(e) => handleImageElementMouseDown(e, element)}
          >
            <img
              src={element.src}
              alt="Inserted image"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>
        ))}

        {/* Line Elements */}
        {lineElements.map((element) => (
          <svg
            key={element.id}
            className={`absolute top-0 left-0 pointer-events-none ${selectedElement === element.id ? 'drop-shadow-lg' : ''}`}
            style={{
              width: page.width * zoom,
              height: page.height * zoom
            }}
          >
            <line
              x1={element.startX * zoom}
              y1={element.startY * zoom}
              x2={element.endX * zoom}
              y2={element.endY * zoom}
              stroke={element.color}
              strokeWidth={element.width * zoom}
              strokeDasharray={element.style === 'dashed' ? '10,5' : element.style === 'dotted' ? '2,2' : 'none'}
              className="pointer-events-auto cursor-pointer"
              onClick={(e) => handleLineElementClick(e as any, element)}
            />
          </svg>
        ))}

        {/* Table Elements */}
        {tableElements.map((element) => {
          const defaultFontFamily = element.defaultFontFamily || 'Arial, sans-serif';
          const defaultFontSize = element.defaultFontSize || 12;
          
          const getCellBorderStyle = (cellKey: string, side: 'top' | 'bottom' | 'left' | 'right'): string => {
            const cellStyle = element.cellStyles?.[cellKey];
            const borderStyle = cellStyle?.borders?.[side] || 'solid';
            const borderWidth = element.borderWidth;
            const borderColor = element.borderColor;
            
            switch (borderStyle) {
              case 'none':
                return 'none';
              case 'solid':
                return `${borderWidth * zoom}px solid ${borderColor}`;
              case 'underline':
                return side === 'bottom' ? `${borderWidth * 2 * zoom}px solid ${borderColor}` : `${borderWidth * zoom}px solid ${borderColor}`;
              case 'double-underline':
                return side === 'bottom' ? `${borderWidth * 2 * zoom}px double ${borderColor}` : `${borderWidth * zoom}px solid ${borderColor}`;
              default:
                return `${borderWidth * zoom}px solid ${borderColor}`;
            }
          };
          
          return (
            <div
              key={element.id}
              className={`absolute cursor-move ${selectedElement === element.id ? 'ring-2 ring-blue-500' : ''}`}
              style={{
                left: element.x * zoom,
                top: element.y * zoom,
                width: element.width * zoom,
                height: element.height * zoom
              }}
              onClick={(e) => handleTableElementClick(e, element)}
              onMouseDown={(e) => handleTableElementMouseDown(e, element)}
            >
              <table
                className="w-full h-full"
                style={{
                  borderCollapse: 'collapse'
                }}
              >
                <tbody>
                  {Array.from({ length: element.rows }, (_, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.from({ length: element.cols }, (_, colIndex) => {
                        const cellKey = `${rowIndex}-${colIndex}`;
                        const cellStyle = element.cellStyles?.[cellKey];
                        const fontFamily = cellStyle?.fontFamily || defaultFontFamily;
                        const fontSize = cellStyle?.fontSize || defaultFontSize;
                        
                        return (
                          <td
                            key={colIndex}
                            style={{
                              borderTop: getCellBorderStyle(cellKey, 'top'),
                              borderBottom: getCellBorderStyle(cellKey, 'bottom'),
                              borderLeft: getCellBorderStyle(cellKey, 'left'),
                              borderRight: getCellBorderStyle(cellKey, 'right'),
                              backgroundColor: element.backgroundColor,
                              width: element.cellWidth * zoom,
                              height: element.cellHeight * zoom,
                              fontFamily: fontFamily,
                              fontSize: fontSize * zoom,
                              padding: 4 * zoom
                            }}
                          >
                            {element.cells[cellKey] || ''}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Drawing Line Preview */}
        {isDrawingLine && lineStart && currentLineEnd && (
          <svg
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: page.width * zoom,
              height: page.height * zoom
            }}
          >
            <line
              x1={lineStart.x * zoom}
              y1={lineStart.y * zoom}
              x2={currentLineEnd.x * zoom}
              y2={currentLineEnd.y * zoom}
              stroke="#000000"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
          </svg>
        )}

        {/* Text Editor Overlay */}
        {editingTextElement && (
          <TextEditor
            element={editingTextElement}
            scale={zoom}
            onUpdate={onUpdateText}
            onComplete={() => setEditingTextElement(null)}
          />
        )}

        {/* Table Editor Overlay */}
        {editingTableElement && (
          <TableEditor
            element={editingTableElement}
            scale={zoom}
            onUpdate={onUpdateTable}
            onComplete={() => setEditingTableElement(null)}
          />
        )}
      </div>
    </div>
  );
};

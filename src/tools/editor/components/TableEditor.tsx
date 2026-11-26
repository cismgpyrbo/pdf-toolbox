import React, { useState, useRef, useEffect } from 'react';
import { TableElement, TableCellStyle, TableCellBorders, CellBorderStyle } from '../types';
import { 
  Check,
  X,
  Plus,
  Minus,
  Palette,
  Type,
  Underline,
  SeparatorHorizontal
} from 'lucide-react';

// Available fonts
const FONT_FAMILIES = [
  { label: '預設', value: 'Arial, sans-serif' },
  { label: '微軟正黑體', value: '"Microsoft JhengHei", sans-serif' },
  { label: '新細明體', value: '"PMingLiU", serif' },
  { label: '標楷體', value: '"DFKai-SB", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
];

// Available font sizes
const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

// Border style options
const BORDER_STYLES: { label: string; value: CellBorderStyle }[] = [
  { label: '無', value: 'none' },
  { label: '實線', value: 'solid' },
  { label: '底線', value: 'underline' },
  { label: '雙底線', value: 'double-underline' },
];

interface TableEditorProps {
  element: TableElement;
  scale: number;
  onUpdate: (elementId: string, updates: Partial<TableElement>) => void;
  onComplete: () => void;
}

export const TableEditor: React.FC<TableEditorProps> = ({
  element,
  scale,
  onUpdate,
  onComplete
}) => {
  const [rows, setRows] = useState(element.rows);
  const [cols, setCols] = useState(element.cols);
  const [borderColor, setBorderColor] = useState(element.borderColor);
  const [borderWidth, setBorderWidth] = useState(element.borderWidth);
  const [backgroundColor, setBackgroundColor] = useState(element.backgroundColor);
  const [cells, setCells] = useState(element.cells);
  const [cellStyles, setCellStyles] = useState<Record<string, TableCellStyle>>(element.cellStyles || {});
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [defaultFontFamily, setDefaultFontFamily] = useState(element.defaultFontFamily || 'Arial, sans-serif');
  const [defaultFontSize, setDefaultFontSize] = useState(element.defaultFontSize || 12);
  const [selectedCellForBorder, setSelectedCellForBorder] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize cells if they don't exist
    const newCells = { ...cells };
    const newCellStyles = { ...cellStyles };
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellKey = `${row}-${col}`;
        if (!newCells[cellKey]) {
          newCells[cellKey] = '';
        }
        if (!newCellStyles[cellKey]) {
          newCellStyles[cellKey] = {
            fontFamily: defaultFontFamily,
            fontSize: defaultFontSize
          };
        }
      }
    }
    setCells(newCells);
    setCellStyles(newCellStyles);
  }, [rows, cols]);

  const handleSave = () => {
    const { width, height } = calculateOptimalDimensions();
    const cellWidth = width / cols;
    const cellHeight = height / rows;

    const updates: Partial<TableElement> = {
      rows,
      cols,
      width,
      height,
      cellWidth,
      cellHeight,
      borderColor,
      borderWidth,
      backgroundColor,
      cells,
      cellStyles,
      defaultFontFamily,
      defaultFontSize
    };

    onUpdate(element.id, updates);
    onComplete();
  };

  const handleCancel = () => {
    onComplete();
  };

  const handleCellChange = (cellKey: string, value: string) => {
    setCells(prev => ({
      ...prev,
      [cellKey]: value
    }));
  };

  const handleCellClick = (cellKey: string) => {
    setEditingCell(cellKey);
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleCellFontFamilyChange = (cellKey: string, fontFamily: string) => {
    setCellStyles(prev => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        fontFamily
      }
    }));
  };

  const handleCellFontSizeChange = (cellKey: string, fontSize: number) => {
    setCellStyles(prev => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        fontSize
      }
    }));
  };

  const applyDefaultStyleToAll = () => {
    const newCellStyles = { ...cellStyles };
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellKey = `${row}-${col}`;
        newCellStyles[cellKey] = {
          fontFamily: defaultFontFamily,
          fontSize: defaultFontSize
        };
      }
    }
    setCellStyles(newCellStyles);
  };

  const getCellStyle = (cellKey: string): TableCellStyle => {
    return cellStyles[cellKey] || {
      fontFamily: defaultFontFamily,
      fontSize: defaultFontSize,
      borders: { top: 'solid', bottom: 'solid', left: 'solid', right: 'solid' }
    };
  };

  const handleCellBorderChange = (cellKey: string, side: keyof TableCellBorders, style: CellBorderStyle) => {
    setCellStyles(prev => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        fontFamily: prev[cellKey]?.fontFamily || defaultFontFamily,
        fontSize: prev[cellKey]?.fontSize || defaultFontSize,
        borders: {
          ...prev[cellKey]?.borders,
          [side]: style
        }
      }
    }));
  };

  const applyBorderToAllCells = (side: keyof TableCellBorders, style: CellBorderStyle) => {
    const newCellStyles = { ...cellStyles };
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cellKey = `${row}-${col}`;
        newCellStyles[cellKey] = {
          ...newCellStyles[cellKey],
          fontFamily: newCellStyles[cellKey]?.fontFamily || defaultFontFamily,
          fontSize: newCellStyles[cellKey]?.fontSize || defaultFontSize,
          borders: {
            ...newCellStyles[cellKey]?.borders,
            [side]: style
          }
        };
      }
    }
    setCellStyles(newCellStyles);
  };

  const getCellBorderStyle = (cellKey: string, side: keyof TableCellBorders): string => {
    const cellStyle = getCellStyle(cellKey);
    const borderStyle = cellStyle.borders?.[side] || 'solid';
    
    switch (borderStyle) {
      case 'none':
        return 'none';
      case 'solid':
        return `${borderWidth}px solid ${borderColor}`;
      case 'underline':
        return side === 'bottom' ? `${borderWidth * 2}px solid ${borderColor}` : `${borderWidth}px solid ${borderColor}`;
      case 'double-underline':
        return side === 'bottom' ? `${borderWidth * 2}px double ${borderColor}` : `${borderWidth}px solid ${borderColor}`;
      default:
        return `${borderWidth}px solid ${borderColor}`;
    }
  };

  const calculateOptimalDimensions = () => {
    const minCellWidth = 80;
    const minCellHeight = 30;
    const maxTableWidth = 600;
    const maxTableHeight = 400;

    let optimalWidth = Math.max(minCellWidth * cols, element.width);
    let optimalHeight = Math.max(minCellHeight * rows, element.height);

    if (optimalWidth > maxTableWidth) {
      optimalWidth = maxTableWidth;
    }

    if (optimalHeight > maxTableHeight) {
      optimalHeight = maxTableHeight;
    }

    return { width: optimalWidth, height: optimalHeight };
  };

  const addRow = () => {
    setRows(prev => prev + 1);
  };

  const removeRow = () => {
    if (rows > 1) {
      setRows(prev => prev - 1);
    }
  };

  const addCol = () => {
    setCols(prev => prev + 1);
  };

  const removeCol = () => {
    if (cols > 1) {
      setCols(prev => prev - 1);
    }
  };

  const editorStyle = {
    position: 'absolute' as const,
    left: `${element.x + 16}px`,
    top: `${element.y + 16}px`,
    zIndex: 1000,
    minWidth: '400px'
  };

  const commonColors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  return (
    <div ref={editorRef} style={editorStyle} className="bg-white border-2 border-blue-500 rounded-lg shadow-xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          {/* Table Size Controls */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600">行:</span>
            <button onClick={removeRow} className="p-1 hover:bg-gray-200 rounded">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-medium w-6 text-center">{rows}</span>
            <button onClick={addRow} className="p-1 hover:bg-gray-200 rounded">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600">列:</span>
            <button onClick={removeCol} className="p-1 hover:bg-gray-200 rounded">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-medium w-6 text-center">{cols}</span>
            <button onClick={addCol} className="p-1 hover:bg-gray-200 rounded">
              <Plus className="w-3 h-3" />
            </button>
          </div>

          <div className="w-px h-4 bg-gray-300" />

          {/* Border Width */}
          <div className="flex items-center space-x-1">
            <span className="text-xs text-gray-600">邊框:</span>
            <input
              type="number"
              value={borderWidth}
              onChange={(e) => setBorderWidth(Number(e.target.value))}
              className="w-12 text-xs border border-gray-300 rounded px-1 py-1"
              min="0"
              max="10"
            />
          </div>

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowFontPicker(false);
              }}
              className="p-1 rounded hover:bg-gray-200 flex items-center"
            >
              <Palette className="w-3 h-3" />
              <div 
                className="w-3 h-2 ml-1 border border-gray-300 rounded"
                style={{ backgroundColor: borderColor }}
              />
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-10">
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {commonColors.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setBorderColor(c);
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-gray-300" />

          {/* Font Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowFontPicker(!showFontPicker);
                setShowColorPicker(false);
                setShowBorderPicker(false);
              }}
              className="p-1 rounded hover:bg-gray-200 flex items-center"
              title="字體設定"
            >
              <Type className="w-3 h-3" />
              <span className="text-xs ml-1">字體</span>
            </button>

            {showFontPicker && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[280px]">
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">預設字體</label>
                  <select
                    value={defaultFontFamily}
                    onChange={(e) => setDefaultFontFamily(e.target.value)}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {FONT_FAMILIES.map(font => (
                      <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                        {font.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-1">預設字體大小</label>
                  <select
                    value={defaultFontSize}
                    onChange={(e) => setDefaultFontSize(Number(e.target.value))}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {FONT_SIZES.map(size => (
                      <option key={size} value={size}>{size}px</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    applyDefaultStyleToAll();
                    setShowFontPicker(false);
                  }}
                  className="w-full text-xs bg-blue-500 text-white rounded px-2 py-1 hover:bg-blue-600"
                >
                  套用到所有儲存格
                </button>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    預覽: <span style={{ fontFamily: defaultFontFamily, fontSize: `${defaultFontSize}px` }}>範例文字 ABC 123</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-gray-300" />

          {/* Border Style Picker */}
          <div className="relative">
            <button
              onClick={() => {
                setShowBorderPicker(!showBorderPicker);
                setShowColorPicker(false);
                setShowFontPicker(false);
              }}
              className="p-1 rounded hover:bg-gray-200 flex items-center"
              title="框線樣式"
            >
              <Underline className="w-3 h-3" />
              <span className="text-xs ml-1">框線</span>
            </button>

            {showBorderPicker && (
              <div className="absolute top-full left-0 mt-1 p-3 bg-white border border-gray-300 rounded shadow-lg z-10 min-w-[280px]">
                <div className="mb-3">
                  <label className="block text-xs text-gray-600 mb-2 font-medium">套用框線樣式到所有儲存格</label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-16">上框線:</span>
                      <select
                        onChange={(e) => applyBorderToAllCells('top', e.target.value as CellBorderStyle)}
                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                        defaultValue="solid"
                      >
                        {BORDER_STYLES.map(style => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-16">下框線:</span>
                      <select
                        onChange={(e) => applyBorderToAllCells('bottom', e.target.value as CellBorderStyle)}
                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                        defaultValue="solid"
                      >
                        {BORDER_STYLES.map(style => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-16">左框線:</span>
                      <select
                        onChange={(e) => applyBorderToAllCells('left', e.target.value as CellBorderStyle)}
                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                        defaultValue="solid"
                      >
                        {BORDER_STYLES.map(style => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-16">右框線:</span>
                      <select
                        onChange={(e) => applyBorderToAllCells('right', e.target.value as CellBorderStyle)}
                        className="flex-1 text-xs border border-gray-300 rounded px-2 py-1"
                        defaultValue="solid"
                      >
                        {BORDER_STYLES.map(style => (
                          <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-16 border-b-2 border-black"></span>
                      <span>底線</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-16 border-b-4 border-double border-black"></span>
                      <span>雙底線</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowBorderPicker(false)}
                  className="w-full mt-3 text-xs bg-gray-500 text-white rounded px-2 py-1 hover:bg-gray-600"
                >
                  關閉
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleSave}
            className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
            title="儲存表格"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
            title="取消"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Table Preview */}
      <div className="p-4">
        <div className="text-xs text-gray-600 mb-2">
          預覽 ({rows} 行 × {cols} 列)
        </div>
        <div className="border border-gray-300 rounded overflow-hidden overflow-x-auto max-h-96">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {Array.from({ length: rows }, (_, rowIndex) => (
                <tr key={rowIndex}>
                  {Array.from({ length: cols }, (_, colIndex) => {
                    const cellKey = `${rowIndex}-${colIndex}`;
                    const isEditing = editingCell === cellKey;
                    const cellStyle = getCellStyle(cellKey);
                    
                    return (
                      <td
                        key={colIndex}
                        className="p-1 min-w-[100px] relative group"
                        style={{
                          borderTop: getCellBorderStyle(cellKey, 'top'),
                          borderBottom: getCellBorderStyle(cellKey, 'bottom'),
                          borderLeft: getCellBorderStyle(cellKey, 'left'),
                          borderRight: getCellBorderStyle(cellKey, 'right'),
                          backgroundColor: backgroundColor,
                          fontFamily: cellStyle.fontFamily,
                          fontSize: `${cellStyle.fontSize}px`
                        }}
                        onClick={() => handleCellClick(cellKey)}
                      >
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={cells[cellKey] || ''}
                              onChange={(e) => handleCellChange(cellKey, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCellBlur();
                                }
                              }}
                              className="w-full border-none outline-none bg-blue-50 px-1 py-0.5 rounded"
                              style={{
                                fontFamily: cellStyle.fontFamily,
                                fontSize: `${cellStyle.fontSize}px`
                              }}
                              autoFocus
                            />
                            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded">
                              <select
                                value={cellStyle.fontFamily}
                                onChange={(e) => handleCellFontFamilyChange(cellKey, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5 flex-1 min-w-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {FONT_FAMILIES.map(font => (
                                  <option key={font.value} value={font.value}>
                                    {font.label}
                                  </option>
                                ))}
                              </select>
                              <select
                                value={cellStyle.fontSize}
                                onChange={(e) => handleCellFontSizeChange(cellKey, Number(e.target.value))}
                                className="text-xs border border-gray-300 rounded px-1 py-0.5 w-16"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {FONT_SIZES.map(size => (
                                  <option key={size} value={size}>{size}px</option>
                                ))}
                              </select>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCellBlur();
                                }}
                                className="text-xs bg-blue-500 text-white rounded px-2 py-0.5 hover:bg-blue-600"
                              >
                                確定
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer min-h-[24px] flex items-center"
                            style={{
                              fontFamily: cellStyle.fontFamily,
                              fontSize: `${cellStyle.fontSize}px`
                            }}
                          >
                            {cells[cellKey] || <span className="text-gray-400 text-xs">點擊輸入</span>}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          點擊儲存格可編輯文字並選擇字體樣式
        </div>
      </div>
    </div>
  );
};

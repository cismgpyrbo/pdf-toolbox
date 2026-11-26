import React, { useState, useRef, useEffect } from 'react';
import { TextElement } from '../types';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Palette,
  Type,
  Check,
  X
} from 'lucide-react';

interface TextEditorProps {
  element: TextElement;
  scale: number;
  onUpdate: (elementId: string, updates: Partial<TextElement>) => void;
  onComplete: () => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  element,
  scale,
  onUpdate,
  onComplete
}) => {
  const [text, setText] = useState(element.text);
  const [fontSize, setFontSize] = useState(element.fontSize);
  const [fontFamily, setFontFamily] = useState(element.fontFamily);
  const [color, setColor] = useState(element.color);
  const [isBold, setIsBold] = useState(element.fontWeight === 'bold');
  const [isItalic, setIsItalic] = useState(element.fontStyle === 'italic');
  const [isUnderline, setIsUnderline] = useState(element.textDecoration === 'underline');
  const [textAlign, setTextAlign] = useState(element.textAlign || 'left');
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

  const handleSave = () => {
    const updates: Partial<TextElement> = {
      text,
      fontSize,
      fontFamily,
      color,
      fontWeight: isBold ? 'bold' : 'normal',
      fontStyle: isItalic ? 'italic' : 'normal',
      textDecoration: isUnderline ? 'underline' : 'none',
      textAlign
    };
    
    onUpdate(element.id, updates);
    onComplete();
  };

  const handleCancel = () => {
    onComplete();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const fontFamilies = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
    'Microsoft JhengHei',
    'SimSun',
    'SimHei'
  ];

  const commonColors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
    '#FF00FF', '#00FFFF', '#FFA500', '#800080'
  ];

  const editorStyle = {
    position: 'absolute' as const,
    left: `${element.x + 16}px`,
    top: `${element.y + 16}px`,
    zIndex: 1000,
    minWidth: '300px'
  };

  return (
    <div ref={editorRef} style={editorStyle} className="bg-white border-2 border-blue-500 rounded-lg shadow-xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-1">
          {/* Font Family */}
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>

          {/* Font Size */}
          <input
            type="number"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-12 text-xs border border-gray-300 rounded px-1 py-1"
            min="8"
            max="72"
          />

          <div className="w-px h-4 bg-gray-300" />

          {/* Format Buttons */}
          <button
            onClick={() => setIsBold(!isBold)}
            className={`p-1 rounded ${isBold ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          >
            <Bold className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`p-1 rounded ${isItalic ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          >
            <Italic className="w-3 h-3" />
          </button>

          <button
            onClick={() => setIsUnderline(!isUnderline)}
            className={`p-1 rounded ${isUnderline ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          >
            <Underline className="w-3 h-3" />
          </button>

          <div className="w-px h-4 bg-gray-300" />

          {/* Alignment */}
          <button
            onClick={() => setTextAlign('left')}
            className={`p-1 rounded ${textAlign === 'left' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          >
            <AlignLeft className="w-3 h-3" />
          </button>

          <button
            onClick={() => setTextAlign('center')}
            className={`p-1 rounded ${textAlign === 'center' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          >
            <AlignCenter className="w-3 h-3" />
          </button>

          <button
            onClick={() => setTextAlign('right')}
            className={`p-1 rounded ${textAlign === 'right' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'}`}
          >
            <AlignRight className="w-3 h-3" />
          </button>

          <div className="w-px h-4 bg-gray-300" />

          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 rounded hover:bg-gray-200 flex items-center"
            >
              <Palette className="w-3 h-3" />
              <div 
                className="w-3 h-2 ml-1 border border-gray-300 rounded"
                style={{ backgroundColor: color }}
              />
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-10">
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {commonColors.map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setColor(c);
                        setShowColorPicker(false);
                      }}
                      className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleSave}
            className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
            title="儲存 (Ctrl+Enter)"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
            title="取消 (Esc)"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Text Area */}
      <div className="p-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full min-h-[100px] p-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily,
            color,
            fontWeight: isBold ? 'bold' : 'normal',
            fontStyle: isItalic ? 'italic' : 'normal',
            textDecoration: isUnderline ? 'underline' : 'none',
            textAlign: textAlign as any
          }}
          placeholder="輸入文字內容..."
        />
        <div className="text-xs text-gray-500 mt-1">
          Ctrl+Enter 儲存 • Esc 取消
        </div>
      </div>
    </div>
  );
};
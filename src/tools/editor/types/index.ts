export interface PDFPage {
  id: string;
  pageNumber: number;
  canvas: HTMLCanvasElement;
  thumbnail: string;
  width: number;
  height: number;
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  width?: number;
  height?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  textAlign?: 'left' | 'center' | 'right';
}

export interface ImageElement {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export interface LineElement {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
  style: 'solid' | 'dashed' | 'dotted';
}

export type CellBorderStyle = 'none' | 'solid' | 'underline' | 'double-underline';

export interface TableCellBorders {
  top?: CellBorderStyle;
  bottom?: CellBorderStyle;
  left?: CellBorderStyle;
  right?: CellBorderStyle;
}

export interface TableCellStyle {
  fontFamily: string;
  fontSize: number;
  borders?: TableCellBorders;
}

export interface TableElement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  cols: number;
  cellWidth: number;
  cellHeight: number;
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  cells: Record<string, string>; // key: "row-col", value: text content
  cellStyles?: Record<string, TableCellStyle>; // key: "row-col", value: style settings
  defaultFontFamily?: string;
  defaultFontSize?: number;
}

export interface EditAction {
  id: string;
  type: 'add-text' | 'modify-text' | 'delete-text' | 'add-image' | 'add-line' | 'delete-line' | 'add-table' | 'modify-table' | 'delete-table' | 'move-element' | 'delete-page' | 'erase';
  pageId: string;
  data: any;
  timestamp: number;
}

export interface EditorState {
  pages: PDFPage[];
  currentPageId: string | null;
  textElements: Record<string, TextElement[]>;
  imageElements: Record<string, ImageElement[]>;
  lineElements: Record<string, LineElement[]>;
  tableElements: Record<string, TableElement[]>;
  history: EditAction[];
  historyIndex: number;
  isLoading: boolean;
  selectedTool: 'text' | 'edit-text' | 'line' | 'eraser' | 'table';
  zoom: number;
}

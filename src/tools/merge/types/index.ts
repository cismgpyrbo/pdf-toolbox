export interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pages?: number;
}

export interface MergeProgress {
  isProcessing: boolean;
  currentFile: string;
  progress: number;
  totalFiles: number;
}
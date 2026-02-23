/**
 * 文件相关类型定义
 */

export interface ExcelSheet {
  name: string;
  index: number;
}

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface UploadResult {
  success: boolean;
  message: string;
  apiCallCount?: number;
  syncCount?: number;
  syncedTables?: string[];
  syncError?: string;
  syncResult?: {
    msg: string;
    apiCallCount: number;
    syncCount: number;
    fieldNames?: string[];
    syncError?: string;
  };
  fileKey?: string;
  fileUrl?: string;
}

export type UploadStatus = 'idle' | 'uploading' | 'syncing' | 'success' | 'error';

export interface UploadProgress {
  status: UploadStatus;
  currentStep: string;
  progress: number;
  loaded?: number;
  total?: number;
  percentage?: number;
}

export type InputMode = 'file' | 'paste';

export interface PasteData {
  content: string;
  timestamp: number;
}

export interface ExcelRow {
  [key: string]: any;
}

export interface ExcelParseResult {
  sheets: ExcelSheet[];
  data: Record<string, ExcelRow[]>;
}

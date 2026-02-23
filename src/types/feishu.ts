/**
 * 飞书相关类型定义
 */

export interface FeishuTable {
  id: string;
  name: string;
}

export interface FeishuField {
  id: string;
  field_name: string;
  name?: string;
  type: string;
}

export interface FeishuRecord {
  id: string;
  fields: Record<string, any>;
}

export interface FieldMatchResult {
  excelField: string;
  feishuField: string | null;
  matched: boolean;
  similarity?: number;
}

export interface SubTableConfig {
  tableId: string;
  sheetName: string;
  fieldMatches: FieldMatchResult[];
}

export interface TableConfig {
  tableId: string;
  tableName: string;
  sheetName: string;
  fieldMatches: FieldMatchResult[];
  subTableConfigs?: any[];
}

export interface SyncResult {
  msg: string;
  success: boolean;
  apiCallCount: number;
  syncCount: number;
}

export interface SyncError {
  tableId: string;
  tableName: string;
  error: string;
}

export interface BatchSyncResult {
  success: boolean;
  results: TableSyncResult[];
  totalApiCallCount: number;
  totalSyncCount: number;
}

export interface TableSyncResult {
  tableId: string;
  tableName: string;
  syncResult: SyncResult;
}

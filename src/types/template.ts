/**
 * 历史模版类型定义
 */

export interface HistoryTemplate {
  id: string;
  name: string;
  remark?: string;
  feishuUrl?: string;
  spreadsheetToken: string;
  selectedTableIds: string[];
  selectedTableNames?: string[];
  tableToSheetMapping?: Record<string, string>;
  tableFields?: Record<string, any[]>;
  fieldMatchResults?: Record<string, any[]>;
  inputMode?: 'file' | 'paste';
  pastedContent?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  tableCount: number;
}

export interface TemplateExportData {
  version: string;
  exportTime: string;
  templates: HistoryTemplate[];
}

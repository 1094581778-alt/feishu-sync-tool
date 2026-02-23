/**
 * 类型定义统一导出
 */

// 飞书相关类型
export type {
  FeishuTable,
  FeishuField,
  FeishuRecord,
  FieldMatchResult,
  SubTableConfig,
  TableConfig,
  SyncResult,
  SyncError,
  BatchSyncResult,
} from './feishu';

// 文件相关类型
export type {
  ExcelSheet,
  FileInfo,
  UploadResult,
  UploadStatus,
  UploadProgress,
  PasteData,
  InputMode,
  ExcelRow,
  ExcelParseResult,
} from './file';

// 历史模版类型
export type {
  HistoryTemplate,
  TemplateMetadata,
  TemplateExportData,
} from './template';

// 应用状态类型
export type {
  Step,
  FeishuConfig,
  UrlHistory,
  AppState,
  AppAction,
} from './app';

/**
 * 定时任务相关类型定义
 */

export type TriggerMode = 'fixed_time' | 'cron';

export type FileNameMatchMode = 'exact' | 'fuzzy';

export type TimeFilterQuickOption = 'today' | 'yesterday' | 'this_week' | 'custom';

export type TaskStatus = 'idle' | 'running' | 'success' | 'failed' | 'paused';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  createdAt: string;
  modifiedAt: string;
  extension: string;
  isExcel: boolean;
}

export interface FileNameFilter {
  mode: FileNameMatchMode;
  pattern: string;
}

export interface TimeFilter {
  quickOption: TimeFilterQuickOption;
  startTime?: string;
  endTime?: string;
}

export interface FileFilterConfig {
  fileName: FileNameFilter;
  time: TimeFilter;
}

export interface ScheduledTaskConfig {
  id: string;
  templateId: string;
  templateName: string;
  enabled: boolean;
  name: string;
  triggerMode: TriggerMode;
  fixedTimeConfig?: {
    time: string;
    period: 'daily' | 'weekly' | 'monthly';
    weekDay?: number;
    monthDay?: number;
  };
  cronExpression?: string;
  paths: string[];
  fileFilter: FileFilterConfig;
  validateBeforeTrigger: boolean;
  maxRetries: number;
  feishuConfig?: {
    spreadsheetToken: string;
    appId?: string;
    appSecret?: string;
  };
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  nextRunAt?: string;
  lastRunStatus?: TaskStatus;
  lastRunMessage?: string;
}

export interface ScheduledTaskExecutionLog {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  status: TaskStatus;
  message: string;
  filesProcessed: number;
  rowsSynced: number;
  errorDetails?: string;
}

export const APP_CONFIG = {
  name: '飞书数据同步工具',
  version: '1.0.0',
  description: '飞书表格数据同步管理工具',
  
  environment: process.env.NODE_ENV || 'development',
  
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '/api',
    timeout: 30000,
  },
  
  storage: {
    templatesKey: 'feishuHistoryTemplates',
    urlHistoryKey: 'feishuUrlHistory',
    configKey: 'feishuConfig',
    maxHistorySize: 50,
  },
  
  upload: {
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ['.xlsx', '.xls'],
    chunkSize: 5 * 1024 * 1024,
  },
  
  feishu: {
    apiTimeout: 30000,
    maxRetries: 3,
    retryDelay: 1000,
  },
  
  ui: {
    toastDuration: 3000,
    loadingDelay: 500,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;

/**
 * 应用配置管理
 */

/**
 * 应用配置接口
 */
export interface AppConfig {
  // 文件上传配置
  maxFileSize: number;
  allowedFileTypes: string[];
  chunkSize: number;
  
  // API 配置
  apiTimeout: number;
  maxRetries: number;
  retryDelay: number;
  
  // 历史记录配置
  maxHistorySize: number;
  maxTemplateSize: number;
  
  // Excel 配置
  maxSheetCount: number;
  maxRowCount: number;
  
  // UI 配置
  uploadProgressInterval: number;
  
  // 调试配置
  enableDebug: boolean;
  enablePerformanceLogging: boolean;
}

/**
 * 默认配置
 */
export const defaultConfig: AppConfig = {
  // 文件上传配置
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: ['.xlsx', '.xls', '.csv', '.txt', '.pdf', '.doc', '.docx'],
  chunkSize: 5 * 1024 * 1024, // 5MB 分片上传
  
  // API 配置
  apiTimeout: 30000, // 30秒
  maxRetries: 3,
  retryDelay: 1000, // 1秒
  
  // 历史记录配置
  maxHistorySize: 10,
  maxTemplateSize: 50,
  
  // Excel 配置
  maxSheetCount: 50,
  maxRowCount: 10000,
  
  // UI 配置
  uploadProgressInterval: 500, // 500ms 更新一次进度
  
  // 调试配置
  enableDebug: false,
  enablePerformanceLogging: false,
};

/**
 * 环境特定配置
 */
const envConfigs: Record<string, Partial<AppConfig>> = {
  development: {
    enableDebug: true,
    enablePerformanceLogging: true,
    apiTimeout: 60000,
  },
  production: {
    enableDebug: false,
    enablePerformanceLogging: false,
    apiTimeout: 30000,
  },
  test: {
    enableDebug: true,
    enablePerformanceLogging: true,
    apiTimeout: 10000,
    maxRetries: 1,
  },
};

/**
 * 获取当前环境
 */
function getEnvironment(): string {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV || 'production';
  }
  
  // 从环境变量或域名判断
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  }
  
  if (hostname.includes('test') || hostname.includes('staging')) {
    return 'test';
  }
  
  return 'production';
}

/**
 * 获取应用配置
 */
export function getAppConfig(): AppConfig {
  const env = getEnvironment();
  const envConfig = envConfigs[env] || {};
  
  return {
    ...defaultConfig,
    ...envConfig,
  };
}

/**
 * 获取特定配置项
 */
export function getConfig<K extends keyof AppConfig>(key: K): AppConfig[K] {
  const config = getAppConfig();
  return config[key];
}

/**
 * 更新配置（仅在开发环境允许）
 */
export function updateConfig(updates: Partial<AppConfig>): void {
  const env = getEnvironment();
  
  if (env !== 'development') {
    console.warn('[Config] 配置更新仅在开发环境允许');
    return;
  }
  
  Object.assign(defaultConfig, updates);
  console.log('[Config] 配置已更新:', updates);
}

/**
 * 验证文件大小
 */
export function validateFileSize(fileSize: number): boolean {
  const maxFileSize = getConfig('maxFileSize');
  return fileSize <= maxFileSize;
}

/**
 * 验证文件类型
 */
export function validateFileType(fileName: string): boolean {
  const allowedFileTypes = getConfig('allowedFileTypes');
  const extension = '.' + fileName.split('.').pop()?.toLowerCase();
  return allowedFileTypes.includes(extension);
}

/**
 * 格式化文件大小为可读格式
 */
export function formatConfigFileSize(bytes: number): string {
  const maxFileSize = getConfig('maxFileSize');
  const percentage = (bytes / maxFileSize) * 100;
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(2)} ${units[unitIndex]} (${percentage.toFixed(1)}%)`;
}

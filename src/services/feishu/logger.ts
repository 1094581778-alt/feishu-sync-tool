/**
 * 飞书API日志系统
 * 提供结构化的API调用日志记录和监控
 */

import { LogLevel, logger as baseLogger } from '@/utils/logger';

/**
 * 飞书API日志类别
 */
export enum FeishuLogCategory {
  AUTH = 'feishu.auth',
  TABLES = 'feishu.tables',
  FIELDS = 'feishu.fields',
  RECORDS = 'feishu.records',
  SYNC = 'feishu.sync',
  BATCH = 'feishu.batch',
  CLIENT = 'feishu.client',
  API = 'feishu.api',
}

/**
 * 飞书API操作类型
 */
export enum FeishuOperationType {
  GET_ACCESS_TOKEN = 'GET_ACCESS_TOKEN',
  GET_TABLES = 'GET_TABLES',
  GET_FIELDS = 'GET_FIELDS',
  GET_RECORDS = 'GET_RECORDS',
  CREATE_TABLE = 'CREATE_TABLE',
  CREATE_FIELD = 'CREATE_FIELD',
  CREATE_RECORDS = 'CREATE_RECORDS',
  UPDATE_RECORDS = 'UPDATE_RECORDS',
  DELETE_RECORDS = 'DELETE_RECORDS',
  SYNC_DATA = 'SYNC_DATA',
  BATCH_OPERATION = 'BATCH_OPERATION',
}

/**
 * 飞书API日志上下文
 */
export interface FeishuLogContext {
  appId?: string;
  spreadsheetToken?: string;
  tableId?: string;
  fieldId?: string;
  recordId?: string;
  recordCount?: number;
  fieldCount?: number;
  tableCount?: number;
  apiUrl?: string;
  httpMethod?: string;
  httpStatus?: number;
  durationMs?: number;
  retryCount?: number;
  errorCode?: string;
  feishuCode?: number;
  pageSize?: number;
  pageToken?: string;
  hasMore?: boolean;
  baseUrl?: string;
  expiresIn?: number;
  cacheKey?: string;
  endpoint?: string;
  batchSize?: number;
  clearedCount?: number;
  errorMessage?: string;
  url?: string;
  timeout?: number;
  delay?: number;
  batchCount?: number;
  method?: string;
  maxRetries?: number;
  handlerName?: string;
  enableCache?: boolean;
}

/**
 * 飞书API日志器
 */
export class FeishuLogger {
  private static instance: FeishuLogger;
  private enabled = true;
  private logLevel = LogLevel.INFO;
  
  private constructor() {}
  
  /**
   * 获取日志器实例
   */
  static getInstance(): FeishuLogger {
    if (!FeishuLogger.instance) {
      FeishuLogger.instance = new FeishuLogger();
    }
    return FeishuLogger.instance;
  }
  
  /**
   * 启用/禁用日志记录
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
  
  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.logLevel = level;
  }
  
  /**
   * 记录调试日志
   */
  debug(category: FeishuLogCategory, message: string, context?: FeishuLogContext): void {
    if (!this.enabled || this.logLevel > LogLevel.DEBUG) return;
    this.log(LogLevel.DEBUG, category, message, context);
  }
  
  /**
   * 记录信息日志
   */
  info(category: FeishuLogCategory, message: string, context?: FeishuLogContext): void {
    if (!this.enabled || this.logLevel > LogLevel.INFO) return;
    this.log(LogLevel.INFO, category, message, context);
  }
  
  /**
   * 记录警告日志
   */
  warn(category: FeishuLogCategory, message: string, context?: FeishuLogContext): void {
    if (!this.enabled || this.logLevel > LogLevel.WARN) return;
    this.log(LogLevel.WARN, category, message, context);
  }
  
  /**
   * 记录错误日志
   */
  error(category: FeishuLogCategory, message: string, error?: Error, context?: FeishuLogContext): void {
    if (!this.enabled || this.logLevel > LogLevel.ERROR) return;
    this.log(LogLevel.ERROR, category, message, {
      ...context,
      error: error?.message,
      stack: error?.stack,
      errorName: error?.name,
    });
  }
  
  /**
   * 记录API调用日志
   */
  apiCall(
    operation: FeishuOperationType,
    apiUrl: string,
    httpMethod: string,
    durationMs: number,
    success: boolean,
    context?: FeishuLogContext
  ): void {
    if (!this.enabled) return;
    
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = success 
      ? `API调用成功: ${operation}`
      : `API调用失败: ${operation}`;
    
    this.log(level, FeishuLogCategory.API, message, {
      ...context,
      operation,
      apiUrl,
      httpMethod,
      durationMs,
      success,
    });
  }
  
  /**
   * 记录认证日志
   */
  auth(appId: string, success: boolean, durationMs?: number, error?: Error): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = success 
      ? '飞书认证成功'
      : '飞书认证失败';
    
    this.log(level, FeishuLogCategory.AUTH, message, {
      appId: this.maskAppId(appId),
      success,
      durationMs,
      error: error?.message,
    });
  }
  
  /**
   * 记录批量操作日志
   */
  batchOperation(
    operation: FeishuOperationType,
    total: number,
    successCount: number,
    failureCount: number,
    durationMs: number,
    context?: FeishuLogContext
  ): void {
    const level = failureCount > 0 ? LogLevel.WARN : LogLevel.INFO;
    const message = `批量操作完成: ${operation}`;
    
    this.log(level, FeishuLogCategory.BATCH, message, {
      ...context,
      operation,
      total,
      successCount,
      failureCount,
      durationMs,
      successRate: total > 0 ? (successCount / total) * 100 : 100,
    });
  }
  
  /**
   * 开始计时
   */
  startTimer(): number {
    return Date.now();
  }
  
  /**
   * 结束计时并返回持续时间
   */
  endTimer(startTime: number): number {
    return Date.now() - startTime;
  }
  
  /**
   * 私有日志方法
   */
  private log(level: LogLevel, category: FeishuLogCategory, message: string, context?: any): void {
    if (!this.enabled) return;
    
    const logContext = this.sanitizeContext(context);
    
    // 使用基础日志系统
    baseLogger.log({
      timestamp: new Date().toISOString(),
      level,
      category: category.toString(),
      message,
      data: logContext,
      module: 'feishu-api',
    });
    
    // 同时输出到控制台（仅开发环境）
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = this.getConsoleMethod(level);
      const formattedMessage = `[${category}] ${message}`;
      
      if (logContext) {
        consoleMethod(formattedMessage, logContext);
      } else {
        consoleMethod(formattedMessage);
      }
    }
  }
  
  /**
   * 清理和脱敏上下文数据
   */
  private sanitizeContext(context: any): any {
    if (!context) return undefined;
    
    const sanitized: any = { ...context };
    
    // 脱敏敏感信息
    if (sanitized.appId) {
      sanitized.appId = this.maskAppId(sanitized.appId);
    }
    
    if (sanitized.appSecret) {
      sanitized.appSecret = '[REDACTED]';
    }
    
    if (sanitized.accessToken) {
      sanitized.accessToken = this.maskToken(sanitized.accessToken);
    }
    
    if (sanitized.spreadsheetToken && sanitized.spreadsheetToken.length > 10) {
      sanitized.spreadsheetToken = `${sanitized.spreadsheetToken.substring(0, 10)}...`;
    }
    
    // 移除大对象
    if (sanitized.data && typeof sanitized.data === 'object') {
      if (Array.isArray(sanitized.data) && sanitized.data.length > 10) {
        sanitized.data = `[Array(${sanitized.data.length}) - truncated]`;
      } else if (Object.keys(sanitized.data).length > 20) {
        sanitized.data = `[Object with ${Object.keys(sanitized.data).length} keys - truncated]`;
      }
    }
    
    return sanitized;
  }
  
  /**
   * 脱敏App ID
   */
  private maskAppId(appId: string): string {
    if (!appId || appId.length <= 8) return appId;
    return `${appId.substring(0, 8)}...`;
  }
  
  /**
   * 脱敏令牌
   */
  private maskToken(token: string): string {
    if (!token || token.length <= 10) return token;
    return `${token.substring(0, 10)}...`;
  }
  
  /**
   * 获取对应的控制台方法
   */
  private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }
}

/**
 * 全局日志器实例
 */
export const feishuLogger = FeishuLogger.getInstance();

/**
 * 创建API调用包装器，自动记录日志
 */
export function withApiLogging<T>(
  operation: FeishuOperationType,
  apiUrl: string,
  httpMethod: string,
  fn: () => Promise<T>,
  context?: FeishuLogContext
): Promise<T> {
  const startTime = feishuLogger.startTimer();
  
  return fn()
    .then((result) => {
      const durationMs = feishuLogger.endTimer(startTime);
      feishuLogger.apiCall(operation, apiUrl, httpMethod, durationMs, true, {
        ...context,
        durationMs,
      });
      return result;
    })
    .catch((error) => {
      const durationMs = feishuLogger.endTimer(startTime);
      feishuLogger.apiCall(operation, apiUrl, httpMethod, durationMs, false, {
        ...context,
        durationMs,
        errorCode: error.code,
        errorMessage: error.message,
      });
      feishuLogger.error(FeishuLogCategory.API, `API调用失败: ${operation}`, error, {
        ...context,
        apiUrl,
        httpMethod,
        durationMs,
      });
      throw error;
    });
}
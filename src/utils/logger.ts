/**
 * 日志系统
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export enum OperationType {
  SYNC_INIT = 'SYNC_INIT',
  SYNC_PROGRESS = 'SYNC_PROGRESS',
  SYNC_COMPLETE = 'SYNC_COMPLETE',
  SYNC_FAILED = 'SYNC_FAILED',
  FILE_UPLOAD = 'FILE_UPLOAD',
  API_CALL = 'API_CALL',
  TASK_EXECUTION = 'TASK_EXECUTION',
  OTHER = 'OTHER',
}

export enum OperationResult {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
}

export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_FORMAT_ERROR = 'FILE_FORMAT_ERROR',
  FILE_PERMISSION_DENIED = 'FILE_PERMISSION_DENIED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_CORRUPTED = 'FILE_CORRUPTED',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export enum LogStorageType {
  MEMORY = 'MEMORY',
  LOCAL_FILE = 'LOCAL_FILE',
  REMOTE_SERVICE = 'REMOTE_SERVICE',
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
  operationId?: string;
  operationType?: OperationType;
  operationResult?: OperationResult;
  context?: Record<string, any>;
  module?: string;
  durationMs?: number;
  startTime?: string;
  endTime?: string;
  dataSize?: number;
  successCount?: number;
  failureCount?: number;
  errorType?: ErrorType;
  httpMethod?: string;
  httpStatus?: number;
  url?: string;
  filePath?: string;
  fileMetadata?: Record<string, any>;
  osErrorCode?: string;
  sensitiveDataMasked?: boolean;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private currentLevel = LogLevel.INFO;
  private logQueue: LogEntry[] = [];
  private isProcessingQueue = false;
  private storageTargets: LogStorageType[] = [LogStorageType.MEMORY, LogStorageType.LOCAL_FILE];
  private localStorageKey = 'professional_logs';
  private maxLocalLogSize = 10 * 1024 * 1024; // 10MB
  private logRetentionDays = 30;

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * 设置存储目标
   */
  setStorageTargets(targets: LogStorageType[]): void {
    this.storageTargets = targets;
  }

  /**
   * 生成操作ID（UUID v4格式）
   */
  generateOperationId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // 兼容旧环境
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 格式化时间戳（精确到毫秒）
   */
  private formatTimestamp(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * 脱敏敏感信息
   */
  private maskSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /key/i,
      /credential/i,
      /auth/i,
      /bearer/i,
      /api[_-]?key/i,
    ];
    
    const maskedData = Array.isArray(data) ? [...data] : { ...data };
    
    for (const key in maskedData) {
      if (Object.prototype.hasOwnProperty.call(maskedData, key)) {
        const value = maskedData[key];
        
        // 检查键名是否匹配敏感模式
        const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
        
        if (isSensitive && typeof value === 'string') {
          maskedData[key] = '***MASKED***';
        } else if (typeof value === 'object' && value !== null) {
          maskedData[key] = this.maskSensitiveData(value);
        }
      }
    }
    
    return maskedData;
  }

  /**
   * 异步写入日志到存储目标
   */
  private async writeToStorage(entry: LogEntry): Promise<void> {
    // 添加到内存缓存
    if (this.storageTargets.includes(LogStorageType.MEMORY)) {
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    }
    
    // 写入本地存储
    if (this.storageTargets.includes(LogStorageType.LOCAL_FILE) && typeof window !== 'undefined') {
      this.writeToLocalStorage(entry);
    }
    
    // 发送到远程日志服务
    if (this.storageTargets.includes(LogStorageType.REMOTE_SERVICE)) {
      this.sendToRemoteService(entry);
    }
  }

  /**
   * 写入本地存储（模拟文件存储）
   */
  private writeToLocalStorage(entry: LogEntry): void {
    try {
      const storedLogs = localStorage.getItem(this.localStorageKey) || '[]';
      const logs = JSON.parse(storedLogs) as LogEntry[];
      logs.push(entry);
      
      // 检查大小限制
      const logsSize = new Blob([JSON.stringify(logs)]).size;
      if (logsSize > this.maxLocalLogSize) {
        // 删除最旧的日志，直到大小符合要求
        while (logs.length > 0 && logsSize > this.maxLocalLogSize) {
          logs.shift();
        }
      }
      
      // 清理超过保留期限的日志
      const now = new Date();
      const retentionDate = new Date(now);
      retentionDate.setDate(retentionDate.getDate() - this.logRetentionDays);
      
      const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= retentionDate;
      });
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(filteredLogs));
    } catch (error) {
      console.error('写入本地存储失败:', error);
    }
  }

  /**
   * 发送到远程日志服务
   */
  private sendToRemoteService(entry: LogEntry): void {
    // 异步发送，不阻塞主线程
    setTimeout(() => {
      try {
        // 这里可以集成实际的远程日志服务
        // 例如：fetch('/api/logs', { method: 'POST', body: JSON.stringify(entry) })
        console.debug('发送日志到远程服务:', entry);
      } catch (error) {
        console.error('发送到远程服务失败:', error);
      }
    }, 0);
  }

  /**
   * 添加专业日志条目
   */
  private addProfessionalLogEntry(entry: Partial<LogEntry>): void {
    const fullEntry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level: entry.level || LogLevel.INFO,
      category: entry.category || 'DEFAULT',
      message: entry.message || '',
      ...entry,
      // 脱敏敏感信息
      data: entry.data ? this.maskSensitiveData(entry.data) : undefined,
      sensitiveDataMasked: entry.data ? true : false,
    };
    
    // 控制台输出
    this.logToConsole(fullEntry);
    
    // 异步写入
    Promise.resolve().then(() => this.writeToStorage(fullEntry));
  }

  /**
   * 清空日志
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * 获取所有日志
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * 获取特定级别的日志
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 添加日志
   */
  private addLog(level: LogLevel, category: string, message: string, data?: any, stack?: string): void {
    if (level < this.currentLevel) {
      return;
    }

    this.addProfessionalLogEntry({
      level,
      category,
      message,
      data,
      stack,
    });
  }

  /**
   * 输出到控制台
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${LogLevel[entry.level]}] [${entry.category}]`;
    const message = `${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data || '', entry.stack || '');
        break;
    }
  }

  /**
   * 通用日志方法
   */
  log(params: { timestamp: string; level: LogLevel; category: string; message: string; data?: any; module?: string }): void {
    this.addProfessionalLogEntry({
      timestamp: params.timestamp,
      level: params.level,
      category: params.category,
      message: params.message,
      data: params.data,
      module: params.module,
    });
  }

  /**
   * 调试日志
   */
  debug(category: string, message: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, category, message, data);
  }

  /**
   * 信息日志
   */
  info(category: string, message: string, data?: any): void {
    this.addLog(LogLevel.INFO, category, message, data);
  }

  /**
   * 警告日志
   */
  warn(category: string, message: string, data?: any): void {
    this.addLog(LogLevel.WARN, category, message, data);
  }

  /**
   * 错误日志
   */
  error(category: string, message: string, error?: Error | any): void {
    let stack: string | undefined;
    let data: any;

    if (error instanceof Error) {
      data = error.message;
      stack = error.stack;
    } else {
      data = error;
    }

    this.addLog(LogLevel.ERROR, category, message, data, stack);
  }

  /**
   * 致命错误日志
   */
  fatal(category: string, message: string, error?: Error | any): void {
    let stack: string | undefined;
    let data: any;

    if (error instanceof Error) {
      data = error.message;
      stack = error.stack;
    } else {
      data = error;
    }

    this.addLog(LogLevel.FATAL, category, message, data, stack);
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * 下载日志
   */
  downloadLogs(): void {
    const dataStr = this.exportLogs();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 记录同步操作日志
   */
  logSyncOperation(params: {
    operationId?: string;
    operationType: OperationType;
    operationResult: OperationResult;
    module: string;
    startTime: string;
    endTime: string;
    durationMs: number;
    dataSize?: number;
    successCount?: number;
    failureCount?: number;
    context?: Record<string, any>;
    message: string;
    data?: any;
  }): void {
    this.addProfessionalLogEntry({
      level: params.operationResult === OperationResult.SUCCESS ? LogLevel.INFO : 
             params.operationResult === OperationResult.PARTIAL_SUCCESS ? LogLevel.WARN : LogLevel.ERROR,
      category: LOG_CATEGORIES.SYNC_OPERATION,
      message: params.message,
      operationId: params.operationId || this.generateOperationId(),
      operationType: params.operationType,
      operationResult: params.operationResult,
      module: params.module,
      startTime: params.startTime,
      endTime: params.endTime,
      durationMs: params.durationMs,
      dataSize: params.dataSize,
      successCount: params.successCount,
      failureCount: params.failureCount,
      context: params.context,
      data: params.data,
    });
  }

  /**
   * 记录文件相关错误
   */
  logFileError(params: {
    errorType: ErrorType;
    filePath: string;
    osErrorCode?: string;
    fileMetadata?: Record<string, any>;
    context?: Record<string, any>;
    message: string;
    stack?: string;
  }): void {
    this.addProfessionalLogEntry({
      level: LogLevel.ERROR,
      category: LOG_CATEGORIES.FILE_ERROR,
      message: params.message,
      errorType: params.errorType,
      filePath: params.filePath,
      osErrorCode: params.osErrorCode,
      fileMetadata: params.fileMetadata,
      context: params.context,
      stack: params.stack,
      operationResult: OperationResult.FAILED,
    });
  }

  /**
   * 记录API调用错误
   */
  logApiError(params: {
    url: string;
    httpMethod: string;
    httpStatus: number;
    requestParams?: any;
    responseContent?: any;
    startTime: string;
    endTime: string;
    networkDurationMs: number;
    context?: Record<string, any>;
    message: string;
    stack?: string;
  }): void {
    this.addProfessionalLogEntry({
      level: LogLevel.ERROR,
      category: LOG_CATEGORIES.API_ERROR,
      message: params.message,
      url: params.url,
      httpMethod: params.httpMethod,
      httpStatus: params.httpStatus,
      data: {
        requestParams: params.requestParams,
        responseContent: params.responseContent,
      },
      startTime: params.startTime,
      endTime: params.endTime,
      durationMs: params.networkDurationMs,
      context: params.context,
      stack: params.stack,
      operationResult: OperationResult.FAILED,
    });
  }

  /**
   * 记录其他类型错误
   */
  logGenericError(params: {
    errorType: ErrorType;
    errorCode?: string;
    context?: Record<string, any>;
    variableSnapshot?: Record<string, any>;
    message: string;
    stack?: string;
  }): void {
    this.addProfessionalLogEntry({
      level: LogLevel.ERROR,
      category: LOG_CATEGORIES.GENERIC_ERROR,
      message: params.message,
      errorType: params.errorType,
      data: {
        errorCode: params.errorCode,
        variableSnapshot: params.variableSnapshot,
      },
      context: params.context,
      stack: params.stack,
      operationResult: OperationResult.FAILED,
    });
  }

  /**
   * 查询日志
   */
  queryLogs(filters: {
    startTime?: string;
    endTime?: string;
    operationType?: OperationType;
    operationResult?: OperationResult;
    level?: LogLevel;
    category?: string;
    module?: string;
    limit?: number;
  }): LogEntry[] {
    let results = this.logs;
    
    if (filters.startTime) {
      results = results.filter(log => log.timestamp >= filters.startTime!);
    }
    
    if (filters.endTime) {
      results = results.filter(log => log.timestamp <= filters.endTime!);
    }
    
    if (filters.operationType) {
      results = results.filter(log => log.operationType === filters.operationType);
    }
    
    if (filters.operationResult) {
      results = results.filter(log => log.operationResult === filters.operationResult);
    }
    
    if (filters.level !== undefined) {
      results = results.filter(log => log.level === filters.level);
    }
    
    if (filters.category) {
      results = results.filter(log => log.category === filters.category);
    }
    
    if (filters.module) {
      results = results.filter(log => log.module === filters.module);
    }
    
    if (filters.limit && filters.limit > 0) {
      results = results.slice(-filters.limit);
    }
    
    return results;
  }

  /**
   * 获取日志统计信息
   */
  getLogStatistics(): {
    total: number;
    byLevel: Record<string, number>;
    byOperationType: Record<string, number>;
    byOperationResult: Record<string, number>;
  } {
    const byLevel: Record<string, number> = {};
    const byOperationType: Record<string, number> = {};
    const byOperationResult: Record<string, number> = {};
    
    for (const log of this.logs) {
      const levelKey = LogLevel[log.level];
      byLevel[levelKey] = (byLevel[levelKey] || 0) + 1;
      
      if (log.operationType) {
        byOperationType[log.operationType] = (byOperationType[log.operationType] || 0) + 1;
      }
      
      if (log.operationResult) {
        byOperationResult[log.operationResult] = (byOperationResult[log.operationResult] || 0) + 1;
      }
    }
    
    return {
      total: this.logs.length,
      byLevel,
      byOperationType,
      byOperationResult,
    };
  }
}

// 创建全局日志实例
export const logger = new Logger();

// 根据环境设置日志级别
if (typeof window !== 'undefined') {
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  logger.setLevel(isDevelopment ? LogLevel.DEBUG : LogLevel.INFO);
}

/**
 * 日志分类常量
 */
export const LOG_CATEGORIES = {
  API: 'API',
  FILE_UPLOAD: 'FILE_UPLOAD',
  FEISHU: 'FEISHU',
  STATE: 'STATE',
  PERFORMANCE: 'PERFORMANCE',
  ERROR: 'ERROR',
  COMPONENT: 'COMPONENT',
  HOOK: 'HOOK',
  SYNC_OPERATION: 'SYNC_OPERATION',
  FILE_ERROR: 'FILE_ERROR',
  API_ERROR: 'API_ERROR',
  GENERIC_ERROR: 'GENERIC_ERROR',
} as const;

/**
 * 性能日志装饰器
 */
export function logPerformance(category: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const methodName = `${category}.${propertyKey}`;

      logger.debug(LOG_CATEGORIES.PERFORMANCE, `${methodName} 开始执行`, { args });

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;

        logger.debug(LOG_CATEGORIES.PERFORMANCE, `${methodName} 执行完成`, {
          duration: `${duration.toFixed(2)}ms`,
          args,
        });

        return result;
      } catch (error) {
        const duration = performance.now() - start;

        logger.error(LOG_CATEGORIES.PERFORMANCE, `${methodName} 执行失败`, {
          duration: `${duration.toFixed(2)}ms`,
          error,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

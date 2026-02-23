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

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private currentLevel = LogLevel.INFO;

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
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

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      stack,
    };

    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 控制台输出
    this.logToConsole(entry);
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

/**
 * 性能监控工具
 */

import { useEffect, useRef } from 'react';
import { logger, LOG_CATEGORIES } from './logger';

/**
 * 性能指标
 */
export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * 性能统计
 */
export interface PerformanceStats {
  totalMetrics: number;
  metrics: PerformanceMetric[];
  averages: Record<string, number>;
  maxValues: Record<string, number>;
  minValues: Record<string, number>;
}

/**
 * 性能监控器
 */
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private history: PerformanceMetric[] = [];
  private maxHistory = 100;
  private isEnabled = false;

  /**
   * 启用性能监控
   */
  enable(): void {
    this.isEnabled = true;
    logger.info(LOG_CATEGORIES.PERFORMANCE, '性能监控已启用');
  }

  /**
   * 禁用性能监控
   */
  disable(): void {
    this.isEnabled = false;
    logger.info(LOG_CATEGORIES.PERFORMANCE, '性能监控已禁用');
  }

  /**
   * 开始监控
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);
  }

  /**
   * 结束监控
   */
  end(name: string, metadata?: Record<string, any>): number | undefined {
    if (!this.isEnabled) return undefined;

    const metric = this.metrics.get(name);

    if (!metric) {
      logger.warn(LOG_CATEGORIES.PERFORMANCE, `未找到性能指标: ${name}`);
      return undefined;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    if (metadata) {
      metric.metadata = { ...metric.metadata, ...metadata };
    }

    this.history.push(metric);

    // 限制历史记录数量
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    this.metrics.delete(name);

    logger.debug(LOG_CATEGORIES.PERFORMANCE, `性能指标: ${name}`, {
      duration: `${duration.toFixed(2)}ms`,
      metadata: metric.metadata,
    });

    return duration;
  }

  /**
   * 测量异步函数
   */
  async measure<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);

    try {
      const result = await fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: 'failed' });
      throw error;
    }
  }

  /**
   * 测量同步函数
   */
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);

    try {
      const result = fn();
      this.end(name, metadata);
      return result;
    } catch (error) {
      this.end(name, { ...metadata, error: 'failed' });
      throw error;
    }
  }

  /**
   * 获取历史记录
   */
  getHistory(name?: string): PerformanceMetric[] {
    if (name) {
      return this.history.filter(m => m.name === name);
    }
    return [...this.history];
  }

  /**
   * 获取统计信息
   */
  getStats(name?: string): PerformanceStats {
    const metrics = name
      ? this.history.filter(m => m.name === name)
      : this.history;

    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        metrics: [],
        averages: {},
        maxValues: {},
        minValues: {},
      };
    }

    // 按名称分组
    const grouped = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    // 计算统计信息
    const averages: Record<string, number> = {};
    const maxValues: Record<string, number> = {};
    const minValues: Record<string, number> = {};

    Object.entries(grouped).forEach(([name, ms]) => {
      const durations = ms.map(m => m.duration || 0);
      averages[name] = durations.reduce((a, b) => a + b, 0) / durations.length;
      maxValues[name] = Math.max(...durations);
      minValues[name] = Math.min(...durations);
    });

    return {
      totalMetrics: metrics.length,
      metrics,
      averages,
      maxValues,
      minValues,
    };
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = [];
    this.metrics.clear();
    logger.info(LOG_CATEGORIES.PERFORMANCE, '性能监控历史记录已清空');
  }

  /**
   * 导出性能数据
   */
  export(): string {
    const data = {
      exportTime: new Date().toISOString(),
      stats: this.getStats(),
      history: this.history,
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 下载性能报告
   */
  downloadReport(): void {
    const dataStr = this.export();
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `performance_report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 根据环境启用性能监控
if (typeof window !== 'undefined') {
  const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isDevelopment) {
    performanceMonitor.enable();
  }
}

/**
 * 性能监控装饰器工厂
 */
export function withPerformanceMonitoring(name: string, metadata?: Record<string, any>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(
        `${name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        { args, ...metadata }
      );
    };

    return descriptor;
  };
}

/**
 * React 组件性能监控 Hook
 */
export function usePerformanceMonitor(componentName: string) {
  const mountTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    if (mountTime.current === 0) {
      mountTime.current = performance.now();
    }
    renderCount.current++;

    logger.debug(LOG_CATEGORIES.PERFORMANCE, `组件渲染: ${componentName}`, {
      renderCount: renderCount.current,
      mountDuration: `${(performance.now() - mountTime.current).toFixed(2)}ms`,
    });
  });

  useEffect(() => {
    logger.info(LOG_CATEGORIES.PERFORMANCE, `组件挂载: ${componentName}`);

    return () => {
      const duration = performance.now() - mountTime.current;
      logger.info(LOG_CATEGORIES.PERFORMANCE, `组件卸载: ${componentName}`, {
        duration: `${duration.toFixed(2)}ms`,
        renderCount: renderCount.current,
      });
    };
  }, [componentName]);
}

/**
 * 内存使用监控
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
} | null {
  if (typeof window === 'undefined' || !(performance as ExtendedPerformance).memory) {
    return null;
  }

  const memory = (performance as ExtendedPerformance).memory!;
  const usedPercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usedPercentage,
  };
}

/**
 * 格式化内存大小
 */
export function formatMemorySize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

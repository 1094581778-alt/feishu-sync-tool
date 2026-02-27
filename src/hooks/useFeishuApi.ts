/**
 * 飞书API统一Hook
 * 提供统一的Feishu API调用接口，集成错误处理、状态管理和缓存
 */

import { useState, useCallback, useRef } from 'react';
import type { 
  FeishuTable, 
  FeishuField, 
  FeishuRecord,
  AppConfig,
  CreateTableRequest,
  CreateFieldRequest,
  RecordQueryOptions
} from '@/services/feishu/types';
import { FeishuError, FeishuErrorCode } from '@/services/feishu/errors';
import { feishuLogger, FeishuLogCategory } from '@/services/feishu/logger';

interface UseFeishuApiOptions {
  /** 是否启用缓存 */
  enableCache?: boolean;
  /** 缓存有效期（毫秒） */
  cacheTTL?: number;
  /** 是否启用日志记录 */
  enableLogging?: boolean;
  /** 请求超时时间（毫秒） */
  timeout?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

interface UseFeishuApiResult {
  // 状态
  loading: boolean;
  error: FeishuError | null;
  
  // API方法
  getTables: (
    spreadsheetToken: string, 
    appConfig: AppConfig,
    options?: { skipCache?: boolean }
  ) => Promise<FeishuTable[]>;
  
  getFields: (
    spreadsheetToken: string, 
    tableId: string,
    appConfig: AppConfig,
    options?: { skipCache?: boolean }
  ) => Promise<FeishuField[]>;
  
  getRecords: (
    spreadsheetToken: string,
    tableId: string,
    appConfig: AppConfig,
    options?: { query?: RecordQueryOptions; skipCache?: boolean }
  ) => Promise<FeishuRecord[]>;
  
  createTable: (
    spreadsheetToken: string,
    request: CreateTableRequest,
    appConfig: AppConfig
  ) => Promise<FeishuTable>;
  
  createField: (
    spreadsheetToken: string,
    tableId: string,
    request: CreateFieldRequest,
    appConfig: AppConfig
  ) => Promise<FeishuField>;
  
  createRecords: (
    spreadsheetToken: string,
    tableId: string,
    records: Array<Record<string, any>>,
    appConfig: AppConfig,
    options?: { batchSize?: number }
  ) => Promise<{ records: FeishuRecord[]; errors: Array<{ recordIndex: number; error: string }> }>;
  
  // 工具方法
  clearCache: () => void;
  clearError: () => void;
  reset: () => void;
}

interface CacheItem<T = any> {
  data: T;
  expiresAt: number;
}

/**
 * 调用飞书API的统一方法
 */
async function callFeishuApi<T = any>(
  endpoint: string,
  method: string,
  body?: any,
  appConfig?: AppConfig,
  options?: {
    timeout?: number;
    maxRetries?: number;
  }
): Promise<T> {
  const { timeout = 30000, maxRetries = 3 } = options || {};
  
  const url = `${window.location.origin}/api/feishu${endpoint}`;
  const requestBody: any = body ? { ...body } : {};
  
  // 添加应用配置
  if (appConfig?.appId && appConfig?.appSecret) {
    requestBody.appId = appConfig.appId;
    requestBody.appSecret = appConfig.appSecret;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      feishuLogger.debug(FeishuLogCategory.API, `调用飞书API: ${method} ${endpoint}`, {
        retryCount: attempt - 1,
        maxRetries,
        url,
      });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: method !== 'GET' ? JSON.stringify(requestBody) : undefined,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        const errorMessage = data.error?.message || `API请求失败: ${response.status}`;
        const errorCode = data.error?.code || 'API_REQUEST_FAILED';
        
        throw new FeishuError(
          errorCode as any,
          errorMessage,
          data.error?.details,
          new Error(`API请求失败: ${response.status}`)
        );
      }
      
      feishuLogger.info(FeishuLogCategory.API, `飞书API调用成功: ${method} ${endpoint}`, {
        retryCount: attempt - 1,
        endpoint,
      });
      
      return data.data || data;
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof FeishuError) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        feishuLogger.warn(FeishuLogCategory.API, `API调用失败，${delay}ms后重试`, {
          retryCount: attempt - 1,
          maxRetries,
          errorMessage: error instanceof Error ? error.message : String(error),
          endpoint,
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        feishuLogger.error(FeishuLogCategory.API, `API调用失败，达到最大重试次数`, lastError, {
          endpoint,
          maxRetries,
        });
        
        throw new FeishuError(
          FeishuErrorCode.API_REQUEST_FAILED,
          `API调用失败: ${lastError.message}`,
          { endpoint, method, maxRetries },
          lastError
        );
      }
    }
  }
  
  throw lastError || new Error('未知错误');
}

/**
 * 统一飞书API Hook
 */
export function useFeishuApi(options: UseFeishuApiOptions = {}): UseFeishuApiResult {
  const {
    enableCache = true,
    cacheTTL = 5 * 60 * 1000, // 5分钟
    enableLogging = true,
    timeout = 30000,
    maxRetries = 3,
  } = options;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<FeishuError | null>(null);
  
  // 缓存引用
  const cacheRef = useRef<Map<string, CacheItem>>(new Map());
  
  /**
   * 从缓存获取数据
   */
  const getFromCache = useCallback(<T = any>(key: string): T | null => {
    if (!enableCache) return null;
    
    const cacheItem = cacheRef.current.get(key);
    if (!cacheItem) return null;
    
    if (Date.now() > cacheItem.expiresAt) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cacheItem.data;
  }, [enableCache]);
  
  /**
   * 设置缓存
   */
  const setCache = useCallback(<T = any>(key: string, data: T): void => {
    if (!enableCache) return;
    
    cacheRef.current.set(key, {
      data,
      expiresAt: Date.now() + cacheTTL,
    });
  }, [enableCache, cacheTTL]);
  
  /**
   * 清空缓存
   */
  const clearCache = useCallback((): void => {
    cacheRef.current.clear();
    feishuLogger.info(FeishuLogCategory.CLIENT, '清空API缓存');
  }, []);
  
  /**
   * 清空错误
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);
  
  /**
   * 重置状态
   */
  const reset = useCallback((): void => {
    setLoading(false);
    setError(null);
    clearCache();
  }, [clearCache]);
  
  /**
   * 统一API调用包装器
   */
  const callApi = useCallback(async <T = any>(
    operation: string,
    apiCall: () => Promise<T>,
    cacheKey?: string,
    skipCache = false
  ): Promise<T> => {
    // 检查缓存
    if (cacheKey && !skipCache) {
      const cachedData = getFromCache<T>(cacheKey);
      if (cachedData !== null) {
        feishuLogger.debug(FeishuLogCategory.CLIENT, `从缓存获取数据: ${operation}`, {
          cacheKey,
        });
        return cachedData;
      }
    }
    
    setLoading(true);
    clearError();
    
    try {
      const startTime = Date.now();
      const result = await apiCall();
      const duration = Date.now() - startTime;
      
      if (enableLogging) {
        feishuLogger.info(FeishuLogCategory.API, `${operation} 成功`, {
          durationMs: duration,
          cacheKey,
        });
      }
      
      // 设置缓存
      if (cacheKey && !skipCache) {
        setCache(cacheKey, result);
      }
      
      return result;
    } catch (err) {
      const feishuError = err instanceof FeishuError 
        ? err 
        : new FeishuError(
            FeishuErrorCode.API_REQUEST_FAILED,
            `${operation} 失败: ${err instanceof Error ? err.message : String(err)}`,
            { operation },
            err instanceof Error ? err : undefined
          );
      
      setError(feishuError);
      
      if (enableLogging) {
        feishuLogger.error(FeishuLogCategory.API, `${operation} 失败`, feishuError, {
          endpoint: operation,
        });
      }
      
      throw feishuError;
    } finally {
      setLoading(false);
    }
  }, [getFromCache, setCache, clearError, enableLogging]);
  
  /**
   * 获取表格列表
   */
  const getTables = useCallback((
    spreadsheetToken: string,
    appConfig: AppConfig,
    options?: { skipCache?: boolean }
  ): Promise<FeishuTable[]> => {
    const cacheKey = `tables:${spreadsheetToken}`;
    const { skipCache = false } = options || {};
    
    return callApi(
      '获取表格列表',
      () => callFeishuApi<{ tables: FeishuTable[] }>(
        '/tables',
        'POST',
        { token: spreadsheetToken },
        appConfig,
        { timeout, maxRetries }
      ).then(data => data.tables),
      cacheKey,
      skipCache
    );
  }, [callApi, timeout, maxRetries]);
  
  /**
   * 获取字段列表
   */
  const getFields = useCallback((
    spreadsheetToken: string,
    tableId: string,
    appConfig: AppConfig,
    options?: { skipCache?: boolean }
  ): Promise<FeishuField[]> => {
    const cacheKey = `fields:${spreadsheetToken}:${tableId}`;
    const { skipCache = false } = options || {};
    
    return callApi(
      '获取字段列表',
      () => callFeishuApi<{ fields: FeishuField[] }>(
        '/fields',
        'POST',
        { token: spreadsheetToken, tableId },
        appConfig,
        { timeout, maxRetries }
      ).then(data => data.fields),
      cacheKey,
      skipCache
    );
  }, [callApi, timeout, maxRetries]);
  
  /**
   * 获取记录列表
   */
  const getRecords = useCallback((
    spreadsheetToken: string,
    tableId: string,
    appConfig: AppConfig,
    options?: { query?: RecordQueryOptions; skipCache?: boolean }
  ): Promise<FeishuRecord[]> => {
    const { query = {}, skipCache = false } = options || {};
    const queryStr = JSON.stringify(query);
    const cacheKey = `records:${spreadsheetToken}:${tableId}:${queryStr}`;
    
    return callApi(
      '获取记录列表',
      () => callFeishuApi<{ records: FeishuRecord[] }>(
        '/records',
        'POST',
        { 
          token: spreadsheetToken, 
          tableId,
          ...query
        },
        appConfig,
        { timeout, maxRetries }
      ).then(data => data.records),
      cacheKey,
      skipCache
    );
  }, [callApi, timeout, maxRetries]);
  
  /**
   * 创建表格
   */
  const createTable = useCallback((
    spreadsheetToken: string,
    request: CreateTableRequest,
    appConfig: AppConfig
  ): Promise<FeishuTable> => {
    return callApi(
      '创建表格',
      () => callFeishuApi<{ table: FeishuTable }>(
        '/create-table',
        'POST',
        { token: spreadsheetToken, tableName: request.name },
        appConfig,
        { timeout, maxRetries }
      ).then(data => data.table),
      undefined,
      true // 创建操作不缓存
    );
  }, [callApi, timeout, maxRetries]);
  
  /**
   * 创建字段
   */
  const createField = useCallback((
    spreadsheetToken: string,
    tableId: string,
    request: CreateFieldRequest,
    appConfig: AppConfig
  ): Promise<FeishuField> => {
    return callApi(
      '创建字段',
      () => callFeishuApi<{ field: FeishuField }>(
        '/add-field',
        'POST',
        { 
          token: spreadsheetToken, 
          tableId,
          fieldName: request.field_name,
          fieldType: request.type,
        },
        appConfig,
        { timeout, maxRetries }
      ).then(data => data.field),
      undefined,
      true // 创建操作不缓存
    );
  }, [callApi, timeout, maxRetries]);
  
  /**
   * 批量创建记录
   */
  const createRecords = useCallback((
    spreadsheetToken: string,
    tableId: string,
    records: Array<Record<string, any>>,
    appConfig: AppConfig,
    options?: { batchSize?: number }
  ): Promise<{ records: FeishuRecord[]; errors: Array<{ recordIndex: number; error: string }> }> => {
    const { batchSize = 100 } = options || {};
    
    return callApi(
      '批量创建记录',
      async () => {
        // 分批处理
        const batches: Array<Array<Record<string, any>>> = [];
        for (let i = 0; i < records.length; i += batchSize) {
          batches.push(records.slice(i, i + batchSize));
        }
        
        const results: FeishuRecord[] = [];
        const errors: Array<{ recordIndex: number; error: string }> = [];
        
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          
          try {
            const response = await callFeishuApi<{ 
              records: FeishuRecord[];
              errors?: Array<{ recordIndex: number; error: string }>;
            }>(
              '/records/batch-create',
              'POST',
              { 
                token: spreadsheetToken,
                tableId,
                records: batch,
              },
              appConfig,
              { timeout: timeout * 2, maxRetries } // 批量操作需要更长时间
            );
            
            if (response.records) {
              results.push(...response.records);
            }
            
            if (response.errors) {
              // 调整错误索引
              const adjustedErrors = response.errors.map(err => ({
                ...err,
                recordIndex: err.recordIndex + (batchIndex * batchSize),
              }));
              errors.push(...adjustedErrors);
            }
          } catch (error) {
            // 整个批次失败
            for (let i = 0; i < batch.length; i++) {
              errors.push({
                recordIndex: (batchIndex * batchSize) + i,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          }
        }
        
        return { records: results, errors };
      },
      undefined,
      true // 创建操作不缓存
    );
  }, [callApi, timeout, maxRetries]);
  
  return {
    // 状态
    loading,
    error,
    
    // API方法
    getTables,
    getFields,
    getRecords,
    createTable,
    createField,
    createRecords,
    
    // 工具方法
    clearCache,
    clearError,
    reset,
  };
}

/**
 * 简化的Feishu API Hook（适用于简单场景）
 */
export function useFeishuApiSimple() {
  const api = useFeishuApi({
    enableCache: true,
    enableLogging: true,
  });
  
  return api;
}
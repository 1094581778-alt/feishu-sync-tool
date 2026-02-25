/**
 * 飞书API统一客户端
 * 提供完整的飞书多维表格API封装，包括认证、表格、字段、记录等操作
 */

import type {
  AppConfig,
  FeishuTable,
  FeishuField,
  FeishuRecord,
  CreateTableRequest,
  CreateFieldRequest,
  RecordQueryOptions,
  BatchCreateRecordsRequest,
  BatchCreateRecordsResponse,
  FeishuTablesResponse,
  FeishuFieldsResponse,
  FeishuRecordsResponse,
  FieldType,
} from './types';

import { convertFieldType } from './types';

import {
  FeishuError,
  FeishuErrorCode,
  withFeishuErrorHandling,
  isFeishuApiError,
} from './errors';

import {
  feishuLogger,
  FeishuLogCategory,
  FeishuOperationType,
  FeishuLogContext,
  withApiLogging,
} from './logger';

/**
 * 客户端配置选项
 */
export interface FeishuClientOptions {
  appConfig?: AppConfig;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enableCache?: boolean;
  cacheTTL?: number;
  enableLogging?: boolean;
}

/**
 * 令牌缓存项
 */
interface TokenCacheItem {
  token: string;
  expiresAt: number;
}

/**
 * 飞书API统一客户端
 */
export class FeishuClient {
  private baseUrl: string;
  private appConfig?: AppConfig;
  private timeout: number;
  private maxRetries: number;
  private retryDelay: number;
  private enableCache: boolean;
  private cacheTTL: number;
  private enableLogging: boolean;
  
  private tokenCache: Map<string, TokenCacheItem> = new Map();
  private requestCache: Map<string, { data: any; expiresAt: number }> = new Map();
  
  /**
   * 创建飞书API客户端
   */
  constructor(options: FeishuClientOptions = {}) {
    this.baseUrl = options.baseUrl || 'https://open.feishu.cn/open-apis';
    this.appConfig = options.appConfig;
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.enableCache = options.enableCache ?? true;
    this.cacheTTL = options.cacheTTL || 300000; // 5分钟
    this.enableLogging = options.enableLogging ?? true;
    
    if (this.enableLogging) {
      feishuLogger.info(FeishuLogCategory.CLIENT, '飞书API客户端已初始化', {
        baseUrl: this.baseUrl,
        timeout: this.timeout,
        maxRetries: this.maxRetries,
        enableCache: this.enableCache,
      });
    }
  }
  
  /**
   * 设置应用配置
   */
  setAppConfig(appConfig: AppConfig): void {
    this.appConfig = appConfig;
    this.tokenCache.clear(); // 清除旧的令牌缓存
    
    if (this.enableLogging) {
      feishuLogger.info(FeishuLogCategory.CLIENT, '飞书应用配置已更新', {
        appId: appConfig.appId.substring(0, 8) + '...',
      });
    }
  }
  
  /**
   * 获取应用配置
   */
  getAppConfig(): AppConfig | undefined {
    return this.appConfig;
  }
  
  /**
   * 检查是否已配置应用凭证
   */
  hasAppConfig(): boolean {
    return !!(this.appConfig?.appId && this.appConfig?.appSecret);
  }
  
  /**
   * 获取访问令牌
   */
  async getAccessToken(appConfig?: AppConfig): Promise<string> {
    const config = appConfig || this.appConfig;
    
    if (!config?.appId || !config?.appSecret) {
      throw FeishuError.authMissing();
    }
    
    const cacheKey = `${config.appId}:${config.appSecret}`;
    
    // 检查缓存
    if (this.enableCache) {
      const cached = this.tokenCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        if (this.enableLogging) {
          feishuLogger.debug(FeishuLogCategory.AUTH, '使用缓存的访问令牌', {
            appId: config.appId.substring(0, 8) + '...',
            expiresIn: Math.floor((cached.expiresAt - Date.now()) / 1000),
          });
        }
        return cached.token;
      }
    }
    
    // 获取新令牌
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/auth/v3/tenant_access_token/internal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: config.appId,
          app_secret: config.appSecret,
        }),
      });
      
      const data = await response.json();
      
      if (data.code !== 0) {
        throw FeishuError.fromFeishuApiError(data, '获取访问令牌');
      }
      
      const token = data.tenant_access_token;
      const expiresIn = data.expire || 7200; // 默认2小时
      const expiresAt = Date.now() + (expiresIn * 1000) - 60000; // 提前1分钟过期
      
      // 缓存令牌
      if (this.enableCache) {
        this.tokenCache.set(cacheKey, { token, expiresAt });
      }
      
      const durationMs = Date.now() - startTime;
      feishuLogger.auth(config.appId, true, durationMs);
      
      return token;
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const authError = error instanceof Error ? error : new Error(String(error));
      feishuLogger.auth(config.appId, false, durationMs, authError);
      throw error;
    }
  }
  
  /**
   * 发送API请求
   */
  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      accessToken?: string;
      appConfig?: AppConfig;
      body?: any;
      headers?: Record<string, string>;
      query?: Record<string, string | number | boolean>;
      cacheKey?: string;
      skipCache?: boolean;
    } = {}
  ): Promise<T> {
    const {
      accessToken: providedToken,
      appConfig,
      body,
      headers = {},
      query = {},
      cacheKey,
      skipCache = false,
    } = options;
    
    // 检查缓存
    if (this.enableCache && !skipCache && cacheKey && method === 'GET') {
      const cached = this.requestCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        if (this.enableLogging) {
          feishuLogger.debug(FeishuLogCategory.API, '使用缓存的API响应', { cacheKey });
        }
        return cached.data;
      }
    }
    
    // 获取访问令牌
    let accessToken = providedToken;
    if (!accessToken) {
      const config = appConfig || this.appConfig;
      if (!config?.appId || !config?.appSecret) {
        throw FeishuError.authMissing();
      }
      accessToken = await this.getAccessToken(config);
    }
    
    // 构建URL
    let url = `${this.baseUrl}${endpoint}`;
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    // 构建请求头
    const requestHeaders: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    };
    
    // 构建请求配置
    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
    };
    
    if (body && method !== 'GET' && method !== 'HEAD') {
      requestOptions.body = JSON.stringify(body);
    }
    
    // 执行请求（带重试机制）
    const executeRequest = async (attempt = 1): Promise<T> => {
      const startTime = Date.now();
      const operation = this.getOperationTypeFromEndpoint(endpoint, method);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        requestOptions.signal = controller.signal;
        
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);
        
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};
        
        const durationMs = Date.now() - startTime;
        
        // 检查飞书API错误
        if (data.code !== 0) {
          throw FeishuError.fromFeishuApiError(data, `API请求失败: ${endpoint}`);
        }
        
        // 缓存响应
        if (this.enableCache && !skipCache && cacheKey && method === 'GET') {
          this.requestCache.set(cacheKey, {
            data: data.data,
            expiresAt: Date.now() + this.cacheTTL,
          });
        }
        
        if (this.enableLogging) {
          const logContext: FeishuLogContext = {
            apiUrl: url,
            httpMethod: method,
            httpStatus: response.status,
            durationMs,
          };
          
          feishuLogger.apiCall(operation, url, method, durationMs, true, logContext);
        }
        
        return data.data;
      } catch (error) {
        const durationMs = Date.now() - startTime;
        
        if (this.enableLogging) {
          const logContext: FeishuLogContext = {
            apiUrl: url,
            httpMethod: method,
            durationMs,
            retryCount: attempt - 1,
          };
          
          feishuLogger.apiCall(operation, url, method, durationMs, false, logContext);
          
          if (error instanceof Error) {
            feishuLogger.error(FeishuLogCategory.API, `API请求失败: ${endpoint}`, error, logContext);
          }
        }
        
        // 重试逻辑
        if (attempt < this.maxRetries && this.shouldRetry(error)) {
          if (this.enableLogging) {
            feishuLogger.debug(FeishuLogCategory.API, `准备重试请求 (${attempt}/${this.maxRetries})`, {
              endpoint,
              delay: this.retryDelay,
            });
          }
          
          await this.delay(this.retryDelay * attempt);
          return executeRequest(attempt + 1);
        }
        
        throw error;
      }
    };
    
    return withFeishuErrorHandling(() => executeRequest(), `请求飞书API: ${endpoint}`);
  }
  
  /**
   * 根据端点和方法获取操作类型
   */
  private getOperationTypeFromEndpoint(endpoint: string, method: string): FeishuOperationType {
    if (endpoint.includes('/auth/')) {
      return FeishuOperationType.GET_ACCESS_TOKEN;
    } else if (endpoint.includes('/tables') && method === 'GET') {
      return FeishuOperationType.GET_TABLES;
    } else if (endpoint.includes('/tables') && method === 'POST') {
      return FeishuOperationType.CREATE_TABLE;
    } else if (endpoint.includes('/fields') && method === 'GET') {
      return FeishuOperationType.GET_FIELDS;
    } else if (endpoint.includes('/fields') && method === 'POST') {
      return FeishuOperationType.CREATE_FIELD;
    } else if (endpoint.includes('/records') && method === 'GET') {
      return FeishuOperationType.GET_RECORDS;
    } else if (endpoint.includes('/records') && method === 'POST') {
      return FeishuOperationType.CREATE_RECORDS;
    } else if (endpoint.includes('/records/batch_create')) {
      return FeishuOperationType.BATCH_OPERATION;
    } else {
      return FeishuOperationType.SYNC_DATA;
    }
  }
  
  /**
   * 判断是否应该重试
   */
  private shouldRetry(error: any): boolean {
    // 网络错误、超时、服务不可用等可以重试
    if (error.name === 'AbortError') {
      return true; // 超时
    }
    
    if (error instanceof FeishuError) {
      // 某些飞书错误可以重试
      const retryableCodes = [
        FeishuErrorCode.API_RATE_LIMITED,
        FeishuErrorCode.API_SERVICE_UNAVAILABLE,
        FeishuErrorCode.API_TIMEOUT,
        FeishuErrorCode.AUTH_TOKEN_EXPIRED,
      ];
      return retryableCodes.includes(error.code);
    }
    
    // 网络错误
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ========== 表格操作 ==========
  
  /**
   * 获取表格列表
   */
  async getTables(spreadsheetToken: string, options?: {
    appConfig?: AppConfig;
    skipCache?: boolean;
  }): Promise<FeishuTable[]> {
    const { appConfig, skipCache = false } = options || {};
    
    const data = await this.request<FeishuTablesResponse>(
      'GET',
      `/bitable/v1/apps/${spreadsheetToken}/tables`,
      {
        appConfig,
        cacheKey: `tables:${spreadsheetToken}`,
        skipCache,
      }
    );
    
    return data.items || [];
  }
  
  /**
   * 创建新表格
   */
  async createTable(spreadsheetToken: string, request: CreateTableRequest, options?: {
    appConfig?: AppConfig;
  }): Promise<FeishuTable> {
    const { appConfig } = options || {};
    
    const data = await this.request<{ table: FeishuTable }>(
      'POST',
      `/bitable/v1/apps/${spreadsheetToken}/tables`,
      {
        appConfig,
        body: { table: request },
      }
    );
    
    // 清除表格列表缓存
    if (this.enableCache) {
      this.requestCache.delete(`tables:${spreadsheetToken}`);
    }
    
    return data.table;
  }
  
  // ========== 字段操作 ==========
  
  /**
   * 获取字段列表
   */
  async getFields(spreadsheetToken: string, tableId: string, options?: {
    appConfig?: AppConfig;
    skipCache?: boolean;
  }): Promise<FeishuField[]> {
    const { appConfig, skipCache = false } = options || {};
    
    const data = await this.request<FeishuFieldsResponse>(
      'GET',
      `/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/fields`,
      {
        appConfig,
        cacheKey: `fields:${spreadsheetToken}:${tableId}`,
        skipCache,
      }
    );
    
    return data.items || [];
  }
  
  /**
   * 创建新字段
   */
  async createField(spreadsheetToken: string, tableId: string, request: CreateFieldRequest, options?: {
    appConfig?: AppConfig;
  }): Promise<FeishuField> {
    const { appConfig } = options || {};
    
    const data = await this.request<{ field: FeishuField }>(
      'POST',
      `/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/fields`,
      {
        appConfig,
        body: request,
      }
    );
    
    // 清除字段列表缓存
    if (this.enableCache) {
      this.requestCache.delete(`fields:${spreadsheetToken}:${tableId}`);
    }
    
    return data.field;
  }
  
  /**
   * 根据字段类型名称创建字段
   */
  async createFieldWithTypeName(
    spreadsheetToken: string,
    tableId: string,
    fieldName: string,
    fieldType: string | number,
    options?: {
      appConfig?: AppConfig;
      property?: Record<string, any>;
      description?: string;
    }
  ): Promise<FeishuField> {
    const { appConfig, property, description } = options || {};
    
    const typeCode = convertFieldType(fieldType);
    
    const request: CreateFieldRequest = {
      field_name: fieldName,
      type: typeCode,
    };
    
    if (property) {
      request.property = property;
    }
    
    if (description) {
      request.description = description;
    }
    
    return this.createField(spreadsheetToken, tableId, request, { appConfig });
  }
  
  // ========== 记录操作 ==========
  
  /**
   * 获取记录列表
   */
  async getRecords(
    spreadsheetToken: string,
    tableId: string,
    options?: {
      appConfig?: AppConfig;
      query?: RecordQueryOptions;
      skipCache?: boolean;
    }
  ): Promise<FeishuRecord[]> {
    const { appConfig, query = {}, skipCache = false } = options || {};
    
    const queryParams: Record<string, any> = {};
    
    if (query.pageSize) {
      queryParams.page_size = query.pageSize;
    }
    
    if (query.pageToken) {
      queryParams.page_token = query.pageToken;
    }
    
    if (query.filter) {
      queryParams.filter = query.filter;
    }
    
    if (query.sort) {
      queryParams.sort = query.sort;
    }
    
    if (query.fieldNames && query.fieldNames.length > 0) {
      queryParams.field_names = query.fieldNames.join(',');
    }
    
    const data = await this.request<FeishuRecordsResponse>(
      'GET',
      `/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/records`,
      {
        appConfig,
        query: queryParams,
        cacheKey: `records:${spreadsheetToken}:${tableId}:${JSON.stringify(queryParams)}`,
        skipCache,
      }
    );
    
    return data.items || [];
  }
  
  /**
   * 批量创建记录
   */
  async createRecords(
    spreadsheetToken: string,
    tableId: string,
    records: Array<Record<string, any>>,
    options?: {
      appConfig?: AppConfig;
      batchSize?: number;
    }
  ): Promise<BatchCreateRecordsResponse> {
    const { appConfig, batchSize = 100 } = options || {};
    
    if (!records.length) {
      return { records: [], errors: [] };
    }
    
    // 分批处理
    const batches: Array<Array<Record<string, any>>> = [];
    for (let i = 0; i < records.length; i += batchSize) {
      batches.push(records.slice(i, i + batchSize));
    }
    
    const results: FeishuRecord[] = [];
    const errors: Array<{ recordIndex: number; error: string }> = [];
    
    const startTime = Date.now();
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        const requestBody: BatchCreateRecordsRequest = {
          records: batch.map(fields => ({ fields })),
        };
        
        const data = await this.request<BatchCreateRecordsResponse>(
          'POST',
          `/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/records/batch_create`,
          {
            appConfig,
            body: requestBody,
          }
        );
        
        if (data.records) {
          results.push(...data.records);
        }
        
        if (data.errors) {
          // 调整错误索引以反映全局位置
          const adjustedErrors = data.errors.map(error => ({
            recordIndex: (batchIndex * batchSize) + error.recordIndex,
            error: error.error,
          }));
          errors.push(...adjustedErrors);
        }
      } catch (error) {
        // 整个批次失败，为每个记录添加错误
        for (let i = 0; i < batch.length; i++) {
          const recordIndex = (batchIndex * batchSize) + i;
          errors.push({
            recordIndex,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    
    const durationMs = Date.now() - startTime;
    
    // 记录批量操作日志
    feishuLogger.batchOperation(
      FeishuOperationType.CREATE_RECORDS,
      records.length,
      results.length,
      errors.length,
      durationMs,
      {
        spreadsheetToken,
        tableId,
        batchSize,
        batchCount: batches.length,
      }
    );
    
    // 清除记录缓存
    if (this.enableCache) {
      const cacheKeys = Array.from(this.requestCache.keys()).filter(key => 
        key.startsWith(`records:${spreadsheetToken}:${tableId}`)
      );
      cacheKeys.forEach(key => this.requestCache.delete(key));
    }
    
    return {
      records: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
  
  // ========== 工具方法 ==========
  
  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.tokenCache.clear();
    this.requestCache.clear();
    
    if (this.enableLogging) {
      feishuLogger.info(FeishuLogCategory.CLIENT, '已清除所有缓存');
    }
  }
  
  /**
   * 清除特定资源的缓存
   */
  clearResourceCache(resourceType: 'tables' | 'fields' | 'records', spreadsheetToken: string, tableId?: string): void {
    let pattern: RegExp;
    
    switch (resourceType) {
      case 'tables':
        pattern = new RegExp(`^tables:${spreadsheetToken}`);
        break;
      case 'fields':
        if (!tableId) {
          throw new Error('清除字段缓存需要tableId参数');
        }
        pattern = new RegExp(`^fields:${spreadsheetToken}:${tableId}`);
        break;
      case 'records':
        if (!tableId) {
          throw new Error('清除记录缓存需要tableId参数');
        }
        pattern = new RegExp(`^records:${spreadsheetToken}:${tableId}`);
        break;
    }
    
    const cacheKeys = Array.from(this.requestCache.keys()).filter(key => pattern.test(key));
    cacheKeys.forEach(key => this.requestCache.delete(key));
    
    if (this.enableLogging) {
      feishuLogger.debug(FeishuLogCategory.CLIENT, `已清除${resourceType}缓存`, {
        spreadsheetToken,
        tableId,
        clearedCount: cacheKeys.length,
      });
    }
  }
  
  /**
   * 获取客户端状态
   */
  getStatus(): {
    hasAppConfig: boolean;
    cacheEnabled: boolean;
    tokenCacheSize: number;
    requestCacheSize: number;
    loggingEnabled: boolean;
  } {
    return {
      hasAppConfig: this.hasAppConfig(),
      cacheEnabled: this.enableCache,
      tokenCacheSize: this.tokenCache.size,
      requestCacheSize: this.requestCache.size,
      loggingEnabled: this.enableLogging,
    };
  }
}

/**
 * 创建默认的飞书API客户端
 */
export function createFeishuClient(options?: FeishuClientOptions): FeishuClient {
  return new FeishuClient(options);
}
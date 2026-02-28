/**
 * 飞书API路由共享工具
 * 提供API路由中常用的工具函数，如参数验证、错误处理、响应构建等
 */

import { NextRequest, NextResponse } from 'next/server';
import type { AppConfig } from './types';
import { FeishuError, FeishuErrorCode, handleError, ApiErrorResponse } from './errors';
import { feishuLogger, FeishuLogCategory } from './logger';

/**
 * 从请求中提取飞书应用配置
 */
export interface FeishuApiRequest {
  token: string;
  appId?: string;
  appSecret?: string;
  [key: string]: any;
}

/**
 * 验证必需的请求参数
 */
export function validateRequiredParams(
  params: Record<string, any>,
  requiredParams: string[]
): { valid: true } | { valid: false; error: FeishuError } {
  for (const param of requiredParams) {
    if (!params[param]) {
      return {
        valid: false,
        error: FeishuError.paramMissing(param),
      };
    }
  }
  return { valid: true };
}

/**
 * 从请求体中提取飞书应用配置
 * 注意：不再从环境变量获取配置，用户必须在界面中配置
 */
export function extractAppConfig(body: any): AppConfig | null {
  const { appId, appSecret } = body;
  
  if (appId && appSecret) {
    return { appId, appSecret };
  }
  
  return null;
}

/**
 * 构建成功的API响应
 */
export function buildSuccessResponse<T = any>(data: T) {
  return NextResponse.json({
    success: true as const,
    ...(typeof data === 'object' ? data : { data }),
  });
}

/**
 * 构建标准化的错误响应
 */
export function buildErrorResponse(error: FeishuError | ApiErrorResponse) {
  const errorResponse = error instanceof FeishuError ? error.toResponse() : error;
  const status = error instanceof FeishuError ? error.getHttpStatus() : 500;
  
  feishuLogger.error(FeishuLogCategory.API, 'API请求失败', error instanceof Error ? error : undefined, {
    errorCode: errorResponse.error.code,
    errorMessage: errorResponse.error.message,
  });
  
  return NextResponse.json(errorResponse, { status });
}

/**
 * 处理API路由请求的统一包装器
 */
export async function withApiHandler<T>(
  handler: (req: NextRequest) => Promise<T>,
  req: NextRequest,
  context?: string
): Promise<Response> {
  try {
    const result = await handler(req);
    return buildSuccessResponse(result);
  } catch (error) {
    const errorResponse = handleError(error);
    return buildErrorResponse(errorResponse);
  }
}

/**
 * 解析飞书API请求体
 */
export async function parseFeishuRequest(req: NextRequest): Promise<{
  body: any;
  appConfig: AppConfig | null;
  spreadsheetToken: string | null;
  tableId?: string;
}> {
  let body: any = {};
  
  try {
    body = await req.json();
  } catch (error) {
    throw new FeishuError(
      FeishuErrorCode.PARAM_INVALID_FORMAT,
      '请求体必须是有效的JSON格式'
    );
  }
  
  const appConfig = extractAppConfig(body);
  const spreadsheetToken = body.token || null;
  const tableId = body.tableId;
  
  return { body, appConfig, spreadsheetToken, tableId };
}

/**
 * 验证飞书应用配置
 */
export function validateAppConfig(appConfig: AppConfig | null): AppConfig {
  if (!appConfig?.appId || !appConfig?.appSecret) {
    throw FeishuError.authMissing();
  }
  
  return appConfig;
}

/**
 * 创建FeishuClient实例的工厂函数
 */
import { FeishuClient, FeishuClientOptions } from './client';

export function createApiFeishuClient(appConfig: AppConfig, options?: FeishuClientOptions): FeishuClient {
  return new FeishuClient({
    appConfig,
    enableLogging: true,
    enableCache: true,
    timeout: 30000,
    maxRetries: 3,
    ...options,
  });
}

/**
 * 处理分页参数
 */
export interface PaginationParams {
  pageSize?: number;
  pageToken?: string;
}

export function parsePaginationParams(body: any): PaginationParams {
  const pageSize = body.pageSize ? parseInt(body.pageSize, 10) : undefined;
  const pageToken = body.pageToken || undefined;
  
  // 验证pageSize范围
  if (pageSize !== undefined && (pageSize < 1 || pageSize > 1000)) {
    throw new FeishuError(
      FeishuErrorCode.PARAM_OUT_OF_RANGE,
      'pageSize必须在1到1000之间'
    );
  }
  
  return { pageSize, pageToken };
}

/**
 * 转换飞书表格数据到前端格式
 */
export function transformFeishuTable(table: any) {
  return {
    id: table.table_id || table.id,
    name: table.name,
    revision: table.revision,
    createdTime: table.created_time,
    modifiedTime: table.modified_time,
  };
}

/**
 * 转换飞书字段数据到前端格式
 */
export function transformFeishuField(field: any) {
  return {
    id: field.field_id || field.id,
    field_name: field.field_name || field.name,
    name: field.field_name || field.name,
    type: field.type,
    property: field.property || {},
    description: field.description,
  };
}

/**
 * 转换飞书记录数据到前端格式
 */
export function transformFeishuRecord(record: any, fieldMap?: Map<string, string>) {
  const formatted: any = {
    id: record.record_id || record.id,
    fields: {},
  };
  
  if (record.created_time) {
    formatted.createdTime = record.created_time;
  }
  
  if (record.modified_time) {
    formatted.modifiedTime = record.modified_time;
  }
  
  if (record.created_user) {
    formatted.createdUser = record.created_user;
  }
  
  if (record.modified_user) {
    formatted.modifiedUser = record.modified_user;
  }
  
  // 转换字段
  Object.entries(record.fields || {}).forEach(([fieldId, value]) => {
    const fieldName = fieldMap?.get(fieldId) || fieldId;
    formatted.fields[fieldName] = value;
  });
  
  return formatted;
}

/**
 * 日志记录中间件
 */
export function withRequestLogging(
  req: NextRequest,
  handlerName: string,
  extraContext?: Record<string, any>
) {
  const startTime = Date.now();
  const url = req.url;
  const method = req.method;
  
  feishuLogger.info(FeishuLogCategory.API, `开始处理API请求: ${handlerName}`, {
    url,
    method,
    handlerName,
    ...extraContext,
  });
  
  return {
    end: (success: boolean, result?: any, error?: Error) => {
      const durationMs = Date.now() - startTime;
      
      if (success) {
        feishuLogger.info(FeishuLogCategory.API, `API请求成功: ${handlerName}`, {
          url,
          method,
          handlerName,
          durationMs,
          ...extraContext,
        });
      } else {
        feishuLogger.error(FeishuLogCategory.API, `API请求失败: ${handlerName}`, error, {
          url,
          method,
          handlerName,
          durationMs,
          ...extraContext,
        });
      }
    },
  };
}
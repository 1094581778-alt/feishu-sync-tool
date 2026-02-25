/**
 * 飞书API错误处理系统
 * 提供统一的错误码定义、错误类和错误处理机制
 */

/**
 * 飞书API错误码枚举
 */
export enum FeishuErrorCode {
  // 认证相关错误 (1000-1099)
  AUTH_MISSING_CREDENTIALS = 'FEISHU_AUTH_1001',
  AUTH_INVALID_CREDENTIALS = 'FEISHU_AUTH_1002',
  AUTH_TOKEN_EXPIRED = 'FEISHU_AUTH_1003',
  AUTH_RATE_LIMITED = 'FEISHU_AUTH_1004',
  AUTH_PERMISSION_DENIED = 'FEISHU_AUTH_1005',
  
  // 参数验证错误 (1100-1199)
  PARAM_MISSING_REQUIRED = 'FEISHU_PARAM_1101',
  PARAM_INVALID_FORMAT = 'FEISHU_PARAM_1102',
  PARAM_OUT_OF_RANGE = 'FEISHU_PARAM_1103',
  PARAM_DUPLICATE = 'FEISHU_PARAM_1104',
  
  // API调用错误 (1200-1299)
  API_REQUEST_FAILED = 'FEISHU_API_1201',
  API_RESPONSE_INVALID = 'FEISHU_API_1202',
  API_RATE_LIMITED = 'FEISHU_API_1203',
  API_SERVICE_UNAVAILABLE = 'FEISHU_API_1204',
  API_TIMEOUT = 'FEISHU_API_1205',
  
  // 资源操作错误 (1300-1399)
  RESOURCE_NOT_FOUND = 'FEISHU_RESOURCE_1301',
  RESOURCE_ALREADY_EXISTS = 'FEISHU_RESOURCE_1302',
  RESOURCE_CONFLICT = 'FEISHU_RESOURCE_1303',
  RESOURCE_LIMIT_EXCEEDED = 'FEISHU_RESOURCE_1304',
  
  // 数据处理错误 (1400-1499)
  DATA_VALIDATION_FAILED = 'FEISHU_DATA_1401',
  DATA_TRANSFORM_FAILED = 'FEISHU_DATA_1402',
  DATA_SYNC_FAILED = 'FEISHU_DATA_1403',
  DATA_BATCH_FAILED = 'FEISHU_DATA_1404',
  
  // 系统错误 (1500-1599)
  SYSTEM_INTERNAL_ERROR = 'FEISHU_SYSTEM_1501',
  SYSTEM_CONFIG_ERROR = 'FEISHU_SYSTEM_1502',
  SYSTEM_NETWORK_ERROR = 'FEISHU_SYSTEM_1503',
  SYSTEM_UNKNOWN_ERROR = 'FEISHU_SYSTEM_1599',
}

/**
 * 错误码到HTTP状态码的映射
 */
export const ERROR_CODE_TO_STATUS: Record<FeishuErrorCode, number> = {
  [FeishuErrorCode.AUTH_MISSING_CREDENTIALS]: 401,
  [FeishuErrorCode.AUTH_INVALID_CREDENTIALS]: 401,
  [FeishuErrorCode.AUTH_TOKEN_EXPIRED]: 401,
  [FeishuErrorCode.AUTH_RATE_LIMITED]: 429,
  [FeishuErrorCode.AUTH_PERMISSION_DENIED]: 403,
  
  [FeishuErrorCode.PARAM_MISSING_REQUIRED]: 400,
  [FeishuErrorCode.PARAM_INVALID_FORMAT]: 400,
  [FeishuErrorCode.PARAM_OUT_OF_RANGE]: 400,
  [FeishuErrorCode.PARAM_DUPLICATE]: 400,
  
  [FeishuErrorCode.API_REQUEST_FAILED]: 502,
  [FeishuErrorCode.API_RESPONSE_INVALID]: 502,
  [FeishuErrorCode.API_RATE_LIMITED]: 429,
  [FeishuErrorCode.API_SERVICE_UNAVAILABLE]: 503,
  [FeishuErrorCode.API_TIMEOUT]: 504,
  
  [FeishuErrorCode.RESOURCE_NOT_FOUND]: 404,
  [FeishuErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [FeishuErrorCode.RESOURCE_CONFLICT]: 409,
  [FeishuErrorCode.RESOURCE_LIMIT_EXCEEDED]: 429,
  
  [FeishuErrorCode.DATA_VALIDATION_FAILED]: 422,
  [FeishuErrorCode.DATA_TRANSFORM_FAILED]: 422,
  [FeishuErrorCode.DATA_SYNC_FAILED]: 500,
  [FeishuErrorCode.DATA_BATCH_FAILED]: 500,
  
  [FeishuErrorCode.SYSTEM_INTERNAL_ERROR]: 500,
  [FeishuErrorCode.SYSTEM_CONFIG_ERROR]: 500,
  [FeishuErrorCode.SYSTEM_NETWORK_ERROR]: 503,
  [FeishuErrorCode.SYSTEM_UNKNOWN_ERROR]: 500,
};

/**
 * 错误码到友好消息的映射
 */
export const ERROR_CODE_TO_MESSAGE: Record<FeishuErrorCode, string> = {
  [FeishuErrorCode.AUTH_MISSING_CREDENTIALS]: '飞书凭证缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret',
  [FeishuErrorCode.AUTH_INVALID_CREDENTIALS]: '飞书凭证无效，请检查 App ID 和 App Secret 是否正确',
  [FeishuErrorCode.AUTH_TOKEN_EXPIRED]: '访问令牌已过期，请重新获取',
  [FeishuErrorCode.AUTH_RATE_LIMITED]: '认证请求过于频繁，请稍后再试',
  [FeishuErrorCode.AUTH_PERMISSION_DENIED]: '权限不足，请检查飞书应用权限配置',
  
  [FeishuErrorCode.PARAM_MISSING_REQUIRED]: '缺少必需参数',
  [FeishuErrorCode.PARAM_INVALID_FORMAT]: '参数格式无效',
  [FeishuErrorCode.PARAM_OUT_OF_RANGE]: '参数值超出允许范围',
  [FeishuErrorCode.PARAM_DUPLICATE]: '参数重复',
  
  [FeishuErrorCode.API_REQUEST_FAILED]: '飞书API请求失败',
  [FeishuErrorCode.API_RESPONSE_INVALID]: '飞书API响应无效',
  [FeishuErrorCode.API_RATE_LIMITED]: '飞书API调用频率限制，请稍后再试',
  [FeishuErrorCode.API_SERVICE_UNAVAILABLE]: '飞书服务暂时不可用',
  [FeishuErrorCode.API_TIMEOUT]: '飞书API请求超时',
  
  [FeishuErrorCode.RESOURCE_NOT_FOUND]: '请求的资源不存在',
  [FeishuErrorCode.RESOURCE_ALREADY_EXISTS]: '资源已存在',
  [FeishuErrorCode.RESOURCE_CONFLICT]: '资源冲突',
  [FeishuErrorCode.RESOURCE_LIMIT_EXCEEDED]: '资源使用超出限制',
  
  [FeishuErrorCode.DATA_VALIDATION_FAILED]: '数据验证失败',
  [FeishuErrorCode.DATA_TRANSFORM_FAILED]: '数据转换失败',
  [FeishuErrorCode.DATA_SYNC_FAILED]: '数据同步失败',
  [FeishuErrorCode.DATA_BATCH_FAILED]: '批量数据处理失败',
  
  [FeishuErrorCode.SYSTEM_INTERNAL_ERROR]: '系统内部错误',
  [FeishuErrorCode.SYSTEM_CONFIG_ERROR]: '系统配置错误',
  [FeishuErrorCode.SYSTEM_NETWORK_ERROR]: '网络连接错误',
  [FeishuErrorCode.SYSTEM_UNKNOWN_ERROR]: '未知系统错误',
};

/**
 * 飞书API错误类
 */
export class FeishuError extends Error {
  constructor(
    public code: FeishuErrorCode,
    message?: string,
    public details?: any,
    public originalError?: Error
  ) {
    super(message || ERROR_CODE_TO_MESSAGE[code]);
    this.name = 'FeishuError';
    
    // 保持错误栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FeishuError);
    }
  }
  
  /**
   * 转换为HTTP响应格式
   */
  toResponse() {
    return {
      success: false as const,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: new Date().toISOString(),
      },
    };
  }
  
  /**
   * 获取HTTP状态码
   */
  getHttpStatus(): number {
    return ERROR_CODE_TO_STATUS[this.code];
  }
  
  /**
   * 从飞书API错误创建FeishuError
   */
  static fromFeishuApiError(feishuError: any, context?: string): FeishuError {
    const code = feishuError.code;
    const msg = feishuError.msg || '未知错误';
    
    let errorCode: FeishuErrorCode;
    let details: any = { feishuError };
    
    // 根据飞书错误码映射到我们的错误码
    switch (code) {
      case 99991663: // 无效的app_id或app_secret
      case 99991664:
        errorCode = FeishuErrorCode.AUTH_INVALID_CREDENTIALS;
        break;
      case 99991671: // 访问令牌过期
        errorCode = FeishuErrorCode.AUTH_TOKEN_EXPIRED;
        break;
      case 99991700: // 权限不足
        errorCode = FeishuErrorCode.AUTH_PERMISSION_DENIED;
        break;
      case 99991704: // 资源不存在
        errorCode = FeishuErrorCode.RESOURCE_NOT_FOUND;
        break;
      case 99991714: // 请求过于频繁
        errorCode = FeishuErrorCode.API_RATE_LIMITED;
        break;
      default:
        errorCode = FeishuErrorCode.API_REQUEST_FAILED;
        details = { ...details, feishuCode: code, feishuMsg: msg };
    }
    
    const message = context ? `${context}: ${msg}` : msg;
    return new FeishuError(errorCode, message, details);
  }
  
  /**
   * 从原生错误创建FeishuError
   */
  static fromNativeError(error: Error, code: FeishuErrorCode = FeishuErrorCode.SYSTEM_INTERNAL_ERROR): FeishuError {
    return new FeishuError(code, error.message, undefined, error);
  }
  
  /**
   * 创建参数验证错误
   */
  static paramMissing(paramName: string): FeishuError {
    return new FeishuError(
      FeishuErrorCode.PARAM_MISSING_REQUIRED,
      `缺少必需参数: ${paramName}`,
      { paramName }
    );
  }
  
  /**
   * 创建认证错误
   */
  static authMissing(): FeishuError {
    return new FeishuError(FeishuErrorCode.AUTH_MISSING_CREDENTIALS);
  }
  
  /**
   * 创建资源未找到错误
   */
  static resourceNotFound(resourceType: string, resourceId: string): FeishuError {
    return new FeishuError(
      FeishuErrorCode.RESOURCE_NOT_FOUND,
      `${resourceType}未找到: ${resourceId}`,
      { resourceType, resourceId }
    );
  }
}

/**
 * 统一的错误响应格式
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
  };
}

/**
 * 判断是否为飞书API错误
 */
export function isFeishuApiError(error: any): error is FeishuApiError {
  return error && typeof error === 'object' && 'code' in error && 'msg' in error;
}

/**
 * 飞书API错误类型
 */
export interface FeishuApiError {
  code: number;
  msg: string;
  data?: any;
}

/**
 * 错误处理工具函数
 */
export function handleError(error: unknown): ApiErrorResponse {
  if (error instanceof FeishuError) {
    return error.toResponse();
  }
  
  if (isFeishuApiError(error)) {
    const feishuError = FeishuError.fromFeishuApiError(error);
    return feishuError.toResponse();
  }
  
  const nativeError = error instanceof Error ? error : new Error(String(error));
  const feishuError = FeishuError.fromNativeError(nativeError);
  return feishuError.toResponse();
}

/**
 * 包装异步函数，提供统一的错误处理
 */
export async function withFeishuErrorHandling<T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof FeishuError) {
      throw error;
    }
    
    if (isFeishuApiError(error)) {
      throw FeishuError.fromFeishuApiError(error, context);
    }
    
    throw FeishuError.fromNativeError(
      error instanceof Error ? error : new Error(String(error)),
      FeishuErrorCode.SYSTEM_INTERNAL_ERROR
    );
  }
}
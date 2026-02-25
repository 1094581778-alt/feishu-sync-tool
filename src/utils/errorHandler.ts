/**
 * 错误处理机制
 */

/**
 * API 错误类型
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 文件上传错误类型
 */
export class FileUploadError extends Error {
  constructor(
    public code: string,
    message: string,
    public fileName?: string
  ) {
    super(message);
    this.name = 'FileUploadError';
  }
}

/**
 * 飞书 API 错误类型
 */
export class FeishuApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public requestId?: string
  ) {
    super(message);
    this.name = 'FeishuApiError';
  }
}

/**
 * 错误码定义
 */
export const ERROR_CODES = {
  // 通用错误
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // API 错误
  API_ERROR: 'API_ERROR',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_UNAUTHORIZED: 'API_UNAUTHORIZED',
  API_FORBIDDEN: 'API_FORBIDDEN',
  API_NOT_FOUND: 'API_NOT_FOUND',
  
  // 文件上传错误
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',
  
  // 飞书 API 错误
  FEISHU_CONFIG_MISSING: 'FEISHU_CONFIG_MISSING',
  FEISHU_TOKEN_INVALID: 'FEISHU_TOKEN_INVALID',
  FEISHU_TABLE_NOT_FOUND: 'FEISHU_TABLE_NOT_FOUND',
  FEISHU_FIELD_NOT_FOUND: 'FEISHU_FIELD_NOT_FOUND',
  
  // 数据错误
  INVALID_DATA: 'INVALID_DATA',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * 错误消息映射
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.UNKNOWN_ERROR]: '发生未知错误',
  [ERROR_CODES.NETWORK_ERROR]: '网络连接失败',
  [ERROR_CODES.TIMEOUT_ERROR]: '请求超时',
  
  [ERROR_CODES.API_ERROR]: 'API 调用失败',
  [ERROR_CODES.API_RATE_LIMIT]: 'API 调用频率过高，请稍后重试',
  [ERROR_CODES.API_UNAUTHORIZED]: '未授权，请检查配置',
  [ERROR_CODES.API_FORBIDDEN]: '无权限访问',
  [ERROR_CODES.API_NOT_FOUND]: '请求的资源不存在',
  
  [ERROR_CODES.FILE_TOO_LARGE]: '文件过大',
  [ERROR_CODES.INVALID_FILE_TYPE]: '不支持的文件类型',
  [ERROR_CODES.FILE_UPLOAD_FAILED]: '文件上传失败',
  
  [ERROR_CODES.FEISHU_CONFIG_MISSING]: '飞书配置缺失',
  [ERROR_CODES.FEISHU_TOKEN_INVALID]: '飞书 Token 无效',
  [ERROR_CODES.FEISHU_TABLE_NOT_FOUND]: '工作表不存在',
  [ERROR_CODES.FEISHU_FIELD_NOT_FOUND]: '字段不存在',
  
  [ERROR_CODES.INVALID_DATA]: '数据格式错误',
  [ERROR_CODES.MISSING_REQUIRED_FIELD]: '缺少必要字段',
};

/**
 * 处理 API 错误
 */
export function handleApiError(error: unknown, context?: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    // 判断错误类型
    if (error.message.includes('timeout') || error.message.includes('超时')) {
      const message = context
        ? `${context}: ${ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR]}`
        : ERROR_MESSAGES[ERROR_CODES.TIMEOUT_ERROR];
      return new ApiError(ERROR_CODES.TIMEOUT_ERROR, message);
    }

    if (error.message.includes('network') || error.message.includes('网络')) {
      const message = context
        ? `${context}: ${ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]}`
        : ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR];
      return new ApiError(ERROR_CODES.NETWORK_ERROR, message);
    }

    const message = context
      ? `${context}: ${error.message}`
      : error.message;
    return new ApiError(ERROR_CODES.API_ERROR, message);
  }

  const message = context
    ? `${context}: ${ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]}`
    : ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
  return new ApiError(ERROR_CODES.UNKNOWN_ERROR, message);
}

/**
 * 处理文件上传错误
 */
export function handleFileUploadError(error: unknown, fileName?: string): FileUploadError {
  if (error instanceof FileUploadError) {
    return error;
  }
  
  if (error instanceof Error) {
    if (error.message.includes('size') || error.message.includes('大小')) {
      return new FileUploadError(ERROR_CODES.FILE_TOO_LARGE, ERROR_MESSAGES[ERROR_CODES.FILE_TOO_LARGE], fileName);
    }
    
    if (error.message.includes('type') || error.message.includes('类型')) {
      return new FileUploadError(ERROR_CODES.INVALID_FILE_TYPE, ERROR_MESSAGES[ERROR_CODES.INVALID_FILE_TYPE], fileName);
    }
    
    return new FileUploadError(ERROR_CODES.FILE_UPLOAD_FAILED, error.message, fileName);
  }
  
  return new FileUploadError(ERROR_CODES.UNKNOWN_ERROR, ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR], fileName);
}

/**
 * 处理飞书 API 错误
 */
export function handleFeishuApiError(error: unknown): FeishuApiError {
  if (error instanceof FeishuApiError) {
    return error;
  }
  
  if (error instanceof Error) {
    // 尝试从错误消息中提取错误信息
    const message = error.message;
    
    if (message.includes('config') || message.includes('配置')) {
      return new FeishuApiError(ERROR_CODES.FEISHU_CONFIG_MISSING, ERROR_MESSAGES[ERROR_CODES.FEISHU_CONFIG_MISSING]);
    }
    
    if (message.includes('token') || message.includes('令牌')) {
      return new FeishuApiError(ERROR_CODES.FEISHU_TOKEN_INVALID, ERROR_MESSAGES[ERROR_CODES.FEISHU_TOKEN_INVALID]);
    }
    
    if (message.includes('table') || message.includes('表格')) {
      return new FeishuApiError(ERROR_CODES.FEISHU_TABLE_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.FEISHU_TABLE_NOT_FOUND]);
    }
    
    if (message.includes('field') || message.includes('字段')) {
      return new FeishuApiError(ERROR_CODES.FEISHU_FIELD_NOT_FOUND, ERROR_MESSAGES[ERROR_CODES.FEISHU_FIELD_NOT_FOUND]);
    }
    
    return new FeishuApiError(ERROR_CODES.API_ERROR, message);
  }
  
  return new FeishuApiError(ERROR_CODES.UNKNOWN_ERROR, ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]);
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof ApiError || error instanceof FileUploadError || error instanceof FeishuApiError) {
    return error.message;
  }
  
  return ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: Error): boolean {
  if (error instanceof ApiError) {
    const retryableCodes = [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.TIMEOUT_ERROR,
      ERROR_CODES.API_RATE_LIMIT,
    ] as const;
    return retryableCodes.includes(error.code as any);
  }

  return false;
}

/**
 * 创建标准化的错误响应对象
 */
export function createErrorResponse(error: unknown, statusCode: number = 500) {
  let handledError: Error;
  
  if (error instanceof ApiError || error instanceof FileUploadError || error instanceof FeishuApiError) {
    handledError = error;
  } else {
    handledError = handleApiError(error);
  }
  
  return {
    error: handledError.message,
    code: handledError instanceof ApiError ? handledError.code : ERROR_CODES.UNKNOWN_ERROR,
    details: handledError instanceof ApiError ? handledError.details : undefined,
    timestamp: new Date().toISOString(),
    statusCode,
  };
}

/**
 * 获取错误的HTTP状态码
 */
export function getErrorStatusCode(error: Error): number {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ERROR_CODES.API_UNAUTHORIZED:
        return 401;
      case ERROR_CODES.API_FORBIDDEN:
        return 403;
      case ERROR_CODES.API_NOT_FOUND:
        return 404;
      case ERROR_CODES.API_RATE_LIMIT:
        return 429;
      case ERROR_CODES.FILE_TOO_LARGE:
      case ERROR_CODES.INVALID_FILE_TYPE:
        return 400;
      default:
        return 500;
    }
  }
  
  if (error instanceof FileUploadError) {
    switch (error.code) {
      case ERROR_CODES.FILE_TOO_LARGE:
      case ERROR_CODES.INVALID_FILE_TYPE:
        return 400;
      default:
        return 500;
    }
  }
  
  if (error instanceof FeishuApiError) {
    switch (error.code) {
      case ERROR_CODES.FEISHU_CONFIG_MISSING:
        return 400;
      case ERROR_CODES.FEISHU_TOKEN_INVALID:
        return 401;
      default:
        return 500;
    }
  }
  
  return 500;
}

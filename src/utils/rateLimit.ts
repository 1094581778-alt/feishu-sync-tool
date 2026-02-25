/**
 * API 限流中间件
 * 实现基于IP和用户的请求频率限制
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1分钟
  maxRequests: 100, // 每分钟最多100次请求
  message: '请求过于频繁，请稍后再试',
};

const stores: Record<string, RateLimitStore> = {
  default: {},
  upload: {},
  feishu: {},
};

/**
 * 清理过期的限流记录
 */
function cleanupExpiredRecords(store: RateLimitStore): void {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}

/**
 * 获取客户端标识符
 */
function getClientIdentifier(request: Request): string {
  // 优先使用X-Forwarded-For头
  const forwardedFor = request.headers?.get?.('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  // 其次使用X-Real-IP头
  const realIp = request.headers?.get?.('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // 默认使用unknown
  return 'unknown';
}

/**
 * 检查是否超过限流
 */
export function checkRateLimit(
  request: Request,
  storeKey: string = 'default',
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number; message?: string } {
  const finalConfig = { ...defaultConfig, ...config };
  const store = stores[storeKey] || stores.default;
  
  // 定期清理过期记录
  cleanupExpiredRecords(store);
  
  const clientId = getClientIdentifier(request);
  const now = Date.now();
  const key = `${storeKey}:${clientId}`;
  
  // 获取或创建记录
  let record = store[key];
  
  if (!record || record.resetTime < now) {
    // 创建新记录
    record = {
      count: 1,
      resetTime: now + finalConfig.windowMs,
    };
    store[key] = record;
    
    return {
      allowed: true,
      remaining: finalConfig.maxRequests - 1,
      resetTime: record.resetTime,
    };
  }
  
  // 检查是否超过限制
  if (record.count >= finalConfig.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      message: finalConfig.message,
    };
  }
  
  // 增加计数
  record.count++;
  
  return {
    allowed: true,
    remaining: finalConfig.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

/**
 * 创建限流响应头
 */
export function createRateLimitHeaders(
  remaining: number,
  resetTime: number,
  limit: number = defaultConfig.maxRequests
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.floor(resetTime / 1000)),
  };
}

/**
 * 预定义的限流配置
 */
export const rateLimitConfigs = {
  // 上传API - 更严格的限制
  upload: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 20, // 每分钟最多20次上传
    message: '上传请求过于频繁，请稍后再试',
  },
  
  // 飞书API - 中等限制
  feishu: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 60, // 每分钟最多60次请求
    message: '飞书API请求过于频繁，请稍后再试',
  },
  
  // 默认限制
  default: defaultConfig,
};

/**
 * 限流中间件
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>,
  storeKey: string = 'default',
  config?: Partial<RateLimitConfig>
) {
  return async (request: Request): Promise<Response> => {
    const finalConfig = config || rateLimitConfigs[storeKey as keyof typeof rateLimitConfigs] || defaultConfig;
    const result = checkRateLimit(request, storeKey, finalConfig);
    
    if (!result.allowed) {
      return new Response(
        JSON.stringify({
          error: result.message || '请求过于频繁',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((result.resetTime - Date.now()) / 1000)),
            ...createRateLimitHeaders(result.remaining, result.resetTime, finalConfig.maxRequests),
          },
        }
      );
    }
    
    const response = await handler(request);
    
    // 添加限流头到响应
    const rateLimitHeaders = createRateLimitHeaders(result.remaining, result.resetTime, finalConfig.maxRequests);
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  };
}

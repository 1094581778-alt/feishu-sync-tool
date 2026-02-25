/**
 * API 缓存工具
 * 实现内存缓存和响应缓存
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, size: 0 };
  
  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // 检查是否过期
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.data as T;
  }
  
  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
    this.stats.size = this.cache.size;
  }
  
  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.stats.size = this.cache.size;
    return result;
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }
  
  /**
   * 清理过期缓存
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    this.stats.size = this.cache.size;
    return cleaned;
  }
  
  /**
   * 获取缓存统计
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }
}

// 全局缓存实例
export const apiCache = new MemoryCache();

// 预定义的缓存TTL
export const CACHE_TTL = {
  SHORT: 30 * 1000, // 30秒
  MEDIUM: 5 * 60 * 1000, // 5分钟
  LONG: 30 * 60 * 1000, // 30分钟
  HOUR: 60 * 60 * 1000, // 1小时
};

/**
 * 生成缓存键
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * 缓存装饰器
 */
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    // 尝试从缓存获取
    const cached = apiCache.get<T>(key);
    if (cached !== null) {
      resolve(cached);
      return;
    }
    
    try {
      // 获取新数据
      const data = await fetcher();
      
      // 存入缓存
      apiCache.set(key, data, ttl);
      
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 创建缓存响应头
 */
export function createCacheHeaders(
  maxAge: number = 300,
  isPublic: boolean = false
): Record<string, string> {
  return {
    'Cache-Control': `${isPublic ? 'public' : 'private'}, max-age=${maxAge}`,
    'X-Cache-Status': 'HIT',
  };
}

/**
 * 飞书访问令牌缓存
 */
export class FeishuTokenCache {
  private static PREFIX = 'feishu:token';
  
  static getKey(appId: string): string {
    return `${this.PREFIX}:${appId}`;
  }
  
  static get(appId: string): string | null {
    return apiCache.get<string>(this.getKey(appId));
  }
  
  static set(appId: string, token: string, expiresIn: number): void {
    // 提前5分钟过期，避免边界情况
    const ttl = (expiresIn - 300) * 1000;
    apiCache.set(this.getKey(appId), token, ttl);
  }
  
  static delete(appId: string): void {
    apiCache.delete(this.getKey(appId));
  }
}

/**
 * 飞书表格数据缓存
 */
export class FeishuTableCache {
  private static PREFIX = 'feishu:tables';
  
  static getKey(spreadsheetToken: string): string {
    return `${this.PREFIX}:${spreadsheetToken}`;
  }
  
  static get<T>(spreadsheetToken: string): T | null {
    return apiCache.get<T>(this.getKey(spreadsheetToken));
  }
  
  static set<T>(spreadsheetToken: string, data: T, ttl: number = CACHE_TTL.MEDIUM): void {
    apiCache.set(this.getKey(spreadsheetToken), data, ttl);
  }
  
  static delete(spreadsheetToken: string): void {
    apiCache.delete(this.getKey(spreadsheetToken));
  }
}

// 定期清理过期缓存
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = apiCache.cleanup();
    if (cleaned > 0) {
      console.log(`[Cache] 清理了 ${cleaned} 个过期缓存项`);
    }
  }, 60 * 1000); // 每分钟清理一次
}

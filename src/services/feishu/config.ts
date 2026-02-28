/**
 * 飞书API配置管理
 * 提供统一的配置管理接口，支持环境变量、本地存储和多环境配置
 */

import { AppConfig } from './types';

/**
 * 飞书配置键名
 */
export const FeishuConfigKeys = {
  APP_ID: 'FEISHU_APP_ID',
  APP_SECRET: 'FEISHU_APP_SECRET',
  API_BASE_URL: 'FEISHU_API_BASE_URL',
  TIMEOUT: 'FEISHU_TIMEOUT',
  MAX_RETRIES: 'FEISHU_MAX_RETRIES',
  ENABLE_CACHE: 'FEISHU_ENABLE_CACHE',
  CACHE_TTL: 'FEISHU_CACHE_TTL',
} as const;

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: Omit<AppConfig, 'appId' | 'appSecret'> & {
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  enableCache: boolean;
  cacheTTL: number;
} = {
  baseUrl: 'https://open.feishu.cn/open-apis',
  timeout: 30000, // 30秒
  maxRetries: 3,
  enableCache: true,
  cacheTTL: 5 * 60 * 1000, // 5分钟
};

/**
 * 配置验证错误
 */
export class ConfigValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ConfigValidationError';
  }
}

/**
 * 验证飞书应用配置
 */
export function validateAppConfig(config: Partial<AppConfig>): AppConfig {
  const { appId, appSecret } = config;
  
  // 检查必需字段
  if (!appId) {
    throw new ConfigValidationError('飞书应用ID不能为空', 'appId');
  }
  
  if (!appSecret) {
    throw new ConfigValidationError('飞书应用密钥不能为空', 'appSecret');
  }
  
  // 验证格式
  if (typeof appId !== 'string') {
    throw new ConfigValidationError('飞书应用ID必须是字符串', 'appId');
  }
  
  if (typeof appSecret !== 'string') {
    throw new ConfigValidationError('飞书应用密钥必须是字符串', 'appSecret');
  }
  
  // 验证长度
  if (appId.length < 10) {
    throw new ConfigValidationError('飞书应用ID格式无效', 'appId');
  }
  
  if (appSecret.length < 10) {
    throw new ConfigValidationError('飞书应用密钥格式无效', 'appSecret');
  }
  
  return { appId, appSecret };
}

/**
 * 从环境变量获取配置
 * 注意：已禁用环境变量配置，用户必须在界面中配置飞书凭证
 * @deprecated 不再支持环境变量配置，保留函数仅为兼容性
 */
export function getConfigFromEnv(): Partial<AppConfig> {
  return {};
}

/**
 * 从本地存储获取配置
 */
export function getConfigFromStorage(): Partial<AppConfig> {
  if (typeof window === 'undefined') {
    return {};
  }
  
  const config: Partial<AppConfig> = {};
  
  try {
    const appId = localStorage.getItem(FeishuConfigKeys.APP_ID);
    const appSecret = localStorage.getItem(FeishuConfigKeys.APP_SECRET);
    
    if (appId) config.appId = appId;
    if (appSecret) config.appSecret = appSecret;
  } catch (error) {
    // 忽略本地存储访问错误
    console.warn('无法访问本地存储:', error);
  }
  
  return config;
}

/**
 * 保存配置到本地存储
 */
export function saveConfigToStorage(config: AppConfig): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem(FeishuConfigKeys.APP_ID, config.appId);
    localStorage.setItem(FeishuConfigKeys.APP_SECRET, config.appSecret);
  } catch (error) {
    console.error('保存配置到本地存储失败:', error);
    throw new Error('配置保存失败，请检查浏览器本地存储权限');
  }
}

/**
 * 清除本地存储中的配置
 */
export function clearConfigFromStorage(): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.removeItem(FeishuConfigKeys.APP_ID);
    localStorage.removeItem(FeishuConfigKeys.APP_SECRET);
  } catch (error) {
    console.warn('清除本地存储配置失败:', error);
  }
}

/**
 * 合并配置源
 * 优先级: 传入参数 > 环境变量 > 本地存储 > 默认配置
 */
export function mergeConfig(
  override?: Partial<AppConfig>,
  envConfig?: Partial<AppConfig>,
  storageConfig?: Partial<AppConfig>
): AppConfig {
  // 按优先级合并
  const merged = {
    ...DEFAULT_CONFIG,
    ...storageConfig,
    ...envConfig,
    ...override,
  };
  
  return validateAppConfig(merged);
}

/**
 * 飞书配置管理器
 */
export class FeishuConfigManager {
  private config: AppConfig | null = null;
  private listeners: Array<(config: AppConfig | null) => void> = [];
  
  /**
   * 获取当前配置
   */
  getConfig(): AppConfig | null {
    return this.config;
  }
  
  /**
   * 初始化配置
   */
  initialize(override?: Partial<AppConfig>): AppConfig {
    const envConfig = getConfigFromEnv();
    const storageConfig = getConfigFromStorage();
    
    this.config = mergeConfig(override, envConfig, storageConfig);
    this.notifyListeners();
    
    return this.config;
  }
  
  /**
   * 更新配置
   */
  updateConfig(config: AppConfig): AppConfig {
    const validatedConfig = validateAppConfig(config);
    this.config = validatedConfig;
    
    // 保存到本地存储
    saveConfigToStorage(validatedConfig);
    
    this.notifyListeners();
    return this.config;
  }
  
  /**
   * 清除配置
   */
  clearConfig(): void {
    this.config = null;
    clearConfigFromStorage();
    this.notifyListeners();
  }
  
  /**
   * 检查配置是否有效
   */
  isValid(): boolean {
    if (!this.config) {
      return false;
    }
    
    try {
      validateAppConfig(this.config);
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 添加配置变更监听器
   */
  addListener(listener: (config: AppConfig | null) => void): () => void {
    this.listeners.push(listener);
    
    // 立即通知当前配置
    if (this.config !== null) {
      listener(this.config);
    }
    
    // 返回移除监听器的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.config);
    }
  }
}

/**
 * 全局配置管理器实例
 */
export const feishuConfigManager = new FeishuConfigManager();
/**
 * 飞书配置管理器 Hook
 * 提供统一的飞书配置管理，支持自动初始化、配置验证和变更监听
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  feishuConfigManager, 
  validateAppConfig,
  ConfigValidationError,
  getConfigFromStorage,
  saveConfigToStorage,
  clearConfigFromStorage
} from '@/services/feishu/config';
import type { AppConfig } from '@/services/feishu/types';

/**
 * 飞书配置管理器 Hook 返回值
 */
interface UseFeishuConfigManagerResult {
  // 配置状态
  config: AppConfig | null;
  isLoading: boolean;
  isValid: boolean;
  error: ConfigValidationError | null;
  
  // 配置操作方法
  initialize: (override?: Partial<AppConfig>) => AppConfig;
  updateConfig: (config: AppConfig) => AppConfig;
  clearConfig: () => void;
  validateConfig: (config: Partial<AppConfig>) => AppConfig;
  
  // 本地存储操作
  loadFromStorage: () => Partial<AppConfig>;
  saveToStorage: (config: AppConfig) => void;
  clearStorage: () => void;
  
  // 配置信息
  hasConfig: boolean;
  isConfigured: boolean;
}

/**
 * 飞书配置管理器 Hook
 * 
 * 提供统一的飞书配置管理功能，包括:
 * 1. 配置的自动初始化和验证
 * 2. 本地存储的集成
 * 3. 配置变更的监听和通知
 * 4. 错误处理和恢复机制
 */
export function useFeishuConfigManager(): UseFeishuConfigManagerResult {
  // 状态管理
  const [config, setConfig] = useState<AppConfig | null>(() => feishuConfigManager.getConfig());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ConfigValidationError | null>(null);
  
  // 有效性检查
  const isValid = useMemo(() => feishuConfigManager.isValid(), [config]);
  const hasConfig = config !== null;
  const isConfigured = isValid && hasConfig;
  
  /**
   * 初始化配置
   */
  const initialize = useCallback((override?: Partial<AppConfig>): AppConfig => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = feishuConfigManager.initialize(override);
      setConfig(result);
      return result;
    } catch (err) {
      const validationError = err instanceof ConfigValidationError 
        ? err 
        : new ConfigValidationError('配置初始化失败', 'unknown');
      setError(validationError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 更新配置
   */
  const updateConfig = useCallback((newConfig: AppConfig): AppConfig => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = feishuConfigManager.updateConfig(newConfig);
      setConfig(result);
      return result;
    } catch (err) {
      const validationError = err instanceof ConfigValidationError 
        ? err 
        : new ConfigValidationError('配置更新失败', 'unknown');
      setError(validationError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 清除配置
   */
  const clearConfig = useCallback((): void => {
    setIsLoading(true);
    
    try {
      feishuConfigManager.clearConfig();
      setConfig(null);
      setError(null);
    } catch (err) {
      console.error('清除配置失败:', err);
      setError(new ConfigValidationError('清除配置失败', 'unknown'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * 验证配置
   */
  const validateConfig = useCallback((configToValidate: Partial<AppConfig>): AppConfig => {
    try {
      return validateAppConfig(configToValidate);
    } catch (err) {
      const validationError = err instanceof ConfigValidationError 
        ? err 
        : new ConfigValidationError('配置验证失败', 'unknown');
      setError(validationError);
      throw err;
    }
  }, []);
  
  /**
   * 从本地存储加载配置
   */
  const loadFromStorage = useCallback((): Partial<AppConfig> => {
    try {
      return getConfigFromStorage();
    } catch (err) {
      console.warn('从本地存储加载配置失败:', err);
      return {};
    }
  }, []);
  
  /**
   * 保存配置到本地存储
   */
  const saveToStorage = useCallback((configToSave: AppConfig): void => {
    try {
      saveConfigToStorage(configToSave);
    } catch (err) {
      console.error('保存配置到本地存储失败:', err);
      throw new Error('配置保存失败，请检查浏览器本地存储权限');
    }
  }, []);
  
  /**
   * 清除本地存储中的配置
   */
  const clearStorage = useCallback((): void => {
    try {
      clearConfigFromStorage();
    } catch (err) {
      console.warn('清除本地存储配置失败:', err);
    }
  }, []);
  
  /**
   * 自动初始化配置
   */
  useEffect(() => {
    // 如果配置尚未初始化，尝试自动初始化
    if (!config && !isLoading) {
      const timer = setTimeout(() => {
        try {
          const storageConfig = loadFromStorage();
          if (storageConfig.appId && storageConfig.appSecret) {
            initialize(storageConfig);
          }
        } catch (err) {
          // 静默失败，等待用户手动配置
          console.debug('自动初始化配置失败:', err);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [config, isLoading, initialize, loadFromStorage]);
  
  /**
   * 监听配置变更
   */
  useEffect(() => {
    const removeListener = feishuConfigManager.addListener((newConfig) => {
      setConfig(newConfig);
      setError(null);
    });
    
    return removeListener;
  }, []);
  
  return {
    // 配置状态
    config,
    isLoading,
    isValid,
    error,
    
    // 配置操作方法
    initialize,
    updateConfig,
    clearConfig,
    validateConfig,
    
    // 本地存储操作
    loadFromStorage,
    saveToStorage,
    clearStorage,
    
    // 配置信息
    hasConfig,
    isConfigured,
  };
}
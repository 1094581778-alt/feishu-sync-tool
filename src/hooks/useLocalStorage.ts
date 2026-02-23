/**
 * localStorage 管理 Hook
 */
import { useState, useEffect } from 'react';
import type { StorageKey } from '@/constants';

export function useLocalStorage<T>(key: StorageKey, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  // 初始化时从 localStorage 读取
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const item = localStorage.getItem(key);
      if (item) {
        setValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(`[useLocalStorage] 读取 ${key} 失败:`, error);
    }
  }, [key]);

  // 保存到 localStorage
  const setStoredValue = (newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`[useLocalStorage] 保存 ${key} 失败:`, error);
    }
  };

  return [value, setStoredValue] as const;
}

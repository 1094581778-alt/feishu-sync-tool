/**
 * 飞书配置管理 Hook
 */
import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/constants';

export function useFeishuConfig() {
  const [appId, setAppId] = useState('');
  const [appSecret, setAppSecret] = useState('');

  // 从 localStorage 加载配置
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const savedAppId = localStorage.getItem(STORAGE_KEYS.FEISHU_APP_ID) || '';
    const savedAppSecret = localStorage.getItem(STORAGE_KEYS.FEISHU_APP_SECRET) || '';
    
    setAppId(savedAppId);
    setAppSecret(savedAppSecret);
  }, []);

  // 保存配置
  const saveConfig = (newAppId: string, newAppSecret: string) => {
    setAppId(newAppId);
    setAppSecret(newAppSecret);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.FEISHU_APP_ID, newAppId);
      localStorage.setItem(STORAGE_KEYS.FEISHU_APP_SECRET, newAppSecret);
    }
  };

  return {
    appId,
    appSecret,
    setAppId,
    setAppSecret,
    saveConfig,
  };
}

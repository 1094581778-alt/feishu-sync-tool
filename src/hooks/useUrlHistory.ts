/**
 * 链接历史记录管理 Hook
 */
import { useState, useEffect } from 'react';
import { STORAGE_KEYS } from '@/constants';

export function useUrlHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // 加载历史记录
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEYS.FEISHU_URL_HISTORY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.error('[useUrlHistory] 加载历史记录失败:', err);
    }
  }, []);

  // 添加到历史记录
  const addToHistory = (url: string, currentHistory: string[]) => {
    const newHistory = [url, ...currentHistory.filter(u => u !== url)].slice(0, 10);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.FEISHU_URL_HISTORY, JSON.stringify(newHistory));
    }
    return newHistory;
  };

  // 从历史记录移除
  const removeFromHistory = (url: string, currentHistory: string[]) => {
    const newHistory = currentHistory.filter(u => u !== url);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.FEISHU_URL_HISTORY, JSON.stringify(newHistory));
    }
    return newHistory;
  };

  return {
    history,
    setHistory,
    addToHistory,
    removeFromHistory,
  };
}

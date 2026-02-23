/**
 * 历史模版管理 Hook
 */
import { useState, useEffect } from 'react';
import type { HistoryTemplate } from '@/types';
import { STORAGE_KEYS } from '@/constants';

export function useHistoryTemplates() {
  const [templates, setTemplates] = useState<HistoryTemplate[]>([]);

  // 加载历史模版
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const savedTemplates = localStorage.getItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES);
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
    } catch (err) {
      console.error('[useHistoryTemplates] 加载失败:', err);
    }
  }, []);

  // 保存模版
  const saveTemplate = (template: HistoryTemplate) => {
    const newTemplates = [template, ...templates];
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES, JSON.stringify(newTemplates));
  };

  // 更新模版
  const updateTemplate = (templateId: string, updatedTemplate: Partial<HistoryTemplate>) => {
    const newTemplates = templates.map(t =>
      t.id === templateId ? { ...t, ...updatedTemplate, updatedAt: new Date().toISOString() } : t
    );
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES, JSON.stringify(newTemplates));
  };

  // 删除模版
  const deleteTemplate = (templateId: string) => {
    const newTemplates = templates.filter(t => t.id !== templateId);
    setTemplates(newTemplates);
    localStorage.setItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES, JSON.stringify(newTemplates));
  };

  // 导出模版
  const exportTemplates = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      templates,
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `飞书历史模版导出_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 导入模版
  const importTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    return new Promise<{ success: boolean; message?: string; count?: number }>((resolve, reject) => {
      const file = event.target.files?.[0];
      if (!file) {
        reject({ success: false, message: '请选择文件' });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dataStr = e.target?.result as string;
          const importData = JSON.parse(dataStr);
          
          // 验证数据格式
          if (!importData.templates || !Array.isArray(importData.templates)) {
            throw new Error('无效的导入文件格式');
          }
          
          // 验证每个模版的必要字段
          importData.templates.forEach((template: any) => {
            if (!template.id || !template.name || !template.feishuUrl) {
              throw new Error(`模版 "${template.name || '未知'}" 缺少必要字段`);
            }
          });
          
          // 合并导入的模版（避免重复ID）
          const existingIds = new Set(templates.map(t => t.id));
          const newTemplates = importData.templates.filter((t: any) => !existingIds.has(t.id));
          const mergedTemplates = [...templates, ...newTemplates];
          
          setTemplates(mergedTemplates);
          localStorage.setItem(STORAGE_KEYS.FEISHU_HISTORY_TEMPLATES, JSON.stringify(mergedTemplates));
          
          resolve({ success: true, count: newTemplates.length });
        } catch (err) {
          reject({ success: false, message: err instanceof Error ? err.message : '导入失败' });
        }
      };
      
      reader.onerror = () => {
        reject({ success: false, message: '文件读取失败' });
      };
      
      reader.readAsText(file);
    });
  };

  return {
    templates,
    setTemplates,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    exportTemplates,
    importTemplates,
  };
}

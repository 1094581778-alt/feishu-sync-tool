/**
 * localStorage 存储键名常量
 */

export const STORAGE_KEYS = {
  // 飞书配置
  FEISHU_URL: 'feishuUrl',
  FEISHU_TABLE_ID: 'feishuTableId',
  FEISHU_APP_ID: 'feishuAppId',
  FEISHU_APP_SECRET: 'feishuAppSecret',
  
  // 历史记录
  FEISHU_URL_HISTORY: 'feishuUrlHistory',
  
  // 历史模版
  FEISHU_HISTORY_TEMPLATES: 'feishuHistoryTemplates',
  
  // 应用访问密码
  APP_ACCESS_PASSWORD: 'appAccessPassword',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

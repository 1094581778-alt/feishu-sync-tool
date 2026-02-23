/**
 * 应用状态类型定义
 */

export type Step = 1 | 2 | 3 | 4;

export interface FeishuConfig {
  appId: string;
  appSecret: string;
}

export interface UrlHistory {
  urls: string[];
  maxCount: number;
}

export interface AppState {
  // 当前步骤
  currentStep: Step;
  
  // 飞书配置
  feishuAppId: string;
  feishuAppSecret: string;
  
  // UI 状态
  showFeishuConfig: boolean;
  showHistory: boolean;
}

export interface AppAction {
  setCurrentStep: (step: Step) => void;
  setFeishuAppId: (appId: string) => void;
  setFeishuAppSecret: (appSecret: string) => void;
  setShowFeishuConfig: (show: boolean) => void;
  setShowHistory: (show: boolean) => void;
}

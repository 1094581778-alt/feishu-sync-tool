'use client';

import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { parseFeishuUrl } from '@/utils';
import { logger, LOG_CATEGORIES } from '@/utils/logger';

/**
 * 工作流管理器 - 处理主要的业务逻辑
 */
export function WorkflowManager() {
  const {
    feishuUrl,
    parsedConfig,
    setParsedConfig,
    incrementTableChangeCount,
  } = useAppStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * 解析飞书 URL
   */
  useEffect(() => {
    if (!feishuUrl) {
      setParsedConfig(null);
      return;
    }

    try {
      logger.debug(LOG_CATEGORIES.FEISHU, '开始解析飞书 URL', { url: feishuUrl });

      const config = parseFeishuUrl(feishuUrl);
      if (!config) {
        setParsedConfig(null);
        return;
      }
      setParsedConfig(config);

      logger.info(LOG_CATEGORIES.FEISHU, '飞书 URL 解析成功', {
        spreadsheetToken: config.spreadsheetToken,
        hasSheetId: !!config.sheetId,
      });
    } catch (error) {
      logger.error(LOG_CATEGORIES.FEISHU, '飞书 URL 解析失败', error);
      setParsedConfig(null);
    }
  }, [feishuUrl, setParsedConfig]);

  /**
   * 包装 setTables 以记录所有调用（调试用）
   */
  const setTablesWithLog = (tables: any[], previousLength: number) => {
    logger.debug(LOG_CATEGORIES.COMPONENT, 'setTables 被调用', {
      previousLength,
      newLength: tables.length,
      newTables: tables.slice(0, 3),
    });
    incrementTableChangeCount();
  };

  return null;
}

/**
 * 工作表管理 Hook
 */

import { useState, useCallback, useEffect } from 'react';
import { logger, LOG_CATEGORIES } from '../utils/logger';
import { handleApiError } from '../utils/errorHandler';
import { fetchTables as fetchTablesApi, fetchFields as fetchFieldsApi } from '../services/feishu';
import type {
  FeishuTable,
  FeishuField,
  TableConfig,
  FieldMatchResult,
} from '../types/feishu';

interface UseTablesResult {
  tables: FeishuTable[];
  tableFields: Record<string, FeishuField[]>;
  loading: boolean;
  error: Error | null;
  fetchTables: (token: string) => Promise<void>;
  fetchFields: (tableId: string) => Promise<FeishuField[]>;
  selectTable: (tableId: string) => void;
  deselectTable: (tableId: string) => void;
  selectAllTables: () => void;
  deselectAllTables: () => void;
  getSelectedTables: () => FeishuTable[];
  clear: () => void;
}

export function useTables(): UseTablesResult {
  const [tables, setTables] = useState<FeishuTable[]>([]);
  const [tableFields, setTableFields] = useState<Record<string, FeishuField[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedTableIds, setSelectedTableIds] = useState<string[]>([]);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  /**
   * 获取工作表列表
   */
  const fetchTables = useCallback(async (token: string) => {
    if (!token) {
      const error = new Error('缺少 spreadsheet token');
      setError(error);
      logger.error(LOG_CATEGORIES.FEISHU, '获取工作表列表失败', error);
      throw error;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug(LOG_CATEGORIES.FEISHU, '开始获取工作表列表', { token });

      const result = await fetchTablesApi({ token });
      
      if (!result.success) {
        throw new Error(result.error || '获取工作表列表失败');
      }

      setTables(result.tables || []);
      setCurrentToken(token);

      logger.info(LOG_CATEGORIES.FEISHU, '成功获取工作表列表', {
        count: result.tables?.length || 0,
      });
    } catch (err) {
      const handledError = handleApiError(err, '获取工作表列表');
      setError(handledError);
      logger.error(LOG_CATEGORIES.FEISHU, '获取工作表列表失败', handledError);
      throw handledError;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 获取字段信息
   */
  const fetchFields = useCallback(async (tableId: string): Promise<FeishuField[]> => {
    if (!currentToken) {
      const error = new Error('未设置 spreadsheet token');
      setError(error);
      logger.error(LOG_CATEGORIES.FEISHU, '获取字段信息失败', error);
      throw error;
    }

    try {
      logger.debug(LOG_CATEGORIES.FEISHU, '开始获取字段信息', { tableId });

      const fieldsResult = await fetchFieldsApi({ token: currentToken, tableId });
      
      if (!fieldsResult.success) {
        throw new Error(fieldsResult.error || '获取字段信息失败');
      }

      const fields = fieldsResult.fields || [];

      setTableFields(prev => ({
        ...prev,
        [tableId]: fields,
      }));

      logger.info(LOG_CATEGORIES.FEISHU, '成功获取字段信息', {
        tableId,
        fieldCount: fields.length,
      });

      return fields;
    } catch (err) {
      const handledError = handleApiError(err, '获取字段信息');
      setError(handledError);
      logger.error(LOG_CATEGORIES.FEISHU, '获取字段信息失败', {
        tableId,
        error: handledError,
      });
      throw handledError;
    }
  }, [currentToken]);

  /**
   * 选择工作表
   */
  const selectTable = useCallback((tableId: string) => {
    if (!selectedTableIds.includes(tableId)) {
      setSelectedTableIds(prev => [...prev, tableId]);
      logger.debug(LOG_CATEGORIES.COMPONENT, '选择工作表', { tableId });
    }
  }, [selectedTableIds]);

  /**
   * 取消选择工作表
   */
  const deselectTable = useCallback((tableId: string) => {
    setSelectedTableIds(prev => prev.filter(id => id !== tableId));
    logger.debug(LOG_CATEGORIES.COMPONENT, '取消选择工作表', { tableId });
  }, []);

  /**
   * 全选工作表
   */
  const selectAllTables = useCallback(() => {
    const allIds = tables.map(t => t.id);
    setSelectedTableIds(allIds);
    logger.info(LOG_CATEGORIES.COMPONENT, '全选工作表', { count: allIds.length });
  }, [tables]);

  /**
   * 取消全选
   */
  const deselectAllTables = useCallback(() => {
    setSelectedTableIds([]);
    logger.info(LOG_CATEGORIES.COMPONENT, '取消全选工作表');
  }, []);

  /**
   * 获取已选择的工作表
   */
  const getSelectedTables = useCallback((): FeishuTable[] => {
    return tables.filter(t => selectedTableIds.includes(t.id));
  }, [tables, selectedTableIds]);

  /**
   * 清空状态
   */
  const clear = useCallback(() => {
    setTables([]);
    setTableFields({});
    setSelectedTableIds([]);
    setError(null);
    setCurrentToken(null);
    logger.info(LOG_CATEGORIES.COMPONENT, '清空工作表状态');
  }, []);

  return {
    tables,
    tableFields,
    loading,
    error,
    fetchTables,
    fetchFields,
    selectTable,
    deselectTable,
    selectAllTables,
    deselectAllTables,
    getSelectedTables,
    clear,
  };
}

/**
 * 工作表配置管理 Hook
 */
interface UseTableConfigResult {
  tableConfigs: Record<string, TableConfig>;
  updateTableConfig: (tableId: string, config: Partial<TableConfig>) => void;
  getTableConfig: (tableId: string) => TableConfig | undefined;
  removeTableConfig: (tableId: string) => void;
  clearConfigs: () => void;
  setFieldMatchResults: (tableId: string, results: FieldMatchResult[]) => void;
  getFieldMatchResults: (tableId: string) => FieldMatchResult[] | undefined;
}

export function useTableConfig(): UseTableConfigResult {
  const [tableConfigs, setTableConfigs] = useState<Record<string, TableConfig>>({});

  const updateTableConfig = useCallback((tableId: string, config: Partial<TableConfig>) => {
    setTableConfigs(prev => ({
      ...prev,
      [tableId]: {
        ...prev[tableId],
        ...config,
      },
    }));
    logger.debug(LOG_CATEGORIES.COMPONENT, '更新工作表配置', { tableId, config });
  }, []);

  const getTableConfig = useCallback((tableId: string): TableConfig | undefined => {
    return tableConfigs[tableId];
  }, [tableConfigs]);

  const removeTableConfig = useCallback((tableId: string) => {
    setTableConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[tableId];
      return newConfigs;
    });
    logger.debug(LOG_CATEGORIES.COMPONENT, '移除工作表配置', { tableId });
  }, []);

  const clearConfigs = useCallback(() => {
    setTableConfigs({});
    logger.info(LOG_CATEGORIES.COMPONENT, '清空所有工作表配置');
  }, []);

  const setFieldMatchResults = useCallback((tableId: string, results: FieldMatchResult[]) => {
    updateTableConfig(tableId, { fieldMatches: results });
    logger.debug(LOG_CATEGORIES.COMPONENT, '设置字段匹配结果', { tableId, count: results.length });
  }, [updateTableConfig]);

  const getFieldMatchResults = useCallback((tableId: string): FieldMatchResult[] | undefined => {
    return tableConfigs[tableId]?.fieldMatches;
  }, [tableConfigs]);

  return {
    tableConfigs,
    updateTableConfig,
    getTableConfig,
    removeTableConfig,
    clearConfigs,
    setFieldMatchResults,
    getFieldMatchResults,
  };
}

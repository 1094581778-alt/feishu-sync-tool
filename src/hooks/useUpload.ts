/**
 * 文件上传和同步 Hook
 */

import { useState, useCallback } from 'react';
import { logger, LOG_CATEGORIES } from '../utils/logger';
import { handleApiError } from '../utils/errorHandler';
import { performanceMonitor } from '../utils/performance';
import { validateFileSize, validateFileType } from '../config/app';
import type {
  UploadResult,
  UploadStatus,
  UploadProgress,
  SyncResult,
  BatchSyncResult,
  TableConfig,
} from '../types';

interface UseUploadResult {
  uploadProgress: UploadProgress | null;
  uploadResult: UploadResult | null;
  uploadStatus: UploadStatus;
  uploading: boolean;
  error: Error | null;
  
  // 文件操作
  validateFile: (file: File) => { valid: boolean; error?: string };
  uploadFile: (file: File) => Promise<UploadResult>;
  syncToFeishu: (
    tableConfigs: Record<string, TableConfig>,
    spreadsheetToken: string
  ) => Promise<BatchSyncResult>;
  cancelUpload: () => void;
  reset: () => void;
}

export function useUpload(): UseUploadResult {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 验证文件
   */
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // 验证文件大小
    if (!validateFileSize(file.size)) {
      const maxSizeMB = (100 * 1024 * 1024) / (1024 * 1024);
      return {
        valid: false,
        error: `文件大小超过限制，最大允许 ${maxSizeMB}MB`,
      };
    }

    // 验证文件类型
    if (!validateFileType(file.name)) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.name}`,
      };
    }

    return { valid: true };
  }, []);

  /**
   * 上传文件到对象存储
   */
  const uploadFile = useCallback(async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setUploadStatus('uploading');
    setError(null);
    setUploadProgress({
      loaded: 0,
      total: file.size,
      percentage: 0,
      progress: 0,
      status: 'uploading',
      currentStep: '准备上传',
    });

    try {
      logger.info(LOG_CATEGORIES.FILE_UPLOAD, '开始上传文件', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      return await performanceMonitor.measure(
        'uploadFile',
        async () => {
          // 调用上传 API
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`上传失败: ${response.statusText}`);
          }

          const result: UploadResult = await response.json();

          logger.info(LOG_CATEGORIES.FILE_UPLOAD, '文件上传成功', {
            fileKey: result.fileKey,
            fileUrl: result.fileUrl,
          });

          setUploadResult(result);
          setUploadStatus('success');
          setUploadProgress({
            loaded: file.size,
            total: file.size,
            percentage: 100,
            progress: 100,
            status: 'success',
            currentStep: '上传完成',
          });

          return result;
        },
        { fileName: file.name }
      );
    } catch (err) {
      const handledError = handleApiError(err, '文件上传');
      setError(handledError);
      setUploadStatus('error');
      logger.error(LOG_CATEGORIES.FILE_UPLOAD, '文件上传失败', handledError);
      throw handledError;
    } finally {
      setUploading(false);
    }
  }, []);

  /**
   * 同步数据到飞书
   */
  const syncToFeishu = useCallback(async (
    tableConfigs: Record<string, TableConfig>,
    spreadsheetToken: string
  ): Promise<BatchSyncResult> => {
    setUploadStatus('syncing');
    setError(null);

    try {
      logger.info(LOG_CATEGORIES.FEISHU, '开始同步数据到飞书', {
        tableCount: Object.keys(tableConfigs).length,
      });

      return await performanceMonitor.measure(
        'syncToFeishu',
        async () => {
          const results: Array<{
            tableId: string;
            tableName: string;
            syncResult: SyncResult;
          }> = [];

          let totalSyncCount = 0;
          let totalApiCallCount = 0;

          // 逐个表格同步
          for (const [tableId, config] of Object.entries(tableConfigs)) {
            if (!config.sheetName) {
              logger.warn(LOG_CATEGORIES.FEISHU, '跳过未配置 sheet 的工作表', { tableId });
              continue;
            }

            setUploadProgress((prev: any) => prev ? {
              ...prev,
              status: 'syncing',
              currentStep: `正在同步: ${config.tableName}`,
            } : null);

            try {
              // 调用上传 API 进行同步
              const syncFormData = new FormData();

              // 添加必要的参数
              syncFormData.append('token', spreadsheetToken);
              syncFormData.append('tableId', tableId);
              syncFormData.append('sheetName', config.sheetName || '');
              syncFormData.append('fieldMatch', JSON.stringify(config.fieldMatches));

              if (config.subTableConfigs && config.subTableConfigs.length > 0) {
                syncFormData.append('subTableConfigs', JSON.stringify(config.subTableConfigs));
              }

              const syncResponse = await fetch('/api/upload', {
                method: 'POST',
                body: syncFormData,
              });

              if (!syncResponse.ok) {
                throw new Error(`同步失败: ${syncResponse.statusText}`);
              }

              const syncResultData: SyncResult = await syncResponse.json();

              results.push({
                tableId,
                tableName: config.tableName,
                syncResult: syncResultData,
              });

              totalSyncCount += syncResultData.syncCount || 0;
              totalApiCallCount += syncResultData.apiCallCount || 0;

              logger.info(LOG_CATEGORIES.FEISHU, '工作表同步成功', {
                tableId,
                tableName: config.tableName,
                syncCount: syncResultData.syncCount,
              });
            } catch (err) {
              const syncError = handleApiError(err, `同步工作表: ${config.tableName}`);
              
              results.push({
                tableId,
                tableName: config.tableName,
                syncResult: {
                  msg: syncError.message,
                  success: false,
                  apiCallCount: 0,
                  syncCount: 0,
                },
              });

              logger.error(LOG_CATEGORIES.FEISHU, '工作表同步失败', {
                tableId,
                tableName: config.tableName,
                error: syncError,
              });
            }
          }

          const batchResult: BatchSyncResult = {
            success: results.length > 0,
            results,
            totalSyncCount,
            totalApiCallCount,
          };

          if (uploadResult) {
            setUploadResult({
              ...uploadResult,
              syncResult: {
                msg: batchResult.results.map((r: any) => `${r.tableName}: ${r.syncResult.msg}`).join('\n'),
                apiCallCount: totalApiCallCount,
                syncCount: totalSyncCount,
              },
            });
          }

          setUploadStatus('success');

          logger.info(LOG_CATEGORIES.FEISHU, '所有工作表同步完成', batchResult);

          return batchResult;
        },
        { tableCount: Object.keys(tableConfigs).length }
      );
    } catch (err) {
      const handledError = handleApiError(err, '同步数据');
      setError(handledError);
      setUploadStatus('error');
      logger.error(LOG_CATEGORIES.FEISHU, '同步数据失败', handledError);
      throw handledError;
    }
  }, [uploadResult]);

  /**
   * 取消上传
   */
  const cancelUpload = useCallback(() => {
    logger.info(LOG_CATEGORIES.FILE_UPLOAD, '用户取消上传');
    setUploading(false);
    setUploadStatus('idle');
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setUploadProgress(null);
    setUploadResult(null);
    setUploadStatus('idle');
    setUploading(false);
    setError(null);
    logger.info(LOG_CATEGORIES.FILE_UPLOAD, '重置上传状态');
  }, []);

  return {
    uploadProgress,
    uploadResult,
    uploadStatus,
    uploading,
    error,
    validateFile,
    uploadFile,
    syncToFeishu,
    cancelUpload,
    reset,
  };
}

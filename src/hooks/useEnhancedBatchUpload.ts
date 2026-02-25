/**
 * 增强版批量上传 Hook
 * 集成 BatchProgress 组件，提供更好的进度控制和反馈
 */

import { useState, useCallback, useRef } from 'react';
import type { BatchTask, BatchTaskResult } from '@/components/ui/batch-progress';
import type { UploadResult, HistoryTemplate } from '@/types';

/**
 * 增强版批量上传 Hook 返回值
 */
interface UseEnhancedBatchUploadResult {
  // 状态
  isUploading: boolean;
  progress: number;
  completed: number;
  total: number;
  error: string | null;
  results: Record<string, UploadResult>;
  
  // 批量任务配置（用于 BatchProgress 组件）
  tasks: BatchTask[];
  taskResults: BatchTaskResult[];
  
  // 操作方法
  startBatchUpload: (templates: HistoryTemplate[], options?: BatchUploadOptions) => Promise<void>;
  cancelBatchUpload: () => void;
  pauseBatchUpload: () => void;
  resumeBatchUpload: () => void;
  resetBatchUpload: () => void;
  
  // 批量上传统计
  stats: {
    successCount: number;
    failureCount: number;
    totalCount: number;
    averageDuration: number;
  };
}

/**
 * 批量上传选项
 */
interface BatchUploadOptions {
  concurrent?: boolean;
  maxConcurrent?: number;
  feishuAppId?: string;
  feishuAppSecret?: string;
  onProgress?: (progress: number, completed: number, total: number) => void;
  onComplete?: (results: Record<string, UploadResult>) => void;
  onError?: (error: string) => void;
}

/**
 * 增强版批量上传 Hook
 */
export function useEnhancedBatchUpload(): UseEnhancedBatchUploadResult {
  // 状态管理
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, UploadResult>>({});
  const [tasks, setTasks] = useState<BatchTask[]>([]);
  const [taskResults, setTaskResults] = useState<BatchTaskResult[]>([]);
  
  // 引用存储
  const abortControllerRef = useRef<AbortController | null>(null);
  const isPausedRef = useRef(false);
  const currentTemplatesRef = useRef<HistoryTemplate[]>([]);
  
  // 计算统计信息
  const successCount = Object.values(results).filter(r => r.success).length;
  const failureCount = Object.values(results).filter(r => !r.success).length;
  const totalCount = Object.keys(results).length;
  
  // 计算平均持续时间
  const averageDuration = taskResults.length > 0
    ? taskResults.reduce((sum, r) => sum + r.duration, 0) / taskResults.length
    : 0;
  
  /**
   * 创建单个上传任务
   */
  const createUploadTask = useCallback((
    template: HistoryTemplate,
    file: File,
    feishuAppId: string,
    feishuAppSecret: string,
    isMultiSheet: boolean,
    sheetName?: string,
    tableId?: string
  ): BatchTask => {
    const taskId = sheetName && tableId 
      ? `${template.id}-${tableId}-${sheetName}`
      : tableId 
        ? `${template.id}-${tableId}`
        : template.id;
    
    const taskTitle = sheetName && tableId
      ? `${template.name} - ${sheetName} (${tableId})`
      : tableId
        ? `${template.name} - ${tableId}`
        : template.name;
    
    return {
      id: taskId,
      title: taskTitle,
      description: `上传文件: ${file.name}`,
      weight: 1,
      retryable: true,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        fileName: file.name,
        fileSize: file.size,
        sheetName,
        tableId,
        isMultiSheet,
      },
      action: async () => {
        const formData = new FormData();
        formData.append('file', file);
        
        if (sheetName) {
          formData.append('sheetName', sheetName);
        }
        
        formData.append('spreadsheetToken', template.spreadsheetToken);
        
        if (tableId) {
          formData.append('sheetId', tableId);
        }
        
        formData.append('appId', feishuAppId);
        formData.append('appSecret', feishuAppSecret);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          signal: abortControllerRef.current?.signal,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`上传失败: ${response.status} ${errorText}`);
        }
        
        const result: UploadResult = await response.json();
        return result;
      },
    };
  }, []);
  
  /**
   * 开始批量上传
   */
  const startBatchUpload = useCallback(async (
    templates: HistoryTemplate[],
    options: BatchUploadOptions = {}
  ) => {
    const {
      concurrent = false,
      maxConcurrent = 3,
      feishuAppId = '',
      feishuAppSecret = '',
      onProgress,
      onComplete,
      onError,
    } = options;
    
    // 验证参数
    if (!feishuAppId || !feishuAppSecret) {
      const errorMsg = '请先配置飞书 App ID 和 App Secret';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    // 过滤有文件的模板
    const templatesWithFiles = templates.filter(template => {
      // 这里需要从全局状态获取文件，暂时简化处理
      return true; // 实际实现中需要检查文件是否存在
    });
    
    if (templatesWithFiles.length === 0) {
      const errorMsg = '没有已上传文件的模版';
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    // 重置状态
    setIsUploading(true);
    setProgress(0);
    setCompleted(0);
    setTotal(0);
    setError(null);
    setResults({});
    setTaskResults([]);
    isPausedRef.current = false;
    currentTemplatesRef.current = templatesWithFiles;
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController();
    
    // 创建批量任务
    const batchTasks: BatchTask[] = [];
    
    for (const template of templatesWithFiles) {
      // 这里需要从全局状态获取文件，暂时简化处理
      // 实际实现中需要获取 templateFiles[template.id]
      const file = new File([''], 'dummy.txt'); // 占位文件
      
      // 检查是否是多Sheet Excel
      // 实际实现中需要检查 templateSheetNames[template.id]
      const sheetNames: string[] = []; // 占位
      const isMultiSheetExcel = sheetNames.length > 1 && 
        template.tableToSheetMapping && 
        Object.keys(template.tableToSheetMapping).length > 0;
      
      if (isMultiSheetExcel && template.tableToSheetMapping) {
        // 多Sheet模式
        for (const [tableId, sheetName] of Object.entries(template.tableToSheetMapping)) {
          if (!sheetName) continue;
          
          const task = createUploadTask(
            template,
            file,
            feishuAppId,
            feishuAppSecret,
            true,
            sheetName,
            tableId
          );
          batchTasks.push(task);
        }
      } else {
        // 单Sheet模式
        for (const tableId of template.selectedTableIds || []) {
          const task = createUploadTask(
            template,
            file,
            feishuAppId,
            feishuAppSecret,
            false,
            undefined,
            tableId
          );
          batchTasks.push(task);
        }
      }
    }
    
    setTasks(batchTasks);
    setTotal(batchTasks.length);
    
    try {
      // 执行批量任务
      const results: Record<string, UploadResult> = {};
      const taskResults: BatchTaskResult[] = [];
      
      if (concurrent) {
        // 并发执行
        await executeConcurrently(batchTasks, maxConcurrent, results, taskResults, onProgress);
      } else {
        // 顺序执行
        await executeSequentially(batchTasks, results, taskResults, onProgress);
      }
      
      // 设置最终结果
      setResults(results);
      setTaskResults(taskResults);
      setProgress(100);
      setCompleted(batchTasks.length);
      setIsUploading(false);
      
      if (onComplete) {
        onComplete(results);
      }
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '批量上传失败';
      setError(errorMsg);
      setIsUploading(false);
      
      if (onError) {
        onError(errorMsg);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [createUploadTask]);
  
  /**
   * 顺序执行任务
   */
  const executeSequentially = async (
    tasks: BatchTask[],
    results: Record<string, UploadResult>,
    taskResults: BatchTaskResult[],
    onProgress?: (progress: number, completed: number, total: number) => void
  ) => {
    for (let i = 0; i < tasks.length; i++) {
      // 检查是否暂停
      while (isPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 检查是否取消
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }
      
      const task = tasks[i];
      const startTime = new Date();
      
      try {
        // 执行任务
        const result = await task.action();
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        
        // 记录结果
        results[task.id] = result;
        taskResults.push({
          id: task.id,
          success: true,
          data: result,
          startTime,
          endTime,
          duration,
        });
        
        // 更新进度
        const progress = ((i + 1) / tasks.length) * 100;
        setProgress(progress);
        setCompleted(i + 1);
        
        if (onProgress) {
          onProgress(progress, i + 1, tasks.length);
        }
        
      } catch (err) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        const error = err instanceof Error ? err : new Error('任务执行失败');
        
        // 记录失败结果
        results[task.id] = {
          success: false,
          fileName: task.metadata?.fileName as string || '未知文件',
          tableName: task.title,
          syncError: error.message,
        } as any;
        
        taskResults.push({
          id: task.id,
          success: false,
          error,
          startTime,
          endTime,
          duration,
        });
        
        // 更新进度（失败也计入完成）
        const progress = ((i + 1) / tasks.length) * 100;
        setProgress(progress);
        setCompleted(i + 1);
        
        if (onProgress) {
          onProgress(progress, i + 1, tasks.length);
        }
      }
    }
  };
  
  /**
   * 并发执行任务
   */
  const executeConcurrently = async (
    tasks: BatchTask[],
    maxConcurrent: number,
    results: Record<string, UploadResult>,
    taskResults: BatchTaskResult[],
    onProgress?: (progress: number, completed: number, total: number) => void
  ) => {
    const pendingTasks = [...tasks];
    const executingPromises = new Map<string, Promise<void>>();
    let completedCount = 0;
    
    // 执行单个任务
    const executeTask = async (task: BatchTask): Promise<void> => {
      const startTime = new Date();
      
      try {
        const result = await task.action();
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        
        // 记录结果
        results[task.id] = result;
        taskResults.push({
          id: task.id,
          success: true,
          data: result,
          startTime,
          endTime,
          duration,
        });
        
      } catch (err) {
        const endTime = new Date();
        const duration = endTime.getTime() - startTime.getTime();
        const error = err instanceof Error ? err : new Error('任务执行失败');
        
        // 记录失败结果
        results[task.id] = {
          success: false,
          fileName: task.metadata?.fileName as string || '未知文件',
          tableName: task.title,
          syncError: error.message,
        } as any;
        
        taskResults.push({
          id: task.id,
          success: false,
          error,
          startTime,
          endTime,
          duration,
        });
        
      } finally {
        // 更新进度
        completedCount++;
        executingPromises.delete(task.id);
        
        const progress = (completedCount / tasks.length) * 100;
        setProgress(progress);
        setCompleted(completedCount);
        
        if (onProgress) {
          onProgress(progress, completedCount, tasks.length);
        }
      }
    };
    
    // 主循环
    while (pendingTasks.length > 0 || executingPromises.size > 0) {
      // 检查是否暂停
      while (isPausedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 检查是否取消
      if (abortControllerRef.current?.signal.aborted) {
        break;
      }
      
      // 启动新任务直到达到并发上限
      while (executingPromises.size < maxConcurrent && pendingTasks.length > 0) {
        const task = pendingTasks.shift()!;
        const promise = executeTask(task);
        executingPromises.set(task.id, promise);
      }
      
      // 等待至少一个任务完成
      if (executingPromises.size > 0) {
        await Promise.race(executingPromises.values());
      }
      
      // 短暂延迟
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // 等待所有剩余任务完成
    if (executingPromises.size > 0) {
      await Promise.all(executingPromises.values());
    }
  };
  
  /**
   * 取消批量上传
   */
  const cancelBatchUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsUploading(false);
    isPausedRef.current = false;
    setError('上传已取消');
  }, []);
  
  /**
   * 暂停批量上传
   */
  const pauseBatchUpload = useCallback(() => {
    isPausedRef.current = true;
  }, []);
  
  /**
   * 继续批量上传
   */
  const resumeBatchUpload = useCallback(() => {
    isPausedRef.current = false;
  }, []);
  
  /**
   * 重置批量上传状态
   */
  const resetBatchUpload = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setCompleted(0);
    setTotal(0);
    setError(null);
    setResults({});
    setTasks([]);
    setTaskResults([]);
    isPausedRef.current = false;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  return {
    // 状态
    isUploading,
    progress,
    completed,
    total,
    error,
    results,
    
    // 批量任务
    tasks,
    taskResults,
    
    // 操作方法
    startBatchUpload,
    cancelBatchUpload,
    pauseBatchUpload,
    resumeBatchUpload,
    resetBatchUpload,
    
    // 统计信息
    stats: {
      successCount,
      failureCount,
      totalCount,
      averageDuration,
    },
  };
}
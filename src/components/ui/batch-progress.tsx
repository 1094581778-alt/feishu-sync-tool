'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UnifiedProgress, type ProgressStatus, type SubTask } from './unified-progress';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Clock,
  FileText,
  Database,
  Zap,
  RefreshCw,
  Download,
  ChevronRight,
  Info
} from 'lucide-react';

/**
 * 批量任务配置
 */
export interface BatchTask {
  id: string;
  title: string;
  description?: string;
  action: () => Promise<any>;
  weight?: number; // 任务权重，用于计算进度（默认1）
  retryable?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 批量任务结果
 */
export interface BatchTaskResult {
  id: string;
  success: boolean;
  data?: any;
  error?: Error;
  startTime: Date;
  endTime: Date;
  duration: number;
}

/**
 * 批量进度组件属性
 */
export interface BatchProgressProps {
  // 任务配置
  tasks: BatchTask[];
  title?: string;
  description?: string;
  
  // 控制选项
  autoStart?: boolean;
  concurrent?: boolean;
  maxConcurrent?: number;
  showControls?: boolean;
  showResults?: boolean;
  cancellable?: boolean;
  pausable?: boolean;
  retryable?: boolean;
  
  // 事件回调
  onStart?: () => void;
  onComplete?: (results: BatchTaskResult[], successCount: number, failureCount: number) => void;
  onProgress?: (progress: number, completed: number, total: number) => void;
  onTaskComplete?: (result: BatchTaskResult) => void;
  onTaskError?: (taskId: string, error: Error) => void;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  
  // 样式
  className?: string;
}

/**
 * 批量进度组件
 * 用于管理和显示批量任务的执行进度
 */
export function BatchProgress({
  tasks,
  title = '批量处理任务',
  description = '正在执行批量处理任务，请稍候...',
  autoStart = false,
  concurrent = false,
  maxConcurrent = 3,
  showControls = true,
  showResults = true,
  cancellable = true,
  pausable = true,
  retryable = true,
  onStart,
  onComplete,
  onProgress,
  onTaskComplete,
  onTaskError,
  onCancel,
  onPause,
  onResume,
  onRetry,
  className,
}: BatchProgressProps) {
  // 状态管理
  const [status, setStatus] = useState<ProgressStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<BatchTaskResult[]>([]);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 引用存储
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeTasksRef = useRef<Set<string>>(new Set());
  const taskWeightsRef = useRef<number>(0);
  
  // 计算任务总权重
  const totalWeight = tasks.reduce((sum, task) => sum + (task.weight || 1), 0);
  
  // 初始化子任务
  useEffect(() => {
    const initialSubTasks: SubTask[] = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: 'idle',
      progress: 0,
      metadata: task.metadata,
    }));
    setSubTasks(initialSubTasks);
  }, [tasks]);
  
  // 计算当前完成的权重
  const completedWeight = completedTasks.reduce((sum, result) => {
    const task = tasks.find(t => t.id === result.id);
    return sum + (task?.weight || 1);
  }, 0);
  
  // 计算进度
  useEffect(() => {
    const newProgress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
    setProgress(newProgress);
    
    // 触发进度回调
    if (onProgress) {
      onProgress(newProgress, completedTasks.length, tasks.length);
    }
    
    // 检查是否所有任务都已完成
    if (completedTasks.length === tasks.length && tasks.length > 0 && status === 'running') {
      const successCount = completedTasks.filter(r => r.success).length;
      const failureCount = completedTasks.length - successCount;
      
      const finalStatus = failureCount > 0 ? 'failed' : 'completed';
      setStatus(finalStatus);
      
      if (onComplete) {
        onComplete(completedTasks, successCount, failureCount);
      }
    }
  }, [completedTasks, tasks.length, totalWeight, completedWeight, status, onProgress, onComplete]);
  
  // 自动开始
  useEffect(() => {
    if (autoStart && status === 'idle' && tasks.length > 0) {
      handleStart();
    }
  }, [autoStart, status, tasks.length]);
  
  // 更新子任务状态
  const updateSubTask = useCallback((taskId: string, updates: Partial<SubTask>) => {
    setSubTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  }, []);
  
  // 执行单个任务
  const executeTask = useCallback(async (task: BatchTask): Promise<BatchTaskResult> => {
    const startTime = new Date();
    
    // 更新子任务状态为运行中
    updateSubTask(task.id, {
      status: 'running',
      progress: 0,
      startTime,
    });
    
    try {
      // 执行任务
      const result = await task.action();
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const taskResult: BatchTaskResult = {
        id: task.id,
        success: true,
        data: result,
        startTime,
        endTime,
        duration,
      };
      
      // 更新子任务状态为已完成
      updateSubTask(task.id, {
        status: 'completed',
        progress: 100,
        endTime,
      });
      
      // 触发任务完成回调
      if (onTaskComplete) {
        onTaskComplete(taskResult);
      }
      
      return taskResult;
    } catch (err) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      const error = err instanceof Error ? err : new Error('任务执行失败');
      
      const taskResult: BatchTaskResult = {
        id: task.id,
        success: false,
        error,
        startTime,
        endTime,
        duration,
      };
      
      // 更新子任务状态为失败
      updateSubTask(task.id, {
        status: 'failed',
        progress: 100,
        endTime,
        error: error.message,
      });
      
      // 触发任务错误回调
      if (onTaskError) {
        onTaskError(task.id, error);
      }
      
      return taskResult;
    } finally {
      // 从活动任务中移除
      activeTasksRef.current.delete(task.id);
    }
  }, [updateSubTask, onTaskComplete, onTaskError]);
  
  // 执行批量任务（顺序执行）
  const executeSequentially = useCallback(async () => {
    const results: BatchTaskResult[] = [];
    
    for (const task of tasks) {
      // 检查是否被取消或暂停
      if (status !== 'running' || isPaused) {
        break;
      }
      
      // 等待暂停状态
      while (isPaused && status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 再次检查是否被取消
      if (status !== 'running') {
        break;
      }
      
      // 执行任务
      const result = await executeTask(task);
      results.push(result);
      
      // 更新完成的任务
      setCompletedTasks(prev => [...prev, result]);
    }
    
    return results;
  }, [tasks, status, isPaused, executeTask]);
  
  // 执行批量任务（并发执行）
  const executeConcurrently = useCallback(async () => {
    const results: BatchTaskResult[] = [];
    const pendingTasks = [...tasks];
    const executingPromises = new Map<string, Promise<BatchTaskResult>>();
    
    // 执行函数
    const executeWithLimit = async (task: BatchTask): Promise<BatchTaskResult> => {
      activeTasksRef.current.add(task.id);
      const result = await executeTask(task);
      executingPromises.delete(task.id);
      return result;
    };
    
    while (pendingTasks.length > 0 || executingPromises.size > 0) {
      // 检查是否被取消或暂停
      if (status !== 'running' || isPaused) {
        break;
      }
      
      // 等待暂停状态
      while (isPaused && status === 'running') {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 再次检查是否被取消
      if (status !== 'running') {
        break;
      }
      
      // 启动新的任务直到达到并发上限
      while (executingPromises.size < maxConcurrent && pendingTasks.length > 0) {
        const task = pendingTasks.shift()!;
        const promise = executeWithLimit(task);
        executingPromises.set(task.id, promise);
        
        // 添加结果处理
        promise.then(result => {
          results.push(result);
          setCompletedTasks(prev => [...prev, result]);
        });
      }
      
      // 等待至少一个任务完成
      if (executingPromises.size > 0) {
        await Promise.race(executingPromises.values());
      }
      
      // 短暂的延迟，避免过于频繁的循环
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // 等待所有剩余任务完成
    if (executingPromises.size > 0) {
      const remainingResults = await Promise.all(executingPromises.values());
      results.push(...remainingResults);
      remainingResults.forEach(result => {
        setCompletedTasks(prev => [...prev, result]);
      });
    }
    
    return results;
  }, [tasks, status, isPaused, executeTask, maxConcurrent]);
  
  // 开始执行
  const handleStart = useCallback(async () => {
    if (status !== 'idle' || tasks.length === 0) return;
    
    // 重置状态
    setStatus('running');
    setProgress(0);
    setCompletedTasks([]);
    setError('');
    setStartTime(new Date());
    setIsPaused(false);
    
    // 创建新的AbortController
    abortControllerRef.current = new AbortController();
    activeTasksRef.current.clear();
    
    // 初始化子任务状态
    setSubTasks(tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: 'idle',
      progress: 0,
      metadata: task.metadata,
    })));
    
    // 触发开始回调
    if (onStart) {
      onStart();
    }
    
    try {
      // 根据并发设置选择执行方式
      const results = concurrent 
        ? await executeConcurrently()
        : await executeSequentially();
      
      // 计算最终结果
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      // 设置最终状态
      const finalStatus = failureCount > 0 ? 'failed' : 'completed';
      setStatus(finalStatus);
      
      // 触发完成回调
      if (onComplete) {
        onComplete(results, successCount, failureCount);
      }
      
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : '批量任务执行失败');
      
      // 触发错误回调
      if (onTaskError) {
        onTaskError('batch', err instanceof Error ? err : new Error('批量任务执行失败'));
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, [status, tasks, concurrent, onStart, onComplete, onTaskError, executeConcurrently, executeSequentially]);
  
  // 暂停执行
  const handlePause = useCallback(() => {
    if (status !== 'running' || !pausable) return;
    
    setIsPaused(true);
    setStatus('paused');
    
    if (onPause) {
      onPause();
    }
  }, [status, pausable, onPause]);
  
  // 继续执行
  const handleResume = useCallback(() => {
    if (status !== 'paused' || !pausable) return;
    
    setIsPaused(false);
    setStatus('running');
    
    if (onResume) {
      onResume();
    }
  }, [status, pausable, onResume]);
  
  // 取消执行
  const handleCancel = useCallback(() => {
    if (status !== 'running' && status !== 'paused' || !cancellable) return;
    
    // 中止所有正在执行的任务
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 更新状态
    setStatus('cancelled');
    setIsPaused(false);
    
    // 更新所有运行中的子任务为已取消
    setSubTasks(prev => prev.map(task => 
      task.status === 'running' || task.status === 'idle' 
        ? { ...task, status: 'cancelled', progress: 0 }
        : task
    ));
    
    if (onCancel) {
      onCancel();
    }
  }, [status, cancellable, onCancel]);
  
  // 重试执行
  const handleRetry = useCallback(() => {
    if (status !== 'failed' && status !== 'cancelled' || !retryable) return;
    
    // 重置状态
    setStatus('idle');
    setProgress(0);
    setCompletedTasks([]);
    setError('');
    setStartTime(null);
    setIsPaused(false);
    
    if (onRetry) {
      onRetry();
    }
    
    // 自动开始重试
    setTimeout(() => {
      handleStart();
    }, 100);
  }, [status, retryable, onRetry, handleStart]);
  
  // 计算统计信息
  const successCount = completedTasks.filter(r => r.success).length;
  const failureCount = completedTasks.length - successCount;
  const pendingCount = tasks.length - completedTasks.length;
  
  // 计算平均执行时间
  const averageDuration = completedTasks.length > 0
    ? completedTasks.reduce((sum, r) => sum + r.duration, 0) / completedTasks.length
    : 0;
  
  // 渲染结果摘要
  const renderResultsSummary = () => {
    if (!showResults || completedTasks.length === 0) return null;
    
    return (
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">执行结果摘要</h4>
          <Badge variant="outline" className="text-xs">
            {completedTasks.length}/{tasks.length} 任务
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {successCount}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">成功</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {failureCount}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">失败</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {Math.round(averageDuration)}ms
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">平均耗时</div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* 详细结果列表 */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">任务详情</div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {completedTasks.map((result, index) => {
              const task = tasks.find(t => t.id === result.id);
              
              return (
                <Card
                  key={result.id}
                  className={cn(
                    'p-3 border transition-colors',
                    result.success 
                      ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20'
                      : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {task?.title || `任务 ${index + 1}`}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          耗时: {result.duration}ms
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={result.success ? 'outline' : 'destructive'}
                        className="text-xs"
                      >
                        {result.success ? '成功' : '失败'}
                      </Badge>
                      
                      {!result.success && result.error && (
                        <div title={result.error.message}>
                          <AlertTriangle 
                            className="h-3 w-3 text-red-500" 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染操作按钮
  const renderActionButtons = () => {
    if (!showControls) return null;
    
    return (
      <div className="flex items-center gap-2 mt-4">
        {status === 'idle' && tasks.length > 0 && (
          <Button onClick={handleStart} className="gap-2">
            <Zap className="h-4 w-4" />
            开始批量处理
          </Button>
        )}
        
        {status === 'running' && (
          <>
            {pausable && (
              <Button onClick={handlePause} variant="outline" className="gap-2">
                <Loader2 className="h-4 w-4" />
                暂停
              </Button>
            )}
            
            {cancellable && (
              <Button onClick={handleCancel} variant="destructive" className="gap-2">
                <XCircle className="h-4 w-4" />
                取消
              </Button>
            )}
          </>
        )}
        
        {status === 'paused' && pausable && (
          <Button onClick={handleResume} className="gap-2">
            <Loader2 className="h-4 w-4" />
            继续
          </Button>
        )}
        
        {(status === 'failed' || status === 'cancelled') && retryable && (
          <Button onClick={handleRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            重新尝试
          </Button>
        )}
      </div>
    );
  };
  
  return (
    <div className={className}>
      {/* 统一进度指示器 */}
      <UnifiedProgress
        title={title}
        description={description}
        type="batch"
        status={status}
        progress={progress}
        total={tasks.length}
        completed={successCount}
        failed={failureCount}
        startTime={startTime || undefined}
        subTasks={subTasks}
        showControls={false} // 使用自定义控制按钮
        cancellable={false}
        pausable={false}
        retryable={false}
        error={error}
        className="mb-6"
      />
      
      {/* 操作按钮 */}
      {renderActionButtons()}
      
      {/* 结果摘要 */}
      {renderResultsSummary()}
      
      {/* 状态提示 */}
      {status === 'idle' && tasks.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              暂无待处理任务
            </div>
          </div>
        </div>
      )}
      
      {/* 任务统计信息 */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">总任务数</div>
          <div className="font-medium text-foreground">{tasks.length}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">等待中</div>
          <div className="font-medium text-foreground">{pendingCount}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">执行方式</div>
          <div className="font-medium text-foreground">
            {concurrent ? `并发 (${maxConcurrent})` : '顺序'}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">总权重</div>
          <div className="font-medium text-foreground">{totalWeight}</div>
        </div>
      </div>
    </div>
  );
}
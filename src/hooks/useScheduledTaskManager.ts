/**
 * 定时任务管理 Hook
 * 负责任务的持久化存储和管理
 */

import { useState, useEffect, useCallback } from 'react';
import type { ScheduledTaskConfig, ScheduledTaskExecutionLog, TaskStatus } from '@/types/scheduled-task';
import { scheduledTaskEngine, type TaskExecutionResult } from '@/services/scheduled-task-engine';

const STORAGE_KEY = 'scheduled_tasks';

export function useScheduledTaskManager() {
  const [tasks, setTasks] = useState<ScheduledTaskConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 从 localStorage 加载任务
   */
  const loadTasks = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedTasks = JSON.parse(stored);
        setTasks(parsedTasks);
        scheduledTaskEngine.initializeTasks(parsedTasks);
      }
      setError(null);
    } catch (err) {
      console.error('加载任务失败:', err);
      setError('加载任务配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 保存任务到 localStorage
   */
  const saveTasks = useCallback((tasksToSave: ScheduledTaskConfig[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (err) {
      console.error('保存任务失败:', err);
      setError('保存任务配置失败');
    }
  }, []);

  /**
   * 添加任务
   */
  const addTask = useCallback((task: ScheduledTaskConfig) => {
    setTasks(prev => {
      const newTasks = [...prev, task];
      saveTasks(newTasks);
      scheduledTaskEngine.registerTask(task);
      return newTasks;
    });
  }, [saveTasks]);

  /**
   * 更新任务
   */
  const updateTask = useCallback((task: ScheduledTaskConfig) => {
    setTasks(prev => {
      const newTasks = prev.map(t => t.id === task.id ? task : t);
      saveTasks(newTasks);
      scheduledTaskEngine.registerTask(task);
      return newTasks;
    });
  }, [saveTasks]);

  /**
   * 删除任务
   */
  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const newTasks = prev.filter(t => t.id !== taskId);
      saveTasks(newTasks);
      scheduledTaskEngine.removeTask(taskId);
      return newTasks;
    });
  }, [saveTasks]);

  /**
   * 切换任务启用状态
   */
  const toggleTask = useCallback((taskId: string) => {
    setTasks(prev => {
      const newTasks = prev.map(t => {
        if (t.id === taskId) {
          const updated = { ...t, enabled: !t.enabled };
          scheduledTaskEngine.updateTaskStatus(taskId, updated.enabled);
          return updated;
        }
        return t;
      });
      saveTasks(newTasks);
      return newTasks;
    });
  }, [saveTasks]);

  /**
   * 立即执行任务
   */
  const executeTaskNow = useCallback(async (taskId: string): Promise<TaskExecutionResult> => {
    return await scheduledTaskEngine.executeTaskNow(taskId);
  }, []);

  /**
   * 获取任务执行日志
   */
  const getTaskLogs = useCallback((taskId: string): ScheduledTaskExecutionLog[] => {
    return scheduledTaskEngine.getExecutionLogs(taskId);
  }, []);

  /**
   * 获取任务下次执行时间
   */
  const getNextRunTime = useCallback((task: ScheduledTaskConfig): string => {
    const nextRun = scheduledTaskEngine.calculateNextRun(task);
    if (!nextRun) return '无法计算';
    return nextRun.toLocaleString('zh-CN');
  }, []);

  /**
   * 验证 Cron 表达式
   */
  const validateCron = useCallback((cronExpression: string): { valid: boolean; error?: string } => {
    return scheduledTaskEngine.validateCronExpression(cronExpression);
  }, []);

  /**
   * 获取任务统计信息
   */
  const getTaskStats = useCallback(() => {
    const total = tasks.length;
    const enabled = tasks.filter(t => t.enabled).length;
    const disabled = total - enabled;
    return { total, enabled, disabled };
  }, [tasks]);

  // 初始化加载
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 设置执行回调，用于更新任务状态
  useEffect(() => {
    const handleExecution = async (taskId: string, result: TaskExecutionResult) => {
      setTasks(prev => {
        const newTasks = prev.map(t => {
          if (t.id === taskId) {
            return {
              ...t,
              lastRunAt: new Date().toISOString(),
              lastRunStatus: (result.success ? 'success' : 'failed') as TaskStatus,
              lastRunMessage: result.message,
            };
          }
          return t;
        });
        saveTasks(newTasks);
        return newTasks;
      });
    };

    scheduledTaskEngine.setExecutionCallback(handleExecution);
  }, [saveTasks]);

  // 页面卸载时清理
  useEffect(() => {
    return () => {
      scheduledTaskEngine.destroy();
    };
  }, []);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    executeTaskNow,
    getTaskLogs,
    getNextRunTime,
    validateCron,
    getTaskStats,
    refreshTasks: loadTasks,
  };
}

'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type ProgressStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status: 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface UnifiedProgressProps {
  title?: string;
  description?: string;
  type?: 'single' | 'batch';
  status: ProgressStatus;
  progress: number;
  total?: number;
  completed?: number;
  failed?: number;
  startTime?: Date;
  subTasks?: SubTask[];
  showControls?: boolean;
  cancellable?: boolean;
  pausable?: boolean;
  retryable?: boolean;
  error?: string;
  className?: string;
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
}

export function UnifiedProgress({
  title = '任务进度',
  description = '正在处理...',
  type = 'single',
  status,
  progress,
  total = 100,
  completed = 0,
  failed = 0,
  startTime,
  subTasks = [],
  showControls = true,
  cancellable = true,
  pausable = true,
  retryable = true,
  error,
  className,
  onCancel,
  onPause,
  onResume,
  onRetry,
}: UnifiedProgressProps) {
  const getStatusColor = (s: ProgressStatus) => {
    switch (s) {
      case 'running':
      case 'paused':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getSubTaskStatusIcon = (s: SubTask['status']) => {
    switch (s) {
      case 'running':
        return '🔄';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⏸️';
      default:
        return '⏳';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300 ease-in-out',
                getStatusColor(status)
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {type === 'batch' && (
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">总计:</span> {total}
            </div>
            <div>
              <span className="text-muted-foreground">完成:</span> {completed}
            </div>
            <div>
              <span className="text-muted-foreground">失败:</span> {failed}
            </div>
          </div>
        )}

        {subTasks.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">子任务</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {subTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded"
                >
                  <span className="text-lg">{getSubTaskStatusIcon(task.status)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {task.description}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(task.progress)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && status === 'failed' && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {showControls && (
          <div className="flex gap-2">
            {status === 'running' && pausable && (
              <button
                onClick={onPause}
                className="px-4 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded transition-colors"
              >
                暂停
              </button>
            )}
            {status === 'paused' && pausable && (
              <button
                onClick={onResume}
                className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
              >
                继续
              </button>
            )}
            {(status === 'running' || status === 'paused') && cancellable && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
              >
                取消
              </button>
            )}
            {(status === 'failed' || status === 'cancelled') && retryable && (
              <button
                onClick={onRetry}
                className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white rounded transition-colors"
              >
                重试
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

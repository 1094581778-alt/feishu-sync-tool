'use client';

import React from 'react';
import { Progress } from './progress';
import { Button } from './button';
import { Card } from './card';
import { Badge } from './badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Clock, 
  Pause, 
  Play, 
  X, 
  ChevronDown, 
  ChevronUp,
  Zap,
  FileText,
  Database,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 进度指示器类型
 */
export type ProgressType = 
  | 'simple'      // 简单进度条
  | 'detailed'    // 详细进度显示
  | 'batch'       // 批量处理进度
  | 'steps';      // 多步骤进度

/**
 * 进度状态
 */
export type ProgressStatus = 
  | 'idle'        // 空闲
  | 'running'     // 运行中
  | 'paused'      // 暂停
  | 'completed'   // 已完成
  | 'failed'      // 失败
  | 'cancelled';  // 已取消

/**
 * 子任务状态
 */
export interface SubTask {
  id: string;
  title: string;
  description?: string;
  status: ProgressStatus;
  progress?: number; // 0-100
  error?: string;
  startTime?: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
}

/**
 * 进度指示器属性
 */
export interface UnifiedProgressProps {
  // 基本信息
  title?: string;
  description?: string;
  type?: ProgressType;
  status?: ProgressStatus;
  
  // 进度信息
  progress?: number; // 0-100
  total?: number;    // 总任务数
  completed?: number; // 已完成任务数
  failed?: number;   // 失败任务数
  
  // 时间信息
  startTime?: Date;
  estimatedTimeRemaining?: number; // 预计剩余时间（毫秒）
  
  // 子任务（用于批量处理）
  subTasks?: SubTask[];
  
  // 交互控制
  showControls?: boolean;
  showDetails?: boolean;
  cancellable?: boolean;
  pausable?: boolean;
  retryable?: boolean;
  
  // 事件处理
  onCancel?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onRetry?: () => void;
  onToggleDetails?: () => void;
  
  // 自定义渲染
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  
  // 样式
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'expanded';
  
  // 错误信息
  error?: string;
  errorDetails?: string;
}

/**
 * 统一的进度指示器组件
 * 支持简单进度条、详细进度显示和批量处理进度
 */
export function UnifiedProgress({
  // 基本信息
  title = '处理进度',
  description,
  type = 'detailed',
  status = 'idle',
  
  // 进度信息
  progress = 0,
  total = 0,
  completed = 0,
  failed = 0,
  
  // 时间信息
  startTime,
  estimatedTimeRemaining,
  
  // 子任务
  subTasks = [],
  
  // 交互控制
  showControls = true,
  showDetails = false,
  cancellable = true,
  pausable = true,
  retryable = false,
  
  // 事件处理
  onCancel,
  onPause,
  onResume,
  onRetry,
  onToggleDetails,
  
  // 自定义渲染
  renderHeader,
  renderFooter,
  
  // 样式
  className,
  size = 'md',
  variant = 'default',
  
  // 错误信息
  error,
  errorDetails,
}: UnifiedProgressProps) {
  // 计算运行时间
  const calculateElapsedTime = () => {
    if (!startTime) return 0;
    return Date.now() - startTime.getTime();
  };

  // 格式化时间
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}小时 ${minutes % 60}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟 ${seconds % 60}秒`;
    } else {
      return `${seconds}秒`;
    }
  };

  // 格式化剩余时间
  const formatRemainingTime = () => {
    if (!estimatedTimeRemaining) return '计算中...';
    return formatTime(estimatedTimeRemaining);
  };

  // 获取状态图标
  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Loader2 className={cn('animate-spin', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />;
      case 'completed':
        return <CheckCircle className={cn('text-green-500', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />;
      case 'failed':
        return <AlertCircle className={cn('text-red-500', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />;
      case 'paused':
        return <Pause className={cn('text-yellow-500', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />;
      case 'cancelled':
        return <X className={cn('text-gray-500', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />;
      default:
        return <Clock className={cn('text-gray-400', size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4')} />;
    }
  };

  // 获取状态文本
  const getStatusText = () => {
    switch (status) {
      case 'running':
        return '运行中';
      case 'completed':
        return '已完成';
      case 'failed':
        return '失败';
      case 'paused':
        return '已暂停';
      case 'cancelled':
        return '已取消';
      default:
        return '等待开始';
    }
  };

  // 获取状态颜色
  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'bg-blue-500 text-blue-100 border-blue-300';
      case 'completed':
        return 'bg-green-500 text-green-100 border-green-300';
      case 'failed':
        return 'bg-red-500 text-red-100 border-red-300';
      case 'paused':
        return 'bg-yellow-500 text-yellow-100 border-yellow-300';
      case 'cancelled':
        return 'bg-gray-500 text-gray-100 border-gray-300';
      default:
        return 'bg-gray-500 text-gray-100 border-gray-300';
    }
  };

  // 计算成功率和总任务数
  const successRate = total > 0 ? ((completed + failed) > 0 ? (completed / (completed + failed)) * 100 : 0) : 0;
  const processingCount = total - completed - failed;

  // 渲染简单进度条（仅显示进度百分比）
  const renderSimpleProgress = () => (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <Progress value={progress} />
      </div>
      <div className="text-sm font-medium text-foreground whitespace-nowrap">
        {Math.round(progress)}%
      </div>
    </div>
  );

  // 渲染详细进度信息
  const renderDetailedProgress = () => (
    <div className="space-y-3">
      {/* 进度条 */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Progress value={progress} />
        </div>
        <div className="text-sm font-medium text-foreground whitespace-nowrap">
          {Math.round(progress)}%
        </div>
      </div>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">已完成</div>
          <div className="font-medium text-foreground">{completed}/{total}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">失败</div>
          <div className="font-medium text-foreground">{failed}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">成功率</div>
          <div className="font-medium text-foreground">
            {Math.round(successRate)}%
          </div>
        </div>
        
        {estimatedTimeRemaining && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">剩余时间</div>
            <div className="font-medium text-foreground">
              {formatRemainingTime()}
            </div>
          </div>
        )}
      </div>
      
      {/* 运行时间 */}
      {startTime && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          已运行: {formatTime(calculateElapsedTime())}
        </div>
      )}
    </div>
  );

  // 渲染批量处理进度（显示子任务列表）
  const renderBatchProgress = () => (
    <div className="space-y-4">
      {/* 主进度条 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">整体进度</div>
          <div className="text-sm font-medium text-foreground">
            {Math.round(progress)}%
          </div>
        </div>
        <Progress value={progress} />
      </div>
      
      {/* 子任务列表 */}
      {subTasks.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-foreground">子任务详情</div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {subTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  task.status === 'completed' && 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800',
                  task.status === 'failed' && 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800',
                  task.status === 'running' && 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                  task.status === 'idle' && 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800',
                  task.status === 'paused' && 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {task.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                    {task.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-500" />}
                    {task.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500" />}
                    {task.status === 'idle' && <Clock className="h-3 w-3 text-gray-400" />}
                    {task.status === 'paused' && <Pause className="h-3 w-3 text-yellow-500" />}
                    
                    <div>
                      <div className="text-sm font-medium text-foreground">{task.title}</div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground mt-0.5">{task.description}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {task.progress !== undefined && (
                      <div className="text-xs font-medium text-foreground">
                        {Math.round(task.progress)}%
                      </div>
                    )}
                    
                    {task.status === 'failed' && task.error && (
                      <div title={task.error}>
                        <AlertTriangle className="h-3 w-3 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
                
                {task.progress !== undefined && (
                  <div className="mt-2">
                    <Progress 
                      value={task.progress} 
                      className={cn(
                        'h-1',
                        task.status === 'completed' && 'bg-green-200 dark:bg-green-800',
                        task.status === 'failed' && 'bg-red-200 dark:bg-red-800',
                        task.status === 'running' && 'bg-blue-200 dark:bg-blue-800'
                      )}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 根据类型选择渲染函数
  const renderProgressContent = () => {
    switch (type) {
      case 'simple':
        return renderSimpleProgress();
      case 'batch':
        return renderBatchProgress();
      case 'steps':
        return renderDetailedProgress(); // 暂时复用详细进度
      default:
        return renderDetailedProgress();
    }
  };

  // 渲染错误信息
  const renderError = () => {
    if (!error) return null;
    
    return (
      <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-red-700 dark:text-red-300">{error}</div>
            {errorDetails && (
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">{errorDetails}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn(
      'p-4 border transition-all duration-200',
      status === 'completed' && 'border-green-200 dark:border-green-800',
      status === 'failed' && 'border-red-200 dark:border-red-800',
      status === 'running' && 'border-blue-200 dark:border-blue-800',
      status === 'paused' && 'border-yellow-200 dark:border-yellow-800',
      className
    )}>
      {/* 自定义头部渲染 */}
      {renderHeader ? renderHeader() : (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'p-2 rounded-full',
              status === 'running' && 'bg-blue-100 dark:bg-blue-900/30',
              status === 'completed' && 'bg-green-100 dark:bg-green-900/30',
              status === 'failed' && 'bg-red-100 dark:bg-red-900/30',
              status === 'paused' && 'bg-yellow-100 dark:bg-yellow-900/30',
              status === 'idle' && 'bg-gray-100 dark:bg-gray-800'
            )}>
              {getStatusIcon()}
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-foreground">{title}</h3>
                <Badge 
                  variant="outline" 
                  className={cn(
                    'text-xs px-2 py-0.5',
                    status === 'running' && 'border-blue-300 text-blue-700 dark:text-blue-300',
                    status === 'completed' && 'border-green-300 text-green-700 dark:text-green-300',
                    status === 'failed' && 'border-red-300 text-red-700 dark:text-red-300',
                    status === 'paused' && 'border-yellow-300 text-yellow-700 dark:text-yellow-300'
                  )}
                >
                  {getStatusText()}
                </Badge>
              </div>
              
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          </div>
          
          {/* 控制按钮 */}
          {showControls && (
            <div className="flex items-center gap-1">
              {onToggleDetails && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onToggleDetails}
                >
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
              
              {pausable && status === 'running' && onPause && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={onPause}
                >
                  <Pause className="h-4 w-4 mr-1" />
                  暂停
                </Button>
              )}
              
              {pausable && status === 'paused' && onResume && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={onResume}
                >
                  <Play className="h-4 w-4 mr-1" />
                  继续
                </Button>
              )}
              
              {cancellable && status === 'running' && onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={onCancel}
                >
                  <X className="h-4 w-4 mr-1" />
                  取消
                </Button>
              )}
              
              {retryable && status === 'failed' && onRetry && (
                <Button
                  variant="default"
                  size="sm"
                  className="h-8"
                  onClick={onRetry}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重试
                </Button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* 进度内容 */}
      <div className="mb-4">
        {renderProgressContent()}
      </div>
      
      {/* 错误信息 */}
      {renderError()}
      
      {/* 自定义底部渲染 */}
      {renderFooter && renderFooter()}
    </Card>
  );
}
/**
 * 定时任务执行引擎
 * 负责调度和执行定时任务
 */

import parseExpression, { type ParsedExpression } from 'cron-parser';
import type { ScheduledTaskConfig, ScheduledTaskExecutionLog, TaskStatus, FileInfo } from '@/types/scheduled-task';
import { FileScanner } from './file-scanner-index';
import { isTauri } from './tauri';
import { fileSystemService } from './file-system';

export interface TaskExecutionResult {
  success: boolean;
  filesProcessed: number;
  rowsSynced: number;
  message: string;
  error?: string;
}

export type ExecutionCallback = (taskId: string, result: TaskExecutionResult) => Promise<void>;

class ScheduledTaskEngine {
  private static instance: ScheduledTaskEngine;
  private tasks: Map<string, ScheduledTaskConfig> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private executionLogs: Map<string, ScheduledTaskExecutionLog[]> = new Map();
  private onExecuteCallback?: ExecutionCallback;

  private constructor() {}

  static getInstance(): ScheduledTaskEngine {
    if (!ScheduledTaskEngine.instance) {
      ScheduledTaskEngine.instance = new ScheduledTaskEngine();
    }
    return ScheduledTaskEngine.instance;
  }

  /**
   * 设置执行回调
   */
  setExecutionCallback(callback: ExecutionCallback) {
    this.onExecuteCallback = callback;
  }

  /**
   * 计算下次执行时间
   */
  calculateNextRun(task: ScheduledTaskConfig): Date | null {
    try {
      if (task.triggerMode === 'cron' && task.cronExpression) {
        const interval = parseExpression(task.cronExpression, {
          currentDate: new Date(),
        });
        return interval.next().toDate();
      } else if (task.triggerMode === 'fixed_time' && task.fixedTimeConfig) {
        const now = new Date();
        const [hours, minutes] = task.fixedTimeConfig.time.split(':').map(Number);
        
        let nextRun = new Date();
        nextRun.setHours(hours, minutes, 0, 0);

        if (nextRun <= now) {
          switch (task.fixedTimeConfig.period) {
            case 'daily':
              nextRun.setDate(nextRun.getDate() + 1);
              break;
            case 'weekly':
              if (task.fixedTimeConfig.weekDay !== undefined) {
                const currentDay = nextRun.getDay();
                const daysUntilTarget = task.fixedTimeConfig.weekDay - currentDay;
                nextRun.setDate(nextRun.getDate() + (daysUntilTarget <= 0 ? daysUntilTarget + 7 : daysUntilTarget));
              } else {
                nextRun.setDate(nextRun.getDate() + 1);
              }
              break;
            case 'monthly':
              if (task.fixedTimeConfig.monthDay !== undefined) {
                const currentDay = nextRun.getDate();
                if (task.fixedTimeConfig.monthDay <= currentDay) {
                  nextRun.setMonth(nextRun.getMonth() + 1);
                }
                nextRun.setDate(task.fixedTimeConfig.monthDay);
              } else {
                nextRun.setMonth(nextRun.getMonth() + 1);
              }
              break;
          }
        }

        return nextRun;
      }
    } catch (error) {
      console.error('计算下次执行时间失败:', error);
    }
    return null;
  }

  /**
   * 验证 Cron 表达式
   */
  validateCronExpression(cronExpression: string): { valid: boolean; error?: string } {
    try {
      parseExpression(cronExpression);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : '无效的 Cron 表达式',
      };
    }
  }

  /**
   * 注册任务
   */
  registerTask(task: ScheduledTaskConfig): void {
    this.tasks.set(task.id, task);
    
    if (task.enabled) {
      this.scheduleTask(task);
    } else {
      this.unscheduleTask(task.id);
    }
  }

  /**
   * 移除任务
   */
  removeTask(taskId: string): void {
    this.unscheduleTask(taskId);
    this.tasks.delete(taskId);
    this.executionLogs.delete(taskId);
  }

  /**
   * 调度任务
   */
  private scheduleTask(task: ScheduledTaskConfig): void {
    this.unscheduleTask(task.id);

    const nextRun = this.calculateNextRun(task);
    if (!nextRun) {
      console.error(`任务 ${task.id} 无法计算下次执行时间`);
      return;
    }

    const delay = nextRun.getTime() - Date.now();
    if (delay <= 0) {
      console.warn(`任务 ${task.id} 的执行时间已过，立即执行`);
      this.executeTask(task);
      return;
    }

    console.log(`任务 ${task.name} 将在 ${nextRun.toLocaleString('zh-CN')} 执行，延迟 ${Math.round(delay / 1000)}秒`);

    const timeout = setTimeout(() => {
      this.executeTask(task);
      
      if (task.enabled) {
        this.scheduleTask(task);
      }
    }, delay);

    this.intervals.set(task.id, timeout);
  }

  /**
   * 取消任务调度
   */
  private unscheduleTask(taskId: string): void {
    const timeout = this.intervals.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      this.intervals.delete(taskId);
    }
  }

  /**
   * 执行任务
   */
  async executeTask(task: ScheduledTaskConfig): Promise<TaskExecutionResult> {
    const startTime = new Date();
    const log: ScheduledTaskExecutionLog = {
      id: crypto.randomUUID(),
      taskId: task.id,
      startTime: startTime.toISOString(),
      status: 'running',
      message: '任务开始执行',
      filesProcessed: 0,
      rowsSynced: 0,
    };

    try {
      console.log(`开始执行任务：${task.name}`);

      if (!task.enabled) {
        throw new Error('任务已禁用');
      }

      if (task.paths.length === 0) {
        throw new Error('未配置文件路径');
      }

      let allFiles: FileInfo[] = [];
      for (const path of task.paths) {
        const result = await FileScanner.scanPath(path);
        if (result.success) {
          allFiles.push(...result.files);
        } else {
          throw new Error(`扫描路径失败：${path} - ${result.error}`);
        }
      }

      const filteredFiles = FileScanner.filterFiles(allFiles, task.fileFilter);

      if (filteredFiles.length === 0) {
        if (task.validateBeforeTrigger) {
          throw new Error('未找到符合条件的文件，任务终止');
        }
      }

      console.log(`找到 ${filteredFiles.length} 个符合条件的文件`);

      let filesProcessed = 0;
      let rowsSynced = 0;

      for (const file of filteredFiles) {
        try {
          const result = await this.syncFileToFeishu(file, task);
          filesProcessed++;
          rowsSynced += result.rowsSynced;
        } catch (error) {
          console.error(`文件同步失败：${file.name}`, error);
          if (task.maxRetries > 0) {
            await this.retryFileSync(file, task, task.maxRetries);
          }
        }
      }

      const endTime = new Date();
      log.endTime = endTime.toISOString();
      log.status = 'success';
      log.message = `执行完成：处理 ${filesProcessed} 个文件，同步 ${rowsSynced} 行数据`;
      log.filesProcessed = filesProcessed;
      log.rowsSynced = rowsSynced;

      this.addLog(task.id, log);

      const taskResult: TaskExecutionResult = {
        success: true,
        filesProcessed,
        rowsSynced,
        message: log.message,
      };

      if (this.onExecuteCallback) {
        await this.onExecuteCallback(task.id, taskResult);
      }

      return taskResult;
    } catch (error) {
      const endTime = new Date();
      log.endTime = endTime.toISOString();
      log.status = 'failed';
      log.message = error instanceof Error ? error.message : '任务执行失败';
      log.errorDetails = error instanceof Error ? error.stack : String(error);

      this.addLog(task.id, log);

      const taskResult: TaskExecutionResult = {
        success: false,
        filesProcessed: 0,
        rowsSynced: 0,
        message: log.message,
        error: log.errorDetails,
      };

      if (this.onExecuteCallback) {
        await this.onExecuteCallback(task.id, taskResult);
      }

      return taskResult;
    }
  }

  /**
   * 同步文件到飞书
   */
  private async syncFileToFeishu(file: FileInfo, task: ScheduledTaskConfig): Promise<{ rowsSynced: number }> {
    console.log(`同步文件：${file.name}`);
    
    const result = { rowsSynced: 0 };
    
    try {
      // 检查是否为 Tauri 环境
      if (!isTauri()) {
        throw new Error('定时任务同步功能仅在 Tauri 桌面版中可用，浏览器版本仅支持模拟测试');
      }

      // 在 Tauri 环境中读取文件
      const fileContent = await fileSystemService.readFile(file.path, { asArrayBuffer: true });
      const fileBuffer = Buffer.from(fileContent as ArrayBuffer);
      
      // 创建 File 对象
      const fileObj = new File([fileBuffer], file.name, {
        type: this.getMimeType(file.extension),
      });

      // 从模板配置中获取飞书参数
      const templateConfig = await this.getTemplateConfig(task.templateId);
      if (!templateConfig) {
        throw new Error(`未找到模板配置：${task.templateId}`);
      }

      // 构建 formData
      const formData = new FormData();
      formData.append('file', fileObj);
      formData.append('spreadsheetToken', templateConfig.spreadsheetToken);
      
      if (templateConfig.appId) {
        formData.append('appId', templateConfig.appId);
      }
      if (templateConfig.appSecret) {
        formData.append('appSecret', templateConfig.appSecret);
      }

      // 发送到正确的端口
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`上传失败：${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      result.rowsSynced = data.rowsSynced || 0;
      
      console.log(`文件同步成功：${file.name}, 同步 ${result.rowsSynced} 行`);
    } catch (error) {
      console.error(`文件同步失败：${file.name}`, error);
      throw error;
    }

    return result;
  }

  /**
   * 获取文件 MIME 类型
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      xls: 'application/vnd.ms-excel',
      csv: 'text/csv',
      txt: 'text/plain',
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[extension?.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * 从 localStorage 获取模板配置
   */
  private async getTemplateConfig(templateId: string): Promise<{
    spreadsheetToken: string;
    appId?: string;
    appSecret?: string;
  } | null> {
    try {
      const stored = localStorage.getItem('feishuHistoryTemplates');
      if (!stored) {
        return null;
      }

      const templates = JSON.parse(stored);
      const template = templates.find((t: any) => t.id === templateId);
      
      if (!template) {
        return null;
      }

      return {
        spreadsheetToken: template.spreadsheetToken,
        appId: template.appId,
        appSecret: template.appSecret,
      };
    } catch (error) {
      console.error('获取模板配置失败:', error);
      return null;
    }
  }

  /**
   * 重试文件同步
   */
  private async retryFileSync(file: FileInfo, task: ScheduledTaskConfig, retries: number): Promise<void> {
    for (let i = 0; i < retries; i++) {
      console.log(`重试同步文件：${file.name} (第 ${i + 1}/${retries} 次)`);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        await this.syncFileToFeishu(file, task);
        return;
      } catch (error) {
        if (i === retries - 1) {
          throw error;
        }
      }
    }
  }

  /**
   * 添加执行日志
   */
  private addLog(taskId: string, log: ScheduledTaskExecutionLog): void {
    if (!this.executionLogs.has(taskId)) {
      this.executionLogs.set(taskId, []);
    }
    const logs = this.executionLogs.get(taskId)!;
    logs.unshift(log);
    
    if (logs.length > 100) {
      logs.pop();
    }
  }

  /**
   * 获取执行日志
   */
  getExecutionLogs(taskId: string): ScheduledTaskExecutionLog[] {
    return this.executionLogs.get(taskId) || [];
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): ScheduledTaskConfig[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): ScheduledTaskConfig | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 更新任务状态
   */
  updateTaskStatus(taskId: string, enabled: boolean): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.enabled = enabled;
      task.updatedAt = new Date().toISOString();
      
      if (enabled) {
        this.scheduleTask(task);
      } else {
        this.unscheduleTask(taskId);
      }
    }
  }

  /**
   * 立即执行任务
   */
  async executeTaskNow(taskId: string): Promise<TaskExecutionResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }
    return this.executeTask(task);
  }

  /**
   * 初始化所有任务
   */
  initializeTasks(tasks: ScheduledTaskConfig[]): void {
    tasks.forEach(task => {
      this.tasks.set(task.id, task);
      if (task.enabled) {
        this.scheduleTask(task);
      }
    });
    console.log(`初始化了 ${tasks.length} 个定时任务`);
  }

  /**
   * 销毁引擎
   */
  destroy(): void {
    this.intervals.forEach(timeout => clearTimeout(timeout));
    this.intervals.clear();
    this.tasks.clear();
    this.executionLogs.clear();
  }
}

export const scheduledTaskEngine = ScheduledTaskEngine.getInstance();

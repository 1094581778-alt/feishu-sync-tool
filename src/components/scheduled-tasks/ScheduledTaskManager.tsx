"use client";

import { useState } from "react";
import { ScheduledTaskConfig, ScheduledTaskExecutionLog } from "@/types/scheduled-task";
import { useScheduledTaskManager } from "@/hooks/useScheduledTaskManager";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface ScheduledTaskManagerProps {
  onEditTask: (task: ScheduledTaskConfig) => void;
}

export function ScheduledTaskManager({ onEditTask }: ScheduledTaskManagerProps) {
  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [selectedTaskLogs, setSelectedTaskLogs] = useState<{
    taskId: string;
    taskName: string;
    logs: ScheduledTaskExecutionLog[];
  } | null>(null);

  const {
    tasks,
    loading,
    toggleTask,
    deleteTask,
    executeTaskNow,
    getTaskLogs,
    getNextRunTime,
    getTaskStats,
  } = useScheduledTaskManager();

  const handleViewLogs = (task: ScheduledTaskConfig) => {
    const logs = getTaskLogs(task.id);
    setSelectedTaskLogs({
      taskId: task.id,
      taskName: task.name,
      logs,
    });
    setShowLogsDialog(true);
  };

  const handleExecuteNow = async (task: ScheduledTaskConfig) => {
    if (!confirm(`确定要立即执行任务"${task.name}"吗？`)) {
      return;
    }

    try {
      await executeTaskNow(task.id);
      alert("任务执行成功！");
    } catch (error) {
      alert(`任务执行失败：${error instanceof Error ? error.message : "未知错误"}`);
    }
  };

  const getStatusBadge = (task: ScheduledTaskConfig) => {
    if (!task.enabled) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Pause className="h-3 w-3" />
          已暂停
        </Badge>
      );
    }

    switch (task.lastRunStatus) {
      case "success":
        return (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <CheckCircle className="h-3 w-3" />
            成功
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="outline" className="gap-1 text-red-600 border-red-600">
            <XCircle className="h-3 w-3" />
            失败
          </Badge>
        );
      case "running":
        return (
          <Badge variant="outline" className="gap-1 text-blue-600 border-blue-600">
            <Activity className="h-3 w-3 animate-pulse" />
            运行中
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            等待执行
          </Badge>
        );
    }
  };

  const stats = getTaskStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[#F7F8FA] rounded-lg">
            <div className="text-xs text-gray-600 mb-1">总任务数</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="p-4 bg-[#ECF5FF] rounded-lg">
            <div className="text-xs text-[#007DFF] mb-1">运行中</div>
            <div className="text-2xl font-bold text-[#007DFF]">{stats.enabled}</div>
          </div>
          <div className="p-4 bg-[#F7F8FA] rounded-lg">
            <div className="text-xs text-gray-600 mb-1">已暂停</div>
            <div className="text-2xl font-bold text-gray-900">{stats.disabled}</div>
          </div>
        </div>

        {/* 任务列表 */}
        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">暂无定时任务</p>
            <p className="text-gray-400 text-xs mt-2">
              在模板列表中点击定时任务图标创建新任务
            </p>
          </div>
        ) : (
          <div className="border border-[#E5E6EB] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F7F8FA]">
                  <TableHead className="w-[200px]">任务名称</TableHead>
                  <TableHead>触发模式</TableHead>
                  <TableHead>下次执行</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>上次运行</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-[#F7F8FA]">
                    <TableCell>
                      <div>
                        <div className="font-medium text-sm">{task.name}</div>
                        <div className="text-xs text-gray-500">{task.templateName}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.triggerMode === "cron" ? (
                        <Badge variant="outline" className="font-mono text-xs">
                          {task.cronExpression}
                        </Badge>
                      ) : (
                        <div className="text-sm">
                          {task.fixedTimeConfig?.period === "daily" && "每天"}
                          {task.fixedTimeConfig?.period === "weekly" && "每周"}
                          {task.fixedTimeConfig?.period === "monthly" && "每月"}
                          {" "}
                          {task.fixedTimeConfig?.time}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {getNextRunTime(task)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(task)}</TableCell>
                    <TableCell>
                      {task.lastRunAt ? (
                        <div className="text-xs text-gray-500">
                          {format(new Date(task.lastRunAt), "MM-dd HH:mm")}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">未执行</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleExecuteNow(task)}
                          className="h-7 w-7 p-0"
                          title="立即执行"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTask(task.id)}
                          className="h-7 w-7 p-0"
                          title={task.enabled ? "暂停任务" : "启用任务"}
                        >
                          {task.enabled ? (
                            <Pause className="h-3.5 w-3.5" />
                          ) : (
                            <Play className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTask(task)}
                          className="h-7 w-7 p-0"
                          title="编辑任务"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewLogs(task)}
                          className="h-7 w-7 p-0"
                          title="查看日志"
                        >
                          <Activity className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`确定要删除任务"${task.name}"吗？`)) {
                              deleteTask(task.id);
                            }
                          }}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                          title="删除任务"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 日志对话框 */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              任务执行日志 - {selectedTaskLogs?.taskName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto mt-4">
            {selectedTaskLogs?.logs && selectedTaskLogs.logs.length > 0 ? (
              <div className="space-y-3">
                {selectedTaskLogs.logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-lg border ${
                      log.status === "success"
                        ? "bg-[#F6FFED] border-[#B7EB8F]"
                        : log.status === "failed"
                        ? "bg-[#FFF1F0] border-[#FFA39E]"
                        : "bg-[#F7F8FA] border-[#E5E6EB]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : log.status === "failed" ? (
                          <XCircle className="h-4 w-4 text-red-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-sm font-medium">
                          {log.status === "success"
                            ? "执行成功"
                            : log.status === "failed"
                            ? "执行失败"
                            : "执行中"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(log.startTime), "yyyy-MM-dd HH:mm:ss")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{log.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>处理文件：{log.filesProcessed} 个</span>
                      <span>同步数据：{log.rowsSynced} 行</span>
                      {log.endTime && (
                        <span>
                          耗时：{Math.round((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000)}秒
                        </span>
                      )}
                    </div>
                    {log.errorDetails && (
                      <div className="mt-2 p-2 bg-white rounded border border-red-200">
                        <pre className="text-xs text-red-600 whitespace-pre-wrap">
                          {log.errorDetails}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-sm">
                暂无执行日志
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

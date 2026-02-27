"use client";

import { useState, useEffect } from "react";
import { HistoryTemplate } from "@/types/template";
import {
  ScheduledTaskConfig,
  FileFilterConfig as FileFilterConfigType,
  FileInfo,
  TriggerMode,
} from '@/types/scheduled-task';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  Calendar,
  Settings,
  Save,
  X,
  Plus,
  Trash2,
  FolderOpen,
  Zap,
} from "lucide-react";
import { FilePreviewWindow } from "./FilePreviewWindow";
import { FileFilterConfig } from "./FileFilterConfig";
import { FileScanner } from "@/services/file-scanner";

interface ScheduledTaskConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: HistoryTemplate;
  existingTask?: ScheduledTaskConfig;
  onSave: (task: ScheduledTaskConfig) => void;
}

const defaultFileFilter: FileFilterConfigType = {
  fileName: {
    mode: "fuzzy",
    pattern: "",
  },
  time: {
    quickOption: "today",
    startTime: "",
    endTime: "",
  },
};

export function ScheduledTaskConfigDialog({
  open,
  onOpenChange,
  template,
  existingTask,
  onSave,
}: ScheduledTaskConfigDialogProps) {
  const [task, setTask] = useState<ScheduledTaskConfig>(() => {
    if (existingTask) {
      return existingTask;
    }
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    return {
      id: crypto.randomUUID(),
      templateId: template.id,
      templateName: template.name,
      enabled: true,
      name: `${template.name} - 定时同步`,
      triggerMode: "fixed_time",
      fixedTimeConfig: {
        time: "14:30",
        period: "daily",
      },
      paths: template.filePath ? [template.filePath] : [],
      fileFilter: {
        ...defaultFileFilter,
        time: {
          quickOption: "today",
          startTime: todayStart.toISOString().slice(0, 16),
          endTime: todayEnd.toISOString().slice(0, 16),
        },
      },
      validateBeforeTrigger: true,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  const [newPath, setNewPath] = useState("");
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [allFiles, setAllFiles] = useState<FileInfo[]>([]);
  const [activeTab, setActiveTab] = useState("basic");

  useEffect(() => {
    if (existingTask) {
      setTask(existingTask);
    } else {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      setTask({
        id: crypto.randomUUID(),
        templateId: template.id,
        templateName: template.name,
        enabled: true,
        name: `${template.name} - 定时同步`,
        triggerMode: "fixed_time",
        fixedTimeConfig: {
          time: "14:30",
          period: "daily",
        },
        paths: template.filePath ? [template.filePath] : [],
        fileFilter: {
          ...defaultFileFilter,
          time: {
            quickOption: "today",
            startTime: todayStart.toISOString().slice(0, 16),
            endTime: todayEnd.toISOString().slice(0, 16),
          },
        },
        validateBeforeTrigger: true,
        maxRetries: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }, [open, template, existingTask]);

  useEffect(() => {
    const loadAndFilterFiles = async () => {
      if (task.paths.length === 0) {
        setAllFiles([]);
        setFilteredFiles([]);
        return;
      }

      const allScannedFiles: FileInfo[] = [];
      for (const path of task.paths) {
        const result = await FileScanner.scanPath(path);
        if (result.success) {
          allScannedFiles.push(...result.files);
        }
      }

      setAllFiles(allScannedFiles);
      const filtered = FileScanner.filterFiles(allScannedFiles, task.fileFilter);
      setFilteredFiles(filtered);
    };

    loadAndFilterFiles();
  }, [task.paths, task.fileFilter]);

  const handleSave = () => {
    onSave({
      ...task,
      updatedAt: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  const addPath = () => {
    if (newPath && !task.paths.includes(newPath)) {
      setTask({
        ...task,
        paths: [...task.paths, newPath],
      });
      setNewPath("");
    }
  };

  const removePath = (pathToRemove: string) => {
    setTask({
      ...task,
      paths: task.paths.filter((p) => p !== pathToRemove),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#E5E6EB]">
          <div>
            <DialogTitle className="text-base font-medium flex items-center gap-2">
              <Settings className="h-5 w-5 text-[#007DFF]" />
              {existingTask ? "编辑定时任务" : "新建定时任务"}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 mt-1">
              为模版「{template.name}」配置自动同步任务
            </DialogDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                checked={task.enabled}
                onCheckedChange={(checked) =>
                  setTask({ ...task, enabled: checked })
                }
              />
              <Label className="text-sm text-gray-700">启用任务</Label>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="mx-6 mt-4 bg-[#F7F8FA] p-1 rounded-lg">
            <TabsTrigger value="basic" className="text-xs">
              基础设置
            </TabsTrigger>
            <TabsTrigger value="filter" className="text-xs">
              文件筛选
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs">
              文件预览
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="basic" className="mt-0 space-y-6">
              <Card className="border-0 rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-[#007DFF]" />
                    任务基本信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-700">任务名称</Label>
                    <Input
                      value={task.name}
                      onChange={(e) => setTask({ ...task, name: e.target.value })}
                      className="h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg text-sm"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#007DFF]" />
                    定时触发设置
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <RadioGroup
                    value={task.triggerMode}
                    onValueChange={(value: TriggerMode) =>
                      setTask({ ...task, triggerMode: value })
                    }
                    className="space-y-4"
                  >
                    <div className="flex items-start space-x-3 p-4 border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors">
                      <RadioGroupItem value="fixed_time" id="fixed_time" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="fixed_time" className="text-sm font-medium text-gray-900 cursor-pointer">
                          固定时间点
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">设置每天/每周/每月的具体时间触发</p>

                        {task.triggerMode === "fixed_time" && (
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-600">周期</Label>
                              <Select
                                value={task.fixedTimeConfig?.period || "daily"}
                                onValueChange={(value: "daily" | "weekly" | "monthly") =>
                                  setTask({
                                    ...task,
                                    fixedTimeConfig: {
                                      ...task.fixedTimeConfig!,
                                      period: value,
                                    },
                                  })
                                }
                              >
                                <SelectTrigger className="h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">每天</SelectItem>
                                  <SelectItem value="weekly">每周</SelectItem>
                                  <SelectItem value="monthly">每月</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-gray-600">时间</Label>
                              <Input
                                type="time"
                                value={task.fixedTimeConfig?.time || "14:30"}
                                onChange={(e) =>
                                  setTask({
                                    ...task,
                                    fixedTimeConfig: {
                                      ...task.fixedTimeConfig!,
                                      time: e.target.value,
                                    },
                                  })
                                }
                                className="h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border border-[#E5E6EB] rounded-lg hover:bg-[#F7F8FA] transition-colors">
                      <RadioGroupItem value="cron" id="cron" className="mt-1" />
                      <div className="flex-1">
                        <Label htmlFor="cron" className="text-sm font-medium text-gray-900 cursor-pointer">
                          Cron 表达式
                        </Label>
                        <p className="text-xs text-gray-500 mt-1">使用 Cron 表达式配置复杂周期</p>

                        {task.triggerMode === "cron" && (
                          <div className="mt-4 space-y-2">
                            <Input
                              value={task.cronExpression || ""}
                              onChange={(e) =>
                                setTask({ ...task, cronExpression: e.target.value })
                              }
                              placeholder="例如：0 30 14 * * *"
                              className="h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg text-sm font-mono"
                            />
                            <p className="text-xs text-gray-500">
                              示例：0 30 14 * * * 表示每天 14:30 触发
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>

                  <div className="flex items-center gap-3 pt-2">
                    <Switch
                      checked={task.validateBeforeTrigger}
                      onCheckedChange={(checked) =>
                        setTask({ ...task, validateBeforeTrigger: checked })
                      }
                    />
                    <Label className="text-sm text-gray-700">
                      触发前校验文件（无符合文件则终止任务）
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 rounded-xl shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-[#007DFF]" />
                    文件路径配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                      placeholder="输入文件路径（如：D:/数据文件）"
                      className="h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg text-sm"
                      onKeyDown={(e) => e.key === "Enter" && addPath()}
                    />
                    <Button
                      onClick={addPath}
                      className="h-9 bg-[#007DFF] hover:bg-[#0066CC] text-white rounded-lg text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      添加
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {task.paths.map((path, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-[#F7F8FA] rounded-lg"
                      >
                        <FolderOpen className="h-4 w-4 text-gray-500 flex-shrink-0" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{path}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePath(path)}
                          className="h-7 w-7 p-0 text-gray-500 hover:text-[#F53F3F] hover:bg-[#FFF1F0]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {task.paths.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-4">
                        暂无配置的文件路径
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="filter" className="mt-0">
              <FileFilterConfig
                value={task.fileFilter}
                onChange={(filter: FileFilterConfigType) => setTask({ ...task, fileFilter: filter })}
              />
            </TabsContent>

            <TabsContent value="preview" className="mt-0">
              <Card className="border-0 rounded-xl shadow-sm mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-[#007DFF]" />
                      <span className="text-sm font-medium text-gray-900">
                        匹配结果
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      filteredFiles.length > 0
                        ? "bg-[#ECF5FF] text-[#007DFF]"
                        : "bg-[#F7F8FA] text-gray-600"
                    }`}>
                      共 {filteredFiles.length} 个匹配文件
                    </span>
                  </div>
                </CardContent>
              </Card>
              <FilePreviewWindow
                paths={task.paths}
                selectedFiles={filteredFiles}
              />
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="flex items-center justify-between gap-3 pt-4 border-t border-[#E5E6EB]">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-9 px-4 text-sm text-gray-700 hover:bg-[#F7F8FA] rounded-lg"
          >
            <X className="h-4 w-4 mr-1" />
            取消
          </Button>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              className="h-9 px-4 bg-[#007DFF] hover:bg-[#0066CC] text-white rounded-lg text-sm"
            >
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

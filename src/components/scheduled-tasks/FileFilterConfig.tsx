"use client";

import { useState, useEffect } from "react";
import { FileFilterConfig as FileFilterConfigType } from "@/types/scheduled-task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Calendar, FileSearch } from "lucide-react";

interface FileFilterConfigProps {
  value: FileFilterConfigType;
  onChange: (config: FileFilterConfigType) => void;
}

export function FileFilterConfig({ value, onChange }: FileFilterConfigProps) {
  const [localConfig, setLocalConfig] = useState<FileFilterConfigType>(value);

  useEffect(() => {
    setLocalConfig(value);
  }, [value]);

  const updateConfig = (updates: Partial<FileFilterConfigType>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onChange(newConfig);
  };

  const updateFileNameFilter = (updates: Partial<FileFilterConfigType["fileName"]>) => {
    updateConfig({
      fileName: {
        ...localConfig.fileName,
        ...updates,
      },
    });
  };

  const updateTimeFilter = (updates: Partial<FileFilterConfigType["time"]>) => {
    updateConfig({
      time: {
        ...localConfig.time,
        ...updates,
      },
    });
  };

  const getTodayRange = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return {
      start: start.toISOString().slice(0, 16),
      end: end.toISOString().slice(0, 16),
    };
  };

  const handleQuickOptionChange = (option: FileFilterConfigType["time"]["quickOption"]) => {
    const updates: Partial<FileFilterConfigType["time"]> = { quickOption: option };

    if (option === "today") {
      const range = getTodayRange();
      updates.startTime = range.start;
      updates.endTime = range.end;
    } else if (option === "custom") {
      const range = getTodayRange();
      updates.startTime = range.start;
      updates.endTime = range.end;
    }

    updateTimeFilter(updates);
  };

  return (
    <Card className="border-0 rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#007DFF]" />
          文件筛选规则
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <FileSearch className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium text-gray-900">
              文件名筛选
            </Label>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-600">
                {localConfig.fileName.mode === "exact" ? "精准匹配" : "模糊匹配"}
              </span>
              <Switch
                checked={localConfig.fileName.mode === "fuzzy"}
                onCheckedChange={(checked) =>
                  updateFileNameFilter({ mode: checked ? "fuzzy" : "exact" })
                }
              />
            </div>
          </div>
          <Input
            type="text"
            placeholder={
              localConfig.fileName.mode === "exact"
                ? "输入完整文件名（如：成交数据-2026_02_19.xlsx）"
                : "输入关键词（如：成交数据*）"
            }
            value={localConfig.fileName.pattern}
            onChange={(e) => updateFileNameFilter({ pattern: e.target.value })}
            className="h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg text-sm"
          />
          <p className="text-xs text-gray-500">
            {localConfig.fileName.mode === "fuzzy"
              ? "使用 * 作为通配符，如：成交数据* 将匹配所有以“成交数据”开头的文件"
              : "需要输入完整的文件名才能匹配"}
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-500" />
            <Label className="text-sm font-medium text-gray-900">
              时间筛选
            </Label>
          </div>
          <RadioGroup
            value={localConfig.time.quickOption}
            onValueChange={handleQuickOptionChange as (value: string) => void}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="today" id="today" />
              <Label htmlFor="today" className="text-xs text-gray-700 cursor-pointer">
                今天
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="yesterday" id="yesterday" />
              <Label htmlFor="yesterday" className="text-xs text-gray-700 cursor-pointer">
                昨天
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="this_week" id="this_week" />
              <Label htmlFor="this_week" className="text-xs text-gray-700 cursor-pointer">
                本周
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="custom" id="custom" />
              <Label htmlFor="custom" className="text-xs text-gray-700 cursor-pointer">
                自定义
              </Label>
            </div>
          </RadioGroup>

          {localConfig.time.quickOption === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">开始时间</Label>
                <Input
                  type="datetime-local"
                  value={localConfig.time.startTime}
                  onChange={(e) => updateTimeFilter({ startTime: e.target.value })}
                  className="h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-gray-600">结束时间</Label>
                <Input
                  type="datetime-local"
                  value={localConfig.time.endTime}
                  onChange={(e) => updateTimeFilter({ endTime: e.target.value })}
                  className="h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

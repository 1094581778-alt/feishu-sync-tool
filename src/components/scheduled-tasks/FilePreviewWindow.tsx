"use client";

import { useState, useEffect, useCallback } from "react";
import { FileInfo } from "@/types/scheduled-task";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  Search,
  FileSpreadsheet,
  File,
  AlertCircle,
  Info,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import { FileScanner } from "@/services/file-scanner";

interface FilePreviewWindowProps {
  paths: string[];
  onFileSelect?: (file: FileInfo) => void;
  selectedFiles?: FileInfo[];
}

export function FilePreviewWindow({
  paths,
  onFileSelect,
  selectedFiles = [],
}: FilePreviewWindowProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "size">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
  };

  const loadFiles = useCallback(async () => {
    if (paths.length === 0) {
      setFiles([]);
      setFilteredFiles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const allFiles: FileInfo[] = [];
      for (const path of paths) {
        const result = await FileScanner.scanPath(path);
        if (result.success) {
          allFiles.push(...result.files);
        } else {
          setError(result.error || "路径扫描失败");
        }
      }

      setFiles(allFiles);
      setFilteredFiles(allFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载文件失败");
    } finally {
      setLoading(false);
    }
  }, [paths]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    let result = [...files];

    if (searchQuery) {
      result = FileScanner.searchFiles(result, searchQuery);
    }

    result = FileScanner.sortFiles(result, sortBy, sortOrder);

    setFilteredFiles(result);
  }, [files, searchQuery, sortBy, sortOrder]);

  const toggleSort = (field: "name" | "createdAt" | "size") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const isSelected = (file: FileInfo) => {
    return selectedFiles.some((f) => f.path === file.path);
  };

  if (paths.length === 0) {
    return (
      <Card className="border-0 rounded-xl shadow-sm">
        <CardContent className="p-8 text-center">
          <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-sm text-gray-500">
            请先配置文件路径
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[#007DFF]" />
            文件预览
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="搜索文件名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs h-9 bg-[#F7F8FA] border-[#E5E6EB] rounded-lg"
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadFiles}
              disabled={loading}
              className="h-9 px-3 text-xs text-gray-700 hover:bg-[#F7F8FA] rounded-lg"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              刷新
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="mb-4 p-3 bg-[#FFF1F0] rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#F53F3F]" />
            <span className="text-xs text-[#F53F3F]">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#007DFF]" />
            <p className="text-xs text-gray-500">正在加载文件列表...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-8 text-center">
            <Info className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-500">
              {searchQuery
                ? "未找到匹配的文件"
                : "当前路径下暂无文件"}
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[#E5E6EB] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#F7F8FA]">
                <TableRow className="hover:bg-[#F7F8FA]">
                  <TableHead className="h-9 text-xs font-medium text-gray-700">
                    <button
                      onClick={() => toggleSort("name")}
                      className="flex items-center gap-1 hover:text-[#007DFF]"
                    >
                      文件名
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="h-9 text-xs font-medium text-gray-700">
                    <button
                      onClick={() => toggleSort("createdAt")}
                      className="flex items-center gap-1 hover:text-[#007DFF]"
                    >
                      创建时间
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="h-9 text-xs font-medium text-gray-700">
                    <button
                      onClick={() => toggleSort("size")}
                      className="flex items-center gap-1 hover:text-[#007DFF]"
                    >
                      文件大小
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="h-9 text-xs font-medium text-gray-700">
                    文件格式
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow
                    key={file.path}
                    onClick={() => onFileSelect?.(file)}
                    className={`
                      h-9 cursor-pointer transition-colors
                      ${file.isExcel ? "hover:bg-[#ECF5FF]" : "hover:bg-[#F7F8FA]"}
                      ${isSelected(file) ? "bg-[#ECF5FF]" : ""}
                    `}
                  >
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        {file.isExcel ? (
                          <FileSpreadsheet className="h-4 w-4 text-[#007DFF]" />
                        ) : (
                          <File className="h-4 w-4 text-gray-500" />
                        )}
                        <span className={`text-xs truncate max-w-[250px ${
                          file.isExcel ? "font-medium text-gray-900" : "text-gray-700"
                        }`}>
                          {file.name}
                        </span>
                      </div>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-gray-600">
                      {new Date(file.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                      <TableCell className="py-2 text-xs text-gray-600">
                      {formatFileSize(file.size)}
                    </TableCell>
                      <TableCell className="py-2">
                      <span className={`
                        text-xs px-2 py-0.5 rounded-md
                        ${file.isExcel
                          ? "bg-[#ECF5FF] text-[#007DFF]"
                          : "bg-[#F7F8FA] text-gray-600"
                        }
                      `}>
                        .{file.extension}
                      </span>
                    </TableCell>
                      </TableRow>
                ))}
              </TableBody>
              </Table>
          </div>
        )}

        {!loading && filteredFiles.length > 0 && (
          <div className="mt-3 text-xs text-gray-500">
            共 {filteredFiles.length} 个文件
            {searchQuery && `，匹配 ${filteredFiles.length} 个`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

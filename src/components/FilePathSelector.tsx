import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Folder, File as FileIcon, Filter, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns/format';
import { 
  fileSystemService, 
  environment, 
  FileSystemEntry,
  filterFiles as fsFilterFiles,
  formatFileSize 
} from '@/services/file-system';

// 兼容类型
interface FileInfo {
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

// 转换 FileSystemEntry 到 FileInfo
function convertToFileInfo(entry: FileSystemEntry): FileInfo {
  return {
    name: entry.name,
    path: entry.path,
    size: entry.size,
    createdAt: entry.createdAt,
    modifiedAt: entry.modifiedAt,
    isDirectory: entry.isDirectory
  };
}

interface FilePathSelectorProps {
  templateId: string;
  filePath?: string;
  onFileSelect: (file: File) => void;
  onPathChange?: (path: string) => void;
  onFilePathChange?: (path: string) => void;
}

export function FilePathSelector({ templateId, filePath: initialFilePath, onFileSelect, onPathChange, onFilePathChange }: FilePathSelectorProps) {
  const [filePath, setFilePath] = useState(initialFilePath || '');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [showFileList, setShowFileList] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: new Date(), end: new Date() });
  const [customTimeRange, setCustomTimeRange] = useState({ start: '00:00', end: '23:59' });
  const [filterType, setFilterType] = useState<'created' | 'modified'>('modified');
  const [pathPattern, setPathPattern] = useState('');

  // 验证文件路径
  const validatePath = (inputPath: string): boolean => {
    if (inputPath.length === 0) {
      return false;
    }

    // 检查路径格式 - 支持 Windows 路径格式
    const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
    const unixPathRegex = /^\/(?:[^\/:*?"<>|\r\n]+\/)*[^\/:*?"<>|\r\n]*$/;

    return windowsPathRegex.test(inputPath) || unixPathRegex.test(inputPath);
  };

  // 加载文件列表
  const loadFiles = async () => {
    if (!validatePath(filePath)) {
      setError('请输入有效的文件路径，例如：C:\\Users\\Documents\\Excel文件');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📁 [FilePathSelector] 加载文件列表:', filePath);
      console.log('🌐 当前环境:', environment.getDescription());

      // 检查文件系统服务是否可用
      if (!fileSystemService.isAvailable()) {
        throw new Error('文件系统服务不可用。当前环境：' + environment.getDescription());
      }

      // 检查路径是否存在
      const pathExists = await fileSystemService.exists(filePath);
      if (!pathExists) {
        throw new Error(`路径不存在: ${filePath}`);
      }

      // 列出目录内容
      const entries = await fileSystemService.listDirectory(filePath);
      const fileInfos = entries.map(convertToFileInfo);
      
      console.log('✅ [FilePathSelector] 加载完成，找到文件:', fileInfos.length);
      setFiles(fileInfos);
      setShowFileList(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载文件列表失败';
      
      // 在浏览器环境中提供更友好的错误信息
      if (!environment.isTauri && errorMessage.includes('不支持')) {
        setError('浏览器环境不支持直接列出目录内容。请使用Tauri桌面应用以获得完整功能。');
      } else {
        setError(`加载文件列表失败: ${errorMessage}`);
      }
      
      console.error('❌ [FilePathSelector] 加载失败:', err);
      
      // 在错误时也显示文件列表（可能是空的）
      setShowFileList(true);
    } finally {
      setLoading(false);
    }
  };

  // 筛选文件
  const filteredFiles = files.filter(file => {
    // 只显示Excel文件
    if (!file.isDirectory && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return false;
    }

    // 路径匹配筛选
    if (pathPattern) {
      const pattern = new RegExp(pathPattern, 'i');
      if (!pattern.test(file.name)) {
        return false;
      }
    }

    // 时间筛选
    const dateToCheck = filterType === 'created' ? file.createdAt : file.modifiedAt;
    const now = new Date();

    let dateMatch = true;
    switch (timeFilter) {
      case 'today':
        dateMatch = dateToCheck.toDateString() === now.toDateString();
        break;
      case 'yesterday':
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        dateMatch = dateToCheck.toDateString() === yesterday.toDateString();
        break;
      case 'thisWeek':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        dateMatch = dateToCheck >= weekStart;
        break;
      case 'thisMonth':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateMatch = dateToCheck >= monthStart;
        break;
      case 'custom':
        // 结合日期和时间范围
        const startDateTime = new Date(customDateRange.start);
        const [startHour, startMinute] = customTimeRange.start.split(':').map(Number);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        const endDateTime = new Date(customDateRange.end);
        const [endHour, endMinute] = customTimeRange.end.split(':').map(Number);
        endDateTime.setHours(endHour, endMinute, 59, 999);

        dateMatch = dateToCheck >= startDateTime && dateToCheck <= endDateTime;
        break;
      default:
        dateMatch = true;
    }

    return dateMatch;
  });

  // 处理文件选择
  const handleFileSelect = async (file: FileInfo) => {
    if (file.isDirectory) {
      // 如果是目录，进入该目录
      setFilePath(file.path);
      loadFiles();
      return;
    }

    try {
      console.log('📄 [FilePathSelector] 选择文件:', file.name, file.path);
      
      if (environment.isTauri) {
        // Tauri环境：读取实际文件内容
        const fileContent = await fileSystemService.readFile(file.path, { asArrayBuffer: true });
        const blob = new Blob([fileContent]);
        const nativeFile = new File([blob], file.name, {
          type: getMimeType(file.name)
        });
        
        onFileSelect(nativeFile);
      } else {
        // 浏览器环境：使用文件选择器
        const selected = await fileSystemService.openFileDialog({
          multiple: false,
          filters: [
            {
              name: 'Excel文件',
              extensions: ['xlsx', 'xls']
            }
          ]
        });
        
        if (selected && typeof selected === 'string') {
          const mockFile = new File([''], file.name, { 
            type: getMimeType(file.name),
            lastModified: file.modifiedAt.getTime()
          });
          onFileSelect(mockFile);
        } else {
          return;
        }
      }
      
      setSelectedFile(file.name);
      setError('');
      console.log('✅ [FilePathSelector] 文件选择成功:', file.name);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '选择文件失败';
      setError(`选择文件失败: ${errorMessage}`);
      console.error('❌ [FilePathSelector] 选择文件失败:', err);
    }
  };
  
  // 获取文件的MIME类型
  const getMimeType = (fileName: string): string => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      default:
        return 'application/octet-stream';
    }
  };

  // 处理路径变化
  const handlePathChange = (inputPath: string) => {
    setFilePath(inputPath);
    onPathChange?.(inputPath);
    onFilePathChange?.(inputPath);
  };

  // 自动加载文件列表 - 使用 debounce 效果
  useEffect(() => {
    if (filePath && validatePath(filePath) && environment.isTauri) {
      const timer = setTimeout(() => {
        loadFiles();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [filePath]);

  // 浏览器环境的文件选择处理
  const handleBrowserFileSelect = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx,.xls';
      
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files && files.length > 0) {
          const file = files[0];
          onFileSelect(file);
          setSelectedFile(file.name);
          // 在浏览器环境中，设置一个模拟路径（包含文件名）
          const mockPath = `选择文件：${file.name}`;
          setFilePath(mockPath);
          onFilePathChange?.(mockPath);
          setError('');
        }
      };
      
      input.click();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '选择文件失败';
      setError(`选择文件失败: ${errorMessage}`);
    }
  };


  return (
    <div className="space-y-2">
      {/* 文件路径输入区域 - 仅在 Tauri 环境显示 */}
      {environment.isTauri ? (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="输入文件路径..."
            value={filePath}
            onChange={(e) => handlePathChange(e.target.value)}
            className="flex-1 text-xs"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadFiles}
            disabled={loading}
            className="text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                加载中...
              </>
            ) : (
              <>
                <FileIcon className="h-3.5 w-3.5 mr-1" />
                加载文件
              </>
            )}
          </Button>
        </div>
      ) : (
        /* 浏览器环境：直接显示文件选择按钮 */
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleBrowserFileSelect}
            className="text-xs w-full"
          >
            <FileIcon className="h-3.5 w-3.5 mr-1" />
            选择 Excel 文件
          </Button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="p-2 bg-gray-200 dark:bg-gray-800 rounded-xl">
          <p className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <X className="h-3 w-3" />
            {error}
          </p>
        </div>
      )}

      {/* 筛选器 - 仅在 Tauri 环境显示 */}
      {showFileList && environment.isTauri && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* 路径匹配筛选 */}
          <div className="relative w-full sm:w-auto flex-1">
            <Input
              type="text"
              placeholder="文件名匹配..."
              value={pathPattern}
              onChange={(e) => setPathPattern(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {/* 时间筛选 */}
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as any)}>
            <SelectTrigger className="w-[120px] h-7">
              <SelectValue placeholder="时间筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部时间</SelectItem>
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="yesterday">昨天</SelectItem>
              <SelectItem value="thisWeek">本周</SelectItem>
              <SelectItem value="thisMonth">本月</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>

          {/* 时间范围选择（仅自定义时显示） */}
          {timeFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <Input
                type="time"
                value={customTimeRange.start}
                onChange={(e) => setCustomTimeRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-[80px] h-7 text-xs"
              />
              <span>至</span>
              <Input
                type="time"
                value={customTimeRange.end}
                onChange={(e) => setCustomTimeRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-[80px] h-7 text-xs"
              />
            </div>
          )}

          <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
            <SelectTrigger className="w-[100px] h-7">
              <SelectValue placeholder="筛选类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modified">修改时间</SelectItem>
              <SelectItem value="created">创建时间</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 文件列表 - 仅在 Tauri 环境显示 */}
      {showFileList && environment.isTauri && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border-0 shadow-md hover:shadow-lg transition-all duration-300 p-2 max-h-60 overflow-y-auto">
          <div className="space-y-1">
            {filteredFiles.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                没有找到文件
              </p>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.path}
                  className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${selectedFile === file.name ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="flex items-center gap-2 flex-1">
                    {file.isDirectory ? (
                      <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <FileIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                    <span className="text-xs font-medium truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    {!file.isDirectory && (
                      <span>{(file.size / 1024).toFixed(1)} KB</span>
                    )}
                    <span>{format(filterType === 'created' ? file.createdAt : file.modifiedAt, 'yyyy-MM-dd')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 选择结果 */}
      {selectedFile && (
        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center gap-1">
            <Check className="h-3 w-3" />
            已选择文件: {selectedFile}
          </p>
        </div>
      )}
    </div>
  );
}
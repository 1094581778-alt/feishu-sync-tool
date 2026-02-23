import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Folder, File as FileIcon, Filter, Loader2, X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
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
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'thisWeek' | 'thisMonth' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: new Date(), end: new Date() });
  const [filterType, setFilterType] = useState<'created' | 'modified'>('modified');

  // 验证文件路径
  const validatePath = (path: string): boolean => {
    if (path.length === 0) {
      return false;
    }

    // 检查路径格式
    const windowsPathRegex = /^[a-zA-Z]:\\(?:[^\\/:*?"<>|\r\n]+\\)*[^\\/:*?"<>|\r\n]*$/;
    const unixPathRegex = /^\/(?:[^\/:*?"<>|\r\n]+\/)*[^\/:*?"<>|\r\n]*$/;

    return windowsPathRegex.test(path) || unixPathRegex.test(path);
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
      // 这里应该使用 Tauri 的文件系统 API 来读取文件列表
      // 由于是模拟环境，我们创建一些模拟数据
      const mockFiles: FileInfo[] = [
        {
          name: '成交数据-2026_02_23.xlsx',
          path: `${filePath}/成交数据-2026_02_23.xlsx`,
          size: 105600,
          createdAt: new Date('2026-02-23T10:00:00'),
          modifiedAt: new Date('2026-02-23T10:00:00'),
          isDirectory: false
        },
        {
          name: '成交数据-2026_02_22.xlsx',
          path: `${filePath}/成交数据-2026_02_22.xlsx`,
          size: 102400,
          createdAt: new Date('2026-02-22T10:00:00'),
          modifiedAt: new Date('2026-02-22T10:00:00'),
          isDirectory: false
        },
        {
          name: '成交数据-2026_02_21.xlsx',
          path: `${filePath}/成交数据-2026_02_21.xlsx`,
          size: 98500,
          createdAt: new Date('2026-02-21T10:00:00'),
          modifiedAt: new Date('2026-02-21T10:00:00'),
          isDirectory: false
        },
        {
          name: '历史数据',
          path: `${filePath}/历史数据`,
          size: 0,
          createdAt: new Date('2026-02-20T10:00:00'),
          modifiedAt: new Date('2026-02-20T10:00:00'),
          isDirectory: true
        }
      ];

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      setFiles(mockFiles);
      setShowFileList(true);
    } catch (err) {
      setError('加载文件列表失败，请检查路径是否正确');
      console.error('加载文件列表失败:', err);
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

    // 时间筛选
    const dateToCheck = filterType === 'created' ? file.createdAt : file.modifiedAt;
    const now = new Date();

    switch (timeFilter) {
      case 'today':
        return dateToCheck.toDateString() === now.toDateString();
      case 'thisWeek':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return dateToCheck >= weekStart;
      case 'thisMonth':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return dateToCheck >= monthStart;
      case 'custom':
        return dateToCheck >= customDateRange.start && dateToCheck <= customDateRange.end;
      default:
        return true;
    }
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
      // 这里应该使用 Tauri 的文件系统 API 来读取文件
      // 由于是模拟环境，我们创建一个模拟文件
      const mockFile = new File([''], file.name, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      onFileSelect(mockFile);
      setSelectedFile(file.name);
      setError('');
    } catch (err) {
      setError('选择文件失败');
      console.error('选择文件失败:', err);
    }
  };

  // 处理路径变化
  const handlePathChange = (path: string) => {
    setFilePath(path);
    onPathChange?.(path);
    onFilePathChange?.(path);
  };



  return (
    <div className="space-y-2">
      {/* 文件路径输入区域 */}
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

      {/* 错误提示 */}
      {error && (
        <div className="p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-xs text-red-800 dark:text-red-200 flex items-center gap-1">
            <X className="h-3 w-3" />
            {error}
          </p>
        </div>
      )}

      {/* 时间筛选器 */}
      {showFileList && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Select value={timeFilter} onValueChange={(value) => setTimeFilter(value as any)}>
            <SelectTrigger className="w-[120px] h-7">
              <SelectValue placeholder="时间筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部时间</SelectItem>
              <SelectItem value="today">今天</SelectItem>
              <SelectItem value="thisWeek">本周</SelectItem>
              <SelectItem value="thisMonth">本月</SelectItem>
              <SelectItem value="custom">自定义</SelectItem>
            </SelectContent>
          </Select>

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

      {/* 文件列表 */}
      {showFileList && (
        <Card className="p-2 max-h-60 overflow-y-auto">
          <div className="space-y-1">
            {filteredFiles.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                没有找到文件
              </p>
            ) : (
              filteredFiles.map((file) => (
                <div
                  key={file.path}
                  className={`p-2 rounded-md flex items-center justify-between cursor-pointer transition-colors ${selectedFile === file.name ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
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
        </Card>
      )}

      {/* 选择结果 */}
      {selectedFile && (
        <div className="p-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-xs text-green-800 dark:text-green-200 flex items-center gap-1">
            <Check className="h-3 w-3" />
            已选择文件: {selectedFile}
          </p>
        </div>
      )}
    </div>
  );
}

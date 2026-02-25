/**
 * 增强版文件识别 Hook
 * 使用统一文件系统服务，支持跨环境（浏览器/Tauri）文件访问
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  fileSystemService, 
  environment,
  FileSystemEntry,
  filterFiles as fsFilterFiles,
  createFileSystemEntryFromFile
} from '@/services/file-system';

// ==================== 类型定义 ====================

/**
 * 文件识别配置
 */
export interface FileRecognitionConfig {
  /** 目录路径 */
  directory: string;
  /** 文件名模式（支持通配符 *） */
  pattern: string;
  /** 日期模式 */
  dateMode: 'today' | 'specific' | 'range' | 'all';
  /** 特定日期（dateMode='specific'时使用） */
  specificDate?: string;
  /** 日期范围开始（dateMode='range'时使用） */
  dateRangeStart?: string;
  /** 日期范围结束（dateMode='range'时使用） */
  dateRangeEnd?: string;
  /** 文件扩展名过滤器 */
  extensions?: string[];
  /** 最小文件大小（字节） */
  minSize?: number;
  /** 最大文件大小（字节） */
  maxSize?: number;
  /** 是否包含子目录 */
  recursive?: boolean;
  /** 是否排除目录 */
  excludeDirectories?: boolean;
}

/**
 * 识别结果统计
 */
export interface RecognitionStats {
  /** 扫描目录数 */
  directoriesScanned: number;
  /** 找到文件数 */
  filesFound: number;
  /** 匹配文件数 */
  filesMatched: number;
  /** 总文件大小（字节） */
  totalSize: number;
  /** 最早文件时间 */
  earliestDate?: Date;
  /** 最晚文件时间 */
  latestDate?: Date;
}

/**
 * 识别进度信息
 */
export interface RecognitionProgress {
  /** 当前状态 */
  status: 'idle' | 'scanning' | 'filtering' | 'completed' | 'error';
  /** 当前扫描的目录 */
  currentDirectory?: string;
  /** 已扫描文件数 */
  scannedFiles: number;
  /** 已匹配文件数 */
  matchedFiles: number;
  /** 进度百分比 */
  progress: number;
  /** 估计剩余时间（秒） */
  estimatedTimeRemaining?: number;
  /** 已扫描目录数 */
  directoriesScanned?: number;
}

// ==================== Hook 实现 ====================

export function useEnhancedFileRecognition() {
  const [files, setFiles] = useState<FileSystemEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<FileSystemEntry | null>(null);
  const [stats, setStats] = useState<RecognitionStats>({
    directoriesScanned: 0,
    filesFound: 0,
    filesMatched: 0,
    totalSize: 0
  });
  const [progress, setProgress] = useState<RecognitionProgress>({
    status: 'idle',
    scannedFiles: 0,
    matchedFiles: 0,
    progress: 0
  });

  /**
   * 更新进度状态
   */
  const updateProgress = useCallback((updates: Partial<RecognitionProgress>) => {
    setProgress(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 提取文件名中的日期
   */
  const extractDateFromFileName = useCallback((fileName: string): Date | null => {
    // 尝试匹配常见的日期格式
    const datePatterns = [
      // YYYY-MM-DD
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      // YYYY_MM_DD
      /(\d{4})_(\d{1,2})_(\d{1,2})/,
      // YYYYMMDD
      /(\d{4})(\d{2})(\d{2})/,
      // YY-MM-DD
      /(\d{2})-(\d{1,2})-(\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = fileName.match(pattern);
      if (match) {
        try {
          let year, month, day;
          
          if (match[0].includes('-')) {
            // YYYY-MM-DD 或 YY-MM-DD
            year = match[1].length === 4 ? parseInt(match[1]) : 2000 + parseInt(match[1]);
            month = parseInt(match[2]) - 1; // JavaScript 月份是 0-11
            day = parseInt(match[3]);
          } else if (match[0].includes('_')) {
            // YYYY_MM_DD
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            day = parseInt(match[3]);
          } else {
            // YYYYMMDD
            year = parseInt(match[1]);
            month = parseInt(match[2]) - 1;
            day = parseInt(match[3]);
          }
          
          const date = new Date(year, month, day);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } catch (err) {
          // 忽略解析错误，继续尝试下一个模式
        }
      }
    }
    
    return null;
  }, []);

  /**
   * 检查文件是否匹配配置
   */
  const isFileMatchingConfig = useCallback((file: FileSystemEntry, config: FileRecognitionConfig): boolean => {
    // 排除目录
    if (config.excludeDirectories && file.isDirectory) {
      return false;
    }

    // 扩展名过滤
    if (config.extensions && config.extensions.length > 0 && file.extension) {
      if (!config.extensions.includes(file.extension)) {
        return false;
      }
    }

    // 文件名模式匹配
    if (config.pattern) {
      const patternRegex = new RegExp(
        config.pattern
          .replace(/\*/g, '.*')  // 将 * 转换为 .*
          .replace(/\?/g, '.')   // 将 ? 转换为 .
          .replace(/\./g, '\\.') // 转义真正的点号
        , 'i'
      );
      
      if (!patternRegex.test(file.name)) {
        return false;
      }
    }

    // 文件大小过滤
    if (config.minSize !== undefined && file.size < config.minSize) {
      return false;
    }

    if (config.maxSize !== undefined && file.size > config.maxSize) {
      return false;
    }

    // 日期过滤
    if (config.dateMode !== 'all') {
      const fileDate = extractDateFromFileName(file.name) || file.modifiedAt;
      
      switch (config.dateMode) {
        case 'today': {
          const today = new Date();
          return fileDate.toDateString() === today.toDateString();
        }
        
        case 'specific': {
          if (!config.specificDate) return true;
          const targetDate = new Date(config.specificDate);
          return fileDate.toDateString() === targetDate.toDateString();
        }
        
        case 'range': {
          if (!config.dateRangeStart || !config.dateRangeEnd) return true;
          const startDate = new Date(config.dateRangeStart);
          const endDate = new Date(config.dateRangeEnd);
          endDate.setHours(23, 59, 59, 999); // 包含结束日期的全天
          return fileDate >= startDate && fileDate <= endDate;
        }
      }
    }

    return true;
  }, [extractDateFromFileName]);

  /**
   * 识别匹配的文件
   */
  const recognizeFiles = useCallback(async (config: FileRecognitionConfig): Promise<FileSystemEntry[]> => {
    setLoading(true);
    setError('');
    updateProgress({
      status: 'scanning',
      scannedFiles: 0,
      matchedFiles: 0,
      progress: 0
    });

    try {
      console.log('🔍 [增强文件识别] 开始识别文件:', config);
      console.log('🌐 当前环境:', environment.getDescription());

      // 验证目录路径
      if (!config.directory || config.directory.trim().length === 0) {
        throw new Error('文件目录不能为空');
      }

      // 检查文件系统服务是否可用
      if (!fileSystemService.isAvailable()) {
        throw new Error('文件系统服务不可用');
      }

      // 检查目录是否存在
      const exists = await fileSystemService.exists(config.directory);
      if (!exists) {
        throw new Error(`目录不存在: ${config.directory}`);
      }

      updateProgress({
        currentDirectory: config.directory,
        progress: 10
      });

      // 列出目录内容
      let allFiles: FileSystemEntry[] = [];
      
      if (config.recursive) {
        // TODO: 实现递归扫描（需要额外的工具函数）
        // 暂时只扫描当前目录
        const entries = await fileSystemService.listDirectory(config.directory);
        allFiles = entries;
        updateProgress({
          directoriesScanned: 1,
          scannedFiles: entries.length,
          progress: 50
        });
      } else {
        const entries = await fileSystemService.listDirectory(config.directory);
        allFiles = entries;
        updateProgress({
          directoriesScanned: 1,
          scannedFiles: entries.length,
          progress: 50
        });
      }

      // 过滤文件
      updateProgress({
        status: 'filtering',
        progress: 70
      });

      const matchedFiles = allFiles.filter(file => isFileMatchingConfig(file, config));

      // 计算统计信息
      let totalSize = 0;
      let earliestDate: Date | undefined;
      let latestDate: Date | undefined;

      matchedFiles.forEach(file => {
        totalSize += file.size;
        
        const fileDate = extractDateFromFileName(file.name) || file.modifiedAt;
        if (!earliestDate || fileDate < earliestDate) {
          earliestDate = fileDate;
        }
        if (!latestDate || fileDate > latestDate) {
          latestDate = fileDate;
        }
      });

      const newStats: RecognitionStats = {
        directoriesScanned: config.recursive ? 1 : 1, // TODO: 更新递归扫描时的目录数
        filesFound: allFiles.length,
        filesMatched: matchedFiles.length,
        totalSize,
        earliestDate,
        latestDate
      };

      // 按修改时间排序（最新的在前）
      const sortedFiles = matchedFiles.sort((a, b) => 
        b.modifiedAt.getTime() - a.modifiedAt.getTime()
      );

      // 更新状态
      setFiles(sortedFiles);
      setStats(newStats);
      updateProgress({
        status: 'completed',
        scannedFiles: allFiles.length,
        matchedFiles: matchedFiles.length,
        progress: 100
      });

      console.log('✅ [增强文件识别] 识别完成:', {
        扫描目录: newStats.directoriesScanned,
        找到文件: newStats.filesFound,
        匹配文件: newStats.filesMatched,
        总大小: `${(newStats.totalSize / 1024 / 1024).toFixed(2)} MB`,
        环境: environment.getDescription()
      });

      return sortedFiles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件识别失败';
      console.error('❌ [增强文件识别] 错误:', errorMessage);
      setError(errorMessage);
      updateProgress({
        status: 'error',
        progress: 0
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [updateProgress, isFileMatchingConfig, extractDateFromFileName]);

  /**
   * 快速识别今日文件
   */
  const recognizeTodayFiles = useCallback(async (directory: string, pattern: string = '*') => {
    const config: FileRecognitionConfig = {
      directory,
      pattern,
      dateMode: 'today',
      extensions: ['xlsx', 'xls'],
      excludeDirectories: true
    };
    
    return recognizeFiles(config);
  }, [recognizeFiles]);

  /**
   * 识别特定日期文件
   */
  const recognizeSpecificDateFiles = useCallback(async (directory: string, date: string, pattern: string = '*') => {
    const config: FileRecognitionConfig = {
      directory,
      pattern,
      dateMode: 'specific',
      specificDate: date,
      extensions: ['xlsx', 'xls'],
      excludeDirectories: true
    };
    
    return recognizeFiles(config);
  }, [recognizeFiles]);

  /**
   * 打开文件选择器并识别
   */
  const recognizeViaFilePicker = useCallback(async (options?: {
    multiple?: boolean;
    extensions?: string[];
  }) => {
    setLoading(true);
    setError('');

    try {
      const selected = await fileSystemService.openFileDialog({
        multiple: options?.multiple || false,
        filters: options?.extensions ? [{
          name: '选择文件',
          extensions: options.extensions
        }] : undefined
      });

      if (!selected) {
        setLoading(false);
        return [];
      }

      const filePaths = Array.isArray(selected) ? selected : [selected];
      const files: FileSystemEntry[] = [];

      for (const path of filePaths) {
        try {
          const fileInfo = await fileSystemService.getFileInfo(path);
          files.push(fileInfo);
        } catch (err) {
          console.warn('获取文件信息失败:', path, err);
        }
      }

      setFiles(files);
      setStats({
        directoriesScanned: 0,
        filesFound: files.length,
        filesMatched: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0)
      });

      return files;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件选择失败';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 打开目录选择器并识别
   */
  const recognizeViaDirectoryPicker = useCallback(async (config: Omit<FileRecognitionConfig, 'directory'>) => {
    setLoading(true);
    setError('');

    try {
      const selectedDir = await fileSystemService.openDirectoryDialog();
      
      if (!selectedDir) {
        setLoading(false);
        return [];
      }

      const fullConfig: FileRecognitionConfig = {
        ...config,
        directory: selectedDir
      };

      return recognizeFiles(fullConfig);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '目录选择失败';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [recognizeFiles]);

  /**
   * 从 File 对象列表创建文件条目
   */
  const recognizeFromFileObjects = useCallback((fileObjects: File[]) => {
    const files = fileObjects.map(createFileSystemEntryFromFile);
    setFiles(files);
    setStats({
      directoriesScanned: 0,
      filesFound: files.length,
      filesMatched: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0)
    });
    return files;
  }, []);

  /**
   * 选择文件
   */
  const selectFile = useCallback((file: FileSystemEntry) => {
    console.log('📁 [增强文件识别] 选择文件:', file.name);
    setSelectedFile(file);
  }, []);

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    setSelectedFile(null);
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError('');
  }, []);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setFiles([]);
    setSelectedFile(null);
    setError('');
    setLoading(false);
    setStats({
      directoriesScanned: 0,
      filesFound: 0,
      filesMatched: 0,
      totalSize: 0
    });
    setProgress({
      status: 'idle',
      scannedFiles: 0,
      matchedFiles: 0,
      progress: 0
    });
  }, []);

  /**
   * 获取环境信息
   */
  const getEnvironmentInfo = useCallback(() => {
    return {
      ...environment,
      description: environment.getDescription(),
      capabilities: {
        canListDirectory: environment.isTauri || environment.supportsFileSystemAPI,
        canOpenFileDialog: true,
        canOpenDirectoryDialog: environment.isTauri || environment.supportsFileSystemAPI,
        canReadFileContent: environment.isTauri,
        canWatchDirectory: environment.isTauri
      }
    };
  }, []);

  return {
    // 状态
    files,
    loading,
    error,
    selectedFile,
    stats,
    progress,
    
    // 环境信息
    environment: getEnvironmentInfo(),
    
    // 主要操作
    recognizeFiles,
    recognizeTodayFiles,
    recognizeSpecificDateFiles,
    recognizeViaFilePicker,
    recognizeViaDirectoryPicker,
    recognizeFromFileObjects,
    
    // 工具函数
    selectFile,
    clearSelection,
    clearError,
    reset,
    
    // 工具函数（从文件系统服务导出）
    filterFiles: fsFilterFiles,
  };
}
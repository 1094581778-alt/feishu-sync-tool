/**
 * 文件识别 Hook
 * 用于文件识别和管理
 */

import { useState, useCallback, useEffect } from 'react';

export interface RecognizedFile {
  name: string;
  path: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  isDirectory: boolean;
}

export interface FileRecognitionConfig {
  directory: string;
  pattern: string;
  dateMode: 'today' | 'specific';
  specificDate?: string;
}

export function useFileRecognition() {
  const [files, setFiles] = useState<RecognizedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<RecognizedFile | null>(null);

  /**
   * 识别匹配的文件
   * @param config 文件识别配置
   * @returns 匹配的文件列表
   */
  const recognizeFiles = useCallback(async (config: FileRecognitionConfig): Promise<RecognizedFile[]> => {
    setLoading(true);
    setError('');

    try {
      console.log('🔍 [文件识别] 开始识别文件:', config);

      // 验证目录路径
      if (!config.directory || config.directory.trim().length === 0) {
        throw new Error('文件目录不能为空');
      }

      // 由于浏览器环境限制，这里使用模拟数据
      // 实际使用时需要通过文件选择器或其他方式获取文件
      const mockFiles: RecognizedFile[] = [
        {
          name: generateFileName(config.pattern, '2026-02-25'),
          path: `${config.directory}/${generateFileName(config.pattern, '2026-02-25')}`,
          size: 105600,
          createdAt: new Date('2026-02-25T10:00:00'),
          modifiedAt: new Date('2026-02-25T10:00:00'),
          isDirectory: false
        },
        {
          name: generateFileName(config.pattern, '2026-02-24'),
          path: `${config.directory}/${generateFileName(config.pattern, '2026-02-24')}`,
          size: 102400,
          createdAt: new Date('2026-02-24T10:00:00'),
          modifiedAt: new Date('2026-02-24T10:00:00'),
          isDirectory: false
        },
        {
          name: generateFileName(config.pattern, '2026-02-23'),
          path: `${config.directory}/${generateFileName(config.pattern, '2026-02-23')}`,
          size: 98500,
          createdAt: new Date('2026-02-23T10:00:00'),
          modifiedAt: new Date('2026-02-23T10:00:00'),
          isDirectory: false
        }
      ];

      // 模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300));

      console.log('✅ [文件识别] 识别到文件:', mockFiles.length);
      setFiles(mockFiles);
      return mockFiles;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '文件识别失败';
      console.error('❌ [文件识别] 错误:', errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 根据文件名模式生成文件名
   * @param pattern 文件名模式（如：销售数据-*）
   * @param date 日期字符串（如：2026-02-25）
   * @returns 生成的文件名
   */
  const generateFileName = (pattern: string, date: string): string => {
    const dateStr = date.replace(/-/g, '_');
    return pattern.replace(/\*/g, dateStr);
  };

  /**
   * 筛选文件
   * @param files 文件列表
   * @param config 文件识别配置
   * @returns 筛选后的文件列表
   */
  const filterFiles = useCallback((fileList: RecognizedFile[], config: FileRecognitionConfig): RecognizedFile[] => {
    const targetDate = config.dateMode === 'today'
      ? new Date()
      : config.specificDate
        ? new Date(config.specificDate)
        : new Date();

    return fileList.filter(file => {
      // 只显示Excel文件
      if (!file.isDirectory && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        return false;
      }

      // 检查文件名是否匹配模式
      if (config.pattern) {
        const patternRegex = new RegExp(config.pattern.replace(/\*/g, '.*'), 'i');
        if (!patternRegex.test(file.name)) {
          return false;
        }
      }

      // 检查日期是否匹配
      const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '_');
      if (!file.name.includes(dateStr) && config.dateMode !== 'specific') {
        return false;
      }

      return true;
    });
  }, []);

  /**
   * 选择文件
   */
  const selectFile = useCallback((file: RecognizedFile) => {
    console.log('📁 [文件识别] 选择文件:', file.name);
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
  }, []);

  return {
    files,
    loading,
    error,
    selectedFile,
    recognizeFiles,
    filterFiles,
    selectFile,
    clearSelection,
    clearError,
    reset,
  };
}

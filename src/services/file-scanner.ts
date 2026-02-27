/**
 * 文件扫描服务
 * 支持本地路径文件扫描和筛选
 */

import type { FileInfo, FileFilterConfig, FileNameMatchMode, TimeFilterQuickOption } from '@/types/scheduled-task';

export class FileScanner {
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private static getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }

  private static isExcelFile(filename: string): boolean {
    const ext = this.getFileExtension(filename);
    return ['xlsx', 'xls'].includes(ext);
  }

  private static matchFileName(filename: string, mode: FileNameMatchMode, pattern: string): boolean {
    if (!pattern) return true;

    if (mode === 'exact') {
      return filename === pattern;
    }

    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`, 'i');
    return regex.test(filename);
  }

  private static matchFileTime(file: FileInfo, quickOption: TimeFilterQuickOption, startTime?: string, endTime?: string): boolean {
    const fileDate = new Date(file.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    switch (quickOption) {
      case 'today':
        return fileDate >= today;
      case 'yesterday':
        return fileDate >= yesterday && fileDate < today;
      case 'this_week':
        return fileDate >= weekStart;
      case 'custom':
        if (!startTime || !endTime) return true;
        const start = new Date(startTime);
        const end = new Date(endTime);
        return fileDate >= start && fileDate <= end;
      default:
        return true;
    }
  }

  /**
   * 扫描本地路径下的文件（模拟实现，实际需要调用Tauri API）
   */
  static async scanPath(path: string): Promise<{ success: boolean; files: FileInfo[]; error?: string }> {
    try {
      const mockFiles: FileInfo[] = [
        {
          name: '成交数据-2026_02_19-2026_02_25-2026年02月26日14时14分28秒.xlsx',
          path: path + '/成交数据-2026_02_19-2026_02_25-2026年02月26日14时14分28秒.xlsx',
          size: 1024000,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          modifiedAt: new Date(Date.now() - 3600000).toISOString(),
          extension: 'xlsx',
          isExcel: true,
        },
        {
          name: '订单数据-2026_02_26.xlsx',
          path: path + '/订单数据-2026_02_26.xlsx',
          size: 512000,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          modifiedAt: new Date(Date.now() - 7200000).toISOString(),
          extension: 'xlsx',
          isExcel: true,
        },
        {
          name: '库存数据.xls',
          path: path + '/库存数据.xls',
          size: 256000,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          modifiedAt: new Date(Date.now() - 86400000).toISOString(),
          extension: 'xls',
          isExcel: true,
        },
        {
          name: '说明文档.docx',
          path: path + '/说明文档.docx',
          size: 128000,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          modifiedAt: new Date(Date.now() - 172800000).toISOString(),
          extension: 'docx',
          isExcel: false,
        },
      ];

      await new Promise(resolve => setTimeout(resolve, 500));

      return {
        success: true,
        files: mockFiles,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : '路径扫描失败',
      };
    }
  }

  /**
   * 筛选文件
   */
  static filterFiles(files: FileInfo[], filterConfig: FileFilterConfig): FileInfo[] {
    return files.filter(file => {
      const nameMatch = this.matchFileName(
        file.name,
        filterConfig.fileName.mode,
        filterConfig.fileName.pattern
      );

      const timeMatch = this.matchFileTime(
        file,
        filterConfig.time.quickOption,
        filterConfig.time.startTime,
        filterConfig.time.endTime
      );

      return nameMatch && timeMatch;
    });
  }

  /**
   * 搜索文件（按文件名模糊搜索）
   */
  static searchFiles(files: FileInfo[], searchQuery: string): FileInfo[] {
    if (!searchQuery) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file => file.name.toLowerCase().includes(query));
  }

  /**
   * 排序文件
   */
  static sortFiles(files: FileInfo[], sortBy: 'name' | 'createdAt' | 'size', sortOrder: 'asc' | 'desc'): FileInfo[] {
    return [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
}

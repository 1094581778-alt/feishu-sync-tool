/**
 * 文件扫描服务 - Tauri 版本
 * 仅在 Tauri 桌面应用中使用
 */

import type { FileInfo, FileFilterConfig, FileNameMatchMode, TimeFilterQuickOption } from '@/types/scheduled-task';
import { readDir, stat } from '@tauri-apps/plugin-fs';

export class FileScannerTauri {
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
   * 扫描本地路径下的文件（Tauri 真实实现）
   */
  static async scanPath(path: string): Promise<{ success: boolean; files: FileInfo[]; error?: string }> {
    try {
      const files: FileInfo[] = [];
      
      const entries = await readDir(path);
      
      for (const entry of entries) {
        if (entry.isDirectory) {
          continue;
        }
        
        const filePath = `${path}/${entry.name}`;
        const fileStat = await stat(filePath);
        
        const extension = this.getFileExtension(entry.name);
        const isExcel = this.isExcelFile(entry.name);
        
        files.push({
          name: entry.name,
          path: filePath,
          size: fileStat.size || 0,
          createdAt: fileStat.birthtime?.toISOString() || new Date().toISOString(),
          modifiedAt: fileStat.mtime?.toISOString() || new Date().toISOString(),
          extension,
          isExcel,
        });
      }

      return {
        success: true,
        files,
      };
    } catch (error) {
      console.error('文件扫描失败:', error);
      return {
        success: false,
        files: [],
        error: error instanceof Error ? error.message : '路径扫描失败',
      };
    }
  }

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

  static searchFiles(files: FileInfo[], searchQuery: string): FileInfo[] {
    if (!searchQuery) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file => file.name.toLowerCase().includes(query));
  }

  static sortFiles(files: FileInfo[], sortBy: 'name' | 'createdAt' | 'size', sortOrder: 'asc' | 'desc'): FileInfo[] {
    return [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }
}

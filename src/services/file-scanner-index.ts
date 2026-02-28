/**
 * 文件扫描服务统一导出
 * 根据环境自动选择浏览器版本或 Tauri 版本
 */

import { isTauri } from './tauri';
import { FileScanner as BrowserFileScanner } from './file-scanner';
import type { FileInfo, FileFilterConfig, FileNameMatchMode, TimeFilterQuickOption } from '@/types/scheduled-task';

// 创建一个包装对象，支持同步和异步使用
class FileScannerWrapper {
  private static instance: FileScannerWrapper;
  private tauriScanner: any = null;
  private loadPromise: Promise<any> | null = null;

  private constructor() {}

  static getInstance(): FileScannerWrapper {
    if (!FileScannerWrapper.instance) {
      FileScannerWrapper.instance = new FileScannerWrapper();
    }
    return FileScannerWrapper.instance;
  }

  private async loadTauriScanner(): Promise<any> {
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        if (!this.tauriScanner) {
          // 使用 eval 避免编译时处理
          const importFunc = eval('import');
          const module = await importFunc('./file-scanner.tauri');
          this.tauriScanner = module.FileScannerTauri;
        }
        return this.tauriScanner;
      })();
    }
    return this.loadPromise;
  }

  async scanPath(path: string): Promise<{ success: boolean; files: FileInfo[]; error?: string }> {
    if (isTauri()) {
      const scanner = await this.loadTauriScanner();
      return scanner.scanPath(path);
    }
    return BrowserFileScanner.scanPath(path);
  }

  filterFiles(files: FileInfo[], filterConfig: FileFilterConfig): FileInfo[] {
    if (isTauri()) {
      return this.tauriScanner?.filterFiles(files, filterConfig) || BrowserFileScanner.filterFiles(files, filterConfig);
    }
    return BrowserFileScanner.filterFiles(files, filterConfig);
  }

  searchFiles(files: FileInfo[], searchQuery: string): FileInfo[] {
    if (isTauri()) {
      return this.tauriScanner?.searchFiles(files, searchQuery) || BrowserFileScanner.searchFiles(files, searchQuery);
    }
    return BrowserFileScanner.searchFiles(files, searchQuery);
  }

  sortFiles(files: FileInfo[], sortBy: string, sortOrder: string): FileInfo[] {
    if (isTauri()) {
      return this.tauriScanner?.sortFiles(files, sortBy as 'name' | 'createdAt' | 'size', sortOrder as 'asc' | 'desc') || BrowserFileScanner.sortFiles(files, sortBy, sortOrder);
    }
    return BrowserFileScanner.sortFiles(files, sortBy, sortOrder);
  }
}

export const FileScanner = FileScannerWrapper.getInstance();

export type { FileInfo, FileFilterConfig, FileNameMatchMode, TimeFilterQuickOption } from '@/types/scheduled-task';

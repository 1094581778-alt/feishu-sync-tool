/**
 * 统一文件系统服务
 * 提供跨环境（浏览器/Tauri）的文件访问抽象层
 */

import { isTauri } from './tauri';

// ==================== 类型定义 ====================

/**
 * 文件信息接口
 */
export interface FileSystemEntry {
  /** 文件名 */
  name: string;
  /** 完整路径 */
  path: string;
  /** 文件大小（字节） */
  size: number;
  /** 创建时间 */
  createdAt: Date;
  /** 修改时间 */
  modifiedAt: Date;
  /** 是否为目录 */
  isDirectory: boolean;
  /** 文件扩展名 */
  extension?: string;
}

/**
 * 文件选择器选项
 */
export interface FileDialogOptions {
  /** 是否允许多选 */
  multiple?: boolean;
  /** 是否保存文件模式 */
  save?: boolean;
  /** 默认文件名（保存模式） */
  defaultName?: string;
  /** 文件类型过滤器 */
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  /** 起始目录 */
  directory?: string;
}

/**
 * 文件读取选项
 */
export interface ReadFileOptions {
  /** 编码格式 */
  encoding?: 'utf-8' | 'binary' | 'base64';
  /** 是否返回ArrayBuffer */
  asArrayBuffer?: boolean;
}

/**
 * 目录监听回调事件
 */
export interface FileSystemEvent {
  /** 事件类型 */
  type: 'created' | 'modified' | 'deleted' | 'renamed';
  /** 文件路径 */
  path: string;
  /** 新路径（重命名事件） */
  newPath?: string;
  /** 事件时间戳 */
  timestamp: Date;
}

// ==================== 文件系统服务接口 ====================

/**
 * 统一文件系统服务接口
 */
export interface FileSystemService {
  /**
   * 检查当前环境是否支持文件系统访问
   */
  isAvailable(): boolean;
  
  /**
   * 列出目录内容
   * @param path 目录路径
   * @returns 目录条目列表
   */
  listDirectory(path: string): Promise<FileSystemEntry[]>;
  
  /**
   * 打开文件选择对话框
   * @param options 对话框选项
   * @returns 选择的文件路径（或多个路径）
   */
  openFileDialog(options?: FileDialogOptions): Promise<string | string[] | null>;
  
  /**
   * 打开目录选择对话框
   * @param options 对话框选项
   * @returns 选择的目录路径
   */
  openDirectoryDialog(options?: Omit<FileDialogOptions, 'multiple' | 'save'>): Promise<string | null>;
  
  /**
   * 读取文件内容
   * @param path 文件路径
   * @param options 读取选项
   * @returns 文件内容
   */
  readFile(path: string, options?: ReadFileOptions): Promise<string | ArrayBuffer>;
  
  /**
   * 获取文件信息
   * @param path 文件路径
   * @returns 文件信息
   */
  getFileInfo(path: string): Promise<FileSystemEntry>;
  
  /**
   * 检查文件/目录是否存在
   * @param path 路径
   * @returns 是否存在
   */
  exists(path: string): Promise<boolean>;
  
  /**
   * 监听目录变化
   * @param path 目录路径
   * @param callback 回调函数
   * @returns 取消监听函数
   */
  watchDirectory(path: string, callback: (events: FileSystemEvent[]) => void): () => void;
  
  /**
   * 获取用户主目录路径
   * @returns 主目录路径
   */
  getHomeDirectory(): Promise<string | null>;
  
  /**
   * 获取当前工作目录
   * @returns 当前目录路径
   */
  getCurrentDirectory(): Promise<string | null>;
}

// ==================== Tauri 文件系统实现 ====================

/**
 * Tauri 环境文件系统实现
 */
class TauriFileSystem implements FileSystemService {
  private fs: any = null;
  private dialog: any = null;
  private path: any = null;
  
  constructor() {
    // 动态导入 Tauri 插件，避免在浏览器环境中报错
    if (isTauri()) {
      this.loadTauriModules();
    }
  }
  
  private async loadTauriModules() {
    try {
      const [fsModule, dialogModule, pathModule] = await Promise.all([
        import('@tauri-apps/plugin-fs'),
        import('@tauri-apps/plugin-dialog'),
        import('@tauri-apps/api/path')
      ]);
      
      this.fs = fsModule;
      this.dialog = dialogModule;
      this.path = pathModule;
    } catch (error) {
      console.error('加载 Tauri 模块失败:', error);
    }
  }
  
  isAvailable(): boolean {
    return isTauri() && !!this.fs;
  }
  
  async listDirectory(path: string): Promise<FileSystemEntry[]> {
    if (!this.isAvailable() || !this.fs.readDir) {
      throw new Error('Tauri 文件系统不可用');
    }
    
    try {
      const entries = await this.fs.readDir(path, {
        recursive: false,
        followSymlinks: false
      });
      
      const fileInfos: FileSystemEntry[] = [];
      
      for (const entry of entries) {
        try {
          const stats = await this.fs.stat(entry.path);
          const extension = entry.name.includes('.') 
            ? entry.name.split('.').pop()?.toLowerCase()
            : undefined;
          
          fileInfos.push({
            name: entry.name,
            path: entry.path,
            size: stats.size,
            createdAt: new Date(stats.createdAt),
            modifiedAt: new Date(stats.modifiedAt),
            isDirectory: entry.type === 'directory',
            extension
          });
        } catch (err) {
          console.warn('获取文件信息失败:', entry.path, err);
        }
      }
      
      return fileInfos;
    } catch (error) {
      console.error('列出目录失败:', path, error);
      throw error;
    }
  }
  
  async openFileDialog(options: FileDialogOptions = {}): Promise<string | string[] | null> {
    if (!this.isAvailable() || !this.dialog.open) {
      throw new Error('Tauri 对话框不可用');
    }
    
    try {
      const selected = await this.dialog.open({
        multiple: options.multiple || false,
        directory: false,
        filters: options.filters || [
          {
            name: 'Excel文件',
            extensions: ['xlsx', 'xls']
          },
          {
            name: '所有文件',
            extensions: ['*']
          }
        ],
        defaultPath: options.directory
      });
      
      return selected;
    } catch (error) {
      console.error('打开文件对话框失败:', error);
      return null;
    }
  }
  
  async openDirectoryDialog(options: Omit<FileDialogOptions, 'multiple' | 'save'> = {}): Promise<string | null> {
    if (!this.isAvailable() || !this.dialog.open) {
      throw new Error('Tauri 对话框不可用');
    }
    
    try {
      const selected = await this.dialog.open({
        multiple: false,
        directory: true,
        defaultPath: options.directory
      });
      
      return selected as string | null;
    } catch (error) {
      console.error('打开目录对话框失败:', error);
      return null;
    }
  }
  
  async readFile(path: string, options: ReadFileOptions = {}): Promise<string | ArrayBuffer> {
    if (!this.isAvailable() || !this.fs.readFile) {
      throw new Error('Tauri 文件系统不可用');
    }
    
    try {
      const content = await this.fs.readFile(path);
      
      if (options.asArrayBuffer) {
        return content;
      }
      
      // 转换为字符串
      const decoder = new TextDecoder(options.encoding || 'utf-8');
      return decoder.decode(content);
    } catch (error) {
      console.error('读取文件失败:', path, error);
      throw error;
    }
  }
  
  async getFileInfo(path: string): Promise<FileSystemEntry> {
    if (!this.isAvailable() || !this.fs.stat) {
      throw new Error('Tauri 文件系统不可用');
    }
    
    try {
      const stats = await this.fs.stat(path);
      const name = path.split('/').pop() || path.split('\\').pop() || path;
      const extension = name.includes('.') 
        ? name.split('.').pop()?.toLowerCase()
        : undefined;
      
      return {
        name,
        path,
        size: stats.size,
        createdAt: new Date(stats.createdAt),
        modifiedAt: new Date(stats.modifiedAt),
        isDirectory: stats.isDirectory || false,
        extension
      };
    } catch (error) {
      console.error('获取文件信息失败:', path, error);
      throw error;
    }
  }
  
  async exists(path: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }
    
    try {
      await this.getFileInfo(path);
      return true;
    } catch {
      return false;
    }
  }
  
  watchDirectory(path: string, callback: (events: FileSystemEvent[]) => void): () => void {
    // Tauri 2.x 目前没有内置的文件监听插件
    // 可以返回一个空函数或使用其他方案
    console.warn('Tauri 文件监听功能暂未实现');
    return () => {};
  }
  
  async getHomeDirectory(): Promise<string | null> {
    if (!this.isAvailable() || !this.path.homeDir) {
      return null;
    }
    
    try {
      return await this.path.homeDir();
    } catch (error) {
      console.error('获取主目录失败:', error);
      return null;
    }
  }
  
  async getCurrentDirectory(): Promise<string | null> {
    if (!this.isAvailable() || !this.path.appDir) {
      return null;
    }
    
    try {
      return await this.path.appDir();
    } catch (error) {
      console.error('获取当前目录失败:', error);
      return null;
    }
  }
}

// ==================== 浏览器文件系统实现 ====================

/**
 * 浏览器环境文件系统实现
 * 注意：浏览器环境有严格的安全限制
 */
class BrowserFileSystem implements FileSystemService {
  isAvailable(): boolean {
    return typeof window !== 'undefined';
  }
  
  async listDirectory(path: string): Promise<FileSystemEntry[]> {
    // 浏览器无法直接列出目录内容
    // 尝试使用实验性的文件系统访问 API
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        const entries: FileSystemEntry[] = [];
        
        for await (const [name, handle] of dirHandle.entries()) {
          if (handle.kind === 'file') {
            const file = await handle.getFile();
            entries.push({
              name,
              path: name, // 浏览器环境没有完整路径
              size: file.size,
              createdAt: new Date(file.lastModified),
              modifiedAt: new Date(file.lastModified),
              isDirectory: false,
              extension: name.includes('.') ? name.split('.').pop()?.toLowerCase() : undefined
            });
          }
        }
        
        return entries;
      } catch (error) {
        console.warn('使用文件系统访问 API 失败:', error);
      }
    }
    
    // 如果无法访问，返回空数组或抛出错误
    throw new Error('浏览器环境不支持直接列出目录内容。请使用文件选择器选择文件。');
  }
  
  async openFileDialog(options: FileDialogOptions = {}): Promise<string | string[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options.multiple || false;
      
      // 设置文件类型过滤器
      if (options.filters && options.filters.length > 0) {
        const acceptTypes = options.filters
          .map(filter => filter.extensions.map(ext => `.${ext}`).join(','))
          .join(',');
        input.accept = acceptTypes;
      }
      
      input.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files || files.length === 0) {
          resolve(null);
          return;
        }
        
        if (options.multiple) {
          const fileNames: string[] = [];
          for (let i = 0; i < files.length; i++) {
            fileNames.push(files[i].name);
          }
          resolve(fileNames);
        } else {
          resolve(files[0].name);
        }
      };
      
      input.oncancel = () => {
        resolve(null);
      };
      
      input.click();
    });
  }
  
  async openDirectoryDialog(): Promise<string | null> {
    // 尝试使用实验性的目录选择 API
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        return dirHandle.name; // 只能返回目录名，不能返回完整路径
      } catch (error) {
        console.warn('使用目录选择 API 失败:', error);
      }
    }
    
    // 回退到文件选择器
    return this.openFileDialog({
      multiple: false,
      filters: [{ name: '所有文件', extensions: ['*'] }]
    }) as Promise<string | null>;
  }
  
  async readFile(path: string, options: ReadFileOptions = {}): Promise<string | ArrayBuffer> {
    // 浏览器无法通过路径直接读取文件
    // 需要通过文件选择器或拖拽获取 File 对象
    throw new Error('浏览器环境不支持通过路径直接读取文件。请先通过文件选择器获取文件对象。');
  }
  
  async getFileInfo(path: string): Promise<FileSystemEntry> {
    throw new Error('浏览器环境不支持通过路径获取文件信息。');
  }
  
  async exists(path: string): Promise<boolean> {
    return false; // 浏览器无法检查文件是否存在
  }
  
  watchDirectory(path: string, callback: (events: FileSystemEvent[]) => void): () => void {
    console.warn('浏览器环境不支持目录监听');
    return () => {};
  }
  
  async getHomeDirectory(): Promise<string | null> {
    return null; // 浏览器无法获取用户主目录
  }
  
  async getCurrentDirectory(): Promise<string | null> {
    return window.location.pathname || null;
  }
}

// ==================== 服务工厂 ====================

/**
 * 创建文件系统服务实例
 */
export function createFileSystemService(): FileSystemService {
  return isTauri() ? new TauriFileSystem() : new BrowserFileSystem();
}

/**
 * 默认文件系统服务实例
 */
export const fileSystemService = createFileSystemService();

/**
 * 环境检测工具
 */
export const environment = {
  /** 是否为 Tauri 环境 */
  isTauri: isTauri(),
  
  /** 是否为浏览器环境 */
  isBrowser: typeof window !== 'undefined',
  
  /** 是否支持文件系统访问 API */
  supportsFileSystemAPI: typeof window !== 'undefined' && 'showDirectoryPicker' in window,
  
  /** 是否支持拖放 API */
  supportsDragAndDrop: typeof window !== 'undefined' && 'DataTransfer' in window,
  
  /** 获取环境描述 */
  getDescription(): string {
    if (this.isTauri) {
      return 'Tauri 桌面应用环境（完整文件系统访问权限）';
    } else if (this.supportsFileSystemAPI) {
      return '现代浏览器环境（受限文件系统访问）';
    } else {
      return '传统浏览器环境（仅限文件选择器）';
    }
  }
};

// ==================== 工具函数 ====================

/**
 * 从 File 对象创建 FileSystemEntry
 * @param file File 对象
 * @returns FileSystemEntry
 */
export function createFileSystemEntryFromFile(file: File): FileSystemEntry {
  const extension = file.name.includes('.') 
    ? file.name.split('.').pop()?.toLowerCase()
    : undefined;
  
  return {
    name: file.name,
    path: file.name, // 浏览器环境没有完整路径
    size: file.size,
    createdAt: new Date(file.lastModified),
    modifiedAt: new Date(file.lastModified),
    isDirectory: false,
    extension
  };
}

/**
 * 过滤文件列表
 * @param files 文件列表
 * @param options 过滤选项
 * @returns 过滤后的文件列表
 */
export function filterFiles(
  files: FileSystemEntry[],
  options: {
    extensions?: string[];
    pattern?: RegExp | string;
    minSize?: number;
    maxSize?: number;
    excludeDirectories?: boolean;
  } = {}
): FileSystemEntry[] {
  return files.filter(file => {
    // 排除目录
    if (options.excludeDirectories && file.isDirectory) {
      return false;
    }
    
    // 扩展名过滤
    if (options.extensions && options.extensions.length > 0 && file.extension) {
      if (!options.extensions.includes(file.extension)) {
        return false;
      }
    }
    
    // 文件名模式过滤
    if (options.pattern) {
      const pattern = typeof options.pattern === 'string' 
        ? new RegExp(options.pattern, 'i')
        : options.pattern;
      
      if (!pattern.test(file.name)) {
        return false;
      }
    }
    
    // 文件大小过滤
    if (options.minSize !== undefined && file.size < options.minSize) {
      return false;
    }
    
    if (options.maxSize !== undefined && file.size > options.maxSize) {
      return false;
    }
    
    return true;
  });
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数
 * @returns 格式化后的文件大小
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
/**
 * 文件筛选工具
 * 用于根据配置的规则自动筛选文件
 */

export interface FileFilterConfig {
  directory: string;
  pattern: string; // 文件名匹配模式，如 "抖音电商罗盘-成交分析-*"
  dateMode: 'today' | 'specific';
  specificDate?: string; // YYYY-MM-DD 格式
}

export interface FilteredFile {
  name: string;
  path: string;
  size: number;
  modifiedAt: Date;
}

/**
 * 筛选符合条件的文件
 * @param config 文件筛选配置
 * @returns 符合条件的文件列表
 */
export async function filterFiles(config: FileFilterConfig): Promise<FilteredFile[]> {
  try {
    // 获取目标日期
    const targetDate = config.dateMode === 'today' 
      ? new Date() 
      : config.specificDate 
        ? new Date(config.specificDate) 
        : new Date();
    
    // 格式化日期为 YYYYMMDD 格式
    const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 由于浏览器环境限制，无法直接读取本地目录
    // 这里返回模拟数据，实际使用时需要通过文件选择器或其他方式获取文件
    console.log('文件筛选配置:', config);
    console.log('目标日期:', dateStr);
    
    // 返回模拟数据
    return [];
  } catch (error) {
    console.error('文件筛选失败:', error);
    return [];
  }
}

/**
 * 检查文件是否符合筛选条件
 * @param fileName 文件名
 * @param config 文件筛选配置
 * @returns 是否符合条件
 */
export function isFileMatch(fileName: string, config: FileFilterConfig): boolean {
  // 编译文件名匹配正则表达式
  const pattern = config.pattern.replace(/\*/g, '.*');
  const regex = new RegExp(`^${pattern}$`);
  
  // 检查文件名是否匹配模式
  if (!regex.test(fileName)) {
    return false;
  }
  
  // 获取目标日期
  const targetDate = config.dateMode === 'today' 
    ? new Date() 
    : config.specificDate 
      ? new Date(config.specificDate) 
      : new Date();
  
  // 格式化日期为 YYYYMMDD 格式
  const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 检查文件名是否包含目标日期
  return fileName.includes(dateStr);
}

/**
 * 生成文件匹配模式的示例文件名
 * @param pattern 文件名匹配模式
 * @returns 示例文件名
 */
export function generateExampleFileName(pattern: string): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return pattern.replace(/\*/g, today);
}

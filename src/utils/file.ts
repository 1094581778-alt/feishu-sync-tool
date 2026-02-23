/**
 * 文件工具函数
 */

/**
 * 格式化文件大小
 * 
 * @param bytes - 文件大小（字节）
 * @returns 格式化后的文件大小字符串
 * 
 * @example
 * formatFileSize(1024) // '1 KB'
 * formatFileSize(1536) // '1.5 KB'
 * formatFileSize(1048576) // '1 MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 飞书链接解析工具函数
 */

/**
 * 解析飞书多维表格链接，提取表格 Token 和 Sheet ID
 * 
 * @param url - 飞书多维表格链接
 * @returns 包含 spreadsheetToken 和可选的 sheetId 的对象，解析失败返回 null
 * 
 * @example
 * // 示例链接: https://bytedance.feishu.cn/base/xxxxx?sheet=yyyyy
 * const result = parseFeishuUrl(url);
 * // { spreadsheetToken: 'xxxxx', sheetId: 'yyyyy' }
 */
export function parseFeishuUrl(url: string): { spreadsheetToken: string; sheetId?: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const baseIndex = pathParts.indexOf('base');

    if (baseIndex === -1 || !pathParts[baseIndex + 1]) {
      return null;
    }

    const spreadsheetToken = pathParts[baseIndex + 1].split('?')[0];
    const urlParams = new URLSearchParams(urlObj.search);
    const sheetId = urlParams.get('sheet') || urlParams.get('sheetId') || undefined;

    return { spreadsheetToken, sheetId };
  } catch (error) {
    return null;
  }
}

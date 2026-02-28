/**
 * 字段匹配工具函数
 */
import type { FeishuField, FieldMatchResult } from '@/types';

/**
 * 计算两个字符串的相似度（使用编辑距离算法）
 * 
 * @param str1 - 第一个字符串
 * @param str2 - 第二个字符串
 * @returns 相似度（0-1 之间）
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // 如果完全相同，相似度为 1
  if (s1 === s2) return 1;
  
  // 如果一个字符串包含另一个字符串，相似度为 0.8
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // 计算编辑距离
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]) + 1;
      }
    }
  }
  
  const maxLen = Math.max(m, n);
  return 1 - dp[m][n] / maxLen;
}

/**
 * 查找最佳匹配字段
 * 
 * @param excelField - Excel 字段名
 * @param feishuFields - 飞书字段列表
 * @returns 最佳匹配结果（包含字段名和相似度）
 */
export function findBestMatch(excelField: string, feishuFields: string[]): { field: string; similarity: number } | null {
  let bestMatch: { field: string; similarity: number } | null = null;
  
  // 1. 首先尝试精确匹配
  const exactMatch = feishuFields.find(field => field === excelField);
  if (exactMatch) {
    return { field: exactMatch, similarity: 1 };
  }
  
  // 2. 计算相似度，找到最佳匹配
  for (const feishuField of feishuFields) {
    const similarity = calculateSimilarity(excelField, feishuField);
    
    // 如果相似度大于 0.6，认为是潜在匹配
    if (similarity > 0.6) {
      if (!bestMatch || similarity > bestMatch.similarity) {
        bestMatch = { field: feishuField, similarity };
      }
    }
  }
  
  return bestMatch;
}

/**
 * 分析字段匹配
 */
export async function analyzeFieldMatching(
  file: File,
  sheetName: string,
  feishuFields: FeishuField[]
): Promise<FieldMatchResult[]> {
  try {
    const buffer = await file.arrayBuffer();
    const XLSX = await import('xlsx');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const worksheet = workbook.Sheets[sheetName];
    
    // 读取第一行作为列名
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (jsonData.length === 0) {
      return [];
    }
    
    const excelColumns = jsonData[0] as string[];
    
    // 匹配 Excel 列和飞书字段
    const results: FieldMatchResult[] = excelColumns.map((colName) => {
      const matchedField = matchField(colName, feishuFields);
      return {
        excelField: colName,
        feishuField: matchedField?.id || null,
        matched: !!matchedField,
      };
    });
    
    return results;
  } catch (error) {
    console.error('[字段匹配] 分析失败:', error);
    return [];
  }
}

/**
 * 根据字段名称匹配飞书字段
 */
function matchField(fieldName: string, feishuFields: FeishuField[]): FeishuField | null {
  const lowerFieldName = fieldName.toLowerCase();
  
  // 优先直接匹配
  const directMatch = feishuFields.find(
    f => f.name?.toLowerCase() === lowerFieldName ||
         f.field_name?.toLowerCase() === lowerFieldName
  );
  if (directMatch) return directMatch;
  
  // 关键词匹配
  const keywords = [
    { key: '文件名', terms: ['文件名', 'filename', 'name'] },
    { key: '文件大小', terms: ['文件大小', 'filesize', 'size'] },
    { key: '文件类型', terms: ['文件类型', 'filetype', 'type', 'extension'] },
    { key: '文件链接', terms: ['文件链接', 'fileurl', 'url', 'link', '链接'] },
    { key: '上传时间', terms: ['上传时间', 'uploadtime', 'time', 'created'] },
  ];

  for (const { key, terms } of keywords) {
    const hasKeyword = terms.some(term => lowerFieldName.includes(term));
    if (hasKeyword) {
      const keywordMatch = feishuFields.find(
        f => f.name?.includes(key) || f.field_name?.includes(key)
      );
      if (keywordMatch) return keywordMatch;
    }
  }

  return null;
}

/**
 * 批量分析多个工作表的字段匹配
 */
export async function analyzeFieldMatchingForAllTables(
  file: File,
  selectedTableIds: string[],
  tableFields: Record<string, FeishuField[]>,
  tableToSheetMapping: Record<string, string>
): Promise<Record<string, FieldMatchResult[]>> {
  const results: Record<string, FieldMatchResult[]> = {};
  
  for (const tableId of selectedTableIds) {
    const fields = tableFields[tableId];
    if (!fields || fields.length === 0) {
      console.log(`⚠️ [字段匹配] 工作表 ${tableId} 字段列表为空，跳过`);
      continue;
    }
    
    const sheetName = tableToSheetMapping[tableId];
    if (!sheetName) {
      console.log(`⚠️ [字段匹配] 工作表 ${tableId} 未选择Sheet，跳过`);
      continue;
    }
    
    const matches = await analyzeFieldMatching(file, sheetName, fields);
    results[tableId] = matches;
    
    const matchedCount = matches.filter(r => r.matched).length;
    console.log(`📊 [字段匹配] 工作表 ${tableId} (Sheet: ${sheetName}): Excel列数 ${matches.length}, 匹配成功 ${matchedCount}`);
  }
  
  return results;
}

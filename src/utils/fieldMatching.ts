/**
 * 字段匹配工具函数
 */
import type { FeishuField, FieldMatchResult } from '@/types';

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

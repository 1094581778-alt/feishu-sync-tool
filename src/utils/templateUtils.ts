import type { FieldMatchResult } from '@/types';

export const MESSAGE_TIMEOUT = {
  SHORT: 3000,
  LONG: 5000,
} as const;

export const MESSAGES = {
  NO_FILE: '⚠️ 请先上传Excel文件后再刷新字段匹配',
  NO_SHEET_MAPPING: '⚠️ 请先配置Sheet映射后再刷新字段匹配',
  REFRESH_SUCCESS: '✅ 字段匹配已刷新',
  REFRESH_FAILED: '❌ 刷新失败，请检查文件',
  NO_UNMATCHED_FIELDS: '✅ 没有未匹配字段需要添加',
  ADD_FIELDS_FAILED: '❌ 添加字段失败，请检查网络连接',
  AUTO_ADD_FAILED: '❌ 自动添加字段失败，请检查网络连接',
} as const;

export const FIELD_TYPES = {
  NUMBER: 'number',
  DATE: 'date',
  TEXT: 'text',
} as const;

export const DATE_FORMATS = [
  /^\d{4}-\d{2}-\d{2}$/,
  /^\d{2}\/\d{2}\/\d{4}$/,
  /^\d{4}\/\d{2}\/\d{2}$/,
] as const;

export function detectFieldType(excelField: string, jsonData: Record<string, any>[]): string {
  const values = jsonData.map(row => row[excelField]).filter(v => v !== null && v !== undefined && v !== '');
  
  if (values.length === 0) return FIELD_TYPES.TEXT;
  
  const allNumbers = values.every(value => !isNaN(Number(value)));
  if (allNumbers) return FIELD_TYPES.NUMBER;
  
  const allDates = values.every(value => {
    const strValue = String(value).trim();
    if (strValue === '') return true;
    
    // 检查常见的日期格式
    // 1. 标准日期格式：YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
    if (/^\d{4}[-/.]\d{2}[-/.]\d{2}$/.test(strValue)) return true;
    
    // 2. 紧凑日期格式：YYYYMMDD
    if (/^\d{8}$/.test(strValue)) {
      const year = parseInt(strValue.substring(0, 4));
      const month = parseInt(strValue.substring(4, 6));
      const day = parseInt(strValue.substring(6, 8));
      return year >= 1900 && year <= 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
    }
    
    // 3. 包含日期时间格式：YYYY-MM-DD HH:mm:ss
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(strValue)) return true;
    
    // 4. 中文日期格式：YYYY年MM月DD日
    if (/^\d{4}年\d{1,2}月\d{1,2}日$/.test(strValue)) return true;
    
    // 5. 时间戳（10位秒级或13位毫秒级）
    if (/^\d{10}$/.test(strValue)) {
      const timestamp = parseInt(strValue);
      return timestamp >= 1000000000 && timestamp <= 9999999999;
    }
    if (/^\d{13}$/.test(strValue)) {
      const timestamp = parseInt(strValue);
      return timestamp >= 1000000000000 && timestamp <= 9999999999999;
    }
    
    return false;
  });
  
  if (allDates) return FIELD_TYPES.DATE;
  
  return FIELD_TYPES.TEXT;
}

export function calculateFieldMatches(excelColumns: string[], feishuFieldNames: string[]): FieldMatchResult[] {
  const normalizeFieldName = (name: string) =>
    name.trim().toLowerCase().replace(/\s+/g, '');

  return excelColumns.map((excelField) => {
    let feishuField = feishuFieldNames.find(
      (fn: string) => fn === excelField
    );
    if (!feishuField) {
      const normalizedExcelField = normalizeFieldName(excelField);
      feishuField = feishuFieldNames.find(
        (fn: string) => normalizeFieldName(fn) === normalizedExcelField
      );
    }
    return {
      excelField,
      feishuField: feishuField || null,
      matched: !!feishuField,
    };
  });
}

export function buildResultMessage(successCount: number, skippedFields: string[], failedFields: string[]): string {
  const parts: string[] = [];
  
  if (successCount > 0) {
    parts.push(`✅ 成功添加 ${successCount} 个字段`);
  }
  if (skippedFields.length > 0) {
    parts.push(`⚠️ 跳过 ${skippedFields.length} 个已存在字段`);
  }
  if (failedFields.length > 0) {
    parts.push(`❌ 失败 ${failedFields.length} 个字段`);
  }
  
  return parts.length > 0 ? parts.join('，') : '✅ 没有需要添加的字段';
}

export function isFieldAlreadyExists(error?: string, status?: number): boolean {
  return error?.includes('已存在') || status === 409;
}

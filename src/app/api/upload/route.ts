import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import * as xlsx from 'xlsx';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.coze_bucket_endpoint_url,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.coze_bucket_name,
  region: 'cn-beijing',
});

// 注意：不再使用环境变量作为默认值，用户必须通过界面或请求参数提供凭证

/**
 * 飞书字段类型定义
 */
const FEISHU_FIELD_TYPES = {
  TEXT: 1,          // 文本
  NUMBER: 2,        // 数字
  SINGLE_SELECT: 3, // 单选
  MULTI_SELECT: 4,  // 多选
  DATE: 5,          // 日期
  CHECKBOX: 7,      // 复选框
  PERSON: 11,       // 人员
  GROUP: 12,        // 群组
  PHONE: 13,        // 电话号码
  URL: 15,          // 超链接
  ATTACHMENT: 17,   // 附件
  SINGLE_RELATION: 18,  // 单向关联
  DOUBLE_RELATION: 19,  // 双向关联
  LOCATION: 22,     // 地理位置
} as const;

/**
 * 根据字段类型转换数据格式
 */
function convertValueByFieldType(value: any, fieldType: number): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const strValue = String(value).trim();

  switch (fieldType) {
    case FEISHU_FIELD_TYPES.TEXT:
      // 文本：直接返回字符串
      return strValue;

    case FEISHU_FIELD_TYPES.NUMBER:
      // 数字：转换为浮点数并保留两位小数
      const num = parseFloat(strValue);
      return isNaN(num) ? 0 : parseFloat(num.toFixed(2));

    case FEISHU_FIELD_TYPES.SINGLE_SELECT:
      // 单选：直接返回选项值（字符串）
      return strValue;

    case FEISHU_FIELD_TYPES.MULTI_SELECT:
      // 多选：支持逗号、分号、竖线分隔的选项
      if (strValue.includes(',') || strValue.includes('；') || strValue.includes(';') || strValue.includes('|')) {
        const separators = [',', '，', '；', ';', '|'];
        let options = [strValue];
        for (const sep of separators) {
          if (strValue.includes(sep)) {
            options = strValue.split(sep).map(s => s.trim()).filter(s => s);
            break;
          }
        }
        return options;
      }
      return [strValue];

    case FEISHU_FIELD_TYPES.DATE:
      // 日期：转换为毫秒级时间戳
      // 支持多种日期格式
      let normalizedDateStr = strValue;
      
      // 尝试解析紧凑日期格式：YYYYMMDD 或 YYYYMMDDHHmm
      // 例如：20260203 → 2026-02-03
      //      202602031230 → 2026-02-03 12:30
      if (/^\d{8}$/.test(strValue)) {
        // 8位数字：YYYYMMDD
        const year = strValue.substring(0, 4);
        const month = strValue.substring(4, 6);
        const day = strValue.substring(6, 8);
        normalizedDateStr = `${year}-${month}-${day}`;
        console.log(`📅 [日期格式] 检测到紧凑日期格式: ${strValue} → ${normalizedDateStr}`);
      } else if (/^\d{12}$/.test(strValue)) {
        // 12位数字：YYYYMMDDHHmm
        const year = strValue.substring(0, 4);
        const month = strValue.substring(4, 6);
        const day = strValue.substring(6, 8);
        const hour = strValue.substring(8, 10);
        const minute = strValue.substring(10, 12);
        normalizedDateStr = `${year}-${month}-${day} ${hour}:${minute}`;
        console.log(`📅 [日期格式] 检测到紧凑日期时间格式: ${strValue} → ${normalizedDateStr}`);
      } else if (/^\d{14}$/.test(strValue)) {
        // 14位数字：YYYYMMDDHHmmss
        const year = strValue.substring(0, 4);
        const month = strValue.substring(4, 6);
        const day = strValue.substring(6, 8);
        const hour = strValue.substring(8, 10);
        const minute = strValue.substring(10, 12);
        const second = strValue.substring(12, 14);
        normalizedDateStr = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        console.log(`📅 [日期格式] 检测到紧凑日期时间格式: ${strValue} → ${normalizedDateStr}`);
      }
      
      // 尝试解析日期
      const date = new Date(normalizedDateStr);
      if (!isNaN(date.getTime())) {
        return date.getTime();
      }
      
      // 如果是纯数字，假设是时间戳（秒级或毫秒级）
      const timestamp = parseFloat(strValue);
      if (!isNaN(timestamp)) {
        // 如果时间戳小于 10 位（如 1704268800），认为是秒级时间戳，转换为毫秒
        if (timestamp < 10000000000) {
          return timestamp * 1000;
        }
        // 否则认为是毫秒级时间戳
        return timestamp;
      }
      
      // 无法解析，返回当前时间
      console.warn(`⚠️ [日期格式] 无法解析日期: ${strValue}，使用当前时间`);
      return Date.now();

    case FEISHU_FIELD_TYPES.CHECKBOX:
      // 复选框：根据常见布尔值判断
      const lowerValue = strValue.toLowerCase();
      if (['true', '是', 'yes', '1', '✓', '✅', 'check', 'checked'].includes(lowerValue)) {
        return true;
      }
      if (['false', '否', 'no', '0', '✗', '❌', 'uncheck', 'unchecked'].includes(lowerValue)) {
        return false;
      }
      return false;

    case FEISHU_FIELD_TYPES.PHONE:
      // 电话号码：返回字符串（移除空格）
      return strValue.replace(/\s+/g, '');

    case FEISHU_FIELD_TYPES.URL:
      // 超链接：如果是完整URL，返回对象格式
      if (strValue.startsWith('http://') || strValue.startsWith('https://')) {
        return {
          text: strValue,
          link: strValue
        };
      }
      // 否则返回文本格式
      return strValue;

    case FEISHU_FIELD_TYPES.LOCATION:
      // 地理位置：尝试解析经纬度（格式：经度,纬度）
      const coords = strValue.split(/[，,]/).map(s => parseFloat(s.trim()));
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        return `${coords[0]},${coords[1]}`;
      }
      return strValue;

    case FEISHU_FIELD_TYPES.PERSON:
    case FEISHU_FIELD_TYPES.GROUP:
    case FEISHU_FIELD_TYPES.ATTACHMENT:
    case FEISHU_FIELD_TYPES.SINGLE_RELATION:
    case FEISHU_FIELD_TYPES.DOUBLE_RELATION:
      // 这些类型需要特定的ID，暂时返回字符串格式
      // 实际使用时需要根据业务逻辑获取对应的ID
      console.warn(`⚠️ [字段类型] 字段类型 ${fieldType} 需要特殊处理，当前返回字符串:`, strValue);
      return strValue;

    default:
      // 未知类型：返回字符串
      return strValue;
  }
}

/**
 * 获取飞书访问令牌
 */
async function getFeishuAccessToken(appId?: string, appSecret?: string): Promise<string> {
  // 必须提供飞书凭证
  if (!appId || !appSecret) {
    throw new Error('飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret');
  }

  console.log('🔑 [获取访问令牌] App ID:', appId.substring(0, 8) + '...');

  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: appId,
      app_secret: appSecret,
    }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取飞书访问令牌失败: ${data.msg}`);
  }

  console.log('✅ [获取访问令牌] 成功');
  return data.tenant_access_token;
}

/**
 * 读取Excel文件内容
 */
function readExcelContent(buffer: Buffer, sheetName?: string): { columns: string[]; data: Record<string, any>[] } {
  try {
    // 读取Excel工作簿
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    
    // 获取指定Sheet，如果没有指定则获取第一个
    let targetSheetName = sheetName;
    if (!targetSheetName || !workbook.SheetNames.includes(targetSheetName)) {
      targetSheetName = workbook.SheetNames[0];
    }
    
    const worksheet = workbook.Sheets[targetSheetName];
    
    if (!worksheet) {
      throw new Error(`Sheet "${targetSheetName}" 不存在`);
    }
    
    // 转换为JSON数据
    const jsonData = xlsx.utils.sheet_to_json<Record<string, any>>(worksheet, { raw: false, defval: null });
    
    if (jsonData.length === 0) {
      return { columns: [], data: [] };
    }
    
    // 获取所有列名
    const columns = Object.keys(jsonData[0]);
    
    console.log('📊 [Excel] Sheet:', targetSheetName);
    console.log('📊 [Excel] 读取到列:', columns);
    console.log('📊 [Excel] 读取到数据行数:', jsonData.length);
    console.log('📊 [Excel] 第一行数据:', jsonData[0]);
    console.log('📊 [Excel] 列名详细检查:');
    columns.forEach((col, idx) => {
      console.log(`  列 ${idx + 1}: "${col}" (长度: ${col.length}, 包含空格: ${col.includes(' ')})`);
    });
    
    return { columns, data: jsonData };
  } catch (error) {
    console.error('❌ [Excel] 读取失败:', error);
    throw new Error(`读取Excel文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取飞书多维表格的所有工作表列表
 */
async function getFeishuTables(accessToken: string, appToken: string): Promise<string> {
  const response = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`获取飞书工作表列表失败: ${data.msg}`);
  }

  if (!data.data || !data.data.items || data.data.items.length === 0) {
    throw new Error('飞书多维表格中没有工作表');
  }

  // 返回第一个工作表的 ID
  return data.data.items[0].table_id;
}

/**
 * 计算两个字符串的相似度（使用编辑距离算法）
 */
function calculateSimilarity(str1: string, str2: string): number {
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
 * 智能字段映射：根据字段名称自动匹配
 */
function smartFieldMapping(fieldNames: string[]): Record<string, string> {
  const result: Record<string, string> = {
    fileName: '',
    fileSize: '',
    fileType: '',
    fileUrl: '',
    uploadTime: '',
  };

  // 文件名匹配关键词（增强）
  const fileNameKeywords = [
    '文件名', '文件名称', '文件', '名', '名称', '标题', 'title', 'name', 'filename',
    '商品名称', '产品名称', '物品名称', 'item_name', 'product_name'
  ];
  
  // 文件大小匹配关键词（增强）
  const fileSizeKeywords = [
    '文件大小', '文件尺寸', '大小', '尺寸', 'size', 'filesize',
    '商品大小', '产品大小', '容量', '容量大小'
  ];
  
  // 文件类型匹配关键词（增强）
  const fileTypeKeywords = [
    '文件类型', '文件格式', '类型', '格式', 'type', 'format', '后缀', 'ext',
    '商品类型', '产品类型', '分类', 'category'
  ];
  
  // 文件链接匹配关键词（增强）
  const fileUrlKeywords = [
    '文件链接', '链接地址', '链接', 'url', 'link', '地址', '网址',
    '图片链接', '图片地址', '图片URL', 'image_url', 'image_link',
    '商品链接', '产品链接', '商品地址', 'product_url'
  ];
  
  // 上传时间匹配关键词（增强）
  const uploadTimeKeywords = [
    '上传时间', '时间', '日期', 'date', 'time', '时间戳', 'timestamp',
    '创建时间', '创建日期', 'created_time', 'created_date',
    '更新时间', '更新日期', 'updated_time', 'updated_date'
  ];

  // 遍历所有字段，进行模糊匹配
  fieldNames.forEach(fieldName => {
    const lowerName = fieldName.toLowerCase();

    // 匹配文件名
    if (!result.fileName) {
      if (fileNameKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
        result.fileName = fieldName;
      }
    }

    // 匹配文件大小
    if (!result.fileSize) {
      if (fileSizeKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
        result.fileSize = fieldName;
      }
    }

    // 匹配文件类型
    if (!result.fileType) {
      if (fileTypeKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
        result.fileType = fieldName;
      }
    }

    // 匹配文件链接
    if (!result.fileUrl) {
      if (fileUrlKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
        result.fileUrl = fieldName;
      }
    }

    // 匹配上传时间
    if (!result.uploadTime) {
      if (uploadTimeKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()))) {
        result.uploadTime = fieldName;
      }
    }
  });

  console.log('🤖 [智能映射] 字段名称列表:', fieldNames);
  console.log('🤖 [智能映射] 映射结果:', result);
  
  return result;
}

/**
 * 智能匹配 Excel 列名到飞书字段名
 */
function findBestMatch(excelColumn: string, feishuFields: string[]): { field: string; similarity: number } | null {
  let bestMatch: { field: string; similarity: number } | null = null;
  
  // 1. 首先尝试精确匹配
  const exactMatch = feishuFields.find(field => field === excelColumn);
  if (exactMatch) {
    return { field: exactMatch, similarity: 1 };
  }
  
  // 2. 计算相似度，找到最佳匹配
  for (const feishuField of feishuFields) {
    const similarity = calculateSimilarity(excelColumn, feishuField);
    
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
 * 同步文件信息到飞书表格
 */
async function syncToFeishuSpreadsheet(
  accessToken: string,
  spreadsheetToken: string,
  sheetId: string | undefined,
  fileInfo: {
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    uploadTime: string;
  },
  excelData?: { columns: string[]; data: Record<string, any>[] }
): Promise<{ code: number; msg: string; apiCallCount: number; syncCount: number; fieldNames?: string[] }> {
  // API 调用次数统计
  let apiCallCount = 0;
  let syncCount = 0;
  // 计算文件大小（转换为 KB 或 MB）
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 使用传入的参数，如果没有传入则使用环境变量
  const token = spreadsheetToken || process.env.FEISHU_SPREADSHEET_TOKEN || '';
  let sheet = sheetId || process.env.FEISHU_SHEET_ID || '';

  console.log('📋 [同步参数]', {
    spreadsheetToken: token.substring(0, 10) + '...',
    sheetId: sheetId || '未提供',
    envSheetId: process.env.FEISHU_SHEET_ID || '未配置',
    最终使用sheet: sheet.substring(0, 10) + '...',
  });

  if (!token) {
    throw new Error('缺少 Spreadsheet Token');
  }

  // 如果没有指定工作表 ID，则获取第一个工作表
  if (!sheet) {
    try {
      sheet = await getFeishuTables(accessToken, token);
      console.log('⚠️ [同步] 未提供 sheetId，使用第一个工作表:', sheet.substring(0, 10) + '...');
    } catch (error) {
      console.error('获取工作表列表失败:', error);
      throw new Error('无法获取飞书工作表信息，请确保飞书多维表格有至少一个工作表');
    }
  } else {
    console.log('✅ [同步] 使用提供的 sheetId:', sheet.substring(0, 10) + '...');
  }

  // 获取工作表信息（用于显示工作表名称）
  try {
    const tableInfoResponse = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${token}/tables/${sheet}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const tableInfoData = await tableInfoResponse.json();
    if (tableInfoData.code === 0 && tableInfoData.data) {
      console.log('📊 [工作表信息] 工作表 ID:', sheet);
      console.log('📊 [工作表信息] 工作表名称:', tableInfoData.data.name);
      console.log('📊 [工作表信息] 工作表记录数:', tableInfoData.data.record_count);
    }
  } catch (error) {
    console.warn('⚠️ [工作表信息] 获取工作表信息失败:', error);
  }

  // 获取工作表的字段信息（包括字段类型）
  const fieldsResponse = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${token}/tables/${sheet}/fields`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );
  apiCallCount++; // 统计 API 调用

  const fieldsData = await fieldsResponse.json();
  if (fieldsData.code !== 0) {
    throw new Error(`获取字段信息失败: ${fieldsData.msg}`);
  }

  // 构建字段类型映射表：字段名 -> 字段类型
  const fieldTypeMap = new Map<string, number>();
  const fieldNames: string[] = [];
  
  console.log('📋 [飞书字段] 原始字段数据:', JSON.stringify(fieldsData.data.items, null, 2));
  
  fieldsData.data.items.forEach((field: any) => {
    // 优先使用 field_name，如果没有则使用 name
    const fieldName = field.field_name || field.name;
    console.log(`🔍 [飞书字段] 字段详情:`, {
      field_name: field.field_name,
      name: field.name,
      type: field.type,
      最终使用: fieldName
    });
    
    fieldTypeMap.set(fieldName, field.type);
    fieldNames.push(fieldName);
  });

  console.log('📋 [飞书字段] 最终字段名称列表:', fieldNames);
  console.log('🗺️ [飞书字段] 字段类型映射:', Array.from(fieldTypeMap.entries()));

  // 智能字段映射
  const fieldMapping = smartFieldMapping(fieldNames);

  // 使用智能映射构建数据
  const fields: Record<string, any> = {};

  // 处理文件名
  if (fieldMapping.fileName) {
    const fileNameField = fieldMapping.fileName;
    const fileNameFieldType = fieldTypeMap.get(fileNameField) || FEISHU_FIELD_TYPES.TEXT;
    fields[fileNameField] = convertValueByFieldType(fileInfo.fileName, fileNameFieldType);
  }

  // 处理文件大小
  if (fieldMapping.fileSize) {
    const fileSizeField = fieldMapping.fileSize;
    const fileSizeFieldType = fieldTypeMap.get(fileSizeField) || FEISHU_FIELD_TYPES.TEXT;
    fields[fileSizeField] = convertValueByFieldType(formatFileSize(fileInfo.fileSize), fileSizeFieldType);
  }

  // 处理文件类型
  if (fieldMapping.fileType) {
    const fileTypeField = fieldMapping.fileType;
    const fileTypeFieldType = fieldTypeMap.get(fileTypeField) || FEISHU_FIELD_TYPES.TEXT;
    fields[fileTypeField] = convertValueByFieldType(fileInfo.fileType, fileTypeFieldType);
  }

  // 处理文件链接
  if (fieldMapping.fileUrl) {
    const fileUrlField = fieldMapping.fileUrl;
    const linkFieldType = fieldTypeMap.get(fileUrlField) || FEISHU_FIELD_TYPES.TEXT;
    fields[fileUrlField] = convertValueByFieldType(fileInfo.fileUrl, linkFieldType);
  }

  // 处理上传时间
  if (fieldMapping.uploadTime) {
    const uploadTimeField = fieldMapping.uploadTime;
    const timeFieldType = fieldTypeMap.get(uploadTimeField) || FEISHU_FIELD_TYPES.TEXT;
    if (timeFieldType === FEISHU_FIELD_TYPES.DATE) {
      // 日期类型：使用毫秒级时间戳
      fields[uploadTimeField] = Date.now();
    } else {
      // 其他类型：使用格式化字符串
      fields[uploadTimeField] = convertValueByFieldType(fileInfo.uploadTime, timeFieldType);
    }
  }

  // 处理Excel数据（如果有）
  if (excelData && excelData.data.length > 0) {
    console.log('📊 [Excel] 开始处理Excel数据');
    console.log('📊 [Excel] Excel列名:', excelData.columns);
    console.log('📊 [Excel] 飞书表格字段名:', fieldNames);
    console.log('📊 [Excel] Excel数据行数:', excelData.data.length);
    
    // 详细的字段匹配分析
    console.log('🔍 [字段匹配分析] 开始详细匹配分析');
    console.log('📋 [Excel 列名列表]:', excelData.columns);
    console.log('📋 [飞书 字段列表]:', fieldNames);
    console.log('📊 [匹配对比]:');
    
    excelData.columns.forEach(excelColumn => {
      const exactMatch = fieldNames.find(fn => fn === excelColumn);
      if (exactMatch) {
        console.log(`✅ [字段匹配] "${excelColumn}" -> 精确匹配成功`);
      } else {
        // 查找可能相似的字段名
        const similarFields = fieldNames.filter(fn => {
          const cleanExcel = excelColumn.trim().toLowerCase();
          const cleanFeishu = fn.trim().toLowerCase();
          return cleanExcel === cleanFeishu || fn.includes(excelColumn) || excelColumn.includes(fn);
        });
        
        if (similarFields.length > 0) {
          console.log(`⚠️ [字段匹配] "${excelColumn}" 未精确匹配，但找到相似字段:`, similarFields);
        } else {
          console.log(`❌ [字段匹配] "${excelColumn}" 未找到匹配的字段`);
        }
      }
    });

    // 构建飞书表格 API URL（批量创建）
    const batchCreateUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${token}/tables/${sheet}/records/batch_create`;
    
    // 批量处理配置：每次最多处理 500 条记录（飞书限制）
    const BATCH_SIZE = 500;
    const records: any[] = [];
    
    // 遍历Excel的每一行数据，构建批量创建的记录
    for (let rowIndex = 0; rowIndex < excelData.data.length; rowIndex++) {
      const row = excelData.data[rowIndex];
      const rowFields: Record<string, any> = {};
      
      // 添加文件信息字段
      if (fieldMapping.fileName) {
        const fileNameField = fieldMapping.fileName;
        const fileNameFieldType = fieldTypeMap.get(fileNameField) || FEISHU_FIELD_TYPES.TEXT;
        rowFields[fileNameField] = convertValueByFieldType(fileInfo.fileName, fileNameFieldType);
      }
      if (fieldMapping.fileSize) {
        const fileSizeField = fieldMapping.fileSize;
        const fileSizeFieldType = fieldTypeMap.get(fileSizeField) || FEISHU_FIELD_TYPES.TEXT;
        rowFields[fileSizeField] = convertValueByFieldType(formatFileSize(fileInfo.fileSize), fileSizeFieldType);
      }
      if (fieldMapping.fileType) {
        const fileTypeField = fieldMapping.fileType;
        const fileTypeFieldType = fieldTypeMap.get(fileTypeField) || FEISHU_FIELD_TYPES.TEXT;
        rowFields[fileTypeField] = convertValueByFieldType(fileInfo.fileType, fileTypeFieldType);
      }
      if (fieldMapping.fileUrl) {
        const fileUrlField = fieldMapping.fileUrl;
        const linkFieldType = fieldTypeMap.get(fileUrlField) || FEISHU_FIELD_TYPES.TEXT;
        rowFields[fileUrlField] = convertValueByFieldType(fileInfo.fileUrl, linkFieldType);
      }
      if (fieldMapping.uploadTime) {
        const uploadTimeField = fieldMapping.uploadTime;
        const timeFieldType = fieldTypeMap.get(uploadTimeField) || FEISHU_FIELD_TYPES.TEXT;
        if (timeFieldType === FEISHU_FIELD_TYPES.DATE) {
          // 日期类型：使用毫秒级时间戳
          rowFields[uploadTimeField] = Date.now();
        } else {
          // 其他类型：使用格式化字符串
          rowFields[uploadTimeField] = convertValueByFieldType(fileInfo.uploadTime, timeFieldType);
        }
      }

      // 遍历Excel的每一列，匹配到飞书字段
      excelData.columns.forEach(excelColumn => {
        // 使用智能匹配算法
        const matchResult = findBestMatch(excelColumn, fieldNames);
        const feishuField = matchResult?.field;
        const similarity = matchResult?.similarity || 0;
        
        console.log(`🔍 [字段匹配检查] Excel字段: "${excelColumn}" | 飞书字段: "${feishuField || 'undefined'}" | 相似度: ${(similarity * 100).toFixed(1)}% | 匹配: ${feishuField ? '✅' : '❌'}`);
        
        if (feishuField && similarity > 0.6) {
          const value = row[excelColumn];
          
          if (value !== null && value !== undefined && value !== '') {
            console.log(`📊 [Excel] 第${rowIndex + 1}行 匹配字段: ${excelColumn} -> ${feishuField} = ${value}`);
            
            // 获取飞书字段类型
            const fieldType = fieldTypeMap.get(feishuField);
            const fieldTypeName = fieldType !== undefined ? Object.keys(FEISHU_FIELD_TYPES).find(key => FEISHU_FIELD_TYPES[key as keyof typeof FEISHU_FIELD_TYPES] === fieldType) : '未知';
            console.log(`🔧 [字段类型] 字段 "${feishuField}" 类型: ${fieldType} (${fieldTypeName || '未知'})`);
            
            // 使用新的字段类型转换函数
            try {
              const convertedValue = convertValueByFieldType(value, fieldType || FEISHU_FIELD_TYPES.TEXT);
              rowFields[feishuField] = convertedValue;
              console.log(`✅ [数据转换] ${excelColumn} (${typeof value}) -> ${feishuField} (${typeof convertedValue}):`, convertedValue);
            } catch (error) {
              console.error(`❌ [数据转换] 字段 ${excelColumn} 转换失败:`, error);
              // 转换失败时使用默认字符串
              rowFields[feishuField] = String(value);
            }
          }
        }
      });

      // 将该行数据添加到批量创建的记录中
      if (Object.keys(rowFields).length > 0) {
        records.push({ fields: rowFields });
      } else {
        console.warn(`⚠️ [同步] 第${rowIndex + 1}行没有匹配的字段，跳过`);
      }
    }
    
    console.log(`📦 [批量创建] 准备创建 ${records.length} 条记录`);

    // 分批创建记录（每批最多 500 条）
    let successCount = 0;
    let failCount = 0;
    for (let batchStart = 0; batchStart < records.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, records.length);
      const batchRecords = records.slice(batchStart, batchEnd);
      
      console.log(`📦 [批量创建] 正在处理第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批 (${batchStart + 1}-${batchEnd} 条)`);
      
      try {
        const response = await fetch(batchCreateUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ records: batchRecords }),
        });
        apiCallCount++; // 统计 API 调用

        const data = await response.json();
        if (data.code !== 0) {
          console.error(`❌ [批量创建] 第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批飞书返回错误:`, data);
          throw new Error(`批量创建失败: ${data.msg} (code: ${data.code})`);
        }
        
        // 统计成功和失败的记录数
        if (data.data?.records) {
          successCount += data.data.records.filter((r: any) => !r.error).length;
          failCount += data.data.records.filter((r: any) => r.error).length;
        }
        
        console.log(`✅ [批量创建] 第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批成功创建 ${batchEnd - batchStart} 条记录`);
      } catch (error) {
        console.error(`❌ [批量创建] 第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批失败:`, error);
        throw new Error(`批量创建失败（第 ${Math.floor(batchStart / BATCH_SIZE) + 1} 批）: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    syncCount = successCount;
    console.log(`✅ [同步] Excel数据批量同步完成，成功 ${successCount} 条，失败 ${failCount} 条`);
    console.log(`📊 [API统计] 飞书API调用次数: ${apiCallCount}, 实际同步成功行数: ${syncCount}`);
    return { 
      code: 0, 
      msg: `成功同步 ${syncCount} 行数据`,
      apiCallCount: apiCallCount,
      syncCount: syncCount
    };
  }

  // 如果没有Excel数据，返回统计信息
  console.log(`📊 [API统计] 飞书API调用次数: ${apiCallCount}, 实际同步行数: ${syncCount}`);
  return { 
    code: 0, 
    msg: '文件上传成功（无Excel数据）',
    apiCallCount: apiCallCount,
    syncCount: syncCount
  };
}

/**
 * POST 处理文件上传
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [开始处理上传请求]', new Date().toISOString());
    console.log('🚀 [版本检查] 代码已更新 - 2025-02-23');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const spreadsheetToken = formData.get('spreadsheetToken') as string | null;
    const sheetId = formData.get('sheetId') as string | null;
    const sheetNameParam = formData.get('sheetName') as string | null; // 新增：指定的Sheet名称
    const appId = formData.get('appId') as string | null; // 新增：用户提供的飞书 App ID
    const appSecret = formData.get('appSecret') as string | null; // 新增：用户提供的飞书 App Secret

    console.log('📦 [请求参数]', {
      fileName: file?.name,
      fileSize: file?.size,
      spreadsheetToken: spreadsheetToken?.substring(0, 10) + '...',
      sheetId: sheetId?.substring(0, 10) + '...',
      sheetName: sheetNameParam,
      userAppId: appId?.substring(0, 10) + '...',
      hasUserAppSecret: !!appSecret,
    });

    if (!file) {
      console.error('❌ [参数验证] 未找到文件');
      return NextResponse.json(
        { error: '未找到文件' },
        { status: 400 }
      );
    }

    // 读取文件内容
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 上传到对象存储（可能失败，不影响后续流程）
    let fileKey = '';
    let fileUrl = '';
    try {
      fileKey = await storage.uploadFile({
        fileContent: buffer,
        fileName: file.name,
        contentType: file.type,
      });

      // 生成签名 URL
      fileUrl = await storage.generatePresignedUrl({
        key: fileKey,
        expireTime: 86400 * 30, // 30 天有效期
      });
      console.log('✅ [S3] 文件上传成功:', fileKey);
    } catch (error) {
      console.warn('⚠️ [S3] 文件上传失败，使用本地文件路径:', error);
      // S3 上传失败时，使用占位符 URL
      fileUrl = `file://${file.name}`;
    }

    // 上传时间
    const uploadTime = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // 如果是Excel文件，读取Excel内容
    let excelData: { columns: string[]; data: Record<string, any>[] } | undefined;
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      console.log('📊 [Excel] 检测到Excel文件，开始读取内容');
      try {
        excelData = readExcelContent(buffer, sheetNameParam || undefined);
        console.log('📊 [Excel] Excel数据读取成功');
      } catch (error) {
        console.warn('⚠️ [Excel] 读取Excel文件失败，跳过Excel数据同步:', error);
      }
    }

    // 同步到飞书表格
    let syncResult = null;
    let syncError = null;

    // 检查飞书配置
    if (appId && appSecret && (spreadsheetToken || process.env.FEISHU_SPREADSHEET_TOKEN)) {
      try {
        // 使用用户配置获取访问令牌
        const accessToken = await getFeishuAccessToken(appId, appSecret);
        
        // 获取字段信息用于调试
        const token = spreadsheetToken || process.env.FEISHU_SPREADSHEET_TOKEN || '';
        const sheet = sheetId || process.env.FEISHU_SHEET_ID || '';
        let actualSheetId = sheet;
        
        if (!actualSheetId) {
          actualSheetId = await getFeishuTables(accessToken, token);
        }
        
        const fieldsResponse = await fetch(
          `https://open.feishu.cn/open-apis/bitable/v1/apps/${token}/tables/${actualSheetId}/fields`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        const fieldsData = await fieldsResponse.json();
        let actualFieldNames: string[] = [];
        if (fieldsData.code === 0 && fieldsData.data?.items) {
          actualFieldNames = fieldsData.data.items.map((f: any) => f.field_name || f.name);
          console.log('📋 [飞书字段] 实际字段列表:', actualFieldNames);
        }
        
        syncResult = await syncToFeishuSpreadsheet(accessToken, spreadsheetToken || '', sheetId || undefined, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          fileUrl,
          uploadTime,
        }, excelData);
        
        // 添加字段信息到返回结果
        syncResult.fieldNames = actualFieldNames;
      } catch (error) {
        console.error('同步到飞书表格失败:', error);
        syncError = error instanceof Error ? error.message : '未知错误';
      }
    } else {
      console.warn('飞书配置缺失，跳过同步到飞书表格');
      syncError = '请先配置飞书多维表格链接';
    }

    return NextResponse.json({
      success: true,
      fileKey,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadTime,
      syncResult: syncResult ? {
        msg: syncResult.msg,
        apiCallCount: syncResult.apiCallCount,
        syncCount: syncResult.syncCount,
        fieldNames: syncResult.fieldNames
      } : null,
      syncError,
    });

  } catch (error) {
    console.error('❌ [文件上传失败]', error);
    console.error('❌ [错误详情]', {
      message: error instanceof Error ? error.message : '未知错误',
      stack: error instanceof Error ? error.stack : '无堆栈',
      timestamp: new Date().toISOString(),
    });
    console.error('❌ [环境变量状态]', {
      COZE_BUCKET_NAME: process.env.coze_bucket_name ? '已配置' : '未配置',
    });
    return NextResponse.json(
      {
        error: '文件上传失败',
        details: error instanceof Error ? error.message : '未知错误',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

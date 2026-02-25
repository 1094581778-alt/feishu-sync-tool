/**
 * 飞书添加字段API路由
 * 添加新字段到飞书多维表格
 * 使用统一的FeishuClient和错误处理系统
 */

import { NextRequest } from 'next/server';
import {
  parseFeishuRequest,
  validateAppConfig,
  createApiFeishuClient,
  transformFeishuField,
  withApiHandler,
  withRequestLogging,
} from '@/services/feishu/api-utils';
import { convertFieldType, FieldType } from '@/services/feishu/types';

/**
 * 验证字段名称是否符合飞书规范
 */
function validateFieldName(fieldName: string): { valid: boolean; error?: string } {
  if (!fieldName || fieldName.trim().length === 0) {
    return { valid: false, error: '字段名称不能为空' };
  }

  const trimmedName = fieldName.trim();

  // 飞书字段名称限制：1-64个字符
  if (trimmedName.length > 64) {
    return { valid: false, error: '字段名称不能超过64个字符' };
  }

  // 检查是否包含不允许的字符
  const invalidChars = /[<>:"\/\\|?*\x00-\x1F]/;
  if (invalidChars.test(trimmedName)) {
    return { valid: false, error: '字段名称包含非法字符' };
  }

  // 检查是否以空格开头或结尾
  if (trimmedName !== fieldName) {
    return { valid: false, error: '字段名称不能以空格开头或结尾' };
  }

  return { valid: true };
}

/**
 * POST 添加新字段到飞书工作表
 */
export async function POST(request: NextRequest) {
  const logger = withRequestLogging(request, 'POST /api/feishu/add-field');
  
  return withApiHandler(async (req: NextRequest) => {
    // 解析请求
    const { body, appConfig, spreadsheetToken, tableId } = await parseFeishuRequest(req);
    const { fieldName, fieldType = 'text' } = body;
    
    // 验证必需参数
    if (!spreadsheetToken) {
      throw new Error('缺少必需参数: token');
    }
    
    if (!tableId) {
      throw new Error('缺少必需参数: tableId');
    }
    
    if (!fieldName) {
      throw new Error('缺少必需参数: fieldName');
    }
    
    // 验证字段名称
    const validation = validateFieldName(fieldName);
    if (!validation.valid) {
      throw new Error(`字段名称验证失败: ${validation.error}`);
    }
    
    // 验证应用配置
    const validAppConfig = validateAppConfig(appConfig);
    
    // 创建飞书客户端
    const client = createApiFeishuClient(validAppConfig);
    
    // 先检查字段是否已存在
    const existingFields = await client.getFields(spreadsheetToken, tableId, {
      appConfig: validAppConfig,
    });
    
    const fieldExists = existingFields.some(field => 
      field.field_name === fieldName || field.field_name?.toLowerCase() === fieldName.toLowerCase()
    );
    
    if (fieldExists) {
      throw new Error(`字段 "${fieldName}" 已存在`);
    }
    
    // 构建字段创建请求体
    const requestBody = {
      field_name: fieldName,
      type: convertFieldType(fieldType),
      // 为数字字段添加格式设置，保留2位小数
      property: fieldType === 'number' ? { formatter: '0.00' } : undefined,
    };
    
    // 创建新字段
    const field = await client.createField(spreadsheetToken, tableId, requestBody, {
      appConfig: validAppConfig,
    });
    
    // 转换数据格式
    const transformedField = transformFeishuField(field);
    
    logger.end(true, { fieldId: transformedField.id });
    
    return {
      field: transformedField,
    };
  }, request, '添加飞书字段');
}
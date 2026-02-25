/**
 * 飞书记录API路由
 * 获取飞书多维表格的记录数据
 * 使用统一的FeishuClient和错误处理系统
 */

import { NextRequest } from 'next/server';
import {
  parseFeishuRequest,
  validateAppConfig,
  createApiFeishuClient,
  transformFeishuField,
  transformFeishuRecord,
  withApiHandler,
  withRequestLogging,
  parsePaginationParams,
} from '@/services/feishu/api-utils';

/**
 * POST 获取飞书工作表的记录数据
 */
export async function POST(request: NextRequest) {
  const logger = withRequestLogging(request, 'POST /api/feishu/records');
  
  return withApiHandler(async (req: NextRequest) => {
    // 解析请求
    const { body, appConfig, spreadsheetToken, tableId } = await parseFeishuRequest(req);
    
    // 验证必需参数
    if (!spreadsheetToken) {
      throw new Error('缺少必需参数: token');
    }
    
    if (!tableId) {
      throw new Error('缺少必需参数: tableId');
    }
    
    // 验证应用配置
    const validAppConfig = validateAppConfig(appConfig);
    
    // 解析分页参数
    const paginationParams = parsePaginationParams(body);
    
    // 创建飞书客户端
    const client = createApiFeishuClient(validAppConfig);
    
    // 获取字段列表（用于字段映射）
    const fields = await client.getFields(spreadsheetToken, tableId, {
      appConfig: validAppConfig,
    });
    
    // 构建字段映射（字段ID -> 字段名）
    const fieldMap = new Map<string, string>();
    fields.forEach(field => {
      if (field.id && field.field_name) {
        fieldMap.set(field.id, field.field_name);
      }
    });
    
    // 获取记录列表
    const records = await client.getRecords(spreadsheetToken, tableId, {
      appConfig: validAppConfig,
      query: {
        pageSize: paginationParams.pageSize,
        pageToken: paginationParams.pageToken,
      },
    });
    
    // 转换数据格式
    const transformedFields = fields.map(transformFeishuField);
    const transformedRecords = records.map(record => 
      transformFeishuRecord(record, fieldMap)
    );
    
    logger.end(true, { 
      fieldCount: transformedFields.length,
      recordCount: transformedRecords.length,
    });
    
    return {
      fields: transformedFields,
      records: transformedRecords,
    };
  }, request, '获取飞书记录');
}
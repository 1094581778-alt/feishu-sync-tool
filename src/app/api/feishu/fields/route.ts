/**
 * 飞书字段API路由
 * 获取飞书多维表格的字段列表
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

/**
 * POST 获取飞书工作表的字段信息
 */
export async function POST(request: NextRequest) {
  const logger = withRequestLogging(request, 'POST /api/feishu/fields');
  
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
    
    // 创建飞书客户端
    const client = createApiFeishuClient(validAppConfig);
    
    // 获取字段列表
    const fields = await client.getFields(spreadsheetToken, tableId, {
      appConfig: validAppConfig,
    });
    
    // 转换数据格式
    const transformedFields = fields.map(transformFeishuField);
    
    logger.end(true, { fieldCount: transformedFields.length });
    
    return {
      fields: transformedFields,
    };
  }, request, '获取飞书字段列表');
}
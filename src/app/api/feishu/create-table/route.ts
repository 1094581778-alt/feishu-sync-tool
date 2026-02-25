/**
 * 飞书创建表格API路由
 * 创建新的飞书多维表格工作表
 * 使用统一的FeishuClient和错误处理系统
 */

import { NextRequest } from 'next/server';
import {
  parseFeishuRequest,
  validateAppConfig,
  createApiFeishuClient,
  transformFeishuTable,
  withApiHandler,
  withRequestLogging,
} from '@/services/feishu/api-utils';
import type { CreateTableRequest } from '@/services/feishu/types';

/**
 * POST 创建新的飞书工作表
 */
export async function POST(request: NextRequest) {
  const logger = withRequestLogging(request, 'POST /api/feishu/create-table');
  
  return withApiHandler(async (req: NextRequest) => {
    // 解析请求
    const { body, appConfig, spreadsheetToken } = await parseFeishuRequest(req);
    const { tableName } = body;
    
    // 验证必需参数
    if (!spreadsheetToken) {
      throw new Error('缺少必需参数: token');
    }
    
    if (!tableName) {
      throw new Error('缺少必需参数: tableName');
    }
    
    // 验证应用配置
    const validAppConfig = validateAppConfig(appConfig);
    
    // 创建飞书客户端
    const client = createApiFeishuClient(validAppConfig);
    
    // 创建表格请求体
    const createRequest: CreateTableRequest = {
      name: tableName,
      default_view: {
        type: 'grid' as const,
      },
    };
    
    // 创建表格
    const table = await client.createTable(spreadsheetToken, createRequest, {
      appConfig: validAppConfig,
    });
    
    // 转换数据格式
    const transformedTable = transformFeishuTable(table);
    
    logger.end(true, { tableId: transformedTable.id });
    
    return {
      table: transformedTable,
    };
  }, request, '创建飞书表格');
}
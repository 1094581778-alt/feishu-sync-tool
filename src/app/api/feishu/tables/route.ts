/**
 * 飞书表格API路由
 * 获取飞书多维表格的工作表列表
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

/**
 * POST 获取飞书多维表格的所有工作表列表
 */
export async function POST(request: NextRequest) {
  const logger = withRequestLogging(request, 'POST /api/feishu/tables');
  
  return withApiHandler(async (req: NextRequest) => {
    // 解析请求
    const { body, appConfig, spreadsheetToken } = await parseFeishuRequest(req);
    
    // 验证必需参数
    if (!spreadsheetToken) {
      throw new Error('缺少必需参数: token');
    }
    
    // 验证应用配置
    const validAppConfig = validateAppConfig(appConfig);
    
    // 创建飞书客户端
    const client = createApiFeishuClient(validAppConfig);
    
    // 获取表格列表
    const tables = await client.getTables(spreadsheetToken, {
      appConfig: validAppConfig,
    });
    
    // 转换数据格式
    const transformedTables = tables.map(transformFeishuTable);
    
    logger.end(true, { tableCount: transformedTables.length });
    
    return {
      tables: transformedTables,
    };
  }, request, '获取飞书表格列表');
}

/**
 * GET 获取飞书多维表格的所有工作表列表
 * 保持向后兼容性
 */
export async function GET(request: NextRequest) {
  const logger = withRequestLogging(request, 'GET /api/feishu/tables');
  
  return withApiHandler(async (req: NextRequest) => {
    const searchParams = req.nextUrl.searchParams;
    const spreadsheetToken = searchParams.get('token');
    const appId = searchParams.get('appId');
    const appSecret = searchParams.get('appSecret');
    
    // 验证必需参数
    if (!spreadsheetToken) {
      throw new Error('缺少必需参数: token');
    }
    
    if (!appId || !appSecret) {
      throw new Error('飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret');
    }
    
    // 创建应用配置
    const appConfig = { appId, appSecret };
    
    // 创建飞书客户端
    const client = createApiFeishuClient(appConfig);
    
    // 获取表格列表
    const tables = await client.getTables(spreadsheetToken, {
      appConfig,
    });
    
    // 转换数据格式
    const transformedTables = tables.map(transformFeishuTable);
    
    logger.end(true, { tableCount: transformedTables.length });
    
    return {
      tables: transformedTables,
    };
  }, request, 'GET获取飞书表格列表');
}
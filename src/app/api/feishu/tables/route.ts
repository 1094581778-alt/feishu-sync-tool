import { NextRequest, NextResponse } from 'next/server';

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
 * POST 获取飞书多维表格的所有工作表列表（替代 GET，避免代理问题）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const spreadsheetToken = body.token;
    const appId = body.appId;
    const appSecret = body.appSecret;

    console.log('🔍 [服务器 API] 收到 POST 请求');
    console.log('🔍 [服务器 API] 完整 URL:', request.url);
    console.log('🔍 [服务器 API] body:', body);
    console.log('🔍 [服务器 API] spreadsheetToken:', spreadsheetToken);

    if (!spreadsheetToken) {
      console.error('❌ [服务器 API] 缺少 spreadsheetToken 参数');
      return NextResponse.json(
        { error: '缺少 spreadsheetToken 参数' },
        { status: 400 }
      );
    }

    // 检查飞书配置
    if (!appId || !appSecret) {
      console.error('❌ [服务器 API] 飞书配置缺失');
      return NextResponse.json(
        { error: '飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret' },
        { status: 400 }
      );
    }

    // 获取访问令牌（使用用户配置或环境变量）
    const accessToken = await getFeishuAccessToken(appId, appSecret);

    // 获取工作表列表
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${spreadsheetToken}/tables`,
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
      return NextResponse.json(
        { error: `获取工作表列表失败: ${data.msg}`, code: data.code },
        { status: 500 }
      );
    }

    // 返回工作表列表
    return NextResponse.json({
      success: true,
      tables: data.data.items.map((table: any) => ({
        id: table.table_id,
        name: table.name,
      })),
    });

  } catch (error) {
    console.error('获取工作表列表失败:', error);
    return NextResponse.json(
      {
        error: '获取工作表列表失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * GET 获取飞书多维表格的所有工作表列表
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const spreadsheetToken = searchParams.get('token');
    const appId = searchParams.get('appId');
    const appSecret = searchParams.get('appSecret');

    // 添加详细日志
    console.log('🔍 [服务器 API] 收到 GET 请求');
    console.log('🔍 [服务器 API] 完整 URL:', request.url);
    console.log('🔍 [服务器 API] searchParams:', Object.fromEntries(searchParams));
    console.log('🔍 [服务器 API] spreadsheetToken:', spreadsheetToken);

    if (!spreadsheetToken) {
      console.error('❌ [服务器 API] 缺少 spreadsheetToken 参数');
      return NextResponse.json(
        { error: '缺少 spreadsheetToken 参数' },
        { status: 400 }
      );
    }

    // 检查飞书配置
    if (!appId || !appSecret) {
      console.error('❌ [服务器 API] 飞书配置缺失');
      return NextResponse.json(
        { error: '飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret' },
        { status: 400 }
      );
    }

    // 获取访问令牌
    const accessToken = await getFeishuAccessToken(appId!, appSecret!);

    // 获取工作表列表
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${spreadsheetToken}/tables`,
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
      return NextResponse.json(
        { error: `获取工作表列表失败: ${data.msg}`, code: data.code },
        { status: 500 }
      );
    }

    // 返回工作表列表
    return NextResponse.json({
      success: true,
      tables: data.data.items.map((table: any) => ({
        id: table.table_id,
        name: table.name,
      })),
    });

  } catch (error) {
    console.error('获取工作表列表失败:', error);
    return NextResponse.json(
      {
        error: '获取工作表列表失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

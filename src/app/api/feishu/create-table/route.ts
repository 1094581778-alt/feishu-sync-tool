import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取飞书访问令牌
 */
async function getFeishuAccessToken(appId: string, appSecret: string): Promise<string> {
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
 * POST 创建新的飞书工作表
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, tableName, appId, appSecret } = body;

    console.log('🔍 [新建工作表 API] 收到请求');
    console.log('🔍 [新建工作表 API] spreadsheetToken:', token);
    console.log('🔍 [新建工作表 API] tableName:', tableName);

    if (!token) {
      console.error('❌ [新建工作表 API] 缺少 token 参数');
      return NextResponse.json(
        { error: '缺少 spreadsheetToken 参数' },
        { status: 400 }
      );
    }

    if (!tableName) {
      console.error('❌ [新建工作表 API] 缺少 tableName 参数');
      return NextResponse.json(
        { error: '缺少 tableName 参数' },
        { status: 400 }
      );
    }

    if (!appId || !appSecret) {
      console.error('❌ [新建工作表 API] 飞书配置缺失');
      return NextResponse.json(
        { error: '飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret' },
        { status: 400 }
      );
    }

    const accessToken = await getFeishuAccessToken(appId, appSecret);

    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${token}/tables`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: {
            name: tableName,
            default_view: {
              type: 'grid',
            },
          },
        }),
      }
    );

    const data = await response.json();

    console.log('🔍 [新建工作表 API] 飞书API返回数据:', JSON.stringify(data, null, 2));

    if (data.code !== 0) {
      console.error('❌ [新建工作表 API] 创建工作表失败:', data);
      return NextResponse.json(
        { error: `创建工作表失败: ${data.msg}`, code: data.code },
        { status: 500 }
      );
    }

    console.log('✅ [新建工作表 API] 工作表创建成功:', data.data.table_id);

    return NextResponse.json({
      success: true,
      table: {
        id: data.data.table_id,
        name: data.data.name,
      },
    });

  } catch (error) {
    console.error('❌ [新建工作表 API] 创建工作表失败:', error);
    return NextResponse.json(
      {
        error: '创建工作表失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * 获取飞书访问令牌
 */
async function getFeishuAccessToken(appId: string, appSecret: string): Promise<string> {
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
  return data.tenant_access_token;
}

/**
 * POST 添加新字段到飞书工作表
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const spreadsheetToken = body.token;
    const tableId = body.tableId;
    const fieldName = body.fieldName;
    const fieldType = body.fieldType || 'text';
    const appId = body.appId;
    const appSecret = body.appSecret;

    if (!spreadsheetToken || !tableId || !fieldName) {
      return NextResponse.json(
        { error: '缺少必需参数：token、tableId 和 fieldName' },
        { status: 400 }
      );
    }

    if (!appId || !appSecret) {
      return NextResponse.json(
        { error: '飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret' },
        { status: 400 }
      );
    }

    // 获取访问令牌
    const accessToken = await getFeishuAccessToken(appId, appSecret);

    // 创建新字段
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/fields`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field_name: fieldName,
          type: fieldType,
        }),
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json(
        { error: `添加字段失败: ${data.msg}`, code: data.code },
        { status: 500 }
      );
    }

    // 返回新创建的字段信息
    return NextResponse.json({
      success: true,
      field: {
        id: data.data.field.field_id,
        name: data.data.field.field_name,
        type: data.data.field.type,
      },
    });

  } catch (error) {
    console.error('添加字段失败:', error);
    return NextResponse.json(
      {
        error: '添加字段失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}
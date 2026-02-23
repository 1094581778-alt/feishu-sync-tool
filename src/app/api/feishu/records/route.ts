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
 * POST 获取飞书工作表的记录数据
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const spreadsheetToken = body.token;
    const tableId = body.tableId;
    const pageSize = body.pageSize || '10';
    const appId = body.appId;
    const appSecret = body.appSecret;

    if (!spreadsheetToken || !tableId) {
      return NextResponse.json(
        { error: '缺少必需参数：token 和 tableId' },
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

    // 获取工作表字段信息
    const fieldsResponse = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/fields`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const fieldsData = await fieldsResponse.json();

    if (fieldsData.code !== 0) {
      return NextResponse.json(
        { error: `获取字段信息失败: ${fieldsData.msg}` },
        { status: 500 }
      );
    }

    // 获取工作表记录
    const recordsResponse = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/records?page_size=${pageSize}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const recordsData = await recordsResponse.json();

    if (recordsData.code !== 0) {
      return NextResponse.json(
        { error: `获取记录失败: ${recordsData.msg}` },
        { status: 500 }
      );
    }

    // 构建字段映射（字段ID -> 字段名）
    const fieldMap = new Map();
    fieldsData.data.items.forEach((field: any) => {
      fieldMap.set(field.field_id, field.field_name);
    });

    // 格式化记录数据
    const formattedRecords = recordsData.data.items.map((record: any) => {
      const formatted: any = {};
      Object.entries(record.fields).forEach(([fieldId, value]) => {
        const fieldName = fieldMap.get(fieldId) || fieldId;
        formatted[fieldName] = value;
      });
      return formatted;
    });

    return NextResponse.json({
      success: true,
      fields: fieldsData.data.items.map((field: any) => ({
        id: field.field_id,
        name: field.field_name,
        type: field.type,
      })),
      records: formattedRecords,
      total: recordsData.data.total,
      pageToken: recordsData.data.page_token,
    });

  } catch (error) {
    console.error('获取记录失败:', error);
    return NextResponse.json(
      {
        error: '获取记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

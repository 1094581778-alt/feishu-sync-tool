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
 * 飞书字段类型映射
 */
const FEISHU_FIELD_TYPES = {
  text: 1,           // 文本
  number: 2,         // 数字
  singleSelect: 3,    // 单选
  multiSelect: 4,     // 多选
  date: 5,           // 日期
  checkbox: 7,        // 复选框
  url: 13,           // 超链接
  email: 14,          // 邮箱
  phone: 15,         // 电话号码
  currency: 16,       // 货币
  percent: 17,        // 百分比
  rating: 18,        // 评分
  datetime: 19,       // 日期时间
  user: 20,          // 人员
  group: 21,          // 群组
  attachment: 22,      // 附件
  lookup: 23,         // 查找引用
  formula: 24,        // 公式
  relation: 25,       // 双向关联
  oneWayLink: 26,     // 单向关联
  location: 27,       // 地理位置
  createdTime: 28,    // 创建时间
  modifiedTime: 29,    // 修改时间
  createdUser: 30,     // 创建人
  modifiedUser: 31,     // 修改人
  autoNumber: 32,     // 自动编号
  progress: 33,       // 进度
  department: 34,     // 部门
  textArea: 15,        // 多行文本
};

/**
 * 将字段类型转换为飞书 API 格式
 */
function convertFieldType(fieldType: string): number {
  return FEISHU_FIELD_TYPES[fieldType as keyof typeof FEISHU_FIELD_TYPES] || 1; // 默认为文本类型
}

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

    // 验证字段名称
    const validation = validateFieldName(fieldName);
    if (!validation.valid) {
      return NextResponse.json(
        { error: `字段名称验证失败: ${validation.error}` },
        { status: 400 }
      );
    }

    // 获取访问令牌
    const accessToken = await getFeishuAccessToken(appId, appSecret);

    // 先检查字段是否已存在
    const checkResponse = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/fields`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const checkData = await checkResponse.json();

    if (checkData.code === 0) {
      const existingFields = checkData.data.items || [];
      const fieldExists = existingFields.some((field: any) => 
        field.field_name === fieldName || field.field_name.toLowerCase() === fieldName.toLowerCase()
      );

      if (fieldExists) {
        return NextResponse.json(
          { error: `字段 "${fieldName}" 已存在` },
          { status: 409 }
        );
      }
    }

    // 构建字段创建请求体
    const requestBody: any = {
      field_name: fieldName,
      type: convertFieldType(fieldType),
    };

    // 为数字字段添加格式设置，保留2位小数
    if (fieldType === 'number') {
      requestBody.property = {
        formatter: '0.00', // 保留2位小数
      };
    }

    // 创建新字段
    const response = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${spreadsheetToken}/tables/${tableId}/fields`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (data.code !== 0) {
      return NextResponse.json(
        { 
          error: `添加字段失败: ${data.msg}`, 
          code: data.code,
          details: data 
        },
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
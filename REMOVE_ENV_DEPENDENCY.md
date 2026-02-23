# 移除环境变量依赖，强制使用用户配置

## 修改原因

用户反馈：重新部署后出现 500 错误，提示"文件上传失败"。

根本原因：代码中使用了环境变量作为默认配置，但在部署环境中环境变量可能未正确加载，导致飞书 API 调用失败。

## 解决方案

**移除所有对环境变量的依赖，强制要求用户通过界面配置飞书凭证。**

## 修改内容

### 1. 后端 API 修改

#### 1.1 `src/app/api/upload/route.ts`

**修改前**：
```typescript
// 飞书配置（环境变量，作为后备配置）
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || '';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '';

async function getFeishuAccessToken(appId?: string, appSecret?: string): Promise<string> {
  // 优先使用传入的配置，否则使用环境变量
  const finalAppId = appId || FEISHU_APP_ID;
  const finalAppSecret = appSecret || FEISHU_APP_SECRET;
  // ...
}
```

**修改后**：
```typescript
// 注意：不再使用环境变量作为默认值，用户必须通过界面或请求参数提供凭证

async function getFeishuAccessToken(appId?: string, appSecret?: string): Promise<string> {
  // 必须提供飞书凭证
  if (!appId || !appSecret) {
    throw new Error('飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret');
  }
  // ...
}
```

#### 1.2 `src/app/api/feishu/tables/route.ts`

**修改前**：
```typescript
// 飞书配置（环境变量作为后备）
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || '';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '';

async function getFeishuAccessToken(appId?: string, appSecret?: string): Promise<string> {
  // 优先使用传入的配置，否则使用环境变量
  const finalAppId = appId || FEISHU_APP_ID;
  const finalAppSecret = appSecret || FEISHU_APP_SECRET;
  // ...
}
```

**修改后**：
```typescript
async function getFeishuAccessToken(appId?: string, appSecret?: string): Promise<string> {
  // 必须提供飞书凭证
  if (!appId || !appSecret) {
    throw new Error('飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret');
  }
  // ...
}
```

#### 1.3 `src/app/api/feishu/fields/route.ts`

**修改前**：
```typescript
// 飞书配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || '';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '';

async function getFeishuAccessToken(): Promise<string> {
  const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }),
  });
  // ...
}

export async function POST(request: NextRequest) {
  // ...
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    return NextResponse.json(
      { error: '飞书配置缺失' },
      { status: 500 }
    );
  }
  // ...
  const accessToken = await getFeishuAccessToken();
  // ...
}
```

**修改后**：
```typescript
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
  // ...
}

export async function POST(request: NextRequest) {
  // ...
  const appId = body.appId;
  const appSecret = body.appSecret;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: '飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret' },
      { status: 400 }
    );
  }
  // ...
  const accessToken = await getFeishuAccessToken(appId, appSecret);
  // ...
}
```

#### 1.4 `src/app/api/feishu/records/route.ts`

**修改前**：
```typescript
// 飞书配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || '';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET || '';

async function getFeishuAccessToken(): Promise<string> {
  // ... 使用 FEISHU_APP_ID 和 FEISHU_APP_SECRET
}

export async function POST(request: NextRequest) {
  // ...
  if (!FEISHU_APP_ID || !FEISHU_APP_SECRET) {
    return NextResponse.json(
      { error: '飞书配置缺失' },
      { status: 500 }
    );
  }
  // ...
  const accessToken = await getFeishuAccessToken();
  // ...
}
```

**修改后**：
```typescript
async function getFeishuAccessToken(appId: string, appSecret: string): Promise<string> {
  // ... 使用 appId 和 appSecret 参数
}

export async function POST(request: NextRequest) {
  // ...
  const appId = body.appId;
  const appSecret = body.appSecret;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: '飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret' },
      { status: 400 }
    );
  }
  // ...
  const accessToken = await getFeishuAccessToken(appId, appSecret);
  // ...
}
```

### 2. 前端修改

#### 2.1 `src/app/page.tsx`

**修改位置 1：fetchTableFields 函数**

**修改前**：
```typescript
const fetchTableFields = async (tableId: string) => {
  // ...
  const response = await fetch(`${window.location.origin}/api/feishu/fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token: parsedConfig.spreadsheetToken, tableId }),
  });
  // ...
};
```

**修改后**：
```typescript
const fetchTableFields = async (tableId: string) => {
  // ...
  // 构建请求体，包含飞书配置
  const requestBody: any = { token: parsedConfig.spreadsheetToken, tableId };
  if (feishuAppId && feishuAppSecret) {
    requestBody.appId = feishuAppId;
    requestBody.appSecret = feishuAppSecret;
  }

  const response = await fetch(`${window.location.origin}/api/feishu/fields`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  // ...
};
```

**修改位置 2：fetchTableDetails 函数**

**修改前**：
```typescript
const fetchTableDetails = async (token: string, tableId: string) => {
  // ...
  await Promise.all([
    fetch(`${window.location.origin}/api/feishu/fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, tableId }),
    }),
    fetch(`${window.location.origin}/api/feishu/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, tableId, pageSize: 10 }),
    })
  ]);
  // ...
};
```

**修改后**：
```typescript
const fetchTableDetails = async (token: string, tableId: string) => {
  // ...
  // 构建请求体，包含飞书配置
  const requestBody: any = { token, tableId };
  if (feishuAppId && feishuAppSecret) {
    requestBody.appId = feishuAppId;
    requestBody.appSecret = feishuAppSecret;
  }

  await Promise.all([
    fetch(`${window.location.origin}/api/feishu/fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }),
    fetch(`${window.location.origin}/api/feishu/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...requestBody, pageSize: 10 }),
    })
  ]);
  // ...
};
```

## 修改后的行为

### 1. 错误提示更清晰

**修改前**：
```json
{
  "error": "飞书配置缺失"
}
```

**修改后**：
```json
{
  "error": "飞书配置缺失，请在右上角点击"飞书配置"按钮输入飞书 App ID 和 App Secret"
}
```

### 2. 必须提供凭证

- 如果用户没有配置飞书凭证，所有 API 调用都会失败
- 错误信息会明确提示用户如何配置
- 不再依赖环境变量

### 3. 配置保存到 localStorage

- 用户配置的飞书凭证保存在 localStorage
- 刷新页面后配置仍然有效
- 每次请求都会携带用户配置的凭证

## 使用流程

1. **用户首次打开应用**
   - 看到登录界面
   - 输入密码：`1094581778`
   - 进入主界面

2. **配置飞书凭证**
   - 点击右上角"飞书配置"按钮
   - 输入飞书 App ID 和 App Secret
   - 点击"保存配置"

3. **使用应用**
   - 输入飞书表格链接
   - 选择工作表
   - 上传文件并同步
   - 所有 API 调用都使用用户配置的凭证

## 优势

1. ✅ **不依赖环境变量**：避免部署环境配置问题
2. ✅ **用户自主管理**：每个用户使用自己的凭证
3. ✅ **更安全**：不在代码中硬编码凭证
4. ✅ **错误提示清晰**：明确告诉用户如何配置
5. ✅ **配置持久化**：保存到 localStorage，刷新不丢失

## 注意事项

1. **用户必须配置凭证**：首次使用必须配置飞书凭证
2. **配置验证**：应用会验证凭证是否有效
3. **错误处理**：如果凭证无效，会提示用户重新配置

## 测试建议

1. **清空 localStorage**，测试首次使用流程
2. **刷新页面**，验证配置是否持久化
3. **输入错误凭证**，验证错误提示是否正确
4. **重新部署**，验证新部署环境是否正常工作

## 更新日志

- 2026-02-06 17:40: 移除所有环境变量依赖，强制使用用户配置
- 2026-02-06 17:45: 更新前端，确保所有 API 调用都传递用户凭证

# 500 错误排查 - 诊断报告

## 用户信息

- **部署环境**: 新部署应用
- **访问URL**: `https://btbcpb32bj.coze.site`
- **错误信息**: `POST https://btbcpb32bj.coze.site/api/upload 500 (Internal Server Error)`

## 诊断结果

### ✅ 环境变量验证

运行环境变量加载测试：

```bash
bash -c '. scripts/build.sh; echo "FEISHU_APP_ID=$FEISHU_APP_ID"; echo "FEISHU_APP_SECRET=${FEISHU_APP_SECRET:0:4}***${FEISHU_APP_SECRET: -4}"'
```

**结果**:
- ✅ `FEISHU_APP_ID`: cli_a90a9d996078dbd9
- ✅ `FEISHU_APP_SECRET`: 5N3Y***2NJQ
- ✅ 环境变量加载成功

### ✅ 服务状态

```bash
curl -I http://localhost:5000
```

**结果**:
- ✅ HTTP/1.1 200 OK
- ✅ 服务正常运行

### ❌ 错误日志查询

```bash
tail -n 200 /app/work/logs/bypass/app.log | grep -E "POST /api/upload|error|Error|500|Failed|Exception"
```

**结果**:
- ⚠️ 没有找到最近的 `/api/upload` 500 错误记录
- ⚠️ 最新日志时间是 2026-02-05 16:53 - 17:20

## 可能的原因

### 1. 部署环境日志隔离（最可能）

**问题**: 用户访问的是 `https://btbcpb32bj.coze.site`，但我查看的是本地开发环境的日志（`localhost:5000`）。

**原因**: 每个部署环境有独立的日志系统，我无法直接访问用户部署环境的日志。

### 2. 代码尚未部署

**问题**: 增强的错误日志代码可能还没有部署到用户环境。

**原因**: 需要重新部署应用才能生效。

### 3. 环境变量未正确加载

**问题**: 部署环境的环境变量加载脚本可能没有执行。

**原因**: 部署平台的配置可能与本地环境不同。

## 已实施的修复

### 1. 增强错误日志

在 `src/app/api/upload/route.ts` 的 catch 块中添加了详细日志：

```typescript
} catch (error) {
  console.error('❌ [文件上传失败]', error);
  console.error('❌ [错误详情]', {
    message: error instanceof Error ? error.message : '未知错误',
    stack: error instanceof Error ? error.stack : '无堆栈',
    timestamp: new Date().toISOString(),
  });
  console.error('❌ [环境变量状态]', {
    FEISHU_APP_ID: FEISHU_APP_ID ? '已配置' : '未配置',
    FEISHU_APP_SECRET: FEISHU_APP_SECRET ? '已配置' : '未配置',
    COZE_BUCKET_NAME: process.env.COZE_BUCKET_NAME ? '已配置' : '未配置',
  });
  return NextResponse.json(
    {
      error: '文件上传失败',
      details: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString(),
      envStatus: {
        FEISHU_APP_ID: FEISHU_APP_ID ? '已配置' : '未配置',
        FEISHU_APP_SECRET: FEISHU_APP_SECRET ? '已配置' : '未配置',
      }
    },
    { status: 500 }
  );
}
```

### 2. 添加请求参数日志

在 POST 函数开始处添加了参数日志：

```typescript
console.log('📦 [请求参数]', {
  fileName: file?.name,
  fileSize: file?.size,
  spreadsheetToken: spreadsheetToken?.substring(0, 10) + '...',
  sheetId: sheetId?.substring(0, 10) + '...',
  sheetName: sheetNameParam,
  userAppId: appId?.substring(0, 10) + '...',
  hasUserAppSecret: !!appSecret,
});
```

## 用户需要执行的操作

### 1. 查看浏览器控制台（最重要）

**步骤**:
1. 按 F12 打开开发者工具
2. 切换到 **Network** 标签
3. 清除日志
4. 重新执行同步操作
5. 找到失败的 `/api/upload` 请求（红色）
6. 点击该请求
7. 查看 **Response** 标签
8. 复制完整的错误信息

**期望看到的内容**:
```json
{
  "error": "文件上传失败",
  "details": "具体错误信息",
  "timestamp": "2026-02-05T...",
  "envStatus": {
    "FEISHU_APP_ID": "已配置" 或 "未配置",
    "FEISHU_APP_SECRET": "已配置" 或 "未配置"
  }
}
```

### 2. 使用用户配置界面（快速解决方案）

**步骤**:
1. 打开应用
2. 点击右上角"飞书配置"按钮
3. 输入以下信息：
   - **飞书 App ID**: `cli_a90a9d996078dbd9`
   - **飞书 App Secret**: `5N3YZhsGq2exd036bRZVNb6WcsrK2NJQ`
4. 点击"保存"
5. 重新尝试同步

**优势**:
- ✅ 不需要重新部署
- ✅ 绕过环境变量问题
- ✅ 用户可以自己管理凭证
- ✅ 最安全的方式

### 3. 检查部署平台的环境变量

**步骤**:
1. 登录部署平台（coze）
2. 找到应用 `btbcpb32bj.coze.site`
3. 找到"环境变量"配置
4. 确认以下变量是否存在：
   - `FEISHU_APP_ID`
   - `FEISHU_APP_SECRET`
5. 如果不存在，手动添加：
   ```
   FEISHU_APP_ID=cli_a90a9d996078dbd9
   FEISHU_APP_SECRET=5N3YZhsGq2exd036bRZVNb6WcsrK2NJQ
   ```
6. 点击"重新部署"

### 4. 重新部署应用

**步骤**:
1. 在部署平台找到应用
2. 点击"重新部署"
3. 等待部署完成
4. 重新测试

## 常见错误及解决方案

### 错误 1: 环境变量未配置

**错误信息**:
```json
{
  "error": "获取飞书访问令牌失败",
  "details": "飞书配置缺失"
}
```

**解决方案**: 使用用户配置界面输入凭证

### 错误 2: 凭证无效

**错误信息**:
```json
{
  "error": "获取飞书访问令牌失败",
  "details": "app_id 或 app_secret 无效"
}
```

**解决方案**:
1. 检查凭证是否正确复制
2. 在飞书开放平台重新生成凭证
3. 更新用户配置

### 错误 3: 文件上传失败

**错误信息**:
```json
{
  "error": "文件上传失败",
  "details": "具体错误信息"
}
```

**解决方案**:
1. 检查文件格式（只支持 .xlsx 和 .xls）
2. 检查文件大小
3. 查看详细的错误堆栈

### 错误 4: 字段匹配失败

**错误信息**:
```json
{
  "error": "字段匹配失败",
  "details": "未找到匹配的字段"
}
```

**解决方案**:
1. 检查 Excel 列名是否与飞书字段名一致
2. 使用字段别名或手动映射
3. 查看详细的字段匹配日志

## 下一步

1. **立即**: 使用用户配置界面输入飞书凭证
2. **短期**: 重新部署应用，启用增强的错误日志
3. **长期**: 添加用户反馈机制，自动收集错误信息

## 联系方式

如果以上方法都无法解决问题，请提供：

1. **浏览器控制台截图**:
   - Network 标签
   - 失败的 `/api/upload` 请求
   - Response 标签内容

2. **部署日志**:
   - 从部署平台的日志控制台导出
   - 包含错误时间段的日志

3. **操作步骤**:
   - 如何复现问题
   - 使用的文件格式和大小

## 更新日志

- 2026-02-05 17:25: 增强错误日志和请求参数日志
- 2026-02-05 17:20: 验证环境变量加载成功
- 2026-02-05 17:15: 创建诊断报告

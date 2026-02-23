# 部署环境 500 错误排查指南

## 问题描述

用户反馈：部署后同步时提示 "Failed to load resource: the server responded with a status of 500 ()"

## 初步诊断

### 后端日志分析

从 `/app/work/logs/bypass/app.log` 查看最近的请求：

```bash
# 查看最近的 API 请求
tail -n 50 /app/work/logs/bypass/app.log
```

**发现**：
- ✅ 所有 `/api/upload` 请求都返回 **200** 状态码
- ✅ 所有 `/api/feishu/fields` 请求都返回 **200** 状态码
- ✅ 同步成功，例如："成功同步 16 条，失败 0 条"
- ❌ 没有找到任何 **500 错误**

**结论**：后端 API 调用成功，没有 500 错误

## 可能的原因

### 1. 浏览器缓存（最可能）

**现象**：
- 看到的错误是之前的旧错误
- 实际上已经修复了

**解决方法**：
1. **强制刷新页面**：Ctrl + Shift + R (Windows) 或 Cmd + Shift + R (Mac)
2. **清除浏览器缓存**
3. **使用无痕模式**打开应用

### 2. 前端超时

**现象**：
- 同步操作耗时较长（从日志看，有些请求耗时 3-12 秒）
- 前端超时导致显示 500 错误

**解决方法**：
- 增加前端请求超时时间
- 添加重试机制

### 3. 环境变量未加载

**现象**：
- 部署环境还没有重新部署
- 环境变量修改没有生效

**解决方法**：
1. 确认已重新部署应用
2. 查看部署日志，确认环境变量已加载
3. 检查部署平台的环境变量配置

### 4. 网络问题

**现象**：
- 部署环境的网络不稳定
- 请求部分成功，部分失败

**解决方法**：
- 检查网络连接
- 添加重试机制

## 排查步骤

### 步骤 1：验证当前状态

**用户操作**：
1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 清除日志
4. 执行同步操作
5. 查看请求状态

**检查点**：
- `/api/upload` 请求的状态码是什么？
- 请求耗时多长时间？
- 响应内容是什么？
- 是否有红色的错误请求？

### 步骤 2：查看详细错误信息

**如果看到 500 错误**：
1. 点击失败的请求
2. 查看 **Response** 标签
3. 记录错误信息

**可能看到的错误**：
```json
{
  "error": "文件上传失败",
  "details": "具体错误信息"
}
```

### 步骤 3：检查部署日志

**管理员操作**：
```bash
# 查看最新的日志
tail -n 100 /app/work/logs/bypass/app.log

# 搜索错误
grep -n "Error\|error\|500\|Failed" /app/work/logs/bypass/app.log | tail -n 30
```

### 步骤 4：验证环境变量

**管理员操作**：
```bash
# 运行测试脚本
./scripts/test-build-env.sh

# 预期输出：
# ✅ 环境变量加载成功！
#   FEISHU_APP_ID: 已配置
#   FEISHU_APP_SECRET: 已配置
```

### 步骤 5：重新部署

**管理员操作**：
1. 在部署平台点击"重新部署"
2. 等待部署完成
3. 查看部署日志
4. 用户重新测试

## 代码改进

### 1. 增强错误日志

在 `src/app/api/upload/route.ts` 的 catch 块中添加详细日志：

```typescript
} catch (error) {
  console.error('❌ [文件上传失败]', error);
  console.error('错误堆栈:', error instanceof Error ? error.stack : '无堆栈');
  return NextResponse.json(
    {
      error: '文件上传失败',
      details: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}
```

### 2. 增加前端超时时间

在前端 fetch 请求中增加超时设置：

```typescript
const uploadFile = async (formData: FormData) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('上传失败:', error);
    throw error;
  }
};
```

### 3. 添加请求重试

```typescript
const retryUpload = async (formData: FormData, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await uploadFile(formData);
    } catch (error) {
      console.error(`第 ${i + 1} 次尝试失败:`, error);
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
};
```

## 紧急修复

### 方案 1：使用用户配置（最安全）

如果环境变量无法加载，可以让用户通过界面配置：

1. 打开应用
2. 点击右上角"飞书配置"
3. 输入飞书 App ID 和 App Secret
4. 保存配置
5. 重新尝试同步

### 方案 2：手动配置环境变量

在部署平台的环境变量配置界面中手动添加：

```
FEISHU_APP_ID=cli_a90a9d996078dbd9
FEISHU_APP_SECRET=5N3YZhsGq2exd036bRZVNb6WcsrK2NJQ
```

然后重新部署。

### 方案 3：清除浏览器缓存

```javascript
// 在浏览器控制台执行
location.reload(true);
```

## 预防措施

1. **定期检查日志**：每天查看应用日志，及时发现错误
2. **添加监控告警**：设置错误告警，第一时间发现问题
3. **优化性能**：减少请求耗时，避免超时
4. **完善错误处理**：前后端都添加完善的错误处理
5. **用户反馈机制**：添加用户反馈渠道，及时收集问题

## 联系方式

如果以上方法都无法解决问题，请提供：

1. **浏览器控制台截图**：Network 标签的请求详情
2. **错误详细信息**：Response 标签的内容
3. **操作步骤**：如何复现问题
4. **部署日志**：相关时间段的后端日志

## 更新日志

- 2026-02-05：初始文档创建
- 待更新：根据实际排查结果补充

# 诊断指南：为什么显示"已检测到 0 个工作表"

## 问题描述
链接解析成功，但显示"已检测到 0 个工作表"

## 排查步骤

### 1. 打开浏览器开发者工具
- 按 F12 或右键点击页面选择"检查"
- 切换到 Console（控制台）标签

### 2. 刷新页面并观察日志
刷新页面后，控制台会显示以下日志：

```
📦 页面加载，检查 localStorage
  保存的 URL: https://hcn800yf0dow.feishu.cn/base/...
  保存的 Table ID: xxxxx
🔧 解析的配置: { spreadsheetToken: "CqKfbURrcaldFBslTFlcWPzrnXb" }
🚀 使用默认配置，1秒后加载工作表
🔄 开始获取工作表列表，token: CqKfbURrcaldFBslTFlcWPzrnXb
📊 API 返回数据: { success: true, tables: [...] }
✅ 成功获取工作表，数量: 32
📋 工作表列表: [ ... 32 个工作表 ... ]
🎯 自动选中概览表: 国圣官方旗舰核心汇总
✅ fetchTables 完成，tables.length: 32
📊 tables 状态变化: 32 个表
```

### 3. 如果看到"已检测到 0 个工作表"

#### 情况 A：控制台显示 API 返回成功
- 说明后端 API 正常
- 问题在前端状态更新
- **解决方法**：清除浏览器缓存，硬刷新页面（Ctrl+Shift+R 或 Cmd+Shift+R）

#### 情况 B：控制台显示 API 返回失败
```
❌ API 返回错误: xxx
```
- 说明后端 API 调用失败
- **解决方法**：检查网络连接，确认飞书链接正确

#### 情况 C：控制台显示 tables.length = 0
```
✅ 成功获取工作表，数量: 32
✅ fetchTables 完成，tables.length: 32
📊 tables 状态变化: 32 个表
```
但界面显示 0 个工作表：
- 说明是界面渲染问题
- **解决方法**：清除 localStorage，重新加载

### 4. 手动清除 localStorage

在控制台执行：
```javascript
localStorage.clear();
location.reload();
```

### 5. 手动触发工作表加载

如果自动加载失败，可以手动触发：
1. 点击"解析链接"按钮
2. 等待几秒
3. 查看控制台日志

### 6. 检查网络请求

在开发者工具中：
1. 切换到 Network（网络）标签
2. 刷新页面
3. 查找 `/api/feishu/tables` 请求
4. 点击查看响应内容

如果响应显示 32 个工作表，说明 API 正常，问题在前端。

### 7. 常见解决方案

#### 方案 1：硬刷新页面
- Windows: Ctrl + Shift + R
- Mac: Cmd + Shift + R

#### 方案 2：清除浏览器缓存
- 打开开发者工具
- 右键点击刷新按钮
- 选择"清空缓存并硬性重新加载"

#### 方案 3：使用无痕模式
- 打开无痕/隐私浏览窗口
- 访问页面
- 如果无痕模式正常，说明是缓存问题

#### 方案 4：重置配置
1. 点击"清除内容"按钮
2. 重新输入飞书链接
3. 点击"解析链接"

#### 方案 5：使用页面调试信息（新增）
在步骤 2 中，页面底部会显示详细的调试信息：
- `loadingTables: false` （表示加载完成）
- `tables.length: 0` 或实际数字
- `第一个工作表: 名称 (ID)` （如果有数据）
- `selectedTableId: xxx` 或 `未选择`

根据这些信息判断：
- 如果 `tables.length: 0` 但控制台显示成功获取数据 → 状态更新问题
- 如果 `tables.length: 32` 但界面不显示 → 渲染问题
- 如果 `loadingTables: true` 且不改变 → 加卡住问题

#### 方案 6：检查 API 响应（新增）
1. 从控制台日志中找到 `spreadsheetToken`
2. 在浏览器中直接访问：
   ```
   http://localhost:5000/api/feishu/tables?token=YOUR_TOKEN
   ```
3. 查看返回的 JSON 数据
4. 确认格式和内容是否正确

#### 方案 7：强制重新加载步骤（新增）
1. 从步骤 2 返回步骤 1
2. 点击"解析链接"按钮
3. 等待自动跳转到步骤 2
4. 查看工作表列表是否更新

## 联系支持

如果以上方法都无法解决问题，请提供：
1. 控制台日志截图
2. Network 请求截图
3. 浏览器版本
4. 操作系统

## 技术细节

### API 端点
```
GET /api/feishu/tables?token=CqKfbURrcaldFBslTFlcWPzrnXb
```

### 预期响应
```json
{
  "success": true,
  "tables": [
    { "id": "tblOjZ1oA30Gxm15", "name": "抖音主播数据" },
    { "id": "tblPG5AKiRvjm8Nk", "name": "主播数据汇总表" },
    ... (共32个)
  ]
}
```

### 前端状态
```typescript
const [tables, setTables] = useState<FeishuTable[]>([]);
```

更新方式：
```typescript
if (data.success) {
  setTables(data.tables);
}
```

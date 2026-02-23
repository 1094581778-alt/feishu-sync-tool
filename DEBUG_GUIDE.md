# 调试功能增强说明

## 更新内容

已为应用添加详细的调试功能，帮助诊断步骤1和步骤2的问题。

## 新增调试功能

### 1. 请求追踪
每个 API 请求现在都有唯一的请求 ID，方便追踪：
- 请求 ID（时间戳）
- Token 类型和长度
- API 请求 URL
- 响应状态和数据
- 完整的响应数据（可展开查看）

### 2. 详细调试面板

**步骤 1 - 链接解析成功后显示：**
- 🔬 详细调试信息
- 请求 ID
- 时间戳
- Spreadsheet Token
- Token 类型和长度
- API URL
- 请求状态（fetching/success/error/skipped）
- 错误信息（如果有）
- 响应状态
- 工作表数量
- 自动选中的工作表
- 完整响应数据（可展开）

**步骤 2 - 工作表列表显示：**
- loadingTables 状态
- tables.length
- 第一个工作表信息
- selectedTableId
- 最后请求状态
- 最后错误信息

### 3. 控制台日志增强

所有日志现在都带有请求 ID，方便追踪：
```
🔄 [请求 1738586205123] 开始获取工作表列表
🔄 [请求 1738586205123] token: CqKfbURrcaldFBslTFlcWPzrnXb
🔄 [请求 1738586205123] token类型: string
🔄 [请求 1738586205123] token长度: 24
📊 [请求 1738586205123] API 响应状态: 200
📊 [请求 1738586205123] API 响应数据: { success: true, tables: [...] }
✅ [请求 1738586205123] 成功获取工作表，数量: 32
```

## 使用方法

### 第一步：清除缓存

**非常重要！** 首先清除浏览器缓存：
- Windows/Linux: Ctrl + Shift + R
- Mac: Cmd + Shift + R
- 或者使用无痕/隐私模式

### 第二步：打开应用并查看调试信息

1. 访问 http://localhost:5000
2. 打开开发者工具（F12）
3. 切换到 Console（控制台）标签

### 第三步：解析链接

1. 确认链接已预填：`https://hcn800yf0dow.feishu.cn/base/CqKfbURrcaldFBslTFlcWPzrnXb?from=from_copylink`
2. 点击「解析链接」按钮
3. 查看页面上的调试信息

### 第四步：诊断问题

根据调试信息判断问题：

#### 情况 A：看到「缺少 spreadsheetToken 参数」错误

**检查调试信息：**
```
请求ID: 1738586205123
Spreadsheet Token: undefined
Token 类型: undefined
API URL: /api/feishu/tables?token=undefined
状态: error
错误: 缺少 spreadsheetToken 参数
```

**原因：** token 是 undefined，说明 parsedConfig.spreadsheetToken 未正确设置

**解决方案：**
1. 检查链接格式是否正确
2. 查看 localStorage 中保存的 URL
3. 点击「清除内容」重新解析

#### 情况 B：看到「未找到 Spreadsheet Token」

**检查调试信息：**
```
Spreadsheet Token: CqKfbURrcaldFBslTFlcWPzrnXb
Token 类型: string
Token 长度: 24
状态: error
错误: 错误：未找到 Spreadsheet Token
```

**原因：** fetchTables 函数内部的检查失败（理论上不应该出现）

**解决方案：**
1. 查看控制台日志，确认 token 值
2. 检查是否有其他地方覆盖了错误信息

#### 情况 C：API 请求成功但 tables.length 为 0

**检查调试信息：**
```
状态: success
响应状态: 200
工作表数量: 32
最后请求状态: success
```

但页面显示：
```
tables.length: 0
```

**原因：** 状态更新延迟或渲染问题

**解决方案：**
1. 等待几秒钟，查看是否更新
2. 刷新页面
3. 检查控制台是否有 "📊 tables 状态变化: 32 个表"

#### 情况 D：一切正常

**调试信息应该显示：**
```
Spreadsheet Token: CqKfbURrcaldFBslTFlcWPzrnXb
Token 类型: string
Token 长度: 24
API URL: /api/feishu/tables?token=CqKfbURrcaldFBslTFlcWPzrnXb
状态: success
响应状态: 200
工作表数量: 32
自动选中: 国圣官方旗舰店成交概览
```

页面显示：
```
📊 已检测到 32 个工作表
```

工作表列表应该显示 32 个工作表。

## 查看完整响应数据

在调试面板底部，有一个「查看完整响应数据」链接，点击可以展开查看完整的 JSON 响应：

```json
{
  "success": true,
  "tables": [
    { "id": "tblOjZ1oA30Gxm15", "name": "抖音主播数据" },
    { "id": "tblPG5AKiRvjm8Nk", "name": "主播数据汇总表" },
    ...
  ]
}
```

## 清除调试信息

点击调试面板右上角的「清除」按钮可以清除调试信息，方便重新诊断。

## 预期正常流程

### 步骤 1：输入飞书链接

**预期行为：**
1. 点击「解析链接」
2. 显示「✅ 链接解析成功」
3. 显示 Spreadsheet Token
4. 显示「🔬 详细调试信息」面板
5. 调试信息显示「状态: success」
6. 调试信息显示「工作表数量: 32」
7. 自动跳转到步骤 2

**不应该出现：**
- ❌ 「缺少 spreadsheetToken 参数」
- ❌ 「错误：未找到 Spreadsheet Token」
- ❌ 任何红色错误信息

### 步骤 2：选择工作表

**预期行为：**
1. 显示「📊 已检测到 32 个工作表」
2. 显示工作表列表（32 个）
3. "国圣官方旗舰店成交概览" 自动选中（蓝色背景）
4. 调试信息显示「tables.length: 32」
5. 调试信息显示「最后请求状态: success」
6. 可以点击选择其他工作表
7. 可以点击"下一步"继续

**不应该出现：**
- ❌ 「已检测到 0 个工作表」
- ❌ 「暂无工作表数据」
- ❌ loading 状态一直不结束

## 测试步骤

请按以下步骤测试：

1. **清除缓存**: Ctrl + Shift + R
2. **打开应用**: http://localhost:5000
3. **打开控制台**: F12 → Console
4. **点击「解析链接」**
5. **查看调试信息**:
   - Spreadsheet Token 是否正确？
   - Token 类型是否是 string？
   - Token 长度是否是 24？
   - 状态是否是 success？
   - 工作表数量是否是 32？
6. **查看工作表列表**:
   - 是否显示 32 个工作表？
   - 是否自动选中"国圣官方旗舰店成交概览"？
   - 点击"下一步"是否可用？
7. **截图问题**（如果有问题）:
   - 控制台日志（特别是带有请求 ID 的日志）
   - 页面调试信息面板
   - 错误信息

## 常见问题

### Q: 为什么我看不到调试信息？

A: 调试信息只在以下情况显示：
- 步骤 1：解析链接成功后（parsedConfig 有值）
- 步骤 2：始终显示

如果看不到，检查控制台是否有错误。

### Q: 调试信息中的"查看完整响应数据"是空的？

A: 这说明请求还没有完成或失败了。检查状态字段：
- `fetching` - 正在请求中
- `error` - 请求失败，查看错误信息
- `success` - 请求成功，数据应该在这里

### Q: 我看到状态是 success，但工作表列表还是 0？

A: 这可能是状态更新延迟：
1. 查看控制台是否有 "📊 tables 状态变化: 32 个表"
2. 如果有，等几秒钟
3. 如果没有，检查是否有其他错误

### Q: 如何重新触发请求？

A: 有三种方法：
1. 点击「清除内容」，然后重新解析
2. 返回步骤 1，再次点击「解析链接」
3. 刷新页面（Ctrl + R）

## 技术细节

### 请求追踪
每个请求都有唯一的时间戳 ID，格式：`[请求 1738586205123]`

### 状态值
- `fetching` - 正在请求
- `success` - 请求成功
- `error` - 请求失败
- `skipped` - 请求被跳过（参数无效）

### 错误处理
所有错误都会记录到调试信息中，包括：
- API 错误（来自后端）
- 网络错误
- 异常捕获

## 联系支持

如果问题仍然存在，请提供：
1. 控制台日志截图（特别是带有请求 ID 的日志）
2. 调试信息面板截图
3. 完整响应数据（展开后的截图）
4. 浏览器版本和操作系统

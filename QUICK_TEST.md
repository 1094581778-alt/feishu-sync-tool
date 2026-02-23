# 立即测试指南

## 快速测试步骤

### 1️⃣ 清除浏览器缓存（最重要！）

**Windows/Linux:** `Ctrl + Shift + R`  
**Mac:** `Cmd + Shift + R`

或使用无痕/隐私模式。

### 2️⃣ 打开应用

访问: http://localhost:5000

### 3️⃣ 打开开发者工具

按 `F12` 或右键点击页面选择"检查"，切换到 `Console`（控制台）标签。

### 4️⃣ 查看页面

页面应该已经预填了链接：
```
https://hcn800yf0dow.feishu.cn/base/CqKfbURrcaldFBslTFlcWPzrnXb?from=from_copylink
```

### 5️⃣ 点击「解析链接」

点击页面上的「解析链接」按钮。

### 6️⃣ 查看结果

#### ✅ 正常情况应该看到：

**步骤 1 显示：**
```
✅ 链接解析成功
Spreadsheet Token: CqKfbURrcaldFBslTFlcWPzrnXb
📊 已检测到 32 个工作表
```

**🔬 详细调试信息面板：**
```
请求ID: 1738586205123
Spreadsheet Token: CqKfbURrcaldFBslTFlcWPzrnXb
Token 类型: string
Token 长度: 24
API URL: /api/feishu/tables?token=CqKfbURrcaldFBslTFlcWPzrnXb
状态: success
响应状态: 200
工作表数量: 32
自动选中: 国圣官方旗舰店成交概览
```

**控制台日志：**
```
🔔 检测到 parsedConfig 变化，开始获取工作表列表
🔄 [请求 1738586205123] 开始获取工作表列表
🔄 [请求 1738586205123] token: CqKfbURrcaldFBslTFlcWPzrnXb
📊 [请求 1738586205123] API 响应数据: { success: true, tables: [...] }
✅ [请求 1738586205123] 成功获取工作表，数量: 32
📊 tables 状态变化: 32 个表
```

**步骤 2 显示：**
```
📊 已检测到 32 个工作表
```

工作表列表应该显示 32 个工作表，"国圣官方旗舰店成交概览"被自动选中（蓝色背景）。

#### ❌ 如果看到错误：

**错误 1：「缺少 spreadsheetToken 参数」**

调试信息会显示：
```
Spreadsheet Token: undefined
Token 类型: undefined
状态: error
错误: 缺少 spreadsheetToken 参数
```

**解决方法：**
1. 点击「清除内容」按钮
2. 重新输入链接
3. 再次点击「解析链接」

**错误 2：「已检测到 0 个工作表」**

调试信息会显示：
```
状态: success
工作表数量: 32
```

但页面显示：
```
tables.length: 0
```

**解决方法：**
1. 查看控制台是否有 "📊 tables 状态变化: 32 个表"
2. 等待几秒钟
3. 刷新页面（Ctrl + R）

**错误 3：一直在加载**

调试信息显示：
```
状态: fetching
```

**解决方法：**
1. 检查网络连接
2. 打开 Network 标签，查看请求是否成功
3. 查看控制台是否有错误

### 7️⃣ 测试工作表选择

在工作表列表中：
1. 点击任意工作表，查看是否可以选中
2. 确认"国圣官方旗舰店成交概览"是默认选中的
3. 点击"下一步"按钮，确认可以进入步骤 3

### 8️⃣ 截图反馈（如果问题仍然存在）

请提供以下截图：

1. **控制台日志**
   - F12 → Console
   - 截取从页面加载到解析链接完成的所有日志

2. **页面调试信息**
   - 🔬 详细调试信息面板（步骤 1）
   - 🔍 调试信息区域（步骤 2）

3. **错误信息**
   - 任何红色错误提示
   - 错误对话框

4. **网络请求**
   - F12 → Network
   - 找到 `/api/feishu/tables` 请求
   - 点击查看响应内容
   - 截图响应数据

## 预期完整流程

### 正常流程（30秒内完成）

1. **打开页面** → 自动加载链接
2. **点击「解析链接」** → 显示解析成功
3. **自动获取工作表** → 显示 32 个工作表
4. **自动选中概览表** → "国圣官方旗舰店成交概览"被选中
5. **进入步骤 2** → 显示工作表列表
6. **点击"下一步"** → 进入步骤 3
7. **完成**

### 每个步骤耗时

- 解析链接：< 1秒
- 获取工作表：< 2秒
- 渲染界面：< 1秒
- 总耗时：< 5秒

## 快速诊断命令

### 测试 API

在浏览器地址栏输入：
```
http://localhost:5000/api/feishu/tables?token=CqKfbURrcaldFBslTFlcWPzrnXb
```

应该返回 JSON 数据，包含 32 个工作表。

### 检查 localStorage

在浏览器控制台执行：
```javascript
console.log(localStorage.getItem('feishuUrl'));
console.log(localStorage.getItem('feishuTableId'));
```

应该显示：
```
https://hcn800yf0dow.feishu.cn/base/CqKfbURrcaldFBslTFlcWPzrnXb?from=from_copylink
null
```

### 清除 localStorage

在浏览器控制台执行：
```javascript
localStorage.clear();
location.reload();
```

## 常见错误及快速修复

| 错误 | 原因 | 快速修复 |
|------|------|----------|
| 缺少 spreadsheetToken 参数 | token 为 undefined | 清除缓存，重新解析 |
| 已检测到 0 个工作表 | 状态更新延迟 | 等待几秒或刷新页面 |
| 一直在加载 | 网络问题 | 检查网络，刷新页面 |
| 无法选择工作表 | 未选中工作表 | 点击任意工作表 |
| 下一步按钮不可用 | 未选择工作表 | 先选择一个工作表 |

## 成功标准

✅ **完成以下所有步骤即为成功：**

1. [ ] 步骤 1 无错误提示
2. [ ] 调试信息显示「状态: success」
3. [ ] 步骤 2 显示「已检测到 32 个工作表」
4. [ ] 工作表列表显示 32 个工作表
5. [ ] "国圣官方旗舰店成交概览"被自动选中
6. [ ] 可以点击选择其他工作表
7. [ ] 可以点击"下一步"进入步骤 3
8. [ ] 控制台无红色错误

## 如果还是不行

### 方法 1：完全重置

1. 打开无痕模式
2. 访问 http://localhost:5000
3. 点击「清除内容」
4. 重新输入链接
5. 点击「解析链接」
6. 查看是否正常

### 方法 2：手动测试 API

1. 在浏览器地址栏输入：
   ```
   http://localhost:5000/api/feishu/tables?token=CqKfbURrcaldFBslTFlcWPzrnXb
   ```
2. 查看是否返回 32 个工作表
3. 如果正常，问题在前端
4. 如果异常，问题在后端

### 方法 3：查看详细日志

1. 打开控制台
2. 查找带有「请求 ID」的日志
3. 截图并发送

## 下一步

如果测试成功，你应该可以：
- ✅ 看到步骤 1 显示解析成功
- ✅ 看到步骤 2 显示 32 个工作表
- ✅ 可以选择工作表
- ✅ 可以继续到步骤 3

如果测试失败，请按照上面的步骤收集信息，然后告诉我具体的错误信息。

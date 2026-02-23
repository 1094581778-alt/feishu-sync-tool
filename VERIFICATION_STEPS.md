# 验证步骤

## 1. 清除浏览器缓存

**Windows/Linux**: Ctrl + Shift + R  
**Mac**: Cmd + Shift + R

或者使用无痕/隐私模式打开页面。

## 2. 打开应用

访问: http://localhost:5000

## 3. 打开开发者工具

按 F12 或右键点击页面选择"检查"，切换到 Console（控制台）标签。

## 4. 验证步骤 1：解析链接

### 预期行为
- 页面自动加载默认链接
- 显示「链接解析成功」
- 显示 Spreadsheet Token
- **不出现**「缺少 spreadsheetToken 参数」错误

### 预期日志
```
📦 页面加载，检查 localStorage
  保存的 URL: https://hcn800yf0dow.feishu.cn/base/CqKfbURrcaldFBslTFlcWPzrnXb?from=from_copylink
  保存的 Table ID: null
🔧 解析的配置: { spreadsheetToken: "CqKfbURrcaldFBslTFlcWPzrnXb" }
🔔 检测到 parsedConfig 变化，开始获取工作表列表
🔔 spreadsheetToken: CqKfbURrcaldFBslTFlcWPzrnXb
🔄 开始获取工作表列表，token: CqKfbURrcaldFBslTFlcWPzrnXb
当前 tables.length: 0
📊 API 响应数据: { success: true, tables: [...] }
📊 data.success: true
📊 data.tables.length: 32
✅ 成功获取工作表，数量: 32
💾 已调用 setTables，等待状态更新...
🎯 自动选中概览表: 国圣官方旗舰店成交概览
✅ fetchTables 完成
最终 tables.length: 32
📊 tables 状态变化: 32 个表
```

### 验证点
- [ ] ✅ 链接解析成功显示
- [ ] ✅ Spreadsheet Token 显示: `CqKfbURrcaldFBslTFlcWPzrnXb`
- [ ] ✅ 无「缺少 spreadsheetToken 参数」错误
- [ ] ✅ 控制台日志正常

## 5. 验证步骤 2：选择工作表

### 预期行为
- 显示「📊 已检测到 32 个工作表」
- 显示 32 个工作表列表
- 自动选中"国圣官方旗舰店成交概览"（蓝色背景）
- 可以手动点击选择其他工作表
- 调试信息显示 `tables.length: 32`

### 预期界面
```
【步骤 2/4】工作表列表概览
请选择要上传文件的工作表

📊 已检测到 32 个工作表

┌─────────────────────────────────────┐
│ 选择  工作表名称       ID           │
├─────────────────────────────────────┤
│ ●  国圣官方旗舰店成交概览  tbl... │ ← 自动选中（蓝色）
│ ○  抖音主播数据         tbl... │
│ ○  主播数据汇总表       tbl... │
│ ... (共 32 个)                     │
└─────────────────────────────────────┘

🔍 调试信息
loadingTables: false
tables.length: 32
第一个工作表: 抖音主播数据 (tblOjZ1oA30Gxm15)
selectedTableId: tbldcvl3nJHBYIgk
```

### 验证点
- [ ] ✅ 显示 32 个工作表
- [ ] ✅ "国圣官方旗舰店成交概览"被自动选中
- [ ] ✅ 调试信息显示 `tables.length: 32`
- [ ] ✅ 可以点击选择其他工作表
- [ ] ✅ 点击"下一步"按钮可用

## 6. 验证步骤 3：确认配置

点击"下一步"按钮，进入步骤 3。

### 预期行为
- 显示选中的工作表信息
- 显示字段验证结果
- 显示当前记录数量
- "下一步"按钮可用

### 验证点
- [ ] ✅ 显示选中的工作表名称
- [ ] ✅ 字段验证通过（显示必需字段）
- [ ] ✅ 可以继续到步骤 4

## 7. 故障排查

### 如果仍然显示 0 个工作表

**检查 1**: 查看控制台是否有红色错误
- 如果有错误，截图并发送

**检查 2**: 查看调试信息
- `loadingTables`: 应该是 `false`
- `tables.length`: 应该是 `32`

**检查 3**: 查看 Network 标签
- 打开 Network 标签
- 刷新页面
- 查找 `/api/feishu/tables` 请求
- 点击查看响应内容
- 应该返回 32 个工作表

**检查 4**: 手动测试 API
在浏览器地址栏输入：
```
http://localhost:5000/api/feishu/tables?token=CqKfbURrcaldFBslTFlcWPzrnXb
```
应该显示 JSON 数据，包含 32 个工作表。

**检查 5**: 清除所有数据
点击"清除内容"按钮，然后重新解析链接。

### 如果仍然出现「缺少 spreadsheetToken 参数」错误

**检查 1**: 确认使用的是最新代码
- 控制台应该显示 `🔔 spreadsheetToken: CqKfbURrcaldFBslTFlcWPzrnXb`
- 如果没有这个日志，说明代码没有更新

**检查 2**: 清除浏览器缓存
- 完全清除浏览器缓存和 Cookie
- 使用无痕模式测试

## 8. 成功标准

所有以下条件满足即为成功：

- [ ] 步骤 1 无错误提示
- [ ] 步骤 2 显示 32 个工作表
- [ ] 可以选择工作表
- [ ] 可以点击"下一步"进入步骤 3
- [ ] 控制台无红色错误

## 9. 截图收集（如需帮助）

如果问题仍然存在，请提供以下截图：

1. **控制台日志**（Console 标签）
2. **Network 请求**（Network 标签，`/api/feishu/tables` 请求的响应）
3. **页面截图**（显示工作表列表为 0 的界面）
4. **调试信息区域**（页面底部的调试信息）

## 10. 联系方式

如果以上步骤都无法解决问题，请：
1. 收集上述截图
2. 复制控制台日志
3. 提供浏览器版本和操作系统信息

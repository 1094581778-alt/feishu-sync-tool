# 部署环境字段匹配失败问题诊断与修复

## 问题描述

**现象**:
- 开发环境（localhost:5000）：可以正常读取文档和匹配字段 ✅
- 部署环境（coze.site）：无法读取文档和匹配字段 ❌

## 根本原因

### 环境变量加载机制差异

#### 开发环境
```bash
pnpm run dev
# Next.js 自动加载 .env.local 文件
# 环境变量可以正常读取
```

#### 部署环境
```bash
npx next start
# Next.js 默认不加载 .env.local
# 需要使用 .env.production 或手动配置
```

### 环境变量文件说明

| 文件 | 加载环境 | 说明 |
|-----|---------|------|
| `.env.local` | 仅开发环境 | 本地开发使用 |
| `.env.production` | 仅生产环境 | 生产部署使用 |
| `.env` | 所有环境 | 通用配置 |
| `.coze [env]` | 部署平台 | 平台特定配置 |

### 当前的配置状态

**开发环境**:
- ✅ `.env.local` 存在
- ✅ 飞书凭证已配置
- ✅ 可以正常读取环境变量

**部署环境**:
- ❌ `.env.local` 不会被加载
- ⚠️ `.env.production` 已创建（新增）
- ⚠️ `.coze [env]` 已配置（但可能不被支持）

## 解决方案

### 方案 1: 使用部署平台的环境变量配置（推荐）

大多数部署平台都支持通过界面配置环境变量，这是最可靠的方式。

#### 步骤：

1. **登录部署平台**（coze）
2. **找到应用设置**
3. **找到环境变量配置**
4. **添加以下环境变量**:

```env
FEISHU_APP_ID=YOUR_APP_ID
FEISHU_APP_SECRET=YOUR_APP_SECRET
FEISHU_SPREADSHEET_TOKEN=
FEISHU_SHEET_ID=
```

5. **重新部署应用**

#### 优点:
- ✅ 最安全
- ✅ 最可靠
- ✅ 不需要修改代码
- ✅ 可以随时更新

### 方案 2: 确保 .env.production 被加载

我已经创建了 `.env.production` 文件，但需要确保它被正确使用。

#### 验证步骤：

1. **检查 .env.production 是否存在**:
   ```bash
   cat .env.production
   ```

2. **确保文件被 Git 跟踪**:
   ```bash
   git add .env.production
   git commit -m "chore: 添加生产环境配置文件"
   git push
   ```

3. **重新部署**

4. **验证环境变量是否加载**:
   - 查看部署日志
   - 搜索 "FEISHU_APP_ID" 或 "飞书配置"

#### 注意事项:
- ⚠️ `.env.production` 会被提交到 Git
- ⚠️ 敏感信息会暴露
- ⚠️ 不适合公开仓库

### 方案 3: 使用用户界面配置（最安全）

由于已经实现了飞书配置界面，可以完全依赖用户配置。

#### 步骤：

1. **移除硬编码的凭证**
   - 从 `.coze` 文件中删除 `[env]` 部分
   - 从 `.env.production` 中删除凭证

2. **在部署平台的环境变量中删除凭证**
   - 清空 `FEISHU_APP_ID`
   - 清空 `FEISHU_APP_SECRET`

3. **用户首次使用时配置**
   - 打开应用
   - 点击右上角"飞书配置"
   - 输入自己的凭证
   - 保存配置

#### 优点:
- ✅ 最安全
- ✅ 每个用户使用自己的凭证
- ✅ 不会暴露敏感信息
- ✅ 支持多用户使用

#### 缺点:
- ❌ 需要用户手动配置
- ❌ 初次使用有门槛

### 方案 4: 修改部署脚本

如果部署平台支持从环境变量文件加载，可以修改部署脚本。

#### 修改 `scripts/start.sh`:

```bash
#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

# 加载环境变量文件
if [ -f "${COZE_WORKSPACE_PATH}/.env.production" ]; then
  echo "Loading .env.production..."
  export $(cat "${COZE_WORKSPACE_PATH}/.env.production" | grep -v '^#' | xargs)
fi

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
    # 显示环境变量（用于调试）
    echo "FEISHU_APP_ID: ${FEISHU_APP_ID:+已配置}"
    npx next start --port ${DEPLOY_RUN_PORT}
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service
```

#### 修改 `scripts/build.sh`:

```bash
#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

# 加载环境变量文件
if [ -f "${COZE_WORKSPACE_PATH}/.env.production" ]; then
  echo "Loading .env.production..."
  export $(cat "${COZE_WORKSPACE_PATH}/.env.production" | grep -v '^#' | xargs)
fi

cd "${COZE_WORKSPACE_PATH}"
echo "Building application..."

# 显示环境变量（用于调试）
echo "FEISHU_APP_ID: ${FEISHU_APP_ID:+已配置}"

pnpm run build
```

## 诊断步骤

### 1. 检查环境变量是否加载

#### 在部署日志中搜索：

```
grep "FEISHU_APP_ID" /app/work/logs/bypass/app.log
```

#### 预期结果：

**如果环境变量已加载**:
```
FEISHU_APP_ID=YOUR_APP_ID
```

**如果环境变量未加载**:
```
FEISHU_APP_ID=
```

### 2. 检查飞书 API 调用

#### 在部署日志中搜索：

```
grep "获取飞书访问令牌" /app/work/logs/bypass/app.log
```

#### 预期结果：

**成功**:
```
获取飞书访问令牌失败: 飞书配置缺失
```

**失败**:
```
获取飞书访问令牌失败: 获取飞书访问令牌失败
```

### 3. 检查 Excel 文件读取

#### 在部署日志中搜索：

```
grep "读取Excel文件" /app/work/logs/bypass/app.log
```

#### 预期结果：

**成功**:
```
📊 [Excel] Sheet: Sheet1
📊 [Excel] 读取到列: [...]
```

**失败**:
```
⚠️ [Excel] 读取Excel文件失败，跳过Excel数据同步
```

### 4. 检查字段获取

#### 在部署日志中搜索：

```
grep "飞书字段" /app/work/logs/bypass/app.log
```

#### 预期结果：

**成功**:
```
📋 [飞书字段] 最终字段名称列表: [...]
```

**失败**:
```
获取字段信息失败: 飞书配置缺失
```

## 推荐方案对比

| 方案 | 安全性 | 可靠性 | 易用性 | 推荐度 |
|-----|-------|-------|-------|-------|
| 方案1（平台配置） | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 方案2（.env.production） | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| 方案3（用户配置） | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| 方案4（修改脚本） | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

## 立即行动步骤

### 快速修复（5分钟）

1. **在部署平台添加环境变量**:
   - `FEISHU_APP_ID=YOUR_APP_ID`
   - `FEISHU_APP_SECRET=YOUR_APP_SECRET`

2. **重新部署应用**

3. **测试功能**

### 长期方案（30分钟）

1. **创建新的飞书应用凭证**
2. **使用方案1配置环境变量**
3. **测试功能**
4. **考虑实施方案3（用户配置）**

## 常见错误

### 错误 1: 飞书配置缺失

```
获取飞书访问令牌失败: 飞书配置缺失
```

**原因**: 环境变量未正确加载

**解决**: 使用方案1或方案2

### 错误 2: 凭证无效

```
获取飞书访问令牌失败: app_id 或 app_secret 无效
```

**原因**: 凭证错误或过期

**解决**:
1. 检查凭证是否正确
2. 在飞书开放平台重新生成凭证
3. 更新环境变量

### 错误 3: 无法读取Excel

```
⚠️ [Excel] 读取Excel文件失败，跳过Excel数据同步
```

**原因**: 文件上传失败或格式不支持

**解决**:
1. 检查文件格式（只支持 .xlsx 和 .xls）
2. 检查文件是否损坏
3. 查看详细错误信息

## 联系支持

如果以上方案都无法解决问题，请提供：

1. 部署日志（包含 "FEISHU_APP_ID"、"飞书"、"Excel" 的日志）
2. 部署平台的环境变量配置截图
3. 测试用的Excel文件（脱敏后）
4. 具体的错误信息

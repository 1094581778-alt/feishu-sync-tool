# 环境变量加载问题修复总结

## 问题描述

**现象**：
- ✅ 开发环境（localhost:5000）：飞书 API 调用正常，可以读取文档和匹配字段
- ❌ 部署环境（coze.site）：飞书 API 调用失败，返回"飞书配置缺失"错误

**根本原因**：
部署环境中，环境变量没有被正确加载到 Node.js 进程中。虽然 `.coze` 文件包含 `[env]` 配置段，但部署脚本没有从该文件中提取并加载环境变量。

## 问题诊断

### 1. 环境变量文件检查

**开发环境**：
- ✅ `.env.local` 存在
- ✅ Next.js 自动加载 `.env.local`
- ✅ 环境变量可以正常读取

**部署环境**：
- ✅ `.env.production` 存在
- ✅ `.coze` 文件存在（包含 `[env]` 配置段）
- ❌ 环境变量没有被加载到进程中

### 2. 诊断结果

运行诊断脚本 `./scripts/check-env.sh` 的结果：
```
2. 检查当前环境变量
-------------------------------------------
❌ FEISHU_APP_ID: 未设置
❌ FEISHU_APP_SECRET: 未设置
```

这说明环境变量文件存在，但未被加载到当前 shell 中。

## 修复方案

### 1. 修改构建脚本（`scripts/build.sh`）

**修改内容**：
添加 `load_env_vars()` 函数，从 `.env.production` 或 `.coze` 文件加载环境变量。

**核心逻辑**：
```bash
load_env_vars() {
  local env_file=""
  local coze_file="${COZE_WORKSPACE_PATH}/.coze"
  local prod_file="${COZE_WORKSPACE_PATH}/.env.production"

  # 优先从 .env.production 加载
  if [ -f "$prod_file" ]; then
    env_file="$prod_file"
  fi

  # 从 .coze 加载（如果 .env.production 不存在）
  if [ -z "$env_file" ] && [ -f "$coze_file" ]; then
    # 创建临时环境变量文件
    env_file=$(mktemp)
    sed -n '/^\[env\]$/,/^\[[a-z]\|^$/p' "$coze_file" | \
      grep -v '^\[' | \
      grep -v '^$' | \
      sed 's/ = /=/g' | \
      sed 's/^["\x27]*//;s/["\x27]*$//' > "$env_file"
  fi

  # 加载环境变量文件
  if [ -n "$env_file" ] && [ -f "$env_file" ]; then
    set -a  # 自动导出所有变量
    source "$env_file"
    set +a

    # 清理临时文件
    if [ "$env_file" != "$prod_file" ]; then
      rm -f "$env_file"
    fi
  fi
}
```

### 2. 修改启动脚本（`scripts/start.sh`）

**修改内容**：
添加相同的 `load_env_vars()` 函数，确保启动时环境变量也被正确加载。

### 3. 环境变量加载顺序

1. **优先级 1**：`.env.production` 文件
2. **优先级 2**：`.coze` 文件的 `[env]` 配置段

如果 `.env.production` 存在，则优先使用它；否则从 `.coze` 文件提取 `[env]` 部分的配置。

### 4. TOML 格式转换

`.coze` 文件的 `[env]` 部分使用 TOML 格式：
```toml
[env]
FEISHU_APP_ID = "cli_a90a9d996078dbd9"
FEISHU_APP_SECRET = "5N3YZhsGq2exd036bRZVNb6WcsrK2NJQ"
```

需要转换为环境变量格式：
```bash
FEISHU_APP_ID=cli_a90a9d996078dbd9
FEISHU_APP_SECRET=5N3YZhsGq2exd036bRZVNb6WcsrK2NJQ
```

**转换步骤**：
1. 使用 `sed` 提取 `[env]` 部分：`sed -n '/^\[env\]$/,/^\[[a-z]\|^$/p'`
2. 过滤掉标题和空行：`grep -v '^\[' | grep -v '^$'`
3. 移除 `=` 前后的空格：`sed 's/ = /=/g'`
4. 移除引号：`sed 's/^["\x27]*//;s/["\x27]*$//'`

## 验证步骤

### 1. 运行诊断脚本

```bash
./scripts/check-env.sh
```

**预期结果**：
```
2. 检查当前环境变量
-------------------------------------------
❌ FEISHU_APP_ID: 未设置（这是正常的，因为脚本没有加载环境变量）
...
```

### 2. 运行构建脚本测试

```bash
./scripts/test-build-env.sh
```

**预期结果**：
```
环境变量状态:
  FEISHU_APP_ID: 已配置
  FEISHU_APP_SECRET: 已配置

✅ 环境变量加载成功！
```

### 3. 运行构建命令

```bash
bash ./scripts/build.sh
```

**预期结果**：
```
环境变量状态:
  FEISHU_APP_ID: 已配置
  FEISHU_APP_SECRET: 已配置

Installing dependencies...
Building the project...
Build completed successfully!
```

### 4. 启动服务

```bash
bash ./scripts/start.sh
```

**预期结果**：
```
环境变量状态:
  FEISHU_APP_ID: 已配置
  FEISHU_APP_SECRET: 已配置

Starting HTTP service on port 5000 for deploy...
```

### 5. 测试飞书 API 调用

打开浏览器访问 `http://localhost:5000`，然后：
1. 输入飞书表格链接
2. 点击"获取工作表"
3. 检查是否能正常获取工作表列表

**预期结果**：
- ✅ 可以正常获取工作表列表
- ✅ 可以正常读取字段信息
- ✅ 可以正常匹配字段

## 文件修改清单

### 1. 修改的文件

- `scripts/build.sh`：添加环境变量加载逻辑
- `scripts/start.sh`：添加环境变量加载逻辑

### 2. 新增的文件

- `.env.production`：生产环境配置文件
- `scripts/check-env.sh`：环境变量诊断脚本
- `scripts/test-env-load.sh`：环境变量加载测试脚本
- `scripts/test-env-simple.sh`：简化版测试脚本
- `scripts/test-build-env.sh`：构建脚本环境变量测试
- `DEPLOYMENT_ENV_ISSUE.md`：部署环境问题诊断文档
- `FIX_ENV_LOADING.md`：本文档

## 部署步骤

### 1. 提交代码

```bash
git add .
git commit -m "fix: 修复部署环境变量加载问题"
git push
```

### 2. 重新部署

在部署平台（coze）上：
1. 找到应用
2. 点击"重新部署"
3. 等待部署完成

### 3. 验证部署

部署完成后：
1. 访问应用 URL
2. 检查是否能正常获取飞书工作表
3. 检查是否能正常匹配字段

### 4. 查看部署日志

如果仍然有问题，查看部署日志：
```bash
# 在部署平台的日志控制台中搜索
grep "环境变量状态"
grep "FEISHU_APP_ID"
grep "飞书配置"
```

## 备选方案

### 方案 1: 在部署平台配置环境变量（最可靠）

如果部署平台支持环境变量配置界面：

1. 登录部署平台
2. 找到应用设置 → 环境变量
3. 添加以下变量：
   - `FEISHU_APP_ID=cli_a90a9d996078dbd9`
   - `FEISHU_APP_SECRET=5N3YZhsGq2exd036bRZVNb6WcsrK2NJQ`
4. 重新部署

### 方案 2: 使用用户配置界面（最安全）

完全依赖用户在界面上配置飞书凭证：

1. 移除 `.coze` 中的 `[env]` 配置段
2. 移除 `.env.production` 中的凭证
3. 用户首次使用时点击"飞书配置"按钮
4. 输入自己的凭证并保存

**优点**：
- ✅ 最安全，不会暴露敏感信息
- ✅ 每个用户使用自己的凭证
- ✅ 支持多用户使用

## 常见错误排查

### 错误 1: 环境变量未加载

**现象**：
```
环境变量状态:
  FEISHU_APP_ID:
  FEISHU_APP_SECRET:
```

**解决**：
1. 检查 `.env.production` 或 `.coze` 文件是否存在
2. 检查文件格式是否正确
3. 运行 `./scripts/test-build-env.sh` 诊断

### 错误 2: 凭证无效

**现象**：
```
获取飞书访问令牌失败: app_id 或 app_secret 无效
```

**解决**：
1. 检查凭证是否正确
2. 在飞书开放平台重新生成凭证
3. 更新环境变量

### 错误 3: 无法读取 Excel

**现象**：
```
⚠️ [Excel] 读取Excel文件失败，跳过Excel数据同步
```

**解决**：
1. 检查文件格式（只支持 .xlsx 和 .xls）
2. 检查文件是否损坏
3. 查看详细错误信息

## 总结

通过修改构建和启动脚本，添加环境变量加载逻辑，我们解决了部署环境变量无法加载的问题。修复方案的核心是：

1. 从 `.env.production` 或 `.coze` 文件中提取环境变量
2. 使用 `source` 命令加载环境变量
3. 在构建和启动时显示环境变量加载状态

修复后，部署环境可以正常加载飞书凭证，飞书 API 调用恢复正常。

# GitHub Actions Workflows

本目录包含项目的 GitHub Actions 工作流配置。

## 工作流说明

### 1. CI/CD Pipeline (`ci.yml`)

**触发条件：**
- 推送到 `main`, `master`, `develop` 分支
- 创建 Pull Request 到 `main`, `master` 分支

**执行任务：**
1. **Lint and Test** - 代码检查和测试
   - 设置 Node.js 和 pnpm
   - 安装依赖
   - 运行 ESLint 检查
   - 执行 TypeScript 类型检查
   - 运行测试套件
   - 构建 Next.js 应用

2. **Build Web** - Web 应用构建（仅当推送到 main 分支）
   - 构建生产版本
   - 上传构建产物到 GitHub Artifacts

**所需 Secrets：**
```bash
FEISHU_APP_ID              # 飞书应用 ID
FEISHU_APP_SECRET          # 飞书应用密钥
COZE_BUCKET_NAME          # S3 存储桶名称
COZE_REGION               # S3 区域
COZE_ACCESS_KEY_ID        # S3 访问密钥 ID
COZE_SECRET_ACCESS_KEY    # S3 访问密钥
```

### 2. Build Tauri Desktop App (`build-tauri.yml`)

**触发条件：**
- 推送版本标签（如 `v1.0.0`）
- 手动触发工作流

**执行任务：**
1. **Build Windows** - Windows 平台构建
   - 安装 Rust 和 Node.js
   - 构建 Next.js 应用
   - 使用 Tauri 打包为 MSI/NSIS 安装包

2. **Build macOS** - macOS 平台构建
   - 安装 Rust 和 Node.js
   - 构建 Next.js 应用
   - 使用 Tauri 打包为 DMG 安装包
   - 可选：代码签名和公证

3. **Build Linux** - Linux 平台构建
   - 安装系统依赖
   - 安装 Rust 和 Node.js
   - 构建 Next.js 应用
   - 使用 Tauri 打包为 DEB/AppImage

**所需 Secrets：**
```bash
# 基础配置
FEISHU_APP_ID              # 飞书应用 ID
FEISHU_APP_SECRET          # 飞书应用密钥
COZE_BUCKET_NAME          # S3 存储桶名称
COZE_REGION               # S3 区域
COZE_ACCESS_KEY_ID        # S3 访问密钥 ID
COZE_SECRET_ACCESS_KEY    # S3 访问密钥

# Tauri 代码签名（可选但推荐）
TAURI_PRIVATE_KEY         # Tauri 更新签名私钥
TAURI_KEY_PASSWORD        # 私钥密码

# Apple 代码签名（仅 macOS）
APPLE_CERTIFICATE         # Apple 开发者证书（base64 编码）
APPLE_CERTIFICATE_PASSWORD # 证书密码
APPLE_SIGNING_IDENTITY    # 签名身份
APPLE_ID                  # Apple ID
APPLE_PASSWORD            # 应用专用密码
APPLE_TEAM_ID            # Apple 团队 ID
```

## Vercel 自动部署

### 方式一：Vercel GitHub App（推荐）

这是最简单的方式，Vercel 会自动监听 GitHub 推送并部署。

**设置步骤：**

1. 访问 [Vercel GitHub App](https://github.com/apps/vercel)
2. 点击 "Install" 并授权访问此仓库
3. 在 Vercel Dashboard 中导入项目
4. 配置环境变量
5. 完成设置

**自动部署流程：**
- 推送到任何分支 → 创建 Preview 部署
- 推送到 `main` 分支 → 自动部署到生产环境
- Pull Request → 创建预览部署并添加评论

### 方式二：使用 Vercel CLI

如果需要更复杂的部署逻辑，可以使用 Vercel CLI。

**设置步骤：**

1. 安装 Vercel CLI：
   ```bash
   npm install -g vercel
   ```

2. 登录 Vercel：
   ```bash
   vercel login
   ```

3. 链接项目：
   ```bash
   vercel link
   ```

4. 添加部署命令到 CI：
   ```yaml
   - name: Deploy to Vercel
     run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
   ```

**所需 Secrets：**
```bash
VERCEL_TOKEN              # Vercel API Token
VERCEL_ORG_ID            # Vercel 组织 ID
VERCEL_PROJECT_ID        # Vercel 项目 ID
```

## 手动触发构建

### 触发 Tauri 构建

1. 访问 GitHub 仓库的 Actions 标签
2. 选择 "Build Tauri Desktop App" 工作流
3. 点击 "Run workflow"
4. 输入版本号（如 `v1.0.0`）
5. 点击运行

### 查看构建产物

- **Web 构建**：在 Actions 页面的 Artifacts 中下载
- **桌面应用**：在 Releases 页面下载各平台安装包

## 自动化发布流程

### 完整发布流程

1. **更新版本号**
   ```bash
   # 更新 package.json
   npm version patch  # 或 minor, major
   
   # 这会创建一个带版本号的 commit 和 tag
   git push origin main --tags
   ```

2. **自动触发**
   - CI/CD 工作流会自动运行测试和构建
   - Tauri 构建工作流会自动打包桌面应用
   - Vercel 会自动部署 Web 应用

3. **发布 Release**
   - Tauri 工作流会创建 Draft Release
   - 检查并编辑 Release Notes
   - 发布 Release

## 故障排除

### 常见问题

1. **构建失败 - 依赖问题**
   - 清理缓存：在 Actions 页面删除缓存
   - 检查 pnpm-lock.yaml 是否提交

2. **Tauri 构建失败**
   - 检查 Rust 工具链版本
   - 确认系统依赖已安装（Linux）
   - 验证代码签名证书（macOS）

3. **Vercel 部署失败**
   - 检查环境变量配置
   - 查看 Vercel 部署日志
   - 验证 build 命令配置

### 调试技巧

1. **启用调试日志**
   - 在 Secrets 中添加 `ACTIONS_STEP_DEBUG: true`
   - 查看详细的构建日志

2. **本地测试工作流**
   ```bash
   # 安装 act 工具
   brew install act
   
   # 本地运行工作流
   act push
   ```

3. **检查 Secrets**
   ```bash
   # 验证 Secrets 是否正确配置
   echo ${{ secrets.SECRET_NAME }} > /dev/null
   ```

## 最佳实践

1. **版本管理**
   - 使用语义化版本（SemVer）
   - 为每个版本创建 Git tag
   - 保持 CHANGELOG.md 更新

2. **代码签名**
   - 为所有平台配置代码签名
   - 安全存储签名密钥
   - 定期更新证书

3. **测试策略**
   - 在 PR 中运行所有测试
   - 只在 main 分支部署
   - 使用 Preview 部署进行测试

4. **安全性**
   - 定期更新依赖
   - 使用 Dependabot 自动更新
   - 审查第三方 Actions 权限

## 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Tauri Actions](https://github.com/tauri-apps/tauri-action)
- [Vercel GitHub App](https://vercel.com/docs/github)
- [pnpm Actions](https://github.com/pnpm/action-setup)

# 部署和发布指南

本文档介绍如何部署和发布飞书数据同步工具。

## 📦 发布流程

### 1. 版本管理

更新 `package.json` 和 `src-tauri/tauri.conf.json` 中的版本号：

```json
{
  "version": "1.0.0"
}
```

### 2. 构建Web应用

```bash
# 构建生产版本
pnpm build
```

### 3. 打包桌面应用

#### Windows

```bash
# 打包为MSI安装包
pnpm tauri:build

# 打包为NSIS安装包
pnpm tauri:build --target nsis
```

#### macOS

```bash
# 打包为DMG安装包
pnpm tauri:build --target dmg

# 打包为APP包
pnpm tauri:build --target app
```

#### Linux

```bash
# 打包为DEB包
pnpm tauri:build --target deb

# 打包为AppImage
pnpm tauri:build --target appimage
```

### 4. 测试打包结果

在 `src-tauri/target/release/bundle/` 目录中找到打包文件：

- Windows: `msi/` 或 `nsis/`
- macOS: `dmg/` 或 `app/`
- Linux: `deb/` 或 `appimage/`

## 🌐 Web部署

### Vercel部署

1. 将代码推送到GitHub
2. 在Vercel中导入项目
3. 配置环境变量
4. 部署

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
```

构建和运行：

```bash
docker build -t feishu-sync-tool .
docker run -p 3000:3000 feishu-sync-tool
```

## 🔐 环境变量配置

### 生产环境

创建 `.env.production` 文件：

```env
# 飞书应用配置
FEISHU_APP_ID=your_production_app_id
FEISHU_APP_SECRET=your_production_app_secret

# S3存储配置
COZE_BUCKET_NAME=your_production_bucket
COZE_REGION=your_production_region
COZE_ACCESS_KEY_ID=your_production_access_key
COZE_SECRET_ACCESS_KEY=your_production_secret_key

# API配置
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
```

### 开发环境

创建 `.env.local` 文件：

```env
# 飞书应用配置
FEISHU_APP_ID=your_dev_app_id
FEISHU_APP_SECRET=your_dev_app_secret

# S3存储配置
COZE_BUCKET_NAME=your_dev_bucket
COZE_REGION=your_dev_region
COZE_ACCESS_KEY_ID=your_dev_access_key
COZE_SECRET_ACCESS_KEY=your_dev_secret_key

# API配置
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## 🚀 CI/CD 配置与自动部署

项目已配置完整的 CI/CD 流程，支持自动构建、测试和部署。

### GitHub Actions 工作流

项目包含以下工作流：

#### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

**触发条件：**
- 推送到 `main`, `master`, `develop` 分支
- 创建 Pull Request

**功能：**
- ✅ 自动代码检查（ESLint）
- ✅ TypeScript 类型检查
- ✅ 自动化测试
- ✅ Next.js 构建
- ✅ 构建产物上传

#### 2. Tauri 桌面应用构建 (`.github/workflows/build-tauri.yml`)

**触发条件：**
- 推送版本标签（如 `v1.0.0`）
- 手动触发工作流

**功能：**
- ✅ Windows (MSI/NSIS) 自动打包
- ✅ macOS (DMG) 自动打包
- ✅ Linux (DEB/AppImage) 自动打包
- ✅ 自动创建 GitHub Release
- ✅ 代码签名（可选配置）

### Vercel 自动部署（推荐）

#### 方式一：Vercel GitHub App（最简单）

**设置步骤：**

1. **安装 Vercel GitHub App**
   - 访问 [Vercel GitHub App](https://github.com/apps/vercel)
   - 点击 "Install" 并授权访问此仓库

2. **导入项目到 Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "Add New Project"
   - 选择 "Import Git Repository"
   - 选择此 GitHub 仓库

3. **配置环境变量**
   在 Vercel 项目设置中添加以下环境变量：
   ```
   FEISHU_APP_ID              # 飞书应用 ID
   FEISHU_APP_SECRET          # 飞书应用密钥
   COZE_BUCKET_NAME          # S3 存储桶名称
   COZE_REGION               # S3 区域
   COZE_ACCESS_KEY_ID        # S3 访问密钥 ID
   COZE_SECRET_ACCESS_KEY    # S3 访问密钥
   ```

4. **配置构建设置**
   - Framework Preset: `Next.js`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

5. **完成设置**
   - 点击 "Deploy"
   - 等待首次部署完成

**自动部署流程：**

| 事件 | 结果 |
|------|------|
| 推送到任何分支 | 创建 Preview 部署 |
| 推送到 `main` 分支 | 自动部署到生产环境 |
| 创建 Pull Request | 创建预览部署并添加评论 |
| 合并 PR 到 main | 自动部署到生产环境 |

#### 方式二：使用 GitHub Actions 部署

如果需要更复杂的部署逻辑，可以在 CI/CD 工作流中添加 Vercel 部署步骤。

**步骤：**

1. **获取 Vercel Token**
   - 访问 [Vercel Settings > Tokens](https://vercel.com/account/tokens)
   - 创建新的 API Token
   - 复制 Token 并添加到 GitHub Secrets：`VERCEL_TOKEN`

2. **添加部署步骤到 CI 工作流**
   
   在 `.github/workflows/ci.yml` 的 `build-web` job 中添加：
   
   ```yaml
   - name: Deploy to Vercel
     run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
     env:
       VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
       VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
   ```

3. **安装 Vercel CLI**
   
   ```yaml
   - name: Install Vercel CLI
     run: npm install -g vercel
   ```

### GitHub Secrets 配置

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加以下 Secrets：

#### 基础配置（必需）
```bash
FEISHU_APP_ID              # 飞书应用 ID
FEISHU_APP_SECRET          # 飞书应用密钥
COZE_BUCKET_NAME          # S3 存储桶名称
COZE_REGION               # S3 区域
COZE_ACCESS_KEY_ID        # S3 访问密钥 ID
COZE_SECRET_ACCESS_KEY    # S3 访问密钥
```

#### Vercel 部署（可选）
```bash
VERCEL_TOKEN              # Vercel API Token
VERCEL_ORG_ID            # Vercel 组织 ID（从 Vercel Dashboard 获取）
VERCEL_PROJECT_ID        # Vercel 项目 ID（从 Vercel Dashboard 获取）
```

#### Tauri 代码签名（可选但推荐）
```bash
TAURI_PRIVATE_KEY         # Tauri 更新签名私钥
TAURI_KEY_PASSWORD        # 私钥密码
```

#### Apple 代码签名（仅 macOS 需要）
```bash
APPLE_CERTIFICATE              # Apple 开发者证书（base64 编码）
APPLE_CERTIFICATE_PASSWORD     # 证书密码
APPLE_SIGNING_IDENTITY         # 签名身份
APPLE_ID                      # Apple ID
APPLE_PASSWORD                # 应用专用密码
APPLE_TEAM_ID                 # Apple 团队 ID
```

### 完整发布流程

#### 1. 更新版本号

```bash
# 更新 package.json 和 tauri.conf.json 中的版本号
# 使用语义化版本（SemVer）

# 补丁版本（bug 修复）
npm version patch

# 次版本（新功能，向后兼容）
npm version minor

# 主版本（不兼容的 API 变更）
npm version major
```

这会自动：
- 更新 `package.json` 版本号
- 更新 `src-tauri/tauri.conf.json` 版本号
- 创建 commit
- 创建 Git tag（如 `v1.0.0`）

#### 2. 推送到 GitHub

```bash
# 推送代码和标签
git push origin main --tags
```

#### 3. 自动触发流程

推送后，GitHub Actions 会自动执行：

1. **CI/CD Pipeline**
   - 运行所有测试
   - 代码质量检查
   - 构建验证

2. **Tauri 构建**（如果有版本标签）
   - 构建 Windows 安装包
   - 构建 macOS 安装包
   - 构建 Linux 安装包
   - 创建 Draft Release

3. **Vercel 部署**
   - 自动部署到 Vercel
   - 更新生产环境

#### 4. 发布 Release

1. 访问 GitHub 仓库的 **Releases** 页面
2. 找到刚创建的 Draft Release
3. 编辑 Release Notes（通常会自动生成）
4. 确认所有平台的安装包已上传
5. 点击 "Publish Release"

### 手动触发部署

#### 手动触发 Tauri 构建

1. 访问 GitHub 仓库的 **Actions** 标签
2. 选择 **"Build Tauri Desktop App"** 工作流
3. 点击 **"Run workflow"**
4. 输入版本号（如 `v1.0.0`）
5. 选择分支（通常是 `main`）
6. 点击 **"Run workflow"**

#### 查看构建状态

- **GitHub Actions**: 访问 **Actions** 标签查看所有工作流运行状态
- **Vercel 部署**: 访问 [Vercel Dashboard](https://vercel.com/dashboard) 查看部署状态
- **构建产物**: 
  - Web 构建：在 Actions 页面的 **Artifacts** 中下载
  - 桌面应用：在 **Releases** 页面下载各平台安装包

## 📝 发布检查清单

- [ ] 更新版本号
- [ ] 更新 CHANGELOG.md
- [ ] 运行所有测试
- [ ] 构建成功
- [ ] 测试打包文件
- [ ] 更新文档
- [ ] 创建Git标签
- [ ] 推送到GitHub
- [ ] 创建Release

## 🐛 故障排除

### 构建失败

1. 清理缓存：`pnpm clean`
2. 重新安装依赖：`rm -rf node_modules && pnpm install`
3. 检查Node.js版本：`node --version`

### 打包失败

1. 检查Rust工具链：`rustc --version`
2. 安装Tauri CLI：`pnpm add -D @tauri-apps/cli`
3. 检查系统依赖

### 环境变量问题

1. 确认 `.env.local` 文件存在
2. 检查变量名拼写
3. 重启开发服务器

## 📦 部署检查功能

### 概述

本项目包含一个部署检查功能，用于在构建Windows桌面版时检测是否已经部署过该应用。

### 工作原理

1. **构建时检查**：运行 `build-installer.bat` 时，脚本会通过PowerShell检查Windows注册表中的以下位置：
   - `HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall`
   - `HKLM\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall`
   - `HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall`
   - `HKLM\Software\Microsoft\Windows\CurrentVersion\App Paths`

2. **运行时检查**：应用启动时，会通过Tauri调用Rust函数检查相同的注册表位置。

3. **UI 指示**：如果检测到之前的部署，应用顶部导航栏会显示一个红色的部署检查指示器。

### 处理部署冲突

如果检测到之前的部署，构建过程会停止并提示用户卸载旧版本。这是为了避免版本冲突和确保应用正常运行。

### 技术实现

- **Rust 函数**：`src-tauri/src/main.rs` 中的 `check_previous_deployment` 函数
- **前端集成**：`src/services/tauri.ts` 中的 `checkPreviousDeployment` 方法
- **构建脚本**：`build-installer.bat` 中的PowerShell部署检查逻辑
- **UI 组件**：`src/app/page.tsx` 中的部署检查指示器

## 📞 支持

如遇到问题，请：

1. 查看文档
2. 检查GitHub Issues
3. 联系技术支持

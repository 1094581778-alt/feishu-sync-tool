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

## 🚀 CI/CD配置

### GitHub Actions

创建 `.github/workflows/build.yml`：

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
        include:
          - os: windows-latest
            target: nsis
          - os: macos-latest
            target: dmg
          - os: ubuntu-latest
            target: deb

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Build Tauri
        run: pnpm tauri:build
        env:
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-${{ matrix.target }}
          path: src-tauri/target/release/bundle/${{ matrix.target }}/*
```

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

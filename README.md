# 飞书表格数据同步管理工具

一个现代化的飞书表格数据同步管理工具，支持多工作表上传、字段匹配、历史模版等功能。

## ✨ 特性

- 🎨 **现代化 UI 设计** - 采用 Tailwind CSS 和 Radix UI 构建的专业界面
- 🌓 **多主题支持** - 浅色、深色、护眼、高对比度等多种主题
- 📊 **多工作表管理** - 支持同时上传多个工作表
- 🔍 **智能字段匹配** - 自动匹配 Excel 字段和飞书表格字段
- 💾 **历史模版** - 保存和恢复工作表选择配置
- 🎯 **批量操作** - 一键全选、取消选择
- 🔐 **安全配置** - 飞书 API 凭证安全存储

## 🚀 快速开始

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

访问 `http://localhost:5000`

## 📦 部署到 Vercel

### 方法一：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel
```

### 方法二：通过 Vercel Dashboard 部署

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New Project"
3. 导入您的 GitHub 仓库
4. Vercel 会自动检测 Next.js 项目
5. 配置环境变量（见下方）
6. 点击 "Deploy"

### 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

| 变量名 | 说明 | 必需 |
|--------|------|--------|
| `FEISHU_APP_ID` | 飞书应用 ID | ✅ |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | ✅ |
| `AWS_ACCESS_KEY_ID` | AWS 访问密钥 ID | ❌ |
| `AWS_SECRET_ACCESS_KEY` | AWS 访问密钥 | ❌ |
| `AWS_REGION` | AWS 区域 | ❌ |
| `AWS_S3_BUCKET` | S3 存储桶名称 | ❌ |
| `NEXT_PUBLIC_APP_URL` | 应用 URL | ✅ |

### 获取飞书应用凭证

1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 创建新应用或选择现有应用
3. 在"凭证与基础信息"中获取 App ID 和 App Secret
4. 在"权限管理"中添加以下权限：
   - `bitable:app` - 多维表格应用权限
   - `bitable:app:readonly` - 多维表格只读权限

### Vercel 配置

项目已包含 `vercel.json` 配置文件：

```json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1"]
}
```

- **构建命令**: `pnpm build`
- **输出目录**: `.next`
- **开发命令**: `pnpm dev`
- **安装命令**: `pnpm install`
- **部署区域**: 香港 (hkg1)

## 🛠️ 技术栈

- **框架**: Next.js 16
- **UI 库**: Radix UI
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand
- **语言**: TypeScript
- **包管理**: pnpm

## 📁 项目结构

```
src/
├── app/              # Next.js App Router
│   ├── api/         # API 路由
│   ├── globals.css  # 全局样式
│   └── page.tsx    # 主页面
├── components/       # React 组件
│   ├── steps/       # 步骤组件
│   └── ui/         # UI 组件
├── hooks/           # 自定义 Hooks
├── types/           # TypeScript 类型
├── utils/           # 工具函数
└── constants/       # 常量定义
```

## 🔧 开发脚本

```bash
# 开发
pnpm dev

# 构建
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 类型检查
pnpm type-check

# 清理缓存
pnpm clean
```

## 📝 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

如有问题，请通过以下方式联系：
- 提交 Issue
- 发送邮件

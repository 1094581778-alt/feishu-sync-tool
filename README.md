# 飞书数据同步工具

一个功能强大的飞书表格数据同步工具，支持Excel文件上传、字段匹配、批量同步等功能。

## 🚀 功能特性

- ✅ Excel文件上传和解析
- ✅ 飞书表格字段智能匹配
- ✅ 批量数据同步
- ✅ 历史模板管理
- ✅ 工作表和Sheet配置
- ✅ 实时同步状态反馈
- ✅ 支持打包为桌面应用

## 📋 系统要求

- Node.js >= 18.0.0
- pnpm >= 9.0.0
- Windows / macOS / Linux

## 🔧 开发环境设置

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.local.example` 到 `.env.local` 并配置：

```env
# 飞书应用配置
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret

# S3存储配置（可选）
COZE_BUCKET_NAME=your_bucket_name
COZE_REGION=your_region
COZE_ACCESS_KEY_ID=your_access_key_id
COZE_SECRET_ACCESS_KEY=your_secret_access_key
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5000

## 🏗️ 构建和打包

### Web应用构建

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

### 桌面应用打包

#### 安装Tauri CLI

```bash
pnpm add -D @tauri-apps/cli
```

#### 开发模式

```bash
pnpm tauri:dev
```

#### 打包应用

```bash
# 打包为安装包（Windows MSI/NSIS）
pnpm tauri:build

# 打包为调试版本
pnpm tauri:build:debug
```

打包后的文件位于 `src-tauri/target/release/bundle/`

## 📦 打包产物

### Windows

- **MSI安装包**: `msi/飞书数据同步工具_1.0.0_x64_en-US.msi`
- **NSIS安装包**: `nsis/飞书数据同步工具_1.0.0_x64-setup.exe`
- **便携版**: `飞书数据同步工具.exe`

### macOS

- **DMG安装包**: `dmg/飞书数据同步工具_1.0.0_x64.dmg`
- **APP包**: `app/飞书数据同步工具.app`

### Linux

- **DEB包**: `deb/飞书数据同步工具_1.0.0_amd64.deb`
- **AppImage**: `appimage/飞书数据同步工具_1.0.0_amd64.AppImage`

## 🧪 测试

```bash
# 类型检查
pnpm type-check

# 代码检查
pnpm lint
```

## 📁 项目结构

```
projects/
├── src/                    # 源代码
│   ├── app/               # Next.js应用
│   ├── components/         # React组件
│   ├── config/            # 配置文件
│   ├── hooks/             # 自定义Hooks
│   ├── services/          # 服务层
│   ├── store/             # 状态管理
│   ├── types/             # TypeScript类型
│   └── utils/             # 工具函数
├── src-tauri/            # Tauri后端
│   ├── src/
│   │   └── main.rs       # Rust主程序
│   ├── Cargo.toml
│   └── tauri.conf.json
├── scripts/              # 构建脚本
├── public/               # 静态资源
└── package.json
```

## 🔑 环境变量

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `FEISHU_APP_ID` | 飞书应用ID | 是 |
| `FEISHU_APP_SECRET` | 飞书应用密钥 | 是 |
| `COZE_BUCKET_NAME` | S3存储桶名称 | 否 |
| `COZE_REGION` | S3存储区域 | 否 |
| `COZE_ACCESS_KEY_ID` | S3访问密钥ID | 否 |
| `COZE_SECRET_ACCESS_KEY` | S3访问密钥 | 否 |

## 📝 开发指南

### 添加新功能

1. 在 `src/components/` 中创建组件
2. 在 `src/hooks/` 中添加自定义Hooks
3. 在 `src/services/` 中添加服务
4. 在 `src/types/` 中定义类型
5. 在 `src/config/` 中添加配置

### 代码规范

- 使用 TypeScript
- 遵循 ESLint 规则
- 组件使用函数式组件
- 使用 Zustand 进行状态管理

## 🐛 问题反馈

如遇到问题，请检查：

1. 环境变量是否正确配置
2. 飞书应用权限是否正确
3. 网络连接是否正常
4. 浏览器控制台是否有错误

## 📄 许可证

MIT License

## 🙏 致谢

- [Next.js](https://nextjs.org/)
- [Tauri](https://tauri.app/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)

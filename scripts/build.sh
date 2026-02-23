#!/bin/bash

set -e

echo "🚀 开始构建飞书数据同步工具..."

echo "📦 清理缓存..."
pnpm clean

echo "🔨 安装依赖..."
pnpm install

echo "🔍 类型检查..."
pnpm type-check

echo "🧹 代码检查..."
pnpm lint

echo "🏗️ 构建项目..."
pnpm build

echo "✅ 构建完成！"
echo "📁 构建产物位于: .next"

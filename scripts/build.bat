@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo 🚀 开始构建飞书数据同步工具...

echo 📦 清理缓存...
if exist .next rmdir /s /q .next
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo 🔨 安装依赖...
call pnpm install

echo 🔍 类型检查...
call pnpm type-check

echo 🧹 代码检查...
call pnpm lint

echo 🏗️ 构建项目...
call pnpm build

echo ✅ 构建完成！
echo 📁 构建产物位于: .next

endlocal

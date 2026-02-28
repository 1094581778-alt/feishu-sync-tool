#!/bin/bash

APP_DIR="/var/www/feishu-app"
SERVER_IP="8.140.193.108"

echo "=========================================="
echo "飞书同步工具 - 项目部署脚本"
echo "=========================================="

cd ${APP_DIR}

echo "[1/4] 安装依赖..."
pnpm install

echo "[2/4] 构建项目..."
pnpm build

echo "[3/4] 停止旧进程..."
pm2 stop feishu-app 2>/dev/null || true
pm2 delete feishu-app 2>/dev/null || true

echo "[4/4] 启动新进程..."
pm2 start npm --name "feishu-app" -- run start -- --port 5000
pm2 save

echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "访问地址: http://${SERVER_IP}:5000"
echo ""
echo "常用命令:"
echo "  查看日志: pm2 logs feishu-app"
echo "  重启服务: pm2 restart feishu-app"
echo "  停止服务: pm2 stop feishu-app"
echo "=========================================="

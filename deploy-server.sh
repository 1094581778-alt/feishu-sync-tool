#!/bin/bash

echo "=========================================="
echo "飞书同步工具 - 服务器部署脚本"
echo "=========================================="

SERVER_IP="8.140.193.108"
APP_DIR="/var/www/feishu-app"

echo "[1/6] 更新系统..."
apt update && apt upgrade -y

echo "[2/6] 安装依赖..."
apt install -y curl git nginx

echo "[3/6] 安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node版本: $(node -v)"
echo "NPM版本: $(npm -v)"

echo "[4/6] 安装 pnpm 和 PM2..."
npm install -g pnpm pm2

echo "[5/6] 创建 Swap (2GB)..."
if [ ! -f /swapfile ]; then
    dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "Swap创建成功"
else
    echo "Swap已存在"
fi

echo "[6/6] 配置防火墙..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 5000
ufw --force enable

echo "=========================================="
echo "基础环境安装完成！"
echo "=========================================="
echo ""
echo "下一步操作："
echo "1. 上传项目代码到服务器:"
echo "   scp -r 项目目录/* root@${SERVER_IP}:${APP_DIR}"
echo ""
echo "2. 或者使用 Git 克隆:"
echo "   git clone 你的仓库地址 ${APP_DIR}"
echo ""
echo "3. 进入项目目录并安装依赖:"
echo "   cd ${APP_DIR}"
echo "   pnpm install"
echo "   pnpm build"
echo ""
echo "4. 启动应用:"
echo "   pm2 start npm --name feishu-app -- run start -- --port 5000"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "服务器IP: ${SERVER_IP}"
echo "访问地址: http://${SERVER_IP}:5000"
echo "=========================================="

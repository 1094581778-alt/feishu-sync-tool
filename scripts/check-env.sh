#!/bin/bash
# 环境变量诊断脚本
# 用于验证部署环境的环境变量是否正确加载

echo "========================================="
echo "环境变量诊断工具"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_env_var() {
  local var_name=$1
  local var_value="${!var_name}"

  if [ -z "$var_value" ]; then
    echo -e "${RED}❌ $var_name: 未设置${NC}"
    return 1
  else
    # 如果变量看起来像凭证，只显示前4个字符
    if [[ "$var_name" =~ (SECRET|TOKEN|KEY) ]]; then
      masked_value="${var_value:0:4}***${var_value: -4}"
      echo -e "${GREEN}✅ $var_name: $masked_value${NC}"
    else
      echo -e "${GREEN}✅ $var_name: $var_value${NC}"
    fi
    return 0
  fi
}

echo "1. 检查环境变量文件"
echo "-------------------------------------------"
if [ -f ".env.local" ]; then
  echo -e "${GREEN}✅ .env.local 存在${NC}"
else
  echo -e "${YELLOW}⚠️  .env.local 不存在（仅开发环境使用）${NC}"
fi

if [ -f ".env.production" ]; then
  echo -e "${GREEN}✅ .env.production 存在${NC}"
  echo "   内容预览:"
  grep -v "SECRET" .env.production | head -5 | sed 's/^/   /'
else
  echo -e "${YELLOW}⚠️  .env.production 不存在${NC}"
fi

if [ -f ".env" ]; then
  echo -e "${GREEN}✅ .env 存在${NC}"
else
  echo -e "${YELLOW}⚠️  .env 不存在${NC}"
fi

echo ""
echo "2. 检查当前环境变量"
echo "-------------------------------------------"
check_env_var "FEISHU_APP_ID"
check_env_var "FEISHU_APP_SECRET"
check_env_var "FEISHU_SPREADSHEET_TOKEN"
check_env_var "FEISHU_SHEET_ID"
check_env_var "COZE_WORKSPACE_PATH"
check_env_var "NODE_ENV"

echo ""
echo "3. 检查 .coze 配置"
echo "-------------------------------------------"
if [ -f ".coze" ]; then
  echo -e "${GREEN}✅ .coze 存在${NC}"
  if grep -q "\[env\]" .coze; then
    echo "   [env] 配置段:"
    sed -n '/\[env\]/,/\[/p' .coze | head -10 | sed 's/^/   /'
  else
    echo -e "${YELLOW}⚠️  .coze 中没有 [env] 配置段${NC}"
  fi
else
  echo -e "${RED}❌ .coze 不存在${NC}"
fi

echo ""
echo "4. 检查部署脚本"
echo "-------------------------------------------"
if [ -f "scripts/build.sh" ]; then
  echo -e "${GREEN}✅ scripts/build.sh 存在${NC}"
else
  echo -e "${YELLOW}⚠️  scripts/build.sh 不存在${NC}"
fi

if [ -f "scripts/start.sh" ]; then
  echo -e "${GREEN}✅ scripts/start.sh 存在${NC}"
else
  echo -e "${YELLOW}⚠️  scripts/start.sh 不存在${NC}"
fi

echo ""
echo "5. 模拟加载环境变量（从 .env.production）"
echo "-------------------------------------------"
if [ -f ".env.production" ]; then
  echo "正在加载 .env.production..."
  # 不实际加载，只显示会加载什么
  echo "将要导出的变量:"
  grep -v '^#' .env.production | grep -v '^$' | sed 's/^/   /'
else
  echo -e "${YELLOW}⚠️  .env.production 不存在，无法模拟加载${NC}"
fi

echo ""
echo "6. 检查 Next.js 配置"
echo "-------------------------------------------"
if [ -f "next.config.ts" ]; then
  echo -e "${GREEN}✅ next.config.ts 存在${NC}"
  if grep -q "env" next.config.ts; then
    echo "   注意: next.config.ts 中包含环境变量配置"
  else
    echo "   next.config.ts 中没有显式的环境变量配置"
  fi
else
  echo -e "${RED}❌ next.config.ts 不存在${NC}"
fi

echo ""
echo "7. 推荐的修复方案"
echo "-------------------------------------------"
echo -e "${GREEN}方案 1: 在部署平台配置环境变量（推荐）${NC}"
echo "   1. 登录部署平台"
echo "   2. 找到应用设置 → 环境变量"
echo "   3. 添加以下变量:"
echo "      - FEISHU_APP_ID=YOUR_APP_ID"
echo "      - FEISHU_APP_SECRET=YOUR_APP_SECRET"
echo "   4. 重新部署"
echo ""
echo -e "${GREEN}方案 2: 使用用户配置界面（最安全）${NC}"
echo "   1. 打开应用"
echo "   2. 点击右上角 '飞书配置'"
echo "   3. 输入凭证"
echo "   4. 保存配置"
echo ""

echo "========================================="
echo "诊断完成"
echo "========================================="

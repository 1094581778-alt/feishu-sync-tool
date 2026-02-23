#!/bin/bash
# 测试环境变量加载（简化版）

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

echo "========================================="
echo "测试环境变量加载（简化版）"
echo "========================================="
echo ""

# 测试从 .coze 加载
echo "1. 测试从 .coze 加载环境变量"
echo "-------------------------------------------"
if [ -f "${COZE_WORKSPACE_PATH}/.coze" ]; then
  echo "提取的配置:"
  sed -n '/^\[env\]$/,/^\[[a-z]\|^$/p' "${COZE_WORKSPACE_PATH}/.coze" | \
    grep -v '^\[' | \
    grep -v '^$' | \
    while IFS='=' read -r key value; do
      key=$(echo "$key" | xargs)
      value=$(echo "$value" | xargs | sed 's/^["\x27]*//;s/["\x27]*$//')
      echo "  $key=$value"
    done
else
  echo "❌ .coze 文件不存在"
fi
echo ""

# 测试从 .env.production 加载
echo "2. 测试从 .env.production 加载环境变量"
echo "-------------------------------------------"
if [ -f "${COZE_WORKSPACE_PATH}/.env.production" ]; then
  echo "提取的配置:"
  cat "${COZE_WORKSPACE_PATH}/.env.production" | grep "^FEISHU" | sed 's/^/  /'
else
  echo "❌ .env.production 文件不存在"
fi
echo ""

# 测试实际加载
echo "3. 测试实际加载环境变量"
echo "-------------------------------------------"
FEISHU_APP_ID=""
FEISHU_APP_SECRET=""

# 从 .coze 加载
if [ -f "${COZE_WORKSPACE_PATH}/.coze" ]; then
  while IFS='=' read -r key value; do
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs | sed 's/^["\x27]*//;s/["\x27]*$//')
    if [ -n "$key" ] && [ -n "$value" ]; then
      case "$key" in
        FEISHU_APP_ID) export FEISHU_APP_ID="$value" ;;
        FEISHU_APP_SECRET) export FEISHU_APP_SECRET="$value" ;;
      esac
    fi
  done < <(sed -n '/^\[env\]$/,/^\[[a-z]\|^$/p' "${COZE_WORKSPACE_PATH}/.coze" | grep -v '^\[' | grep -v '^$')
fi

# 从 .env.production 加载
if [ -f "${COZE_WORKSPACE_PATH}/.env.production" ]; then
  set -a
  source "${COZE_WORKSPACE_PATH}/.env.production"
  set +a
fi

echo "加载后的环境变量:"
echo "  FEISHU_APP_ID=${FEISHU_APP_ID:+已配置}"
echo "  FEISHU_APP_SECRET=${FEISHU_APP_SECRET:+已配置}"

if [ -n "$FEISHU_APP_ID" ] && [ -n "$FEISHU_APP_SECRET" ]; then
  echo ""
  echo -e "\033[0;32m✅ 环境变量加载成功！\033[0m"
else
  echo ""
  echo -e "\033[0;31m❌ 环境变量加载失败！\033[0m"
fi

echo ""
echo "========================================="

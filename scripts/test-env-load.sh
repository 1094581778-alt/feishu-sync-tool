#!/bin/bash
# 测试环境变量加载脚本
# 验证 .coze 和 .env.production 的环境变量是否能正确加载

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

echo "========================================="
echo "测试环境变量加载"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. 测试 .coze 文件解析"
echo "-------------------------------------------"
if [ -f "${COZE_WORKSPACE_PATH}/.coze" ]; then
  echo "正在解析 .coze 文件的 [env] 部分..."
  echo ""
  echo "提取的配置:"
  awk '/\[env\]/,/\[[a-zA-Z]/' "${COZE_WORKSPACE_PATH}/.coze" | \
    grep -v '^\[' | \
    grep -v '^$' | \
    while IFS='=' read -r key value; do
      key=$(echo "$key" | xargs)
      value=$(echo "$value" | xargs | sed 's/^["\x27]*//;s/["\x27]*$//')
      if [ -n "$key" ] && [ -n "$value" ]; then
        echo "  $key=$value"
      fi
    done
  echo ""
else
  echo -e "${RED}❌ .coze 文件不存在${NC}"
fi

echo "2. 模拟加载环境变量"
echo "-------------------------------------------"

# 创建临时脚本来模拟环境变量加载
cat > /tmp/test_env_load.sh << 'EOF'
#!/bin/bash

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

# 从 .coze 文件加载
if [ -f "${COZE_WORKSPACE_PATH}/.coze" ]; then
  awk '/\[env\]/,/\[[a-zA-Z]/' "${COZE_WORKSPACE_PATH}/.coze" | \
    grep -v '^\[' | \
    grep -v '^$' | \
    while IFS='=' read -r key value; do
      key=$(echo "$key" | xargs)
      value=$(echo "$value" | xargs | sed 's/^["\x27]*//;s/["\x27]*$//')
      if [ -n "$key" ] && [ -n "$value" ]; then
        export "$key=$value"
      fi
    done
fi

# 从 .env.production 加载
if [ -f "${COZE_WORKSPACE_PATH}/.env.production" ]; then
  export $(cat "${COZE_WORKSPACE_PATH}/.env.production" | grep -v '^#' | xargs)
fi

# 输出环境变量
echo "FEISHU_APP_ID=${FEISHU_APP_ID}"
echo "FEISHU_APP_SECRET=${FEISHU_APP_SECRET}"
EOF

chmod +x /tmp/test_env_load.sh
echo "执行结果:"
/tmp/test_env_load.sh | sed 's/^/  /'
echo ""

echo "3. 验证环境变量格式"
echo "-------------------------------------------"

# 检查 .env.production 格式
if [ -f "${COZE_WORKSPACE_PATH}/.env.production" ]; then
  echo "检查 .env.production 格式:"
  grep "^FEISHU" "${COZE_WORKSPACE_PATH}/.env.production" | while read -r line; do
    if echo "$line" | grep -qE '^FEISHU_[A-Z_]+='; then
      var_name=$(echo "$line" | cut -d'=' -f1)
      var_value=$(echo "$line" | cut -d'=' -f2)
      if [ -n "$var_value" ]; then
        echo -e "  ${GREEN}✅${NC} $var_name: 已设置"
      else
        echo -e "  ${YELLOW}⚠️${NC} $var_name: 值为空"
      fi
    else
      echo -e "  ${RED}❌${NC} 格式错误: $line"
    fi
  done
  echo ""
fi

# 检查 .coze [env] 格式
if [ -f "${COZE_WORKSPACE_PATH}/.coze" ]; then
  echo "检查 .coze [env] 格式:"
  awk '/\[env\]/,/\[[a-zA-Z]/' "${COZE_WORKSPACE_PATH}/.coze" | \
    grep -v '^\[' | \
    grep -v '^$' | \
    while read -r line; do
      if echo "$line" | grep -qE '^[A-Z_]+\s*='; then
        var_name=$(echo "$line" | cut -d'=' -f1 | xargs)
        var_value=$(echo "$line" | cut -d'=' -f2 | xargs | sed 's/^["\x27]*//;s/["\x27]*$//')
        if [ -n "$var_value" ]; then
          echo -e "  ${GREEN}✅${NC} $var_name: 已设置"
        else
          echo -e "  ${YELLOW}⚠️${NC} $var_name: 值为空"
        fi
      else
        echo -e "  ${RED}❌${NC} 格式错误: $line"
      fi
    done
  echo ""
fi

echo "4. 测试构建脚本"
echo "-------------------------------------------"
echo "正在模拟构建脚本的环境变量加载部分..."

# 提取 build.sh 的 load_env_vars 函数并执行
awk '/^load_env_vars\(\)/,/^}/' "${COZE_WORKSPACE_PATH}/scripts/build.sh" | \
  head -n -1 | \
  tail -n +2 | \
  sed 's/^[[:space:]]*//' | \
  bash -s

echo "加载后的环境变量:"
echo "  FEISHU_APP_ID=${FEISHU_APP_ID:+已配置}"
echo "  FEISHU_APP_SECRET=${FEISHU_APP_SECRET:+已配置}"
echo ""

echo "========================================="
echo "测试完成"
echo "========================================="

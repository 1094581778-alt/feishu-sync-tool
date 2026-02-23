#!/bin/bash
# 测试构建和启动脚本的环境变量加载

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

echo "========================================="
echo "测试构建和启动脚本的环境变量加载"
echo "========================================="
echo ""

# 复制 load_env_vars 函数（与 scripts/build.sh 和 scripts/start.sh 相同）
load_env_vars() {
  local env_file=""
  local coze_file="${COZE_WORKSPACE_PATH}/.coze"
  local prod_file="${COZE_WORKSPACE_PATH}/.env.production"

  echo "检查环境文件:"
  echo "  .coze: $([ -f "$coze_file" ] && echo "存在" || echo "不存在")"
  echo "  .env.production: $([ -f "$prod_file" ] && echo "存在" || echo "不存在")"
  echo ""

  # 优先从 .env.production 加载
  if [ -f "$prod_file" ]; then
    env_file="$prod_file"
    echo "选择加载: .env.production"
  fi

  # 从 .coze 加载（如果 .env.production 不存在）
  if [ -z "$env_file" ] && [ -f "$coze_file" ]; then
    # 创建临时环境变量文件
    env_file=$(mktemp)
    echo "选择加载: .coze（临时文件: $env_file）"
    echo ""
    echo "从 .coze 提取的内容:"
    sed -n '/^\[env\]$/,/^\[[a-z]\|^$/p' "$coze_file" | \
      grep -v '^\[' | \
      grep -v '^$' | \
      sed 's/^/  /'
    echo ""

    sed -n '/^\[env\]$/,/^\[[a-z]\|^$/p' "$coze_file" | \
      grep -v '^\[' | \
      grep -v '^$' | \
      sed 's/ = /=/g' | \
      sed 's/^["\x27]*//;s/["\x27]*$//' > "$env_file"

    echo "转换后的环境变量文件内容:"
    cat "$env_file" | sed 's/^/  /'
    echo ""
  fi

  # 加载环境变量文件
  if [ -n "$env_file" ] && [ -f "$env_file" ]; then
    echo "正在加载环境变量文件: $env_file"
    set -a  # 自动导出所有变量
    source "$env_file"
    set +a

    # 清理临时文件
    if [ "$env_file" != "$prod_file" ]; then
      echo "清理临时文件..."
      rm -f "$env_file"
    fi
  fi
}

# 执行加载
load_env_vars

echo "========================================="
echo "加载结果"
echo "========================================="
echo ""
echo "环境变量状态:"
echo "  FEISHU_APP_ID: ${FEISHU_APP_ID:+已配置}"
echo "  FEISHU_APP_SECRET: ${FEISHU_APP_SECRET:+已配置}"
echo "  FEISHU_SPREADSHEET_TOKEN: ${FEISHU_SPREADSHEET_TOKEN:+已配置}"
echo "  FEISHU_SHEET_ID: ${FEISHU_SHEET_ID:+已配置}"
echo ""

if [ -n "$FEISHU_APP_ID" ] && [ -n "$FEISHU_APP_SECRET" ]; then
  echo "✅ 环境变量加载成功！"
  echo ""
  echo "详细值:"
  echo "  FEISHU_APP_ID=$FEISHU_APP_ID"
  echo "  FEISHU_APP_SECRET=${FEISHU_APP_SECRET:0:4}***${FEISHU_APP_SECRET: -4}"
else
  echo "❌ 环境变量加载失败！"
fi

echo ""
echo "========================================="

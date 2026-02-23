#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
PORT=5000
DEPLOY_RUN_PORT="${DEPLOY_RUN_PORT:-$PORT}"

# 加载环境变量
load_env_vars() {
  local env_file=""
  local coze_file="${COZE_WORKSPACE_PATH}/.coze"
  local prod_file="${COZE_WORKSPACE_PATH}/.env.production"

  # 优先从 .env.production 加载
  if [ -f "$prod_file" ]; then
    env_file="$prod_file"
  fi

  # 从 .coze 加载（如果 .env.production 不存在）
  if [ -z "$env_file" ] && [ -f "$coze_file" ]; then
    # 创建临时环境变量文件
    env_file=$(mktemp)
    sed -n '/^\[env\]$/,/^\[[a-z]\|^$/p' "$coze_file" | \
      grep -v '^\[' | \
      grep -v '^$' | \
      sed 's/ = /=/g' | \
      sed 's/^["\x27]*//;s/["\x27]*$//' > "$env_file"
  fi

  # 加载环境变量文件
  if [ -n "$env_file" ] && [ -f "$env_file" ]; then
    echo "正在加载环境变量文件: $env_file"
    set -a  # 自动导出所有变量
    source "$env_file"
    set +a
    # 清理临时文件
    if [ "$env_file" != "$prod_file" ]; then
      rm -f "$env_file"
    fi
  fi
}

start_service() {
    cd "${COZE_WORKSPACE_PATH}"
    echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."

    # 加载环境变量
    load_env_vars

    # 显示关键环境变量状态（用于调试）
    echo "环境变量状态:"
    echo "  FEISHU_APP_ID: ${FEISHU_APP_ID:+已配置}"
    echo "  FEISHU_APP_SECRET: ${FEISHU_APP_SECRET:+已配置}"

    npx next start --port ${DEPLOY_RUN_PORT}
}

echo "Starting HTTP service on port ${DEPLOY_RUN_PORT} for deploy..."
start_service

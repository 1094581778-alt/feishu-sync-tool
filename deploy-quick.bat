@echo off
chcp 65001 > nul
echo ==========================================
echo 飞书同步工具 - 快速部署脚本
echo ==========================================
echo.

set SERVER_IP=8.140.193.108
set SERVER_USER=root
set APP_DIR=/var/www/feishu-app
set LOCAL_DIR=E:\feishugongju\pack_project\projects

echo [步骤 1/4] 停止旧进程...
echo 请输入服务器密码:
ssh %SERVER_USER%@%SERVER_IP% "cd %APP_DIR% && pm2 stop feishu-app 2>/dev/null || true"
if %errorlevel% neq 0 (
    echo [警告] 停止旧进程失败，可能是没有运行中
)

echo.
echo [步骤 2/4] 上传项目代码...
echo 请再次输入服务器密码:
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %APP_DIR%"
echo 正在上传项目文件，请耐心等待...
scp -r "%LOCAL_DIR%\.next" "%LOCAL_DIR%\package.json" "%LOCAL_DIR%\pnpm-lock.yaml" "%LOCAL_DIR%\next.config.ts" "%LOCAL_DIR%\tsconfig.json" "%LOCAL_DIR%\postcss.config.mjs" "%LOCAL_DIR%\.env.local" "%LOCAL_DIR%\public" "%LOCAL_DIR%\src" %SERVER_USER%@%SERVER_IP%:%APP_DIR%/
if %errorlevel% neq 0 (
    echo [错误] 项目上传失败
    pause
    exit /b 1
)

echo.
echo [步骤 3/4] 安装依赖并构建...
echo 请再次输入服务器密码:
ssh %SERVER_USER%@%SERVER_IP% "cd %APP_DIR% && pnpm install"
if %errorlevel% neq 0 (
    echo [警告] 依赖安装可能有问题，继续尝试...
)

echo.
echo [步骤 4/4] 重启应用...
echo 请再次输入服务器密码:
ssh %SERVER_USER%@%SERVER_IP% "cd %APP_DIR% && pm2 delete feishu-app 2>/dev/null || true && pm2 start npm --name feishu-app -- run start -- --port 5000 && pm2 save"
if %errorlevel% neq 0 (
    echo [错误] 应用启动失败
    pause
    exit /b 1
)

echo.
echo ==========================================
echo [成功] 部署完成！
echo ==========================================
echo.
echo 访问地址: http://%SERVER_IP%:5000
echo.
echo 常用命令:
echo   查看日志: ssh %SERVER_USER%@%SERVER_IP% "pm2 logs feishu-app"
echo   重启服务: ssh %SERVER_USER%@%SERVER_IP% "pm2 restart feishu-app"
echo   停止服务: ssh %SERVER_USER%@%SERVER_IP% "pm2 stop feishu-app"
echo ==========================================
pause

@echo off
chcp 65001 > nul

:: 飞书同步工具安装脚本

echo ======================================
echo 飞书同步工具安装脚本
echo ======================================

:: 检查 Node.js 是否已安装
echo 正在检查 Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    echo 建议安装 Node.js v18 或更高版本
    pause
    exit /b 1
)

:: 显示 Node.js 版本
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo 已安装 Node.js: %NODE_VERSION%

:: 检查 pnpm 是否已安装
echo 正在检查 pnpm...
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo 未找到 pnpm，正在安装 pnpm...
    npm install -g pnpm
    if %errorlevel% neq 0 (
        echo 错误: pnpm 安装失败
        pause
        exit /b 1
    )
    echo pnpm 安装成功！
)

:: 安装项目依赖
echo 正在安装项目依赖...
echo 这可能需要几分钟时间，请耐心等待...
pnpm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo 依赖安装成功！

:: 检查是否需要配置环境变量
if not exist ".env" (
    echo ======================================
    echo 注意: 未找到 .env 文件
    echo ======================================
    echo 如果需要配置飞书 App ID 和 App Secret，请创建 .env 文件
    echo 可以参考 .env.example 文件（如果存在）
    echo ======================================
)

:: 创建启动脚本
echo 正在创建启动脚本...

:: 创建开发模式启动脚本
(
echo @echo off
echo chcp 65001 ^> nul
echo.
echo echo 正在启动开发模式...
echo echo 应用将在 http://localhost:5000 启动
echo echo 按 Ctrl+C 停止服务
echo.
echo start "飞书同步工具" cmd /k "pnpm dev"
echo timeout /t 3 /nobreak ^> nul
echo start "" "http://localhost:5000"
echo echo 已打开浏览器，请查看应用是否正常启动
) > "启动开发模式.bat"

:: 创建生产模式启动脚本
(
echo @echo off
echo chcp 65001 ^> nul
echo.
echo echo 正在检查是否已构建...
echo if not exist ".next" ^(
echo     echo 未找到构建文件，正在构建应用...
echo     pnpm build
echo ^)
echo echo 正在启动生产模式...
echo echo 应用将在 http://localhost:5000 启动
echo echo 按 Ctrl+C 停止服务
echo.
echo start "飞书同步工具" cmd /k "pnpm start"
echo timeout /t 3 /nobreak ^> nul
echo start "" "http://localhost:5000"
echo echo 已打开浏览器，请查看应用是否正常启动
) > "启动生产模式.bat"

echo ======================================
echo 安装完成！
echo ======================================
echo 你可以使用以下脚本启动应用：
echo   - 启动开发模式.bat  （开发模式，支持热更新）
echo   - 启动生产模式.bat  （生产模式，性能更好）
echo ======================================
echo.
echo 提示：
echo   - 首次启动时，建议使用开发模式
echo   - 如果需要配置飞书 App ID 和 App Secret，请创建 .env 文件
echo   - 更多信息请参考项目文档
echo ======================================
pause

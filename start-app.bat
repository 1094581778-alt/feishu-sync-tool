@echo off
chcp 65001 > nul

:: 确保在正确的目录中运行
cd /d "%~dp0"

echo ======================================
echo 飞书同步工具启动器
echo ======================================
echo 1. 开发模式启动（支持热更新）
echo 2. 生产模式启动（性能更好）
echo 3. 构建桌面应用
echo 4. 退出
echo ======================================

set /p choice=请输入选项编号: 

if "%choice%"=="1" (
    echo 正在启动开发模式...
    echo 应用将在 http://localhost:5000 启动
    echo 按 Ctrl+C 停止服务
    echo ======================================
    
    :: 启动开发服务器（异步）
    start "飞书同步工具 - 开发模式" cmd /k "pnpm dev"
    
    :: 等待服务器启动
    timeout /t 3 /nobreak > nul
    
    :: 打开浏览器
    start "" "http://localhost:5000"
    
    echo 已打开浏览器，请查看应用是否正常启动
    timeout /t 1 /nobreak > nul
    goto end
)

if "%choice%"=="2" (
    echo 正在检查是否已构建...
    if not exist ".next" (
        echo 未找到构建文件，正在构建应用...
        pnpm build
    )
    echo 正在启动生产模式...
    echo 应用将在 http://localhost:5000 启动
    echo 按 Ctrl+C 停止服务
    echo ======================================
    
    :: 启动生产服务器（异步）
    start "飞书同步工具 - 生产模式" cmd /k "pnpm start"
    
    :: 等待服务器启动
    timeout /t 3 /nobreak > nul
    
    :: 打开浏览器
    start "" "http://localhost:5000"
    
    echo 已打开浏览器，请查看应用是否正常启动
    timeout /t 1 /nobreak > nul
    goto end
)

if "%choice%"=="3" (
    echo 正在构建桌面应用...
    echo 构建完成后可在 src-tauri/target/release 目录找到可执行文件
    echo ======================================
    pnpm tauri build
    echo 构建完成！
    pause
    goto end
)

if "%choice%"=="4" (
    echo 退出启动器...
    goto end
)

echo 无效的选项，请重新运行启动器并输入正确的编号。
pause

:end
echo 启动器已退出。
timeout /t 1 /nobreak > nul

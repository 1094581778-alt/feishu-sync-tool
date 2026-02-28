@echo off
chcp 65001 > nul
cls
echo ==========================================
echo     飞书同步工具 - 快速部署菜单
echo ==========================================
echo.
echo 请选择部署方式:
echo.
echo   [1] 一键部署（推荐新手）
echo       - 完整构建
echo       - 自动打包上传
echo       - 适合首次部署或大改动
echo.
echo   [2] 增量更新（推荐日常使用）
echo       - 快速上传
echo       - 适合小改动
echo.
echo   [3] 热更新（高级用户）
echo       - 只上传变更文件
echo       - 适合快速修复
echo.
echo   [4] 配置 SSH 免密登录（推荐）
echo       - 只需配置一次
echo       - 之后不用输入密码
echo.
echo   [5] 查看部署指南
echo.
echo   [0] 退出
echo.
echo ==========================================

set /p CHOICE=请输入选项 (0-5):

if "%CHOICE%"=="1" goto ONE_CLICK
if "%CHOICE%"=="2" goto INCREMENTAL
if "%CHOICE%"=="3" goto HOTFIX
if "%CHOICE%"=="4" goto SSH_KEY
if "%CHOICE%"=="5" goto GUIDE
if "%CHOICE%"=="0" goto END

echo.
echo 无效选项，请重新选择
timeout /t 2 >nul
goto MENU

:ONE_CLICK
echo.
echo 正在执行一键部署...
call deploy-one-click.bat
goto MENU

:INCREMENTAL
echo.
echo 正在执行增量更新...
call deploy-incremental.bat
goto MENU

:HOTFIX
echo.
echo 正在执行热更新...
call deploy-hotfix.bat
goto MENU

:SSH_KEY
echo.
echo 正在配置 SSH 免密登录...
call deploy-ssh-key.bat
goto MENU

:GUIDE
echo.
echo 打开部署指南...
start notepad DEPLOYMENT_GUIDE.md
goto MENU

:END
echo.
echo 退出部署菜单
timeout /t 1 >nul
exit /b 0

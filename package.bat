@echo off
chcp 65001 > nul

:: 飞书同步工具打包脚本

echo ======================================
echo 飞书同步工具打包脚本
echo ======================================
echo 此脚本将创建一个不包含不必要文件的压缩包
echo ======================================

:: 设置变量
set PROJECT_DIR=%~dp0
set PACKAGE_NAME=飞书同步工具_便携版_%date:~0,4%%date:~5,2%%date:~8,2%
set TEMP_DIR=%TEMP%\飞书同步工具_打包

echo 正在创建临时目录...
if exist "%TEMP_DIR%" rd /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

echo 正在复制必要文件...

:: 复制源代码
xcopy "%PROJECT_DIR%src" "%TEMP_DIR%\src" /E /I /H /Y > nul
xcopy "%PROJECT_DIR%public" "%TEMP_DIR%\public" /E /I /H /Y > nul
xcopy "%PROJECT_DIR%app" "%TEMP_DIR%\app" /E /I /H /Y > nul

:: 复制配置文件
copy "%PROJECT_DIR%package.json" "%TEMP_DIR%\" /Y > nul
copy "%PROJECT_DIR%package-lock.json" "%TEMP_DIR%\" /Y > nul
copy "%PROJECT_DIR%tsconfig.json" "%TEMP_DIR%\" /Y > nul
copy "%PROJECT_DIR%next.config.ts" "%TEMP_DIR%\" /Y > nul
copy "%PROJECT_DIR%next-env.d.ts" "%TEMP_DIR%\" /Y > nul
copy "%PROJECT_DIR%.gitignore" "%TEMP_DIR%\" /Y > nul

:: 复制 Tauri 配置
xcopy "%PROJECT_DIR%src-tauri" "%TEMP_DIR%\src-tauri" /E /I /H /Y > nul
if exist "%PROJECT_DIR%src-tauri\Cargo.toml" (
    copy "%PROJECT_DIR%src-tauri\Cargo.toml" "%TEMP_DIR%\src-tauri\" /Y > nul
)

:: 复制环境变量示例（如果存在）
if exist "%PROJECT_DIR%.env.example" (
    copy "%PROJECT_DIR%.env.example" "%TEMP_DIR%\" /Y > nul
)

:: 创建使用说明文件
echo 飞书同步工具 - 便携版 > "%TEMP_DIR%\使用说明.txt"
echo. >> "%TEMP_DIR%\使用说明.txt"
echo 使用方法： >> "%TEMP_DIR%\使用说明.txt"
echo. >> "%TEMP_DIR%\使用说明.txt"
echo 1. 解压此压缩包到任意目录 >> "%TEMP_DIR%\使用说明.txt"
echo 2. 打开命令提示符（cmd.exe） >> "%TEMP_DIR%\使用说明.txt"
echo 3. 进入解压后的目录 >> "%TEMP_DIR%\使用说明.txt"
echo 4. 运行以下命令安装依赖： >> "%TEMP_DIR%\使用说明.txt"
echo    pnpm install >> "%TEMP_DIR%\使用说明.txt"
echo 5. 安装完成后，运行以下命令启动应用： >> "%TEMP_DIR%\使用说明.txt"
echo    pnpm dev >> "%TEMP_DIR%\使用说明.txt"
echo. >> "%TEMP_DIR%\使用说明.txt"
echo 注意事项： >> "%TEMP_DIR%\使用说明.txt"
echo - 确保目标电脑已安装 Node.js（建议 v18 或更高版本） >> "%TEMP_DIR%\使用说明.txt"
echo - 确保目标电脑已安装 pnpm（可以通过 npm install -g pnpm 安装） >> "%TEMP_DIR%\使用说明.txt"
echo - 如果需要配置飞书 App ID 和 App Secret，请创建 .env 文件并添加配置 >> "%TEMP_DIR%\使用说明.txt"
echo. >> "%TEMP_DIR%\使用说明.txt"
echo 更多信息请参考项目文档。 >> "%TEMP_DIR%\使用说明.txt"

echo 正在创建压缩包...
if exist "%PROJECT_DIR%%PACKAGE_NAME%.zip" del "%PROJECT_DIR%%PACKAGE_NAME%.zip"

:: 使用 PowerShell 创建压缩包
powershell -Command "Compress-Archive -Path '%TEMP_DIR%' -DestinationPath '%PROJECT_DIR%%PACKAGE_NAME%.zip'"

echo 正在清理临时目录...
rd /s /q "%TEMP_DIR%"

echo ======================================
echo 打包完成！
echo ======================================
echo 压缩包位置: %PROJECT_DIR%%PACKAGE_NAME%.zip
echo 文件大小:
dir "%PROJECT_DIR%%PACKAGE_NAME%.zip" | find "%PACKAGE_NAME%.zip"
echo ======================================
echo 请将此压缩包复制到目标电脑，然后按照使用说明.txt中的步骤进行安装。
echo ======================================
pause

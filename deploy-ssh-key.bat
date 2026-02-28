@echo off
chcp 65001 > nul
echo ==========================================
echo SSH 密钥配置脚本
echo ==========================================
echo.
echo 此脚本将配置 SSH 密钥，实现免密登录服务器
echo.

set SERVER_IP=8.140.193.108
set SERVER_USER=root

echo [步骤 1/3] 生成 SSH 密钥对...
echo.
echo 请输入密钥名称（直接回车使用默认）:
set KEY_NAME=
set /p KEY_NAME=密钥名称:

if "%KEY_NAME%"=="" (
    set KEY_NAME=id_rsa_feishu
)

set SSH_DIR=%USERPROFILE%\.ssh
set KEY_PATH=%SSH_DIR%\%KEY_NAME%
set PUB_KEY_PATH=%KEY_PATH%.pub

echo.
echo 检查密钥是否已存在...
if exist "%KEY_PATH%" (
    echo 密钥已存在: %KEY_PATH%
    echo.
    set /p OVERWRITE=是否覆盖? (y/n):
    if /i not "%OVERWRITE%"=="y" (
        echo 退出配置
        pause
        exit /b 0
    )
    del /f /q "%KEY_PATH%" "%PUB_KEY_PATH%"
)

echo.
echo 正在生成密钥对...
ssh-keygen -t rsa -b 4096 -f "%KEY_PATH%" -N ""
if %errorlevel% neq 0 (
    echo [错误] 密钥生成失败
    pause
    exit /b 1
)

echo.
echo [步骤 2/3] 上传公钥到服务器...
echo.
echo 正在上传公钥到 %SERVER_USER%@%SERVER_IP%...
type "%PUB_KEY_PATH%" | ssh %SERVER_USER%@%SERVER_IP% "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
if %errorlevel% neq 0 (
    echo [错误] 上传公钥失败
    echo 请手动上传公钥:
    echo.
    echo 公钥内容:
    type "%PUB_KEY_PATH%"
    echo.
    echo 执行命令:
    echo mkdir -p ~/.ssh ^&^& chmod 700 ~/.ssh ^&^& echo "公钥内容" ^>^> ~/.ssh/authorized_keys ^&^& chmod 600 ~/.ssh/authorized_keys
    pause
    exit /b 1
)

echo.
echo [步骤 3/3] 测试免密登录...
echo.
echo 正在测试连接...
ssh -o BatchMode=yes -o ConnectTimeout=5 %SERVER_USER%@%SERVER_IP% "echo '免密登录成功！' && uptime"
if %errorlevel% neq 0 (
    echo [警告] 免密登录测试失败
    echo 可能需要配置 ~/.ssh/config 文件
) else (
    echo [成功] 免密登录配置成功！
)

echo.
echo ==========================================
echo 配置完成！
echo ==========================================
echo.
echo 密钥位置: %KEY_PATH%
echo 公钥位置: %PUB_KEY_PATH%
echo.
echo 测试连接: ssh %SERVER_USER%@%SERVER_IP%
echo.
echo 提示: 以后登录服务器不再需要输入密码
echo ==========================================
echo.
pause

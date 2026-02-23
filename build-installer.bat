@echo off
chcp 65001 > nul

set PATH=C:\Users\Administrator\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin;%PATH%

echo Building installer...
pnpm tauri build

if %errorlevel% neq 0 (
    echo Build failed
    pause
    exit /b 1
)

echo Build successful!
pause

@echo off
chcp 65001 > nul

set PATH=C:\Users\Administrator\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin;%PATH%

echo Building Next.js...
pnpm build

if %errorlevel% neq 0 (
    echo Next.js build failed
    pause
    exit /b 1
)

echo Building Tauri installer...
cd src-tauri
cargo tauri build

if %errorlevel% neq 0 (
    echo Tauri build failed
    cd ..
    pause
    exit /b 1
)

cd ..
echo Build successful!
pause

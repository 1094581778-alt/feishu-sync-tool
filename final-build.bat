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

echo Creating clean build directory...
if exist "dist" rd /s /q "dist"
mkdir "dist"

echo Copying necessary files...
xcopy ".next\static" "dist\static" /E /I /Y > nul
xcopy ".next\BUILD_ID" "dist\" /Y > nul
xcopy ".next\build-manifest.json" "dist\" /Y > nul
xcopy ".next\app-path-routes-manifest.json" "dist\" /Y > nul
xcopy ".next\server" "dist\server" /E /I /Y > nul

echo Modifying tauri.conf.json...
cd src-tauri
powershell -Command "(Get-Content tauri.conf.json) -replace '\"frontendDist\": \"\.\./\.next\"', '\"frontendDist\": \"../dist\"' | Set-Content tauri.conf.json"

echo Building Tauri installer...
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

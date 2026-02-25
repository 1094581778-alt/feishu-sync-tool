@echo off
chcp 65001 > NUL

if exist "C:\Users\Administrator\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin" (
    set PATH=C:\Users\Administrator\.rustup\toolchains\stable-x86_64-pc-windows-msvc\bin;%PATH%
)

echo Checking for previous deployment...

:: Check if the application has been deployed before using PowerShell
powershell -Command "$uninstallKeys = @('HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall', 'HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall'); $appName = '飞书数据同步工具'; $exeName = 'feishu_sync_tool.exe'; $appPathsKey = 'HKLM:\Software\Microsoft\Windows\CurrentVersion\App Paths'; $found = $false; foreach ($keyPath in $uninstallKeys) { if (Test-Path $keyPath) { $subkeys = Get-ChildItem -Path $keyPath -ErrorAction SilentlyContinue; foreach ($subkey in $subkeys) { try { $displayName = Get-ItemProperty -Path $subkey.PSPath -Name DisplayName -ErrorAction SilentlyContinue; if ($displayName -and $displayName.DisplayName -like '*$appName*') { $found = $true; break; } } catch {} } } if ($found) { break; } } if (!$found -and (Test-Path $appPathsKey)) { $subkeys = Get-ChildItem -Path $appPathsKey -ErrorAction SilentlyContinue; foreach ($subkey in $subkeys) { if ($subkey.PSChildName -eq $exeName) { $found = $true; break; } } } if ($found) { Write-Host 'Previous deployment detected!'; exit 1; } else { Write-Host 'No previous deployment found. Proceeding with build.'; exit 0; }"

if %errorlevel% neq 0 (
    echo Previous deployment detected. Please uninstall it before building a new version.
    pause
    exit /b 1
)

echo Building installer...
pnpm tauri build

if %errorlevel% neq 0 (
    echo Build failed
    pause
    exit /b 1
)

echo Build successful!
pause

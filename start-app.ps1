# 飞书同步工具启动器

# 设置编码为 UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "飞书同步工具启动器" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "1. 开发模式启动（支持热更新）" -ForegroundColor Green
Write-Host "2. 生产模式启动（性能更好）" -ForegroundColor Green
Write-Host "3. 构建桌面应用" -ForegroundColor Green
Write-Host "4. 退出" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan

$choice = Read-Host "请输入选项编号"

switch ($choice) {
    "1" {
        Write-Host "正在启动开发模式..." -ForegroundColor Yellow
        Write-Host "应用将在 http://localhost:5000 启动" -ForegroundColor Yellow
        Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
        Write-Host "=======================================" -ForegroundColor Cyan
        
        # 启动开发服务器（异步）
        Start-Process "cmd.exe" -ArgumentList "/k pnpm dev" -WindowStyle Normal -WorkingDirectory $PWD
        
        # 等待服务器启动
        Start-Sleep -Seconds 3
        
        # 打开浏览器
        Start-Process "http://localhost:5000"
        
        Write-Host "已打开浏览器，请查看应用是否正常启动" -ForegroundColor Green
        break
    }
    "2" {
        Write-Host "正在检查是否已构建..." -ForegroundColor Yellow
        if (!(Test-Path ".next")) {
            Write-Host "未找到构建文件，正在构建应用..." -ForegroundColor Yellow
            & pnpm build
        }
        Write-Host "正在启动生产模式..." -ForegroundColor Yellow
        Write-Host "应用将在 http://localhost:5000 启动" -ForegroundColor Yellow
        Write-Host "按 Ctrl+C 停止服务" -ForegroundColor Yellow
        Write-Host "=======================================" -ForegroundColor Cyan
        
        # 启动生产服务器（异步）
        Start-Process "cmd.exe" -ArgumentList "/k pnpm start" -WindowStyle Normal -WorkingDirectory $PWD
        
        # 等待服务器启动
        Start-Sleep -Seconds 3
        
        # 打开浏览器
        Start-Process "http://localhost:5000"
        
        Write-Host "已打开浏览器，请查看应用是否正常启动" -ForegroundColor Green
        break
    }
    "3" {
        Write-Host "正在构建桌面应用..." -ForegroundColor Yellow
        Write-Host "构建完成后可在 src-tauri/target/release 目录找到可执行文件" -ForegroundColor Yellow
        Write-Host "=======================================" -ForegroundColor Cyan
        
        & pnpm tauri build
        
        Write-Host "构建完成！" -ForegroundColor Green
        Read-Host "按 Enter 键继续..."
        break
    }
    "4" {
        Write-Host "退出启动器..." -ForegroundColor Yellow
        break
    }
    default {
        Write-Host "无效的选项，请重新运行启动器并输入正确的编号。" -ForegroundColor Red
        Read-Host "按 Enter 键继续..."
        break
    }
}

Write-Host "启动器已退出。" -ForegroundColor Cyan
Start-Sleep -Seconds 1

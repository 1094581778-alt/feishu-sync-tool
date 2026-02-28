param(
    [string]$Mode = "build"
)

Write-Host "🚀 启动 Next.js 服务器..." -ForegroundColor Green

# 启动 Next.js 服务器
$server = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory ".next\standalone" -PassThru -NoNewWindow

Start-Sleep -Seconds 5

Write-Host "✅ Next.js 服务器已启动" -ForegroundColor Green

if ($Mode -eq "dev") {
    Write-Host "🔍 启动 Tauri 开发模式..." -ForegroundColor Yellow
    Start-Process -FilePath "pnpm" -ArgumentList "tauri", "dev" -Wait
} else {
    Write-Host "📦 构建 Tauri 应用..." -ForegroundColor Yellow
    Start-Process -FilePath "pnpm" -ArgumentList "tauri", "build" -Wait
}

Write-Host "⏹️  停止 Next.js 服务器..." -ForegroundColor Yellow
Stop-Process -Id $server.Id -Force

Write-Host "✅ 完成!" -ForegroundColor Green

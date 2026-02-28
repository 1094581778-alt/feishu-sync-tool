param(
    [string]$ServerIP = "8.140.193.108",
    [string]$ServerUser = "root",
    [string]$AppDir = "/var/www/feishu-app",
    [string]$LocalDir = "E:\feishugongju\pack_project\projects"
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "飞书同步工具 - 一键打包部署脚本 (PowerShell)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveName = "deploy_$timestamp.zip"

try {
    Set-Location $LocalDir

    Write-Host "[1/6] 清理旧构建文件..." -ForegroundColor Yellow
    if (Test-Path ".next") { Remove-Item -Path ".next" -Recurse -Force }
    if (Test-Path "node_modules\.cache") { Remove-Item -Path "node_modules\.cache" -Recurse -Force }
    if (Test-Path $archiveName) { Remove-Item -Path $archiveName -Force }
    Write-Host "清理完成" -ForegroundColor Green

    Write-Host ""
    Write-Host "[2/6] 构建项目..." -ForegroundColor Yellow
    $buildResult = pnpm build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "构建失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "构建完成" -ForegroundColor Green

    Write-Host ""
    Write-Host "[3/6] 打包项目文件..." -ForegroundColor Yellow
    Write-Host "正在创建压缩包: $archiveName" -ForegroundColor Cyan
    Compress-Archive -Path ".next", "package.json", "pnpm-lock.yaml", "next.config.ts", "tsconfig.json", "postcss.config.mjs", "public", "src" -DestinationPath $archiveName -Force
    Write-Host "压缩包创建成功: $archiveName" -ForegroundColor Green

    Write-Host ""
    Write-Host "[4/6] 上传到服务器..." -ForegroundColor Yellow
    Write-Host "正在上传，请稍候..." -ForegroundColor Cyan
    scp $archiveName "$ServerUser@$ServerIP`:/tmp/"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "上传失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "上传成功！" -ForegroundColor Green

    Write-Host ""
    Write-Host "[5/6] 服务器端部署..." -ForegroundColor Yellow
    Write-Host "正在服务器上解压和部署..." -ForegroundColor Cyan
    ssh "$ServerUser@$ServerIP" "cd /tmp && unzip -o $archiveName -d $AppDir/ && rm /tmp/$archiveName && cd $AppDir && pm2 stop feishu-app 2>/dev/null || true && pm2 delete feishu-app 2>/dev/null || true && pm2 start npm --name feishu-app -- run start -- --port 5000 && pm2 save"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "服务器部署失败" -ForegroundColor Red
        exit 1
    }
    Write-Host "部署完成" -ForegroundColor Green

    Write-Host ""
    Write-Host "[6/6] 清理本地文件..." -ForegroundColor Yellow
    Remove-Item -Path $archiveName -Force
    Write-Host "清理完成" -ForegroundColor Green

    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "[成功] 部署完成！" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "访问地址: http://$ServerIP`:5000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "常用命令:" -ForegroundColor Yellow
    Write-Host "  查看日志: ssh $ServerUser@$ServerIP 'pm2 logs feishu-app'" -ForegroundColor Gray
    Write-Host "  查看状态: ssh $ServerUser@$ServerIP 'pm2 status'" -ForegroundColor Gray
    Write-Host "  重启服务: ssh $ServerUser@$ServerIP 'pm2 restart feishu-app'" -ForegroundColor Gray
    Write-Host "  停止服务: ssh $ServerUser@$ServerIP 'pm2 stop feishu-app'" -ForegroundColor Gray
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "按任意键退出..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

} catch {
    Write-Host "发生错误: $_" -ForegroundColor Red
    exit 1
}

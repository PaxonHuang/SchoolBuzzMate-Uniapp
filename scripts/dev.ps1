# SchoolBuzzMate 开发环境一键启动
param(
  [ValidateSet("h5", "mp-weixin", "both")]
  [string]$Platform = "mp-weixin"
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$WX_CLI = if ($env:WX_CLI) { $env:WX_CLI } else { "E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat" }
$WX_DEV_PROJECT = "$ProjectRoot\dist\dev\mp-weixin"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SchoolBuzzMate Dev Environment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check dependencies
Write-Host "[1/3] Checking dependencies..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Node.js not found. Install Node.js >= 20" -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Gray

$pnpmVersion = pnpm --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pnpm not found. Run: npm install -g pnpm" -ForegroundColor Red
    exit 1
}
Write-Host "  pnpm: $pnpmVersion" -ForegroundColor Gray

# Step 2: Install dependencies
Write-Host "[2/3] Installing dependencies..." -ForegroundColor Yellow
Push-Location $ProjectRoot
pnpm install --silent
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pnpm install failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  Dependencies OK" -ForegroundColor Gray

# Step 3: Compile and open DevTools
Write-Host "[3/3] Compiling to $Platform..." -ForegroundColor Yellow
Push-Location $ProjectRoot

if ($Platform -eq "mp-weixin" -or $Platform -eq "both") {
    Write-Host "  Starting mp-weixin dev server..." -ForegroundColor Gray
    Start-Process -FilePath "pnpm" -ArgumentList "run dev:mp-weixin" -NoNewWindow

    # Wait for compilation
    Start-Sleep -Seconds 8

    if (Test-Path $WX_DEV_PROJECT) {
        Write-Host "  Opening WeChat DevTools..." -ForegroundColor Gray
        & $WX_CLI open --project $WX_DEV_PROJECT 2>$null
    } else {
        Write-Host "  WARNING: Compile output not found at $WX_DEV_PROJECT" -ForegroundColor Yellow
        Write-Host "  Waiting a bit longer..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
        if (Test-Path $WX_DEV_PROJECT) {
            & $WX_CLI open --project $WX_DEV_PROJECT 2>$null
        }
    }
}

if ($Platform -eq "h5" -or $Platform -eq "both") {
    Write-Host "  Starting H5 dev server..." -ForegroundColor Gray
    Start-Process -FilePath "pnpm" -ArgumentList "run dev:h5" -NoNewWindow
}

Pop-Location

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Dev environment ready!" -ForegroundColor Green
Write-Host "  Edit files and changes auto-reload." -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Green
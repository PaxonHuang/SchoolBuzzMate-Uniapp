# SchoolBuzzMate 微信小程序发布脚本
param(
  [Parameter(Mandatory=$true, HelpMessage="Version number, e.g. 1.0.0")]
  [string]$Version,

  [Parameter(HelpMessage="Release description")]
  [string]$Desc = "版本更新"
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$WX_CLI = if ($env:WX_CLI) { $env:WX_CLI } else { "E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat" }
$WX_BUILD_PROJECT = "$ProjectRoot\dist\build\mp-weixin"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SchoolBuzzMate Release v$Version" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "[1/5] Building production..." -ForegroundColor Yellow
Push-Location $ProjectRoot
pnpm run build:mp-weixin
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  Build OK" -ForegroundColor Gray

# Step 2: Check login
Write-Host "[2/5] Checking WeChat DevTools login..." -ForegroundColor Yellow
$loginResult = & $WX_CLI islogin 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Not logged in. Starting login..." -ForegroundColor Yellow
    & $WX_CLI login --qr-format terminal
    Write-Host "  Scan the QR code above, then press Enter to continue..." -ForegroundColor Yellow
    Read-Host
    $loginResult = & $WX_CLI islogin 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Login failed. Please try again." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Login OK" -ForegroundColor Gray

# Step 3: Build npm
Write-Host "[3/5] Building npm packages..." -ForegroundColor Yellow
& $WX_CLI build-npm --project $WX_BUILD_PROJECT
Write-Host "  npm build OK" -ForegroundColor Gray

# Step 4: Preview
Write-Host "[4/5] Generating preview QR code..." -ForegroundColor Yellow
& $WX_CLI preview --project $WX_BUILD_PROJECT --qr-format terminal
Write-Host ""

# Step 5: Confirm upload
Write-Host "[5/5] Ready to upload." -ForegroundColor Yellow
$confirm = Read-Host "Upload v$Version to WeChat? (y/n)"

if ($confirm -eq 'y' -or $confirm -eq 'Y') {
    Write-Host "  Uploading..." -ForegroundColor Gray
    & $WX_CLI upload --project $WX_BUILD_PROJECT -v $Version -d $Desc
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Upload successful!" -ForegroundColor Green
        Write-Host "  Go to https://mp.weixin.qq.com to submit for review." -ForegroundColor Gray
        Write-Host "========================================" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Upload failed. Check DevTools for details." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  Upload cancelled." -ForegroundColor Yellow
}
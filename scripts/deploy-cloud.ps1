# SchoolBuzzMate UniCloud 一键部署脚本 (Windows 原生 PowerShell 版)
# 走 HBuilderX CLI 上传云函数 + DB schema + 公共模块。
# HBuilderX GUI 必须已打开 (cli.exe 内部会校验)。
#
# 用法:
#   .\scripts\deploy-cloud.ps1                       # 上传全部云函数 + 全部 schema
#   .\scripts\deploy-cloud.ps1 -Functions order-co,favorites-co
#   .\scripts\deploy-cloud.ps1 -Common uni-pay
#   .\scripts\deploy-cloud.ps1 -SchemaOnly
#   .\scripts\deploy-cloud.ps1 -FunctionsOnly
#
# HBuilderX CLI 路径可用 $env:HBUILDERX_CLI 覆盖。
# 项目名 (HBuilderX 内部) 默认 SchoolBuzzUniApp, 可用 -ProjectName 覆盖。

param(
    [string]$Functions = "",           # 逗号分隔, 空 = 全部
    [string]$Common = "",              # 逗号分隔, 空 = 全部
    [switch]$FunctionsOnly,
    [switch]$SchemaOnly,
    [string]$ProjectName = "SchoolBuzzUniApp"
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$CloudRoot = Join-Path $ProjectRoot "uniCloud-aliyun"
$FunctionsRoot = Join-Path $CloudRoot "cloudfunctions"
$SchemaRoot = Join-Path $CloudRoot "database"

# HBuilderX CLI 路径 (优先环境变量 HBUILDERX_CLI, 再回退默认安装位置)
$HBUILDERX_CLI = if ($env:HBUILDERX_CLI) { $env:HBUILDERX_CLI } else { "E:\HbuilderX\HBuilderX\cli.exe" }
if (-not (Test-Path $HBUILDERX_CLI)) {
    $HBUILDERX_CLI = "${env:ProgramFiles}\HBuilderX\HBuilderX\cli.exe"
}

function Write-Step($n, $total, $msg) {
    Write-Host ""
    Write-Host "[$n/$total] $msg" -ForegroundColor Yellow
}

function Write-Ok($msg) { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Err($msg) { Write-Host "  ✗ $msg" -ForegroundColor Red }

# ===== 校验环境 =====
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SchoolBuzzMate UniCloud Deploy" -ForegroundColor Green
Write-Host "  project : $ProjectName" -ForegroundColor Gray
Write-Host "  cli     : $HBUILDERX_CLI" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan

if (-not (Test-Path $CloudRoot)) {
    Write-Err "uniCloud-aliyun/ 不存在, 退出"
    exit 1
}

if (-not (Test-Path $HBUILDERX_CLI)) {
    Write-Err "HBuilderX CLI 未找到: $HBUILDERX_CLI"
    Write-Host "    请安装 HBuilderX (https://www.dcloud.io/hbuilderx.html)" -ForegroundColor Gray
    Write-Host "    或修改本脚本的 `$HBUILDERX_CLI 变量" -ForegroundColor Gray
    exit 1
}

# HBuilderX CLI 必须 GUI 已打开
$probeOutput = & $HBUILDERX_CLI --help 2>&1 | Out-String
if ($probeOutput -match "未检测到已打开的HBuilderX") {
    Write-Host ""
    Write-Err "HBuilderX 未打开, CLI 拒绝工作"
    Write-Host "    请在 HBuilderX 里打开本项目, 然后再跑本脚本" -ForegroundColor Gray
    Write-Host "    或在 HBuilderX 里右键 uniCloud-aliyun -> 上传所有云函数" -ForegroundColor Gray
    exit 2
}

# ===== 决定上传哪些 =====
$uploadFunctions = -not $SchemaOnly
$uploadSchema = -not $FunctionsOnly
$uploadCommon = -not $SchemaOnly -and -not $FunctionsOnly

# ===== 1. 上传云函数 =====
if ($uploadFunctions) {
    Write-Step 1 3 "上传云函数"
    if ($Functions -ne "") {
        $targets = $Functions -split "," | ForEach-Object { $_.Trim() }
    } else {
        $targets = Get-ChildItem -Directory $FunctionsRoot |
            Where-Object { $_.Name -ne "common" } |
            Select-Object -ExpandProperty Name
    }
    foreach ($fn in $targets) {
        $fnPath = Join-Path $FunctionsRoot $fn
        if (-not (Test-Path $fnPath)) {
            Write-Err "[$fn] 目录不存在, 跳过"
            continue
        }
        Write-Host "  上传 cloudfunction/$fn ..." -NoNewline
        & $HBUILDERX_CLI cloud functions --upload cloudfunction --prj $ProjectName --provider aliyun --name $fn 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " ✗ (请到 HBuilderX 内手动上传)" -ForegroundColor Red
        }
    }
}

# ===== 2. 上传公共模块 =====
if ($uploadCommon) {
    Write-Step 2 3 "上传公共模块"
    $commonDir = Join-Path $FunctionsRoot "common"
    if ($Common -ne "") {
        $targets = $Common -split "," | ForEach-Object { $_.Trim() }
    } elseif (Test-Path $commonDir) {
        $targets = Get-ChildItem -Directory $commonDir |
            Where-Object { -not $_.Name.StartsWith("_") } |
            Select-Object -ExpandProperty Name
    } else {
        $targets = @()
    }
    foreach ($m in $targets) {
        $mPath = Join-Path $commonDir $m
        if (-not (Test-Path $mPath)) {
            Write-Err "[$m] 不存在, 跳过"
            continue
        }
        Write-Host "  上传 common/$m ..." -NoNewline
        & $HBUILDERX_CLI cloud functions --upload common --prj $ProjectName --provider aliyun --name $m 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " ✗ (请到 HBuilderX 内手动上传)" -ForegroundColor Red
        }
    }
}

# ===== 3. 上传 DB Schema =====
if ($uploadSchema) {
    Write-Step 3 3 "上传 DB Schema"
    $schemas = Get-ChildItem -Filter "*.schema.json" $SchemaRoot
    foreach ($s in $schemas) {
        Write-Host "  上传 db/$($s.Name) ..." -NoNewline
        # 注意: HBuilderX CLI 要求 db 的 --name 必须带 .schema.json 后缀
        & $HBUILDERX_CLI cloud functions --upload db --prj $ProjectName --provider aliyun --name $s.Name 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " ✗ (请到 HBuilderX 内手动上传)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成" -ForegroundColor Green
Write-Host "  服务空间: mp-c3e590c7-e8f1-4877-95c5-346ba36e296c" -ForegroundColor Gray
Write-Host "  Web Console: https://unicloud.dcloud.net.cn" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Cyan
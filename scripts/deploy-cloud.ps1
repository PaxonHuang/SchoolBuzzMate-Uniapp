# SchoolBuzzMate UniCloud 一键部署脚本
# 走 HBuilderX CLI 上传云函数 + DB schema
# 用法:
#   .\scripts\deploy-cloud.ps1                       # 上传全部云函数 + 全部 schema
#   .\scripts\deploy-cloud.ps1 -Functions order-co,favorites-co
#   .\scripts\deploy-cloud.ps1 -SchemaOnly
#   .\scripts\deploy-cloud.ps1 -FunctionsOnly

param(
    [string]$Functions = "",          # 逗号分隔, 空 = 全部
    [switch]$FunctionsOnly,
    [switch]$SchemaOnly,
    [switch]$NoBuild
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$CloudRoot = Join-Path $ProjectRoot "uniCloud-aliyun"
$FunctionsRoot = Join-Path $CloudRoot "cloudfunctions"
$SchemaRoot = Join-Path $CloudRoot "database"

# HBuilderX CLI 路径 (按本机安装位置调整)
$HBUILDERX_CLI = "E:\HbuilderX\HBuilderX\cli.exe"
if (-not (Test-Path $HBUILDERX_CLI)) {
    # 尝试默认安装位置
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

Push-Location $ProjectRoot

# ===== 决定上传哪些 =====
$uploadFunctions = -not $SchemaOnly
$uploadSchema = -not $FunctionsOnly

if ($uploadFunctions -and $Functions -ne "") {
    $targets = $Functions -split "," | ForEach-Object { $_.Trim() }
} elseif ($uploadFunctions) {
    $targets = Get-ChildItem -Directory $FunctionsRoot | Select-Object -ExpandProperty Name
}

# ===== 1. 上传云函数 =====
if ($uploadFunctions) {
    Write-Step 1 3 "上传云函数"
    foreach ($fn in $targets) {
        $fnPath = Join-Path $FunctionsRoot $fn
        if (-not (Test-Path $fnPath)) {
            Write-Err "[$fn] 目录不存在, 跳过"
            continue
        }
        Write-Host "  上传 $fn ..." -NoNewline
        # HBuilderX CLI 上传命令 (实际命令以官方文档为准)
        & $HBUILDERX_CLI upload --project $ProjectRoot --type cloudfunction --path $fnPath 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " ✗ (请到 HBuilderX 内手动上传 $fn)" -ForegroundColor Red
        }
    }
}

# ===== 2. 上传 DB Schema =====
if ($uploadSchema) {
    Write-Step 2 3 "上传 DB Schema"
    $schemas = Get-ChildItem -Filter "*.schema.json" $SchemaRoot
    foreach ($s in $schemas) {
        Write-Host "  上传 $($s.Name) ..." -NoNewline
        & $HBUILDERX_CLI upload --project $ProjectRoot --type schema --path $s.FullName 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✓" -ForegroundColor Green
        } else {
            Write-Host " ✗ (请到 HBuilderX 内手动上传)" -ForegroundColor Red
        }
    }
}

# ===== 3. 验证 =====
Write-Step 3 3 "部署后验证"
Write-Host "  1. 打开 UniCloud Web Console: https://unicloud.dcloud.net.cn" -ForegroundColor Gray
Write-Host "  2. 进入服务空间 mp-c3e590c7-e8f1-4877-95c5-346ba36e296c" -ForegroundColor Gray
Write-Host "  3. 云函数列表检查: product-co / order-co / favorites-co / user-co / school-co" -ForegroundColor Gray
Write-Host "  4. 数据库检查: products / orders / favorites / product_likes / school_users / schools" -ForegroundColor Gray
Write-Host ""
Write-Host "  本地测试云函数 (不走云端):" -ForegroundColor Gray
Write-Host "    1. HBuilderX 打开本项目, 右键 uniCloud-aliyun -> 关联云服务空间 -> 选择本空间" -ForegroundColor Gray
Write-Host "    2. 运行 -> 运行到小程序模拟器 -> 微信开发者工具" -ForegroundColor Gray
Write-Host "    3. 工具栏切换 '连接本地云函数', 所有 uniCloud.callFunction 走本地" -ForegroundColor Gray

Pop-Location
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

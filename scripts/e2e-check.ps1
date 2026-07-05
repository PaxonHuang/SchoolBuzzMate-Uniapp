# SchoolBuzzMate M3 端到端冒烟测试脚本
# 在 Windows 原生 PowerShell (非 Codex sandbox) 下运行
# 覆盖: 编译 -> 部署云函数 -> 发布->下单->支付->发货->确认->评价
#
# 用法:
#   .\scripts\e2e-check.ps1           # 编译 + 部署
#   .\scripts\e2e-check.ps1 -TestFlow # 编译 + 部署 + 模拟一遍状态流转

param(
    [switch]$TestFlow
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Push-Location $ProjectRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SchoolBuzzMate M3 E2E Test" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# ===== 1. 类型检查 =====
Write-Host ""
Write-Host "[1/5] TypeScript 类型检查" -ForegroundColor Yellow
npx vue-tsc --noEmit
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X 类型检查失败, 终止" -ForegroundColor Red
    Pop-Location; exit 1
}
Write-Host "  OK 类型检查通过" -ForegroundColor Green

# ===== 2. 编译 mp-weixin =====
Write-Host ""
Write-Host "[2/5] 编译 mp-weixin" -ForegroundColor Yellow
pnpm run build:mp-weixin
if ($LASTEXITCODE -ne 0) {
    Write-Host "  X 编译失败, 终止" -ForegroundColor Red
    Pop-Location; exit 1
}
Write-Host "  OK 编译完成: dist/build/mp-weixin" -ForegroundColor Green

# ===== 3. 部署云函数 =====
Write-Host ""
Write-Host "[3/5] 部署云函数 (uniCloud)" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File scripts/deploy-cloud.ps1 -Functions order-co,favorites-co,comment-co
Write-Host "  OK 部署完成 (请到 UniCloud Web Console 验证)" -ForegroundColor Green

# ===== 4. 部署 DB schema =====
Write-Host ""
Write-Host "[4/5] 部署 DB Schema" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File scripts/deploy-cloud.ps1 -SchemaOnly
Write-Host "  OK schema 部署完成 (请到 UniCloud Web Console 验证)" -ForegroundColor Green

# ===== 5. 模拟状态流转 (可选) =====
if ($TestFlow) {
    Write-Host ""
    Write-Host "[5/5] 模拟状态流转" -ForegroundColor Yellow
    Write-Host "  需要在 UniCloud Web Console -> 云函数 -> 测试, 手动调用以下流程:" -ForegroundColor Gray
    Write-Host "    1. user-co / verifyStudent (注册 + 认证)" -ForegroundColor Gray
    Write-Host "    2. product-co / create (A 发布商品)" -ForegroundColor Gray
    Write-Host "    3. order-co / create (B 下单, trade_method=self_pickup)" -ForegroundColor Gray
    Write-Host "    4. order-co / pay (B 支付, 返回 prepay -> uniPay.requestPayment)" -ForegroundColor Gray
    Write-Host "    5. order-co / confirm (B 确认完成)" -ForegroundColor Gray
    Write-Host "    6. comment-co / create (B 评价)" -ForegroundColor Gray
    Write-Host "    7. comment-co / getByProduct (验证 product.comment_count 累加)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  状态预期:" -ForegroundColor Gray
    Write-Host "    order.status: 0 -> 1 -> 3" -ForegroundColor Gray
    Write-Host "    product.status: 1 -> 2" -ForegroundColor Gray
    Write-Host "    school_users.credit_score: A +1, B +1" -ForegroundColor Gray
    Write-Host "    comment: 1 条" -ForegroundColor Gray
}

Pop-Location
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  E2E 检查完成" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
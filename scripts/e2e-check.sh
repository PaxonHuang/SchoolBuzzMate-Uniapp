#!/usr/bin/env bash
# SchoolBuzzMate M3 端到端冒烟测试 (WSL2 版, 对应 e2e-check.ps1)
# 类型检查 + 编译在 WSL2 原生跑; 部署走 deploy-cloud.sh (调 Windows HBuilderX CLI)。
#
# 用法:
#   ./scripts/e2e-check.sh              # 类型检查 + 编译 + 部署
#   ./scripts/e2e-check.sh --test-flow  # 追加打印手动状态流转清单
#   ./scripts/e2e-check.sh --no-deploy  # 只做类型检查 + 编译 (无 Windows HBuilderX 时用)
set -uo pipefail

TEST_FLOW=0
NO_DEPLOY=0
for arg in "$@"; do
  case "$arg" in
    --test-flow) TEST_FLOW=1 ;;
    --no-deploy) NO_DEPLOY=1 ;;
  esac
done

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "========================================"
echo "  SchoolBuzzMate M3 E2E Test (WSL2)"
echo "========================================"

# 1. 类型检查
echo ""; echo "[1/4] TypeScript 类型检查"
if ! npx vue-tsc --noEmit; then echo "  X 类型检查失败, 终止"; exit 1; fi
echo "  OK 类型检查通过"

# 2. 编译 mp-weixin
echo ""; echo "[2/4] 编译 mp-weixin"
if ! pnpm run build:mp-weixin; then echo "  X 编译失败, 终止"; exit 1; fi
echo "  OK 编译完成: dist/build/mp-weixin"

# 3. 部署 (可选)
if [[ "$NO_DEPLOY" -eq 0 ]]; then
  echo ""; echo "[3/4] 部署云函数 + schema (调 Windows HBuilderX CLI)"
  bash "$PROJECT_ROOT/scripts/deploy-cloud.sh" --functions order-co,favorites-co,comment-co || \
    echo "  (部署失败: 确认 HBUILDERX_CLI 路径, 或在 HBuilderX GUI 手动上传)"
  bash "$PROJECT_ROOT/scripts/deploy-cloud.sh" --schema-only || true
else
  echo ""; echo "[3/4] 跳过部署 (--no-deploy)"
fi

# 4. 手动流转清单
if [[ "$TEST_FLOW" -eq 1 ]]; then
  echo ""; echo "[4/4] 手动状态流转清单 (UniCloud Web Console -> 云函数 -> 测试):"
  echo "    1. user-co/verifyStudent   2. product-co/create (A 发布)"
  echo "    3. order-co/create (B 下单) 4. order-co/pay (B 支付)"
  echo "    5. order-co/confirm         6. comment-co/create (B 评价)"
  echo "    7. comment-co/getByProduct  (验证 product.comment_count 累加)"
  echo "  预期: order.status 0->1->3 | product.status 1->2 | 双方 credit +1 | comment 1 条"
fi

echo ""
echo "========================================"
echo "  E2E 检查完成"
echo "========================================"

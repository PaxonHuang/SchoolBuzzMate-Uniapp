#!/usr/bin/env bash
# SchoolBuzzMate 开发环境一键启动 (WSL2 版, 对应 dev.ps1)
# 编译在 WSL2 原生跑, 微信开发者工具在 Windows 打开 WSL2 里的产物 (跨边界)。
#
# 用法:
#   ./scripts/dev.sh [mp-weixin|h5|both]
#
# 依赖 Windows 侧微信开发者工具 CLI, 路径可用环境变量覆盖:
#   WX_CLI  默认 /mnt/e/Tencent微信web开发者工具/微信web开发者工具/cli.bat
set -uo pipefail

PLATFORM="${1:-mp-weixin}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WX_CLI="${WX_CLI:-/mnt/e/Tencent微信web开发者工具/微信web开发者工具/cli.bat}"
WX_DEV_PROJECT="$PROJECT_ROOT/dist/dev/mp-weixin"

echo "========================================"
echo "  SchoolBuzzMate Dev Environment (WSL2)"
echo "========================================"

# [1/3] 依赖检查
command -v node >/dev/null || { echo "ERROR: 未找到 node (>=20)"; exit 1; }
command -v pnpm >/dev/null || { echo "ERROR: 未找到 pnpm (corepack enable)"; exit 1; }
echo "  node: $(node --version)   pnpm: $(pnpm --version)"

# [2/3] 安装依赖
echo "[2/3] pnpm install ..."
( cd "$PROJECT_ROOT" && pnpm install --silent ) || { echo "ERROR: pnpm install 失败"; exit 1; }

# [3/3] 编译 + 打开微信开发者工具
cd "$PROJECT_ROOT"
if [[ "$PLATFORM" == "mp-weixin" || "$PLATFORM" == "both" ]]; then
  echo "[3/3] 启动 mp-weixin 编译监听 (后台)..."
  pnpm run dev:mp-weixin &
  # 等首次编译产物
  for _ in $(seq 1 20); do [[ -d "$WX_DEV_PROJECT" ]] && break; sleep 2; done
  if [[ -d "$WX_DEV_PROJECT" ]]; then
    if [[ -x "$WX_CLI" || -f "$WX_CLI" ]]; then
      WIN_PROJECT="$(wslpath -w "$WX_DEV_PROJECT")"
      echo "  打开微信开发者工具: $WIN_PROJECT"
      "$WX_CLI" open --project "$WIN_PROJECT" || \
        echo "  (自动打开失败, 手动在微信开发者工具导入: $WIN_PROJECT)"
    else
      echo "  未找到微信开发者工具 CLI ($WX_CLI)"
      echo "  手动在 Windows 微信开发者工具导入: $(wslpath -w "$WX_DEV_PROJECT")"
    fi
  else
    echo "  WARNING: 未在 $WX_DEV_PROJECT 找到编译产物, 稍后手动导入"
  fi
fi

if [[ "$PLATFORM" == "h5" || "$PLATFORM" == "both" ]]; then
  echo "  启动 H5 dev server..."
  pnpm run dev:h5 &
fi

echo "========================================"
echo "  Dev 环境就绪, 改代码自动增量编译。Ctrl+C 结束。"
echo "========================================"
wait

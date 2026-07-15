#!/usr/bin/env bash
# SchoolBuzzMate UniCloud 一键部署 (WSL2 版, 对应 deploy-cloud.ps1)
# 通过 WSL 互操作调用 Windows 侧 HBuilderX CLI 上传云函数 + DB schema。
# 项目路径传给 Windows CLI 时经 wslpath -w 翻译成 \\wsl.localhost\... 形式。
#
# 用法:
#   ./scripts/deploy-cloud.sh                          # 全部云函数 + 全部 schema
#   ./scripts/deploy-cloud.sh --functions order-co,favorites-co
#   ./scripts/deploy-cloud.sh --schema-only
#   ./scripts/deploy-cloud.sh --functions-only
#   ./scripts/deploy-cloud.sh --dry-run                # 只打印将执行的命令, 不实际上传
#
# HBuilderX CLI 路径可用环境变量覆盖:
#   HBUILDERX_CLI  默认 /mnt/e/HbuilderX/HBuilderX/cli.exe
set -uo pipefail

FUNCTIONS=""
FUNCTIONS_ONLY=0
SCHEMA_ONLY=0
DRY_RUN=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --functions) FUNCTIONS="$2"; shift 2 ;;
    --functions-only) FUNCTIONS_ONLY=1; shift ;;
    --schema-only) SCHEMA_ONLY=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLOUD_ROOT="$PROJECT_ROOT/uniCloud-aliyun"
FUNCTIONS_ROOT="$CLOUD_ROOT/cloudfunctions"
SCHEMA_ROOT="$CLOUD_ROOT/database"
HBUILDERX_CLI="${HBUILDERX_CLI:-/mnt/e/HbuilderX/HBuilderX/cli.exe}"

echo "========================================"
echo "  SchoolBuzzMate UniCloud Deploy (WSL2)"
echo "========================================"

[[ -d "$CLOUD_ROOT" ]] || { echo "  ✗ uniCloud-aliyun/ 不存在"; exit 1; }
if [[ "$DRY_RUN" -eq 0 && ! -f "$HBUILDERX_CLI" ]]; then
  echo "  ✗ 未找到 HBuilderX CLI: $HBUILDERX_CLI"
  echo "    请在 Windows 安装 HBuilderX, 或设 HBUILDERX_CLI 环境变量"
  echo "    (纯 WSL2 装不了 HBuilderX; 只能调 Windows 侧, 或直接在 HBuilderX GUI 上传)"
  exit 1
fi

WIN_PROJECT="$(wslpath -w "$PROJECT_ROOT")"

run_cli() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "    [dry-run] \"$HBUILDERX_CLI\" $*"
  else
    "$HBUILDERX_CLI" "$@" >/dev/null 2>&1
  fi
}

UPLOAD_FUNCTIONS=1; [[ "$SCHEMA_ONLY" -eq 1 ]] && UPLOAD_FUNCTIONS=0
UPLOAD_SCHEMA=1;    [[ "$FUNCTIONS_ONLY" -eq 1 ]] && UPLOAD_SCHEMA=0

# 1. 云函数
if [[ "$UPLOAD_FUNCTIONS" -eq 1 ]]; then
  echo ""; echo "[1/3] 上传云函数"
  if [[ -n "$FUNCTIONS" ]]; then
    IFS=',' read -ra TARGETS <<< "$FUNCTIONS"
  else
    mapfile -t TARGETS < <(find "$FUNCTIONS_ROOT" -maxdepth 1 -mindepth 1 -type d -printf '%f\n')
  fi
  for fn in "${TARGETS[@]}"; do
    fn="$(echo "$fn" | xargs)"
    fn_path="$FUNCTIONS_ROOT/$fn"
    [[ -d "$fn_path" ]] || { echo "  ✗ [$fn] 目录不存在, 跳过"; continue; }
    printf "  上传 %s ..." "$fn"
    if run_cli upload --project "$WIN_PROJECT" --type cloudfunction --path "$(wslpath -w "$fn_path")"; then
      echo " ✓"
    else
      echo " ✗ (请到 HBuilderX 内手动上传 $fn)"
    fi
  done
fi

# 2. DB schema
if [[ "$UPLOAD_SCHEMA" -eq 1 ]]; then
  echo ""; echo "[2/3] 上传 DB Schema"
  while IFS= read -r s; do
    printf "  上传 %s ..." "$(basename "$s")"
    if run_cli upload --project "$WIN_PROJECT" --type schema --path "$(wslpath -w "$s")"; then
      echo " ✓"
    else
      echo " ✗ (请到 HBuilderX 内手动上传)"
    fi
  done < <(find "$SCHEMA_ROOT" -maxdepth 1 -name '*.schema.json')
fi

# 3. 验证提示
echo ""; echo "[3/3] 部署后验证"
echo "  1. UniCloud Web Console: https://unicloud.dcloud.net.cn"
echo "  2. 服务空间 mp-c3e590c7-e8f1-4877-95c5-346ba36e296c"
echo "  3. 云函数: product-co / order-co / favorites-co / comment-co / user-co / school-co"
echo "  4. 数据库: products / orders / favorites / comments / product_likes / school_users / schools"
echo ""
echo "========================================"
echo "  部署完成"
echo "========================================"

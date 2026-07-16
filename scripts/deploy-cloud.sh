#!/usr/bin/env bash
# SchoolBuzzMate UniCloud 一键部署 (WSL2 版, 对应 deploy-cloud.ps1)
# 通过 WSL 互操作调用 Windows 侧 HBuilderX CLI 上传云函数 + DB schema + 公共模块。
# HBuilderX CLI 必须 GUI 已打开 (cli.exe 内部会校验)。
#
# 用法:
#   ./scripts/deploy-cloud.sh                          # 全部云函数 + 全部 schema
#   ./scripts/deploy-cloud.sh --functions order-co,favorites-co
#   ./scripts/deploy-cloud.sh --common uni-pay
#   ./scripts/deploy-cloud.sh --schema-only
#   ./scripts/deploy-cloud.sh --functions-only
#   ./scripts/deploy-cloud.sh --dry-run                # 只打印将执行的命令, 不实际上传
#
# HBuilderX CLI 路径可用环境变量覆盖:
#   HBUILDERX_CLI  默认 /mnt/e/HbuilderX/HBuilderX/cli.exe
# 项目名 (HBuilderX 内部) 默认 SchoolBuzzUniApp, 可用 PROJECT_NAME 覆盖。
set -uo pipefail

FUNCTIONS=""
COMMON=""
FUNCTIONS_ONLY=0
SCHEMA_ONLY=0
DRY_RUN=0
PROJECT_NAME="${PROJECT_NAME:-SchoolBuzzUniApp}"
HBUILDERX_CLI="${HBUILDERX_CLI:-/mnt/e/HbuilderX/HBuilderX/cli.exe}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --functions) FUNCTIONS="$2"; shift 2 ;;
    --common) COMMON="$2"; shift 2 ;;
    --functions-only) FUNCTIONS_ONLY=1; shift ;;
    --schema-only) SCHEMA_ONLY=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --project) PROJECT_NAME="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,18p' "$0"; exit 0 ;;
    *) echo "未知参数: $1"; exit 1 ;;
  esac
done

CLOUD_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/uniCloud-aliyun"
FUNCTIONS_ROOT="$CLOUD_ROOT/cloudfunctions"
SCHEMA_ROOT="$CLOUD_ROOT/database"

echo "========================================"
echo "  SchoolBuzzMate UniCloud Deploy (WSL2)"
echo "  project : $PROJECT_NAME"
echo "  cli     : $HBUILDERX_CLI"
echo "========================================"

[[ -d "$CLOUD_ROOT" ]] || { echo "  ✗ uniCloud-aliyun/ 不存在"; exit 1; }

if [[ "$DRY_RUN" -eq 0 ]]; then
  [[ -f "$HBUILDERX_CLI" ]] || { echo "  ✗ 未找到 HBuilderX CLI: $HBUILDERX_CLI"; exit 1; }
  if "$HBUILDERX_CLI" --help 2>&1 | grep -q '未检测到已打开的HBuilderX'; then
    echo ""
    echo "  ✗ HBuilderX 未打开, CLI 拒绝工作。"
    echo "    请在 Windows 打开 HBuilderX (导入本项目), 然后再跑本脚本。"
    echo "    或者直接在 HBuilderX GUI 里右键 uniCloud-aliyun -> 上传所有云函数。"
    exit 2
  fi
fi

UPLOAD_FUNCTIONS=1; [[ "$SCHEMA_ONLY" -eq 1 ]] && UPLOAD_FUNCTIONS=0
UPLOAD_SCHEMA=1;    [[ "$FUNCTIONS_ONLY" -eq 1 ]] && UPLOAD_SCHEMA=0
UPLOAD_COMMON=1;    [[ "$SCHEMA_ONLY" -eq 1 || "$FUNCTIONS_ONLY" -eq 1 ]] && UPLOAD_COMMON=0

run_upload() {
  # run_upload <resource_type> <name>      # resource_type: cloudfunction|common|db
  local type="$1" name="$2"
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "    [dry-run] \"$HBUILDERX_CLI\" cloud functions --upload $type --prj \"$PROJECT_NAME\" --provider aliyun --name \"$name\""
    return 0
  fi
  if "$HBUILDERX_CLI" cloud functions --upload "$type" --prj "$PROJECT_NAME" --provider aliyun --name "$name" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# 1. 云函数
if [[ "$UPLOAD_FUNCTIONS" -eq 1 ]]; then
  echo ""; echo "[1/3] 上传云函数"
  if [[ -n "$FUNCTIONS" ]]; then
    IFS=',' read -ra TARGETS <<< "$FUNCTIONS"
  else
    mapfile -t TARGETS < <(find "$FUNCTIONS_ROOT" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | grep -v '^common$')
  fi
  for fn in "${TARGETS[@]}"; do
    fn="$(echo "$fn" | xargs)"
    [[ -d "$FUNCTIONS_ROOT/$fn" ]] || { echo "  ✗ [$fn] 目录不存在, 跳过"; continue; }
    printf "  上传 cloudfunction/%s ..." "$fn"
    if run_upload cloudfunction "$fn"; then
      echo " ✓"
    else
      echo " ✗ (请在 HBuilderX 内手动上传)"
    fi
  done
fi

# 2. 公共模块
if [[ "$UPLOAD_COMMON" -eq 1 ]]; then
  echo ""; echo "[2/3] 上传公共模块"
  if [[ -n "$COMMON" ]]; then
    IFS=',' read -ra TARGETS <<< "$COMMON"
  else
    mapfile -t TARGETS < <(find "$FUNCTIONS_ROOT/common" -maxdepth 1 -mindepth 1 -type d -printf '%f\n' | grep -v '^_' || true)
  fi
  for m in "${TARGETS[@]}"; do
    m="$(echo "$m" | xargs)"
    [[ -d "$FUNCTIONS_ROOT/common/$m" ]] || { echo "  ✗ [$m] 不存在, 跳过"; continue; }
    printf "  上传 common/%s ..." "$m"
    if run_upload common "$m"; then
      echo " ✓"
    else
      echo " ✗ (请在 HBuilderX 内手动上传)"
    fi
  done
fi

# 3. DB schema
if [[ "$UPLOAD_SCHEMA" -eq 1 ]]; then
  echo ""; echo "[3/3] 上传 DB Schema"
  # 先把所有 schema 路径捕到数组,避免 while+process substitution 在某些环境 EOF 早返回
  mapfile -t SCHEMA_FILES < <(find "$SCHEMA_ROOT" -maxdepth 1 -name '*.schema.json')
  for s in "${SCHEMA_FILES[@]}"; do
    # 注意: HBuilderX CLI 要求 db 的 --name 必须带 .schema.json 后缀
    name="$(basename "$s")"
    printf "  上传 db/%s ..." "$name"
    if run_upload db "$name"; then
      echo " ✓"
    else
      echo " ✗ (请在 HBuilderX 内手动上传)"
    fi
  done
fi

echo ""; echo "========================================"
echo "  部署完成"
echo "  服务空间: mp-c3e590c7-e8f1-4877-95c5-346ba36e296c"
echo "  Web Console: https://unicloud.dcloud.net.cn"
echo "========================================"
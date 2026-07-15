---
name: wsl2-hybrid-workflow
description: Use when developing SchoolBuzzMate (UniApp/微信小程序) with code in WSL2 but WeChat DevTools/HBuilderX on Windows. Covers the cross-boundary build/deploy workflow, LF/CRLF handling, wslpath path translation, and proxy setup. Trigger when working in WSL2 on this project, or when "\\wsl.localhost", CRLF/LF errors, or "跨边界" come up.
---

# WSL2 混合工作流 (SchoolBuzzMate)

**核心事实**: 微信开发者工具 + HBuilderX 是纯 Windows GUI 程序,**无法装进 WSL2**。
所以: **代码/编译/依赖/git 在 WSL2 原生跑;微信预览/提审/上传云函数留 Windows**。

## 分工

| 动作 | 在哪 | 命令 |
|---|---|---|
| 安装依赖 / 类型检查 / 编译 | WSL2 | `pnpm install` / `pnpm type-check` / `pnpm run build:mp-weixin` |
| 开发监听 | WSL2 | `pnpm run dev:mp-weixin`(或 `pnpm run dev:sh`) |
| 预览 / 真机 / 提审 | Windows 微信开发者工具 | 导入 `\\wsl.localhost\Ubuntu\home\<用户>\...\dist\dev\mp-weixin` |
| 关联云空间 / 上传云函数 | Windows HBuilderX | GUI,或 WSL2 `pnpm run deploy:cloud:sh`(经互操作调 Windows CLI) |

## 关键约定

1. **路径翻译**: WSL 路径传给 Windows CLI 前必须 `wslpath -w`。`/home/...` → `\\wsl.localhost\Ubuntu\home\...`。`.sh` 脚本已内置。
2. **CLI 路径用环境变量**,不要硬编码:
   ```bash
   export WX_CLI="/mnt/e/Tencent微信web开发者工具/微信web开发者工具/cli.bat"
   export HBUILDERX_CLI="/mnt/e/HbuilderX/HBuilderX/cli.exe"
   ```
3. **行尾**: 以根目录 `.gitattributes` 为唯一事实来源(文本 LF,`.ps1/.bat/.cmd` CRLF)。新机 `git config core.autocrlf false`。诊断行尾用 `git ls-files --eol`,不要用 `file`。
4. **mirrored networking**: `%UserProfile%\.wslconfig` 里 `[wsl2]\nnetworkingMode=mirrored`,让 localhost/dev server(`0.0.0.0:9420`)跨边界互通;改后 `wsl --shutdown`。
5. **代理**: WSL2 内跑 ShellCrash,`git config --global http.proxy http://127.0.0.1:<port>` + `HTTP(S)_PROXY`。不把订阅/token 写进仓库。
6. **HBuilderX 只做云空间关联/上传云函数**;编译永远走 pnpm CLI(且绕开 HBuilderX+Node ESM bug)。

## 双脚本对应关系

| WSL2 (`.sh`) | Windows (`.ps1`) | npm script |
|---|---|---|
| `scripts/dev.sh` | `scripts/dev.ps1` | `dev:sh` |
| `scripts/deploy-cloud.sh` | `scripts/deploy-cloud.ps1` | `deploy:cloud:sh` |
| `scripts/e2e-check.sh` | `scripts/e2e-check.ps1` | `e2e:check:sh` / `e2e:full:sh` |

改一个记得同步另一个。完整迁移步骤见 `docs/WSL2-MIGRATION.md`。

## 常见坑

- **跨边界热更新不灵**: `\\wsl.localhost` 下 Windows 微信工具可能感知不到 WSL2 inotify 变更 → 回退:产物同步到 `/mnt/e/...` 供微信工具打开。
- **`sh: \r: command not found`**: 某 `.sh` 被存成 CRLF → 检查 `.gitattributes` 是否覆盖,`git add --renormalize`。
- **`wslpath: command not found`**: 只在 WSL 内有;`.sh` 脚本别在纯 Linux/CI 跑上传部分。

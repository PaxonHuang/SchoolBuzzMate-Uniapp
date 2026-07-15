# WSL2 迁移执行手册 — SchoolBuzzMate

> 目标: 把开发环境从 Windows 11 (`E:\NJTS-Codeprojects-2023\WechatMiniproject\SchoolBuzzUniAPP`)
> 迁到 WSL2 Ubuntu 24.04 (`~/SchoolBuzzProjects/SchoolBuzzUniAPP`)。
> 原则: **代码/编译/依赖/git 在 WSL2;微信开发者工具 + HBuilderX 留 Windows**(纯 Windows 程序,进不了 WSL2)。
> Windows 侧原目录在全流程验证通过前**不要删**,作为回滚点。

---

## 前置(在 Windows 完成,已由本次自动化处理的部分见文末"已就绪")

1. `.gitattributes` / `.editorconfig` 已加(统一 LF,`.ps1/.bat/.cmd` 保留 CRLF)——彻底消除 LF↔CRLF 报错。
2. `scripts/{dev,deploy-cloud,e2e-check}.sh` 已加(WSL2 侧跨边界包装器)。
3. `.ps1` 的 CLI 路径已改为 `$env:WX_CLI` / `$env:HBUILDERX_CLI` 间接。
4. **待你确认后**才执行: 提交 Java 课程设计删除、退役 `CLAUDE-CODE-PROMPTS.md`、清 `.remember/logs` 旧日志(见文末决策清单)。

## 阶段 A — 开启 WSL2 mirrored networking(简化代理 + 跨边界 localhost)

`%UserProfile%\.wslconfig`(Windows 侧,需 Win11 22H2+):
```ini
[wsl2]
networkingMode=mirrored
```
然后 PowerShell: `wsl --shutdown`(重启 WSL 生效)。

## 阶段 B — Ubuntu 内基础环境

```bash
sudo apt update && sudo apt install -y git curl build-essential
# nvm + Node (与 package.json engines: node>=20 对齐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# 重开终端后:
nvm install 22 && nvm use 22
corepack enable && corepack prepare pnpm@10.10.0 --activate   # 仓库 preinstall 强制 pnpm
node -v && pnpm -v
```
(可选)想在 WSL2 直接跑 `.ps1`: `sudo apt install -y powershell` 后用 `pwsh`;否则用 `.sh` 版本即可。

## 阶段 C — GitHub / 代理(复用 Windows Clash Verge,方案 A)

前提:Windows 已在跑 **Clash Verge**,且开启「**系统代理**」;WSL 网络模式 = **mirrored**。

1. WSL Settings「网络」页把「**已启用自动代理**」设为 **开** → 应用更改 → `wsl --shutdown`。
   - 此后 WSL 自动继承 Windows 的 HTTP 代理,git/pnpm/curl 一般无需再配。
2. 验证:
   ```bash
   env | grep -i proxy          # 应能看到 http_proxy 已被注入
   curl -I https://github.com   # 通即可
   ```
3. 若某些 CLI 没吃到代理(mirrored 下 localhost 与 Windows 共享),手动指到 Clash 的 mixed 端口(按 Verge 实际端口,常见 7890):
   ```bash
   git config --global http.proxy  http://127.0.0.1:7890
   git config --global https.proxy http://127.0.0.1:7890
   export HTTP_PROXY=http://127.0.0.1:7890 HTTPS_PROXY=http://127.0.0.1:7890
   ```
> 备选(方案 B,不推荐并存):WSL2 内自装 ShellCrash 做独立 Linux 代理;此时「自动代理」保持关,且 mirrored 下用端口/mixed 代理而非 TUN(TUN 与 mirrored 易冲突)。
> ⚠️ 不把订阅链接 / token / PAT / 支付密钥写进仓库。

## 阶段 D — 迁移代码

**方式1(推荐,干净):** 有远端仓库时
```bash
mkdir -p ~/SchoolBuzzProjects && cd ~/SchoolBuzzProjects
git clone <remote-url> SchoolBuzzUniAPP
```
**方式2(无远端,用 bundle):** 在 Windows 项目根:
```powershell
git bundle create E:\schoolbuzz.bundle --all
```
WSL2:
```bash
mkdir -p ~/SchoolBuzzProjects && cd ~/SchoolBuzzProjects
git clone /mnt/e/schoolbuzz.bundle SchoolBuzzUniAPP
cd SchoolBuzzUniAPP && git remote remove origin  # 之后按需接真远端
```
然后:
```bash
git config core.autocrlf false          # .gitattributes 作唯一事实来源
git ls-files --eol | grep -c 'w/crlf'    # 期望仅 .ps1/.bat 等 CRLF, 其余 LF
pnpm install                             # native fs, 无需旧的手动 symlink workaround
pnpm type-check                          # 基线未退化 (期望 0 错误)
```

## 阶段 E — 混合构建 & 验证

```bash
# 1) WSL2 编译监听
pnpm run dev:mp-weixin      # 或 pnpm run dev:sh (自动尝试打开 Windows 微信开发者工具)

# 2) 生产编译 + postbuild AppID 修复
pnpm run build:mp-weixin    # 产出 dist/build/mp-weixin, node scripts/fix-mp-weixin-appid.mjs 生效
```
**Windows 侧微信开发者工具**导入(注意是 `\\wsl.localhost` 路径):
```
\\wsl.localhost\Ubuntu\home\<用户名>\SchoolBuzzProjects\SchoolBuzzUniAPP\dist\dev\mp-weixin
```
**部署云函数**(WSL2 调 Windows HBuilderX CLI):
```bash
export HBUILDERX_CLI="/mnt/e/HbuilderX/HBuilderX/cli.exe"
export WX_CLI="/mnt/e/Tencent微信web开发者工具/微信web开发者工具/cli.bat"
pnpm run deploy:cloud:sh -- --dry-run   # 先校验路径翻译
pnpm run e2e:check:sh                    # 类型检查 + 编译 + 部署
```

### 验证清单
- [ ] `git ls-files --eol` 只有 `.ps1/.bat` 等是 crlf,其余 lf
- [ ] `pnpm install` / `pnpm type-check` / `pnpm run build:mp-weixin` 均成功
- [ ] Windows 微信开发者工具打开 `\\wsl.localhost\...\dist\dev\mp-weixin` 可预览
- [ ] 改一行代码 → WSL2 增量编译 → 微信工具能感知刷新(**验证跨边界文件监听**)
- [ ] `curl -I https://github.com` / `git ls-remote` 走代理成功
- [ ] `deploy-cloud.sh --dry-run` 路径翻译正确

### 已知回退
- **跨边界热更新不灵**(`\\wsl.localhost` 下 Windows 感知不到 WSL2 inotify): 改为把产物同步到一个 `/mnt/e/...` 目录供微信工具打开,或用 `rsync`/watch 脚本。
- **mirrored networking 副作用**: 回退默认 NAT,代理改指向 Windows 主机 IP。

---

## 待你决策(执行前暂停,见对话)
| 项 | 建议 | 状态 |
|---|---|---|
| 提交 Java 课程设计删除(65 个 `assets/img/java-source/**` 等,已在磁盘删除,未 commit) | commit | ⏸ 待确认 |
| 退役 `CLAUDE-CODE-PROMPTS.md`(30KB prompt 日志) | 移 `docs/archive/` 或删 | ⏸ 待确认 |
| 清 `.remember/logs` 旧日志(gitignored) | 清 | ⏸ 待确认 |
| **`IDkeys.txt` 被 git 跟踪且未 gitignore(疑似含密钥)** | 审查 → 移出跟踪 + 加 .gitignore + 轮换密钥 | ⚠️ 安全,待确认 |
| `manifest.config.ts` 明文 `clientSecret` | 评估是否改环境注入 | ⚠️ 安全,待确认 |

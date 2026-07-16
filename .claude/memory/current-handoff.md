# Claude Code 当前交接

最后整理: 2026-07-17(WSL2 + M3 部署收尾)
来源: Codex 历史会话索引、当前项目文件、`CHANGELOG.md`、`.claude/memory/` 现有记忆。

## ✅ 已完成(2026-07-17 WSL2 实操)

- WSL2 Ubuntu 24.04 环境就绪(Node v22.23.1 / pnpm 10.10.0 / 代理 172.18.80.1:7897)
- `pnpm install` + `pnpm type-check` 0 错误 + `pnpm run build:mp-weixin` 成功 (828K, AppID postbuild 修复)
- 重写 `scripts/deploy-cloud.{ps1,sh}` 用正确 HBuilderX CLI 语法 (旧语法根本不存在)
- **完整部署 M3**: 6 云函数 + 2 公共模块 + 7 schema 全部上传到 `mp-c3e590c7-...`
  - 修复了 3 个 bug: process substitution EOF 早返回、db name 必须带后缀、pnpm `--` 传递
- Windows 侧 `PROGRESS.md` 已同步 (M3 标 ✅)
- `package.json` 加 `deploy:cloud:sh:dry` / `e2e:check:sh:nodep` 解决 `--` 传递问题
- `.claude/memory/known-issues.md` 新增问题 16 (HBuilderX CLI 真实语法 + WSL2 bash 坑)

## 🐧 WSL2 工作流已稳定

混合工作流跑通:

```bash
# WSL2 内 (native fs, 速度比 Windows 快很多)
pnpm install
pnpm type-check
pnpm run build:mp-weixin
bash scripts/deploy-cloud.sh            # 部署 (要 HBuilderX GUI 开着)
bash scripts/deploy-cloud.sh --dry-run  # 只校验路径, 不上传

# Windows 内 (用户)
# - HBuilderX 导入 \\wsl.localhost\Ubuntu-24.04\home\SchoolBuzzProjects\SchoolBuzzMate-Uniapp
# - 微信开发者工具导入 dist/build/mp-weixin 预览
```

HBuilderX CLI 已知坑(详细见 known-issues.md#16):
1. CLI 必须 GUI 已打开(否则 `未检测到已打开的HBuilderX`)
2. 项目名是 `SchoolBuzzUniApp` (用 `cli project list` 查)
3. db 的 `--name` 必须带 `.schema.json` 后缀
4. WSL2 bash 下 `while read < <(find ...)` 跑 1 次就 EOF — 改 `mapfile` + `for`

## 仍待完成 (下一步进入 M4)

1. **真机闭环验证** (核心 M3 验证, 必须用户在微信开发者工具里走一遍):
   - 发布商品 → 下单 → 支付 → 发货/自提 → 确认收货 → 评价
   - 仅验证 mp-weixin, H5/APP 不阻断 M3
2. **M4 上线物料** (待开始):
   - 申请微信支付商户号 / API 密钥 v3
   - 配置 `uni-config-center/uni-pay` 商户信息
   - 小程序审核材料准备 (类目资质、用户协议、隐私协议)
   - 提审 + 性能优化 + 监控

## 打开项目后先做

1. 读 `CLAUDE.md` 和本文件。
2. 跑 `git status --short`。当前文件系统永远比历史记忆更可信。
3. 如果要改订单、支付、评价、信用分、超时逻辑, 再读 `m3-transaction-core.md`。
4. 部署相关问题读 `known-issues.md#16`。
5. 不要迁移或复述历史聊天里的 token、密钥、账号凭证。

## 项目定位

项目根目录: WSL2 `~/SchoolBuzzProjects/SchoolBuzzMate-Uniapp` (HBuilderX 端用 `\\wsl.localhost\Ubuntu-24.04\...`)

SchoolBuzzMate 是 UniApp + Vue3 + TypeScript + UniCloud 阿里云的校园二手交易/社交平台。当前主目标平台是微信小程序。MVP 后端走 UniCloud, 后续通过 `src/api/*.ts` 抽象层切 Spring Boot/Spring Cloud。

## 最近确认的 Git 状态

- HEAD: `19333a0 docs(wsl2): 代理改为方案A(复用 Windows Clash + 自动代理), ShellCrash 降为备选`
- WSL2 迁移准备 commits: `e04094d` / `097e71d` / `fa80213` / `ccee34e`
- M3 核心提交: `086a4bd`, `43e1dc2`, `89f213f`, `d5d677e`, `08eadfe`, `13f849c`, `1d6fcb1`
- worktree 干净(2026-07-17 实测)
- 本次任务会修改 `scripts/deploy-cloud.{ps1,sh}` 和 `package.json` (deploy:cloud:sh:dry 等)

## 不要做的事

- 不要把 Codex 原始会话全文导入项目。
- 不要把任何 API token、GitHub PAT、Cloudflare token、微信支付密钥写进仓库。
- 不要把其他项目会话混进 SchoolBuzzMate 记忆, 包括 NJTS Astro 博客、STM32 考试项目、Unity/PlatformIO 项目。
- 不要把 `products.seller_id` 当成 `uni-id-users._id`; 它指向 `school_users._id`。
- 不要在页面直接调 `uniCloud.callFunction`; 必须走 `src/api/*.ts`。
- 不要直接 `./scripts/deploy-cloud.sh`(可能无 x 权限), 用 `bash scripts/deploy-cloud.sh`。
- 不要在 HBuilderX GUI 未打开时跑部署脚本(会全失败)。

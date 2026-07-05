# Claude Code 当前交接

最后整理: 2026-07-05  
来源: Codex 历史会话索引、当前项目文件、`CHANGELOG.md`、`.claude/memory/` 现有记忆。

## 打开项目后先做

1. 读 `CLAUDE.md` 和本文件。
2. 跑 `git status --short`。当前文件系统永远比历史记忆更可信。
3. 如果要改订单、支付、评价、信用分、超时逻辑, 再读 `m3-transaction-core.md`。
4. 不要迁移或复述历史聊天里的 token、密钥、账号凭证。

## 项目定位

项目根目录: `E:\NJTS-Codeprojects-2023\WechatMiniproject\SchoolBuzzUniAPP`

SchoolBuzzMate 是 UniApp + Vue3 + TypeScript + UniCloud 阿里云的校园二手交易/社交平台。当前主目标平台是微信小程序。MVP 后端走 UniCloud, 后续通过 `src/api/*.ts` 抽象层切 Spring Boot/Spring Cloud。

## 最近确认的 Git 状态

最后一次迁移审计前观察到:

- HEAD: `101aefc docs(claude): 迁移记忆到 .claude/memory/ 主题文件 + 更新 CLAUDE.md 入口`
- M3 核心提交: `086a4bd`, `43e1dc2`, `89f213f`, `d5d677e`, `08eadfe`, `13f849c`, `1d6fcb1`
- worktree 已有未提交修改: `src/pages/product/detail.vue`
- 未跟踪文件: `.claude/settings.local.json` 和若干 `_tmp_*`
- 本次迁移会继续修改 `CLAUDE.md` 和 `.claude/memory/*`, 如未提交属于预期

`src/pages/product/detail.vue` 的未提交 diff 曾显示一个可疑问题: `previewImage` 函数签名被重复插入, 可能导致语法错误。继续任何 build/e2e 前先检查并修正, 但不要回滚用户未授权的其他改动。

## M3 当前状态

代码层 M3 已完成主要实现并有 commit 记录:

- type-check 修复: `ProductDetailResult`, `OrderDetail` 包装类型, `list.vue` typo, `tsconfig` types 修正
- 部署脚本: `scripts/deploy-cloud.ps1`, `deploy:cloud`, `deploy:cloud:order`
- 订单核心: `order-co` create/list/detail/pay/cancel/ship/confirm/payNotify/timeoutScan
- 支付: `uni-pay` 微信支付接入代码已写, 仍需真机/云端配置验证
- 信用分: confirm 双方 +1, cancel 发起方 -2, timeoutScan 超时方 -1
- 评价: `comment-co`, `comments.schema.json`, `src/api/comment.ts`, `src/types/comment.ts`, `pages/order/comment/index.vue`, 商品详情评价列表
- E2E 脚本: `scripts/e2e-check.ps1`, `pnpm e2e:check`, `pnpm e2e:full`
- 变更记录: `CHANGELOG.md`

## 仍未完成的收尾

1. 在 Windows 原生 PowerShell 跑:

```powershell
cd E:\NJTS-Codeprojects-2023\WechatMiniproject\SchoolBuzzUniAPP
pnpm install
pnpm e2e:check
```

2. 部署/关联 UniCloud:

- SpaceID: `mp-c3e590c7-e8f1-4877-95c5-346ba36e296c`
- 需要部署 `order-co`, `favorites-co`, `comment-co`, 以及 `comments.schema.json`
- HBuilderX 只用于关联云空间/上传云函数；编译优先用 pnpm CLI

3. 安装/配置 uni-pay:

- `order-co/package.json` 引用 `file:../common/uni-pay`
- `uniCloud-aliyun/cloudfunctions/common/uni-pay/` 可能还不存在
- 需要在真机/HBuilderX 或 DCloud 官方方式安装 `uni-pay-aliyun`
- 微信支付商户号/API key 配置属于上线前必须项

4. 同步外部文档:

- 把 `CHANGELOG.md` 的 M3 内容同步到 `..\SchoolBuzzDocs\PROGRESS.md`
- 标记 M3 为已完成后再启动 M4

5. 真机闭环:

- 发布商品 -> 下单 -> 支付 -> 发货/自提 -> 确认收货 -> 评价
- 仅验证 mp-weixin, H5/APP 不阻断 M3

## 下一步推荐

1. 先处理 `src/pages/product/detail.vue` 的未提交语法问题。
2. 复跑 `pnpm type-check` 或 `npx vue-tsc --noEmit`。
3. 在 Windows 原生 PowerShell 跑 `pnpm e2e:check`。
4. 如果部署失败, 先读 `known-issues.md`, 再检查 HBuilderX 云空间关联和 `common/uni-pay/`。
5. 验证通过后提交迁移文档和必要代码修复, 再更新 `../SchoolBuzzDocs/PROGRESS.md`。

## 不要做的事

- 不要把 Codex 原始会话全文导入项目。
- 不要把任何 API token、GitHub PAT、Cloudflare token、微信支付密钥写进仓库。
- 不要把其他项目会话混进 SchoolBuzzMate 记忆, 包括 NJTS Astro 博客、STM32 考试项目、Unity/PlatformIO 项目。
- 不要把 `products.seller_id` 当成 `uni-id-users._id`; 它指向 `school_users._id`。
- 不要在页面直接调 `uniCloud.callFunction`; 必须走 `src/api/*.ts`。

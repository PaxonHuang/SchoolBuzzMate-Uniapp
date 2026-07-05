# 用户待操作事项 (截至 2026-07-05 迁移审计)

M3 代码主线已经完成并有 commit 记录, 但当前 worktree 不是干净状态。继续前先以 `git status --short` 和当前 diff 为准, 不要只相信旧记忆里的“commit 干净”。

## 事项 0: 先处理当前 worktree

- `src/pages/product/detail.vue` 有未提交修改。迁移审计时看到 `previewImage` 函数签名疑似被重复插入, 可能导致语法错误。
- `.claude/settings.local.json` 未跟踪, 通常是 Claude 本地设置, 不要随意提交。
- `_tmp_*` 空文件未跟踪, 多半来自 pnpm/sandbox 临时文件, 提交前确认是否可删除或加入忽略。
- 本次迁移会修改 `CLAUDE.md` 和 `.claude/memory/*`; 这些是为了 Claude Code 接力, 可以作为 docs commit 单独提交。

## 事项 1: 跑端到端冒烟测试 + 部署

打开 Windows 原生 PowerShell (不是 Codex sandbox), 在项目根目录:

```powershell
cd E:\NJTS-Codeprojects-2023\WechatMiniproject\SchoolBuzzUniAPP

# 1. 装依赖 (sandbox 跑不动, 真机可以)
pnpm install

# 2. 跑端到端检查 (类型 + 编译 + 部署)
pnpm e2e:check
```

脚本 (`scripts/e2e-check.ps1`) 会:
1. `vue-tsc --noEmit` 类型检查 (确保没退化)
2. `pnpm run build:mp-weixin` 编译 mp-weixin
3. `scripts/deploy-cloud.ps1 -Functions order-co,favorites-co,comment-co` 部署 M3 新增云函数
4. `scripts/deploy-cloud.ps1 -SchemaOnly` 部署 M3 新增 schema (orders 已存在, comments 是新的)

⚠️ **deploy-cloud.ps1 调 HBuilderX CLI**, 需要先:
- 安装 HBuilderX (https://www.dcloud.io/hbuilderx.html)
- 在 HBuilderX 里打开本项目, 右键 uniCloud-aliyun -> 关联云服务空间 -> 选择 `mp-c3e590c7-e8f1-4877-95c5-346ba36e296c`
- 首次上传后再用脚本

或者: 在 HBuilderX 里直接右键 uniCloud-aliyun -> 上传所有云函数 (一次到位). 注意: HBuilderX 只承担云空间关联/上传, 编译优先走 pnpm CLI。

## 事项 2: 同步 `../SchoolBuzzDocs/PROGRESS.md`

`PROGRESS.md` 位于 `E:\NJTS-Codeprojects-2023\WechatMiniproject\SchoolBuzzDocs\`.

需要用户手动把 `CHANGELOG.md` (项目根目录) 的内容贴到 `../SchoolBuzzDocs/PROGRESS.md` 里, 或者直接用 `CHANGELOG.md` 替换 M3 那段.

或者更简单: 把 CHANGELOG.md 也软链/复制到 SchoolBuzzDocs 目录:

```powershell
Copy-Item .\CHANGELOG.md ..\SchoolBuzzDocs\CHANGELOG.md
```

## 事项 3 (M4 启动前可选): 装 uni-pay 公共模块

`order-co/package.json` 引用了 `uni-pay: file:../common/uni-pay`. `common/uni-pay/` 目录还不存在 (sandbox 装不了). 在 HBuilderX 里:

1. 右键 `uniCloud-aliyun/cloudfunctions/common/` -> 新建云函数/公共模块
2. 选 `uni-pay-aliyun`, HBuilderX 自动下载
3. 上传时 order-co 就能 require 到

或者参考官方文档: https://uniapp.dcloud.net.cn/uniCloud/uni-pay

## 事项 4 (M4 启动前可选): 配置微信支付商户号

uni-pay 需要商户号配置 (在 `uni-config-center` 下, 类似 uni-id 的配置方式). 涉及:
- 微信公众号 / 小程序 AppID (`wxbc1260ebbefc26f6`)
- 微信支付商户号
- API 密钥 v2 / v3

这块属于 M4 上线审核流程, 不阻塞 M3 代码完成.

## 事项 5 (开发体验): 把 Codex 沙箱里的 workaround 应用到真机

`sandbox` 里手动 symlink `@dcloudio/uni-app` 的操作 (`.claude/memory/known-issues.md` 问题 3) 在真机上**不需要**, `pnpm install` 能正常装.

## 状态检查清单

- [x] M3 代码全部 commit (`1d6fcb1` 起 HEAD 倒序 6 个 commit)
- [x] `vue-tsc --noEmit` my code 0 错误 (含 `@dcloudio/uni-app` 手动 symlink 后)
- [ ] **TODO** 修正/确认 `src/pages/product/detail.vue` 当前未提交修改
- [ ] **TODO** 真机 `pnpm install` 成功 (sandbox 跑不动)
- [ ] **TODO** 真机 `pnpm run build:mp-weixin` 成功
- [ ] **TODO** 云函数部署到 mp-c3e590c7-... 服务空间
- [ ] **TODO** 跑一遍订单完整流程 (发布 -> 下单 -> 支付 -> 发货/自提 -> 确认 -> 评价)
- [ ] **TODO** `../SchoolBuzzDocs/PROGRESS.md` 同步 M3 完成状态

完成后开 M4 (审核 + 提审 + 性能优化).

## 不在 M3 范围内 (M4/M5 才做)

- ❌ 私信 / IM 模块 (订单详情里"联系"按钮目前是 toast 占位)
- ❌ 真实支付以外的支付通道 (目前只对接微信)
- ❌ 评价回复功能 (卖家不能回复买家评价)
- ❌ 评价点赞 / 排序切换
- ❌ 商品分享海报 / 二维码
- ❌ 退款流程 (status=5 预留)

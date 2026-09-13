# 待办 (更新: 2026-09-13)

> 旧的 2026-07-05 版本已作废(内容全是 E: 路径和已完成的项)。当前状态一律以 `git status --short` + 本文件为准。

## 🚧 阻塞中: 让云端调用真正跑起来 (这是 M3 真机闭环的唯一前置)

**背景**: 2026-09-13 首次真机运行暴露 3 个阻断缺陷, 详见 `known-issues.md#33`。其中通道错配与 token 透传已由 Claude 修好, 剩下两步必须人工执行。

1. **[用户] 在 HBuilderX 插件市场安装 `uni-id-pages`**
   - 目的: 拿到官方 `uni-id-co` 云对象 + 它依赖的 5 个公共模块(`uni-id-common` / `uni-captcha` / `uni-cloud-s2s` / `uni-open-bridge-common` / `uni-config-center`)
   - **为什么只能走插件市场**: 除 `uni-id-co` 本体外, 上述公共模块**都不在 npm**(2026-09-13 逐个查证, 全是 404)
   - 装进项目目录: `\\wsl.localhost\Ubuntu-24.04\home\SchoolBuzzProjects\SchoolBuzzMate-Uniapp`

2. **[Claude] 插件装好后的收尾**
   - 把 5 个公共模块 + `uni-id-co` 从 `uni_modules/` 迁到 `uniCloud-aliyun/cloudfunctions/`(保持 CLI 工作流自洽), 并修正它们 `package.json` 里的相对依赖路径
   - 改 `common/auth.js`: 用 `uni-id-common` 的 `createInstance` + `checkToken(event.uniIdToken)` 替换虚构的 `context.UNIID_USER`; 同步改 6 个云函数里所有 `context.UNIID_USER?._id`(这是唯一"正确且真实"的取当前用户方式)
   - 剥离 `uni-id-pages` 自带的登录页面/`pages.json` 配置(项目用自己的 `pages-core/login`)

3. **[用户] 重传云函数** — HBuilderX 里右键 `uniCloud-aliyun` → 「上传所有云函数」
   - **必须重传**: 6 个文件已从 `index.obj.js` 改名 `index.js`(云对象 → 云函数), 云端还是旧形态
   - 若提示同名冲突, 先在 uniCloud 控制台删掉旧的 `product-co` 等条目再传

## 📌 已定位、未开工

4. **[用户] 凭证轮换(安全, 优先级高)** — 仓库是 **public**, 已提交 `uni-id/config.json` 的 `tokenSecret`(可伪造任意用户 token = 登录绕过)/ 微信小程序 appsecret / `passwordSecret`, 以及 `src/manifest.json` 的 uniCloud `clientSecret`。控制台轮换后由 Claude 改成环境变量注入。
5. **[Claude] 加配置门控的 dev `mockPay`** — 让"发货→确认→评价→信用分"链路在真机扫码受限时可测(默认关闭, 上线前确认关闭)。
6. **[Claude] 修 `[unocss] failed to load icon "carbon"`** — 5 个图标都在 carbon 集合里, 是 preset 配置问题; 症状是登录页 logo 可能空白。纯外观。
7. **[用户] 退役 E: 旧副本** (`E:\NJTS-Codeprojects-2023\WechatMiniproject\SchoolBuzzUniAPP`)
   - 审计结论(2026-09-13): git 内容 **100% 冗余**(0 个 E: 独有跟踪文件, 无未推送 commit, 无 stash, 工作区 clean) ⇒ **可安全删除**
   - 唯一硬资产 `uni-config-center/uni-pay/config.json`(微信支付商户配置) **已抢救回真相树**
   - Claude 不在未经确认的情况下删用户 Windows 上的目录, 请自行确认后删除

## 🚀 M4 上线物料

- [x] 微信支付商户配置 — 已在 `uni-config-center/uni-pay/config.json`(已 gitignore, 已从 E: 抢救)
- [ ] 小程序类目资质 / 用户协议 / 隐私协议
- [ ] 提审 + 性能优化 + 监控

## ⏭️ 不在当前范围 (M4/M5)

- 私信/IM、评价回复、评价点赞排序、商品分享海报、退款流程(status=5 预留)

# M3 真机部署细节 (2026-07-07)

## 真机验证发现 + 修复 (commit 71c214f / 17b67f9 / 0de6226)

### type-check 10 错误归类

| 类别 | 文件 | 修复 |
|------|------|------|
| lifecycle import 缺失 | index.vue (home) | `import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'` |
| template 里 `uni.X` 调用 | search.vue, user/index.vue, user/settings.vue | 改函数包装 (Vue3 template 不暴露 uni 全局) |
| `uni.login` 解构错误 | store/user.ts:25 | `uni.login` 返回 `Promise<LoginRes>`, 不是 tuple |
| pinia persist API 错 | store/user.ts:105, store/school.ts:55 | v3.2.1 用 `paths` 不是 `pick` (v4+ 才换 pick) |

### build:mp-weixin 失败归类

| 类别 | 文件 | 修复 |
|------|------|------|
| `@unocss/preset-icons` 缺失 | package.json | `pnpm add -D @unocss/preset-icons@66.0.0` (对齐 unocss 66.0.0, 不要 66.7.4) |
| SCSS 嵌套 | favorites.vue:107 | `.load-more { .hint {} }` → 平铺两个选择器 |
| icon 类名错 | login/index.vue:61, user/index.vue:109+114 | `i-carbon-wechat-filled`→`i-carbon-chat`, `i-carbon-baggage`→`i-carbon-shopping-bag` |

### 残留 icon warn

`failed to load icon "carbon"` 警告无害——产物 wxss 里 26 个 icon 全部生成 SVG mask。warn 来自 UnoCSS 默认 collection 自动发现机制在某个未使用类名上误报, 不影响 build。

## uni-pay 公共模块安装步骤

1. `cd uniCloud-aliyun/cloudfunctions/common && mkdir _unipay_tmp && cd _unipay_tmp`
2. `npm pack @dcloudio/unipay@1.0.25` → `dcloudio-unipay-1.0.25.tgz`
3. `tar -xzf dcloudio-unipay-1.0.25.tgz`
4. `cp -r package/* ../uni-pay/` (注意: cp 不删 _unipay_tmp, 沙箱持有它)
5. 改 `../uni-pay/package.json`: `name: "@dcloudio/unipay"` → `name: "uni-pay"` (order-co `require('uni-pay')` 路径依赖)

⚠️ 不需要 npm install, common/ 模块不走 npm

## 微信支付 v3 凭证配置

路径: `uniCloud-aliyun/cloudfunctions/common/uni-config-center/uni-pay/config.json`
```json
{
  "wxpay": {
    "appId": "<小程序 AppID>",
    "mchId": "<商户号>",
    "keyV3": "<API v3 密钥>",
    "publicKey": { "id": "<公钥ID>" }
  }
}
```

`.gitignore` 加 `uniCloud-aliyun/cloudfunctions/common/uni-config-center/uni-pay/config.json` 保护。

## HBuilderX CLI 项目名硬阻塞 (DCloud 架构限制)

`cli cloud functions --upload --prj <name>` 不接受任何项目标识:
- ❌ 项目名 (SchoolBuzzUniappV1 / schoolbuzz-mate / 校趣闪搭)
- ❌ AppID (__UNI__8802791)
- ❌ 路径 (E:/NJTS-Codeprojects-.../SchoolBuzzUniAPP)
- ❌ 工作空间 GUID ({bad498ac-...})
- ❌ 编号 (0/1)

**根因**: HBuilderX CLI 通过 IPC 调 GUI 主进程, GUI 工作空间未注册本项目 (用户没在 GUI 里 "文件→打开目录")。即使 HBuilderX.exe 启动了, unicloud 插件激活了, 没注册的项目名 CLI 不认识。

**唯一解**: 用户在 HBuilderX GUI 里一次性操作:
1. 文件 → 打开目录 → 选 SchoolBuzzUniAPP 路径
2. 右键 uniCloud-aliyun/ → 关联云服务空间 → 选 mp-c3e590c7-...
3. 保持 HBuilderX 跑着

之后 `cli cloud functions --list space --prj ...` 探测出真实项目名, 我用 CLI 全程自动部署。

## CLI 命令模板 (用户 GUI 操作后我会用)

```powershell
# 上传所有云函数 (含 common/uni-pay/)
& "E:\HbuilderX\HBuilderX\cli.exe" cloud functions --upload allcloudfunctions --prj <真实项目名> --provider aliyun

# 上传某个云函数
& "E:\HbuilderX\HBuilderX\cli.exe" cloud functions --upload cloudfunction --prj <项目> --provider aliyun --name order-co

# 上传 DB Schema
& "E:\HbuilderX\HBuilderX\cli.exe" cloud functions --upload db --prj <项目> --provider aliyun --name products

# 微信开发者工具上传体验版
& "E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat" upload `
  --project "E:\NJTS-Codeprojects-2023\WechatMiniproject\SchoolBuzzUniAPP\dist\build\mp-weixin" `
  --appid wxbc1260ebbefc26f6 `
  --version "0.1.0" --desc "M3 完整闭环发布"
```

## 待办 (用户 GUI 一次性操作后)

- [ ] Phase 5: 部署 8 个云函数 (auth-co 通过 common 共享, 单独 7 个 co: user/school/product/order/favorites/comment + common/uni-pay)
- [ ] Phase 6: 部署所有 DB Schema (products, orders, favorites, product_likes, school_users, schools, comments)
- [ ] Phase 7: 上传 mp-weixin 体验版 (Phase 2 产物 dist/build/mp-weixin)
- [ ] Phase 8: 真机 e2e 冒烟 (发布 → 下单 → 微信支付 → 发货 → 确认 → 评价)

## 跨项目参考

- 模板参考: `E:\NJTS-Codeprojects-2023\WechatMiniproject\yudao-ui-admin-uniapp-2026.05\` (用户提到, 未读取)
- 微信开发者工具 CLI 文档: https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
- HBuilderX CLI 文档: https://hx.dcloud.net.cn/cli/
- uniCloud 文档: https://doc.dcloud.net.cn/uniCloud/uni-im.html
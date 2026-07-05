# Changelog

## M3 - 交易核心 (2026-07-03 ~ 2026-07-05) ✅

### Step 1: 修复 type-check 错误 (commit 43e1dc2)
- OrderDetail 改为包装类型 { order: OrderBase, role, buyer, seller, address?, status_log[] }
- 新增 OrderPartyInfo + ProductDetailResult 包装类型
- api/product.ts 改 getProductDetail 返回 ProductDetailResult
- list.vue 'sell' typo 修成 'seller'
- tsconfig.json 去掉不存在的 @uni-helper/uni-types
- 验证: `npx vue-tsc --noEmit` my code 0 错误

### Step 2: 部署脚本 (commit 89f213f)
- scripts/deploy-cloud.ps1: 一键部署云函数 + DB schema
- package.json 加 deploy:cloud / deploy:cloud:order npm scripts

### Step 3-5: 接入支付 + 超时清理 + 信用分 (commit d5d677e)
- order-co.package.json 加 uni-pay 依赖
- order-co.pay 改为调 uniPay.createOrder 拿到 prepay, 返回给前端
- 新增 order-co.payNotify: 微信回调 -> 校验签名 -> 订单 0->1
- 新增 order-co.timeoutScan: 扫 status=0 且 create_date<24h 的订单置 4
- order-co.package.json 加 timer trigger (每小时整点)
- 信用分调整: confirm 双方 +1, cancel 发起方 -2, timeoutScan 超时方 -1
- order/detail.vue: pay 调 uniPay.requestPayment, status=3 加 '去评价' 按钮

### Step 6: 评价系统 (commit 08eadfe)
- comments.schema.json: 评价表 (rating/content/tags/anonymous/create_date)
- comment-co 云函数: create / getByProduct / getBySeller (匿名评价对非本人显示匿名)
- src/types/comment.ts + src/api/comment.ts
- pages/order/comment/index.vue: 5 星打分 + 5 个推荐标签 + 文字评价 + 匿名开关
- product/detail.vue: 加载时非阻塞拉前 5 条评价, 替换占位符为真实列表

### Step 7: E2E 测试脚本 (commit 13f849c)
- scripts/e2e-check.ps1: 类型检查 -> 编译 -> 部署云函数 -> 部署 schema -> 打印测试用例清单
- package.json 加 e2e:check / e2e:full npm scripts
- 注: Codex sandbox 限制 (esbuild spawn EPERM) 不能直接 build, 需 Windows 原生 shell 执行

### 已部署的云函数
| 云函数 | 用途 | 状态 |
|--------|------|------|
| user-co | 用户资料/认证/统计 | M1 已部署 |
| school-co | 学校列表/统计 | M1 已部署 |
| product-co | 商品 CRUD + 搜索 + 点赞 + 上下架 | M2 已部署 |
| order-co | 订单生命周期 (create/getList/getDetail/pay/cancel/ship/confirm/payNotify/timeoutScan) | **M3 待部署** |
| favorites-co | 商品收藏 (toggle/getList/checkBatch) | M3 待部署 |
| comment-co | 评价系统 (create/getByProduct/getBySeller) | **M3 待部署** |

### DB schema 清单
| Schema | 用途 | M2 已有 | M3 新增 |
|--------|------|---------|--------|
| school_users | 学校扩展用户 | ✓ | |
| schools | 学校 | ✓ | |
| products | 商品 | ✓ | |
| orders | 订单 | ✓ | |
| product_likes | 点赞 | ✓ (后补) | |
| favorites | 收藏 | ✓ (后补) | |
| comments | 评价 | | ✓ |

### 待用户操作
- [ ] 在 Windows 原生 PowerShell 跑 `pnpm e2e:check` 触发编译 + 部署
- [ ] 在 HBuilderX 中打开本项目 -> 右键 uniCloud-aliyun -> 关联云服务空间 -> 上传所有云函数
- [ ] 同步 ../SchoolBuzzDocs/PROGRESS.md 标记 M3 ✅ + 计划 M4
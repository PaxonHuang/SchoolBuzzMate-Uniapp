# M3 交易核心细节 (commit d5d677e + 08eadfe, 2026-07-05)

## 订单状态机

```
0 待支付 --pay--> 1 待发货 (快递) / 1 待自提
                       ├─ship(快递)--> 2 待收货 --confirm--> 3 已完成
                       └─confirm(自提, B已付款)--> 3 已完成
0/1 --cancel--> 4 已取消
5 退款后 (预留, 暂未使用)
```

## 订单 schema (`orders`)

- `order_no` 格式: `SJ + yyyyMMddHHmmss + 6位随机` (M3 在 `order-co/index.obj.js` 顶部的 `genOrderNo()`)
- `product_snapshot`: 下单时锁定的 `{title, price, original_price, images, category, condition, trade_method[]}`
- `status_log[]`: 每次状态变更追加 `{status, operator_id, operator_role, time, note}`
- `address?`: 仅 express 模式有
- `trade_method`: 单值 (`self_pickup` / `express`), **不是** 数组 (跟 product 的 trade_method 数组不同!)

## order-co 云函数 actions (M3)

| action | 角色 | 说明 |
|--------|------|------|
| `getList` | 买家/卖家 | role + status 过滤, 带对方 user 信息 |
| `getDetail` | 买家/卖家 | 单订单 + 对方 user + status_log + 当前用户角色 |
| `create` | 买家 | 锁商品快照, 防商品改后订单错位 |
| `pay` | 买家 | **uni-pay**: `uniPay.createOrder` → 返回 prepay 给前端 |
| `payNotify` | (system) | uni-pay 自动回调: 0→1, 幂等 |
| `cancel` | 买家/卖家 | 0/1→4, 信用分 -2 (发起方) |
| `ship` | 卖家 | 1→2 (仅 express) |
| `confirm` | 买家 | 1(自提)/2(快递) → 3, 商品置已售, 双方信用各 +1 |
| `timeoutScan` | (scheduled) | 扫 status=0 + create_date<24h → 4, 买家 -1 |

### 关键实现要点

- **pay + payNotify 配合**: pay() 内部调 `uniPay.createOrder({provider: "wxpay", totalFee, outTradeNo: order.order_no, subject, body, openid, notifyUrl: "/order-co/payNotify", custom: {order_id, buyer_id}})`. payNotify 通过 `custom.order_id` 反向关联订单
- **幂等**: payNotify 看到 status !== 0 直接返回 `{errcode: 0, errmsg: "OK"}` 给微信, 避免重复回调
- **超时扫描**: `package.json` 的 `triggers` 配 `[{name: "timeoutScan", type: "timer", config: "0 0 * * * *"}]` (每小时整点). timeoutScan action 内部不需要登录态 (`context.UNIID_USER` 为 null)
- **信用分助手**: 文件顶部 `adjustCredit(schoolUserId, delta)` 调 `db.collection('school_users').doc(id).update({credit_score: dbCmd.inc(delta)})`. clamp 由 schema 兜底 (建议 schema 加 min:0 max:150)

## uni-pay 集成

`order-co/package.json`:
```json
{
  "dependencies": { "uni-pay": "file:../common/uni-pay" },
  "extensions": { "uni-cloud-jql": {}, "uni-pay-notify": {} }
}
```

⚠️ `uni-pay` 公共模块当前**未在 common/ 下安装** (这是 sandbox 限制, 真机部署前要先 `npm install uni-pay-aliyun` 到 `common/uni-pay/` 目录)。代码逻辑已就绪, 部署时补这块。

前端调用:
```ts
// order/detail.vue
const r: any = await payOrder(orderId)  // 调云函数
const uniPay = require('uni-pay')      // 前端 SDK
await uniPay.requestPayment(r.provider, r.orderInfo)  // 唤起微信支付
```

## 评价系统 (`comment-co`)

actions:
- `create`: 校验 order.status=3 (已完成), 一单一评, 同步 product.comment_count++
- `getByProduct`: 商品页用, 前端一次性拉前 5 条嵌入详情页
- `getBySeller`: 卖家主页用

匿名评价: `anonymous: true` 时, 其他人查看显示"匿名用户", 本人看自己正常

评价字段 (comment-co.create 入参):
```ts
{
  order_id: string
  rating: 1-5
  content?: string (max 500)
  tags?: string[] (e.g. ['描述相符', '价格合理'])
  anonymous?: boolean
}
```

## 收藏系统 (`favorites-co`)

actions:
- `toggle`: 存在则删除, 不存在则新增 (返回 is_favorited + favorite_count)
- `getList`: 当前用户收藏列表 (带商品快照)
- `checkBatch`: 批量检查 product_ids 哪些已收藏 (用于列表页打红心)

收藏和点赞 (`product_likes`) 是**两张独立的表**! 不要合并.

## 商品详情页集成 (M3 改动)

`src/pages/product/detail.vue`:
- 加了 import: `getCommentsByProduct` from `@/api/comment`
- 加了 `commentList` ref, loadDetail 时非阻塞加载
- 下单流程用底部弹出 sheet (trade_method 单/多选项 + 快递地址表单)
- "立即购买" 按钮 (非卖家可见), 卖家显示 "下架商品 / 重新上架"

## 订单状态流转 UI 按钮 (order/detail.vue)

`actionBtns` computed 根据 (role, status, trade_method) 算出要显示的按钮:
- 买家 0 → [取消订单, 立即支付]
- 买家 1 自提 → [取消订单, 确认完成]
- 买家 2 → [确认收货]
- 买家 3 → [去评价]
- 卖家 1 快递 → [已发货, 同意取消]
- 卖家 1 自提 → [同意取消]

每条按钮有 `action` 字符串, 在 `doAction(act)` 集中分发. pay 走 uni-pay, 其他直接调云函数.

## 待办 (M3 收尾)

- [ ] 部署到 UniCloud 后, 在 common/uni-pay/ 装 uni-pay 包 (M3 代码层完成)
- [ ] 真实跑一遍 e2e: `pnpm e2e:check` (在 Windows 原生 PowerShell, sandbox 跑不了)
- [ ] uni-id 配置需要 `wx_openid` 注入到 context.UNIID_USER (现有 user-co 登录流程是否已包含)
- [ ] uni-pay 商家号 / 微信支付商户号需要配置 (uni-pay-config-center)
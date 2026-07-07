# M3 端到端冒烟测试清单

> 部署完成后, 在真机/模拟器走一遍完整流程验证 M3 闭环.

## 前置条件

- [x] 云函数已部署 (order-co / favorites-co / comment-co / product-co / user-co / school-co + common/uni-pay/)
- [x] DB Schema 已上传 (products / orders / favorites / product_likes / school_users / schools / comments)
- [x] 小程序体验版已上传 (AppID: wxbc1260ebbefc26f6, 版本: 0.1.0)
- [x] 微信支付 v3 凭证已配 (商户号: 1105975366)

## 测试环境

- **手机**: 微信扫码体验版 (体验版需要在微信公众平台 → 成员管理 → 体验成员添加微信号)
- **开发机**: 本地 PowerShell, `pnpm dev:mp-weixin` 实时编译

## 测试流程 (按顺序)

### 0. 准备: 2 个测试账号
需要 2 个学生认证账号 (A 卖家 + B 买家):
1. 用微信 A 扫码 → 校趣闪搭 → 微信一键登录 → 提交学生认证 (学号 + 学院 + 学生证)
2. 用微信 B 重复同样操作
3. 等待 A 完成学生认证, 在 HBuilderX → UniCloud Web Console → 校趣闪搭 → school_users → 手动把 A 的 is_verified 改成 true (admin 审核阶段)
4. B 同理

### 1. 发布商品 (卖家 A)
- [ ] A 进入首页 → 底部 FAB "发布" 按钮
- [ ] 填: 标题, 描述, 价格 ¥10, 分类, 成色, 交易方式 (快递 + 自提都选)
- [ ] 上传至少 1 张图片
- [ ] 提交 → 看到商品在首页列表出现
- [ ] 期望: 商品 status=1, 在 HBuilderX → UniCloud → products 集合看到

### 2. 浏览 + 搜索 (买家 B)
- [ ] B 进入首页 → 看到 A 发布的商品
- [ ] 按分类筛选 → 商品过滤正确
- [ ] 点搜索 → 关键字匹配 (如"测试") → 搜到商品
- [ ] 下拉刷新 → 列表刷新
- [ ] 上拉加载 → 加载更多 (准备至少 11 个商品测试分页)

### 3. 商品详情 + 评论列表 (买家 B)
- [ ] 点商品 → 详情页
- [ ] 图片轮播 + 缩略图 (uni-app swiper)
- [ ] 显示卖家昵称 + 学校 + 信用分 100
- [ ] 期望: 评价列表 (暂无, 状态空) - 此时还没评论

### 4. 收藏 (买家 B)
- [ ] 详情页点"收藏"按钮
- [ ] 提示"已收藏"
- [ ] 我的 → 我的收藏 → 看到商品
- [ ] 取消收藏 → 列表移除

### 5. 下单 (买家 B)
- [ ] 详情页点"立即购买" (卖家自己看到的是"下架商品")
- [ ] 弹出 sheet: 选交易方式 (自提/快递)
- [ ] 选快递 → 填收货地址 → 提交
- [ ] 看到订单创建成功 → 跳到订单详情
- [ ] 期望: order-co.create 返回成功, orders 集合新增 status=0 记录

### 6. 微信支付 (买家 B)
- [ ] 订单详情点"立即支付"
- [ ] 唤起微信支付 (uniPay.requestPayment) - 选 v3 凭证配置的商户
- [ ] 完成支付 (可以用 0.01 元测试)
- [ ] 支付成功后订单 status 变 1 (待发货)
- [ ] 期望: payNotify 回调成功, uni-pay-orders 集合有支付记录, orders.paid_at 有时间

### 7. 发货 (卖家 A)
- [ ] A 的"我卖出的" → 看到 B 的订单 status=1
- [ ] 点"已发货" (快递模式)
- [ ] 订单 status 变 2 (待收货)
- [ ] 期望: orders.shipped_at 有时间

### 8. 确认收货 (买家 B)
- [ ] B 的"我买到的" → 看到订单 status=2
- [ ] 点"确认收货"
- [ ] 订单 status 变 3 (已完成)
- [ ] 商品 status 变 2 (已售)
- [ ] A 和 B 双方信用分 +1 (变 101)
- [ ] 期望: school_users.credit_score 双方都加 1

### 9. 评价 (买家 B)
- [ ] 已完成订单 → 点"去评价"
- [ ] 评分 (1-5 星), 写内容, 选标签
- [ ] 提交 → 评价成功
- [ ] 回到商品详情 → 看到 B 的评价
- [ ] 期望: comments 集合新增, products.comment_count +1

### 10. 取消订单 (边界测试)
- [ ] 重新下个单 (B 买 A 的另一个商品)
- [ ] 待支付状态点"取消订单" → status=4
- [ ] B 信用分 -2 (变 99)
- [ ] 期望: orders.cancelled_at 有时间, school_users.credit_score 减 2

### 11. 超时取消 (边界测试)
- [ ] 重新下个单 (B 买 A 商品)
- [ ] 不支付, 等 24 小时
- [ ] 定时任务 timeoutScan 跑 (每小时整点) → 订单自动 status=4
- [ ] B 信用分 -1 (变 98, 比主动取消轻)
- [ ] 期望: cloudfunction-config.triggers 配的 `0 0 * * * *` 跑成功

### 12. 收藏卖家主页 (可选)
- [ ] 卖家 A 的商品页 → 看到 A 的头像/昵称/学校/信用分
- [ ] 期望: comment-co.getBySeller 也可拿到 A 的评价列表

## 验证工具

### HBuilderX UniCloud Web Console
- https://unicloud.dcloud.net.cn
- 选服务空间 `mp-c3e590c7-e8f1-4877-95c5-346ba36e296c`
- 看各集合数据: products / orders / favorites / school_users / comments

### 微信支付商户平台
- https://pay.weixin.qq.com
- 商户号: 1105975366
- 交易流水 → 看测试订单的入账

### 微信开发者工具 IDE
- 工具栏 "调试器" → Network 面板
- 看 `uniCloud.callFunction` 请求, 返回 0 错误
- Console 看 `console.error` 没异常

## 已知限制 (M3 范围内, 不做)

- ❌ 私信/IM (订单详情"联系卖家"是 toast 占位)
- ❌ 退款 (status=5 预留, 未实现)
- ❌ 评价回复 (卖家不能回复)
- ❌ 评价点赞/排序
- ❌ 商品分享海报/二维码
- ❌ 信用分可视化图表
- ❌ 推送通知

## 报告

测试完成后, 把以下信息贴回:
1. 哪个步骤失败
2. 失败时的 console 截图 (微信开发者工具)
3. 失败的云函数调用日志 (UniCloud Web Console → 云函数 → 日志)
4. 失败时的 Network 请求/响应 (微信开发者工具 → Network)

我会根据日志定位问题并修复.
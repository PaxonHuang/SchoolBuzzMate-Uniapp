# SchoolBuzzMate 完整改造升级 SOP-SPEC-PLAN

> **项目名称：** SchoolBuzzMate（校趣闪搭）- 校园社交交易平台  
> **技术基座：** yudao-mall-uniapp（前端复用） + UniCloud（MVP后端） → Spring Boot/Cloud（成熟期）  
> **文档版本：** v2.0  
> **创建日期：** 2026-06-03  
> **适用环境：** Windows 11 + HBuilderX + 微信开发者工具  

---

## 📋 目录

- [1. 决策依据与仓库对比](#1-决策依据与仓库对比)
- [2. 技术架构设计](#2-技术架构设计)
- [3. 改造策略：yudao-mall-uniapp → SchoolBuzzMate](#3-改造策略)
- [4. 分阶段实施计划](#4-分阶段实施计划)
- [5. 标准作业流程 SOP](#5-标准作业流程-sop)
- [6. 技术规范 SPEC](#6-技术规范-spec)
- [7. CLI 工具链集成](#7-cli-工具链集成)
- [8. Claude Code 自动化增强](#8-claude-code-自动化增强)
- [9. 质量保证体系](#9-质量保证体系)
- [10. 风险管理](#10-风险管理)
- [11. 里程碑与交付物](#11-里程碑与交付物)

---

## 1. 决策依据与仓库对比

### 1.1 候选仓库分析

**核心矛盾：没有任何开源仓库同时支持 UniCloud + Spring Boot 双架构。**

| 仓库 | Stars | 技术栈 | 电商功能 | UniCloud | SpringBoot | 协议 | 推荐度 |
|------|-------|--------|---------|-----------|------------|------|--------|
| **yudao-mall-uniapp** | 1.2k | Vue3+JS+Vite5 | ⭐⭐⭐⭐⭐ | ❌ | ✅ | MIT | 🥇 **首选** |
| JeecgUniapp | 1.6k | Vue3+TS+Pinia | ❌ | ❌ | ❌ | Apache | 🥈 参考 |
| yudao-ui-admin-uniapp | 315 | Vue3+TS+Vite5+Pinia | ❌ | ❌ | ✅ | MIT | 参考 |
| mall4j | 5.1k | SB4+Vue3 | ⭐⭐⭐⭐ | ❌ | ✅ | AGPL | ⚠️ 协议 |
| Vue.NetCore | 4.2k | .NET+Vue | ❌ | ❌ | ❌ | - | ❌ |
| uni-app官方 | 40k+ | Vue2/Vue3/UTS | ❌ | ✅ | ❌ | Apache | ✅ 框架 |

### 1.2 选型理由 — yudao-mall-uniapp

**为什么选择 yudao-mall-uniapp：**

1. **最完整的电商前端** — 商品/订单/购物车/支付/优惠券/积分/秒杀/拼团/分销/直播，覆盖校园交易 80% 场景
2. **MIT 协议** — 永久开源、无商业版、二次开发无法律风险
3. **双后端架构** — 既支持 Spring Boot 单体也支持 Spring Cloud 微服务，与你后期规划完全匹配
4. **活跃维护** — 2026.05 最新版，877 commits，持续迭代
5. **改造可行** — 前端页面可直接复用，后端 API 接口可对等翻译为 UniCloud 云函数

**为什么不是 mall4j：**
- AGPL-3.0 协议商业需授权，与你的盈利目标冲突
- 同样不支持 UniCloud，无改造优势
- 前端不如 yudao-mall-uniapp 丰富

**为什么不是 JeecgUniapp：**
- 无电商功能，从零开发成本过高
- 与 JeecgBoot 后端强绑定

**但需要参考 JeecgUniapp + yudao-ui-admin-uniapp 的现代化工程实践：**
- TypeScript 类型系统
- Pinia 状态管理
- UnoCSS 原子化CSS
- ESLint + Prettier + Husky 代码规范
- 更优雅的目录结构

### 1.3 核心改造策略

```
┌──────────────────────────────────────────────────────┐
│              yudao-mall-uniapp 前端                   │
│  ┌────────────┐ ┌──────────┐ ┌───────────────────┐  │
│  │ 页面模板   │ │ 业务组件  │ │ 工具函数/Hooks    │  │
│  │ (pages/)  │ │(components)│ │ (utils/hooks/)    │  │
│  └─────┬──────┘ └────┬─────┘ └────────┬──────────┘  │
│        │              │                │              │
│        ▼              ▼                ▼              │
│  ✅ 复用           ✅ 复用           🔧 改造         │
│  (改造API层)      (改造API层)       (JS→TS)        │
│        │              │                │              │
│        └──────────────┴────────────────┘              │
│                       │                               │
│                       ▼                               │
│         ┌─────────────────────────┐                   │
│         │  统一 API 接口层 (改造)  │                   │
│         │  MVP: UniCloud 云函数    │                   │
│         │  后期: Spring Boot       │                   │
│         │  接口签名保持一致！       │                   │
│         └─────────────────────────┘                   │
└──────────────────────────────────────────────────────┘
```

**关键原则：API 接口层抽象** — 前端不直接依赖 UniCloud 或 Spring Boot，而是通过统一的 service 层调用。切换后端时只需替换 service 实现，页面组件零改动。

---

## 2. 技术架构设计

### 2.1 总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端展示层 (yudao-mall-uniapp 改造)        │
│  UniApp (Vue3 + TypeScript + Vite5 + Pinia + UnoCSS)       │
│  ├─ 微信小程序 (主)  ├─ H5  ├─ APP (后期)                  │
│  └─ wot-design-uni + 自定义校园主题组件                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   统一 API 接口抽象层   │
              │   src/api/ (service)   │
              │   与后端无关的接口定义   │
              └───────┬───────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────────┐
│  MVP: UniCloud    │    │  成熟期: Spring Boot  │
│  ├─ uni-id (认证)  │    │  ├─ Sa-Token (认证)   │
│  ├─ uni-pay (支付) │    │  ├─ uni-pay 或微信支付 │
│  ├─ 云函数 (业务)  │    │  ├─ REST API (业务)   │
│  └─ 云数据库(Mongo)│    │  └─ MySQL + Redis     │
└──────────────────┘    └──────────────────────┘
```

### 2.2 MVP阶段技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | UniApp | 3.0.x | 跨平台，来自 yudao-mall-uniapp |
| 语言 | Vue3 + **TypeScript** | 3.4.x + 5.8.x | 🔧 从 JS 改造 |
| 构建工具 | Vite | 5.2.x | 来自 yudao-mall-uniapp |
| 状态管理 | **Pinia** | 2.0.x | 🔧 新增（原项目无） |
| UI组件 | wot-design-uni | 1.13.x | 新增 |
| CSS方案 | **UnoCSS** | 66.x | 🔧 新增（替换SCSS） |
| 云开发 | UniCloud + 阿里云 | 最新 | 🔧 新增（替代Java） |
| 认证 | uni-id | 最新 | 🔧 新增 |
| 支付 | uni-pay | 最新 | 🔧 新增 |
| 数据库 | UniCloud DB (MongoDB) | - | 🔧 新增 |
| 代码规范 | ESLint + Prettier + Husky | - | 🔧 从 JeecgUniapp 引入 |

### 2.3 后期技术栈（Spring Boot/Cloud）

| 层级 | 技术 | 说明 |
|------|------|------|
| 应用框架 | Spring Boot 3.x / Spring Cloud | 可选单体或微服务 |
| 认证授权 | Sa-Token | 轻量级，替换 uni-id |
| 数据库 | MySQL 8.0 | 主数据库 |
| 缓存 | Redis 7.0 + Redisson | 分布式缓存与锁 |
| ORM | MyBatisPlus 3.5+ | 增强MyBatis |
| 消息队列 | RocketMQ | 异步消息 |
| 对象存储 | 阿里云OSS | 图片/文件 |
| 监控 | Prometheus + Grafana | 性能监控 |
| API网关 | Spring Cloud Gateway | 统一网关（微服务模式） |

### 2.4 API 抽象层设计（核心！）

这是实现"前端无感切换后端"的关键设计：

```typescript
// src/api/product.ts — 产品服务接口抽象

import { http } from '@/utils/http'

// ========== MVP阶段: UniCloud 实现 ==========
// 通过 uniCloud.callFunction 调用云函数
export function getProductList(params: ProductListParams): Promise<ProductListResult> {
  return uniCloud.callFunction({
    name: 'product-co',
    data: { action: 'getList', params }
  }).then(res => res.result.data)
}

// ========== 后期: Spring Boot 实现 ==========
// export function getProductList(params: ProductListParams): Promise<ProductListResult> {
//   return http.get('/product-api/product/list', params)
// }

// ⚠️ 关键：函数签名和返回值类型完全一致！
// 切换后端时只需改 src/api/ 目录下的实现，页面零改动
```

**API 接口规范映射：**

| yudao-mall Java API | UniCloud 云函数 | 路径 |
|---------------------|----------------|------|
| `/product-api/product/page` | `product-co.getList` | GET → action:'getList' |
| `/product-api/product/get` | `product-co.getDetail` | GET → action:'getDetail' |
| `/product-api/product/create` | `product-co.create` | POST → action:'create' |
| `/trade-api/order/create` | `order-co.create` | POST → action:'create' |
| `/trade-api/order/page` | `order-co.getList` | GET → action:'getList' |
| `/pay-api/order/submit` | `payment-co.create` | POST → action:'create' |
| `/member-api/user/profile/get` | `user-co.getProfile` | GET → action:'getProfile' |
| `/promotion-api/coupon/page` | `marketing-co.getCoupons` | GET → action:'getCoupons' |
| `/promotion-api/point/get` | `marketing-co.getPoints` | GET → action:'getPoints' |

### 2.5 数据库设计

#### MVP — UniCloud (MongoDB)

基于 yudao-mall 的 MySQL 设计，转换为 MongoDB 文档模型：

**核心集合：**

```javascript
// 1. products — 商品（改造自 yudao-mall product_spu + product_sku）
{
  _id: ObjectId,
  seller_id: ObjectId,        // 卖家ID → uni-id-users._id
  school_id: ObjectId,         // 所属学校
  category_id: ObjectId,       // 分类ID
  title: String,               // 标题
  description: String,         // 描述（富文本）
  images: [String],            // 图片数组
  video_url: String,           // 视频链接
  // 价格 — 校园二手简化（无需复杂SKU）
  original_price: Number,      // 原价
  price: Number,               // 售价
  freight: Number,             // 运费（默认0，面交）
  // 库存 — 二手通常只有一件
  stock: Number,               // 库存（默认1）
  // 商品属性
  condition: String,           // 新旧程度: 'brand_new'|'like_new'|'used'|'old'
  tags: [String],              // 标签: ['教材','考研','计算机']
  // 交易方式
  trade_method: String,        // 'self_pickup'|'express'|'both'
  // 状态
  status: Number,              // 0下架 1上架 2已售 3审核中
  audit_reason: String,        // 审核不通过原因
  // 统计
  view_count: Number,          // 浏览量
  like_count: Number,          // 点赞数
  favorite_count: Number,      // 收藏数
  comment_count: Number,       // 评论数
  share_count: Number,         // 分享数
  // 时间
  create_date: Date,
  update_date: Date,
}

// 2. orders — 订单（改造自 yudao-mall trade_order）
{
  _id: ObjectId,
  order_no: String,            // 订单号: SB + yyyyMMdd + 6位随机
  buyer_id: ObjectId,          // 买家ID
  seller_id: ObjectId,         // 卖家ID
  product_id: ObjectId,       // 商品ID
  product_snapshot: {          // 商品快照（防止商品被修改后订单信息丢失）
    title: String,
    price: Number,
    images: [String],
  },
  amount: Number,              // 订单金额
  freight: Number,             // 运费
  discount_amount: Number,     // 优惠金额（优惠券）
  pay_amount: Number,          // 实付金额
  // 交易方式
  trade_method: String,        // 'self_pickup'|'express'
  address: {                   // 收货地址（仅快递）
    name: String,
    phone: String,
    province: String,
    city: String,
    district: String,
    detail: String,
  },
  // 状态流转
  status: Number,              // 0待支付 1待发货 2待收货 3已完成 4已取消 5退款中 6已退款
  cancel_reason: String,       // 取消原因
  // 支付信息
  pay_type: String,            // 'wechat_mini'|'wechat_h5'
  pay_time: Date,              // 支付时间
  payment_no: String,          // 支付流水号
  // 物流信息（可选，面交场景无物流）
  express_company: String,     // 快递公司
  express_no: String,          // 快递单号
  // 时间
  create_date: Date,
  pay_time: Date,
  delivery_time: Date,         // 发货时间
  receive_time: Date,          // 收货时间
  complete_time: Date,         // 完成时间
}

// 3. comments — 评论
{
  _id: ObjectId,
  product_id: ObjectId,
  order_id: ObjectId,          // 关联订单（确保交易后才能评价）
  user_id: ObjectId,           // 评论人
  content: String,             // 评论内容
  images: [String],            // 评论图片
  rating: Number,              // 评分 1-5
  parent_id: ObjectId,         // 父评论ID（回复）
  reply_count: Number,         // 回复数
  like_count: Number,          // 点赞数
  is_anonymous: Boolean,       // 是否匿名
  status: Number,              // 0隐藏 1显示
  create_date: Date,
}

// 4. favorites — 收藏
{
  _id: ObjectId,
  user_id: ObjectId,
  product_id: ObjectId,
  create_date: Date,
}

// 5. messages — 私信（聊天）
{
  _id: ObjectId,
  conversation_id: String,     // 会话ID: sort([userA_id, userB_id]).join('_')
  from_user_id: ObjectId,
  to_user_id: ObjectId,
  content: String,             // 消息内容
  content_type: String,        // 'text'|'image'|'product_card'
  extra: Object,               // 扩展数据（如product_card的商品信息）
  is_read: Boolean,
  create_date: Date,
}

// 6. coupons — 优惠券模板
{
  _id: ObjectId,
  name: String,                // 券名称
  type: Number,                // 1满减券 2折扣券
  discount_value: Number,      // 满减金额 或 折扣率(0.85=85折)
  min_amount: Number,          // 最低消费金额
  total_count: Number,         // 发放总量
  received_count: Number,      // 已领取
  used_count: Number,          // 已使用
  start_time: Date,
  end_time: Date,
  status: Number,              // 0禁用 1启用
  create_date: Date,
}

// 7. user_coupons — 用户优惠券
{
  _id: ObjectId,
  user_id: ObjectId,
  coupon_id: ObjectId,
  coupon_name: String,         // 冗余券名
  status: Number,              // 0未使用 1已使用 2已过期
  use_time: Date,
  use_order_id: ObjectId,     // 使用的订单
  create_date: Date,
}

// 8. points_log — 积分记录
{
  _id: ObjectId,
  user_id: ObjectId,
  points: Number,              // 积分变动（正=获得，负=消费）
  balance: Number,             // 变动后余额
  type: Number,                // 1注册 2签到 3交易 4评价 5分享 6系统
  description: String,
  ref_id: ObjectId,           // 关联业务ID
  create_date: Date,
}

// 9. groups — 拼团
{
  _id: ObjectId,
  product_id: ObjectId,
  group_size: Number,          // 成团人数
    joined_count: Number,       // 已参团人数
  discount_price: Number,      // 拼团价格
  start_time: Date,
  end_time: Date,             // 过期自动取消
  status: Number,              // 0进行中 1已成团 2已取消
  create_date: Date,
}

// 10. group_users — 拼团成员
{
  _id: ObjectId,
  group_id: ObjectId,
  user_id: ObjectId,
  order_id: ObjectId,          // 关联订单
  is_leader: Boolean,          // 是否团长
  create_date: Date,
}

// 11. follows — 关注
{
  _id: ObjectId,
  user_id: ObjectId,           // 关注者
  follow_user_id: ObjectId,   // 被关注者
  create_date: Date,
}

// 12. reports — 举报
{
  _id: ObjectId,
  reporter_id: ObjectId,       // 举报人
  target_type: String,         // 'product'|'comment'|'user'
  target_id: ObjectId,         // 被举报对象ID
  reason: String,              // 举报原因
  status: Number,              // 0待处理 1已处理 2驳回
  handle_result: String,       // 处理结果
  create_date: Date,
}
```

### 2.6 云函数设计

```
uniCloud-aliyun/cloudfunctions/
├─ uni-id-co/                 # uni-id 官方云函数（认证/用户管理）
├─ uni-pay-co/                # uni-pay 官方云函数（支付统一）
├─ uni-stat-receiver/         # uni统计（数据上报）
├─ product-co/                # 商品服务
│  └─ index.js
│     actions: getList, getDetail, create, update, delete,
│              search, like, audit, getMyList, getCategoryList
├─ order-co/                  # 订单服务
│  └─ index.js
│     actions: create, getList, getDetail, cancel, confirmReceive,
│              applyRefund, agreeRefund, getSellerOrderList
├─ payment-co/                # 支付服务
│  └─ index.js
│     actions: createPayment, paymentCallback, queryPayment, refund
├─ social-co/                 # 社交服务
│  └─ index.js
│     actions: createComment, getCommentList, likeComment,
│              toggleFavorite, getFavorites,
│              sendMessage, getConversations, getMessages,
│              toggleFollow, getFollowers, getFollowing
├─ marketing-co/              # 营销服务
│  └─ index.js
│     actions: getCoupons, receiveCoupon, useCoupon, getUserCoupons,
│              checkIn, getPointsLog, createGroup, joinGroup,
│              getGroupDetail, getGroupList
├─ school-co/                 # 校园服务
│  └─ index.js
│     actions: getSchoolList, verifyStudent, getSchoolStats,
│              getNearbyProducts
└─ admin-co/                  # 管理服务
   └─ index.js
      actions: getDashboard, auditProduct, manageUser,
              manageCoupon, getReportList, handleReport,
              getSystemConfig, updateSystemConfig
```

### 2.7 统一 API 接口层完整映射

```
src/api/
├─ index.ts                   # 统一导出 + 环境切换配置
├─ product.ts                 # 商品相关 API
├─ order.ts                   # 订单相关 API
├─ payment.ts                 # 支付相关 API
├─ user.ts                    # 用户相关 API
├─ social.ts                  # 社交相关 API
├─ marketing.ts               # 营销相关 API
├─ school.ts                  # 校园相关 API
├─ admin.ts                   # 管理相关 API
└─ upload.ts                  # 文件上传 API

# 环境切换配置 src/api/index.ts:
export const API_MODE: 'unicloud' | 'springboot' = 'unicloud'
# 切换为 'springboot' 后所有 api 方法自动切换到 REST 调用
```

---

## 3. 改造策略：yudao-mall-uniapp → SchoolBuzzMate

### 3.1 改造层次

```
Layer 1: 页面模板 — 复用 80%，改造 20%
  ├─ 商品列表/详情 ✅ 直接复用（B2C→C2C需调整字段名和展示逻辑）
  ├─ 购物车 ❌ 废弃（校园C2C二手无购物车，改为"收藏"）
  ├─ 订单/支付页 ✅ 复用（流程相同）
  ├─ 用户中心 ✅ 复用（调整字段）
  ├─ 优惠券/积分页 ✅ 复用
  ├─ 拼团/秒杀页 ✅ 复用
  └─ 新增：校园主页（学校切换）、学生认证、信用分展示

Layer 2: 业务组件 — 复用 70%，改造 30%
  ├─ ProductCard ✅ 复用（修改为C2C卡片样式）
  ├─ PriceDisplay ✅ 复用
  ├─ ImageUpload ✅ 复用
  ├─ AddressSelect 🔧 改为学校/宿舍楼选择
  ├─ PaymentSheet ✅ 复用（适配uni-pay）
  └─ 新增：StudentBadge（认证标识）、CreditScore（信用分）

Layer 3: 工具函数 — 复用 60%，改造 40%
  ├─ 日期格式化 ✅ 复用
  ├─ 价格计算 ✅ 复用
  ├─ 图片处理 ✅ 复用
  ├─ 请求封装 🔧 JS→TS + 适配UniCloud
  └─ 新增：校园专属工具（宿舍楼解析等）

Layer 4: API 层 — 重写 100%
  └─ 所有 API 从 Java REST 调用改为 UniCloud 云函数调用
     保留相同的函数签名和返回值类型

Layer 5: 数据模型 — 重写 100%
  └─ MySQL 关系模型 → MongoDB 文档模型
  └─ B2C SKU 体系 → C2C 简化体系
```

### 3.2 代码即策略 — 改造前后对比

**改造前（yudao-mall-uniapp）：**
```javascript
// pages/product/list.vue — 原始 JS 代码
import { getProductPage } from '@/api/mall/product'

const list = ref([])
function fetchList() {
  getProductPage({ pageNo: 1, pageSize: 10 }).then(res => {
    list.value = res.data.list
  })
}
```

**改造后（SchoolBuzzMate）：**
```typescript
// pages/product/list.vue — 改造后 TypeScript
<script setup lang="ts">
import { ref } from 'vue'
import { getProductList } from '@/api/product'
import type { Product, ProductListParams } from '@/types/product'

const list = ref<Product[]>([])
const loading = ref(false)

async function fetchList(params: ProductListParams) {
  loading.value = true
  try {
    const { list: items, total } = await getProductList(params)
    list.value = items
  } finally {
    loading.value = false
  }
}
</script>
```

### 3.3 B2C → C2C 核心差异

| 维度 | yudao-mall (B2C) | SchoolBuzzMate (C2C) | 改造策略 |
|------|-----------------|---------------------|----------|
| 商品发布 | 商家后台管理 | 学生直接发布 | 简化表单，去掉SKU |
| SKU 系统 | 复杂多规格 | 单品单件 | 废弃SKU模块 |
| 购物车 | 多商品加购 | 无购物车 | 改为"收藏+直接购买" |
| 支付 | 商家收款 | C2C担保交易 | uni-pay 适配 |
| 物流 | 快递发货 | 面交为主+快递可选 | 增加面交通知 |
| 评价体系 | 商品评价 | 买卖双方互评+信用分 | 新增信用分模块 |
| 用户体系 | 会员等级 | 学生认证+信用分 | 替换会员为学生认证 |
| 运营端 | 商家后台 | 系统管理后台 | 简化运营功能 |
| 学校隔离 | 无 | 按学校隔离数据 | 所有查询加 school_id |

---

## 4. 分阶段实施计划

### 阶段零：环境准备与仓库初始化（1周）

#### 4.0.1 目标
- 获取 yudao-mall-uniapp 源码并理解结构
- 搭建 UniCloud 开发环境
- 初始化 SchoolBuzzMate 新仓库
- 配置 CLI 工具链

#### 4.0.2 详细任务

**Day 1-2：源码获取与分析**
- [ ] Fork yudao-mall-uniapp 并 clone 到本地
- [ ] 运行 `pnpm install && pnpm run dev:h5` 验证可用
- [ ] 阅读源码结构（pages/、api/、components/、utils/）
- [ ] 梳理所有 API 接口清单（src/api/ 目录）
- [ ] 分析数据库表结构（通过 Java 实体类反推）

**Day 3-4：新仓库初始化**
- [ ] 创建 SchoolBuzzMate 新仓库
- [ ] 从 yudao-mall-uniapp 提取需要的文件
- [ ] 配置 TypeScript（参考 JeecgUniapp）
- [ ] 安装依赖：Pinia、UnoCSS、wot-design-uni
- [ ] 配置 ESLint + Prettier + Husky

**Day 5：UniCloud 环境配置**
- [ ] 注册 UniCloud 服务空间（阿里云开发者版）
- [ ] 在 HBuilderX 中关联云服务空间
- [ ] 创建 uniCloud-aliyun 目录结构
- [ ] 上传 uni-id-co、uni-pay-co 官方云函数
- [ ] 配置 uni-id（微信小程序登录）

**Day 6-7：工具链配置与验证**
- [ ] 配置 HBuilderX CLI 快捷命令
- [ ] 配置微信开发者工具 CLI
- [ ] 验证全链路：前端 → 云函数 → 数据库 → 微信小程序
- [ ] 提交初始代码并创建 develop 分支

### 阶段一：MVP 验证（6-8周）

#### 4.1.0 目标
- 完成校园二手交易核心流程
- 单所高校试点运行
- 验证商业模式

#### 4.1.1 P0 核心功能（第1-3周）

**第1周：用户系统**
| 功能 | 复用度 | 改造点 |
|------|--------|--------|
| 微信授权登录 | 60% | 改为 uni-id 集成 |
| 用户资料页 | 70% | 新增学校/学号/认证状态 |
| 学生认证 | 0% | 全新开发（上传学生证+审核） |
| 学校选择与切换 | 0% | 全新开发 |

**第2周：商品系统**
| 功能 | 复用度 | 改造点 |
|------|--------|--------|
| 商品发布 | 50% | 去掉SKU，增加新旧程度、面交/快递选择 |
| 商品列表 | 70% | 增加学校过滤、条件筛选改为C2C |
| 商品详情 | 60% | 卖家信息卡片、面交地点展示 |
| 商品搜索 | 80% | 增加学校范围限定 |

**第3周：交易核心**
| 功能 | 复用度 | 改造点 |
|------|--------|--------|
| 订单创建 | 60% | 简化流程（无购物车），适配uni-pay |
| 微信支付 | 40% | 改为uni-pay统一支付 |
| 订单管理 | 70% | 增加面交状态 |
| 订单详情 | 70% | 增加买卖双方信息 |

#### 4.1.2 P1 重要功能（第4-5周）

| 功能 | 复用度 | 改造点 |
|------|--------|--------|
| 商品收藏 | 80% | 直接复用 |
| 评论功能 | 60% | 增加买卖互评 |
| 个人中心 | 50% | 新增信用分、交易统计 |
| 基础消息通知 | 40% | uni_push 集成 |

#### 4.1.3 P2 可选功能（第6周）

| 功能 | 复用度 |
|------|--------|
| 积分签到 | 60% |
| 基础优惠券 | 70% |
| 分享功能 | 50% |

#### 4.1.4 第7-8周：测试与上线

- 第7周：功能测试、Bug修复、性能优化
- 第8周：微信小程序审核、上线试运行、收集反馈

### 阶段二：功能完善（3-6个月）

#### 4.2 功能清单

**营销功能（来自 yudao-mall，复用度高）**
- [ ] 积分商城（复用 80%）
- [ ] 优惠券体系（复用 85%）
- [ ] 拼团功能（复用 70%，需改为C2C）
- [ ] 限时秒杀（复用 90%）
- [ ] 邀请返利（复用 60%）

**社交功能**
- [ ] 关注/粉丝（复用 yudao-social 50%）
- [ ] 私信聊天（复用 30%，需深度改造）
- [ ] 用户主页/动态（全新）

**运营功能**
- [ ] 管理后台（H5端，复用 yudao-ui-admin-uniapp 60%）
- [ ] 数据统计大屏
- [ ] 内容审核

### 阶段三：架构升级（6-12个月）

#### 4.3 迁移方案

```
过渡期（1-3个月）：双系统并行
┌─────────┐         ┌──────────────┐
│ UniCloud │ ←同步→ │ Spring Boot  │
│ (在线)   │         │ (灰度切流)    │
└─────────┘         └──────────────┘
       ↑                    ↑
       └──── 前端统一API层 ──┘

完全切换（第4个月）：
UniCloud → 下线，全部流量到 Spring Boot
```

**迁移步骤：**
1. 搭建 Spring Boot 项目（复用 yudao-mall 后端代码）
2. 按模块逐步迁移（用户→商品→订单→社交→营销）
3. 数据迁移脚本（MongoDB → MySQL）
4. 灰度切流（10%→30%→50%→100%）
5. UniCloud 下线

### 阶段四：规模化（12个月+）

- 覆盖 100+ 高校
- Spring Cloud 微服务拆分
- AI 推荐算法
- 开放平台 API

---

## 5. 标准作业流程 SOP

### 5.1 开发环境搭建

#### 5.1.1 前置要求

```bash
# 1. Node.js >= 20
node --version

# 2. pnpm
npm install -g pnpm

# 3. HBuilderX CLI
# 路径: E:\HbuilderX\HBuilderX\cli.exe
E:\HbuilderX\HBuilderX\cli.exe --version

# 4. 微信开发者工具 CLI
# 路径: E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat
& "E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat" --version

# 5. Git
git --version
```

#### 5.1.2 项目初始化

```bash
# 1. 克隆仓库
git clone https://github.com/PaxonHuang/SchoolBuzzMate-Uniapp.git
cd SchoolBuzzMate-Uniapp

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
# 编辑 .env.development 文件
cp .env.example .env.development
```

#### 5.1.3 UniCloud 配置

在 HBuilderX 中：
1. 打开项目
2. 右键项目根目录 → 创建 uniCloud 云服务空间
3. 选择阿里云，创建空间
4. 右键 `uniCloud-aliyun` → 关联服务空间
5. 右键云函数目录 → 上传所有云函数
6. 在 [UniCloud Web 控制台](https://unicloud.dcloud.net.cn) 创建数据库集合

#### 5.1.4 启动开发

```bash
# H5 开发模式
pnpm run dev:h5

# 微信小程序开发模式
pnpm run dev:mp-weixin

# 使用 HBuilderX CLI 启动
& "E:\HbuilderX\HBuilderX\cli.exe" project open --path .

# 使用微信开发者工具打开
& "E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat" open --project ".\dist\dev\mp-weixin"
```

### 5.2 开发流程规范

#### 5.2.1 功能开发流程

```
1. 需求确认 → 创建 Feature Issue
2. 从 develop 创建 feature/xxx 分支
3. 如果涉及新数据表 → 先在 UniCloud 控制台创建集合
4. 如果涉及新云函数 → 创建云函数目录并本地调试
5. 开发前端页面 → 本地测试
6. 联调（前端 + 云函数）
7. 代码自检：ESLint + TypeScript 类型检查
8. 提交 PR → Code Review → 合并到 develop
9. 部署到测试环境验证
10. 合并到 main → 打 Tag → 发布
```

#### 5.2.2 分支管理

```
main              ← 生产环境（只有 release 和 hotfix 合入）
├─ develop        ← 开发主线
│  ├─ feature/user-auth       ← 功能分支
│  ├─ feature/product-list    ← 功能分支
│  └─ feature/order-create    ← 功能分支
├─ release/v1.0   ← 发布分支
└─ hotfix/xxx     ← 紧急修复分支
```

#### 5.2.3 代码提交规范

```bash
# Commit Message 格式
<type>(<scope>): <subject>

# type 类型
feat:     新功能
fix:      修复 Bug
refactor: 重构（不改变功能）
style:    代码格式
docs:     文档更新
test:     测试
chore:    构建/工具

# 示例
feat(product): 实现商品列表页面
fix(order): 修复订单支付回调状态更新
refactor(api): 统一API错误处理
chore: 配置ESLint和Prettier
```

### 5.3 数据库操作规范

```typescript
// UniCloud 云函数中操作数据库
const db = uniCloud.database()
const dbCmd = db.command

// === 查询（带分页、筛选、排序）===
async function getProductList(params: ProductListParams) {
  const { page = 1, size = 10, schoolId, categoryId, keyword, minPrice, maxPrice, condition, sort = 'newest' } = params

  // 构建查询条件
  const where: any = { status: 1 }
  if (schoolId) where.school_id = schoolId
  if (categoryId) where.category_id = categoryId
  if (condition) where.condition = condition
  if (minPrice || maxPrice) {
    where.price = {}
    if (minPrice) where.price.$gte = minPrice
    if (maxPrice) where.price.$lte = maxPrice
  }
  if (keyword) {
    where.title = new RegExp(keyword, 'i')
  }

  // 排序
  const sortMap: Record<string, any> = {
    newest: { create_date: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { view_count: -1 }
  }

  const [list, countResult] = await Promise.all([
    db.collection('products')
      .where(where)
      .orderBy(sortMap[sort])
      .skip((page - 1) * size)
      .limit(size)
      .get(),
    db.collection('products').where(where).count()
  ])

  return { list: list.data, total: countResult.total }
}

// === 创建（带数据校验）===
async function createProduct(data: any, context: any) {
  // context 包含当前登录用户信息 (uni-id 注入)
  const userId = context.UNIID_USER._id

  const product = {
    ...data,
    seller_id: userId,
    status: 3, // 审核中（校园场景建议开启审核）
    view_count: 0,
    like_count: 0,
    favorite_count: 0,
    comment_count: 0,
    share_count: 0,
    create_date: new Date(),
    update_date: new Date(),
  }

  return await db.collection('products').add(product)
}

// === 更新（带权限校验）===
async function updateProduct(id: string, data: any, context: any) {
  const userId = context.UNIID_USER._id
  const product = await db.collection('products').doc(id).get()

  if (!product.data || product.data.length === 0) {
    throw new Error('商品不存在')
  }
  if (product.data[0].seller_id !== userId) {
    throw new Error('无权修改该商品')
  }

  return await db.collection('products').doc(id).update({
    ...data,
    update_date: new Date(),
  })
}

// === 软删除 ===
async function deleteProduct(id: string, context: any) {
  const userId = context.UNIID_USER._id
  const product = await db.collection('products').doc(id).get()

  if (product.data[0].seller_id !== userId) {
    throw new Error('无权删除该商品')
  }

  return await db.collection('products').doc(id).update({
    status: 0,
    update_date: new Date(),
  })
}
```

### 5.4 云函数开发规范

#### 5.4.1 标准云函数模板

```javascript
// uniCloud-aliyun/cloudfunctions/product-co/index.js
'use strict'

const db = uniCloud.database()
const dbCmd = db.command

// 路由表
const ACTIONS = {
  getList: require('./actions/getList'),
  getDetail: require('./actions/getDetail'),
  create: require('./actions/create'),
  update: require('./actions/update'),
  delete: require('./actions/delete'),
  search: require('./actions/search'),
  like: require('./actions/like'),
  getMyList: require('./actions/getMyList'),
  getCategoryList: require('./actions/getCategoryList'),
}

exports.main = async (event, context) => {
  const { action, params = {} } = event

  if (!ACTIONS[action]) {
    return { code: -1, msg: `未知操作: ${action}` }
  }

  try {
    const result = await ACTIONS[action](params, context)
    return { code: 0, msg: 'success', data: result }
  } catch (error) {
    console.error(`[product-co.${action}]`, error)
    return {
      code: -1,
      msg: error.message || '操作失败，请稍后重试'
    }
  }
}
```

#### 5.4.2 云函数目录结构

```
product-co/
├─ index.js              # 入口 + 路由分发
├─ package.json          # 依赖声明
├─ actions/              # 业务逻辑（每个action一个文件）
│  ├─ getList.js
│  ├─ getDetail.js
│  ├─ create.js
│  ├─ update.js
│  ├─ delete.js
│  ├─ search.js
│  ├─ like.js
│  ├─ getMyList.js
│  └─ getCategoryList.js
└─ common/               # 公共模块
   ├─ validator.js       # 数据校验
   └─ errors.js          # 错误码定义
```

### 5.5 前端开发规范

#### 5.5.1 文件结构（改造后）

```
SchoolBuzzMate-Uniapp/
├─ src/
│  ├─ pages/                # 页面（来自 yudao-mall，改造）
│  │  ├─ index/             # 校园首页
│  │  ├─ product/           # 商品
│  │  │  ├─ list.vue        # 列表
│  │  │  ├─ detail.vue      # 详情
│  │  │  └─ publish.vue     # 发布
│  │  ├─ order/             # 订单
│  │  │  ├─ list.vue
│  │  │  ├─ detail.vue
│  │  │  └─ create.vue
│  │  ├─ user/              # 用户
│  │  │  ├─ center.vue      # 个人中心
│  │  │  ├─ login.vue       # 登录
│  │  │  ├─ profile.vue     # 资料编辑
│  │  │  └─ verify.vue      # 学生认证
│  │  ├─ social/            # 社交
│  │  │  ├─ chat.vue        # 私信聊天
│  │  │  └─ follows.vue     # 关注/粉丝
│  │  └─ marketing/         # 营销
│  │     ├─ coupon.vue      # 优惠券
│  │     ├─ points.vue      # 积分
│  │     └─ group-buy.vue   # 拼团
│  ├─ components/           # 公共组件
│  │  ├─ ProductCard.vue    # 商品卡片
│  │  ├─ UserBadge.vue      # 用户标识
│  │  ├─ CreditScore.vue    # 信用分展示
│  │  ├─ SchoolPicker.vue   # 学校选择器
│  │  └─ EmptyState.vue     # 空状态
│  ├─ api/                  # 统一API层（核心！）
│  │  ├─ index.ts           # 环境切换
│  │  ├─ product.ts
│  │  ├─ order.ts
│  │  ├─ payment.ts
│  │  ├─ user.ts
│  │  ├─ social.ts
│  │  ├─ marketing.ts
│  │  ├─ school.ts
│  │  ├─ admin.ts
│  │  └─ upload.ts
│  ├─ stores/               # Pinia 状态管理
│  │  ├─ user.ts            # 用户状态
│  │  ├─ school.ts          # 学校状态
│  │  ├─ cart.ts            # (废弃，改为收藏)
│  │  └─ notification.ts    # 通知状态
│  ├─ types/                # TypeScript 类型定义
│  │  ├─ product.ts
│  │  ├─ order.ts
│  │  ├─ user.ts
│  │  └─ api.ts             # API 通用类型
│  ├─ utils/                # 工具函数
│  │  ├─ http.ts            # HTTP 封装（后期用）
│  │  ├─ unicloud.ts        # UniCloud 封装（MVP用）
│  │  ├─ format.ts          # 格式化（日期、价格等）
│  │  └─ validate.ts        # 校验工具
│  └─ styles/               # 样式
│     ├─ variables.css      # CSS 变量（校园主题色）
│     └─ global.css         # 全局样式
├─ uniCloud-aliyun/         # UniCloud 目录
│  ├─ cloudfunctions/       # 云函数
│  └─ database/             # DB Schema
├─ .claude/                 # Claude Code 配置
│  ├─ settings.json         # 权限/钩子配置
│  └─ skills/               # 自定义技能
├─ .husky/                  # Git hooks
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ uno.config.ts            # UnoCSS 配置
├─ .eslintrc.cjs            # ESLint 配置
├─ .prettierrc              # Prettier 配置
└─ CLAUDE.md                # Claude Code 项目指令
```

#### 5.5.2 Vue3 + TypeScript 组件规范

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app'
import { getProductList } from '@/api/product'
import { useSchoolStore } from '@/stores/school'
import type { Product, ProductListParams } from '@/types/product'

// === Props ===
interface Props {
  /** 分类ID筛选 */
  categoryId?: string
  /** 是否显示搜索栏 */
  showSearch?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSearch: true,
})

// === Emits ===
interface Emits {
  (e: 'product-click', product: Product): void
  (e: 'list-loaded', total: number): void
}

const emit = defineEmits<Emits>()

// === 状态 ===
const schoolStore = useSchoolStore()
const list = ref<Product[]>([])
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)
const keyword = ref('')

// === 计算属性 ===
const schoolId = computed(() => schoolStore.currentSchoolId)
const isEmpty = computed(() => !loading.value && list.value.length === 0)

// === 方法 ===
async function loadProducts(isRefresh = false) {
  if (loading.value) return
  if (!isRefresh && !hasMore.value) return

  loading.value = true
  if (isRefresh) page.value = 1

  try {
    const params: ProductListParams = {
      page: page.value,
      size: 10,
      schoolId: schoolId.value,
      categoryId: props.categoryId,
      keyword: keyword.value || undefined,
    }

    const result = await getProductList(params)

    if (isRefresh) {
      list.value = result.list
    } else {
      list.value.push(...result.list)
    }

    hasMore.value = result.list.length === 10
    page.value++

    emit('list-loaded', result.total)
  } catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' })
    console.error('[ProductList]', error)
  } finally {
    loading.value = false
  }
}

// === 生命周期 ===
onMounted(() => {
  loadProducts(true)
})
</script>

<template>
  <view class="product-list">
    <!-- 搜索栏 -->
    <view v-if="props.showSearch" class="search-bar">
      <wd-search v-model="keyword" placeholder="搜索校园好物" @search="loadProducts(true)" />
    </view>

    <!-- 商品列表 -->
    <view v-if="!isEmpty" class="list">
      <ProductCard
        v-for="item in list"
        :key="item._id"
        :product="item"
        @click="emit('product-click', item)"
      />
    </view>

    <!-- 空状态 -->
    <EmptyState v-else description="暂无商品" />

    <!-- 加载更多 -->
    <view v-if="hasMore && !isEmpty" class="load-more">
      <wd-loading v-if="loading" />
      <text v-else>上拉加载更多</text>
    </view>
  </view>
</template>

<style scoped>
.product-list {
  min-height: 100vh;
  background: var(--bg-color);
}

.search-bar {
  padding: 20rpx;
}

.list {
  padding: 0 20rpx;
}
</style>
```

---

## 6. 技术规范 SPEC

### 6.1 TypeScript 类型规范

```typescript
// src/types/product.ts

/** 新旧程度 */
export type ProductCondition = 'brand_new' | 'like_new' | 'used' | 'old'

/** 交易方式 */
export type TradeMethod = 'self_pickup' | 'express' | 'both'

/** 商品状态 */
export enum ProductStatus {
  /** 下架 */
  OFF_SHELF = 0,
  /** 上架 */
  ON_SHELF = 1,
  /** 已售 */
  SOLD = 2,
  /** 审核中 */
  AUDITING = 3,
}

/** 商品实体 */
export interface Product {
  _id: string
  sellerId: string
  schoolId: string
  categoryId: string
  title: string
  description: string
  images: string[]
  videoUrl?: string
  originalPrice: number
  price: number
  freight: number
  stock: number
  condition: ProductCondition
  tags: string[]
  tradeMethod: TradeMethod
  status: ProductStatus
  auditReason?: string
  viewCount: number
  likeCount: number
  favoriteCount: number
  commentCount: number
  shareCount: number
  createDate: string
  updateDate: string
  // 关联数据（列表接口不返回，详情接口返回）
  seller?: UserBrief
  category?: Category
  isLiked?: boolean
  isFavorited?: boolean
}

/** 商品列表查询参数 */
export interface ProductListParams {
  page: number
  size: number
  schoolId?: string
  categoryId?: string
  keyword?: string
  minPrice?: number
  maxPrice?: number
  condition?: ProductCondition
  tradeMethod?: TradeMethod
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular'
}

/** 商品列表响应 */
export interface ProductListResult {
  list: Product[]
  total: number
}

/** 创建商品参数 */
export interface CreateProductParams {
  title: string
  description: string
  images: string[]
  categoryId: string
  originalPrice: number
  price: number
  condition: ProductCondition
  tags: string[]
  tradeMethod: TradeMethod
  freight?: number
}

// src/types/order.ts

/** 订单状态 */
export enum OrderStatus {
  PENDING_PAY = 0,
  PENDING_DELIVERY = 1,
  PENDING_RECEIVE = 2,
  COMPLETED = 3,
  CANCELLED = 4,
  REFUNDING = 5,
  REFUNDED = 6,
}

/** 订单实体 */
export interface Order {
  _id: string
  orderNo: string
  buyerId: string
  sellerId: string
  productId: string
  productSnapshot: {
    title: string
    price: number
    images: string[]
  }
  amount: number
  freight: number
  discountAmount: number
  payAmount: number
  tradeMethod: TradeMethod
  address?: Address
  status: OrderStatus
  cancelReason?: string
  payType?: string
  payTime?: string
  paymentNo?: string
  expressCompany?: string
  expressNo?: string
  createDate: string
  deliveryTime?: string
  receiveTime?: string
  completeTime?: string
  // 关联
  buyer?: UserBrief
  seller?: UserBrief
  product?: Product
}

// src/types/api.ts

/** 统一 API 响应 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/** 分页响应 */
export interface PaginatedData<T> {
  list: T[]
  total: number
}

/** 环境模式 */
export type ApiMode = 'unicloud' | 'springboot'
```

### 6.2 Pinia Store 规范

```typescript
// src/stores/user.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCurrentUser } from '@/api/user'
import type { UserProfile } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // === 状态 ===
  const profile = ref<UserProfile | null>(null)
  const token = ref<string>('')
  const isLoggedIn = computed(() => !!token.value)

  // === 学校相关 ===
  const currentSchool = ref<{ id: string; name: string } | null>(null)

  // === 方法 ===
  async function fetchProfile() {
    const result = await getCurrentUser()
    profile.value = result
  }

  function setToken(t: string) {
    token.value = t
    uni.setStorageSync('token', t)
  }

  function logout() {
    profile.value = null
    token.value = ''
    uni.removeStorageSync('token')
  }

  return {
    profile,
    token,
    isLoggedIn,
    currentSchool,
    fetchProfile,
    setToken,
    logout,
  }
})

// src/stores/school.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSchoolList } from '@/api/school'

export const useSchoolStore = defineStore('school', () => {
  const schools = ref<School[]>([])
  const currentSchoolId = ref<string>('')

  const currentSchool = computed(() =>
    schools.value.find(s => s._id === currentSchoolId.value)
  )

  async function fetchSchools() {
    const result = await getSchoolList()
    schools.value = result
  }

  function switchSchool(schoolId: string) {
    currentSchoolId.value = schoolId
    uni.setStorageSync('currentSchoolId', schoolId)
  }

  return {
    schools,
    currentSchoolId,
    currentSchool,
    fetchSchools,
    switchSchool,
  }
})
```

### 6.3 安全规范

```typescript
// uniCloud-aliyun/cloudfunctions/product-co/common/validator.js

/**
 * 数据校验中间件
 * 所有 create/update 操作都必须先通过校验
 */
const Joi = require('joi')

const createProductSchema = Joi.object({
  title: Joi.string().required().min(2).max(100).messages({
    'string.empty': '标题不能为空',
    'string.min': '标题至少2个字符',
    'string.max': '标题不能超过100个字符',
  }),
  description: Joi.string().max(500).allow('').messages({
    'string.max': '描述不能超过500个字符',
  }),
  images: Joi.array().items(Joi.string()).min(1).max(9).messages({
    'array.min': '至少上传1张图片',
    'array.max': '最多上传9张图片',
  }),
  categoryId: Joi.string().required().messages({
    'any.required': '请选择商品分类',
  }),
  price: Joi.number().required().min(0.01).max(99999).messages({
    'number.min': '价格不能低于0.01元',
    'number.max': '价格不能超过99999元',
  }),
  originalPrice: Joi.number().min(0).max(99999).allow(null),
  condition: Joi.string().valid('brand_new', 'like_new', 'used', 'old').required(),
  tradeMethod: Joi.string().valid('self_pickup', 'express', 'both').required(),
  tags: Joi.array().items(Joi.string()).max(5),
  freight: Joi.number().min(0).max(999).default(0),
})

function validate(data, schema) {
  const { error, value } = schema.validate(data, { stripUnknown: true })
  if (error) {
    const err = new Error(error.details[0].message)
    err.code = 'VALIDATION_ERROR'
    throw err
  }
  return value
}

module.exports = {
  validateCreateProduct: (data) => validate(data, createProductSchema),
}
```

```typescript
// 权限校验公共模块
// uniCloud-aliyun/cloudfunctions/common/auth.js

const db = uniCloud.database()

/**
 * 校验用户登录状态
 * uni-id 会在 context.UNIID_USER 中注入当前用户信息
 */
function requireAuth(context) {
  const user = context.UNIID_USER
  if (!user || !user._id) {
    const err = new Error('请先登录')
    err.code = 'UNAUTHORIZED'
    throw err
  }
  return user
}

/**
 * 校验学生认证
 */
function requireVerified(context) {
  const user = requireAuth(context)
  // 需要查询扩展表
  return db.collection('school_users')
    .where({ user_id: user._id, is_verified: true })
    .get()
    .then(res => {
      if (!res.data || res.data.length === 0) {
        const err = new Error('请先完成学生认证')
        err.code = 'NOT_VERIFIED'
        throw err
      }
      return { ...user, schoolUser: res.data[0] }
    })
}

/**
 * 校验是否是资源所有者
 */
async function requireOwner(context, collection, docId, ownerField = 'seller_id') {
  const user = requireAuth(context)
  const doc = await db.collection(collection).doc(docId).get()

  if (!doc.data || doc.data.length === 0) {
    const err = new Error('资源不存在')
    err.code = 'NOT_FOUND'
    throw err
  }
  if (doc.data[0][ownerField] !== user._id) {
    const err = new Error('无权操作此资源')
    err.code = 'FORBIDDEN'
    throw err
  }
  return { user, doc: doc.data[0] }
}

module.exports = { requireAuth, requireVerified, requireOwner }
```

### 6.4 性能规范

- **列表分页**：每页10条，下拉刷新+上拉加载更多
- **图片压缩**：上传前压缩至 ≤200KB，使用 WebP 格式
- **云函数调用合并**：详情页一次性返回关联数据（商品+卖家+分类）
- **数据库索引**：高频查询字段必须建索引
- **CDN 加速**：图片走 UniCloud CDN

---

## 7. CLI 工具链集成

### 7.1 工具清单

| 工具 | 路径 | 用途 |
|------|------|------|
| HBuilderX | `E:\HbuilderX\HBuilderX\` | 云函数开发/部署、uni-app 编译 |
| HBuilderX CLI | `E:\HbuilderX\HBuilderX\cli.exe` | 命令行编译/打包 |
| 微信开发者工具 | `E:\Tencent微信web开发者工具\微信web开发者工具\` | 小程序调试/预览 |
| 微信开发者工具 CLI | `E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat` | 命令行预览/上传 |
| wechat-http | `http://localhost:<port>/v2/` | HTTP API 自动化 |

### 7.2 开发快速启动脚本

创建 `scripts/dev.ps1`：

```powershell
# SchoolBuzzMate 开发环境一键启动
param(
  [ValidateSet("h5", "mp-weixin", "both")]
  [string]$Platform = "mp-weixin"
)

$ProjectRoot = $PSScriptRoot + "\.."
$HBuilderX = "E:\HbuilderX\HBuilderX\HBuilderX.exe"
$WeChatCLI = "E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat"
$WeChatProject = "$ProjectRoot\dist\dev\mp-weixin"

Write-Host "🚀 启动 SchoolBuzzMate 开发环境..." -ForegroundColor Green

# 1. 启动 HBuilderX 打开项目
Write-Host "📂 在 HBuilderX 中打开项目..." -ForegroundColor Cyan
Start-Process -FilePath $HBuilderX -ArgumentList $ProjectRoot

# 2. 编译到微信小程序
Write-Host "🔨 编译微信小程序..." -ForegroundColor Cyan
Push-Location $ProjectRoot
pnpm run dev:mp-weixin
Pop-Location

# 3. 等待编译完成后打开微信开发者工具
Start-Sleep -Seconds 3
if (Test-Path $WeChatProject) {
  Write-Host "🔧 打开微信开发者工具..." -ForegroundColor Cyan
  & $WeChatCLI open --project $WeChatProject
}

Write-Host "✅ 开发环境启动完成！" -ForegroundColor Green
```

### 7.3 自动化发布脚本

创建 `scripts/release.ps1`：

```powershell
# SchoolBuzzMate 微信小程序发布脚本
param(
  [Parameter(Mandatory=$true)]
  [string]$Version,
  [string]$Desc = "版本更新"
)

$ProjectRoot = $PSScriptRoot + "\.."
$WeChatCLI = "E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat"
$WeChatProject = "$ProjectRoot\dist\build\mp-weixin"

Write-Host "📦 开始发布 SchoolBuzzMate v$Version..." -ForegroundColor Green

# Step 1: 构建生产版本
Write-Host "🔨 Step 1/5: 构建生产版本..." -ForegroundColor Cyan
Push-Location $ProjectRoot
pnpm run build:mp-weixin
Pop-Location

# Step 2: 检查登录状态
Write-Host "🔑 Step 2/5: 检查微信开发者工具登录状态..." -ForegroundColor Cyan
$loginResult = & $WeChatCLI islogin 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️ 请先在微信开发者工具中扫码登录！" -ForegroundColor Yellow
  & $WeChatCLI login
  exit 1
}

# Step 3: 构建 npm
Write-Host "📦 Step 3/5: 构建 npm 依赖..." -ForegroundColor Cyan
& $WeChatCLI build-npm --project $WeChatProject

# Step 4: 预览
Write-Host "👀 Step 4/5: 生成预览二维码..." -ForegroundColor Cyan
& $WeChatCLI preview --project $WeChatProject --qr-format terminal

# Step 5: 上传
Write-Host "⬆️ Step 5/5: 上传代码..." -ForegroundColor Cyan
& $WeChatCLI upload --project $WeChatProject -v $Version -d $Desc

Write-Host "✅ 发布完成！请在微信公众平台提交审核。" -ForegroundColor Green
```

### 7.4 微信开发者工具 HTTP API（备用）

当命令行不适用时，使用 HTTP API：

```powershell
# 确认工具 HTTP 端口
$PortFile = "$env:LOCALAPPDATA\微信开发者工具\User Data\Default\.ide"
$Port = Get-Content $PortFile

$BaseUrl = "http://localhost:$Port/v2"

# 检查登录
Invoke-RestMethod "$BaseUrl/islogin"

# 预览
Invoke-RestMethod "$BaseUrl/preview?project=$WeChatProject&qr-format=terminal"

# 上传
Invoke-RestMethod "$BaseUrl/upload?project=$WeChatProject&version=1.0.0&desc=CI构建"
```

### 7.5 UniCloud 部署脚本

```powershell
# scripts/deploy-cloud.ps1
# 部署 UniCloud 云函数

param(
  [string]$FunctionName  # 留空 = 全部部署
)

$ProjectRoot = $PSScriptRoot + "\.."
$CloudFunctionsDir = "$ProjectRoot\uniCloud-aliyun\cloudfunctions"

Write-Host "☁️ 部署 UniCloud 云函数..." -ForegroundColor Green

if ($FunctionName) {
  Write-Host "部署单个云函数: $FunctionName" -ForegroundColor Cyan
  # 使用 HBuilderX CLI 部署（如果支持）
  # 或手动在 HBuilderX 中右键上传
} else {
  Write-Host "请按以下步骤在 HBuilderX 中完成部署：" -ForegroundColor Yellow
  Write-Host "1. 打开 HBuilderX，进入项目"
  Write-Host "2. 展开 uniCloud-aliyun/cloudfunctions/"
  Write-Host "3. 右键每个云函数 → 上传部署"
  Write-Host "4. 或：右键 uniCloud-aliyun → 上传所有云函数"
}
```

---

## 8. Claude Code 自动化增强

### 8.1 Skills 创建计划

基于你的开发环境，建议创建以下 Skills：

#### Skill 1: `wechat-dev-cycle` — 微信小程序开发循环

```yaml
---
name: wechat-dev-cycle
description: 一键完成"编译→打开微信开发者工具→预览"的开发循环
---
```

自动化步骤：
1. 运行 `pnpm run dev:mp-weixin`
2. 等待编译完成
3. 打开微信开发者工具并加载编译产物
4. 可选：自动生成预览二维码

#### Skill 2: `unicloud-deploy` — UniCloud 云函数部署

```yaml
---
name: unicloud-deploy
description: 分析变更自动部署对应的 UniCloud 云函数
---
```

自动化步骤：
1. 分析 git diff 确定哪些云函数被修改
2. 在 HBuilderX 中上传对应的云函数
3. 触发微信小程序重新编译

#### Skill 3: `schoolbuzz-scaffold` — SchoolBuzzMate 功能脚手架

```yaml
---
name: schoolbuzz-scaffold
description: 快速生成标准的页面+云函数+类型定义代码
---
```

基于项目规范自动生成：
- 页面 Vue 文件（含 TypeScript）
- 对应的 API service 代码
- 对应的云函数骨架
- 数据库集合 schema

### 8.2 Hooks 推荐

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "tool": "Edit",
        "command": "npx eslint --fix $CLAUDE_EDITED_FILE",
        "description": "编辑后自动 ESLint 格式化"
      }
    ],
    "PreToolUse": [
      {
        "tool": "Edit",
        "path": ".env*",
        "description": "禁止编辑环境变量文件",
        "action": "block"
      }
    ]
  }
}
```

### 8.3 MCP Server 推荐

| MCP Server | 用途 | 安装命令 |
|------------|------|----------|
| **context7** | 实时查询 uni-app/UniCloud/uniapp 文档 | `claude mcp add context7` |
| **Playwright** | H5 端 E2E 测试 | `claude mcp add playwright` |
| **GitHub** | Issues/PRs 管理 | `claude mcp add github` |
| **Memory** | 跨会话项目知识沉淀 | `claude mcp add memory` |

---

## 9. 质量保证体系

### 9.1 代码检查清单

每个 PR 合并前必须通过：

- [ ] `pnpm run type-check` — TypeScript 类型检查通过
- [ ] `pnpm run lint` — ESLint 无错误
- [ ] `pnpm run build:mp-weixin` — 微信小程序构建成功
- [ ] 新增云函数已上传测试环境
- [ ] 手动测试核心流程通过
- [ ] PR 描述包含截图或录屏

### 9.2 测试策略

#### 云函数测试

```javascript
// uniCloud-aliyun/cloudfunctions/product-co/__tests__/getList.test.js
const { getList } = require('../actions/getList')

describe('product-co.getList', () => {
  it('应返回指定学校的商品列表', async () => {
    const result = await getList({
      schoolId: 'test_school_id',
      page: 1,
      size: 10,
    })
    expect(result.list).toBeDefined()
    expect(result.total).toBeGreaterThanOrEqual(0)
    expect(result.list.length).toBeLessThanOrEqual(10)
  })

  it('应按分类筛选商品', async () => {
    const result = await getList({
      categoryId: 'textbook_category_id',
      page: 1,
      size: 10,
    })
    result.list.forEach(product => {
      expect(product.category_id).toBe('textbook_category_id')
    })
  })

  it('应按关键词搜索', async () => {
    const result = await getList({
      keyword: '高等数学',
      page: 1,
      size: 10,
    })
    expect(result.total).toBeGreaterThan(0)
  })
})
```

#### 前端可测试性

```typescript
// 将业务逻辑从组件中抽离为纯函数
// src/utils/order.ts

/**
 * 计算订单实付金额（纯函数，可测试）
 */
export function calcPayAmount(
  amount: number,
  freight: number,
  couponDiscount: number = 0
): number {
  const payAmount = amount + freight - couponDiscount
  return Math.max(0, Math.round(payAmount * 100) / 100)
}

/**
 * 判断订单是否可取消
 */
export function canCancelOrder(status: OrderStatus): boolean {
  return [OrderStatus.PENDING_PAY, OrderStatus.PENDING_DELIVERY].includes(status)
}

/**
 * 格式化订单状态文本
 */
export function formatOrderStatus(status: OrderStatus): string {
  const map: Record<number, string> = {
    [OrderStatus.PENDING_PAY]: '待支付',
    [OrderStatus.PENDING_DELIVERY]: '待发货',
    [OrderStatus.PENDING_RECEIVE]: '待收货',
    [OrderStatus.COMPLETED]: '已完成',
    [OrderStatus.CANCELLED]: '已取消',
    [OrderStatus.REFUNDING]: '退款中',
    [OrderStatus.REFUNDED]: '已退款',
  }
  return map[status] || '未知状态'
}
```

---

## 10. 风险管理

### 10.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| yudao-mall 前端代码理解成本高 | 高 | 中 | 先完整阅读代码，绘制模块调用图 |
| UniCloud MongoDB 性能瓶颈 | 高 | 中 | 合理建索引，预留迁移方案 |
| uni-pay 与微信支付适配问题 | 高 | 低 | 提前测试支付全流程 |
| B2C→C2C 改造超出预期工程量 | 中 | 中 | 允许 MVP 砍功能，先跑通核心流程 |
| 微信小程序审核不通过 | 高 | 中 | 提前了解社交/交易类审核规则 |
| TypeScript 改造过程中类型错误阻塞 | 低 | 高 | 渐进式迁移，允许 `any` 过渡 |

### 10.2 业务风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 用户增长缓慢 | 高 | 中 | 校园地推+社团合作+邀请奖励 |
| 交易纠纷/诈骗 | 高 | 中 | 学生认证+信用分+平台客服 |
| 竞品出现 | 中 | 中 | 快速迭代，建立品牌和用户壁垒 |
| 政策合规（校园交易平台监管）| 高 | 低 | 依法运营，内容审核，资质办理 |

### 10.3 退化策略

**如果 UniCloud MVP 验证失败：**
- 直接跳到 Spring Boot 方案（复用 yudao-mall 完整后端）
- 保留前端改造成果，替换后端即可

**如果改造 yudao-mall 复杂度过高：**
- 降级为纯自研方案，仅参考 yudao-mall 设计思路
- 使用 JeecgUniapp 的工程化模板

---

## 11. 里程碑与交付物

### 11.1 里程碑总览

| 里程碑 | 时间 | 交付物 | 验收标准 |
|--------|------|--------|----------|
| M0：环境就绪 | 第1周 | 新仓库+CLI工具链+UniCloud配置 | 全链路可运行 |
| M1：用户系统 | 第2周 | 注册登录+学生认证+学校选择 | 可登录并认证 |
| M2：商品系统 | 第3周 | 商品发布/列表/详情/搜索 | 可浏览和发布商品 |
| M3：交易闭环 | 第4周 | 订单创建+支付+订单管理 | 完成一笔真实交易 |
| M4：MVP 上线 | 第6-8周 | 微信小程序上线 | 通过审核+首批用户 |
| M5：功能完善 | 3-6月 | 营销+社交+运营后台 | 日活1000+ |
| M6：架构升级 | 6-12月 | Spring Boot 迁移完成 | 无感知切换 |
| M7：规模化 | 12月+ | 微服务+AI推荐+开放平台 | 50+高校覆盖 |

### 11.2 交付物清单

**文档类**
- [ ] 技术架构设计文档
- [ ] API 接口文档（OpenAPI 格式）
- [ ] 数据库设计文档
- [ ] 部署运维文档
- [ ] 用户使用手册
- [ ] 开发者贡献指南

**代码类**
- [ ] SchoolBuzzMate-Uniapp 前端代码
- [ ] UniCloud 云函数代码
- [ ] 数据库 Schema 定义
- [ ] CLI 自动化脚本
- [ ] Claude Code Skills 配置

---

## 附录

### A. 参考资源

| 资源 | 链接 |
|------|------|
| yudao-mall-uniapp | https://github.com/yudaocode/yudao-mall-uniapp |
| yudao-ui-admin-uniapp | https://github.com/yudaocode/yudao-ui-admin-uniapp |
| JeecgUniapp | https://github.com/jeecgboot/JeecgUniapp |
| uni-app 官方 | https://github.com/dcloudio/uni-app |
| uni-app CLI 文档 | https://uniapp.dcloud.net.cn/worktile/CLI.html |
| UniCloud 快速上手 | https://doc.dcloud.net.cn/uniCloud/quickstart.html |
| uni-id 文档 | https://uniapp.dcloud.net.cn/uniCloud/uni-id.html |
| uni-pay 文档 | https://uniapp.dcloud.net.cn/uniCloud/uni-pay.html |
| 微信开发者工具 CLI | https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html |
| 微信开发者工具 HTTP API | https://developers.weixin.qq.com/miniprogram/dev/devtools/http.html |

### B. CLI 速查表

```powershell
# === HBuilderX CLI ===
# 启动 HBuilderX 并打开项目
& "E:\HbuilderX\HBuilderX\cli.exe" project open --path .

# === npm/pnpm 编译命令 ===
pnpm run dev:h5              # H5 开发
pnpm run dev:mp-weixin        # 微信小程序开发
pnpm run build:h5             # H5 构建
pnpm run build:mp-weixin      # 微信小程序构建

# === 微信开发者工具 CLI ===
$WX="E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat"
& $WX open --project ".\dist\dev\mp-weixin"    # 打开项目
& $WX login                                     # 登录
& $WX islogin                                   # 检查登录
& $WX preview --project ".\dist\dev\mp-weixin"  # 预览
& $WX upload --project ".\dist\build\mp-weixin" -v "1.0.0" -d "发布说明"  # 上传
& $WX auto --project ".\dist\dev\mp-weixin" --auto-port 9420  # 自动化测试
```

### C. 语言占比

| 语言 | 预计占比 |
|------|----------|
| TypeScript (前端) | 45% |
| JavaScript (云函数) | 25% |
| Vue (模板) | 20% |
| CSS/UnoCSS | 5% |
| PowerShell (脚本) | 3% |
| JSON/YAML (配置) | 2% |

---

**文档版本：** v2.0  
**最后更新：** 2026-06-03  
**维护人：** SchoolBuzzMate Team  
**基于决策：** yudao-mall-uniapp 前端复用 + UniCloud MVP + Spring Boot 后期迁移

---
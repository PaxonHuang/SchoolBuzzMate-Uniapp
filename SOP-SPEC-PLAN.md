# SchoolBuzzMate-Uniapp 项目 SOP-SPEC-PLAN 文档

> **项目名称：** SchoolBuzzMate（校趣闪搭）- 校园社交交易系统  
> **技术栈：** UniApp + Vue3 + TypeScript + UniCloud(MVP) → Spring Boot/Cloud(后期)  
> **文档版本：** v1.0  
> **创建日期：** 2025-01  
> **参考基座：** 芋道商城 (yudao-mall-uniapp)

---

## 📋 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术架构设计](#2-技术架构设计)
- [3. 分阶段实施计划](#3-分阶段实施计划)
- [4. 标准作业流程 SOP](#4-标准作业流程-sop)
- [5. 技术规范 SPEC](#5-技术规范-spec)
- [6. 质量保证体系](#6-质量保证体系)
- [7. 风险管理](#7-风险管理)
- [8. 里程碑与交付物](#8-里程碑与交付物)

---

## 1. 项目概述

### 1.1 项目定位

**SchoolBuzzMate** 是面向高校学生的校园社交交易平台，核心功能包括：
- 🎯 **二手交易**：教材、数码、生活用品等校园内交易
- 💬 **社交互动**：评论、点赞、关注、私信
- 🎁 **营销裂变**：优惠券、积分、拼团、秒杀
- 📱 **多端支持**：微信小程序、H5、APP（后期）

### 1.2 目标用户

- **主要用户：** 18-25岁在校大学生
- **使用场景：** 校园内二手交易、学习资料流转、社交互动
- **核心价值：** 低成本获取资源、建立校园社交圈

### 1.3 商业模式

| 阶段 | 时间 | 目标 | 盈利模式 |
|------|------|------|----------|
| MVP验证 | 1-2个月 | 单校日活1000 | 免费获取用户 |
| 功能完善 | 3-6个月 | 3-5所高校 | 交易手续费(3-5%) |
| 规模化 | 6-12个月 | 50+高校 | 会员订阅、广告投放 |
| 商业化 | 12个月+ | 100+高校 | 增值服务、数据服务 |

### 1.4 核心竞争力

1. **垂直细分：** 专注校园场景，功能更贴合学生需求
2. **社交驱动：** 基于校园关系链，信任度更高
3. **快速迭代：** UniCloud快速开发，响应市场变化
4. **可扩展性：** 后期可平滑迁移到Spring Cloud微服务

---

## 2. 技术架构设计

### 2.1 总体架构

```
┌─────────────────────────────────────────────────┐
│                  前端展示层                      │
│  UniApp (Vue3 + TypeScript + Vite5 + Pinia)    │
│  ├─ 微信小程序  ├─ H5  ├─ APP (后期)           │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              MVP阶段：UniCloud                    │
│  ├─ uni-id (统一身份认证)                       │
│  ├─ uni-pay (统一支付)                          │
│  ├─ 云函数 (业务逻辑)                           │
│  └─ 云数据库 (数据存储)                         │
└─────────────────────────────────────────────────┘
                      ↓ (后期迁移)
┌─────────────────────────────────────────────────┐
│          成熟期：Spring Boot/Cloud                │
│  ├─ Spring Cloud Gateway (API网关)              │
│  ├─ Spring Cloud Alibaba (微服务)               │
│  ├─ Sa-Token (权限认证)                         │
│  ├─ MyBatisPlus (ORM)                           │
│  ├─ Redis (缓存)                                │
│  ├─ MySQL (主数据库)                            │
│  └─ RabbitMQ (消息队列)                         │
└─────────────────────────────────────────────────┘
```

### 2.2 MVP阶段技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | UniApp | 3.0.x | 跨平台开发框架 |
| 前端语言 | Vue3 + TypeScript | 3.4.x + 5.8.x | 现代化开发体验 |
| 构建工具 | Vite | 5.2.x | 快速构建 |
| 状态管理 | Pinia | 2.0.x | 轻量级状态管理 |
| UI组件 | wot-design-uni | 1.13.x | 高颜值组件库 |
| CSS方案 | UnoCSS | 66.x | 原子化CSS |
| 云开发 | UniCloud | 阿里云 | MVP快速验证 |
| 认证 | uni-id | 最新版 | 统一身份认证 |
| 支付 | uni-pay | 最新版 | 统一支付 |
| 数据库 | UniCloud DB | - | 云数据库 |

### 2.3 后期技术栈（Spring Cloud方案）

| 层级 | 技术 | 说明 |
|------|------|------|
| API网关 | Spring Cloud Gateway | 统一网关、限流、鉴权 |
| 微服务 | Spring Cloud Alibaba | Nacos注册中心、配置中心 |
| 认证授权 | Sa-Token | 轻量级权限认证框架 |
| 数据库 | MySQL 8.0 | 主数据库 |
| 缓存 | Redis 7.0 + Redisson | 分布式缓存、分布式锁 |
| ORM | MyBatisPlus 3.5+ | 增强MyBatis |
| 消息队列 | RabbitMQ / RocketMQ | 异步消息、削峰填谷 |
| 对象存储 | 阿里云OSS / MinIO | 图片、文件存储 |
| 监控 | Prometheus + Grafana | 性能监控 |
| 日志 | ELK Stack | 日志收集分析 |

### 2.4 数据库设计（MVP阶段）

#### 核心数据表

**1. 用户相关**
```javascript
// uni-id-users (uni-id内置集合)
{
  _id: ObjectId,
  username: String,          // 用户名
  nickname: String,          // 昵称
  mobile: String,            // 手机号
  wx_openid: String,         // 微信openid
  avatar: String,            // 头像
  status: Number,            // 状态 0正常 1禁用
  create_date: Date,         // 创建时间
}

// school_users (扩展信息)
{
  _id: ObjectId,
  user_id: ObjectId,         // 关联uni-id-users._id
  school_id: ObjectId,       // 学校ID
  college: String,           // 学院
  major: String,             // 专业
  grade: String,             // 年级
  student_no: String,        // 学号
  real_name: String,         // 真实姓名（认证用）
  student_card: String,      // 学生证照片
  is_verified: Boolean,      // 是否学生认证
  credit_score: Number,      // 信用分
  balance: Number,           // 余额
}

// schools (学校)
{
  _id: ObjectId,
  name: String,              // 学校名称
  province: String,          // 省份
  city: String,              // 城市
  logo: String,              // 校徽
  status: Number,            // 状态
}
```

**2. 商品相关**
```javascript
// products (商品)
{
  _id: ObjectId,
  seller_id: ObjectId,       // 卖家ID
  school_id: ObjectId,       // 学校ID
  category_id: ObjectId,     // 分类ID
  title: String,             // 标题
  description: String,       // 描述
  images: Array,             // 图片数组
  original_price: Number,    // 原价
  price: Number,             // 现价
  condition: String,         // 新旧程度
  tags: Array,               // 标签
  status: Number,            // 状态: 0下架 1上架 2已售
  view_count: Number,        // 浏览量
  like_count: Number,        // 点赞数
  create_date: Date,
  update_date: Date,
}

// product_categories (商品分类)
{
  _id: ObjectId,
  name: String,              // 分类名称
  icon: String,              // 图标
  parent_id: ObjectId,       // 父分类ID
  sort: Number,              // 排序
}
```

**3. 订单相关**
```javascript
// orders (订单)
{
  _id: ObjectId,
  order_no: String,          // 订单号
  buyer_id: ObjectId,        // 买家ID
  seller_id: ObjectId,       // 卖家ID
  product_id: ObjectId,      // 商品ID
  amount: Number,            // 金额
  status: Number,            // 状态: 0待支付 1待发货 2待收货 3完成 4取消 5退款
  pay_type: String,          // 支付方式
  pay_time: Date,            // 支付时间
  delivery_time: Date,       // 发货时间
  receive_time: Date,        // 收货时间
  remark: String,            // 备注
  create_date: Date,
}

// payments (支付记录)
{
  _id: ObjectId,
  order_id: ObjectId,        // 订单ID
  payment_no: String,        // 支付流水号
  amount: Number,            // 金额
  status: Number,            // 支付状态
  pay_channel: String,       // 支付渠道
  pay_time: Date,
}
```

**4. 社交相关**
```javascript
// comments (评论)
{
  _id: ObjectId,
  product_id: ObjectId,      // 商品ID
  user_id: ObjectId,         // 用户ID
  content: String,           // 内容
  images: Array,             // 图片
  parent_id: ObjectId,       // 父评论ID
  like_count: Number,        // 点赞数
  create_date: Date,
}

// favorites (收藏)
{
  _id: ObjectId,
  user_id: ObjectId,
  product_id: ObjectId,
  create_date: Date,
}

// messages (私信)
{
  _id: ObjectId,
  from_user_id: ObjectId,
  to_user_id: ObjectId,
  content: String,
  type: Number,              // 消息类型
  is_read: Boolean,
  create_date: Date,
}
```

**5. 营销相关**
```javascript
// coupons (优惠券)
{
  _id: ObjectId,
  name: String,              // 券名
  type: Number,              // 类型: 1满减 2折扣
  discount_amount: Number,   // 满减金额
  min_amount: Number,        // 最低消费
  total_count: Number,       // 总数量
  used_count: Number,        // 已使用
  start_time: Date,
  end_time: Date,
  status: Number,            // 状态
}

// user_coupons (用户优惠券)
{
  _id: ObjectId,
  user_id: ObjectId,
  coupon_id: ObjectId,
  status: Number,            // 0未使用 1已使用 2已过期
  use_time: Date,
}

// points_log (积分记录)
{
  _id: ObjectId,
  user_id: ObjectId,
  points: Number,            // 积分（正负）
  type: Number,              // 类型: 1注册 2签到 3交易 4系统
  description: String,
  create_date: Date,
}
```

### 2.5 云函数设计

#### 核心云函数清单

```
uniCloud-aliyun/cloudfunctions/
├─ uni-id-co/              # uni-id认证云函数（官方）
├─ uni-pay-co/             # uni-pay支付云函数（官方）
├─ user-co/                # 用户相关
│  ├─ getUserInfo          # 获取用户信息
│  ├─ updateUserProfile    # 更新用户资料
│  ├─ verifyStudent        # 学生认证
│  └─ getUserStats         # 用户统计
├─ product-co/             # 商品相关
│  ├─ createProduct        # 发布商品
│  ├─ getProductList       # 商品列表
│  ├─ getProductDetail     # 商品详情
│  ├─ updateProduct        # 更新商品
│  ├─ deleteProduct        # 删除商品
│  └─ searchProducts       # 搜索商品
├─ order-co/               # 订单相关
│  ├─ createOrder          # 创建订单
│  ├─ getOrderList         # 订单列表
│  ├─ getOrderDetail       # 订单详情
│  ├─ cancelOrder          # 取消订单
│  ├─ confirmReceive       # 确认收货
│  └─ applyRefund          # 申请退款
├─ payment-co/             # 支付相关
│  ├─ createPayment        # 创建支付
│  ├─ paymentCallback      # 支付回调
│  └─ queryPayment         # 查询支付
├─ social-co/              # 社交相关
│  ├─ createComment        # 发表评论
│  ├─ likeProduct          # 点赞商品
│  ├─ toggleFavorite       # 收藏/取消收藏
│  ├─ sendMessage          # 发送私信
│  └─ getMessages          # 获取私信列表
├─ marketing-co/           # 营销相关
│  ├─ getCoupons           # 领取优惠券
│  ├─ useCoupon            # 使用优惠券
│  ├─ checkIn              # 签到
│  └─ getPointsLog         # 积分记录
└─ admin-co/               # 管理相关
   ├─ getDashboard         # 数据统计
   ├─ auditProduct         # 商品审核
   └─ manageUser           # 用户管理
```

---

## 3. 分阶段实施计划

### 阶段一：MVP验证（1-2个月）

#### 3.1 目标

- ✅ 完成基础功能开发
- ✅ 单校试点运行
- ✅ 验证商业模式
- ✅ 获取首批1000日活用户

#### 3.2 功能清单

**P0 核心功能（必须完成）**

| 功能模块 | 优先级 | 工作量(天) | 依赖 |
|----------|--------|-----------|------|
| 用户注册登录 | P0 | 3 | uni-id |
| 商品发布 | P0 | 4 | 云函数 |
| 商品浏览/搜索 | P0 | 5 | 云函数 |
| 商品详情 | P0 | 2 | - |
| 订单创建 | P0 | 4 | uni-pay |
| 支付功能 | P0 | 3 | uni-pay |
| 订单管理 | P0 | 3 | - |
| 消息通知 | P0 | 3 | - |

**P1 重要功能（应该完成）**

| 功能模块 | 优先级 | 工作量(天) | 依赖 |
|----------|--------|-----------|------|
| 商品收藏 | P1 | 2 | - |
| 评论功能 | P1 | 3 | - |
| 个人中心 | P1 | 4 | - |
| 学生认证 | P1 | 3 | - |
| 信用分体系 | P1 | 3 | - |

**P2 可选功能（有时间再做）**

| 功能模块 | 优先级 | 工作量(天) | 依赖 |
|----------|--------|-----------|------|
| 积分签到 | P2 | 2 | - |
| 优惠券 | P2 | 3 | - |
| 分享裂变 | P2 | 4 | - |

#### 3.3 开发计划

**第1-2周：基础搭建**
- Week 1:
  - Day 1-2: 项目初始化，配置开发环境
  - Day 3-4: 集成uni-id，实现微信登录
  - Day 5-7: 用户资料页面，学生认证功能

- Week 2:
  - Day 1-3: 商品分类、发布商品功能
  - Day 4-5: 商品列表、详情页
  - Day 6-7: 图片上传、优化

**第3-4周：交易核心**
- Week 3:
  - Day 1-3: 订单创建、订单列表
  - Day 4-5: 集成uni-pay，实现支付
  - Day 6-7: 支付回调、订单状态流转

- Week 4:
  - Day 1-2: 消息通知系统
  - Day 3-4: 收藏、评论功能
  - Day 5-7: 个人中心完善

**第5-6周：测试上线**
- Week 5:
  - Day 1-3: 功能测试、Bug修复
  - Day 4-5: 性能优化、用户体验优化
  - Day 6-7: 准备上线材料

- Week 6:
  - Day 1-2: 微信小程序审核
  - Day 3-4: 上线试运行
  - Day 5-7: 收集反馈、快速迭代

#### 3.4 验收标准

- [ ] 用户可正常注册、登录
- [ ] 用户可发布、浏览、搜索商品
- [ ] 用户可完成完整的购买流程
- [ ] 支付成功率 > 95%
- [ ] 页面加载时间 < 2秒
- [ ] 核心功能无严重Bug
- [ ] 微信小程序审核通过

---

### 阶段二：功能完善（3-6个月）

#### 3.5 目标

- ✅ 扩展至3-5所高校
- ✅ 日活用户达到5000+
- ✅ 完善营销功能
- ✅ 建立运营体系

#### 3.6 新增功能

**营销功能**
- [ ] 积分体系（签到、交易奖励）
- [ ] 积分商城
- [ ] 优惠券系统
- [ ] 拼团功能
- [ ] 秒杀活动
- [ ] 邀请返利

**社交功能**
- [ ] 关注/粉丝
- [ ] 动态发布（图文）
- [ ] 点赞、评论
- [ ] 私信聊天
- [ ] 用户主页

**运营功能**
- [ ] 数据统计后台
- [ ] 用户画像分析
- [ ] 商品推荐算法
- [ ] 内容审核机制
- [ ] 举报处理

**体验优化**
- [ ] 搜索优化（关键词、筛选）
- [ ] 图片加载优化
- [ ] 缓存策略
- [ ] 消息推送

#### 3.7 技术优化

- [ ] 引入Redis缓存热点数据
- [ ] 数据库索引优化
- [ ] 图片CDN加速
- [ ] 监控告警系统
- [ ] 日志收集分析

---

### 阶段三：架构升级（6-12个月）

#### 3.8 目标

- ✅ 扩展至50+高校
- ✅ 日活用户达到5万+
- ✅ 迁移到Spring Boot
- ✅ 建立技术壁垒

#### 3.9 迁移方案

**迁移策略**

```
阶段1：并行运行（1-2个月）
UniCloud ←→ 数据同步 ←→ Spring Boot
- 新旧系统并行
- 数据双向同步
- 灰度切流

阶段2：逐步迁移（2-3个月）
按模块逐步迁移：
1. 用户模块
2. 商品模块
3. 订单模块
4. 社交模块
5. 营销模块

阶段3：完全切换（1个月）
- 关闭UniCloud
- 全部流量切到Spring Boot
- 监控稳定性
```

**技术选型决策**

| 场景 | 方案 | 说明 |
|------|------|------|
| 日活<10万 | Spring Boot单体 | 架构简单，运维成本低 |
| 日活>10万 | Spring Cloud微服务 | 高可用、易扩展 |
| 数据库 | MySQL 8.0 + 分库分表 | 支持水平扩展 |
| 缓存 | Redis Cluster | 分布式缓存 |
| 消息队列 | RocketMQ | 高性能、高可靠 |

---

### 阶段四：规模化扩展（12个月+）

#### 3.10 目标

- ✅ 覆盖100+高校
- ✅ 日活用户达到20万+
- ✅ 实现盈利
- ✅ 建立生态

#### 3.11 高级功能

- [ ] AI推荐算法
- [ ] 智能客服
- [ ] 直播功能
- [ ] 校园社区
- [ ] 校园招聘
- [ ] 金融服务
- [ ] 开放平台API

---

## 4. 标准作业流程 SOP

### 4.1 开发环境搭建

#### 4.1.1 前端环境

```bash
# 1. 安装Node.js (>= 20)
# 下载：https://nodejs.org/

# 2. 安装pnpm
npm install -g pnpm

# 3. 克隆芋道商城前端
git clone https://github.com/yudaocode/yudao-mall-uniapp.git
cd yudao-mall-uniapp

# 4. 安装依赖
pnpm install

# 5. 配置接口地址
# 编辑 env/.env.development
VITE_SERVER_BASEURL='http://localhost:8080'

# 6. 启动开发
pnpm run dev:h5

# 7. 微信小程序开发
# 使用HBuilderX打开项目
# 运行 -> 运行到小程序模拟器
```

#### 4.1.2 UniCloud环境

```bash
# 1. 在HBuilderX中创建UniCloud服务
# 右键 uniCloud-aliyun -> 关联云服务空间

# 2. 上传云函数
# 右键云函数目录 -> 上传所有云函数

# 3. 初始化数据库
# 在UniCloud Web控制台创建集合

# 4. 配置uni-id
# 编辑 uniCloud-aliyun/cloudfunctions/common/
#          uni-config-center/uni-id/config.json
```

#### 4.1.3 开发工具

- **前端IDE：** HBuilderX / VSCode
- **小程序调试：** 微信开发者工具
- **API调试：** Postman / Apifox
- **代码管理：** Git + GitHub
- **项目管理：** 飞书 / 钉钉

---

### 4.2 开发流程

#### 4.2.1 功能开发流程

```
1. 需求分析
   ↓
2. 技术方案设计
   ↓
3. 数据库设计（如需新表）
   ↓
4. 云函数开发
   ↓
5. 前端页面开发
   ↓
6. 联调测试
   ↓
7. 代码Review
   ↓
8. 提交代码
   ↓
9. 测试环境验证
   ↓
10. 上线
```

#### 4.2.2 代码规范

**命名规范**
```typescript
// 变量命名（小驼峰）
const userInfo = {}
const productList = []

// 常量命名（大写下划线）
const API_BASE_URL = 'https://api.example.com'
const MAX_RETRY_COUNT = 3

// 组件命名（大驼峰）
const ProductCard = () => {}
const UserAvatar = () => {}

// 函数命名（小驼峰）
function getUserInfo() {}
function createOrder() {}

// 数据库集合命名（小写下划线）
uni_id_users
product_categories
```

**文件结构规范**
```
pages/
├─ index/              # 首页
│  ├─ index.vue        # 页面
│  └─ index.ts         # 逻辑
├─ product/            # 商品
│  ├─ list.vue         # 列表
│  ├─ detail.vue       # 详情
│  └─ publish.vue      # 发布
└─ user/               # 用户
   ├─ center.vue       # 个人中心
   ├─ login.vue        # 登录
   └─ profile.vue      # 资料

components/            # 公共组件
├─ ProductCard.vue     # 商品卡片
├─ UserAvatar.vue      # 用户头像
└─ Loading.vue         # 加载组件

uniCloud-aliyun/
└─ cloudfunctions/
   ├─ product-co/      # 商品云函数
   ├─ order-co/        # 订单云函数
   └─ user-co/         # 用户云函数
```

---

### 4.3 代码提交规范

```bash
# Commit Message格式
<type>(<scope>): <subject>

# type类型
feat:     新功能
fix:      修复bug
docs:     文档更新
style:    代码格式（不影响代码运行）
refactor: 重构
test:     测试相关
chore:    构建过程或辅助工具的变动

# 示例
feat(product): 添加商品发布功能
fix(order): 修复订单支付状态更新问题
docs(readme): 更新部署文档
refactor(user): 重构用户认证逻辑
```

---

### 4.4 数据库操作规范

```typescript
// 云函数中操作数据库
const db = uniCloud.database()

// 查询
async function getProductList(params) {
  const { page = 1, size = 10 } = params
  const res = await db.collection('products')
    .where({ status: 1 })
    .orderBy('create_date', 'desc')
    .skip((page - 1) * size)
    .limit(size)
    .get()
  return res.result
}

// 插入
async function createProduct(data) {
  return await db.collection('products').add({
    ...data,
    create_date: new Date(),
    update_date: new Date(),
  })
}

// 更新
async function updateProduct(id, data) {
  return await db.collection('products')
    .doc(id)
    .update({
      ...data,
      update_date: new Date(),
    })
}

// 删除（软删除）
async function deleteProduct(id) {
  return await db.collection('products')
    .doc(id)
    .update({ status: 0 })
}
```

---

### 4.5 API调用规范

```typescript
// 统一API封装
import { http } from '@/utils/http'

// GET请求
export function getProductList(params) {
  return http.get('/product/getProductList', params)
}

// POST请求
export function createOrder(data) {
  return http.post('/order/createOrder', data)
}

// 错误处理
http.interceptors.response.use(
  (response) => {
    if (response.code === 0) {
      return response.data
    } else {
      uni.showToast({
        title: response.msg || '请求失败',
        icon: 'none'
      })
      return Promise.reject(response)
    }
  },
  (error) => {
    uni.showToast({
      title: '网络异常',
      icon: 'none'
    })
    return Promise.reject(error)
  }
)
```

---

## 5. 技术规范 SPEC

### 5.1 前端技术规范

#### 5.1.1 Vue3组合式API规范

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Product } from '@/types/product'

// 响应式数据
const productList = ref<Product[]>([])
const loading = ref(false)

// 计算属性
const total = computed(() => productList.value.length)

// 方法
async function fetchProducts() {
  loading.value = true
  try {
    const res = await getProductList({ page: 1, size: 10 })
    productList.value = res.list
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchProducts()
})
</script>
```

#### 5.1.2 TypeScript类型规范

```typescript
// 定义类型
export interface Product {
  id: string
  sellerId: string
  title: string
  price: number
  images: string[]
  status: ProductStatus
  createDate: Date
}

export enum ProductStatus {
  OFF_SHELF = 0,    // 下架
  ON_SHELF = 1,     // 上架
  SOLD = 2,         // 已售
}

export interface ProductListParams {
  page: number
  size: number
  keyword?: string
  categoryId?: string
}

export interface ProductListResult {
  list: Product[]
  total: number
}
```

#### 5.1.3 组件开发规范

```vue
<script setup lang="ts">
import type { Product } from '@/types/product'

// Props定义
interface Props {
  product: Product
  showSeller?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSeller: false
})

// Emits定义
interface Emits {
  (e: 'click', product: Product): void
  (e: 'favorite', productId: string): void
}

const emit = defineEmits<Emits>()

function handleClick() {
  emit('click', props.product)
}
</script>

<template>
  <view class="product-card" @click="handleClick">
    <image :src="product.images[0]" mode="aspectFill" />
    <view class="product-info">
      <text class="title">{{ product.title }}</text>
      <text class="price">¥{{ product.price }}</text>
    </view>
  </view>
</template>

<style scoped>
.product-card {
  padding: 20rpx;
  background: #fff;
  border-radius: 12rpx;
}
</style>
```

---

### 5.2 云函数技术规范

```typescript
// 云函数标准模板
'use strict';

const db = uniCloud.database()

exports.main = async (event, context) => {
  const { action, params } = event
  
  // 路由分发
  const actions = {
    getList: getProductList,
    getDetail: getProductDetail,
    create: createProduct,
    update: updateProduct,
    delete: deleteProduct,
  }
  
  if (!actions[action]) {
    return {
      code: -1,
      msg: 'action不存在'
    }
  }
  
  try {
    const result = await actions[action](params, context)
    return {
      code: 0,
      msg: 'success',
      data: result
    }
  } catch (error) {
    return {
      code: -1,
      msg: error.message || '操作失败'
    }
  }
}

// 具体业务函数
async function getProductList(params, context) {
  const { page = 1, size = 10, keyword } = params
  
  let query = { status: 1 }
  if (keyword) {
    query.title = new RegExp(keyword, 'i')
  }
  
  const res = await db.collection('products')
    .where(query)
    .orderBy('create_date', 'desc')
    .skip((page - 1) * size)
    .limit(size)
    .get()
  
  const total = await db.collection('products')
    .where(query)
    .count()
  
  return {
    list: res.data,
    total: total.total
  }
}
```

---

### 5.3 数据库设计规范

#### 5.3.1 字段规范

- **主键：** `_id` (ObjectId)
- **外键：** `xxx_id` (ObjectId)
- **时间字段：** `create_date`, `update_date`, `delete_date` (Date)
- **状态字段：** `status` (Number)，0表示禁用/下架，1表示启用/上架
- **金额字段：** 使用Number类型，单位：元
- **布尔字段：** `is_xxx` (Boolean)

#### 5.3.2 索引规范

```javascript
// 必须创建索引
db.collection('products').createIndex({
  seller_id: 1,        // 卖家ID索引
  status: 1,           // 状态索引
  create_date: -1,     // 创建时间倒序索引
})

db.collection('products').createIndex({
  title: 'text',       // 全文搜索索引
})

db.collection('orders').createIndex({
  buyer_id: 1,
  seller_id: 1,
  order_no: 1,         // 订单号唯一索引
})
```

---

### 5.4 安全规范

#### 5.4.1 权限控制

```typescript
// 云函数权限校验
async function checkAuth(context, requiredRole) {
  const token = context.headers['token']
  if (!token) {
    throw new Error('未登录')
  }
  
  const user = await db.collection('uni-id-users')
    .where({ token: token })
    .getOne()
  
  if (!user) {
    throw new Error('登录已过期')
  }
  
  if (requiredRole && user.role < requiredRole) {
    throw new Error('权限不足')
  }
  
  return user
}
```

#### 5.4.2 数据校验

```typescript
// 使用Joi进行数据校验
const Joi = require('joi')

const productSchema = Joi.object({
  title: Joi.string().required().max(100),
  description: Joi.string().max(500),
  price: Joi.number().required().min(0.01),
  images: Joi.array().items(Joi.string()).max(9),
  categoryId: Joi.string().required(),
  condition: Joi.string().valid('new', 'like_new', 'used'),
})

function validateProduct(data) {
  const { error } = productSchema.validate(data)
  if (error) {
    throw new Error(error.message)
  }
}
```

---

### 5.5 性能优化规范

#### 5.5.1 图片优化

- 图片压缩：上传前压缩至200KB以内
- 使用CDN：所有图片走CDN加速
- 懒加载：列表页图片使用懒加载
- WebP格式：支持WebP格式优先加载

```typescript
// 图片压缩
export function compressImage(filePath, maxSize = 200) {
  return new Promise((resolve) => {
    uni.compressImage({
      src: filePath,
      quality: 80,
      success: (res) => {
        resolve(res.tempFilePath)
      }
    })
  })
}
```

#### 5.5.2 分页加载

```typescript
// 分页加载
export function usePagination(fetchFn) {
  const list = ref([])
  const page = ref(1)
  const size = ref(10)
  const loading = ref(false)
  const hasMore = ref(true)
  
  async function loadMore() {
    if (loading.value || !hasMore.value) return
    
    loading.value = true
    try {
      const res = await fetchFn({ page: page.value, size: size.value })
      list.value.push(...res.list)
      hasMore.value = res.list.length === size.value
      page.value++
    } finally {
      loading.value = false
    }
  }
  
  return { list, loadMore, hasMore, loading }
}
```

---

## 6. 质量保证体系

### 6.1 测试策略

#### 6.1.1 单元测试

```typescript
// 使用vitest进行单元测试
import { describe, it, expect } from 'vitest'
import { formatPrice } from '@/utils/format'

describe('formatPrice', () => {
  it('should format price correctly', () => {
    expect(formatPrice(100)).toBe('¥100.00')
    expect(formatPrice(99.9)).toBe('¥99.90')
  })
  
  it('should handle invalid input', () => {
    expect(formatPrice(null)).toBe('¥0.00')
    expect(formatPrice(undefined)).toBe('¥0.00')
  })
})
```

#### 6.1.2 集成测试

```typescript
// 云函数集成测试
async function testCreateOrder() {
  const result = await uniCloud.callFunction({
    name: 'order-co',
    data: {
      action: 'create',
      params: {
        productId: 'test_product_id',
        amount: 100
      }
    }
  })
  
  expect(result.result.code).toBe(0)
  expect(result.result.data.orderId).toBeDefined()
}
```

#### 6.1.3 E2E测试

```typescript
// 使用Playwright进行E2E测试
test('用户购买流程', async ({ page }) => {
  await page.goto('/pages/product/list')
  await page.click('.product-card')
  await page.click('.buy-button')
  await page.fill('.address-form', '测试地址')
  await page.click('.submit-order')
  await expect(page.locator('.payment-success')).toBeVisible()
})
```

---

### 6.2 代码审查

#### 6.2.1 Code Review清单

- [ ] 代码是否符合编码规范
- [ ] 是否有明显的性能问题
- [ ] 是否有安全隐患
- [ ] 错误处理是否完善
- [ ] 日志是否充分
- [ ] 是否有冗余代码
- [ ] 命名是否清晰
- [ ] 注释是否充分

---

### 6.3 监控告警

#### 6.3.1 性能监控

```typescript
// 性能埋点
export function trackPerformance(page) {
  const startTime = Date.now()
  
  uni.onPageNotFound(() => {
    const duration = Date.now() - startTime
    reportMetric('page_load_time', { page, duration })
  })
  
  return () => {
    const duration = Date.now() - startTime
    reportMetric('page_render_time', { page, duration })
  }
}

// 上报指标
function reportMetric(name, data) {
  uni.request({
    url: 'https://monitor.example.com/api/metrics',
    method: 'POST',
    data: { name, data, timestamp: Date.now() }
  })
}
```

#### 6.3.2 错误监控

```typescript
// 全局错误捕获
Vue.config.errorHandler = (err, vm, info) => {
  reportError({
    error: err.message,
    stack: err.stack,
    component: vm.$options.name,
    info
  })
}

// 上报错误
function reportError(errorInfo) {
  uni.request({
    url: 'https://monitor.example.com/api/errors',
    method: 'POST',
    data: errorInfo
  })
}
```

---

## 7. 风险管理

### 7.1 技术风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| UniCloud性能瓶颈 | 高 | 中 | 提前规划迁移到Spring Boot |
| 微信审核不通过 | 高 | 低 | 提前了解审核规范，预留审核时间 |
| 支付接口异常 | 高 | 低 | 接入备用支付渠道 |
| 数据丢失 | 极高 | 极低 | 定期备份，异地备份 |

### 7.2 业务风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 用户增长缓慢 | 高 | 中 | 制定运营计划，加大推广力度 |
| 竞品抄袭 | 中 | 中 | 加快迭代速度，建立用户壁垒 |
| 校园政策变化 | 高 | 低 | 与学校保持良好关系，合规运营 |
| 交易纠纷 | 中 | 中 | 建立完善的客服体系 |

### 7.3 法律风险

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| 用户隐私泄露 | 极高 | 低 | 严格遵守《个人信息保护法》 |
| 支付牌照问题 | 极高 | 低 | 使用uni-pay等合规支付方案 |
| 内容违规 | 高 | 中 | 建立内容审核机制 |
| 知识产权纠纷 | 高 | 低 | 使用MIT协议开源项目 |

---

## 8. 里程碑与交付物

### 8.1 MVP阶段里程碑

| 时间 | 里程碑 | 交付物 |
|------|--------|--------|
| Week 1 | 环境搭建完成 | 开发环境配置文档、项目初始化完成 |
| Week 2 | 用户系统完成 | 注册登录功能、学生认证功能 |
| Week 3 | 商品功能完成 | 商品发布、浏览、搜索功能 |
| Week 4 | 交易核心完成 | 订单、支付功能 |
| Week 5 | 功能完善 | 收藏、评论、个人中心 |
| Week 6 | 上线试运行 | 微信小程序上线、用户反馈收集 |

### 8.2 交付物清单

**文档类**
- [ ] 需求文档
- [ ] 技术设计文档
- [ ] 数据库设计文档
- [ ] API接口文档
- [ ] 部署文档
- [ ] 用户手册
- [ ] 运维手册

**代码类**
- [ ] 前端代码（UniApp）
- [ ] 云函数代码
- [ ] 数据库脚本
- [ ] 测试代码
- [ ] 配置文件

**其他**
- [ ] 微信小程序上架
- [ ] 产品演示视频
- [ ] 培训材料

---

## 附录

### A. 参考资料

- [芋道商城文档](https://doc.iocoder.cn)
- [UniApp官方文档](https://uniapp.dcloud.net.cn)
- [UniCloud文档](https://uniapp.dcloud.net.cn/uniCloud/README.html)
- [uni-id文档](https://uniapp.dcloud.net.cn/uniCloud/uni-id.html)
- [uni-pay文档](https://uniapp.dcloud.net.cn/uniCloud/uni-pay.html)

### B. 常用工具

- **API调试：** Apifox、Postman
- **数据库管理：** MongoDB Compass
- **性能分析：** Chrome DevTools
- **代码质量：** ESLint、Prettier
- **项目管理：** 飞书项目、Teambition

### C. 联系方式

- **项目负责人：** [待填写]
- **技术支持：** [待填写]
- **微信群：** [待建立]

---

**文档版本：** v1.0  
**最后更新：** 2025-01  
**维护人：** SchoolBuzzMate Team

---

© 2025 SchoolBuzzMate Team. All rights reserved.
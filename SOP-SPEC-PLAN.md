# SchoolBuzzMate (校趣闪搭) 完整 SOP-SPEC-PLAN

> **项目名称：** SchoolBuzzMate - 校园社交交易平台
> **技术基座：** yudao-mall-uniapp（前端复用参考） + UniCloud（MVP后端） → Spring Boot/Cloud（成熟期）
> **文档版本：** v3.0 (合并版)
> **创建日期：** 2026-06-05
> **适用环境：** Windows 11 + HBuilderX + 微信开发者工具

---

## 目录

- [1. 项目概述与选型决策](#1-项目概述与选型决策)
- [2. 技术架构设计](#2-技术架构设计)
- [3. 数据库与云函数设计](#3-数据库与云函数设计)
- [4. 分阶段实施计划](#4-分阶段实施计划)
- [5. 标准作业流程 SOP](#5-标准作业流程-sop)
- [6. 技术规范 SPEC](#6-技术规范-spec)
- [7. CLI 工具链](#7-cli-工具链)
- [8. Claude Code 自动化](#8-claude-code-自动化)
- [9. 质量保证体系](#9-质量保证体系)
- [10. 风险管理](#10-风险管理)
- [11. 里程碑与交付物](#11-里程碑与交付物)
- [附录](#附录)

---

## 1. 项目概述与选型决策

### 1.1 项目定位

**SchoolBuzzMate** 是面向高校学生的校园社交交易平台：

| 核心功能 | 描述 |
|----------|------|
| 🎯 二手交易 | 教材、数码、生活用品等校园内 C2C 交易 |
| 💬 社交互动 | 评论、点赞、关注、私信 |
| 🎁 营销裂变 | 优惠券、积分、拼团 |
| 📱 多端支持 | 微信小程序（主）、H5、APP（后期） |

### 1.2 目标用户与商业模式

| 阶段 | 时间 | 目标 | 盈利模式 |
|------|------|------|----------|
| MVP验证 | 1-2个月 | 单校日活1000 | 免费获取用户 |
| 功能完善 | 3-6个月 | 3-5所高校 | 交易手续费(3-5%) |
| 规模化 | 6-12个月 | 50+高校 | 会员订阅、广告投放 |
| 商业化 | 12个月+ | 100+高校 | 增值服务、数据服务 |

### 1.3 技术选型决策

**核心矛盾：没有任何开源仓库同时支持 UniCloud + Spring Boot 双架构。**

| 仓库 | Stars | 电商功能 | UniCloud | SpringBoot | 协议 | 推荐度 |
|------|-------|---------|-----------|------------|------|--------|
| **yudao-mall-uniapp** | 1.2k | ⭐⭐⭐⭐⭐ | ❌ | ✅ | MIT | 🥇 **首选参考** |
| JeecgUniapp | 1.6k | ❌ | ❌ | ❌ | Apache | 🥈 工程化参考 |
| mall4j | 5.1k | ⭐⭐⭐⭐ | ❌ | ✅ | AGPL | ⚠️ 协议风险 |

**选型理由：**
1. **MIT 协议** — 永久开源、无商业版、二次开发无法律风险
2. **最完整电商前端** — 覆盖校园交易 80% 场景
3. **双后端架构** — 支持 Spring Boot 单体和 Spring Cloud 微服务
4. **改造可行** — 前端页面可参考，后端 API 接口可对等翻译为 UniCloud 云函数

**工程化参考（来自 JeecgUniapp）：**
- TypeScript 类型系统
- Pinia 状态管理
- UnoCSS 原子化CSS
- ESLint + Prettier + Husky 代码规范

---

## 2. 技术架构设计

### 2.1 总体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端展示层                                 │
│  UniApp X (Vue3 + UTS + Vite5 + Pinia + UnoCSS)             │
│  ├─ 微信小程序 (主)  ├─ H5  ├─ APP                          │
│  └─ brutalist 设计系统 + 自定义校园主题组件                   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   统一 API 接口抽象层   │
              │   与后端无关的接口定义   │
              └───────┬───────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────────┐
│  MVP: UniCloud    │    │  成熟期: Spring Boot  │
│  ├─ uni-id (认证)  │    │  ├─ Sa-Token (认证)   │
│  ├─ uni-pay (支付) │    │  ├─ 微信支付           │
│  ├─ 云函数 (业务)  │    │  ├─ REST API (业务)   │
│  └─ 云数据库(Mongo)│    │  └─ MySQL + Redis     │
└──────────────────┘    └──────────────────────┘
```

### 2.2 MVP阶段技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | UniApp X | 最新 | UTS 类型安全开发 |
| 语言 | Vue3 + **UTS** | - | DCloud 类型系统 |
| 构建工具 | Vite | 5.x | 快速构建 |
| 状态管理 | Pinia | 2.x | 轻量级状态管理 |
| CSS方案 | UnoCSS | 最新 | 原子化CSS |
| 云开发 | UniCloud | 阿里云/支付宝云 | MVP快速验证 |
| 认证 | uni-id | 最新 | 统一身份认证 |
| 支付 | uni-pay | 最新 | 统一支付 |
| 数据库 | UniCloud DB | MongoDB | 云数据库 |

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

### 2.4 API 抽象层设计（核心！）

实现"前端无感切换后端"的关键：

```typescript
// MVP阶段: UniCloud 实现
export function getProductList(params: ProductListParams): Promise<ProductListResult> {
  return uniCloud.callFunction({
    name: 'product-co',
    data: { action: 'getList', params }
  }).then(res => res.result.data)
}

// 后期: Spring Boot 实现（接口签名保持一致！）
// export function getProductList(params: ProductListParams): Promise<ProductListResult> {
//   return http.get('/product-api/product/list', params)
// }
```

---

## 3. 数据库与云函数设计

### 3.1 核心数据库集合（12个）

```javascript
// 1. products — 商品
{
  _id: ObjectId,
  seller_id: ObjectId,        // 卖家ID
  school_id: ObjectId,        // 所属学校
  category_id: ObjectId,      // 分类ID
  title: String,
  description: String,
  images: [String],
  original_price: Number,
  price: Number,
  condition: String,          // 'brand_new'|'like_new'|'used'|'old'
  trade_method: String,       // 'self_pickup'|'express'|'both'
  status: Number,             // 0下架 1上架 2已售 3审核中
  view_count: Number,
  like_count: Number,
  create_date: Date,
}

// 2. orders — 订单
{
  _id: ObjectId,
  order_no: String,
  buyer_id: ObjectId,
  seller_id: ObjectId,
  product_id: ObjectId,
  product_snapshot: Object,   // 商品快照
  amount: Number,
  pay_amount: Number,
  status: Number,             // 0待支付 1待发货 2待收货 3完成 4取消 5退款
  trade_method: String,
  address: Object,            // 收货地址（快递）
  create_date: Date,
}

// 3-12: comments, favorites, messages, coupons, user_coupons,
//       points_log, groups, group_users, follows, reports
```

### 3.2 云函数设计（7组）

```
uniCloud/cloudfunctions/
├─ uni-id-co/                 # uni-id 官方云函数
├─ uni-pay-co/                # uni-pay 官方云函数
├─ product-co/                # 商品服务
│  └─ index.obj.js
│     actions: getList, getDetail, create, update, delete, search
├─ order-co/                  # 订单服务
│  └─ index.obj.js
│     actions: create, getList, getDetail, cancel, confirmReceive
├─ payment-co/                # 支付服务
│  └─ index.obj.js
│     actions: createPayment, paymentCallback, queryPayment
├─ social-co/                 # 社交服务
│  └─ index.obj.js
│     actions: createComment, toggleFavorite, sendMessage
├─ marketing-co/              # 营销服务
│  └─ index.obj.js
│     actions: getCoupons, checkIn, getPointsLog
├─ school-co/                 # 学校服务
│  └─ index.obj.js
│     actions: getSchoolList, verifyStudent
└─ admin-co/                  # 管理服务
   └─ index.obj.js
      actions: getDashboard, auditProduct, manageUser
```

---

## 4. 分阶段实施计划

### 阶段零：环境准备（已完成）

- [x] 获取 yudao-mall-uniapp 源码
- [x] 配置 HBuilderX CLI
- [x] 配置微信开发者工具 CLI
- [x] 创建 UniCloud 服务空间
- [x] 初始化项目骨架

### 阶段一：MVP 验证（当前阶段，6-8周）

#### 第1-2周：用户系统
| 功能 | 状态 | 说明 |
|------|------|------|
| 微信授权登录 | ⏳ | uni-id 集成 |
| 用户资料页 | ⏳ | 学校/学号/认证状态 |
| 学生认证 | ⏳ | 上传学生证+审核 |
| 学校选择与切换 | ⏳ | 多学校支持 |

#### 第3周：商品系统
| 功能 | 状态 | 说明 |
|------|------|------|
| 商品发布 | ⏳ | 去掉SKU，简化表单 |
| 商品列表 | ⏳ | 学校过滤+分类筛选 |
| 商品详情 | ⏳ | 卖家信息卡片 |
| 商品搜索 | ⏳ | 关键词+学校范围 |

#### 第4周：交易核心
| 功能 | 状态 | 说明 |
|------|------|------|
| 订单创建 | ⏳ | 简化流程（无购物车） |
| 微信支付 | ⏳ | uni-pay 集成 |
| 订单管理 | ⏳ | 买家/卖家双视角 |
| 订单详情 | ⏳ | 状态流转+操作 |

#### 第5-6周：社交与完善
| 功能 | 状态 |
|------|------|
| 商品收藏 | ⏳ |
| 评论功能 | ⏳ |
| 个人中心 | ⏳ |
| 基础消息通知 | ⏳ |

#### 第7-8周：测试与上线
- 微信小程序审核
- 上线试运行
- 收集反馈

### 阶段二：功能完善（3-6个月）

**营销功能（复用 yudao-mall 设计）**
- [ ] 积分商城
- [ ] 优惠券体系
- [ ] 拼团功能
- [ ] 限时秒杀
- [ ] 邀请返利

**社交功能**
- [ ] 关注/粉丝
- [ ] 私信聊天
- [ ] 用户主页/动态

**运营功能**
- [ ] 管理后台
- [ ] 数据统计
- [ ] 内容审核

### 阶段三：架构升级（6-12个月）

```
过渡期（1-3个月）：双系统并行
┌─────────┐         ┌──────────────┐
│ UniCloud │ ←同步→ │ Spring Boot  │
│ (在线)   │         │ (灰度切流)    │
└─────────┘         └──────────────┘
       ↑                    ↑
       └──── 前端统一API层 ──┘
```

**迁移步骤：**
1. 搭建 Spring Boot 项目
2. 按模块迁移（用户→商品→订单→社交→营销）
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

### 5.1 开发环境启动

```powershell
# 1. 安装依赖
pnpm install

# 2. H5 开发
pnpm run dev:h5

# 3. 微信小程序开发
pnpm run dev:mp-weixin

# 4. 一键启动（编译 + 打开 DevTools）
powershell -File ./scripts/dev.ps1
```

### 5.2 功能开发流程

```
1. 需求确认 → 创建 Feature Issue
2. 从 develop 创建 feature/xxx 分支
3. 如需新数据表 → 先在 UniCloud 控制台创建集合
4. 如需新云函数 → 创建云函数目录并本地调试
5. 开发前端页面 → 本地测试
6. 联调（前端 + 云函数）
7. 代码自检：ESLint + TypeScript 类型检查
8. 提交 PR → Code Review → 合并到 develop
9. 部署到测试环境验证
10. 合并到 main → 打 Tag → 发布
```

### 5.3 分支管理

```
main              ← 生产环境
├─ develop        ← 开发主线
│  ├─ feature/user-auth
│  ├─ feature/product-list
│  └─ feature/order-create
├─ release/v1.0
└─ hotfix/xxx
```

### 5.4 Commit 规范

```
<type>(<scope>): <subject>

# type 类型
feat:     新功能
fix:      修复 Bug
refactor: 重构
docs:     文档更新
style:    代码格式
test:     测试
chore:    构建/工具

# 示例
feat(product): 实现商品列表页面
fix(order): 修复订单支付回调状态更新
```

---

## 6. 技术规范 SPEC

### 6.1 UTS 类型规范

```typescript
// types/product.uts

type ProductCondition = 'brand_new' | 'like_new' | 'used' | 'old'
type TradeMethod = 'self_pickup' | 'express' | 'both'

type Product = {
  _id: string
  seller_id: string
  school_id: string
  title: string
  price: number
  condition: ProductCondition
  status: number
  create_date: string
}

type ProductListParams = {
  page: number
  size: number
  school_id?: string
  keyword?: string
  sort?: 'newest' | 'price_asc' | 'price_desc'
}

type ProductListResult = {
  list: Product[]
  total: number
}
```

### 6.2 云函数标准模板

```javascript
// product-co/index.obj.js
'use strict'

const db = uniCloud.database()

exports.main = async (event, context) => {
  const { action, params = {} } = event

  const actions = {
    getList: async (p) => {
      const { page = 1, size = 10 } = p
      const res = await db.collection('products')
        .where({ status: 1 })
        .orderBy('create_date', 'desc')
        .skip((page - 1) * size)
        .limit(size)
        .get()
      const count = await db.collection('products').where({ status: 1 }).count()
      return { list: res.data, total: count.total }
    },
    // ... 其他 actions
  }

  if (!actions[action]) {
    return { code: -1, msg: `未知操作: ${action}` }
  }

  try {
    const result = await actions[action](params)
    return { code: 0, msg: 'success', data: result }
  } catch (error) {
    return { code: -1, msg: error.message }
  }
}
```

### 6.3 安全规范

```javascript
// 权限校验公共模块
function requireAuth(context) {
  const user = context.UNIID_USER
  if (!user || !user._id) {
    throw new Error('请先登录')
  }
  return user
}

async function requireOwner(context, collection, docId, ownerField = 'seller_id') {
  const user = requireAuth(context)
  const doc = await db.collection(collection).doc(docId).get()
  if (doc.data[0][ownerField] !== user._id) {
    throw new Error('无权操作此资源')
  }
  return { user, doc: doc.data[0] }
}
```

---

## 7. CLI 工具链

### 7.1 工具清单

| 工具 | 路径 | 用途 |
|------|------|------|
| HBuilderX | `E:\HbuilderX\HBuilderX\` | 云函数开发/部署 |
| 微信 DevTools | `E:\Tencent微信web开发者工具\微信web开发者工具\` | 小程序调试 |

### 7.2 快速命令

```powershell
# HBuilderX CLI
& "E:\HbuilderX\HBuilderX\cli.exe" project open --path .

# 微信 DevTools CLI
$WX = "E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat"
& $WX open --project ".\dist\dev\mp-weixin"
& $WX preview --project ".\dist\dev\mp-weixin"
& $WX upload --project ".\dist\build\mp-weixin" -v "1.0.0" -d "发布说明"
```

---

## 8. Claude Code 自动化

### 8.1 已配置 Skills

| Skill | 用途 |
|-------|------|
| `wechat-dev-cycle` | 编译→打开DevTools→预览 |
| `unicloud-deploy` | 分析变更并部署云函数 |
| `schoolbuzz-scaffold` | 快速生成页面+云函数骨架 |

### 8.2 推荐配置

```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [
      {
        "tool": "Edit",
        "command": "npx eslint --fix $CLAUDE_EDITED_FILE"
      }
    ]
  }
}
```

---

## 9. 质量保证体系

### 9.1 PR 检查清单

- [ ] TypeScript 类型检查通过
- [ ] ESLint 无错误
- [ ] 微信小程序构建成功
- [ ] 云函数已上传测试环境
- [ ] 手动测试核心流程
- [ ] PR 描述包含截图

### 9.2 测试策略

**云函数测试：**
```javascript
describe('product-co.getList', () => {
  it('应返回商品列表', async () => {
    const result = await getList({ page: 1, size: 10 })
    expect(result.list).toBeDefined()
    expect(result.list.length).toBeLessThanOrEqual(10)
  })
})
```

---

## 10. 风险管理

### 10.1 技术风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| UniCloud 性能瓶颈 | 高 | 中 | 预留迁移方案 |
| uni-pay 适配问题 | 高 | 低 | 提前测试支付全流程 |
| 微信小程序审核不通过 | 高 | 中 | 了解审核规则 |

### 10.2 业务风险

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|----------|
| 用户增长缓慢 | 高 | 中 | 校园地推+社团合作 |
| 交易纠纷 | 高 | 中 | 学生认证+信用分+客服 |

### 10.3 退化策略

**如果 UniCloud MVP 验证失败：**
- 直接跳到 Spring Boot 方案
- 保留前端改造成果

---

## 11. 里程碑与交付物

### 11.1 里程碑总览

| 里程碑 | 时间 | 交付物 |
|--------|------|--------|
| M0：环境就绪 | ✅ 已完成 | 项目骨架+UniCloud配置 |
| M1：用户系统 | 第2周 | 注册登录+学生认证 |
| M2：商品系统 | 第3周 | 商品发布/列表/详情 |
| M3：交易闭环 | 第4周 | 订单+支付 |
| M4：MVP 上线 | 第6-8周 | 微信小程序上线 |
| M5：功能完善 | 3-6月 | 营销+社交+后台 |
| M6：架构升级 | 6-12月 | Spring Boot迁移 |

### 11.2 当前状态

- ✅ **M0 环境就绪** 已完成
- ⏳ **M1 用户系统** 待开发
- 📋 下一步：实现微信授权登录 + uni-id 集成

---

## 附录

### A. 参考资源

| 资源 | 链接 |
|------|------|
| yudao-mall-uniapp | https://github.com/yudaocode/yudao-mall-uniapp |
| UniCloud 文档 | https://uniapp.dcloud.net.cn/uniCloud/ |
| uni-id 文档 | https://uniapp.dcloud.net.cn/uniCloud/uni-id.html |
| uni-pay 文档 | https://uniapp.dcloud.net.cn/uniCloud/uni-pay.html |

### B. 项目目录

| 目录 | 说明 |
|------|------|
| `SchoolBuzzUniAPP` | 文档中心（本文件） |
| `SchoolBuzzUniAppX/SchoolBuzzUniappXuts/SchoolBuzzMate` | 主实现（UniApp X + UTS） |
| `SchoolBuzzTaro` | 备选方案（Taro + React） |
| `yudao-ui-admin-uniapp-2026.05` | 前端复用基座 |

---

**文档版本：** v3.0 (合并版)
**最后更新：** 2026-06-05
**维护人：** SchoolBuzzMate Team
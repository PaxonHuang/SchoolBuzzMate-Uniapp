# M2 商品系统设计文档

> **项目：** SchoolBuzzMate - 校园社交交易平台
> **模块：** 商品系统 (M2)
> **日期：** 2026-06-07
> **状态：** 待实现

---

## 1. 设计决策摘要

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 详情页布局 | 社交动态风格 | 校园场景社交感强，信任背书更好 |
| 分类系统 | 固定 6 分类 | MVP 简化，覆盖 90%+ 校园交易场景 |
| 上架审核 | 无审核 | 发布即上架，举报机制兜底 |
| 发布表单 | 标准发布 (6张图) | 信息完整，包含原价+交易方式 |

---

## 2. 固定分类定义

| 分类 ID | 名称 | 图标 | 适用场景 |
|---------|------|------|----------|
| `textbook` | 教材资料 | 📚 | 教材、参考书、笔记、考研资料 |
| `digital` | 数码电子 | 📱 | 手机、电脑、耳机、相机、配件 |
| `clothing` | 服饰鞋包 | 👔 | 衣服、鞋子、包包、配饰 |
| `daily` | 生活用品 | 🏠 | 日用品、小家电、文具、装饰 |
| `sports` | 运动户外 | 🏃 | 运动器材、户外装备、健身用品 |
| `other` | 其他杂项 | 🎨 | 不属于以上分类的物品 |

---

## 3. 数据库 Schema

### 3.1 products 集合

```javascript
{
  _id: ObjectId,
  seller_id: ObjectId,           // 卖家 ID（关联 school_users._id）
  school_id: ObjectId,           // 所属学校（关联 schools._id）
  category: String,              // 分类: 'textbook'|'digital'|'clothing'|'daily'|'sports'|'other'
  title: String,                 // 商品标题（必填，最长 50 字）
  description: String,           // 详细描述（必填，最长 500 字）
  images: [String],              // 图片 URL 数组（1-6 张，第一张为封面）
  original_price: Number,        // 原价（可选）
  price: Number,                 // 售价（必填，>0）
  condition: String,             // 成色: 'brand_new'|'like_new'|'used'|'old'
  trade_method: [String],        // 交易方式: ['self_pickup']|['express']|['self_pickup','express']
  location: String,              // 自提地点描述（如"西操场"、"图书馆门口"）
  status: Number,                // 状态: 0=下架, 1=上架, 2=已售
  view_count: Number,            // 浏览数（默认 0）
  like_count: Number,            // 点赞数（默认 0）
  comment_count: Number,         // 评论数（默认 0）
  publish_time: Date,            // 发布时间（用于显示"3小时前"等）
  create_date: Date,             // 创建时间
  update_date: Date,             // 更新时间
}
```

### 3.2 成色定义

| 值 | 显示名称 | 描述 |
|----|----------|------|
| `brand_new` | 全新 | 未使用，包装完好 |
| `like_new` | 几乎全新 | 使用极少，无明显痕迹 |
| `used` | 已使用 | 正常使用痕迹，功能完好 |
| `old` | 较旧 | 使用痕迹明显，功能正常 |

---

## 4. 云函数设计

### 4.1 product-co 云函数

**文件路径：** `uniCloud-aliyun/cloudfunctions/product-co/index.obj.js`

**Actions：**

#### getList - 商品列表

```javascript
// 入参
{
  action: 'getList',
  params: {
    page: Number,           // 页码，默认 1
    size: Number,           // 每页条数，默认 10
    school_id: String,      // 学校 ID（可选，默认当前用户学校）
    category: String,       // 分类筛选（可选）
    condition: String,      // 成色筛选（可选）
    sort: String,           // 排序: 'newest'|'price_asc'|'price_desc'（默认 newest）
    status: Number,         // 状态筛选（可选，默认 1=上架）
  }
}

// 返回
{
  code: 0,
  msg: 'success',
  data: {
    list: [
      {
        _id, title, price, condition, category,
        images: [封面图],
        seller: { _id, nickname, avatar },
        like_count, view_count, publish_time,
        is_liked: Boolean,  // 当前用户是否已点赞
      }
    ],
    total: Number,
  }
}
```

#### getDetail - 商品详情

```javascript
// 入参
{
  action: 'getDetail',
  params: { product_id: String }
}

// 返回
{
  code: 0,
  msg: 'success',
  data: {
    product: { /* 完整商品信息 */ },
    seller: {
      _id, nickname, avatar, credit_score,
      school_name, college,  // 学校、学院
      product_count,         // 在售商品数
    },
    is_liked: Boolean,       // 当前用户是否已点赞
    is_owner: Boolean,       // 当前用户是否是卖家
  }
}
```

#### create - 发布商品

```javascript
// 入参（需登录）
{
  action: 'create',
  params: {
    title: String,           // 必填
    description: String,     // 必填
    images: [String],        // 必填，1-6张
    price: Number,           // 必填
    original_price: Number,  // 可选
    category: String,        // 必填
    condition: String,       // 必填
    trade_method: [String],  // 必填
    location: String,        // 自提时必填
  }
}

// 返回
{
  code: 0,
  msg: 'success',
  data: { product: { /* 新创建的商品 */ } }
}
```

#### update - 编辑商品

```javascript
// 入参（需登录 + 所有者校验）
{
  action: 'update',
  params: {
    product_id: String,
    // 可更新字段（同 create，均为可选）
    title, description, images, price, original_price,
    category, condition, trade_method, location,
  }
}

// 返回
{
  code: 0,
  msg: 'success',
  data: { product: { /* 更新后的商品 */ } }
}
```

#### delete - 删除商品

```javascript
// 入参（需登录 + 所有者校验）
{
  action: 'delete',
  params: { product_id: String }
}

// 返回
{
  code: 0,
  msg: 'success',
  data: { success: true }
}
```

#### toggleLike - 点赞/取消

```javascript
// 入参（需登录）
{
  action: 'toggleLike',
  params: { product_id: String }
}

// 返回
{
  code: 0,
  msg: 'success',
  data: {
    is_liked: Boolean,     // 当前状态
    like_count: Number,    // 最新点赞数
  }
}
```

#### toggleStatus - 上架/下架

```javascript
// 入参（需登录 + 所有者校验）
{
  action: 'toggleStatus',
  params: {
    product_id: String,
    status: Number,        // 0=下架, 1=上架
  }
}

// 返回
{
  code: 0,
  msg: 'success',
  data: { success: true }
}
```

#### search - 关键词搜索

```javascript
// 入参
{
  action: 'search',
  params: {
    keyword: String,       // 搜索关键词
    school_id: String,     // 学校范围（可选）
    page: Number,
    size: Number,
  }
}

// 返回（同 getList 格式）
```

---

## 5. 前端类型定义

**文件路径：** `src/types/product.ts`

```typescript
/** 商品分类 */
export type ProductCategory = 'textbook' | 'digital' | 'clothing' | 'daily' | 'sports' | 'other'

/** 商品成色 */
export type ProductCondition = 'brand_new' | 'like_new' | 'used' | 'old'

/** 交易方式 */
export type TradeMethod = 'self_pickup' | 'express'

/** 商品列表项 */
export interface ProductListItem {
  _id: string
  title: string
  price: number
  condition: ProductCondition
  category: ProductCategory
  images: string[]          // 封面图
  seller: {
    _id: string
    nickname: string
    avatar: string
  }
  like_count: number
  view_count: number
  publish_time: string
  is_liked: boolean
}

/** 商品详情 */
export interface ProductDetail {
  _id: string
  seller_id: string
  school_id: string
  category: ProductCategory
  title: string
  description: string
  images: string[]
  original_price?: number
  price: number
  condition: ProductCondition
  trade_method: TradeMethod[]
  location?: string
  status: number
  view_count: number
  like_count: number
  comment_count: number
  publish_time: string
  create_date: string
  seller: {
    _id: string
    nickname: string
    avatar: string
    credit_score: number
    school_name: string
    college?: string
    product_count: number
  }
  is_liked: boolean
  is_owner: boolean
}

/** 商品列表查询参数 */
export interface ProductListParams {
  page?: number
  size?: number
  school_id?: string
  category?: ProductCategory
  condition?: ProductCondition
  sort?: 'newest' | 'price_asc' | 'price_desc'
}

/** 商品列表结果 */
export interface ProductListResult {
  list: ProductListItem[]
  total: number
}

/** 创建商品参数 */
export interface CreateProductParams {
  title: string
  description: string
  images: string[]
  price: number
  original_price?: number
  category: ProductCategory
  condition: ProductCondition
  trade_method: TradeMethod[]
  location?: string
}

/** 更新商品参数 */
export interface UpdateProductParams {
  title?: string
  description?: string
  images?: string[]
  price?: number
  original_price?: number
  category?: ProductCategory
  condition?: ProductCondition
  trade_method?: TradeMethod[]
  location?: string
}
```

---

## 6. 前端 API 层

**文件路径：** `src/api/product.ts`

```typescript
import { callCloudFunction } from './unicloud'
import type {
  ProductListParams,
  ProductListResult,
  ProductDetail,
  CreateProductParams,
  UpdateProductParams,
} from '@/types/product'

/** 获取商品列表 */
export function getProductList(params: ProductListParams = {}): Promise<ProductListResult> {
  return callCloudFunction<ProductListResult>('product-co', 'getList', params)
}

/** 获取商品详情 */
export function getProductDetail(product_id: string): Promise<ProductDetail> {
  return callCloudFunction<ProductDetail>('product-co', 'getDetail', { product_id })
}

/** 发布商品 */
export function createProduct(params: CreateProductParams): Promise<ProductDetail> {
  return callCloudFunction<ProductDetail>('product-co', 'create', params)
}

/** 编辑商品 */
export function updateProduct(product_id: string, params: UpdateProductParams): Promise<ProductDetail> {
  return callCloudFunction<ProductDetail>('product-co', 'update', { product_id, ...params })
}

/** 删除商品 */
export function deleteProduct(product_id: string): Promise<void> {
  return callCloudFunction('product-co', 'delete', { product_id })
}

/** 点赞/取消点赞 */
export function toggleProductLike(product_id: string): Promise<{ is_liked: boolean; like_count: number }> {
  return callCloudFunction('product-co', 'toggleLike', { product_id })
}

/** 上架/下架商品 */
export function toggleProductStatus(product_id: string, status: number): Promise<void> {
  return callCloudFunction('product-co', 'toggleStatus', { product_id, status })
}

/** 搜索商品 */
export function searchProducts(keyword: string, school_id?: string, page = 1, size = 10): Promise<ProductListResult> {
  return callCloudFunction<ProductListResult>('product-co', 'search', { keyword, school_id, page, size })
}
```

---

## 7. 页面设计

### 7.1 商品详情页 (`src/pages/product/detail.vue`)

**社交动态风格布局：**

```
┌─────────────────────────────────┐
│ 卖家信息区                        │
│ [头像] 昵称 · 时间 · 学院         │
│ 信用分 98 | 在售 12件             │
├─────────────────────────────────┤
│ 商品图片轮播区                    │
│ [大图] [指示器]                   │
├─────────────────────────────────┤
│ 商品信息区                        │
│ ¥128 (原价¥58)                   │
│ 标题                             │
│ [成色标签] [交易方式标签]          │
│ 详细描述...                       │
├─────────────────────────────────┤
│ 互动区                            │
│ ❤️ 23  💬 5  📍 西操场             │
├─────────────────────────────────┤
│ 评论列表区                        │
│ [评论项...]                       │
├─────────────────────────────────┤
│ 底部操作栏                        │
│ [收藏] [评论] [联系卖家] [立即购买]│
└─────────────────────────────────┘
```

### 7.2 发布页 (`src/pages/publish/index.vue`)

**标准发布表单：**

- 图片上传区（6张，拖拽排序，第一张为封面）
- 商品标题输入
- 价格输入（售价 + 原价）
- 分类选择（6个固定分类）
- 成色选择（4档）
- 交易方式选择（自提/快递，可双选）
- 自提地点输入（自提时显示）
- 详细描述输入
- 发布按钮

---

## 8. 图片上传流程

1. 用户选择图片 → `uni.chooseImage({ count: 6 })`
2. 上传到 UniCloud → `uniCloud.uploadFile()`
3. 获取 fileID → 存入 images 数组
4. 发布时传 images 数组到云函数

---

## 9. 安全与权限

| 操作 | 权限要求 |
|------|----------|
| getList | 无（公开） |
| getDetail | 无（公开） |
| create | 需登录 + 学生认证 |
| update | 需登录 + 所有者 |
| delete | 需登录 + 所有者 |
| toggleLike | 需登录 |
| toggleStatus | 需登录 + 所有者 |

---

## 10. 实现范围

本次 M2 实现：

- [x] product-co 云函数（8 个 actions）
- [x] products 数据库 schema
- [x] 前端类型定义
- [x] 前端 API 层
- [x] 商品详情页（社交动态风格）
- [x] 商品列表首页（替换 mock 数据）
- [x] 发布页表单完善
- [x] 搜索页基础功能

暂不实现（后续迭代）：

- [ ] 评论系统（M5 社交功能）
- [ ] 收藏列表页
- [ ] 我的发布页
- [ ] 订单交易（M3）

---

## 11. 文件清单

| 文件 | 操作 |
|------|------|
| `uniCloud-aliyun/database/products.schema.json` | 新建 |
| `uniCloud-aliyun/cloudfunctions/product-co/index.obj.js` | 新建 |
| `uniCloud-aliyun/cloudfunctions/product-co/package.json` | 新建 |
| `src/types/product.ts` | 新建 |
| `src/api/product.ts` | 新建 |
| `src/pages/product/detail.vue` | 新建 |
| `src/pages/index/index.vue` | 修改（替换 mock） |
| `src/pages/publish/index.vue` | 修改（完善表单） |
| `pages.config.ts` | 修改（添加商品详情路由） |

---

**文档完成，待用户审核后进入实现规划阶段。**
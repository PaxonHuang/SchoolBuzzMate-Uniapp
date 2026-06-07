# M2 商品系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现校园二手交易平台的商品发布、列表浏览、详情查看、搜索等核心功能。

**Architecture:** 采用 UniCloud 云函数 + 前端 API 抽象层模式。`product-co` 云函数提供 8 个 action（getList/getDetail/create/update/delete/toggleLike/toggleStatus/search），前端通过 `src/api/product.ts` 调用。商品详情页采用社交动态风格布局。

**Tech Stack:** UniCloud 阿里云、Vue3 + TypeScript、UnoCSS、wot-design-uni、dayjs

**Design Spec:** `docs/superpowers/specs/2026-06-07-product-system-design.md`

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `uniCloud-aliyun/database/products.schema.json` | 新建 | products 集合 schema 定义 |
| `uniCloud-aliyun/cloudfunctions/product-co/package.json` | 新建 | 云函数 package |
| `uniCloud-aliyun/cloudfunctions/product-co/index.obj.js` | 新建 | 商品云函数（8 个 action） |
| `src/types/product.ts` | 新建 | 商品相关 TypeScript 类型 |
| `src/api/product.ts` | 新建 | 商品 API 抽象层 |
| `src/pages/product/detail.vue` | 新建 | 商品详情页（社交动态风格） |
| `src/pages/index/index.vue` | 修改 | 首页商品列表（替换 mock 数据） |
| `src/pages/publish/index.vue` | 修改 | 发布页表单完善（分类+云函数对接） |
| `src/pages/index/search.vue` | 修改 | 搜索页对接真实搜索 API |
| `pages.config.ts` | 修改 | 添加商品详情页路由 |

---

### Task 1: 数据库 Schema + 云函数骨架

**Files:**
- Create: `uniCloud-aliyun/database/products.schema.json`
- Create: `uniCloud-aliyun/cloudfunctions/product-co/package.json`
- Create: `uniCloud-aliyun/cloudfunctions/product-co/index.obj.js`

- [ ] **Step 1: 创建 products schema**

```json
{
  "bsonType": "object",
  "required": ["seller_id", "school_id", "category", "title", "description", "images", "price", "condition", "trade_method", "status"],
  "permission": {
    "create": false,
    "read": true,
    "update": false,
    "delete": false
  },
  "properties": {
    "_id": { "description": "ID" },
    "seller_id": {
      "bsonType": "string",
      "description": "卖家ID（关联 school_users._id）",
      "title": "卖家ID"
    },
    "school_id": {
      "bsonType": "string",
      "description": "所属学校ID（关联 schools._id）",
      "title": "学校ID"
    },
    "category": {
      "bsonType": "string",
      "description": "分类：textbook/digital/clothing/daily/sports/other",
      "title": "分类",
      "enum": ["textbook", "digital", "clothing", "daily", "sports", "other"]
    },
    "title": {
      "bsonType": "string",
      "description": "商品标题",
      "title": "标题",
      "maxLength": 50
    },
    "description": {
      "bsonType": "string",
      "description": "详细描述",
      "title": "描述",
      "maxLength": 500
    },
    "images": {
      "bsonType": "array",
      "description": "图片URL数组（1-6张）",
      "title": "图片",
      "items": { "bsonType": "string" },
      "maxItems": 6,
      "minItems": 1
    },
    "original_price": {
      "bsonType": "double",
      "description": "原价",
      "title": "原价"
    },
    "price": {
      "bsonType": "double",
      "description": "售价",
      "title": "售价",
      "minimum": 0.01
    },
    "condition": {
      "bsonType": "string",
      "description": "成色：brand_new/like_new/used/old",
      "title": "成色",
      "enum": ["brand_new", "like_new", "used", "old"]
    },
    "trade_method": {
      "bsonType": "array",
      "description": "交易方式：self_pickup/express",
      "title": "交易方式",
      "items": { "bsonType": "string" }
    },
    "location": {
      "bsonType": "string",
      "description": "自提地点",
      "title": "自提地点"
    },
    "status": {
      "bsonType": "int",
      "description": "状态：0下架 1上架 2已售",
      "title": "状态",
      "defaultValue": 1
    },
    "view_count": {
      "bsonType": "int",
      "description": "浏览数",
      "defaultValue": 0
    },
    "like_count": {
      "bsonType": "int",
      "description": "点赞数",
      "defaultValue": 0
    },
    "comment_count": {
      "bsonType": "int",
      "description": "评论数",
      "defaultValue": 0
    },
    "publish_time": {
      "bsonType": "date",
      "description": "发布时间"
    },
    "create_date": {
      "bsonType": "date",
      "description": "创建时间"
    },
    "update_date": {
      "bsonType": "date",
      "description": "更新时间"
    }
  }
}
```

- [ ] **Step 2: 创建云函数 package.json**

```json
{
  "name": "product-co",
  "version": "1.0.0",
  "description": "SchoolBuzzMate 商品服务云函数",
  "main": "index.obj.js",
  "dependencies": {}
}
```

- [ ] **Step 3: 创建 product-co 云函数**

```javascript
'use strict'

const db = uniCloud.database()
const dbCmd = db.command
const $ = db.command.aggregate

const ACTIONS = {
  /** 商品列表（分页+筛选+排序） */
  getList: async (params, context) => {
    const { page = 1, size = 10, school_id, category, condition, sort = 'newest', status = 1 } = params

    // 构建查询条件
    const where = { status }
    if (school_id) where.school_id = school_id
    if (category) where.category = category
    if (condition) where.condition = condition

    // 排序规则
    const sortMap = {
      newest: { publish_time: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    }
    const sortRule = sortMap[sort] || sortMap.newest

    // 查询列表和总数
    const [listRes, countRes] = await Promise.all([
      db.collection('products')
        .where(where)
        .orderBy(sortRule.publish_time !== undefined ? 'publish_time' : 'price',
          sortRule.publish_time !== undefined ? sortRule.publish_time : sortRule.price)
        .skip((page - 1) * size)
        .limit(size)
        .field({
          _id: true, title: true, price: true, condition: true,
          category: true, images: true, seller_id: true,
          like_count: true, view_count: true, publish_time: true,
        })
        .get(),
      db.collection('products').where(where).count(),
    ])

    // 批量查询卖家信息
    const sellerIds = [...new Set(listRes.data.map(p => p.seller_id))]

    const sellersMap = {}
    if (sellerIds.length > 0) {
      const sellerRes = await db.collection('school_users')
        .where({ _id: dbCmd.in(sellerIds) })
        .field({ _id: true, user_id: true })
        .get()
      // 再查询用户信息
      const userIds = sellerRes.data.map(s => s.user_id)
      let userMap = {}
      if (userIds.length > 0) {
        const userRes = await db.collection('uni-id-users')
          .where({ _id: dbCmd.in(userIds) })
          .field({ _id: true, nickname: true, avatar: true })
          .get()
        userMap = Object.fromEntries(userRes.data.map(u => [u._id, u]))
      }
      sellerRes.data.forEach(s => {
        sellersMap[s._id] = {
          _id: s._id,
          nickname: userMap[s.user_id]?.nickname || '匿名用户',
          avatar: userMap[s.user_id]?.avatar || '',
        }
      })
    }

    // 如果用户已登录，查询点赞状态
    let likedSet = new Set()
    const userId = context.UNIID_USER?._id
    if (userId && listRes.data.length > 0) {
      const likeRes = await db.collection('product_likes')
        .where({
          user_id: userId,
          product_id: dbCmd.in(listRes.data.map(p => p._id)),
        })
        .field({ product_id: true })
        .get()
      likedSet = new Set(likeRes.data.map(l => l.product_id))
    }

    // 组装结果
    const list = listRes.data.map(product => ({
      ...product,
      images: product.images?.length > 0 ? [product.images[0]] : [],
      seller: sellersMap[product.seller_id] || { _id: '', nickname: '匿名用户', avatar: '' },
      is_liked: likedSet.has(product._id),
    }))

    return { list, total: countRes.total }
  },

  /** 商品详情 */
  getDetail: async (params, context) => {
    const { product_id } = params
    if (!product_id) throw new Error('缺少商品ID')

    // 查询商品
    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) {
      throw new Error('商品不存在')
    }
    const product = productRes.data[0]

    // 浏览数 +1（异步，不阻塞返回）
    db.collection('products').doc(product_id).update({
      view_count: dbCmd.inc(1),
    }).catch(() => {})

    // 查询卖家信息
    let seller = { _id: '', nickname: '匿名用户', avatar: '', credit_score: 100, school_name: '', college: '', product_count: 0 }
    const schoolUserRes = await db.collection('school_users').doc(product.seller_id).get()
    if (schoolUserRes.data && schoolUserRes.data.length > 0) {
      const schoolUser = schoolUserRes.data[0]
      const userRes = await db.collection('uni-id-users').doc(schoolUser.user_id).get()
      const user = userRes.data?.[0] || {}
      let schoolName = ''
      if (schoolUser.school_id) {
        const schoolRes = await db.collection('schools').doc(schoolUser.school_id).get()
        schoolName = schoolRes.data?.[0]?.name || ''
      }
      const productCountRes = await db.collection('products')
        .where({ seller_id: product.seller_id, status: 1 })
        .count()
      seller = {
        _id: product.seller_id,
        nickname: user.nickname || '匿名用户',
        avatar: user.avatar || '',
        credit_score: schoolUser.credit_score || 100,
        school_name: schoolName,
        college: schoolUser.college || '',
        product_count: productCountRes.total,
      }
    }

    // 查询当前用户状态
    let is_liked = false
    let is_owner = false
    const userId = context.UNIID_USER?._id
    if (userId) {
      is_owner = product.seller_id === userId || seller._id === userId
      const likeRes = await db.collection('product_likes')
        .where({ user_id: userId, product_id })
        .count()
      is_liked = likeRes.total > 0
    }

    return { product, seller, is_liked, is_owner }
  },

  /** 发布商品 */
  create: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    // 查询用户 school_id
    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .field({ _id: true, school_id: true })
      .get()
    if (!schoolUserRes.data || schoolUserRes.data.length === 0) {
      throw new Error('请先完成学生认证')
    }
    const schoolUser = schoolUserRes.data[0]

    const {
      title, description, images, price, original_price,
      category, condition, trade_method, location,
    } = params

    // 参数校验
    if (!title || title.length < 2 || title.length > 50) throw new Error('标题需2-50个字')
    if (!description || description.length > 500) throw new Error('描述不能超过500字')
    if (!images || images.length < 1 || images.length > 6) throw new Error('请上传1-6张图片')
    if (!price || price <= 0) throw new Error('请输入合理的价格')
    if (!category) throw new Error('请选择分类')
    if (!condition) throw new Error('请选择成色')
    if (!trade_method || trade_method.length === 0) throw new Error('请选择交易方式')

    const now = new Date()
    const productData = {
      seller_id: schoolUser._id,
      school_id: schoolUser.school_id,
      category,
      title: title.trim(),
      description: description.trim(),
      images,
      original_price: original_price || 0,
      price: Number(price),
      condition,
      trade_method,
      location: location || '',
      status: 1,
      view_count: 0,
      like_count: 0,
      comment_count: 0,
      publish_time: now,
      create_date: now,
      update_date: now,
    }

    const addRes = await db.collection('products').add(productData)
    const newRes = await db.collection('products').doc(addRes.id).get()
    return { product: newRes.data[0] }
  },

  /** 编辑商品 */
  update: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const { product_id, ...updateFields } = params
    if (!product_id) throw new Error('缺少商品ID')

    // 所有者校验
    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) throw new Error('商品不存在')
    const product = productRes.data[0]

    // 校验卖家身份
    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .field({ _id: true })
      .get()
    if (!schoolUserRes.data?.[0] || schoolUserRes.data[0]._id !== product.seller_id) {
      throw new Error('无权编辑此商品')
    }

    // 过滤允许更新的字段
    const allowedFields = ['title', 'description', 'images', 'price', 'original_price', 'category', 'condition', 'trade_method', 'location']
    const data = { update_date: new Date() }
    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        data[key] = updateFields[key]
      }
    }

    await db.collection('products').doc(product_id).update(data)
    const updated = await db.collection('products').doc(product_id).get()
    return { product: updated.data[0] }
  },

  /** 删除商品（软删除，改为下架） */
  delete: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const { product_id } = params
    if (!product_id) throw new Error('缺少商品ID')

    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) throw new Error('商品不存在')

    // 所有者校验
    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .field({ _id: true })
      .get()
    if (!schoolUserRes.data?.[0] || schoolUserRes.data[0]._id !== productRes.data[0].seller_id) {
      throw new Error('无权删除此商品')
    }

    await db.collection('products').doc(product_id).update({
      status: 0,
      update_date: new Date(),
    })
    return { success: true }
  },

  /** 点赞/取消点赞 */
  toggleLike: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const { product_id } = params
    if (!product_id) throw new Error('缺少商品ID')

    // 查询是否已点赞
    const likeRes = await db.collection('product_likes')
      .where({ user_id: userId, product_id })
      .get()

    const isLiked = likeRes.data && likeRes.data.length > 0

    if (isLiked) {
      // 取消点赞
      await db.collection('product_likes').doc(likeRes.data[0]._id).remove()
      await db.collection('products').doc(product_id).update({
        like_count: dbCmd.inc(-1),
      })
    } else {
      // 添加点赞
      await db.collection('product_likes').add({
        user_id: userId,
        product_id,
        create_date: new Date(),
      })
      await db.collection('products').doc(product_id).update({
        like_count: dbCmd.inc(1),
      })
    }

    const productRes = await db.collection('products').doc(product_id)
      .field({ like_count: true })
      .get()

    return {
      is_liked: !isLiked,
      like_count: productRes.data?.[0]?.like_count || 0,
    }
  },

  /** 上架/下架 */
  toggleStatus: async (params, context) => {
    const userId = context.UNIID_USER?._id
    if (!userId) throw new Error('请先登录')

    const { product_id, status } = params
    if (!product_id) throw new Error('缺少商品ID')
    if (status !== 0 && status !== 1) throw new Error('无效状态值')

    const productRes = await db.collection('products').doc(product_id).get()
    if (!productRes.data || productRes.data.length === 0) throw new Error('商品不存在')

    // 所有者校验
    const schoolUserRes = await db.collection('school_users')
      .where({ user_id: userId })
      .field({ _id: true })
      .get()
    if (!schoolUserRes.data?.[0] || schoolUserRes.data[0]._id !== productRes.data[0].seller_id) {
      throw new Error('无权操作此商品')
    }

    await db.collection('products').doc(product_id).update({
      status,
      update_date: new Date(),
    })
    return { success: true }
  },

  /** 关键词搜索 */
  search: async (params, context) => {
    const { keyword, school_id, page = 1, size = 10 } = params
    if (!keyword || !keyword.trim()) throw new Error('请输入搜索关键词')

    const where = {
      status: 1,
      title: new RegExp(keyword.trim(), 'i'),
    }
    if (school_id) where.school_id = school_id

    const [listRes, countRes] = await Promise.all([
      db.collection('products')
        .where(where)
        .orderBy('publish_time', 'desc')
        .skip((page - 1) * size)
        .limit(size)
        .field({
          _id: true, title: true, price: true, condition: true,
          category: true, images: true, seller_id: true,
          like_count: true, view_count: true, publish_time: true,
        })
        .get(),
      db.collection('products').where(where).count(),
    ])

    // 查询卖家信息（复用 getList 的逻辑）
    const sellerIds = [...new Set(listRes.data.map(p => p.seller_id))]
    const sellersMap = {}
    if (sellerIds.length > 0) {
      const sellerRes = await db.collection('school_users')
        .where({ _id: dbCmd.in(sellerIds) })
        .field({ _id: true, user_id: true })
        .get()
      const userIds = sellerRes.data.map(s => s.user_id)
      let userMap = {}
      if (userIds.length > 0) {
        const userRes = await db.collection('uni-id-users')
          .where({ _id: dbCmd.in(userIds) })
          .field({ _id: true, nickname: true, avatar: true })
          .get()
        userMap = Object.fromEntries(userRes.data.map(u => [u._id, u]))
      }
      sellerRes.data.forEach(s => {
        sellersMap[s._id] = {
          _id: s._id,
          nickname: userMap[s.user_id]?.nickname || '匿名用户',
          avatar: userMap[s.user_id]?.avatar || '',
        }
      })
    }

    const list = listRes.data.map(product => ({
      ...product,
      images: product.images?.length > 0 ? [product.images[0]] : [],
      seller: sellersMap[product.seller_id] || { _id: '', nickname: '匿名用户', avatar: '' },
      is_liked: false,
    }))

    return { list, total: countRes.total }
  },
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
    return { code: -1, msg: error.message || '操作失败' }
  }
}
```

- [ ] **Step 4: 验证文件已创建**

Run: `ls uniCloud-aliyun/database/products.schema.json uniCloud-aliyun/cloudfunctions/product-co/index.obj.js uniCloud-aliyun/cloudfunctions/product-co/package.json`
Expected: 三个文件路径均输出

- [ ] **Step 5: Commit**

```bash
git add uniCloud-aliyun/database/products.schema.json uniCloud-aliyun/cloudfunctions/product-co/
git commit -m "feat(product): add products schema and product-co cloud function"
```

---

### Task 2: 前端类型定义 + API 层

**Files:**
- Create: `src/types/product.ts`
- Create: `src/api/product.ts`

- [ ] **Step 1: 创建商品类型定义**

```typescript
// src/types/product.ts

/** 商品分类 */
export type ProductCategory = 'textbook' | 'digital' | 'clothing' | 'daily' | 'sports' | 'other'

/** 商品成色 */
export type ProductCondition = 'brand_new' | 'like_new' | 'used' | 'old'

/** 交易方式 */
export type TradeMethod = 'self_pickup' | 'express'

/** 分类显示配置 */
export const CATEGORY_OPTIONS: { label: string; value: ProductCategory; icon: string }[] = [
  { label: '教材资料', value: 'textbook', icon: '📚' },
  { label: '数码电子', value: 'digital', icon: '📱' },
  { label: '服饰鞋包', value: 'clothing', icon: '👔' },
  { label: '生活用品', value: 'daily', icon: '🏠' },
  { label: '运动户外', value: 'sports', icon: '🏃' },
  { label: '其他杂项', value: 'other', icon: '🎨' },
]

/** 成色显示配置 */
export const CONDITION_OPTIONS: { label: string; value: ProductCondition }[] = [
  { label: '全新', value: 'brand_new' },
  { label: '几乎全新', value: 'like_new' },
  { label: '已使用', value: 'used' },
  { label: '较旧', value: 'old' },
]

/** 商品列表项 */
export interface ProductListItem {
  _id: string
  title: string
  price: number
  condition: ProductCondition
  category: ProductCategory
  images: string[]
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

- [ ] **Step 2: 创建商品 API 层**

```typescript
// src/api/product.ts
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
export function createProduct(params: CreateProductParams): Promise<{ product: ProductDetail }> {
  return callCloudFunction('product-co', 'create', params)
}

/** 编辑商品 */
export function updateProduct(product_id: string, params: UpdateProductParams): Promise<{ product: ProductDetail }> {
  return callCloudFunction('product-co', 'update', { product_id, ...params })
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

- [ ] **Step 3: 验证 TypeScript 类型**

Run: `pnpm run type-check`
Expected: 无类型错误（新文件不影响已有代码）

- [ ] **Step 4: Commit**

```bash
git add src/types/product.ts src/api/product.ts
git commit -m "feat(product): add product types and API layer"
```

---

### Task 3: 商品详情页（社交动态风格）

**Files:**
- Create: `src/pages/product/detail.vue`
- Modify: `pages.config.ts`（添加路由）

- [ ] **Step 1: 添加商品详情页路由**

在 `pages.config.ts` 的 `defineUniPages` 调用中，保持现有配置不变。UniApp 的 `pages/` 目录会自动注册页面路由，只需确保文件存在即可。

确认 `src/pages/product/detail.vue` 的文件路径，UniApp 会自动将其注册为 `/pages/product/detail` 路由。

- [ ] **Step 2: 创建商品详情页**

```vue
<!-- src/pages/product/detail.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getProductDetail, toggleProductLike } from '@/api/product'
import { useSchoolStore } from '@/store/school'
import type { ProductDetail } from '@/types/product'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from '@/types/product'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const schoolStore = useSchoolStore()

const product = ref<ProductDetail | null>(null)
const loading = ref(true)
const currentImageIndex = ref(0)

/** 获取分类图标 */
function getCategoryIcon(category: string) {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.icon || '🎨'
}

/** 获取成色文字 */
function getConditionLabel(condition: string) {
  return CONDITION_OPTIONS.find(c => c.value === condition)?.label || condition
}

/** 格式化相对时间 */
function formatTime(time: string) {
  if (!time) return ''
  return dayjs(time).fromNow()
}

/** 点赞/取消 */
async function handleToggleLike() {
  if (!product.value) return
  try {
    const res = await toggleProductLike(product.value._id)
    product.value.is_liked = res.is_liked
    product.value.like_count = res.like_count
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

/** 预览图片 */
function previewImage(index: number) {
  if (!product.value) return
  uni.previewImage({
    urls: product.value.images,
    current: index,
  })
}

/** 联系卖家（占位） */
function contactSeller() {
  uni.showToast({ title: '私信功能开发中', icon: 'none' })
}

/** 购买（占位，M3 实现） */
function handleBuy() {
  uni.showToast({ title: '下单功能开发中', icon: 'none' })
}

/** 加载商品详情 */
async function loadDetail(product_id: string) {
  loading.value = true
  try {
    const res = await getProductDetail(product_id)
    product.value = res
    uni.setNavigationBarTitle({ title: res.product?.title || res.title || '商品详情' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  const id = options?.id
  if (id) {
    loadDetail(id)
  } else {
    uni.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})
</script>

<template>
  <view v-if="product" class="page">
    <!-- 卖家信息区（社交动态风格） -->
    <view class="seller-section">
      <view class="seller-info">
        <image v-if="product.seller?.avatar" :src="product.seller.avatar" class="avatar" mode="aspectFill" />
        <view v-else class="avatar avatar-placeholder">
          <text class="i-carbon-user" />
        </view>
        <view class="seller-meta">
          <text class="seller-name">{{ product.seller?.nickname || '匿名用户' }}</text>
          <view class="seller-detail">
            <text class="time">{{ formatTime(product.publish_time) }}</text>
            <text v-if="product.seller?.college" class="college">· {{ product.seller.college }}</text>
          </view>
        </view>
      </view>
      <view class="seller-stats">
        <text class="stat-item">信用 {{ product.seller?.credit_score || 100 }}</text>
        <text class="stat-divider">|</text>
        <text class="stat-item">在售 {{ product.seller?.product_count || 0 }}件</text>
      </view>
    </view>

    <!-- 商品图片轮播 -->
    <swiper
      v-if="product.images && product.images.length > 0"
      class="image-swiper"
      :indicator-dots="product.images.length > 1"
      indicator-color="rgba(255,255,255,0.5)"
      indicator-active-color="#fff"
      :autoplay="false"
      @change="e => currentImageIndex = e.detail.current"
    >
      <swiper-item v-for="(img, index) in product.images" :key="index">
        <image
          :src="img"
          class="product-image"
          mode="aspectFill"
          @click="previewImage(index)"
        />
      </swiper-item>
    </swiper>
    <view v-else class="image-placeholder">
      <text class="i-carbon-image placeholder-icon" />
    </view>

    <!-- 商品信息区 -->
    <view class="info-section">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text v-if="product.original_price" class="original-price">原价 ¥{{ product.original_price }}</text>
      </view>
      <text class="title">{{ product.title }}</text>
      <view class="tags-row">
        <text class="tag condition-tag">{{ getConditionLabel(product.condition) }}</text>
        <text
          v-for="method in product.trade_method"
          :key="method"
          class="tag method-tag"
        >
          {{ method === 'self_pickup' ? '📍 自提' : '📦 快递' }}
        </text>
        <text class="tag category-tag">{{ getCategoryIcon(product.category) }} {{ product.category }}</text>
      </view>
      <text v-if="product.description" class="description">{{ product.description }}</text>
    </view>

    <!-- 互动区 -->
    <view class="interaction-section">
      <view class="interaction-stats">
        <text class="stat" @click="handleToggleLike">
          <text :class="product.is_liked ? 'i-carbon-favorite-filled liked' : 'i-carbon-favorite'" />
          {{ product.like_count || 0 }}
        </text>
        <text class="stat">
          <text class="i-carbon-view" />
          {{ product.view_count || 0 }}
        </text>
        <text v-if="product.location" class="stat">
          <text class="i-carbon-location" />
          {{ product.location }}
        </text>
      </view>
    </view>

    <!-- 评论占位区（M5 实现） -->
    <view class="comment-section">
      <view class="section-header">
        <text class="section-title">评论 ({{ product.comment_count || 0 }})</text>
      </view>
      <view class="comment-placeholder">
        <text class="i-carbon-chat comment-icon" />
        <text class="comment-text">评论功能开发中...</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-btn like-btn" :class="{ liked: product.is_liked }" @click="handleToggleLike">
        <text :class="product.is_liked ? 'i-carbon-favorite-filled' : 'i-carbon-favorite'" />
        <text class="action-text">收藏</text>
      </view>
      <view class="action-btn" @click="contactSeller">
        <text class="i-carbon-chat" />
        <text class="action-text">聊天</text>
      </view>
      <view v-if="!product.is_owner" class="buy-btn" @click="handleBuy">
        <text>立即购买</text>
      </view>
      <view v-else class="buy-btn owner-btn" @click="toggleProductStatus(product._id, product.status === 1 ? 0 : 1)">
        <text>{{ product.status === 1 ? '下架商品' : '重新上架' }}</text>
      </view>
    </view>
  </view>

  <!-- 加载状态 -->
  <view v-else-if="loading" class="page loading-page">
    <wd-loading size="60rpx" />
    <text class="loading-text">加载中...</text>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.loading-text {
  color: #999;
  font-size: 26rpx;
}

// 卖家信息区
.seller-section {
  background: white;
  padding: 24rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.seller-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.avatar-placeholder {
  background: #e8f8ee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #07c160;
  font-size: 36rpx;
}

.seller-meta {
  .seller-name {
    font-size: 30rpx;
    font-weight: 500;
    color: #333;
    display: block;
  }

  .seller-detail {
    margin-top: 4rpx;
    font-size: 24rpx;
    color: #999;
  }
}

.seller-stats {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 22rpx;
  color: #666;
}

.stat-divider {
  color: #ddd;
}

// 商品图片轮播
.image-swiper {
  width: 100%;
  height: 600rpx;
}

.product-image {
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%;
  height: 400rpx;
  background: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;

  .placeholder-icon {
    font-size: 80rpx;
    color: #ccc;
  }
}

// 商品信息区
.info-section {
  background: white;
  padding: 24rpx 30rpx;
  margin-top: 2rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.price {
  font-size: 40rpx;
  font-weight: 700;
  color: #ff6b00;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
}

.title {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 16rpx;
  display: block;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 6rpx;
}

.condition-tag {
  background: #e8f8ee;
  color: #07c160;
}

.method-tag {
  background: #fff3e0;
  color: #ff6b00;
}

.category-tag {
  background: #f0f0f0;
  color: #666;
}

.description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

// 互动区
.interaction-section {
  background: white;
  padding: 20rpx 30rpx;
  margin-top: 16rpx;
}

.interaction-stats {
  display: flex;
  gap: 32rpx;
}

.stat {
  font-size: 26rpx;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.liked {
  color: #fa5151;
}

// 评论区
.comment-section {
  background: white;
  margin-top: 16rpx;
  padding: 24rpx 30rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.comment-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  gap: 12rpx;
}

.comment-icon {
  font-size: 48rpx;
  color: #ccc;
}

.comment-text {
  font-size: 24rpx;
  color: #999;
}

// 底部操作栏
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  gap: 16rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  gap: 4rpx;
  font-size: 36rpx;
  color: #666;

  &.liked {
    color: #fa5151;
  }
}

.action-text {
  font-size: 20rpx;
}

.buy-btn {
  flex: 1;
  height: 72rpx;
  background: #07c160;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28rpx;
  font-weight: 500;
}

.owner-btn {
  background: #ff9500;
}
</style>
```

- [ ] **Step 3: 验证构建**

Run: `pnpm run build:mp-weixin`
Expected: `DONE Build complete.`

- [ ] **Step 4: Commit**

```bash
git add src/pages/product/detail.vue
git commit -m "feat(product): add product detail page with social style layout"
```

---

### Task 4: 完善发布页（分类+云函数对接）

**Files:**
- Modify: `src/pages/publish/index.vue`

- [ ] **Step 1: 更新发布页脚本和模板**

将发布页改造为对接真实云函数，增加分类选择，图片限制改为 6 张，交易方式改为多选：

```vue
<!-- src/pages/publish/index.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { createProduct } from '@/api/product'
import { uploadFile } from '@/api/upload'
import type { ProductCategory, ProductCondition, TradeMethod } from '@/types/product'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from '@/types/product'

const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  price: '',
  original_price: '',
  category: '' as ProductCategory | '',
  condition: '' as ProductCondition | '',
  trade_method: [] as TradeMethod[],
  location: '',
  images: [] as string[],
})

const needLocation = computed(() => form.value.trade_method.includes('self_pickup'))

function toggleTradeMethod(method: TradeMethod) {
  const idx = form.value.trade_method.indexOf(method)
  if (idx >= 0) {
    form.value.trade_method.splice(idx, 1)
  } else {
    form.value.trade_method.push(method)
  }
}

async function handleUploadImage() {
  const remaining = 6 - form.value.images.length
  if (remaining <= 0) {
    uni.showToast({ title: '最多上传6张图片', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      for (const path of res.tempFilePaths) {
        form.value.images.push(path)
      }
    },
  })
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
}

async function handlePublish() {
  // 表单校验
  if (!form.value.title.trim() || form.value.title.length < 2) {
    uni.showToast({ title: '请输入标题（2-50字）', icon: 'none' })
    return
  }
  if (form.value.images.length === 0) {
    uni.showToast({ title: '请至少上传一张图片', icon: 'none' })
    return
  }
  if (!form.value.price || Number(form.value.price) <= 0) {
    uni.showToast({ title: '请输入合理的价格', icon: 'none' })
    return
  }
  if (!form.value.category) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }
  if (!form.value.condition) {
    uni.showToast({ title: '请选择成色', icon: 'none' })
    return
  }
  if (form.value.trade_method.length === 0) {
    uni.showToast({ title: '请选择交易方式', icon: 'none' })
    return
  }
  if (form.value.trade_method.includes('self_pickup') && !form.value.location.trim()) {
    uni.showToast({ title: '自提时请输入自提地点', icon: 'none' })
    return
  }

  loading.value = true
  try {
    // 上传图片到 UniCloud
    const uploadedImages: string[] = []
    for (const imgPath of form.value.images) {
      // 如果已经是 cloud fileID 则直接使用，否则上传
      if (imgPath.startsWith('cloud://')) {
        uploadedImages.push(imgPath)
      } else {
        const fileID = await uploadFile(imgPath)
        uploadedImages.push(fileID)
      }
    }

    await createProduct({
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      images: uploadedImages,
      price: Number(form.value.price),
      original_price: form.value.original_price ? Number(form.value.original_price) : undefined,
      category: form.value.category as ProductCategory,
      condition: form.value.condition as ProductCondition,
      trade_method: form.value.trade_method,
      location: form.value.location.trim() || undefined,
    })

    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  } catch (error: any) {
    uni.showToast({ title: error.message || '发布失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="page">
    <!-- 图片上传 -->
    <view class="section">
      <text class="section-title">商品图片（{{ form.images.length }}/6）</text>
      <view class="image-list">
        <view class="image-item" v-for="(img, index) in form.images" :key="index">
          <image :src="img" mode="aspectFill" class="image" />
          <text class="remove-btn" @click="removeImage(index)">✕</text>
          <text v-if="index === 0" class="cover-badge">封面</text>
        </view>
        <view
          v-if="form.images.length < 6"
          class="add-image"
          @click="handleUploadImage"
        >
          <text class="i-carbon-camera add-icon" />
          <text class="add-text">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="section">
      <view class="form-item">
        <text class="label">标题</text>
        <input v-model="form.title" class="input" placeholder="请输入商品标题（2-50字）" maxlength="50" />
      </view>

      <view class="form-item">
        <text class="label">描述</text>
        <textarea
          v-model="form.description"
          class="textarea"
          placeholder="介绍你的商品，如购买时间、使用情况等..."
          maxlength="500"
          auto-height
        />
      </view>

      <view class="form-item price-row">
        <view class="price-field">
          <text class="label">售价</text>
          <input v-model="form.price" class="input" type="digit" placeholder="¥ 0.00" />
        </view>
        <view class="price-field">
          <text class="label">原价（可选）</text>
          <input v-model="form.original_price" class="input" type="digit" placeholder="¥ 0.00" />
        </view>
      </view>
    </view>

    <!-- 分类选择 -->
    <view class="section">
      <view class="form-item">
        <text class="label">商品分类</text>
        <view class="option-group">
          <view
            v-for="opt in CATEGORY_OPTIONS"
            :key="opt.value"
            class="option"
            :class="{ active: form.category === opt.value }"
            @click="form.category = opt.value"
          >
            <text>{{ opt.icon }} {{ opt.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 商品属性 -->
    <view class="section">
      <view class="form-item">
        <text class="label">新旧程度</text>
        <view class="option-group">
          <view
            v-for="opt in CONDITION_OPTIONS"
            :key="opt.value"
            class="option"
            :class="{ active: form.condition === opt.value }"
            @click="form.condition = opt.value"
          >
            <text>{{ opt.label }}</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">交易方式（可多选）</text>
        <view class="option-group">
          <view
            class="option"
            :class="{ active: form.trade_method.includes('self_pickup') }"
            @click="toggleTradeMethod('self_pickup')"
          >
            <text>📍 面交自提</text>
          </view>
          <view
            class="option"
            :class="{ active: form.trade_method.includes('express') }"
            @click="toggleTradeMethod('express')"
          >
            <text>📦 快递</text>
          </view>
        </view>
      </view>

      <view v-if="needLocation" class="form-item">
        <text class="label">自提地点</text>
        <input v-model="form.location" class="input" placeholder="如：西操场、图书馆门口" />
      </view>
    </view>

    <!-- 发布按钮 -->
    <view class="publish-section">
      <view class="publish-btn" :class="{ loading }" @click="handlePublish">
        <wd-loading v-if="loading" color="#fff" size="32rpx" />
        <text v-else>发布商品</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.section {
  background: white;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;

  .section-title {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 20rpx;
    display: block;
  }
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 150rpx;
  height: 150rpx;

  .image {
    width: 100%;
    height: 100%;
    border-radius: 8rpx;
  }

  .remove-btn {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    width: 36rpx;
    height: 36rpx;
    background: #fa5151;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
  }

  .cover-badge {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(7, 193, 96, 0.8);
    color: white;
    font-size: 18rpx;
    text-align: center;
    padding: 2rpx 0;
    border-radius: 0 0 8rpx 8rpx;
  }
}

.add-image {
  width: 150rpx;
  height: 150rpx;
  border: 2rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;

  .add-icon {
    font-size: 40rpx;
    color: #ccc;
  }

  .add-text {
    font-size: 20rpx;
    color: #999;
  }
}

.form-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 12rpx;
    display: block;
  }

  .input {
    font-size: 28rpx;
    color: #333;
    padding: 12rpx 0;
  }

  .textarea {
    font-size: 28rpx;
    color: #333;
    width: 100%;
    min-height: 120rpx;
    padding: 12rpx 0;
  }
}

.price-row {
  display: flex;
  gap: 24rpx;
  border-bottom: none !important;
  padding-bottom: 0 !important;

  .price-field {
    flex: 1;
  }
}

.option-group {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;

  .option {
    padding: 16rpx 32rpx;
    background: #f5f5f5;
    border-radius: 8rpx;
    font-size: 26rpx;
    color: #666;

    &.active {
      background: #e8f8ee;
      color: #07c160;
      border: 1rpx solid #07c160;
    }
  }
}

.publish-section {
  padding: 40rpx 20rpx;
}

.publish-btn {
  width: 100%;
  height: 88rpx;
  background: #07c160;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30rpx;
  font-weight: 500;

  &.loading {
    opacity: 0.7;
  }
}
</style>
```

- [ ] **Step 2: 验证构建**

Run: `pnpm run build:mp-weixin`
Expected: `DONE Build complete.`

- [ ] **Step 3: Commit**

```bash
git add src/pages/publish/index.vue
git commit -m "feat(product): enhance publish form with category, real cloud upload, and trade method multi-select"
```

---

### Task 5: 首页商品列表（替换 mock）

**Files:**
- Modify: `src/pages/index/index.vue`

- [ ] **Step 1: 改造首页商品列表**

将首页从 mock 数据改为真实云函数调用，增加分类筛选：

```vue
<!-- src/pages/index/index.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useSchoolStore } from '@/store/school'
import { getProductList } from '@/api/product'
import type { ProductListItem, ProductCategory } from '@/types/product'
import { CATEGORY_OPTIONS } from '@/types/product'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const schoolStore = useSchoolStore()
const productList = ref<ProductListItem[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const keyword = ref('')
const activeCategory = ref<ProductCategory | ''>('')

function getCategoryIcon(category: string) {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.icon || '🎨'
}

function formatTime(time: string) {
  if (!time) return ''
  return dayjs(time).fromNow()
}

async function loadProducts(isRefresh = false) {
  if (loading.value) return
  if (!isRefresh && !hasMore.value) return

  loading.value = true
  if (isRefresh) page.value = 1

  try {
    const params: any = {
      page: page.value,
      size: 10,
    }
    if (schoolStore.currentSchoolId) {
      params.school_id = schoolStore.currentSchoolId
    }
    if (activeCategory.value) {
      params.category = activeCategory.value
    }

    const res = await getProductList(params)

    if (isRefresh) {
      productList.value = res.list
    } else {
      productList.value.push(...res.list)
    }

    hasMore.value = productList.value.length < res.total
    page.value++
  } catch (error: any) {
    uni.showToast({ title: error.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function selectCategory(category: ProductCategory | '') {
  activeCategory.value = category
  loadProducts(true)
}

function goToPublish() {
  uni.navigateTo({ url: '/pages/publish/index' })
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function goToSearch() {
  uni.navigateTo({ url: '/pages/index/search' })
}

function switchSchool() {
  uni.navigateTo({ url: '/pages-core/login/select-school' })
}

onPullDownRefresh(async () => {
  await loadProducts(true)
  uni.stopPullDownRefresh()
})

onReachBottom(() => loadProducts())

onMounted(() => {
  loadProducts(true)
})
</script>

<template>
  <view class="page">
    <!-- Header -->
    <view class="header">
      <view class="school-selector" @click="switchSchool">
        <text class="school-name">{{ schoolStore.currentSchoolName }}</text>
        <text class="i-carbon-chevron-down carrier" />
      </view>
      <view class="search-bar" @click="goToSearch">
        <wd-search v-model="keyword" placeholder="搜索校园好物..." disabled />
      </view>
    </view>

    <!-- 分类筛选 -->
    <scroll-view class="categories" scroll-x>
      <view
        class="category-item"
        :class="{ active: activeCategory === '' }"
        @click="selectCategory('')"
      >
        <text class="category-icon">🔥</text>
        <text>全部</text>
      </view>
      <view
        v-for="cat in CATEGORY_OPTIONS"
        :key="cat.value"
        class="category-item"
        :class="{ active: activeCategory === cat.value }"
        @click="selectCategory(cat.value)"
      >
        <text class="category-icon">{{ cat.icon }}</text>
        <text>{{ cat.label }}</text>
      </view>
    </scroll-view>

    <!-- Product Grid -->
    <view class="product-list">
      <view
        v-for="item in productList"
        :key="item._id"
        class="product-card"
        @click="goToDetail(item._id)"
      >
        <view class="product-image">
          <image v-if="item.images && item.images[0]" :src="item.images[0]" mode="aspectFill" />
          <text v-else class="i-carbon-image placeholder-icon" />
        </view>
        <view class="product-info">
          <text class="title">{{ item.title }}</text>
          <view class="price-row">
            <text class="price">¥{{ item.price }}</text>
            <text class="condition">{{ item.condition === 'brand_new' ? '全新' : item.condition === 'like_new' ? '几乎全新' : '已使用' }}</text>
          </view>
          <view class="meta-row">
            <text class="seller">{{ item.seller?.nickname }}</text>
            <text class="time">{{ formatTime(item.publish_time) }}</text>
          </view>
        </view>
      </view>
    </view>

    <wd-status-tip v-if="!loading && productList.length === 0" image="content" tip="暂无商品，快来发布吧~" />

    <view v-if="hasMore && productList.length > 0" class="load-more">
      <wd-loading v-if="loading" />
      <text v-else class="hint">上拉加载更多</text>
    </view>

    <!-- FAB 发布按钮 -->
    <view class="publish-fab" @click="goToPublish">
      <text class="i-carbon-add-large" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100rpx;
}

.header {
  background: #07c160;
  padding: 16rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;

  .school-selector {
    display: flex;
    align-items: center;
    color: white;
    font-size: 28rpx;
    white-space: nowrap;
  }

  .school-name {
    font-weight: 500;
    max-width: 140rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .carrier {
    font-size: 20rpx;
    margin-left: 4rpx;
  }

  .search-bar {
    flex: 1;
    background: white;
    border-radius: 40rpx;
  }
}

.categories {
  white-space: nowrap;
  padding: 24rpx 20rpx;
  background: white;
  margin-bottom: 16rpx;

  .category-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    font-size: 22rpx;
    color: #666;
    padding: 8rpx 24rpx;
    border-radius: 12rpx;

    &.active {
      background: #e8f8ee;
      color: #07c160;
    }

    .category-icon {
      font-size: 36rpx;
    }
  }
}

.product-list {
  padding: 0 20rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.product-card {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;

  .product-image {
    height: 200rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;

    .placeholder-icon {
      font-size: 60rpx;
      color: #ccc;
    }

    image {
      width: 100%;
      height: 100%;
    }
  }

  .product-info {
    padding: 16rpx;

    .title {
      font-size: 26rpx;
      color: #333;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .price-row {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-top: 8rpx;

      .price {
        font-size: 30rpx;
        color: #ff6b00;
        font-weight: 600;
      }

      .condition {
        font-size: 20rpx;
        color: #999;
        background: #f5f5f5;
        padding: 2rpx 8rpx;
        border-radius: 4rpx;
      }
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6rpx;

      .seller {
        font-size: 22rpx;
        color: #999;
      }

      .time {
        font-size: 20rpx;
        color: #ccc;
      }
    }
  }
}

.load-more {
  padding: 30rpx;
  text-align: center;

  .hint {
    color: #999;
    font-size: 24rpx;
  }
}

.publish-fab {
  position: fixed;
  right: 40rpx;
  bottom: 200rpx;
  width: 100rpx;
  height: 100rpx;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(7, 193, 96, 0.4);

  [class^='i-carbon'] {
    font-size: 48rpx;
    color: white;
  }
}
</style>
```

- [ ] **Step 2: 验证构建**

Run: `pnpm run build:mp-weixin`
Expected: `DONE Build complete.`

- [ ] **Step 3: Commit**

```bash
git add src/pages/index/index.vue
git commit -m "feat(product): replace homepage mock data with real product cloud API"
```

---

### Task 6: 搜索页对接真实 API

**Files:**
- Modify: `src/pages/index/search.vue`

- [ ] **Step 1: 改造搜索页**

```vue
<!-- src/pages/index/search.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { searchProducts } from '@/api/product'
import { useSchoolStore } from '@/store/school'
import type { ProductListItem } from '@/types/product'

const schoolStore = useSchoolStore()
const keyword = ref('')
const results = ref<ProductListItem[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const page = ref(1)
const total = ref(0)

async function handleSearch() {
  if (!keyword.value.trim()) return

  loading.value = true
  hasSearched.value = true
  page.value = 1

  try {
    const res = await searchProducts(
      keyword.value.trim(),
      schoolStore.currentSchoolId || undefined,
      page.value,
      20,
    )
    results.value = res.list
    total.value = res.total
  } catch (e: any) {
    uni.showToast({ title: e.message || '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  keyword.value = ''
  results.value = []
  hasSearched.value = false
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function handleTagClick(tag: string) {
  keyword.value = tag
  handleSearch()
}
</script>

<template>
  <view class="page">
    <view class="search-header">
      <view class="search-input-wrapper">
        <text class="i-carbon-search search-icon" />
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索商品、卖家..."
          confirm-type="search"
          @confirm="handleSearch"
          focus
        />
        <text v-if="keyword" class="i-carbon-close clear-btn" @click="clearSearch" />
      </view>
      <text class="cancel-text" @click="uni.navigateBack()">取消</text>
    </view>

    <!-- 搜索结果 -->
    <view v-if="hasSearched" class="results">
      <text v-if="!loading" class="result-count">找到 {{ total }} 件商品</text>

      <view v-for="item in results" :key="item._id" class="result-card" @click="goToDetail(item._id)">
        <image v-if="item.images && item.images[0]" :src="item.images[0]" class="result-image" mode="aspectFill" />
        <view v-else class="result-image placeholder">
          <text class="i-carbon-image" />
        </view>
        <view class="result-info">
          <text class="result-title">{{ item.title }}</text>
          <text class="result-price">¥{{ item.price }}</text>
          <text class="result-seller">{{ item.seller?.nickname }}</text>
        </view>
      </view>

      <wd-status-tip v-if="!loading && results.length === 0" image="search" tip="没有找到相关商品" />
      <view v-if="loading" class="loading-wrap">
        <wd-loading />
      </view>
    </view>

    <!-- 热门搜索（未搜索时显示） -->
    <view v-else class="hot-search">
      <text class="section-title">热门搜索</text>
      <view class="tags">
        <text class="tag" @click="handleTagClick('高等数学')">高等数学</text>
        <text class="tag" @click="handleTagClick('考研资料')">考研资料</text>
        <text class="tag" @click="handleTagClick('自行车')">二手自行车</text>
        <text class="tag" @click="handleTagClick('英语四级')">英语四级</text>
        <text class="tag" @click="handleTagClick('iPad')">iPad</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #fff;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  gap: 20rpx;
  background: #07c160;

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    background: white;
    border-radius: 40rpx;
    padding: 12rpx 24rpx;
    gap: 16rpx;
  }

  .search-icon {
    font-size: 32rpx;
    color: #999;
  }

  .search-input {
    flex: 1;
    font-size: 28rpx;
  }

  .clear-btn {
    font-size: 32rpx;
    color: #ccc;
  }

  .cancel-text {
    font-size: 28rpx;
    color: white;
  }
}

.results {
  padding: 20rpx;
}

.result-count {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 16rpx;
  display: block;
}

.result-card {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.result-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.result-image.placeholder {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 48rpx;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.result-title {
  font-size: 28rpx;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-price {
  font-size: 32rpx;
  color: #ff6b00;
  font-weight: 600;
}

.result-seller {
  font-size: 24rpx;
  color: #999;
}

.loading-wrap {
  padding: 40rpx;
  text-align: center;
}

.hot-search {
  padding: 30rpx;

  .section-title {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 24rpx;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;

    .tag {
      background: #f5f5f5;
      padding: 12rpx 24rpx;
      border-radius: 32rpx;
      font-size: 26rpx;
      color: #666;
    }
  }
}
</style>
```

- [ ] **Step 2: 验证构建**

Run: `pnpm run build:mp-weixin`
Expected: `DONE Build complete.`

- [ ] **Step 3: Commit**

```bash
git add src/pages/index/search.vue
git commit -m "feat(product): connect search page to real product search API"
```

---

### Task 7: 最终验证

- [ ] **Step 1: 类型检查**

Run: `pnpm run type-check`
Expected: 无类型错误

- [ ] **Step 2: 构建验证**

Run: `pnpm run build:mp-weixin`
Expected: `DONE Build complete.`

- [ ] **Step 3: 文件完整性确认**

Run: `ls uniCloud-aliyun/database/products.schema.json uniCloud-aliyun/cloudfunctions/product-co/index.obj.js uniCloud-aliyun/cloudfunctions/product-co/package.json src/types/product.ts src/api/product.ts src/pages/product/detail.vue`
Expected: 六个文件均存在

- [ ] **Step 4: 最终 Commit**

```bash
git add -A
git commit -m "feat(product): M2 product system complete — schema, cloud function, types, API, detail page, list, publish, search"
```

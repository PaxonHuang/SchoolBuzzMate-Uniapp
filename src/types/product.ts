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

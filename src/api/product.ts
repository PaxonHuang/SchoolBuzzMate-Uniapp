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

import { callCloudFunction } from './unicloud'
import type { ProductListItem } from '@/types/product'

export interface FavoriteListItem {
  _id: string
  favorite_time: string
  product: ProductListItem
}

export interface FavoriteListResult {
  list: FavoriteListItem[]
  total: number
}

export function toggleFavorite(product_id: string): Promise<{ is_favorited: boolean; favorite_count: number }> {
  return callCloudFunction('favorites-co', 'toggle', { product_id })
}

export function getFavoriteList(page = 1, size = 20): Promise<FavoriteListResult> {
  return callCloudFunction<FavoriteListResult>('favorites-co', 'getList', { page, size })
}

export function checkFavoritedBatch(product_ids: string[]): Promise<{ favorited: string[] }> {
  return callCloudFunction('favorites-co', 'checkBatch', { product_ids })
}

import { callCloudFunction } from './unicloud'
import type {
  CommentListResult,
  CreateCommentParams,
} from '@/types/comment'

export function createComment(params: CreateCommentParams): Promise<void> {
  return callCloudFunction('comment-co', 'create', params)
}

export function getCommentsByProduct(product_id: string, page = 1, size = 10): Promise<CommentListResult> {
  return callCloudFunction<CommentListResult>('comment-co', 'getByProduct', { product_id, page, size })
}

export function getCommentsBySeller(seller_id?: string, page = 1, size = 10): Promise<CommentListResult> {
  return callCloudFunction<CommentListResult>('comment-co', 'getBySeller', { seller_id, page, size })
}

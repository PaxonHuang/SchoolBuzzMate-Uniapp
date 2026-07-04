/** 评价 */
export interface CommentItem {
  _id: string
  order_id: string
  product_id: string
  buyer_id: string
  seller_id: string
  rating: number
  content: string
  tags: string[]
  anonymous: boolean
  create_date: string
  buyer: {
    _id: string
    nickname: string
    avatar: string
  }
}

export interface CommentListResult {
  list: CommentItem[]
  total: number
}

export interface CreateCommentParams {
  order_id: string
  rating: number
  content?: string
  tags?: string[]
  anonymous?: boolean
}

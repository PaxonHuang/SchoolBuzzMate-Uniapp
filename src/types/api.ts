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

/** API 环境模式 */
export type ApiMode = 'unicloud' | 'springboot'
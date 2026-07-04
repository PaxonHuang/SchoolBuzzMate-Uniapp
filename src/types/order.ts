/** 订单状态枚举 */
export type OrderStatus = 0 | 1 | 2 | 3 | 4 | 5

/** 交易方式 */
export type OrderTradeMethod = 'self_pickup' | 'express'

/** 订单状态机文案 */
export const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  0: { label: '待支付', color: '#ff6b00' },
  1: { label: '待发货', color: '#ff6b00' },
  2: { label: '待收货', color: '#ff6b00' },
  3: { label: '已完成', color: '#07c160' },
  4: { label: '已取消', color: '#999999' },
  5: { label: '退款/售后', color: '#999999' },
}

/** 商品快照（下单时锁定商品信息） */
export interface OrderProductSnapshot {
  title: string
  price: number
  original_price?: number
  images: string[]
  category: string
  condition: string
  trade_method: OrderTradeMethod[]
}

/** 收货地址 */
export interface OrderAddress {
  name: string
  phone: string
  /** 省市区 */
  address: string
 /** 详细地址 */
  detail: string
}

/** 状态变更日志 */
export interface OrderStatusLog {
  status: OrderStatus
  operator_id: string
  operator_role: 'buyer' | 'seller' | 'system'
  time: string
  note?: string
}

/** 订单主体（列表项 + 详情共用字段） */
export interface OrderBase {
  _id: string
  order_no: string
  buyer_id: string
  seller_id: string
  product_id: string
  product_snapshot: OrderProductSnapshot
  amount: number
  pay_amount: number
  status: OrderStatus
  trade_method: OrderTradeMethod
  remark?: string
  create_date: string
  update_date?: string
  paid_at?: string
  shipped_at?: string
  received_at?: string
  completed_at?: string
  cancelled_at?: string
  cancel_reason?: string
}

/** 订单列表项（带对方用户信息） */
export interface OrderListItem extends OrderBase {
  counterparty: {
    _id: string
    nickname: string
    avatar: string
  }
}

/** 订单详情 */
export interface OrderDetail extends OrderBase {
  address?: OrderAddress
  status_log: OrderStatusLog[]
  buyer: {
    _id: string
    nickname: string
    avatar: string
    credit_score: number
    school_name?: string
  }
  seller: {
    _id: string
    nickname: string
    avatar: string
    credit_score: number
    school_name?: string
  }
  /** 当前用户在该订单里的角色 */
  role: 'buyer' | 'seller'
}

/** 下单参数 */
export interface CreateOrderParams {
  product_id: string
  trade_method: OrderTradeMethod
  remark?: string
  address?: OrderAddress
}

/** 订单列表查询参数 */
export interface OrderListParams {
  page?: number
  size?: number
  role?: 'buyer' | 'seller'
  status?: OrderStatus
}

/** 订单列表结果 */
export interface OrderListResult {
  list: OrderListItem[]
  total: number
}

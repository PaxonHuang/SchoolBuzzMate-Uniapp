import { callCloudFunction } from './unicloud'
import type {
  CreateOrderParams,
  OrderDetail,
  OrderListParams,
  OrderListResult,
} from '@/types/order'

export function getOrderList(params: OrderListParams): Promise<OrderListResult> {
  return callCloudFunction<OrderListResult>('order-co', 'getList', params)
}

export function getOrderDetail(order_id: string): Promise<OrderDetail> {
  return callCloudFunction<OrderDetail>('order-co', 'getDetail', { order_id })
}

export function createOrder(params: CreateOrderParams): Promise<{ order: OrderDetail['order'] }> {
  return callCloudFunction('order-co', 'create', params)
}

export function cancelOrder(order_id: string, reason?: string): Promise<void> {
  return callCloudFunction('order-co', 'cancel', { order_id, reason })
}

export function payOrder(order_id: string): Promise<void> {
  return callCloudFunction('order-co', 'pay', { order_id })
}

export function shipOrder(order_id: string): Promise<void> {
  return callCloudFunction('order-co', 'ship', { order_id })
}

export function confirmOrder(order_id: string): Promise<void> {
  return callCloudFunction('order-co', 'confirm', { order_id })
}

import { callCloudFunction } from './unicloud'
import type { LoginParams, LoginResult } from '@/types/user'

/** 微信授权登录 */
export function loginByWechat(params: LoginParams): Promise<LoginResult> {
  return callCloudFunction<LoginResult>('uni-id-co', 'loginByWeixin', params)
}

/** 获取当前登录用户信息（uni-id） */
export function getCurrentUser(): Promise<any> {
  return callCloudFunction('uni-id-co', 'getUserInfo')
}

/** 退出登录 */
export function logoutUser(): Promise<void> {
  return callCloudFunction('uni-id-co', 'logout')
}
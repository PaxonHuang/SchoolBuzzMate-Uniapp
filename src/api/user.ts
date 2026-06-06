import { callCloudFunction } from './unicloud'
import type { UserInfo, UpdateProfileParams, VerifyStudentParams, UserProfile } from '@/types/user'

/** 获取用户完整资料（profile + schoolUser + school） */
export function getUserProfile(): Promise<UserInfo> {
  return callCloudFunction<UserInfo>('user-co', 'getProfile')
}

/** 更新用户基本资料 */
export function updateProfile(params: UpdateProfileParams): Promise<UserProfile> {
  return callCloudFunction<UserProfile>('user-co', 'updateProfile', params)
}

/** 学生认证申请 */
export function verifyStudent(params: VerifyStudentParams): Promise<{ schoolUser: any }> {
  return callCloudFunction('user-co', 'verifyStudent', params)
}

/** 获取用户统计（交易数、收藏数等） */
export function getUserStats(): Promise<any> {
  return callCloudFunction('user-co', 'getUserStats')
}
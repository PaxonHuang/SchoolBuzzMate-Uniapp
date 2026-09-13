import type { LoginParams, LoginResult } from '@/types/user'

/**
 * uni-id-co 是 **云对象**（index.obj.js / module.exports = {方法名}），
 * 必须走 `uniCloud.importObject(name).方法名(params)` 的 callObject 通道，
 * **不能**用 `uniCloud.callFunction`（那是云函数通道，云端会报
 * "Method name ... is required"）。详见 .claude/memory/known-issues.md #33。
 *
 * customUI: true — 关掉官方内置的 loading/错误弹窗，本项目自己处理 UI。
 */
function uniIdCo() {
  return uniCloud.importObject('uni-id-co', { customUI: true })
}

/** 微信授权登录 */
export function loginByWechat(params: LoginParams): Promise<LoginResult> {
  return uniIdCo().loginByWeixin(params)
}

/**
 * 获取当前登录用户信息（uni-id）
 * 注: 官方 uni-id-co 无 getUserInfo 方法, 对应的是 getAccountInfo。
 * 业务侧取资料请优先用 `src/api/user.ts` 的 getUserProfile（走 user-co）。
 */
export function getCurrentUser(): Promise<any> {
  return uniIdCo().getAccountInfo()
}

/** 退出登录 */
export function logoutUser(): Promise<void> {
  return uniIdCo().logout()
}

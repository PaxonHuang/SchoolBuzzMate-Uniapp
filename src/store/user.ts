import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserProfile, updateProfile, verifyStudent } from '@/api/user'
import { loginByWechat } from '@/api/auth'
import type { UserProfile, SchoolUser, LoginParams, UpdateProfileParams, VerifyStudentParams } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  // === 状态 ===
  const profile = ref<UserProfile | null>(null)
  const schoolUser = ref<SchoolUser | null>(null)
  const token = ref<string>('')

  // === 计算属性 ===
  const isLoggedIn = computed(() => !!token.value)
  const isVerified = computed(() => schoolUser.value?.is_verified ?? false)
  const nickname = computed(() => profile.value?.nickname ?? '未登录')
  const avatar = computed(() => profile.value?.avatar ?? '')

  // === 方法 ===

  /** 微信登录 */
  async function login() {
    try {
      // 获取微信登录 code
      const loginRes = await uni.login({ provider: 'weixin' })
      if (!loginRes || !loginRes.code) {
        throw new Error('微信登录失败')
      }

      const params: LoginParams = { code: loginRes.code }
      const result = await loginByWechat(params)

      token.value = result.token
      profile.value = result.userInfo
      uni.setStorageSync('token', result.token)

      return result
    } catch (error) {
      console.error('[login] error:', error)
      throw error
    }
  }

  /** 获取用户资料 */
  async function fetchProfile() {
    if (!isLoggedIn.value) return null

    const result = await getUserProfile()
    profile.value = result.profile
    schoolUser.value = result.schoolUser
    return result
  }

  /** 更新用户资料 */
  async function updateUserProfile(params: UpdateProfileParams) {
    const result = await updateProfile(params)
    if (profile.value) {
      profile.value = { ...profile.value, ...result }
    }
    return result
  }

  /** 学生认证 */
  async function submitVerification(params: VerifyStudentParams) {
    const result = await verifyStudent(params)
    if (result.schoolUser) {
      schoolUser.value = result.schoolUser
    }
    return result
  }

  /** 设置 token */
  function setToken(t: string) {
    token.value = t
    uni.setStorageSync('token', t)
  }

  /** 退出登录 */
  function logout() {
    profile.value = null
    schoolUser.value = null
    token.value = ''
    uni.removeStorageSync('token')
    uni.removeStorageSync('currentSchoolId')
  }

  return {
    profile,
    schoolUser,
    token,
    isLoggedIn,
    isVerified,
    nickname,
    avatar,
    login,
    fetchProfile,
    updateUserProfile,
    submitVerification,
    setToken,
    logout,
  }
}, {
  persist: {
    paths: ['token', 'profile'],
  },
})
/** 用户资料 */
export interface UserProfile {
  _id: string
  username?: string
  nickname: string
  mobile?: string
  avatar: string
  gender?: number
  status: number
  create_date: string
}

/** 学校用户扩展信息 */
export interface SchoolUser {
  _id: string
  user_id: string
  school_id: string
  college?: string
  major?: string
  grade?: string
  student_no?: string
  real_name?: string
  student_card?: string
  is_verified: boolean
  credit_score: number
  balance: number
  create_date: string
}

/** 学校 */
export interface School {
  _id: string
  name: string
  province: string
  city: string
  logo?: string
  status: number
}

/** 用户完整信息（合并 Profile + SchoolUser） */
export interface UserInfo {
  profile: UserProfile
  schoolUser: SchoolUser | null
  school: School | null
}

/** 登录参数 */
export interface LoginParams {
  code?: string  // 微信登录 code
}

/** 登录结果 */
export interface LoginResult {
  token: string
  tokenExpired: number
  userInfo: UserProfile
}

/** 更新用户资料参数 */
export interface UpdateProfileParams {
  nickname?: string
  avatar?: string
  gender?: number
  mobile?: string
}

/** 学生认证参数 */
export interface VerifyStudentParams {
  school_id: string
  real_name: string
  student_no: string
  college?: string
  major?: string
  grade?: string
  student_card: string  // 学生证照片URL
}
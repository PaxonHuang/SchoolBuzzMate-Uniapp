import type { ApiResponse } from '@/types/api'

/**
 * UniCloud **云函数** 通用调用封装（callFunction 通道）。
 *
 * ⚠️ 只用于本项目自己的 `-co` 云函数（uniCloud-aliyun/cloudfunctions/<name>/index.js，
 * 入口 `exports.main` + `{ action, params }` 分发）。
 * **不能**用它调云对象（`.obj.js`，如官方 uni-id-co）——云对象必须走
 * `uniCloud.importObject(name).方法名()`，否则云端报 "Method name ... is required"。
 * 详见 .claude/memory/known-issues.md #33。
 */
export async function callCloudFunction<T = any>(
  name: string,
  action: string,
  params: Record<string, any> = {},
): Promise<T> {
  // 带上登录态：云函数侧用 uni-id-common 的 checkToken 校验（见 common/auth.js）
  const uniIdToken = uni.getStorageSync('token') || undefined

  const res = await uniCloud.callFunction({
    name,
    data: { action, params, uniIdToken },
  })

  // 平台级失败（云函数不存在 / 超时 / 未关联服务空间）时 res.result 为 undefined，
  // 直接读 .code 会抛出难懂的 TypeError，这里给出可定位的错误。
  const result = res?.result as ApiResponse<T> | undefined
  if (!result) {
    throw new Error(
      `调用云函数 ${name}.${action} 无返回：云函数可能未部署到当前服务空间，或调用通道不对（云对象需用 importObject）`,
    )
  }

  if (result.code !== 0) {
    const error = new Error(result.msg || '操作失败')
    throw error
  }

  return result.data
}

/** UniCloud 上传文件 */
export async function uploadFile(filePath: string, cloudPath?: string): Promise<string> {
  const res = await uniCloud.uploadFile({
    filePath,
    cloudPath: cloudPath || `schoolbuzz/${Date.now()}_${filePath.split('/').pop()}`,
  })
  return res.fileID
}
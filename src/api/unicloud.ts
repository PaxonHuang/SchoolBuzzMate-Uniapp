import type { ApiResponse } from '@/types/api'

/** UniCloud 云函数通用调用封装 */
export async function callCloudFunction<T = any>(
  name: string,
  action: string,
  params: Record<string, any> = {},
): Promise<T> {
  const res = await uniCloud.callFunction({
    name,
    data: { action, params },
  })

  const result = res.result as ApiResponse<T>

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
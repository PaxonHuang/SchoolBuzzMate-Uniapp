import { uploadFile as _uploadFile } from './unicloud'

export { _uploadFile as uploadFile }

/** 上传学生证照片 */
export function uploadStudentCard(filePath: string): Promise<string> {
  return _uploadFile(filePath, `student-cards/${Date.now()}_${filePath.split('/').pop()}`)
}

/** 上传用户头像 */
export function uploadAvatar(filePath: string): Promise<string> {
  return _uploadFile(filePath, `avatars/${Date.now()}_${filePath.split('/').pop()}`)
}
import { callCloudFunction } from './unicloud'
import type { School } from '@/types/user'

/** 获取学校列表 */
export function getSchoolList(): Promise<School[]> {
  return callCloudFunction<School[]>('school-co', 'getSchoolList')
}

/** 获取学校统计信息 */
export function getSchoolStats(schoolId: string): Promise<any> {
  return callCloudFunction('school-co', 'getSchoolStats', { school_id: schoolId })
}
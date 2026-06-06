import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getSchoolList } from '@/api/school'
import type { School } from '@/types/user'

export const useSchoolStore = defineStore('school', () => {
  // === 状态 ===
  const schools = ref<School[]>([])
  const currentSchoolId = ref<string>('')

  // === 计算属性 ===
  const currentSchool = computed(() =>
    schools.value.find(s => s._id === currentSchoolId.value)
  )
  const currentSchoolName = computed(() =>
    currentSchool.value?.name ?? '选择学校'
  )

  // === 方法 ===

  /** 获取学校列表 */
  async function fetchSchools() {
    const result = await getSchoolList()
    schools.value = result

    // 如果还没选择学校且有默认值，自动选择第一个
    if (!currentSchoolId.value && result.length > 0) {
      const saved = uni.getStorageSync('currentSchoolId')
      if (saved && result.find(s => s._id === saved)) {
        currentSchoolId.value = saved
      } else {
        currentSchoolId.value = result[0]._id
      }
    }

    return result
  }

  /** 切换学校 */
  function switchSchool(schoolId: string) {
    currentSchoolId.value = schoolId
    uni.setStorageSync('currentSchoolId', schoolId)
  }

  return {
    schools,
    currentSchoolId,
    currentSchool,
    currentSchoolName,
    fetchSchools,
    switchSchool,
  }
}, {
  persist: {
    pick: ['currentSchoolId'],
  },
})
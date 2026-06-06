<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useSchoolStore } from '@/store/school'

onLaunch((options) => {
  console.log('App Launch', options)
})

onShow((options) => {
  console.log('App Show', options)

  // 如果已登录但未选择学校，自动加载学校列表
  const userStore = useUserStore()
  const schoolStore = useSchoolStore()
  if (userStore.isLoggedIn && !schoolStore.currentSchoolId) {
    void schoolStore.fetchSchools()
  }
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import './style/index.scss';
</style>
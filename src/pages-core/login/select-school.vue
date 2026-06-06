<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSchoolStore } from '@/store/school'
import type { School } from '@/types/user'

const schoolStore = useSchoolStore()
const loading = ref(true)
const submitting = ref(false)

onMounted(async () => {
  try {
    await schoolStore.fetchSchools()
  } catch (error) {
    console.error('[select-school]', error)
  } finally {
    loading.value = false
  }
})

async function handleSelect(school: School) {
  submitting.value = true
  try {
    schoolStore.switchSchool(school._id)
    uni.reLaunch({ url: '/pages/index/index' })
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="page">
    <view class="header">
      <text class="title">选择你的学校</text>
      <text class="subtitle">选择学校后，你将看到该学校的商品</text>
    </view>

    <wd-loading v-if="loading" class="loading" />

    <view v-else class="school-list">
      <view
        v-for="school in schoolStore.schools"
        :key="school._id"
        class="school-item"
        :class="{ selected: school._id === schoolStore.currentSchoolId }"
        @click="handleSelect(school)"
      >
        <view class="school-info">
          <text class="school-name">{{ school.name }}</text>
          <text class="school-location">{{ school.province }} · {{ school.city }}</text>
        </view>
        <text v-if="school._id === schoolStore.currentSchoolId" class="i-carbon-checkmark check-icon" />
      </view>
    </view>

    <wd-toast />
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  padding: 60rpx 40rpx 40rpx;
  background: white;
  margin-bottom: 20rpx;

  .title {
    font-size: 40rpx;
    font-weight: 600;
    color: #333;
    display: block;
    margin-bottom: 12rpx;
  }

  .subtitle {
    font-size: 26rpx;
    color: #999;
  }
}

.loading {
  margin-top: 200rpx;
}

.school-list {
  background: white;
  padding: 0 40rpx;
}

.school-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &.selected {
    .school-name {
      color: #07c160;
    }
  }

  .school-info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  .school-name {
    font-size: 32rpx;
    color: #333;
    font-weight: 500;
  }

  .school-location {
    font-size: 24rpx;
    color: #999;
  }

  .check-icon {
    font-size: 40rpx;
    color: #07c160;
  }
}
</style>
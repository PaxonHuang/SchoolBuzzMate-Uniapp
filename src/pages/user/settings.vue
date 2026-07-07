<script setup lang="ts">
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

function handleClearCache() {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.clearStorageSync()
        uni.showToast({ title: '缓存已清除', icon: 'success' })
      }
    },
  })
}

function handleLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.reLaunch({ url: '/pages-core/login/index' })
      }
    },
  })
}

function goToAbout() {
  uni.navigateTo({ url: '/pages/user/about' })
}
</script>

<template>
  <view class="page">
    <view class="section">
      <view class="menu-item" @click="handleClearCache">
        <text class="menu-text">清除缓存</text>
        <text class="i-carbon-chevron-right arrow" />
      </view>
      <view class="menu-item" @click="goToAbout">
        <text class="menu-text">关于校趣闪搭</text>
        <text class="i-carbon-chevron-right arrow" />
      </view>
    </view>

    <view class="logout-btn" @click="handleLogout">
      <text>退出登录</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.section {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .menu-text {
    flex: 1;
    font-size: 28rpx;
    color: #333;
  }

  .arrow {
    font-size: 28rpx;
    color: #ccc;
  }
}

.logout-btn {
  margin: 40rpx 20rpx;
  height: 88rpx;
  background: white;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fa5151;
  font-size: 30rpx;
}
</style>
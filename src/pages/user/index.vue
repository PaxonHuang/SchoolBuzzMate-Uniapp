<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useSchoolStore } from '@/store/school'

const userStore = useUserStore()
const schoolStore = useSchoolStore()
const loading = ref(true)

onMounted(async () => {
  if (userStore.isLoggedIn) {
    try {
      await userStore.fetchProfile()
    } catch (error) {
      console.error('[user] fetchProfile:', error)
    }
  }
  loading.value = false
})

function goToProfile() {
  uni.navigateTo({ url: '/pages/user/profile' })
}

function goToVerify() {
  uni.navigateTo({ url: '/pages/user/verify' })
}

function goToSettings() {
  uni.navigateTo({ url: '/pages/user/settings' })
}

function goToLogin() {
  uni.reLaunch({ url: '/pages-core/login/index' })
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

function switchSchool() {
  uni.navigateTo({ url: '/pages-core/login/select-school' })
}

function goToOrders(type: 'buy' | 'sell') {
  uni.navigateTo({ url: `/pages/order/list?type=${type}` })
}

function goToFavorites() {
  uni.navigateTo({ url: '/pages/product/favorites' })
}
</script>

<template>
  <view class="page">
    <!-- 未登录状态 -->
    <view v-if="!userStore.isLoggedIn && !loading" class="not-login">
      <view class="avatar-placeholder">
        <text class="i-carbon-user-avatar" />
      </view>
      <text class="login-hint">登录后查看更多</text>
      <view class="login-btn" @click="goToLogin">
        <text>微信一键登录</text>
      </view>
    </view>

    <!-- 已登录状态 -->
    <template v-else-if="userStore.isLoggedIn">
      <!-- 用户信息卡片 -->
      <view class="user-card">
        <view class="user-info" @click="goToProfile">
          <image
            v-if="userStore.avatar"
            :src="userStore.avatar"
            class="avatar"
            mode="aspectFill"
          />
          <text v-else class="i-carbon-user-avatar avatar-placeholder" />
          <view class="user-text">
            <text class="nickname">{{ userStore.nickname }}</text>
            <view class="user-meta">
              <text class="school-name">{{ schoolStore.currentSchoolName }}</text>
              <view v-if="userStore.isVerified" class="verified-badge">
                <text class="i-carbon-checkmark" />
                <text>已认证</text>
              </view>
              <view v-else class="unverified-badge" @click.stop="goToVerify">
                <text>去认证</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 功能菜单 -->
      <view class="menu-section">
        <text class="section-title">交易管理</text>
        <view class="menu-list">
          <view class="menu-item" @click="goToOrders('buy')">
            <text class="i-carbon-shopping-bag menu-icon" />
            <text class="menu-text">我买到的</text>
            <text class="i-carbon-chevron-right arrow" />
          </view>
          <view class="menu-item" @click="goToOrders('sell')">
            <text class="i-carbon-shopping-bag menu-icon" />
            <text class="menu-text">我卖出的</text>
            <text class="i-carbon-chevron-right arrow" />
          </view>
          <view class="menu-item" @click="goToFavorites">
            <text class="i-carbon-favorite menu-icon" />
            <text class="menu-text">我的收藏</text>
            <text class="i-carbon-chevron-right arrow" />
          </view>
        </view>
      </view>

      <view class="menu-section">
        <text class="section-title">其他</text>
        <view class="menu-list">
          <view class="menu-item" @click="switchSchool">
            <text class="i-carbon-building menu-icon" />
            <text class="menu-text">切换学校</text>
            <text class="i-carbon-chevron-right arrow" />
          </view>
          <view class="menu-item" @click="goToSettings">
            <text class="i-carbon-settings menu-icon" />
            <text class="menu-text">设置</text>
            <text class="i-carbon-chevron-right arrow" />
          </view>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="logout-btn" @click="handleLogout">
        <text>退出登录</text>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100rpx;
}

.not-login {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;

  .avatar-placeholder {
    width: 160rpx;
    height: 160rpx;
    background: #e5e5e5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 80rpx;
    color: #ccc;
  }

  .login-hint {
    font-size: 28rpx;
    color: #999;
    margin-top: 40rpx;
  }

  .login-btn {
    margin-top: 40rpx;
    width: 400rpx;
    height: 80rpx;
    background: #07c160;
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 30rpx;
  }
}

.user-card {
  background: linear-gradient(135deg, #07c160, #06d154);
  padding: 60rpx 40rpx 40rpx;

  .user-info {
    display: flex;
    align-items: center;
    gap: 24rpx;
  }

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.5);
  }

  .avatar-placeholder {
    width: 120rpx;
    height: 120rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60rpx;
    color: rgba(255, 255, 255, 0.7);
  }

  .user-text {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  .nickname {
    font-size: 36rpx;
    font-weight: 600;
    color: white;
  }

  .user-meta {
    display: flex;
    align-items: center;
    gap: 16rpx;
    flex-wrap: wrap;
  }

  .school-name {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.8);
  }

  .verified-badge {
    display: flex;
    align-items: center;
    gap: 4rpx;
    background: rgba(255, 255, 255, 0.25);
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: white;
  }

  .unverified-badge {
    background: rgba(255, 255, 255, 0.25);
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
    font-size: 22rpx;
    color: white;
  }
}

.menu-section {
  margin: 20rpx 20rpx 0;
  background: white;
  border-radius: 16rpx;
  overflow: hidden;

  .section-title {
    font-size: 24rpx;
    color: #999;
    padding: 24rpx 30rpx 0;
  }

  .menu-list {
    margin-top: 12rpx;
  }
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 30rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .menu-icon {
    font-size: 36rpx;
    color: #666;
    margin-right: 20rpx;
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
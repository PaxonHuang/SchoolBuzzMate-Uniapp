<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'
import { useSchoolStore } from '@/store/school'

const userStore = useUserStore()
const schoolStore = useSchoolStore()
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  loading.value = true
  errorMsg.value = ''

  try {
    // 调用微信登录
    await userStore.login()

    // 登录成功后加载学校列表
    await schoolStore.fetchSchools()

    // 跳转到首页或学校选择页
    if (schoolStore.currentSchoolId) {
      uni.reLaunch({ url: '/pages/index/index' })
    } else {
      uni.reLaunch({ url: '/pages-core/login/select-school' })
    }
  } catch (error: any) {
    console.error('[login] error:', error)
    errorMsg.value = error.message || '登录失败，请重试'
    uni.showToast({ title: errorMsg.value, icon: 'none' })
  } finally {
    loading.value = false
  }
}

function handleAgreement() {
  uni.showModal({
    title: '用户协议',
    content: '《校趣闪搭用户服务协议》《隐私政策》',
    showCancel: false,
  })
}
</script>

<template>
  <view class="login-page">
    <!-- Logo 区域 -->
    <view class="logo-area">
      <view class="logo-icon">
        <text class="i-carbon-campsite logo-glyph" />
      </view>
      <text class="app-name">校趣闪搭</text>
      <text class="app-desc">校园社交交易平台</text>
    </view>

    <!-- 登录按钮区域 -->
    <view class="login-area">
      <view class="login-btn" :class="{ loading }" @click="handleLogin">
        <wd-loading v-if="loading" color="#fff" size="36rpx" />
        <text v-else class="i-carbon-wechat-filled btn-icon" />
        <text>{{ loading ? '登录中...' : '微信一键登录' }}</text>
      </view>

      <text v-if="errorMsg" class="error-msg">{{ errorMsg }}</text>

      <view class="agreement" @click="handleAgreement">
        <text class="agreement-text">登录即表示同意《用户协议》和《隐私政策》</text>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="footer-tip">
      <text>仅限在校大学生使用</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #07c160 0%, #06d154 50%, #05e048 100%);
  padding: 60rpx;
}

.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 120rpx;

  .logo-icon {
    width: 180rpx;
    height: 180rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 40rpx;
    backdrop-filter: blur(10px);
  }

  .logo-glyph {
    font-size: 80rpx;
    color: white;
  }

  .app-name {
    font-size: 56rpx;
    font-weight: 700;
    color: white;
    margin-bottom: 16rpx;
  }

  .app-desc {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

.login-area {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;

  .login-btn {
    width: 100%;
    height: 96rpx;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    font-size: 32rpx;
    font-weight: 500;
    color: #07c160;

    &.loading {
      opacity: 0.7;
    }

    .btn-icon {
      font-size: 40rpx;
    }
  }

  .error-msg {
    color: #fff;
    font-size: 24rpx;
    margin-top: 20rpx;
    background: rgba(255, 0, 0, 0.3);
    padding: 10rpx 20rpx;
    border-radius: 8rpx;
  }

  .agreement {
    margin-top: 40rpx;

    .agreement-text {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.footer-tip {
  position: absolute;
  bottom: 60rpx;

  text {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.5);
  }
}
</style>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { uploadAvatar } from '@/api/upload'

const userStore = useUserStore()
const loading = ref(false)
const editing = ref(false)

const form = ref({
  nickname: '',
  avatar: '',
  gender: 0,
  mobile: '',
})

onMounted(async () => {
  await userStore.fetchProfile()
  if (userStore.profile) {
    form.value.nickname = userStore.profile.nickname || ''
    form.value.avatar = userStore.profile.avatar || ''
    form.value.gender = userStore.profile.gender || 0
    form.value.mobile = userStore.profile.mobile || ''
  }
})

function toggleEdit() {
  editing.value = !editing.value
  if (!editing.value) {
    // 取消编辑，恢复原值
    if (userStore.profile) {
      form.value.nickname = userStore.profile.nickname || ''
      form.value.avatar = userStore.profile.avatar || ''
      form.value.gender = userStore.profile.gender || 0
      form.value.mobile = userStore.profile.mobile || ''
    }
  }
}

async function handleSave() {
  loading.value = true
  try {
    await userStore.updateUserProfile({
      nickname: form.value.nickname,
      avatar: form.value.avatar,
      gender: form.value.gender,
      mobile: form.value.mobile,
    })
    editing.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch (error: any) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleUploadAvatar() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths[0]
      loading.value = true
      try {
        const fileID = await uploadAvatar(filePath)
        form.value.avatar = fileID
        uni.showToast({ title: '头像上传成功', icon: 'success' })
      } catch (error: any) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        loading.value = false
      }
    },
  })
}
</script>

<template>
  <view class="page">
    <!-- 头像 -->
    <view class="avatar-section">
      <view class="avatar-wrapper" @click="editing ? handleUploadAvatar() : undefined">
        <image
          v-if="form.avatar"
          :src="form.avatar"
          class="avatar"
          mode="aspectFill"
        />
        <text v-else class="i-carbon-user-avatar avatar-placeholder" />
        <text v-if="editing" class="upload-hint">点击更换头像</text>
      </view>
    </view>

    <!-- 资料表单 -->
    <view class="form-section">
      <view class="form-item">
        <text class="label">昵称</text>
        <input
          v-model="form.nickname"
          class="input"
          placeholder="请输入昵称"
          :disabled="!editing"
        />
      </view>

      <view class="form-item">
        <text class="label">性别</text>
        <view class="gender-group">
          <view
            class="gender-item"
            :class="{ active: form.gender === 1 && editing }"
            @click="editing ? form.gender = 1 : null"
          >
            <text>男</text>
          </view>
          <view
            class="gender-item"
            :class="{ active: form.gender === 2 && editing }"
            @click="editing ? form.gender = 2 : null"
          >
            <text>女</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">手机号</text>
        <input
          v-model="form.mobile"
          class="input"
          placeholder="请输入手机号"
          :disabled="!editing"
          type="number"
          maxlength="11"
        />
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions">
      <view v-if="!editing" class="edit-btn" @click="toggleEdit">
        <text>编辑资料</text>
      </view>
      <view v-else class="btn-group">
        <view class="cancel-btn" @click="toggleEdit">
          <text>取消</text>
        </view>
        <view class="save-btn" :class="{ loading }" @click="handleSave">
          <wd-loading v-if="loading" color="#fff" size="32rpx" />
          <text v-else>保存</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.avatar-section {
  display: flex;
  justify-content: center;
  padding: 60rpx 0;
  background: white;

  .avatar-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
  }

  .avatar {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
  }

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

  .upload-hint {
    font-size: 24rpx;
    color: #07c160;
  }
}

.form-section {
  margin-top: 20rpx;
  background: white;
  padding: 0 30rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 32rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .label {
    width: 120rpx;
    font-size: 28rpx;
    color: #666;
  }

  .input {
    flex: 1;
    font-size: 28rpx;
    color: #333;
  }

  .gender-group {
    display: flex;
    gap: 20rpx;

    .gender-item {
      padding: 12rpx 36rpx;
      border-radius: 8rpx;
      background: #f5f5f5;
      font-size: 28rpx;
      color: #999;

      &.active {
        background: #07c160;
        color: white;
      }
    }
  }
}

.actions {
  padding: 40rpx 30rpx;
}

.edit-btn {
  width: 100%;
  height: 88rpx;
  background: #07c160;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30rpx;
}

.btn-group {
  display: flex;
  gap: 20rpx;

  .cancel-btn, .save-btn {
    flex: 1;
    height: 88rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 30rpx;
  }

  .cancel-btn {
    background: white;
    color: #666;
    border: 1rpx solid #e5e5e5;
  }

  .save-btn {
    background: #07c160;
    color: white;

    &.loading {
      opacity: 0.7;
    }
  }
}
</style>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useSchoolStore } from '@/store/school'
import { uploadStudentCard } from '@/api/upload'
import type { School } from '@/types/user'

const userStore = useUserStore()
const schoolStore = useSchoolStore()
const loading = ref(false)
const submitting = ref(false)

const form = ref({
  school_id: '',
  real_name: '',
  student_no: '',
  college: '',
  major: '',
  grade: '',
  student_card: '',
})

onMounted(async () => {
  loading.value = true
  try {
    await userStore.fetchProfile()
    await schoolStore.fetchSchools()

    // 如果已有认证记录，回填表单
    if (userStore.schoolUser) {
      const u = userStore.schoolUser
      form.value.school_id = u.school_id
      form.value.real_name = u.real_name || ''
      form.value.student_no = u.student_no || ''
      form.value.college = u.college || ''
      form.value.major = u.major || ''
      form.value.grade = u.grade || ''
      form.value.student_card = u.student_card || ''
    }
  } catch (error) {
    console.error('[verify]', error)
  } finally {
    loading.value = false
  }
})

async function handleUploadCard() {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      try {
        loading.value = true
        const fileID = await uploadStudentCard(res.tempFilePaths[0])
        form.value.student_card = fileID
        uni.showToast({ title: '上传成功', icon: 'success' })
      } catch (error: any) {
        uni.showToast({ title: '上传失败', icon: 'none' })
      } finally {
        loading.value = false
      }
    },
  })
}

async function handleSubmit() {
  // 表单校验
  if (!form.value.school_id) {
    uni.showToast({ title: '请选择学校', icon: 'none' })
    return
  }
  if (!form.value.real_name.trim()) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' })
    return
  }
  if (!form.value.student_no.trim()) {
    uni.showToast({ title: '请输入学号', icon: 'none' })
    return
  }
  if (!form.value.student_card) {
    uni.showToast({ title: '请上传学生证照片', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await userStore.submitVerification({
      school_id: form.value.school_id,
      real_name: form.value.real_name.trim(),
      student_no: form.value.student_no.trim(),
      college: form.value.college.trim(),
      major: form.value.major.trim(),
      grade: form.value.grade.trim(),
      student_card: form.value.student_card,
    })
    uni.showModal({
      title: '提交成功',
      content: '学生认证信息已提交，请等待管理员审核',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      },
    })
  } catch (error: any) {
    uni.showToast({ title: error.message || '提交失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

function selectSchool() {
  const items = schoolStore.schools.map((s: School) => s.name)
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const school = schoolStore.schools[res.tapIndex]
      form.value.school_id = school._id
    },
  })
}
</script>

<template>
  <view class="page">
    <wd-loading v-if="loading && !form.school_id" class="loading" />

    <template v-else>
      <!-- 认证状态提示 -->
      <view v-if="userStore.schoolUser?.is_verified" class="verified-tip">
        <text class="i-carbon-checkmark-outline tip-icon" />
        <text class="tip-text">你已通过学生认证</text>
      </view>
      <view v-else-if="userStore.schoolUser" class="pending-tip">
        <text class="i-carbon-time tip-icon" />
        <text class="tip-text">认证审核中，请耐心等待</text>
      </view>

      <!-- 表单 -->
      <view class="form-section">
        <!-- 学校选择 -->
        <view class="form-item" @click="selectSchool">
          <text class="label">学校</text>
          <text class="value" :class="{ placeholder: !form.school_id }">
            {{ form.school_id ? schoolStore.schools.find((s: School) => s._id === form.school_id)?.name : '请选择学校' }}
          </text>
          <text class="i-carbon-chevron-right arrow" />
        </view>

        <view class="form-item">
          <text class="label">真实姓名</text>
          <input v-model="form.real_name" class="input" placeholder="请输入真实姓名" />
        </view>

        <view class="form-item">
          <text class="label">学号</text>
          <input v-model="form.student_no" class="input" placeholder="请输入学号" />
        </view>

        <view class="form-item">
          <text class="label">学院</text>
          <input v-model="form.college" class="input" placeholder="请输入学院（选填）" />
        </view>

        <view class="form-item">
          <text class="label">专业</text>
          <input v-model="form.major" class="input" placeholder="请输入专业（选填）" />
        </view>

        <view class="form-item">
          <text class="label">年级</text>
          <input v-model="form.grade" class="input" placeholder="如：2025级（选填）" />
        </view>
      </view>

      <!-- 学生证上传 -->
      <view class="upload-section">
        <text class="section-title">学生证照片</text>
        <text class="section-hint">请拍摄学生证正面，确保信息清晰可见</text>

        <view class="upload-area" @click="handleUploadCard">
          <image
            v-if="form.student_card"
            :src="form.student_card"
            class="card-image"
            mode="aspectFit"
          />
          <view v-else class="upload-placeholder">
            <text class="i-carbon-camera upload-icon" />
            <text class="upload-text">点击上传学生证</text>
          </view>
        </view>

        <text v-if="form.student_card" class="reupload-hint" @click="handleUploadCard">
          点击重新上传
        </text>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <view class="submit-btn" :class="{ loading: submitting }" @click="handleSubmit">
          <wd-loading v-if="submitting" color="#fff" size="32rpx" />
          <text v-else>{{ userStore.schoolUser ? '重新提交认证' : '提交认证' }}</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.loading {
  margin-top: 200rpx;
}

.verified-tip, .pending-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 30rpx;
  margin: 20rpx;
  border-radius: 12rpx;
}

.verified-tip {
  background: #e8f8ee;
  color: #07c160;
}

.pending-tip {
  background: #fff8e5;
  color: #ff9d00;
}

.tip-icon {
  font-size: 40rpx;
}

.tip-text {
  font-size: 28rpx;
}

.form-section {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
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
    width: 140rpx;
    font-size: 28rpx;
    color: #333;
  }

  .input {
    flex: 1;
    font-size: 28rpx;
    color: #333;
  }

  .value {
    flex: 1;
    font-size: 28rpx;
    color: #333;

    &.placeholder {
      color: #ccc;
    }
  }

  .arrow {
    font-size: 28rpx;
    color: #ccc;
  }
}

.upload-section {
  margin: 20rpx;
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;

  .section-title {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    display: block;
  }

  .section-hint {
    font-size: 24rpx;
    color: #999;
    margin-top: 8rpx;
    display: block;
  }
}

.upload-area {
  margin-top: 24rpx;
  width: 100%;
  height: 400rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .card-image {
    width: 100%;
    height: 100%;
  }

  .upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
  }

  .upload-icon {
    font-size: 60rpx;
    color: #ccc;
  }

  .upload-text {
    font-size: 26rpx;
    color: #999;
  }
}

.reupload-hint {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: #07c160;
  margin-top: 16rpx;
}

.submit-section {
  padding: 40rpx 20rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #07c160;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30rpx;

  &.loading {
    opacity: 0.7;
  }
}
</style>
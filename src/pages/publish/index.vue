<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  price: 0,
  originalPrice: 0,
  condition: 'used',
  tradeMethod: 'both',
  images: [] as string[],
})

const conditionOptions = [
  { label: '全新', value: 'brand_new' },
  { label: '几乎全新', value: 'like_new' },
  { label: '已使用', value: 'used' },
  { label: '较旧', value: 'old' },
]

const tradeOptions = [
  { label: '仅面交', value: 'self_pickup' },
  { label: '仅快递', value: 'express' },
  { label: '均可', value: 'both' },
]

async function handleUploadImage() {
  uni.chooseImage({
    count: 9 - form.value.images.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      // TODO: 上传到 UniCloud
      for (const path of res.tempFilePaths) {
        form.value.images.push(path)
      }
    },
  })
}

function removeImage(index: number) {
  form.value.images.splice(index, 1)
}

async function handlePublish() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  if (!form.value.price || form.value.price <= 0) {
    uni.showToast({ title: '请输入合理的价格', icon: 'none' })
    return
  }
  if (form.value.images.length === 0) {
    uni.showToast({ title: '请至少上传一张图片', icon: 'none' })
    return
  }

  loading.value = true
  try {
    // TODO: 调用商品云函数创建商品
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1000)
  } catch (error: any) {
    uni.showToast({ title: error.message || '发布失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="page">
    <!-- 图片上传 -->
    <view class="section">
      <text class="section-title">商品图片（{{ form.images.length }}/9）</text>
      <view class="image-list">
        <view class="image-item" v-for="(img, index) in form.images" :key="index">
          <image :src="img" mode="aspectFill" class="image" />
          <text class="remove-btn" @click="removeImage(index)">✕</text>
        </view>
        <view
          v-if="form.images.length < 9"
          class="add-image"
          @click="handleUploadImage"
        >
          <text class="i-carbon-camera add-icon" />
          <text class="add-text">添加图片</text>
        </view>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="section">
      <view class="form-item">
        <text class="label">标题</text>
        <input v-model="form.title" class="input" placeholder="请输入商品标题（2-100字）" maxlength="100" />
      </view>

      <view class="form-item">
        <text class="label">描述</text>
        <textarea
          v-model="form.description"
          class="textarea"
          placeholder="介绍你的商品，如购买时间、使用情况等..."
          maxlength="500"
          auto-height
        />
      </view>

      <view class="form-item">
        <text class="label">现价</text>
        <input
          v-model="form.price"
          class="input"
          type="digit"
          placeholder="¥ 0.00"
        />
      </view>

      <view class="form-item">
        <text class="label">原价（可选）</text>
        <input
          v-model="form.originalPrice"
          class="input"
          type="digit"
          placeholder="¥ 0.00"
        />
      </view>
    </view>

    <!-- 商品属性 -->
    <view class="section">
      <view class="form-item">
        <text class="label">新旧程度</text>
        <view class="option-group">
          <view
            v-for="opt in conditionOptions"
            :key="opt.value"
            class="option"
            :class="{ active: form.condition === opt.value }"
            @click="form.condition = opt.value"
          >
            <text>{{ opt.label }}</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">交易方式</text>
        <view class="option-group">
          <view
            v-for="opt in tradeOptions"
            :key="opt.value"
            class="option"
            :class="{ active: form.tradeMethod === opt.value }"
            @click="form.tradeMethod = opt.value"
          >
            <text>{{ opt.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 发布按钮 -->
    <view class="publish-section">
      <view class="publish-btn" :class="{ loading }" @click="handlePublish">
        <wd-loading v-if="loading" color="#fff" size="32rpx" />
        <text v-else>发布商品</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.section {
  background: white;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;

  .section-title {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 20rpx;
    display: block;
  }
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.image-item {
  position: relative;
  width: 150rpx;
  height: 150rpx;

  .image {
    width: 100%;
    height: 100%;
    border-radius: 8rpx;
  }

  .remove-btn {
    position: absolute;
    top: -8rpx;
    right: -8rpx;
    width: 36rpx;
    height: 36rpx;
    background: #fa5151;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
  }
}

.add-image {
  width: 150rpx;
  height: 150rpx;
  border: 2rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;

  .add-icon {
    font-size: 40rpx;
    color: #ccc;
  }

  .add-text {
    font-size: 20rpx;
    color: #999;
  }
}

.form-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 28rpx;
    color: #333;
    margin-bottom: 12rpx;
    display: block;
  }

  .input {
    font-size: 28rpx;
    color: #333;
    padding: 12rpx 0;
  }

  .textarea {
    font-size: 28rpx;
    color: #333;
    width: 100%;
    min-height: 120rpx;
    padding: 12rpx 0;
  }
}

.option-group {
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;

  .option {
    padding: 16rpx 32rpx;
    background: #f5f5f5;
    border-radius: 8rpx;
    font-size: 26rpx;
    color: #666;

    &.active {
      background: #e8f8ee;
      color: #07c160;
      border: 1rpx solid #07c160;
    }
  }
}

.publish-section {
  padding: 40rpx 20rpx;
}

.publish-btn {
  width: 100%;
  height: 88rpx;
  background: #07c160;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 30rpx;
  font-weight: 500;

  &.loading {
    opacity: 0.7;
  }
}
</style>
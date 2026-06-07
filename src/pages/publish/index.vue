<script setup lang="ts">
import { ref, computed } from 'vue'
import { createProduct } from '@/api/product'
import { uploadFile } from '@/api/upload'
import type { ProductCategory, ProductCondition, TradeMethod } from '@/types/product'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from '@/types/product'

const loading = ref(false)

const form = ref({
  title: '',
  description: '',
  price: '',
  original_price: '',
  category: '' as ProductCategory | '',
  condition: '' as ProductCondition | '',
  trade_method: [] as TradeMethod[],
  location: '',
  images: [] as string[],
})

const needLocation = computed(() => form.value.trade_method.includes('self_pickup'))

function toggleTradeMethod(method: TradeMethod) {
  const idx = form.value.trade_method.indexOf(method)
  if (idx >= 0) {
    form.value.trade_method.splice(idx, 1)
  } else {
    form.value.trade_method.push(method)
  }
}

async function handleUploadImage() {
  const remaining = 6 - form.value.images.length
  if (remaining <= 0) {
    uni.showToast({ title: '最多上传6张图片', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
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
  if (!form.value.title.trim() || form.value.title.length < 2) {
    uni.showToast({ title: '请输入标题（2-50字）', icon: 'none' })
    return
  }
  if (form.value.images.length === 0) {
    uni.showToast({ title: '请至少上传一张图片', icon: 'none' })
    return
  }
  if (!form.value.price || Number(form.value.price) <= 0) {
    uni.showToast({ title: '请输入合理的价格', icon: 'none' })
    return
  }
  if (!form.value.category) {
    uni.showToast({ title: '请选择分类', icon: 'none' })
    return
  }
  if (!form.value.condition) {
    uni.showToast({ title: '请选择成色', icon: 'none' })
    return
  }
  if (form.value.trade_method.length === 0) {
    uni.showToast({ title: '请选择交易方式', icon: 'none' })
    return
  }
  if (form.value.trade_method.includes('self_pickup') && !form.value.location.trim()) {
    uni.showToast({ title: '自提时请输入自提地点', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const uploadedImages: string[] = []
    for (const imgPath of form.value.images) {
      if (imgPath.startsWith('cloud://')) {
        uploadedImages.push(imgPath)
      } else {
        const fileID = await uploadFile(imgPath)
        uploadedImages.push(fileID)
      }
    }

    await createProduct({
      title: form.value.title.trim(),
      description: form.value.description.trim(),
      images: uploadedImages,
      price: Number(form.value.price),
      original_price: form.value.original_price ? Number(form.value.original_price) : undefined,
      category: form.value.category as ProductCategory,
      condition: form.value.condition as ProductCondition,
      trade_method: form.value.trade_method,
      location: form.value.location.trim() || undefined,
    })

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
      <text class="section-title">商品图片（{{ form.images.length }}/6）</text>
      <view class="image-list">
        <view class="image-item" v-for="(img, index) in form.images" :key="index">
          <image :src="img" mode="aspectFill" class="image" />
          <text class="remove-btn" @click="removeImage(index)">✕</text>
          <text v-if="index === 0" class="cover-badge">封面</text>
        </view>
        <view
          v-if="form.images.length < 6"
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
        <input v-model="form.title" class="input" placeholder="请输入商品标题（2-50字）" maxlength="50" />
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

      <view class="form-item price-row">
        <view class="price-field">
          <text class="label">售价</text>
          <input v-model="form.price" class="input" type="digit" placeholder="¥ 0.00" />
        </view>
        <view class="price-field">
          <text class="label">原价（可选）</text>
          <input v-model="form.original_price" class="input" type="digit" placeholder="¥ 0.00" />
        </view>
      </view>
    </view>

    <!-- 分类选择 -->
    <view class="section">
      <view class="form-item">
        <text class="label">商品分类</text>
        <view class="option-group">
          <view
            v-for="opt in CATEGORY_OPTIONS"
            :key="opt.value"
            class="option"
            :class="{ active: form.category === opt.value }"
            @click="form.category = opt.value"
          >
            <text>{{ opt.icon }} {{ opt.label }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 商品属性 -->
    <view class="section">
      <view class="form-item">
        <text class="label">新旧程度</text>
        <view class="option-group">
          <view
            v-for="opt in CONDITION_OPTIONS"
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
        <text class="label">交易方式（可多选）</text>
        <view class="option-group">
          <view
            class="option"
            :class="{ active: form.trade_method.includes('self_pickup') }"
            @click="toggleTradeMethod('self_pickup')"
          >
            <text>📍 面交自提</text>
          </view>
          <view
            class="option"
            :class="{ active: form.trade_method.includes('express') }"
            @click="toggleTradeMethod('express')"
          >
            <text>📦 快递</text>
          </view>
        </view>
      </view>

      <view v-if="needLocation" class="form-item">
        <text class="label">自提地点</text>
        <input v-model="form.location" class="input" placeholder="如：西操场、图书馆门口" />
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

  .cover-badge {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(7, 193, 96, 0.8);
    color: white;
    font-size: 18rpx;
    text-align: center;
    padding: 2rpx 0;
    border-radius: 0 0 8rpx 8rpx;
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

.price-row {
  display: flex;
  gap: 24rpx;
  border-bottom: none !important;
  padding-bottom: 0 !important;

  .price-field {
    flex: 1;
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

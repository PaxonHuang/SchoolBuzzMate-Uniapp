<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { createComment } from '@/api/comment'

const orderId = ref('')
const productTitle = ref('')
const rating = ref(5)
const content = ref('')
const anonymous = ref(false)
const submitting = ref(false)

const SUGGEST_TAGS = ['描述相符', '服务态度好', '价格合理', '发货迅速', '包装完好']

const selectedTags = ref<string[]>([])

function toggleTag(t: string) {
  const idx = selectedTags.value.indexOf(t)
  if (idx >= 0) selectedTags.value.splice(idx, 1)
  else selectedTags.value.push(t)
}

function setRating(n: number) {
  rating.value = n
}

async function submit() {
  if (!orderId.value) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }
  if (rating.value < 1) {
    uni.showToast({ title: '请给卖家打分', icon: 'none' })
    return
  }
  if (content.value.length > 500) {
    uni.showToast({ title: '评价内容不超过 500 字', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    await createComment({
      order_id: orderId.value,
      rating: rating.value,
      content: content.value.trim(),
      tags: selectedTags.value,
      anonymous: anonymous.value,
    })
    uni.showToast({ title: '评价成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e: any) {
    uni.showToast({ title: e.message || '评价失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

onLoad((q: any) => {
  if (q) {
    orderId.value = q.order_id || ''
    productTitle.value = q.title ? decodeURIComponent(q.title) : ''
  }
})
</script>

<template>
  <view class="page">
    <view v-if="productTitle" class="product-hint">
      <text class="i-carbon-package hint-icon"></text>
      <text class="hint-text">{{ productTitle }}</text>
    </view>

    <view class="card">
      <text class="card-label">打分</text>
      <view class="rating">
        <text
          v-for="n in 5"
          :key="n"
          class="rating-star"
          :class="{ active: n <= rating }"
          @click="setRating(n)"
        >★</text>
      </view>
    </view>

    <view class="card">
      <text class="card-label">标签 (可选)</text>
      <view class="tag-list">
        <text
          v-for="t in SUGGEST_TAGS"
          :key="t"
          class="tag"
          :class="{ active: selectedTags.includes(t) }"
          @click="toggleTag(t)"
        >{{ t }}</text>
      </view>
    </view>

    <view class="card">
      <text class="card-label">评价内容 (选填)</text>
      <textarea
        v-model="content"
        class="content-textarea"
        placeholder="说说你对这次交易的感受吧~"
        maxlength="500"
      />
      <text class="char-count">{{ content.length }}/500</text>
    </view>

    <view class="card anonymous-row" @click="anonymous = !anonymous">
      <text class="card-label-inline">匿名评价</text>
      <view class="switch" :class="{ on: anonymous }">
        <view class="switch-dot"></view>
      </view>
    </view>

    <view class="submit-bar">
      <view class="submit-btn" :class="{ disabled: submitting }" @click="submit">
        {{ submitting ? '提交中...' : '提交评价' }}
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; background: #f5f5f5; padding-bottom: 140rpx; }
.product-hint {
  background: white; padding: 24rpx 30rpx; margin-bottom: 20rpx;
  display: flex; align-items: center; gap: 12rpx;
  .hint-icon { font-size: 32rpx; color: #07c160; }
  .hint-text { font-size: 26rpx; color: #333; }
}
.card {
  background: white; padding: 30rpx; margin: 0 20rpx 20rpx; border-radius: 16rpx;
  position: relative;
  .card-label { font-size: 28rpx; color: #333; font-weight: 500; display: block; margin-bottom: 20rpx; }
  .card-label-inline { font-size: 28rpx; color: #333; flex: 1; }
}
.rating {
  display: flex; gap: 20rpx;
  .rating-star {
    font-size: 64rpx; color: #e5e5e5; line-height: 1;
    transition: color 0.2s;
    &.active { color: #ff9500; }
  }
}
.tag-list {
  display: flex; flex-wrap: wrap; gap: 16rpx;
  .tag {
    padding: 12rpx 24rpx; background: #f5f5f5; color: #666;
    font-size: 26rpx; border-radius: 8rpx;
    &.active { background: #e8f8ee; color: #07c160; }
  }
}
.content-textarea {
  width: 100%; min-height: 200rpx; padding: 16rpx;
  background: #f5f5f5; border-radius: 8rpx; font-size: 26rpx;
  box-sizing: border-box;
}
.char-count {
  position: absolute; right: 40rpx; bottom: 40rpx;
  font-size: 22rpx; color: #999;
}
.anonymous-row {
  display: flex; align-items: center; padding: 30rpx;
  .switch {
    width: 80rpx; height: 44rpx; background: #e5e5e5; border-radius: 22rpx;
    position: relative; transition: background 0.2s;
    .switch-dot {
      position: absolute; top: 4rpx; left: 4rpx;
      width: 36rpx; height: 36rpx; background: white;
      border-radius: 50%; transition: transform 0.2s;
      box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.2);
    }
    &.on { background: #07c160; }
    &.on .switch-dot { transform: translateX(36rpx); }
  }
}
.submit-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  padding: 20rpx 30rpx; background: white;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  .submit-btn {
    height: 88rpx; background: #07c160; color: white;
    border-radius: 16rpx; display: flex; align-items: center;
    justify-content: center; font-size: 30rpx; font-weight: 500;
    &.disabled { opacity: 0.6; }
  }
}
</style>

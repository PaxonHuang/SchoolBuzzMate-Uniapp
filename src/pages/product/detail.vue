<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getProductDetail, toggleProductLike } from '@/api/product'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS } from '@/types/product'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const product = ref<any>(null)
const seller = ref<any>(null)
const isLiked = ref(false)
const isOwner = ref(false)
const loading = ref(true)
const currentImageIndex = ref(0)

function getCategoryIcon(category: string) {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.icon || '🎨'
}

function getConditionLabel(condition: string) {
  return CONDITION_OPTIONS.find(c => c.value === condition)?.label || condition
}

function formatTime(time: string) {
  if (!time) return ''
  return dayjs(time).fromNow()
}

async function handleToggleLike() {
  if (!product.value) return
  try {
    const res = await toggleProductLike(product.value._id)
    isLiked.value = res.is_liked
    product.value.like_count = res.like_count
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

function previewImage(index: number) {
  if (!product.value) return
  uni.previewImage({ urls: product.value.images, current: index })
}

function contactSeller() {
  uni.showToast({ title: '私信功能开发中', icon: 'none' })
}

function handleBuy() {
  uni.showToast({ title: '下单功能开发中', icon: 'none' })
}

async function loadDetail(product_id: string) {
  loading.value = true
  try {
    const res = await getProductDetail(product_id)
    product.value = res.product
    seller.value = res.seller
    isLiked.value = res.is_liked
    isOwner.value = res.is_owner
    uni.setNavigationBarTitle({ title: res.product?.title || '商品详情' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  const id = options?.id
  if (id) {
    loadDetail(id)
  } else {
    uni.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
  }
})
</script>

<template>
  <view v-if="product" class="page">
    <!-- 卖家信息区 -->
    <view class="seller-section">
      <view class="seller-info">
        <image v-if="seller?.avatar" :src="seller.avatar" class="avatar" mode="aspectFill" />
        <view v-else class="avatar avatar-placeholder">
          <text class="i-carbon-user" />
        </view>
        <view class="seller-meta">
          <text class="seller-name">{{ seller?.nickname || '匿名用户' }}</text>
          <view class="seller-detail">
            <text class="time">{{ formatTime(product.publish_time) }}</text>
            <text v-if="seller?.college" class="college">· {{ seller.college }}</text>
          </view>
        </view>
      </view>
      <view class="seller-stats">
        <text class="stat-item">信用 {{ seller?.credit_score || 100 }}</text>
        <text class="stat-divider">|</text>
        <text class="stat-item">在售 {{ seller?.product_count || 0 }}件</text>
      </view>
    </view>

    <!-- 图片轮播 -->
    <swiper
      v-if="product.images && product.images.length > 0"
      class="image-swiper"
      :indicator-dots="product.images.length > 1"
      indicator-color="rgba(255,255,255,0.5)"
      indicator-active-color="#fff"
      :autoplay="false"
      @change="e => currentImageIndex = e.detail.current"
    >
      <swiper-item v-for="(img, index) in product.images" :key="index">
        <image :src="img" class="product-image" mode="aspectFill" @click="previewImage(index)" />
      </swiper-item>
    </swiper>
    <view v-else class="image-placeholder">
      <text class="i-carbon-image placeholder-icon" />
    </view>

    <!-- 商品信息 -->
    <view class="info-section">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text v-if="product.original_price" class="original-price">原价 ¥{{ product.original_price }}</text>
      </view>
      <text class="title">{{ product.title }}</text>
      <view class="tags-row">
        <text class="tag condition-tag">{{ getConditionLabel(product.condition) }}</text>
        <text v-for="method in product.trade_method" :key="method" class="tag method-tag">
          {{ method === 'self_pickup' ? '📍 自提' : '📦 快递' }}
        </text>
        <text class="tag category-tag">{{ getCategoryIcon(product.category) }}</text>
      </view>
      <text v-if="product.description" class="description">{{ product.description }}</text>
    </view>

    <!-- 互动区 -->
    <view class="interaction-section">
      <view class="interaction-stats">
        <text class="stat" @click="handleToggleLike">
          <text :class="isLiked ? 'i-carbon-favorite-filled liked' : 'i-carbon-favorite'" />
          {{ product.like_count || 0 }}
        </text>
        <text class="stat">
          <text class="i-carbon-view" />
          {{ product.view_count || 0 }}
        </text>
        <text v-if="product.location" class="stat">
          <text class="i-carbon-location" />
          {{ product.location }}
        </text>
      </view>
    </view>

    <!-- 评论占位 -->
    <view class="comment-section">
      <view class="section-header">
        <text class="section-title">评论 ({{ product.comment_count || 0 }})</text>
      </view>
      <view class="comment-placeholder">
        <text class="i-carbon-chat comment-icon" />
        <text class="comment-text">评论功能开发中...</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-btn" :class="{ liked: isLiked }" @click="handleToggleLike">
        <text :class="isLiked ? 'i-carbon-favorite-filled' : 'i-carbon-favorite'" />
        <text class="action-text">收藏</text>
      </view>
      <view class="action-btn" @click="contactSeller">
        <text class="i-carbon-chat" />
        <text class="action-text">聊天</text>
      </view>
      <view v-if="!isOwner" class="buy-btn" @click="handleBuy">
        <text>立即购买</text>
      </view>
      <view v-else class="buy-btn owner-btn">
        <text>{{ product.status === 1 ? '下架商品' : '重新上架' }}</text>
      </view>
    </view>
  </view>

  <view v-else-if="loading" class="page loading-page">
    <wd-loading size="60rpx" />
    <text class="loading-text">加载中...</text>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
}

.loading-text { color: #999; font-size: 26rpx; }

.seller-section {
  background: white;
  padding: 24rpx 30rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.seller-info { display: flex; align-items: center; gap: 20rpx; }

.avatar { width: 80rpx; height: 80rpx; border-radius: 50%; }

.avatar-placeholder {
  background: #e8f8ee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #07c160;
  font-size: 36rpx;
}

.seller-meta {
  .seller-name { font-size: 30rpx; font-weight: 500; color: #333; display: block; }
  .seller-detail { margin-top: 4rpx; font-size: 24rpx; color: #999; }
}

.seller-stats {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 22rpx;
  color: #666;
}

.stat-divider { color: #ddd; }

.image-swiper { width: 100%; height: 600rpx; }
.product-image { width: 100%; height: 100%; }

.image-placeholder {
  width: 100%;
  height: 400rpx;
  background: #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: center;
  .placeholder-icon { font-size: 80rpx; color: #ccc; }
}

.info-section {
  background: white;
  padding: 24rpx 30rpx;
  margin-top: 2rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.price { font-size: 40rpx; font-weight: 700; color: #ff6b00; }
.original-price { font-size: 24rpx; color: #999; text-decoration: line-through; }

.title {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.4;
  margin-bottom: 16rpx;
  display: block;
}

.tags-row { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 16rpx; }
.tag { font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 6rpx; }
.condition-tag { background: #e8f8ee; color: #07c160; }
.method-tag { background: #fff3e0; color: #ff6b00; }
.category-tag { background: #f0f0f0; color: #666; }

.description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  display: block;
}

.interaction-section {
  background: white;
  padding: 20rpx 30rpx;
  margin-top: 16rpx;
}

.interaction-stats { display: flex; gap: 32rpx; }
.stat { font-size: 26rpx; color: #666; display: flex; align-items: center; gap: 8rpx; }
.liked { color: #fa5151; }

.comment-section {
  background: white;
  margin-top: 16rpx;
  padding: 24rpx 30rpx;
}

.section-header { margin-bottom: 20rpx; }
.section-title { font-size: 28rpx; font-weight: 500; color: #333; }

.comment-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  gap: 12rpx;
}

.comment-icon { font-size: 48rpx; color: #ccc; }
.comment-text { font-size: 24rpx; color: #999; }

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: white;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  gap: 16rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100rpx;
  gap: 4rpx;
  font-size: 36rpx;
  color: #666;
  &.liked { color: #fa5151; }
}

.action-text { font-size: 20rpx; }

.buy-btn {
  flex: 1;
  height: 72rpx;
  background: #07c160;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28rpx;
  font-weight: 500;
}

.owner-btn { background: #ff9500; }
</style>

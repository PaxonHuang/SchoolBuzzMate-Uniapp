<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getProductDetail, toggleProductLike } from '@/api/product'
import { toggleFavorite, checkFavoritedBatch } from '@/api/favorite'
import { createOrder } from '@/api/order'
import { getCommentsByProduct } from '@/api/comment'
import { useUserStore } from '@/store/user'
import { CATEGORY_OPTIONS, CONDITION_OPTIONS, type TradeMethod } from '@/types/product'
import type { CommentItem } from '@/types/comment'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const userStore = useUserStore()
const product = ref<any>(null)
const seller = ref<any>(null)
const isLiked = ref(false)
const isFavorited = ref(false)
const isOwner = ref(false)
const loading = ref(true)
const commentList = ref<CommentItem[]>([])
const currentImageIndex = ref(0)
const showBuySheet = ref(false)
const selectedTrade = ref<TradeMethod>('self_pickup')
const address = ref({ name: '', phone: '', address: '', detail: '' })
const buying = ref(false)

function getCategoryIcon(category: string) {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.icon || '📦'
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

async function handleToggleFavorite() {
  if (!product.value) return
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages-core/login/index' })
    return
  }
  try {
    const res = await toggleFavorite(product.value._id)
    isFavorited.value = res.is_favorited
    uni.showToast({ title: res.is_favorited ? '已收藏' : '已取消收藏', icon: 'none' })
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

function previewImage(index: number | string) {
  if (!product.value) return
  uni.previewImage({ urls: product.value.images, current: index })
}

function contactSeller() {
  uni.showToast({ title: '私信功能开发中', icon: 'none' })
}

function openBuySheet() {
  if (!userStore.isLoggedIn) {
    uni.navigateTo({ url: '/pages-core/login/index' })
    return
  }
  if (!userStore.isVerified) {
    uni.showModal({
      title: '提示',
      content: '购买需要先完成学生认证,是否前往?',
      success: function (r) {
        if (r.confirm) uni.navigateTo({ url: '/pages/user/verify' })
      },
    })
    return
  }
  if (isOwner.value) {
    uni.showToast({ title: '不能购买自己的商品', icon: 'none' })
    return
  }
  if (product.value && product.value.trade_method && product.value.trade_method.length > 0) {
    selectedTrade.value = product.value.trade_method[0]
  }
  address.value = { name: userStore.profile?.nickname || '', phone: '', address: '', detail: '' }
  showBuySheet.value = true
}

async function submitOrder() {
  if (!product.value) return
  if (selectedTrade.value === 'express') {
    if (!address.value.name || !address.value.phone || !address.value.address) {
      uni.showToast({ title: '请完整填写收货地址', icon: 'none' })
      return
    }
  }
  buying.value = true
  try {
    const r = await createOrder({
      product_id: product.value._id,
      trade_method: selectedTrade.value,
      address: selectedTrade.value === 'express' ? address.value : undefined,
    })
    showBuySheet.value = false
    uni.showToast({ title: '下单成功', icon: 'success' })
    setTimeout(function () {
      uni.navigateTo({ url: '/pages/order/detail?id=' + r.order._id })
    }, 800)
  } catch (e: any) {
    uni.showToast({ title: e.message || '下单失败', icon: 'none' })
  } finally {
    buying.value = false
  }
}

function onSwiperChange(e: any) {
  currentImageIndex.value = e.detail.current
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
    if (userStore.isLoggedIn) {
      try {
        const favRes = await checkFavoritedBatch([product_id])
        isFavorited.value = favRes.favorited.indexOf(product_id) >= 0
      } catch (_) { /* 静默 */ }
    }
    // 加载评价列表 (非阻塞, 失败不影响主流程)
    getCommentsByProduct(product_id, 1, 5).then(function (r) {
      commentList.value = r.list
    }).catch(function () { /* 静默 */ })
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
    <view class="seller-section">
      <view class="seller-info">
        <image v-if="seller?.avatar" :src="seller.avatar" class="avatar" mode="aspectFill" />
        <view v-else class="avatar avatar-placeholder">
          <text class="i-carbon-user"></text>
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

    <swiper
      v-if="product.images && product.images.length > 0"
      class="image-swiper"
      :indicator-dots="product.images.length > 1"
      indicator-color="rgba(255,255,255,0.5)"
      indicator-active-color="#fff"
      :autoplay="false"
      @change="onSwiperChange"
    >
      <swiper-item v-for="(img, index) in product.images" :key="index">
        <image :src="img" class="product-image" mode="aspectFill" @click="previewImage(index)" />
      </swiper-item>
    </swiper>
    <view v-else class="image-placeholder">
      <text class="i-carbon-image placeholder-icon"></text>
    </view>

    <view class="info-section">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text v-if="product.original_price" class="original-price">原价 ¥{{ product.original_price }}</text>
      </view>
      <text class="title">{{ product.title }}</text>
      <view class="tags-row">
        <text class="tag condition-tag">{{ getConditionLabel(product.condition) }}</text>
        <text v-for="method in product.trade_method" :key="method" class="tag method-tag">
          {{ method === 'self_pickup' ? '🚇 自提' : '🚚 快递' }}
        </text>
        <text class="tag category-tag">{{ getCategoryIcon(product.category) }}</text>
      </view>
      <text v-if="product.description" class="description">{{ product.description }}</text>
    </view>

    <view class="interaction-section">
      <view class="interaction-stats">
        <text class="stat" @click="handleToggleLike">
          <text :class="isLiked ? 'i-carbon-favorite-filled liked' : 'i-carbon-favorite'"></text>
          {{ product.like_count || 0 }}
        </text>
        <text class="stat" @click="handleToggleFavorite">
          <text :class="isFavorited ? 'i-carbon-star-filled fav' : 'i-carbon-star'"></text>
          {{ isFavorited ? '已收藏' : '收藏' }}
        </text>
        <text class="stat">
          <text class="i-carbon-view"></text>
          {{ product.view_count || 0 }}
        </text>
        <text v-if="product.location" class="stat">
          <text class="i-carbon-location"></text>
          {{ product.location }}
        </text>
      </view>
    </view>

    <view class="comment-section">
      <view class="section-header">
        <text class="section-title">评论 ({{ product.comment_count || 0 }})</text>
      </view>
      <view v-if="commentList.length === 0" class="comment-placeholder">
        <text class="i-carbon-chat comment-icon"></text>
        <text class="comment-text">暂无评价</text>
      </view>
      <view v-else class="comment-list">
        <view v-for="c in commentList" :key="c._id" class="comment-item">
          <view class="comment-head">
            <image v-if="c.buyer?.avatar" :src="c.buyer.avatar" class="c-avatar" mode="aspectFill" />
            <view v-else class="c-avatar c-avatar-blank">
              <text class="i-carbon-user"></text>
            </view>
            <view class="c-meta">
              <text class="c-name">{{ c.buyer?.nickname || '匿名用户' }}</text>
              <view class="c-rating">
                <text
                  v-for="n in 5"
                  :key="n"
                  class="c-star"
                  :class="{ active: n <= c.rating }"
                >★</text>
              </view>
            </view>
            <text class="c-time">{{ formatTime(c.create_date) }}</text>
          </view>
          <text v-if="c.content" class="c-content">{{ c.content }}</text>
          <view v-if="c.tags && c.tags.length > 0" class="c-tags">
            <text v-for="t in c.tags" :key="t" class="c-tag">{{ t }}</text>
          </view>
        </view>
      </view>
    </view>

    <view class="bottom-bar">
      <view class="action-btn" :class="{ liked: isLiked }" @click="handleToggleLike">
        <text :class="isLiked ? 'i-carbon-favorite-filled' : 'i-carbon-favorite'"></text>
        <text class="action-text">点赞</text>
      </view>
      <view class="action-btn" :class="{ fav: isFavorited }" @click="handleToggleFavorite">
        <text :class="isFavorited ? 'i-carbon-star-filled' : 'i-carbon-star'"></text>
        <text class="action-text">{{ isFavorited ? '已收藏' : '收藏' }}</text>
      </view>
      <view class="action-btn" @click="contactSeller">
        <text class="i-carbon-chat"></text>
        <text class="action-text">聊天</text>
      </view>
      <view v-if="!isOwner" class="buy-btn" @click="openBuySheet">
        <text>立即购买</text>
      </view>
      <view v-else class="buy-btn owner-btn">
        <text>{{ product.status === 1 ? '下架商品' : '重新上架' }}</text>
      </view>
    </view>

    <!-- 下单面板 -->
    <view v-if="showBuySheet" class="sheet-mask" @click="showBuySheet = false">
      <view class="sheet" @click.stop>
        <view class="sheet-head">
          <image
            v-if="product.images && product.images[0]"
            :src="product.images[0]"
            class="sheet-thumb"
            mode="aspectFill"
          />
          <view class="sheet-meta">
            <text class="sheet-price">¥{{ product.price }}</text>
            <text class="sheet-stock">库存 1 件</text>
          </view>
          <text class="i-carbon-close sheet-close" @click="showBuySheet = false"></text>
        </view>

        <view v-if="product.trade_method && product.trade_method.length > 1" class="sheet-section">
          <text class="sheet-label">交易方式</text>
          <view class="trade-options">
            <view
              v-for="m in product.trade_method"
              :key="m"
              class="trade-opt"
              :class="{ active: selectedTrade === m }"
              @click="selectedTrade = m"
            >
              {{ m === 'self_pickup' ? '线下面交' : '快递邮寄' }}
            </view>
          </view>
        </view>

        <view v-if="selectedTrade === 'express'" class="sheet-section">
          <text class="sheet-label">收货地址</text>
          <input v-model="address.name" class="sheet-input" placeholder="收货人" />
          <input v-model="address.phone" class="sheet-input" placeholder="手机号" type="number" />
          <input v-model="address.address" class="sheet-input" placeholder="省 / 市 / 区" />
          <input v-model="address.detail" class="sheet-input" placeholder="楼栋 / 门牌" />
        </view>

        <view v-if="product.trade_method && product.trade_method.length === 1" class="sheet-section">
          <text class="sheet-label">交易方式</text>
          <text class="sheet-fixed-trade">
            {{ product.trade_method[0] === 'self_pickup' ? '线下面交' : '快递邮寄' }}
          </text>
        </view>

        <view class="sheet-foot">
          <text class="sheet-total">合计: <text class="total-num">¥{{ product.price }}</text></text>
          <view class="submit-btn" :class="{ disabled: buying }" @click="submitOrder">
            {{ buying ? '提交中...' : '提交订单' }}
          </view>
        </view>
      </view>
    </view>
  </view>

  <view v-else-if="loading" class="page loading-page">
    <wd-loading size="60rpx" />
    <text class="loading-text">加载中...</text>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; background: #f5f5f5; padding-bottom: 120rpx; }
.loading-page { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; }
.loading-text { color: #999; font-size: 26rpx; }
.seller-section { background: white; padding: 24rpx 30rpx; display: flex; align-items: center; justify-content: space-between; }
.seller-info { display: flex; align-items: center; gap: 20rpx; }
.avatar { width: 80rpx; height: 80rpx; border-radius: 50%; }
.avatar-placeholder { background: #e8f8ee; display: flex; align-items: center; justify-content: center; color: #07c160; font-size: 36rpx; }
.seller-meta { .seller-name { font-size: 30rpx; font-weight: 500; color: #333; display: block; } .seller-detail { margin-top: 4rpx; font-size: 24rpx; color: #999; } }
.seller-stats { display: flex; align-items: center; gap: 12rpx; font-size: 22rpx; color: #666; }
.stat-divider { color: #ddd; }
.image-swiper { width: 100%; height: 600rpx; }
.product-image { width: 100%; height: 100%; }
.image-placeholder { width: 100%; height: 400rpx; background: #e5e5e5; display: flex; align-items: center; justify-content: center; .placeholder-icon { font-size: 80rpx; color: #ccc; } }
.info-section { background: white; padding: 24rpx 30rpx; margin-top: 2rpx; }
.price-row { display: flex; align-items: baseline; gap: 16rpx; margin-bottom: 12rpx; }
.price { font-size: 40rpx; font-weight: 700; color: #ff6b00; }
.original-price { font-size: 24rpx; color: #999; text-decoration: line-through; }
.title { font-size: 32rpx; color: #333; font-weight: 500; line-height: 1.4; margin-bottom: 16rpx; display: block; }
.tags-row { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 16rpx; }
.tag { font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 6rpx; }
.condition-tag { background: #e8f8ee; color: #07c160; }
.method-tag { background: #fff3e0; color: #ff6b00; }
.category-tag { background: #f0f0f0; color: #666; }
.description { font-size: 28rpx; color: #666; line-height: 1.6; display: block; }
.interaction-section { background: white; padding: 20rpx 30rpx; margin-top: 16rpx; }
.interaction-stats { display: flex; gap: 32rpx; flex-wrap: wrap; }
.stat { font-size: 26rpx; color: #666; display: flex; align-items: center; gap: 8rpx; }
.liked { color: #fa5151; }
.fav { color: #ff9500; }
.comment-section { background: white; margin-top: 16rpx; padding: 24rpx 30rpx; }
.section-header { margin-bottom: 20rpx; }
.section-title { font-size: 28rpx; font-weight: 500; color: #333; }
.comment-placeholder { display: flex; flex-direction: column; align-items: center; padding: 40rpx 0; gap: 12rpx; }
.comment-icon { font-size: 48rpx; color: #ccc; }
.comment-text { font-size: 24rpx; color: #999; }
.comment-list { .comment-item { padding: 20rpx 0; border-bottom: 1rpx solid #f5f5f5; &:last-child { border-bottom: none; } .comment-head { display: flex; align-items: center; gap: 16rpx; .c-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; } .c-avatar-blank { background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 28rpx; } .c-meta { flex: 1; .c-name { font-size: 26rpx; color: #333; display: block; } .c-rating { display: flex; gap: 2rpx; margin-top: 4rpx; .c-star { font-size: 22rpx; color: #e5e5e5; line-height: 1; &.active { color: #ff9500; } } } } .c-time { font-size: 22rpx; color: #999; } } .c-content { font-size: 28rpx; color: #333; line-height: 1.6; margin-top: 12rpx; display: block; } .c-tags { display: flex; flex-wrap: wrap; gap: 12rpx; margin-top: 12rpx; .c-tag { font-size: 22rpx; padding: 4rpx 14rpx; background: #f5f5f5; color: #666; border-radius: 4rpx; } } } }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; height: 100rpx; background: white; display: flex; align-items: center; padding: 0 20rpx; gap: 12rpx; box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05); z-index: 100; }
.action-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100rpx; gap: 4rpx; font-size: 36rpx; color: #666; &.liked { color: #fa5151; } &.fav { color: #ff9500; } }
.action-text { font-size: 20rpx; }
.buy-btn { flex: 1; height: 72rpx; background: #07c160; border-radius: 36rpx; display: flex; align-items: center; justify-content: center; color: white; font-size: 28rpx; font-weight: 500; }
.owner-btn { background: #ff9500; }
.sheet-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: flex-end; z-index: 200; .sheet { width: 100%; background: white; border-radius: 24rpx 24rpx 0 0; padding: 30rpx 30rpx 60rpx; .sheet-head { display: flex; align-items: center; gap: 20rpx; padding-bottom: 24rpx; border-bottom: 1rpx solid #f5f5f5; .sheet-thumb { width: 160rpx; height: 160rpx; border-radius: 12rpx; flex-shrink: 0; } .sheet-meta { flex: 1; .sheet-price { font-size: 36rpx; color: #ff6b00; font-weight: 600; display: block; } .sheet-stock { font-size: 22rpx; color: #999; } } .sheet-close { font-size: 40rpx; color: #999; padding: 8rpx; } } .sheet-section { padding: 24rpx 0; border-bottom: 1rpx solid #f5f5f5; .sheet-label { font-size: 26rpx; color: #333; font-weight: 500; display: block; margin-bottom: 16rpx; } .trade-options { display: flex; gap: 16rpx; .trade-opt { flex: 1; text-align: center; padding: 20rpx 0; background: #f5f5f5; border-radius: 12rpx; font-size: 26rpx; color: #666; &.active { background: #e8f8ee; color: #07c160; border: 2rpx solid #07c160; } } } .sheet-input { width: 100%; height: 80rpx; background: #f5f5f5; border-radius: 8rpx; padding: 0 20rpx; font-size: 26rpx; margin-bottom: 12rpx; box-sizing: border-box; } .sheet-fixed-trade { display: inline-block; padding: 12rpx 24rpx; background: #e8f8ee; color: #07c160; border-radius: 8rpx; font-size: 26rpx; } } .sheet-foot { display: flex; align-items: center; justify-content: space-between; padding-top: 30rpx; .sheet-total { font-size: 28rpx; color: #333; .total-num { color: #ff6b00; font-size: 36rpx; font-weight: 600; } } .submit-btn { padding: 20rpx 60rpx; background: #07c160; color: white; border-radius: 32rpx; font-size: 28rpx; font-weight: 500; &.disabled { opacity: 0.6; } } } } }
</style>

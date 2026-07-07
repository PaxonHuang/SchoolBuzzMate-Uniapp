<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getFavoriteList, toggleFavorite } from '@/api/favorite'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const list = ref<any[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)

function formatTime(t: string) {
  return t ? dayjs(t).fromNow() : ''
}

async function load(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const r = await getFavoriteList(page.value, 20)
    if (reset) list.value = r.list
    else list.value = list.value.concat(r.list)
    hasMore.value = list.value.length < r.total
    page.value++
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function handleUnfav(e: any, productId: string) {
  e && e.stopPropagation && e.stopPropagation()
  try {
    await toggleFavorite(productId)
    uni.showToast({ title: '已取消收藏', icon: 'none' })
    list.value = list.value.filter(function (it) { return it.product._id !== productId })
  } catch (err: any) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  }
}

function goDetail(id: string) {
  uni.navigateTo({ url: '/pages/product/detail?id=' + id })
}

onShow(function () { load(true) })
onPullDownRefresh(async function () { await load(true); uni.stopPullDownRefresh() })
onReachBottom(function () { load() })
</script>

<template>
  <view class="page">
    <view v-if="!loading && list.length === 0" class="empty">
      <text class="i-carbon-favorite blank-icon"></text>
      <text class="empty-text">还没有收藏过商品</text>
    </view>

    <view
      v-for="it in list"
      :key="it._id"
      class="fav-card"
      @click="goDetail(it.product._id)"
    >
      <view class="fav-body">
        <image
          v-if="it.product.images && it.product.images[0]"
          :src="it.product.images[0]"
          class="thumb"
          mode="aspectFill"
        />
        <view v-else class="thumb blank">
          <text class="i-carbon-image"></text>
        </view>
        <view class="meta">
          <text class="title">{{ it.product.title }}</text>
          <text class="price">¥{{ it.product.price }}</text>
          <text class="time">收藏于 {{ formatTime(it.favorite_time) }}</text>
        </view>
      </view>
      <view class="fav-foot">
        <text v-if="it.product.status === 0" class="status-tag off">已下架</text>
        <text v-else-if="it.product.status === 2" class="status-tag sold">已售出</text>
        <text v-else class="status-tag on">在售中</text>
        <text class="unfav-btn" @click.stop="handleUnfav($event, it.product._id)">取消收藏</text>
      </view>
    </view>

    <view v-if="hasMore && list.length > 0" class="load-more">
      <wd-loading v-if="loading" />
      <text v-else class="hint">上拉加载更多</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; background: #f5f5f5; padding: 20rpx 0 60rpx; }
.empty { display: flex; flex-direction: column; align-items: center; padding: 200rpx 0; gap: 20rpx; }
.empty .blank-icon { font-size: 100rpx; color: #ddd; }
.empty .empty-text { font-size: 26rpx; color: #999; }
.fav-card { background: white; margin: 0 20rpx 20rpx; border-radius: 16rpx; overflow: hidden; }
.fav-card .fav-body { display: flex; gap: 20rpx; padding: 24rpx 30rpx; }
.fav-card .fav-body .thumb { width: 180rpx; height: 180rpx; border-radius: 12rpx; flex-shrink: 0; }
.fav-card .fav-body .thumb.blank { background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 48rpx; }
.fav-card .fav-body .meta { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: space-between; }
.fav-card .fav-body .title { font-size: 28rpx; color: #333; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.fav-card .fav-body .price { font-size: 32rpx; color: #ff6b00; font-weight: 600; }
.fav-card .fav-body .time { font-size: 22rpx; color: #999; }
.fav-card .fav-foot { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 30rpx; border-top: 1rpx solid #f5f5f5; }
.fav-card .fav-foot .status-tag { font-size: 22rpx; padding: 4rpx 16rpx; border-radius: 4rpx; }
.fav-card .fav-foot .status-tag.on { background: #e8f8ee; color: #07c160; }
.fav-card .fav-foot .status-tag.off { background: #f5f5f5; color: #999; }
.fav-card .fav-foot .status-tag.sold { background: #fff3e0; color: #ff9500; }
.fav-card .fav-foot .unfav-btn { font-size: 24rpx; color: #fa5151; padding: 8rpx 20rpx; }
.load-more { padding: 30rpx; text-align: center; }
.load-more .hint { color: #999; font-size: 24rpx; }
</style>
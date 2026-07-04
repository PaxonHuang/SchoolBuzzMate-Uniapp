<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import { getOrderList } from '@/api/order'
import { ORDER_STATUS_MAP, type OrderListItem, type OrderStatus } from '@/types/order'

const role = ref<'buyer' | 'seller'>('buyer')
const activeTab = ref<'all' | 'pending' | 'progress' | 'done'>('all')
const list = ref<OrderListItem[]>([])
const page = ref(1)
const hasMore = ref(true)
const loading = ref(false)

const TAB_STATUS: Record<string, OrderStatus[] | null> = {
  all: null,
  pending: [0],
  progress: [1, 2],
  done: [3, 4, 5],
}

function statusInfo(s: OrderStatus) {
  return ORDER_STATUS_MAP[s] || { label: '未知', color: '#999' }
}

function tradeLabel(t: string) {
  return t === 'self_pickup' ? '自提' : '快递'
}

function timeLabel(t?: string) {
  return t ? dayjs(t).format('MM-DD HH:mm') : ''
}

async function load(reset = false) {
  if (loading.value) return
  if (!reset && !hasMore.value) return
  loading.value = true
  if (reset) page.value = 1
  try {
    const statuses = TAB_STATUS[activeTab.value]
    const collected: OrderListItem[] = []
    let total = 0
    if (statuses === null) {
      const r = await getOrderList({ role: role.value, page: page.value, size: 10 })
      collected.push(...r.list)
      total = r.total
    } else {
      // 拉当前 tab 内的所有状态并合并（避免在云函数端做或运算）
      for (const s of statuses) {
        const r = await getOrderList({ role: role.value, page: 1, size: 50, status: s })
        collected.push(...r.list)
        total += r.total
      }
      collected.sort(function (a, b) {
        return dayjs(b.create_date).valueOf() - dayjs(a.create_date).valueOf()
      })
    }
    if (reset) {
      list.value = collected
    } else {
      list.value = list.value.concat(collected)
    }
    hasMore.value = list.value.length < total
    page.value++
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function switchTab(t: typeof activeTab.value) {
  if (activeTab.value === t) return
  activeTab.value = t
  load(true)
}

function goDetail(id: string) {
  uni.navigateTo({ url: '/pages/order/detail?id=' + id })
}

onLoad(function (q: any) {
  role.value = q && q.type === 'sell' ? 'seller' : 'buyer'
  uni.setNavigationBarTitle({ title: role.value === 'sell' ? '我卖出的' : '我买到的' })
})

onShow(function () { load(true) })
onPullDownRefresh(async function () { await load(true); uni.stopPullDownRefresh() })
onReachBottom(function () { load() })
onMounted(function () { load(true) })
</script>

<template>
  <view class="page">
    <view class="tabs">
      <view class="tab" :class="{ active: activeTab === 'all' }" @click="switchTab('all')">全部</view>
      <view class="tab" :class="{ active: activeTab === 'pending' }" @click="switchTab('pending')">待支付</view>
      <view class="tab" :class="{ active: activeTab === 'progress' }" @click="switchTab('progress')">进行中</view>
      <view class="tab" :class="{ active: activeTab === 'done' }" @click="switchTab('done')">已完成</view>
    </view>

    <view v-if="!loading && list.length === 0" class="empty">
      <text class="i-carbon-document blank-icon"></text>
      <text class="empty-text">暂无订单</text>
    </view>

    <view class="card" v-for="o in list" :key="o._id" @click="goDetail(o._id)">
      <view class="card-head">
        <text class="cp-name">{{ o.counterparty?.nickname || '匿名用户' }}</text>
        <text class="status" :style="{ color: statusInfo(o.status).color }">
          {{ statusInfo(o.status).label }}
        </text>
      </view>
      <view class="card-body">
        <image
          v-if="o.product_snapshot?.images?.[0]"
          :src="o.product_snapshot.images[0]"
          class="thumb"
          mode="aspectFill"
        />
        <view v-else class="thumb thumb-blank">
          <text class="i-carbon-image"></text>
        </view>
        <view class="meta">
          <text class="title">{{ o.product_snapshot?.title || '商品已下架' }}</text>
          <view class="sub">
            <text class="trade">{{ tradeLabel(o.trade_method) }}</text>
            <text class="time">{{ timeLabel(o.create_date) }}</text>
          </view>
        </view>
        <text class="amount">¥{{ o.amount }}</text>
      </view>
    </view>

    <view v-if="hasMore && list.length > 0" class="load-more">
      <wd-loading v-if="loading" />
      <text v-else class="hint">上拉加载更多</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page { min-height: 100vh; background: #f5f5f5; padding-bottom: 40rpx; }
.tabs {
  display: flex; background: white; position: sticky; top: 0; z-index: 10;
  border-bottom: 1rpx solid #f0f0f0;
  .tab {
    flex: 1; text-align: center; padding: 28rpx 0; font-size: 28rpx; color: #666;
    position: relative;
    &.active { color: #07c160; font-weight: 500; }
    &.active::after {
      content: ''; position: absolute; left: 50%; bottom: 0;
      transform: translateX(-50%); width: 48rpx; height: 4rpx;
      background: #07c160; border-radius: 2rpx;
    }
  }
}
.empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 200rpx 0; gap: 20rpx;
  .blank-icon { font-size: 100rpx; color: #ddd; }
  .empty-text { font-size: 26rpx; color: #999; }
}
.card {
  background: white; margin: 20rpx; border-radius: 16rpx; padding: 24rpx 30rpx;
  .card-head {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 20rpx; border-bottom: 1rpx solid #f5f5f5;
    .cp-name { font-size: 28rpx; color: #333; font-weight: 500; }
    .status { font-size: 26rpx; }
  }
  .card-body {
    display: flex; gap: 20rpx; padding-top: 20rpx; align-items: center;
    .thumb {
      width: 160rpx; height: 160rpx; border-radius: 12rpx; flex-shrink: 0;
    }
    .thumb-blank {
      background: #f5f5f5; display: flex; align-items: center; justify-content: center;
      color: #ccc; font-size: 48rpx;
    }
    .meta { flex: 1; min-width: 0; }
    .title {
      font-size: 28rpx; color: #333; display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .sub {
      display: flex; gap: 16rpx; margin-top: 8rpx; font-size: 22rpx; color: #999;
    }
    .amount { font-size: 32rpx; color: #ff6b00; font-weight: 600; flex-shrink: 0; }
  }
}
.load-more { padding: 30rpx; text-align: center; .hint { color: #999; font-size: 24rpx; } }
</style>
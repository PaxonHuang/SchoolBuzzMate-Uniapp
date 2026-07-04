<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import dayjs from 'dayjs'
import {
  getOrderDetail, payOrder, cancelOrder, shipOrder, confirmOrder,
} from '@/api/order'
import { ORDER_STATUS_MAP, type OrderDetail } from '@/types/order'

const order = ref<OrderDetail | null>(null)
const loading = ref(true)
const acting = ref(false)
const showCancelModal = ref(false)
const cancelReason = ref('')
const showAddressForm = ref(false)
const address = ref({ name: '', phone: '', address: '', detail: '' })
const payMethod = ref<'wechat' | 'balance'>('wechat')

const statusInfo = computed(() => order.value ? ORDER_STATUS_MAP[order.value.order.status] : null)

const actionBtns = computed(() => {
  if (!order.value) return []
  const o = order.value.order
  const role = order.value.role
  const btns: { label: string; type: 'primary' | 'danger' | 'default'; action: string }[] = []
  if (role === 'buyer') {
    if (o.status === 0) {
      btns.push({ label: '取消订单', type: 'default', action: 'openCancel' })
      btns.push({ label: '立即支付', type: 'primary', action: 'openPay' })
    } else if (o.status === 1 && o.trade_method === 'self_pickup') {
      btns.push({ label: '取消订单', type: 'default', action: 'openCancel' })
      btns.push({ label: '确认完成', type: 'primary', action: 'confirm' })
    } else if (o.status === 2) {
      btns.push({ label: '确认收货', type: 'primary', action: 'confirm' })
    }
  } else {
    if (o.status === 1 && o.trade_method === 'express') {
      btns.push({ label: '已发货', type: 'primary', action: 'ship' })
    }
    if (o.status === 1) {
      btns.push({ label: '同意取消', type: 'danger', action: 'cancel' })
    }
  }
  return btns
})

function fmt(t?: string) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : ''
}

async function load(id: string) {
  loading.value = true
  try {
    const r = await getOrderDetail(id)
    order.value = r
  } catch (e: any) {
    uni.showToast({ title: e.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function doAction(act: string) {
  if (!order.value || acting.value) return
  acting.value = true
  try {
    if (act === 'openCancel') {
      showCancelModal.value = true
      return
    }
    if (act === 'cancel') {
      await cancelOrder(order.value.order._id)
      uni.showToast({ title: '已取消', icon: 'success' })
    } else if (act === 'openPay') {
      showAddressForm.value = order.value.order.trade_method === 'express'
      if (showAddressForm.value) {
        uni.showToast({ title: '请填写收货地址', icon: 'none' })
        return
      }
      await payOrder(order.value.order._id)
      uni.showToast({ title: '支付成功', icon: 'success' })
    } else if (act === 'ship') {
      await shipOrder(order.value.order._id)
      uni.showToast({ title: '已发货', icon: 'success' })
    } else if (act === 'confirm') {
      await confirmOrder(order.value.order._id)
      uni.showToast({ title: '已完成', icon: 'success' })
    }
    await load(order.value.order._id)
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    acting.value = false
  }
}

async function submitCancel() {
  if (!order.value) return
  acting.value = true
  try {
    await cancelOrder(order.value.order._id, cancelReason.value || undefined)
    uni.showToast({ title: '已取消', icon: 'success' })
    showCancelModal.value = false
    await load(order.value.order._id)
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    acting.value = false
  }
}

async function submitAddressAndPay() {
  if (!order.value) return
  if (!address.value.name || !address.value.phone || !address.value.address) {
    uni.showToast({ title: '请完整填写地址', icon: 'none' })
    return
  }
  acting.value = true
  try {
    // 地址修改不在当前动作里; 真实场景是下单时已填, 这里仅做支付
    await payOrder(order.value.order._id)
    uni.showToast({ title: '支付成功', icon: 'success' })
    showAddressForm.value = false
    await load(order.value.order._id)
  } catch (e: any) {
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  } finally {
    acting.value = false
  }
}

function contactCp() {
  uni.showToast({ title: '私信功能开发中', icon: 'none' })
}

function goProduct() {
  if (!order.value) return
  uni.redirectTo({ url: '/pages/product/detail?id=' + order.value.order.product_id })
}

onLoad(function (q: any) {
  if (q && q.id) load(q.id)
  else {
    uni.showToast({ title: '参数错误', icon: 'none' })
    setTimeout(function () { uni.navigateBack() }, 1500)
  }
})
</script>

<template>
  <view v-if="order" class="page">
    <!-- 状态头 -->
    <view class="status-bar" :style="{ background: statusInfo?.color || '#07c160' }">
      <text class="status-text">{{ statusInfo?.label }}</text>
      <text class="status-hint">
        <template v-if="order.role === 'buyer'">
          <text v-if="order.order.status === 0">请在 24 小时内完成支付</text>
          <text v-else-if="order.order.status === 1 && order.order.trade_method === 'self_pickup'">已支付,等待自提</text>
          <text v-else-if="order.order.status === 1">已支付,等待卖家发货</text>
          <text v-else-if="order.order.status === 2">卖家已发货</text>
          <text v-else-if="order.order.status === 3">交易已完成</text>
          <text v-else-if="order.order.status === 4">订单已取消</text>
        </template>
        <template v-else>
          <text v-if="order.order.status === 0">等待买家支付</text>
          <text v-else-if="order.order.status === 1 && order.order.trade_method === 'self_pickup'">买家已支付,等待自提</text>
          <text v-else-if="order.order.status === 1">买家已支付,请尽快发货</text>
          <text v-else-if="order.order.status === 2">已发货,等待买家确认</text>
          <text v-else-if="order.order.status === 3">交易完成</text>
          <text v-else-if="order.order.status === 4">订单已取消</text>
        </template>
      </text>
    </view>

    <!-- 地址 -->
    <view v-if="order.order.trade_method === 'express'" class="card">
      <view class="addr-head">
        <text class="i-carbon-location addr-icon"></text>
        <text class="addr-title">收货地址</text>
      </view>
      <view v-if="order.order.address" class="addr-body">
        <text class="addr-line">{{ order.order.address.name }} {{ order.order.address.phone }}</text>
        <text class="addr-line">{{ order.order.address.address }} {{ order.order.address.detail }}</text>
      </view>
      <text v-else class="addr-empty">快递交易未填写地址</text>
    </view>

    <!-- 商品 -->
    <view class="card goods" @click="goProduct">
      <image
        v-if="order.order.product_snapshot?.images?.[0]"
        :src="order.order.product_snapshot.images[0]"
        class="thumb"
        mode="aspectFill"
      />
      <view v-else class="thumb blank">
        <text class="i-carbon-image"></text>
      </view>
      <view class="meta">
        <text class="title">{{ order.order.product_snapshot?.title }}</text>
        <view class="sub">
          <text>¥{{ order.order.amount }}</text>
          <text class="trade">
            {{ order.order.trade_method === 'self_pickup' ? '自提' : '快递' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 订单信息 -->
    <view class="card">
      <view class="row"><text class="k">订单号</text><text class="v">{{ order.order.order_no }}</text></view>
      <view class="row"><text class="k">下单时间</text><text class="v">{{ fmt(order.order.create_date) }}</text></view>
      <view v-if="order.order.paid_at" class="row"><text class="k">支付时间</text><text class="v">{{ fmt(order.order.paid_at) }}</text></view>
      <view v-if="order.order.shipped_at" class="row"><text class="k">发货时间</text><text class="v">{{ fmt(order.order.shipped_at) }}</text></view>
      <view v-if="order.order.completed_at" class="row"><text class="k">完成时间</text><text class="v">{{ fmt(order.order.completed_at) }}</text></view>
      <view v-if="order.order.remark" class="row"><text class="k">买家备注</text><text class="v">{{ order.order.remark }}</text></view>
    </view>

    <!-- 对方信息 -->
    <view class="card">
      <view class="row">
        <text class="k">{{ order.role === 'buyer' ? '卖家' : '买家' }}</text>
        <view class="cp">
          <image
            v-if="(order.role === 'buyer' ? order.seller : order.buyer)?.avatar"
            :src="(order.role === 'buyer' ? order.seller : order.buyer).avatar"
            class="cp-avatar"
            mode="aspectFill"
          />
          <view v-else class="cp-avatar blank">
            <text class="i-carbon-user"></text>
          </view>
          <view class="cp-meta">
            <text class="cp-name">{{ (order.role === 'buyer' ? order.seller : order.buyer)?.nickname }}</text>
            <text class="cp-school">{{ (order.role === 'buyer' ? order.seller : order.buyer)?.school_name }}</text>
          </view>
          <text class="contact-btn" @click.stop="contactCp">联系</text>
        </view>
      </view>
    </view>

    <!-- 时间线 -->
    <view v-if="order.order.status_log && order.order.status_log.length" class="card">
      <text class="card-title">订单进度</text>
      <view class="timeline">
        <view v-for="(l, i) in order.order.status_log" :key="i" class="tl-item">
          <view class="tl-dot"></view>
          <view class="tl-content">
            <text class="tl-note">{{ l.note }}</text>
            <text class="tl-time">{{ fmt(l.time) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部动作 -->
    <view v-if="actionBtns.length" class="action-bar">
      <view
        v-for="(b, i) in actionBtns"
        :key="i"
        class="action-btn"
        :class="['btn-' + b.type, { disabled: acting }]"
        @click="doAction(b.action)"
      >
        {{ b.label }}
      </view>
    </view>
    <view v-else class="action-bar placeholder" />

    <!-- 取消原因弹窗 -->
    <view v-if="showCancelModal" class="modal-mask" @click="showCancelModal = false">
      <view class="modal" @click.stop>
        <text class="modal-title">取消订单</text>
        <textarea
          v-model="cancelReason"
          class="modal-textarea"
          placeholder="请输入取消原因(选填)"
          maxlength="100"
        />
        <view class="modal-actions">
          <view class="modal-btn" @click="showCancelModal = false">不取消了</view>
          <view class="modal-btn primary" @click="submitCancel">确认取消</view>
        </view>
      </view>
    </view>

    <!-- 快递地址补录 (MVP 占位) -->
    <view v-if="showAddressForm" class="modal-mask" @click="showAddressForm = false">
      <view class="modal" @click.stop>
        <text class="modal-title">补充收货地址</text>
        <input v-model="address.name" class="modal-input" placeholder="收货人姓名" />
        <input v-model="address.phone" class="modal-input" placeholder="手机号" type="number" />
        <input v-model="address.address" class="modal-input" placeholder="省/市/区" />
        <input v-model="address.detail" class="modal-input" placeholder="详细地址" />
        <view class="modal-actions">
          <view class="modal-btn" @click="showAddressForm = false">取消</view>
          <view class="modal-btn primary" @click="submitAddressAndPay">确认支付</view>
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
.page { min-height: 100vh; background: #f5f5f5; padding-bottom: 160rpx; }
.loading-page { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20rpx; }
.loading-text { color: #999; font-size: 26rpx; }
.status-bar {
  padding: 60rpx 40rpx 80rpx; color: white;
  .status-text { font-size: 40rpx; font-weight: 600; display: block; }
  .status-hint { font-size: 26rpx; opacity: 0.9; display: block; margin-top: 12rpx; }
}
.card { background: white; margin: 20rpx; border-radius: 16rpx; padding: 24rpx 30rpx; }
.card-title { font-size: 28rpx; font-weight: 500; color: #333; display: block; margin-bottom: 20rpx; }
.addr-head { display: flex; align-items: center; gap: 8rpx; margin-bottom: 12rpx; .addr-icon { color: #07c160; } .addr-title { font-size: 28rpx; font-weight: 500; } }
.addr-body { .addr-line { font-size: 28rpx; color: #333; display: block; line-height: 1.6; } }
.addr-empty { color: #999; font-size: 26rpx; }
.goods { display: flex; gap: 20rpx; align-items: center; .thumb { width: 160rpx; height: 160rpx; border-radius: 12rpx; flex-shrink: 0; } .thumb.blank { background: #f5f5f5; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 48rpx; } .meta { flex: 1; min-width: 0; } .title { font-size: 28rpx; color: #333; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; } .sub { display: flex; gap: 20rpx; margin-top: 12rpx; color: #ff6b00; font-size: 28rpx; font-weight: 600; .trade { color: #999; font-size: 22rpx; font-weight: normal; background: #f5f5f5; padding: 2rpx 12rpx; border-radius: 4rpx; } } }
.row { display: flex; padding: 12rpx 0; font-size: 26rpx; .k { color: #999; width: 160rpx; flex-shrink: 0; } .v { color: #333; flex: 1; word-break: break-all; } }
.cp { flex: 1; display: flex; align-items: center; gap: 16rpx; .cp-avatar { width: 64rpx; height: 64rpx; border-radius: 50%; } .cp-avatar.blank { background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #ccc; font-size: 28rpx; } .cp-meta { flex: 1; .cp-name { font-size: 26rpx; color: #333; display: block; } .cp-school { font-size: 22rpx; color: #999; } } .contact-btn { padding: 8rpx 20rpx; background: #e8f8ee; color: #07c160; border-radius: 24rpx; font-size: 22rpx; } }
.timeline { .tl-item { display: flex; gap: 16rpx; padding: 12rpx 0; position: relative; } .tl-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #07c160; margin-top: 8rpx; flex-shrink: 0; } .tl-item:not(:last-child) .tl-dot::after { content: ''; position: absolute; left: 7rpx; top: 24rpx; width: 2rpx; height: calc(100% - 8rpx); background: #e0f5e8; } .tl-content { .tl-note { font-size: 26rpx; color: #333; display: block; } .tl-time { font-size: 22rpx; color: #999; display: block; margin-top: 4rpx; } } }
.action-bar { position: fixed; bottom: 0; left: 0; right: 0; background: white; padding: 20rpx 30rpx; display: flex; justify-content: flex-end; gap: 16rpx; box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05); z-index: 100; &.placeholder { height: 100rpx; } }
.action-btn { padding: 16rpx 32rpx; border-radius: 32rpx; font-size: 26rpx; &.btn-primary { background: #07c160; color: white; } &.btn-default { background: #f5f5f5; color: #333; } &.btn-danger { background: #fff0f0; color: #fa5151; } &.disabled { opacity: 0.6; } }
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 200; .modal { width: 80vw; background: white; border-radius: 16rpx; padding: 30rpx; .modal-title { font-size: 32rpx; font-weight: 600; color: #333; display: block; margin-bottom: 20rpx; } .modal-textarea { width: 100%; min-height: 160rpx; background: #f5f5f5; border-radius: 8rpx; padding: 16rpx; font-size: 26rpx; box-sizing: border-box; } .modal-input { width: 100%; height: 80rpx; background: #f5f5f5; border-radius: 8rpx; padding: 0 20rpx; font-size: 26rpx; margin-bottom: 16rpx; box-sizing: border-box; } .modal-actions { display: flex; gap: 16rpx; margin-top: 24rpx; .modal-btn { flex: 1; text-align: center; padding: 20rpx 0; background: #f5f5f5; border-radius: 8rpx; font-size: 28rpx; color: #333; &.primary { background: #07c160; color: white; } } } } }
</style>
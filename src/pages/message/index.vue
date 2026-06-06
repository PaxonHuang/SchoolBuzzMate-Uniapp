<script setup lang="ts">
import { ref } from 'vue'

const messageList = ref([
  { id: '1', type: 'system', title: '系统通知', content: '欢迎使用校趣闪搭！请完成学生认证以解锁全部功能。', time: '刚刚', unread: true },
  { id: '2', type: 'chat', title: '交易助手', content: '你的商品「高等数学第七版」有人咨询了', time: '10分钟前', unread: true },
  { id: '3', type: 'chat', title: '小王', content: '好的，明天下午3点图书馆门口见面交吧', time: '1小时前', unread: false },
])

function goToChat(item: any) {
  uni.navigateTo({ url: `/pages/message/chat?id=${item.id}` })
}
</script>

<template>
  <view class="page">
    <view v-if="messageList.length" class="message-list">
      <view
        v-for="item in messageList"
        :key="item.id"
        class="message-item"
        :class="{ unread: item.unread }"
        @click="goToChat(item)"
      >
        <view class="message-avatar" :class="item.type">
          <text v-if="item.type === 'system'" class="i-carbon-notification" />
          <text v-else class="i-carbon-chat" />
        </view>
        <view class="message-content">
          <text class="title">{{ item.title }}</text>
          <text class="content">{{ item.content }}</text>
        </view>
        <text class="time">{{ item.time }}</text>
      </view>
    </view>

    <wd-status-tip v-else image="message" tip="暂无消息" />
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.message-list {
  background: white;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 32rpx 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  gap: 24rpx;

  &.unread {
    .title {
      font-weight: 600;
    }
  }
}

.message-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.system {
    background: #e8f8ee;
    color: #07c160;
  }

  &.chat {
    background: #e5f0ff;
    color: #1989fa;
  }

  [class^='i-carbon'] {
    font-size: 40rpx;
  }
}

.message-content {
  flex: 1;
  overflow: hidden;

  .title {
    font-size: 28rpx;
    color: #333;
    display: block;
  }

  .content {
    font-size: 24rpx;
    color: #999;
    margin-top: 6rpx;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.time {
  font-size: 22rpx;
  color: #ccc;
  white-space: nowrap;
}
</style>
<script setup lang="ts">
import { ref } from 'vue'

const keyword = ref('')

function handleSearch() {
  if (!keyword.value.trim()) return
  // TODO: 跳转到搜索结果页
  uni.showToast({ title: `搜索: ${keyword.value}`, icon: 'none' })
}

function clearSearch() {
  keyword.value = ''
}
</script>

<template>
  <view class="page">
    <view class="search-header">
      <view class="search-input-wrapper">
        <text class="i-carbon-search search-icon" />
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索商品、卖家..."
          confirm-type="search"
          @confirm="handleSearch"
          focus
        />
        <text v-if="keyword" class="i-carbon-close clear-btn" @click="clearSearch" />
      </view>
      <text class="cancel-text" @click="uni.navigateBack()">取消</text>
    </view>

    <!-- 热门搜索 -->
    <view class="hot-search">
      <text class="section-title">热门搜索</text>
      <view class="tags">
        <text class="tag">高等数学</text>
        <text class="tag">考研资料</text>
        <text class="tag">二手自行车</text>
        <text class="tag">英语四级</text>
        <text class="tag">iPad</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #fff;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx;
  gap: 20rpx;
  background: #07c160;

  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    background: white;
    border-radius: 40rpx;
    padding: 12rpx 24rpx;
    gap: 16rpx;
  }

  .search-icon {
    font-size: 32rpx;
    color: #999;
  }

  .search-input {
    flex: 1;
    font-size: 28rpx;
  }

  .clear-btn {
    font-size: 32rpx;
    color: #ccc;
  }

  .cancel-text {
    font-size: 28rpx;
    color: white;
  }
}

.hot-search {
  padding: 30rpx;

  .section-title {
    font-size: 28rpx;
    color: #333;
    font-weight: 500;
    margin-bottom: 24rpx;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: 16rpx;

    .tag {
      background: #f5f5f5;
      padding: 12rpx 24rpx;
      border-radius: 32rpx;
      font-size: 26rpx;
      color: #666;
    }
  }
}
</style>
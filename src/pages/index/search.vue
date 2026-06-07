<script setup lang="ts">
import { ref } from 'vue'
import { searchProducts } from '@/api/product'
import { useSchoolStore } from '@/store/school'
import type { ProductListItem } from '@/types/product'

const schoolStore = useSchoolStore()
const keyword = ref('')
const results = ref<ProductListItem[]>([])
const loading = ref(false)
const hasSearched = ref(false)
const page = ref(1)
const total = ref(0)

async function handleSearch() {
  if (!keyword.value.trim()) return

  loading.value = true
  hasSearched.value = true
  page.value = 1

  try {
    const res = await searchProducts(
      keyword.value.trim(),
      schoolStore.currentSchoolId || undefined,
      page.value,
      20,
    )
    results.value = res.list
    total.value = res.total
  } catch (e: any) {
    uni.showToast({ title: e.message || '搜索失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function clearSearch() {
  keyword.value = ''
  results.value = []
  hasSearched.value = false
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function handleTagClick(tag: string) {
  keyword.value = tag
  handleSearch()
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

    <!-- 搜索结果 -->
    <view v-if="hasSearched" class="results">
      <text v-if="!loading" class="result-count">找到 {{ total }} 件商品</text>

      <view v-for="item in results" :key="item._id" class="result-card" @click="goToDetail(item._id)">
        <image v-if="item.images && item.images[0]" :src="item.images[0]" class="result-image" mode="aspectFill" />
        <view v-else class="result-image placeholder">
          <text class="i-carbon-image" />
        </view>
        <view class="result-info">
          <text class="result-title">{{ item.title }}</text>
          <text class="result-price">¥{{ item.price }}</text>
          <text class="result-seller">{{ item.seller?.nickname }}</text>
        </view>
      </view>

      <wd-status-tip v-if="!loading && results.length === 0" image="search" tip="没有找到相关商品" />
      <view v-if="loading" class="loading-wrap">
        <wd-loading />
      </view>
    </view>

    <!-- 热门搜索 -->
    <view v-else class="hot-search">
      <text class="section-title">热门搜索</text>
      <view class="tags">
        <text class="tag" @click="handleTagClick('高等数学')">高等数学</text>
        <text class="tag" @click="handleTagClick('考研资料')">考研资料</text>
        <text class="tag" @click="handleTagClick('自行车')">二手自行车</text>
        <text class="tag" @click="handleTagClick('英语四级')">英语四级</text>
        <text class="tag" @click="handleTagClick('iPad')">iPad</text>
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

  .search-icon { font-size: 32rpx; color: #999; }
  .search-input { flex: 1; font-size: 28rpx; }
  .clear-btn { font-size: 32rpx; color: #ccc; }
  .cancel-text { font-size: 28rpx; color: white; }
}

.results { padding: 20rpx; }

.result-count {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 16rpx;
  display: block;
}

.result-card {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.result-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 12rpx;
  flex-shrink: 0;
}

.result-image.placeholder {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  font-size: 48rpx;
}

.result-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.result-title {
  font-size: 28rpx;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-price { font-size: 32rpx; color: #ff6b00; font-weight: 600; }
.result-seller { font-size: 24rpx; color: #999; }

.loading-wrap { padding: 40rpx; text-align: center; }

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

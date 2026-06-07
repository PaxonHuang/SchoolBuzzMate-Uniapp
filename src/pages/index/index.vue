<script setup lang="ts">
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { useSchoolStore } from '@/store/school'
import { getProductList } from '@/api/product'
import type { ProductListItem, ProductCategory } from '@/types/product'
import { CATEGORY_OPTIONS } from '@/types/product'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const schoolStore = useSchoolStore()
const productList = ref<ProductListItem[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const keyword = ref('')
const activeCategory = ref<ProductCategory | ''>('')

function getCategoryIcon(category: string) {
  return CATEGORY_OPTIONS.find(c => c.value === category)?.icon || '🎨'
}

function formatTime(time: string) {
  if (!time) return ''
  return dayjs(time).fromNow()
}

async function loadProducts(isRefresh = false) {
  if (loading.value) return
  if (!isRefresh && !hasMore.value) return

  loading.value = true
  if (isRefresh) page.value = 1

  try {
    const params: any = {
      page: page.value,
      size: 10,
    }
    if (schoolStore.currentSchoolId) {
      params.school_id = schoolStore.currentSchoolId
    }
    if (activeCategory.value) {
      params.category = activeCategory.value
    }

    const res = await getProductList(params)

    if (isRefresh) {
      productList.value = res.list
    } else {
      productList.value.push(...res.list)
    }

    hasMore.value = productList.value.length < res.total
    page.value++
  } catch (error: any) {
    uni.showToast({ title: error.message || '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

function selectCategory(category: ProductCategory | '') {
  activeCategory.value = category
  loadProducts(true)
}

function goToPublish() {
  uni.navigateTo({ url: '/pages/publish/index' })
}

function goToDetail(id: string) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}

function goToSearch() {
  uni.navigateTo({ url: '/pages/index/search' })
}

function switchSchool() {
  uni.navigateTo({ url: '/pages-core/login/select-school' })
}

onPullDownRefresh(async () => {
  await loadProducts(true)
  uni.stopPullDownRefresh()
})

onReachBottom(() => loadProducts())

onMounted(() => {
  loadProducts(true)
})
</script>

<template>
  <view class="page">
    <!-- Header -->
    <view class="header">
      <view class="school-selector" @click="switchSchool">
        <text class="school-name">{{ schoolStore.currentSchoolName }}</text>
        <text class="i-carbon-chevron-down carrier" />
      </view>
      <view class="search-bar" @click="goToSearch">
        <wd-search v-model="keyword" placeholder="搜索校园好物..." disabled />
      </view>
    </view>

    <!-- 分类筛选 -->
    <scroll-view class="categories" scroll-x>
      <view
        class="category-item"
        :class="{ active: activeCategory === '' }"
        @click="selectCategory('')"
      >
        <text class="category-icon">🔥</text>
        <text>全部</text>
      </view>
      <view
        v-for="cat in CATEGORY_OPTIONS"
        :key="cat.value"
        class="category-item"
        :class="{ active: activeCategory === cat.value }"
        @click="selectCategory(cat.value)"
      >
        <text class="category-icon">{{ cat.icon }}</text>
        <text>{{ cat.label }}</text>
      </view>
    </scroll-view>

    <!-- Product Grid -->
    <view class="product-list">
      <view
        v-for="item in productList"
        :key="item._id"
        class="product-card"
        @click="goToDetail(item._id)"
      >
        <view class="product-image">
          <image v-if="item.images && item.images[0]" :src="item.images[0]" mode="aspectFill" />
          <text v-else class="i-carbon-image placeholder-icon" />
        </view>
        <view class="product-info">
          <text class="title">{{ item.title }}</text>
          <view class="price-row">
            <text class="price">¥{{ item.price }}</text>
            <text class="condition">{{ item.condition === 'brand_new' ? '全新' : item.condition === 'like_new' ? '几乎全新' : '已使用' }}</text>
          </view>
          <view class="meta-row">
            <text class="seller">{{ item.seller?.nickname }}</text>
            <text class="time">{{ formatTime(item.publish_time) }}</text>
          </view>
        </view>
      </view>
    </view>

    <wd-status-tip v-if="!loading && productList.length === 0" image="content" tip="暂无商品，快来发布吧~" />

    <view v-if="hasMore && productList.length > 0" class="load-more">
      <wd-loading v-if="loading" />
      <text v-else class="hint">上拉加载更多</text>
    </view>

    <!-- FAB 发布按钮 -->
    <view class="publish-fab" @click="goToPublish">
      <text class="i-carbon-add-large" />
    </view>
  </view>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100rpx;
}

.header {
  background: #07c160;
  padding: 16rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;

  .school-selector {
    display: flex;
    align-items: center;
    color: white;
    font-size: 28rpx;
    white-space: nowrap;
  }

  .school-name {
    font-weight: 500;
    max-width: 140rpx;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .carrier {
    font-size: 20rpx;
    margin-left: 4rpx;
  }

  .search-bar {
    flex: 1;
    background: white;
    border-radius: 40rpx;
  }
}

.categories {
  white-space: nowrap;
  padding: 24rpx 20rpx;
  background: white;
  margin-bottom: 16rpx;

  .category-item {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    font-size: 22rpx;
    color: #666;
    padding: 8rpx 24rpx;
    border-radius: 12rpx;

    &.active {
      background: #e8f8ee;
      color: #07c160;
    }

    .category-icon {
      font-size: 36rpx;
    }
  }
}

.product-list {
  padding: 0 20rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.product-card {
  background: white;
  border-radius: 16rpx;
  overflow: hidden;

  .product-image {
    height: 200rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;

    .placeholder-icon {
      font-size: 60rpx;
      color: #ccc;
    }

    image {
      width: 100%;
      height: 100%;
    }
  }

  .product-info {
    padding: 16rpx;

    .title {
      font-size: 26rpx;
      color: #333;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .price-row {
      display: flex;
      align-items: center;
      gap: 8rpx;
      margin-top: 8rpx;

      .price {
        font-size: 30rpx;
        color: #ff6b00;
        font-weight: 600;
      }

      .condition {
        font-size: 20rpx;
        color: #999;
        background: #f5f5f5;
        padding: 2rpx 8rpx;
        border-radius: 4rpx;
      }
    }

    .meta-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 6rpx;

      .seller {
        font-size: 22rpx;
        color: #999;
      }

      .time {
        font-size: 20rpx;
        color: #ccc;
      }
    }
  }
}

.load-more {
  padding: 30rpx;
  text-align: center;

  .hint {
    color: #999;
    font-size: 24rpx;
  }
}

.publish-fab {
  position: fixed;
  right: 40rpx;
  bottom: 200rpx;
  width: 100rpx;
  height: 100rpx;
  background: #07c160;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(7, 193, 96, 0.4);

  [class^='i-carbon'] {
    font-size: 48rpx;
    color: white;
  }
}
</style>

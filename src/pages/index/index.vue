<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSchoolStore } from '@/store/school'

const schoolStore = useSchoolStore()
const productList = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const hasMore = ref(true)
const keyword = ref('')

onMounted(() => {
  loadProducts(true)
})

async function loadProducts(isRefresh = false) {
  if (loading.value) return
  if (!isRefresh && !hasMore.value) return

  loading.value = true
  if (isRefresh) page.value = 1

  try {
    // TODO: 接入商品云函数
    const mockData = [
      { _id: '1', title: '高等数学（第七版）', price: 25, condition: 'used', images: [], seller: { nickname: '学长小王' } },
      { _id: '2', title: '捷安特山地自行车', price: 580, condition: 'used', images: [], seller: { nickname: '骑行爱好者' } },
      { _id: '3', title: 'LED护眼台灯', price: 35, condition: 'brand_new', images: [], seller: { nickname: '考研上岸学姐' } },
    ]

    if (isRefresh) {
      productList.value = mockData
    } else {
      productList.value.push(...mockData)
    }

    hasMore.value = mockData.length === 10
    page.value++
  } catch (error) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
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

    <!-- Categories -->
    <view class="categories">
      <view class="category-item">
        <text class="i-carbon-book category-icon" />
        <text>教材资料</text>
      </view>
      <view class="category-item">
        <text class="i-carbon-devices category-icon" />
        <text>数码电子</text>
      </view>
      <view class="category-item">
        <text class="i-carbon-clothing category-icon" />
        <text>服饰鞋包</text>
      </view>
      <view class="category-item">
        <text class="i-carbon-furniture category-icon" />
        <text>生活用品</text>
      </view>
      <view class="category-item">
        <text class="i-carbon-application category-icon" />
        <text>其他</text>
      </view>
    </view>

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
          <text class="seller">{{ item.seller?.nickname }}</text>
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
  display: flex;
  justify-content: space-around;
  padding: 30rpx 20rpx;
  background: white;
  margin-bottom: 20rpx;

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    font-size: 22rpx;
    color: #333;

    .category-icon {
      font-size: 40rpx;
      color: #07c160;
    }
  }
}

.product-list {
  padding: 20rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
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

    .seller {
      font-size: 22rpx;
      color: #999;
      margin-top: 6rpx;
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
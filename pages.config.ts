import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'

// 直接内联 tabBar 配置，避免路径导入问题
const tabBar = {
  color: '#999',
  selectedColor: '#07c160',
  borderStyle: 'white',
  backgroundColor: '#fff',
  list: [
    {
      pagePath: 'pages/index/index',
      text: '首页',
      iconPath: 'static/tabbar/home.png',
      selectedIconPath: 'static/tabbar/home-active.png',
    },
    {
      pagePath: 'pages/publish/index',
      text: '发布',
      iconPath: 'static/tabbar/publish.png',
      selectedIconPath: 'static/tabbar/publish-active.png',
    },
    {
      pagePath: 'pages/message/index',
      text: '消息',
      iconPath: 'static/tabbar/message.png',
      selectedIconPath: 'static/tabbar/message-active.png',
    },
    {
      pagePath: 'pages/user/index',
      text: '我的',
      iconPath: 'static/tabbar/user.png',
      selectedIconPath: 'static/tabbar/user-active.png',
    },
  ],
}

export default defineUniPages({
  globalStyle: {
    navigationStyle: 'default',
    navigationBarTitleText: '校趣闪搭',
    navigationBarBackgroundColor: '#07c160',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f5f5',
  },
  easycom: {
    autoscan: true,
    custom: {
      '^wd-(.*)': 'wot-design-uni/components/wd-$1/wd-$1.vue',
      '^z-paging(.*)': 'z-paging/components/z-paging$1/z-paging$1.vue',
    },
  },
  tabBar: tabBar as any,
})
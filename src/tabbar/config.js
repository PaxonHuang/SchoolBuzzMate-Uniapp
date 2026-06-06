// Tabbar 配置 - 使用 JS 避免 TS 导入问题
export const tabBar = {
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
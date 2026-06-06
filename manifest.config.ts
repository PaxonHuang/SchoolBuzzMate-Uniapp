import { defineManifestConfig } from '@uni-helper/vite-plugin-uni-manifest'

export default defineManifestConfig({
  name: '校趣闪搭',
  appid: '__UNI__8802791',
  description: '校趣闪搭 - 校园社交交易平台',
  versionName: '0.1.0',
  versionCode: '1',
  transformPx: false,
  h5: {
    router: {
      base: '/',
    },
  },
  mpWeixin: {
    appid: 'wxbc1260ebbefc26f6',
    setting: {
      urlCheck: false,
      es6: true,
      minified: true,
      postcss: true,
    },
    optimization: {
      subPackages: true,
    },
    mergeVirtualHostAttributes: true,
    usingComponents: true,
    cloud: {
      root: './uniCloud-aliyun/',
    },
  },
  uniCloud: {
    provider: 'aliyun',
    spaceId: 'mp-c3e590c7-e8f1-4877-95c5-346ba36e296c',
    clientSecret: 'Fcv+jJRfQzGYdHQmWD7ffQ==',
  },
  uniStatistics: {
    enable: false,
  },
  vueVersion: '3',
})
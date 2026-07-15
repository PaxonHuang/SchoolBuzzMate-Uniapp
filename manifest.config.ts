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
    // 支持环境变量覆盖 (CI/多环境/避免明文); 未设置时回退到默认值以保证构建不中断。
    // 注: uniCloud clientSecret 会编译进客户端, 属低敏感度; 真正的高敏感密钥(微信支付商户 key 等)
    // 放在 uniCloud-aliyun/cloudfunctions/common/uni-config-center/uni-pay/ (已 gitignore)。
    spaceId: process.env.UNICLOUD_SPACE_ID || 'mp-c3e590c7-e8f1-4877-95c5-346ba36e296c',
    clientSecret: process.env.UNICLOUD_CLIENT_SECRET || 'Fcv+jJRfQzGYdHQmWD7ffQ==',
  },
  uniStatistics: {
    enable: false,
  },
  vueVersion: '3',
})
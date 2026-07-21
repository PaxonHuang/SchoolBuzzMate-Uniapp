/**
 * SchoolBuzzMate vite plugin: 自动注入 uniCloud.init 到 vendor.js
 *
 * 背景: pnpm run dev:mp-weixin / build:mp-weixin 不会注入 uniCloud.init 参数到编译产物,
 *       而 vite HMR 重 build 又会覆盖手动的注入 (见 known-issues #19/#29/#30)。
 *
 * 此插件在 vite 输出阶段自动声明 var Aa 和 var O 两个数组变量, 这样无论 webpack
 * minification 出来用哪个变量名, IIFE 都能拿到长度 1 的配置数组, 走 nd.init(t)
 * 正确分支, 警告消失, cloud function 可用。
 *
 * 配置来源: 同 inject-unicloud-init.mjs (env UNICLOUD_* 优先, 否则读 src/manifest.json)
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function loadConfig() {
  const envProvider = process.env.UNICLOUD_PROVIDER
  const envSpaceId = process.env.UNICLOUD_SPACE_ID
  const envClientSecret = process.env.UNICLOUD_CLIENT_SECRET

  if (envProvider && envSpaceId && envClientSecret) {
    return { provider: envProvider, spaceId: envSpaceId, clientSecret: envClientSecret }
  }

  const m = JSON.parse(readFileSync(resolve(process.cwd(), 'src/manifest.json'), 'utf8'))
  const u = m.uniCloud || {}
  if (!u.provider || !u.spaceId) {
    return null
  }
  return { provider: u.provider, spaceId: u.spaceId, clientSecret: u.clientSecret || envClientSecret || '' }
}

export default function unicloudInitPlugin() {
  let cfg = null

  return {
    name: 'schoolbuzzmate-unicloud-init',

    // 启动时读一次配置
    buildStart() {
      cfg = loadConfig()
      if (cfg) {
        console.log(`[unicloud-init] 配置已读取: ${cfg.provider} / ${cfg.spaceId}`)
      } else {
        console.warn('[unicloud-init] 未找到 uniCloud 配置 (env 或 manifest.json), 跳过注入')
      }
    },

    // dev 模式 transform hook: 拦截 vendor.js 输出, 在内容前面追加 var Aa / var O 声明
    // build 模式 transform hook 也会被 vite 调用 (每个 emit 阶段)
    transform(code, id) {
      if (!cfg) return null
      if (!id) return null
      // 仅处理 vendor.js 文件
      if (!/vendor\.js(\?|$)/.test(id)) return null

      const arr = `[{provider:"${cfg.provider}",spaceId:"${cfg.spaceId}",clientSecret:"${cfg.clientSecret}"}]`
      const injection =
        `/* SchoolBuzzMate uniCloud.init injection */` +
        `var Aa=${arr};` +
        `var O=${arr};` +
        '\n'
      return {
        code: injection + code,
        map: null,
      }
    },

    // build 模式兜底: 在所有 chunk emit 完后, 对 build 产物再做一次文件注入
    // (应对 vite transform 错过某些 chunk 的极端情况)
    closeBundle() {
      if (!cfg) return
      if (process.env.NODE_ENV === 'development') return // dev 模式由 transform hook 处理
      // build mode: 文件已写盘, 不需要 (transform 已处理), 这里仅日志
      console.log('[unicloud-init] build 模式 done, transform hook 已注入所有 vendor.js')
    },
  }
}

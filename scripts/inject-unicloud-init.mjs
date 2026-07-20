#!/usr/bin/env node
/**
 * SchoolBuzzMate uniCloud.init 注入脚本 (WSL2 CLI 后处理)
 *
 * 背景: pnpm run dev:mp-weixin / build:mp-weixin 的产物 vendor.js 里有一段 IIFE:
 *   (()=>{const e=Aa;let t={};if(e&&1===e.length) t=e[0],nd=nd.init(t),nd._isDefault=!0;
 *         else { 警告 + stub 所有 uniCloud.* 方法... }})()
 *
 *   HBuilderX GUI 编译时会把 pre-baked 的云空间配置注入到 `Aa` 变量,
 *   但 pnpm CLI 编译不会 (见 known-issues #19), 结果 runtime 命中 else 分支,
 *   所有 uniCloud.callFunction / uploadFile 都返回 reject Promise。
 *
 * 解法: 本脚本在 vendor.js 头部声明
 *   let Aa = [{provider, spaceId, clientSecret}, ...];
 *   这样 IIFE 看到的 `e` 是 length=1 的数组, 自动走 nd.init(t) 正确分支。
 *
 * 配置来源(按优先级):
 *   1) 环境变量 UNICLOUD_PROVIDER / UNICLOUD_SPACE_ID / UNICLOUD_CLIENT_SECRET
 *   2) src/manifest.json 的 uniCloud 块
 *   3) 报错退出
 *
 * 用法:
 *   pnpm run build:mp-weixin && node scripts/inject-unicloud-init.mjs
 *   # 或者 dev 模式:
 *   pnpm run dev:mp-weixin   # 启动监听
 *   node scripts/inject-unicloud-init.mjs dist/dev/mp-weixin   # 一次性注入
 *
 * 安全: clientSecret 是敏感凭证, 强烈建议通过环境变量注入, 不要硬编码到 manifest.json
 *       (manifest.json 已被 git 跟踪, 见 CHANGELOG.md 097e71d 提交)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const argPath = process.argv[2] || 'dist/build/mp-weixin'
const DIST_VENDOR = resolve(process.cwd(), argPath, 'common/vendor.js')

// 1. 读配置
function readConfig() {
  const envProvider = process.env.UNICLOUD_PROVIDER
  const envSpaceId = process.env.UNICLOUD_SPACE_ID
  const envClientSecret = process.env.UNICLOUD_CLIENT_SECRET

  if (envProvider && envSpaceId && envClientSecret) {
    return {
      provider: envProvider,
      spaceId: envSpaceId,
      clientSecret: envClientSecret,
      source: 'env',
    }
  }

  const manifestPath = resolve(process.cwd(), 'src/manifest.json')
  if (!existsSync(manifestPath)) {
    console.error('  ✗ src/manifest.json 不存在, 且 UNICLOUD_* 环境变量未设置')
    process.exit(1)
  }
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const u = m.uniCloud || {}
  if (!u.provider || !u.spaceId) {
    console.error('  ✗ manifest.json 缺 uniCloud.{provider,spaceId}, 且 UNICLOUD_* 环境变量未设置')
    process.exit(1)
  }
  return {
    provider: u.provider,
    spaceId: u.spaceId,
    clientSecret: u.clientSecret || envClientSecret || '',
    source: 'manifest',
  }
}

const cfg = readConfig()

if (!cfg.clientSecret) {
  console.error('  ✗ clientSecret 缺失 (env UNICLOUD_CLIENT_SECRET 或 manifest.json uniCloud.clientSecret 至少要一个)')
  process.exit(1)
}

// 2. 检查 vendor.js 存在
if (!existsSync(DIST_VENDOR)) {
  console.error(`  ✗ ${DIST_VENDOR} 不存在`)
  console.error(`    请先跑 ${argPath === 'dist/build/mp-weixin' ? 'pnpm run build:mp-weixin' : `pnpm run dev:mp-weixin (生成 ${argPath})`}`)
  process.exit(1)
}

let js = readFileSync(DIST_VENDOR, 'utf8')

// 3. 找 IIFE 起点: 字符串 "(()=>{const e=Aa;"
const MARKER = '(()=>{const e=Aa;'
const markerIdx = js.indexOf(MARKER)
if (markerIdx < 0) {
  console.error('  ✗ vendor.js 中找不到 IIFE 标记, 可能已注入过或版本不匹配 (uni-app 其他版本用 Aa 不同名)')
  process.exit(1)
}

// 4. 防重复注入
if (js.indexOf('/* SchoolBuzzMate uniCloud.init injection */') >= 0) {
  console.log('  ✓ vendor.js 已注入过, 跳过')
  process.exit(0)
}

// 5. 在 IIFE 前插入: 注入 Aa 变量声明
const injection =
  '/* SchoolBuzzMate uniCloud.init injection */' +
  `var Aa=[{provider:"${cfg.provider}",spaceId:"${cfg.spaceId}",clientSecret:"${cfg.clientSecret}"}];` +
  '\n'

js = js.slice(0, markerIdx) + injection + js.slice(markerIdx)

writeFileSync(DIST_VENDOR, js, 'utf8')

console.log('  ✓ vendor.js 已注入 uniCloud.init 参数:')
console.log(`      provider:    ${cfg.provider}`)
console.log(`      spaceId:     ${cfg.spaceId}`)
console.log(`      clientSecret: ${cfg.clientSecret.slice(0, 8)}...${cfg.clientSecret.slice(-4)}  (来源: ${cfg.source})`)

#!/usr/bin/env node
/**
 * SchoolBuzzMate uniCloud.init 注入脚本 (WSL2 CLI 后处理)
 *
 * 背景: pnpm run dev:mp-weixin / build:mp-weixin 的产物 vendor.js 里有一段 IIFE。
 * 不同 build mode 下 webpack minification 出的代码形态不同:
 *
 *   # build 模式 (production):
 *   (()=>{const e=Aa;let t={};if(e&&1===e.length) t=e[0],nd=nd.init(t),nd._isDefault=!0;
 *         else { 警告 + stub 所有 uniCloud.* 方法... }})()
 *
 *   # dev 模式 (development):
 *   (() => {
 *     const e2 = O;
 *     let t2 = {};
 *     if (e2 && 1 === e2.length)
 *       t2 = e2[0], er = er.init(t2), er._isDefault = true;
 *     else { ... }
 *   })()
 *
 * HBuilderX GUI 编译时会把 pre-baked 的云空间配置注入到 `Aa`(build) 或 `O`(dev)
 * 顶层变量, 但 pnpm CLI 编译不会 (见 known-issues #19)。结果 runtime 命中 else 分支,
 * 所有 uniCloud.callFunction / uploadFile 都返回 reject Promise。
 *
 * 解法: 本脚本在 vendor.js 头部声明 BOTH
 *   var Aa = [{...}];
 *   var O  = [{...}];
 * 这样无论 webpack minify 出哪个变量名, IIFE 看到的都是 length=1 数组,
 * 自动走 nd.init(t) 正确分支。
 *
 * 配置来源(按优先级):
 *   1) 环境变量 UNICLOUD_PROVIDER / UNICLOUD_SPACE_ID / UNICLOUD_CLIENT_SECRET
 *   2) src/manifest.json 的 uniCloud 块
 *   3) 报错退出
 *
 * 用法:
 *   pnpm run build:mp-weixin   # 已自动链上 inject (build 模式)
 *   pnpm run dev:mp-weixin &   # 启动监听
 *   node scripts/inject-unicloud-init.mjs dist/dev/mp-weixin  # 一次性注入 (dev 模式)
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

// 3. 防重复注入
const SENTINEL = '/* SchoolBuzzMate uniCloud.init injection */'
if (js.indexOf(SENTINEL) >= 0) {
  console.log('  ✓ vendor.js 已注入过, 跳过')
  process.exit(0)
}

// 4. 找到至少一个 IIFE 标记, 识别 build vs dev 模式
//    build 模式特征: (()=>{const e=Aa;
//    dev   模式特征: }();\n(() => {\n  const e2 = O;
//    (末尾的 IIFE 紧接在前一个 }(); 后, dev webpack 缩进 2 spaces)
const MARKERS = [
  { name: 'build', pattern: '(()=>{const e=Aa;', varName: 'Aa' },
  { name: 'dev',   pattern: '}();\n(() => {\n  const e2 = O;', varName: 'O' },
]

let detectedMode = null
for (const m of MARKERS) {
  if (js.indexOf(m.pattern) >= 0) {
    detectedMode = m
    break
  }
}

if (!detectedMode) {
  console.error('  ✗ vendor.js 中找不到任何 IIFE 标记 (build 模式 "(()=>{const e=Aa;" 或 dev 模式 "}();\\n(() => {\\n  const e2 = O;" 都不在)')
  console.error('    可能原因: uni-app 版本 minification 改了变量名, 或 vendor.js 被替换')
  process.exit(1)
}

// 5. 在 IIFE 前插入: 注入 Aa 和 O 两个变量声明 (兼容两种模式)
const arrayLiteral =
  `[{provider:"${cfg.provider}",spaceId:"${cfg.spaceId}",clientSecret:"${cfg.clientSecret}"}]`

const injection =
  `${SENTINEL}` +
  `var Aa=${arrayLiteral};` +
  `var O=${arrayLiteral};` +
  '\n'

const markerIdx = js.indexOf(detectedMode.pattern)
js = js.slice(0, markerIdx) + injection + js.slice(markerIdx)

writeFileSync(DIST_VENDOR, js, 'utf8')

console.log(`  ✓ vendor.js (mode=${detectedMode.name}) 已注入 uniCloud.init 参数:`)
console.log(`      provider:    ${cfg.provider}`)
console.log(`      spaceId:     ${cfg.spaceId}`)
console.log(`      clientSecret: ${cfg.clientSecret.slice(0, 8)}...${cfg.clientSecret.slice(-4)}  (来源: ${cfg.source})`)
console.log(`      同时声明 var Aa / var O, 兼容 build 和 dev 两种 webpack minification`)

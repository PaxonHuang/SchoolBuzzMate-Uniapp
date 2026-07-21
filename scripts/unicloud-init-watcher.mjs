#!/usr/bin/env node
/**
 * SchoolBuzzMate uniCloud.init 自动注入守护进程 (Watchdog)
 *
 * 监听 dist/{build,dev}/mp-weixin/common/ 目录里 vendor.js 的任何事件,
 * 用 polling 兜底 (每 500ms stat) + fs.watch 即时触发, 任一信号都重新注入。
 *
 * 为什么需要 polling 兜底:
 * - vite HMR rebuild 时 vendor.js 是 atomic write (write tmp + rename)
 * - fs.watch 的 rename 事件触发瞬间, 新文件还没写完
 * - polling 500ms 后肯定能看到完整的新文件
 *
 * 注入本身是幂等的 (有 sentinel 防重复), 所以放心每 500ms 都可触发。
 *
 * 用法:
 *   nohup node scripts/unicloud-init-watcher.mjs > /tmp/uni-watch.log 2>&1 &
 *   pnpm run dev:mp-weixin
 *
 * Ctrl-C / SIGTERM 退出
 */

import { watch, existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const WATCH_DIRS = [
  resolve(process.cwd(), 'dist/dev/mp-weixin/common'),
  resolve(process.cwd(), 'dist/build/mp-weixin/common'),
]
const TARGET_FILE = 'vendor.js'
const INJECT_SCRIPT = resolve(process.cwd(), 'scripts/inject-unicloud-init.mjs')
const POLL_MS = 800

let lastSize = new Map()
let lastInjected = new Map()  // path -> mtime 避免重复
let injecting = new Set()     // 防并发

function dirToRelDir(d) {
  // d 形如 '/home/.../dist/dev/mp-weixin/common'
  // 返回 inject 脚本能识别的路径前缀 'dist/dev/mp-weixin'
  const m = d.match(/(dist\/(?:build|dev)\/mp-weixin)/)
  return m ? m[1] : null
}

function tryInject(d, reason) {
  const relDir = dirToRelDir(d)
  if (!relDir) return
  if (injecting.has(relDir)) return
  injecting.add(relDir)

  const vendorPath = resolve(d, TARGET_FILE)
  if (!existsSync(vendorPath)) {
    injecting.delete(relDir)
    return
  }

  let st
  try { st = statSync(vendorPath) } catch { injecting.delete(relDir); return }

  const cached = lastInjected.get(relDir)
  if (cached && cached.mtimeMs === st.mtimeMs && cached.size === st.size) {
    injecting.delete(relDir)
    return
  }

  console.log(`[unicloud-watch] (${reason}) ${relDir}/${TARGET_FILE} size=${st.size}, 注入中...`)
  const r = spawnSync('node', [INJECT_SCRIPT, relDir], { stdio: 'pipe' })
  if (r.status === 0) {
    lastInjected.set(relDir, { mtimeMs: st.mtimeMs, size: st.size })
    console.log(`[unicloud-watch] ✓ 注入完成`)
  } else {
    const err = (r.stderr || r.stdout || '').toString().split('\n').filter(l => l.includes('✗'))[0]
    console.log(`[unicloud-watch] (${reason}) ${err || '注入失败 (下一步 poll 会重试)'}`)
  }

  injecting.delete(relDir)
}

console.log('[unicloud-watch] SchoolBuzzMate uniCloud.init Watchdog 启动')
for (const d of WATCH_DIRS) {
  console.log(`[unicloud-watch] 监听: ${d}`)
}

// 1) fs.watch 即时触发
const watchers = []
for (const d of WATCH_DIRS) {
  try {
    const w = watch(d, { persistent: true }, (event, filename) => {
      if (filename === TARGET_FILE || (filename && filename.endsWith('/' + TARGET_FILE))) {
        tryInject(d, `${event}`)
      }
    })
    watchers.push(w)
  } catch (e) {
    console.log(`[unicloud-watch] watch(${d}) 失败: ${e.message}`)
  }
}

// 2) Polling 兜底 (每 800ms stat 一次, 文件变化就注入)
setInterval(() => {
  for (const d of WATCH_DIRS) {
    const vpath = resolve(d, TARGET_FILE)
    if (!existsSync(vpath)) continue
    let st
    try { st = statSync(vpath) } catch { continue }
    const relDir = dirToRelDir(d)
    if (!relDir) continue
    const cached = lastSize.get(relDir)
    if (cached !== st.size) {
      lastSize.set(relDir, st.size)
      tryInject(d, 'poll')
    }
  }
}, POLL_MS)

// 启动后立即扫一次
setTimeout(() => {
  for (const d of WATCH_DIRS) {
    const vpath = resolve(d, TARGET_FILE)
    if (existsSync(vpath)) tryInject(d, 'startup')
  }
}, 1000)

console.log('[unicloud-watch] 就绪 ✓ (Ctrl-C / SIGTERM 退出)')

process.on('SIGINT', () => {
  console.log('\n[unicloud-watch] SIGINT, 退出')
  for (const w of watchers) { try { w.close() } catch {} }
  process.exit(0)
})
process.on('SIGTERM', () => process.exit(0))

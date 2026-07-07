#!/usr/bin/env node
/**
 * 修复 uni-app 编译 mp-weixin 产物 project.config.json 的 AppID
 *
 * 问题: @uni-helper/vite-plugin-uni-manifest 1.x 在 src/manifest.json 里
 *       写入空 `mp-weixin: { appid: "" }` 块, 覆盖了 `mpWeixin.appid` 的
 *       真实配置, 导致编译输出里 appid="touristappid" (微信开发者工具拒绝)
 *
 * 解决: build 后强制把 dist/<platform>/project.config.json 的 appid
 *       改回真实 AppID, 不管 src/manifest.json 怎么变
 *
 * 用法: 已在 package.json scripts 配 postbuild, 自动跑
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const targets = [
  { dist: 'dist/build/mp-weixin/project.config.json', appid: 'wxbc1260ebbefc26f6' },
  { dist: 'dist/dev/mp-weixin/project.config.json',   appid: 'wxbc1260ebbefc26f6' },
]

let fixed = 0
for (const t of targets) {
  const fullPath = resolve(process.cwd(), t.dist)
  if (!existsSync(fullPath)) continue
  const cfg = JSON.parse(readFileSync(fullPath, 'utf-8'))
  if (cfg.appid === t.appid) continue
  console.log(`[fix-mp-weixin-appid] ${t.dist}: ${cfg.appid} -> ${t.appid}`)
  cfg.appid = t.appid
  writeFileSync(fullPath, JSON.stringify(cfg, null, 2) + '\n', 'utf-8')
  fixed++
}
if (fixed === 0) {
  console.log('[fix-mp-weixin-appid] no dist found, skip (run after build:mp-weixin)')
}
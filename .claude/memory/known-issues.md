# 已知问题 + 解决方案 (截至 2026-07-05)

## 问题 1: PowerShell 处理 UTF-8 中文文件会乱码

**症状**: 用 PowerShell 的 `Get-Content -Raw` + `.Replace()` 或 `[System.IO.File]::WriteAllText` 处理含中文的 UTF-8 文件, 字节被改坏, 文件变成 GBK/损坏。

**原因**: PowerShell here-string `@'...'@` 在某些路径下会按系统代码页 (Windows 中文 = GBK) 重新编码。

**解决方案**:
- ✅ **唯一可靠的方式**: 用 `apply_patch` 工具 (它按字节匹配, 不解码)
- ❌ **绝对不要**: 在 shell 里用 `Replace()` 处理含中文的 UTF-8 文件
- ❌ **绝对不要**: 用 `[System.IO.File]::WriteAllText` 重写整个含中文的文件 (整个文件都会被改编码)

如果文件已被破坏: `git restore <file>` 还原, 然后用 apply_patch 重新做修改.

## 问题 2: tsconfig types 引用了不存在的 `@uni-helper/uni-types`

**症状**: `npx vue-tsc --noEmit` 报错 `Cannot find type definition file for ''@uni-helper/uni-types''`. 即使包没装, tsconfig 也强制 types 数组里要有.

**解决方案**: 从 tsconfig.json 的 `types` 数组里删除 `@uni-helper/uni-types`. 已在 commit `43e1dc2` 处理.

## 问题 3: node_modules 里没有 `@dcloudio/uni-app` 等关键包

**症状**: 
- type-check 报 `Cannot find module '@dcloudio/uni-app'`
- `pnpm run build:mp-weixin` 在 vite.config.ts 加载时挂掉

**原因**: package.json 列了这些包但 `pnpm install` 失败 (sandbox 锁定 `_tmp_*` 临时目录). lockfile 也没锁它们.

**解决方案** (在 sandbox):
1. 看 `node_modules/.pnpm` 找 `+<name>@<version>_<hash>` 目录 (即使 lockfile 不认, 包可能已下载)
2. 手动 symlink: `New-Item -ItemType Junction -Path "node_modules/@dcloudio/uni-app" -Target "E:\...\node_modules\.pnpm\@dcloudio+uni-app@<ver>_<hash>\node_modules\@dcloudio\uni-app"`
3. **不要**用 npm install (会有 `link:` 协议冲突 + npm cache 写不进去)

在真机 Windows 上: 直接 `pnpm install` 就行.

## 问题 4: Vite/esbuild 在 Codex sandbox 里跑不了

**症状**: `pnpm run build:mp-weixin` 报 `Error: spawn EPERM`, vite.config.ts 加载就挂.

**原因**: esbuild 想 fork 一个子进程打包 vite.config.ts, sandbox 不允许.

**解决方案**: 
- ✅ **sandbox 里**: 只跑 `npx vue-tsc --noEmit` (类型检查不需要 fork 进程)
- ✅ **真机 Windows**: 在原生 PowerShell 跑 `pnpm e2e:check` (这个脚本是专门为这种场景写的)
- ❌ **不要**: 在 sandbox 里硬跑 build

## 问题 5: HBuilderX 在 Windows + Node v22 下有 ESM bug

**症状**: `Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data, and node are supported... Received protocol 'e:'`

**解决方案**: 
- 永远用 pnpm CLI (`pnpm run dev:mp-weixin` / `pnpm run build:mp-weixin`)
- 微信开发者工具导入 `dist/dev/mp-weixin` 或 `dist/build/mp-weixin` 即可

## 问题 6: pnpm install 在 sandbox 里 EPERM

**症状**: `EPERM: operation not permitted, unlink '..._tmp_xxxxxxx'`

**原因**: pnpm 在 `C:\Users\...\AppData\Local\pnpm\.tools\pnpm` 下创建 tmp 文件, 但 sandbox 锁了 `_tmp_*` 模式

**解决方案**:
1. 清理 sandbox 内的 `_tmp_*` 临时目录 (`Remove-Item _tmp_* -Recurse -Force`)
2. **不要**让 pnpm 再创建新 tmp (一旦被锁就重试会卡死)
3. 改用手动 symlink (见问题 3)

## 问题 7: 误用 shell Replace 改坏了 UTF-8 文件

**症状**: 改了文件后, vue-tsc 报一堆 `Unterminated string literal` / `Invalid character`, 而且文件看上去中文显示正常但字节错了.

**恢复步骤**:
1. `git restore <file>` 还原
2. 用 `apply_patch` 重做改动 (不会破坏编码)
3. 如果 git 也被污染: `git restore --staged <file>` 重新 stage

## 问题 8: git 写需要 escalated 权限

**症状**: `fatal: Unable to create 'E:/.../SchoolBuzzUniAPP/.git/index.lock': Permission denied`

**原因**: Codex sandbox 把 `.git/` 设成只读.

**解决方案**: 每次 git 写操作 (add/commit/restore) 用 `require_escalated: true` 调 shell_command.

## 问题 9: getUserStats 用错 ID 类型

**症状**: user-co.getUserStats 把 `context.UNIID_USER._id` (uni-id._id) 当 `products.seller_id` 查询, 全部返回 0.

**原因**: 历史 bug, products/orders 的外键是 `school_users._id` 不是 `uni-id._id`.

**解决方案** (已在 commit `086a4bd` 修):
```js
const suRes = await db.collection('school_users').where({ user_id: userId }).field({_id: true}).get()
const schoolUserId = suRes.data?.[0]?._id || null
// 然后用 schoolUserId 查 products/orders
```

## 问题 10: type-check 看不到 errors 因为 tsconfig types 数组坏了

**症状**: `npx vue-tsc --noEmit` 立刻退出 (exit 1) 只显示 `Cannot find type definition file for '@uni-helper/uni-types'`, 不显示其他错误.

**解决方案**: 删除 `@uni-helper/uni-types` 后再跑 (见问题 2), 真实错误才会浮出来.

## 问题 11: AGENTS.md vs CLAUDE.md 容易混淆

- `AGENTS.md` → Codex (Codex.ai/code) 看
- `CLAUDE.md` → Claude Code (claude.ai/code) 看
- `.claude/memory/` → Claude Code 专属深度记忆

**两个 agent 看到的入口文件不同, 内容互补** (CLAUDE.md 已经把关键约定和 commit 列表写上了).

## 问题 12: 写中文文件用 apply_patch 时, 我的中文如果跟磁盘上的不完全一致会 patch 失败

**解决方案**:
1. 先 `git show HEAD:<file>` 拿原文 (磁盘可能已被我的 shell 操作改坏)
2. 从 git 输出**复制**原文 (包括所有空格/换行) 到 apply_patch 的 context line
3. 不要从我的脑里"重打"中文 (容易引号、空格不一致)

## 问题 13: .git/index.lock 死锁

**症状**: 之前 git 操作失败留下 lock 文件, 后续 git 全部报 lock 占用.

**解决方案**: `Remove-Item .git\index.lock` (需要 escalated 权限), 或关掉 Codex session 重开.

## 问题 14: 历史会话里混有其他项目和敏感凭证

**症状**: 从 Codex 历史迁移到 Claude Code 时, 会看到 NJTS Astro 博客、Cloudflare Pages、GitHub PAT、Cloudflare token、STM32 项目等内容夹在一起。

**解决方案**:
- 只把 SchoolBuzzMate 相关的项目事实写入 `.claude/memory/`。
- 不要把原始聊天全文导入仓库。
- 不要复述或保存任何 token、PAT、API key、支付密钥。
- 如果后续任务确实需要凭证, 让用户通过安全方式重新确认, 或检查本机环境变量/平台后台配置。

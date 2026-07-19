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

## 问题 15: Windows→WSL2 迁移 — LF/CRLF 与跨边界工具链

**背景**: 开发环境迁到 WSL2 后,微信开发者工具 + HBuilderX 仍是 Windows 程序,进不了 WSL2 → 混合工作流。

**踩坑与正解**:
1. **LF/CRLF 报错** ("diff contains a change in line endings from LF to CRLF"):
   - 根因: 无 `.gitattributes`,各工具保存行尾不一致。
   - 正解: 加 `.gitattributes`(`* text=auto eol=lf`,`*.ps1/*.bat/*.cmd text eol=crlf`,`*.sh text eol=lf`)+ `.editorconfig`;新机 `git config core.autocrlf false`,以 `.gitattributes` 为唯一事实来源。
   - 诊断用 `git ls-files --eol`(权威),不要用 `file`(会误报)。本仓库实际大部分已是 LF(`core.autocrlf=input`),只有个别 CRLF。
2. **`.husky/` 无需手改**: 未被 git 跟踪,`pnpm install` 的 `prepare: husky` 会在 Linux 侧重新生成正确 LF。
3. **微信工具跨边界打开产物**: 导入 `\\wsl.localhost\Ubuntu\home\<用户>\...\dist\dev\mp-weixin`;`.wslconfig` 开 `networkingMode=mirrored` 让 localhost/dev server 互通。
4. **部署脚本跨边界**: 用 `scripts/*.sh`(WSL2),通过互操作调 Windows CLI,路径经 `wslpath -w` 翻译;CLI 路径用 `$WX_CLI`/`$HBUILDERX_CLI` 环境变量覆盖(`.ps1` 已同步改为 `$env:` 间接)。
5. **代理(方案 A,复用 Windows Clash)**: WSL Settings「网络」开「自动代理」+ Clash Verge 开系统代理 + 网络模式 mirrored → WSL 自动继承 Windows 代理;必要时手动 `git config --global http.proxy http://127.0.0.1:<mixed端口>`。(备选方案 B: WSL2 内自装 ShellCrash,mirrored 下用端口代理而非 TUN。)
6. **PowerShell UTF-8 破坏问题(问题1/7)在 Linux 下不复现**: WSL2 里改中文文件用普通编辑/`sed` 即可,不再受 PowerShell 代码页坑。
7. **迁移方式**: 优先 `git clone`(或 `git bundle`)干净检出,不要 `cp` 整个含 node_modules 的目录;`pnpm install` 在 native fs 重建,不再需要问题3 的手动 symlink workaround。

**安全提醒(迁移审计时发现)**: `IDkeys.txt` 被 git 跟踪且未 gitignore(疑似含密钥);`manifest.config.ts` 有明文 `clientSecret`。迁移前应审查、移出跟踪并按需轮换。

## 问题 16: HBuilderX CLI 真实命令语法(2026-07-17 实测)

**症状**: 旧 `scripts/deploy-cloud.{ps1,sh}` 用 `cli upload --project <path> --type cloudfunction --path <path>` 调上传 — 这是**错的语法**,实际命令是子命令形式 `cli cloud functions --upload X --prj <项目名> --provider aliyun --name <资源名>`,且 `cli.exe` **必须在 HBuilderX GUI 已打开状态下**才能正常调用(否则返回 `未检测到已打开的HBuilderX`)。

**坑点 (db schema)**: `--name` 对 db 类型**必须带 `.schema.json` 后缀**(cloudfunction / common 不用后缀),否则报错 `schema 文件名必须以 '.schema.json' 结尾`。

**坑点 (WSL2 bash)**:
- `while IFS= read -r s; do ... done < <(find ...)` 形式在 `set -uo pipefail` 下,经过一个会消费 stdout 的 HBuilderX CLI 调用后,read 会**立即 EOF** 只跑 1 次就退出。改用 `mapfile -t ARR < <(find ...)` 先捕到数组,再 `for s in "${ARR[@]}"; do ...; done` 即可。
- `pnpm run <script> -- <args>` 会把 `--` 当字面参数传给脚本,导致 `bash scripts/deploy-cloud.sh -- --dry-run` 报 `未知参数: --`。要么**直接用 `bash scripts/deploy-cloud.sh --dry-run`**,要么为 `pnpm` 写无 `--` 的别名脚本(如 `deploy:cloud:sh:dry`)。

**实测可用的命令 (2026-07-17 已跑通 6 云函数 + 2 公共模块 + 7 schema)**:
```bash
# 项目名 = SchoolBuzzUniApp (HBuilderX 内部, 用 cli project list 查)
# 服务空间 = mp-c3e590c7-e8f1-4877-95c5-346ba36e296c
"/mnt/e/HbuilderX/HBuilderX/cli.exe" cloud functions --upload cloudfunction --prj SchoolBuzzUniApp --provider aliyun --name order-co
"/mnt/e/HbuilderX/HBuilderX/cli.exe" cloud functions --upload common        --prj SchoolBuzzUniApp --provider aliyun --name uni-pay
"/mnt/e/HbuilderX/HBuilderX/cli.exe" cloud functions --upload db             --prj SchoolBuzzUniApp --provider aliyun --name comments.schema.json
"/mnt/e/HbuilderX/HBuilderX/cli.exe" cloud functions --list cloudfunction --prj SchoolBuzzUniApp --provider aliyun --cloud
```

## 问题 18: Windows PowerShell 跑 `npm.cmd run <script>` 在 WSL2 UNC 路径下报 `ENOENT package.json` (2026-07-18)

**症状**: 在 PowerShell 里跑
```powershell
cd \\wsl.localhost\Ubuntu-24.04\home\SchoolBuzzProjects\SchoolBuzzMate-Uniapp
npm.cmd run deploy:cloud
```
报:
```
'\\wsl.localhost\Ubuntu-24.04\...' 用作为当前目录的以上路径启动了 CMD.EXE。
UNC 路径不受支持。默认值设为 Windows 目录。
npm error code ENOENT
npm error path C:\Windows\package.json
```

**根因**:
1. `npm.cmd` 是 Windows 程序 → PowerShell 调它时会先 fork 出 CMD.EXE。
2. CMD.EXE **不支持 UNC 路径**作为 cwd → 自动 fallback 到 `C:\Windows`。
3. CMD.EXE 在 `C:\Windows` 里跑 `npm run` → 找不到 `package.json` → ENOENT。
4. 即使显式 `cd \\wsl.localhost\...`,CMD.EXE 仍然拒绝接收 UNC cwd。

**正解** (按环境二选一):
```powershell
# 方案 A: 直接用 WSL 互操作 (推荐, Windows PowerShell)
bash scripts/deploy-cloud.sh              # WSL 自动把 cwd 翻译回 /home/SchoolBuzzProjects/SchoolBuzzMate-Uniapp

# 方案 B: 进入 WSL bash 后用 pnpm sh 版本
wsl
cd /home/SchoolBuzzProjects/SchoolBuzzMate-Uniapp
pnpm run deploy:cloud:sh                 # = bash scripts/deploy-cloud.sh
pnpm run deploy:cloud:sh:dry             # 只校验, 不实际上传
```

**绝对不要**:
- ❌ `npm.cmd run <script>` (走 CMD.EXE → UNC fail)
- ❌ `pnpm run deploy:cloud` (虽然 pnpm 能在 PowerShell 里解析 UNC, 但内部会调 `powershell -ExecutionPolicy Bypass -File scripts/deploy-cloud.ps1`, 在某些 Windows 版本上 .ps1 也可能在 UNC 下受限)
- ❌ 从 WSL 路径里的 cmd.exe / PowerShell 调任何 npm 子命令

**快速验证是否踩坑**: 看 PowerShell 提示行有没有出现 `UNC 路径不受支持`。出现就立刻换 WSL 互操作。

## 问题 19: CLI 编译产物里没有 uniCloud.init 参数, 微信开发者工具弹 "uni-app cli项目内使用uniCloud需要使用HBuilderX的运行菜单运行项目,且需要在uniCloud目录关联服务空间" (2026-07-18)

**症状**: `pnpm run dev:mp-weixin` / `pnpm run build:mp-weixin` 编译产物在微信开发者工具模拟器里跑时, console 弹出:
```
uni-app cli项目内使用uniCloud需要使用HBuilderX的运行菜单运行项目,
且需要在uniCloud目录关联服务空间
```
所有 `uniCloud.callFunction` / `uniCloud.uploadFile` 调用返回 rejected Promise, 云函数调用 **直接失败**。

**根因** (从编译产物 `dist/build/mp-weixin/common/vendor.js` 反推确认):
1. 警告字符串来自 `@dcloudio/uni-cloud/dist/uni-cloud-x.es.js`, 触发分支逻辑:
   ```js
   if (e && 1 === e.length) {
     t = e[0]; er = er.init(t); er._isDefault = !0;  // 正常
   } else {
     // e 为空 (没注 init 参数) → 走警告分支
     s = ... || "uni-app cli项目内使用uniCloud需要使用HBuilderX的运行菜单...";
     // 所有 uniCloud.* 方法都 return console.error(s) + reject
   }
   ```
2. `e` (init 参数) 是 **HBuilderX GUI 在"运行 → 运行到小程序模拟器"时硬编码注入到 vendor.js** 的。CLI 编译 (`uni build -p mp-weixin` / `uni -p mp-weixin`) **不读** `manifest.json` 里的 `uniCloud` 块, **也不读** `.dev.assign.json`, 所以注入是空的。
3. 验证证据: `dist/build/mp-weixin/app.js` 里没有 `uniCloud.init(...)`, `vendor.js` 里也没有, 但警告字符串 `关联服务空间` **在 vendor.js 里** → 走的就是警告分支。

**正解** (按用途选):

| 用途 | 推荐做法 | 原因 |
|------|----------|------|
| **本地 dev 预览** (微信开发者工具模拟器跑流程) | **必须**走 HBuilderX GUI: 打开 HBuilderX → 导入 `\\wsl.localhost\Ubuntu-24.04\home\SchoolBuzzProjects\SchoolBuzzMate-Uniapp` → 右键 `uniCloud-aliyun` → **关联云服务空间** → 选 `mp-c3e590c7-...` → "运行 → 运行到小程序模拟器 → 微信开发者工具" | HBuilderX 关联后会写 `uniCloud-aliyun/.dev.assign.json` + 在 vendor.js 里注入 init 参数, 警告消失 |
| **CLI dev/preview** (`pnpm run dev:mp-weixin` 给微信开发者工具导入) | ⚠️ 警告会出现, 云函数调用会 reject。**只适合跑前端 UI 改样**, 不能跑 M3 真机闭环 | CLI 路径不注入 init 参数, 这不是 bug 是设计 |
| **生产构建** (`pnpm run build:mp-weixin` → 上传微信后台审核) | ✅ CLI 构建产物足够。审核版走微信后台的云开发配置, 不依赖 vendor.js 里的 init 参数 | 这是设计: 审核版运行时由微信 IDE 自己注入云空间上下文 |

**WSL2 混合场景下的实际操作流程**:
1. **第一次**: 在 Windows 打开 HBuilderX → "文件 → 导入 → 从本地目录导入" → 选 `\\wsl.localhost\Ubuntu-24.04\home\SchoolBuzzProjects\SchoolBuzzMate-Uniapp`。
2. HBuilderX 顶部菜单 "运行" → "运行到小程序模拟器" → "微信开发者工具" → 在弹出 HBuilderX 里点 "确定关联云服务空间" → 选 `mp-c3e590c7-e8f1-4877-95c5-346ba36e296c`。
3. HBuilderX 此时会写 `uniCloud-aliyun/.dev.assign.json` (Windows 端写到 `\\wsl.localhost\...` 镜像路径) → 之后 HBuilderX 内部的 vendor.js 注入 init 参数 → 警告消失。
4. **之后**: CLI 编译 (`pnpm run dev:mp-weixin`) 给微信开发者工具导入 dist 仍有警告 (CLI 不读 `.dev.assign.json`); 但 HBuilderX GUI 的"运行"菜单则不会。

**绝对不要**:
- ❌ 自己手写 `uniCloud-aliyun/.dev.assign.json` — HBuilderX 关联会覆盖; 且 CLI 不读它, 写了也无效
- ❌ 在 `main.ts` 里写 `uniCloud.init({provider, spaceId})` 试图绕过 — 会被 `@dcloudio/uni-cloud` 拦截 (它会先判 `e._isDefault`)
- ❌ 假设警告只是 dev 噪音 — 真机闭环时 `uniCloud.callFunction` 会直接 reject, 排查起来非常坑

**关键事实**:
- `manifest.json` 里的 `uniCloud.{provider,spaceId,clientSecret}` 字段 (本仓 76-80 行) 是 **HBuilderX GUI 关联时读的**, 不是 CLI 编译时读的。
- M3 真机闭环必须在 HBuilderX GUI 编译产物里跑 (用 HBuilderX "运行 → 微信开发者工具" 触发编译 + 注入 init 参数)。CLI 构建产物只能用于上传审核。

## 问题 17: WSL2 下 `git push` 偶发 `Connection reset by peer` (2026-07-17)

**症状**: `git push origin <branch>` 报 `fatal: unable to access 'https://github.com/...': Recv failure: Connection reset by peer`, 但 `curl -I https://github.com` 正常 (HTTP/1.1 200 Connection established)。`git push --dry-run` 也正常,显示所有待 push 的 commit。

**根因**: WSL2 NAT 模式 + Clash Verge 混合端口代理下, git 默认走 **HTTP/2** 多路复用, 经过 SOCKS/HTTP 代理时被中途 reset; curl 默认 HTTP/1.1 不受影响。

**正解**:
```bash
# 临时一次: 强制 HTTP/1.1
git -c http.version=HTTP/1.1 push origin <branch>

# 永久: 全局配置 (推荐, 避免每次写 -c)
git config --global http.version HTTP/1.1
```

**注意**: HTTP/1.1 比 HTTP/2 略慢 (无多路复用), 但对 git push 这种低频操作完全够用, 反而更稳。如果后续换到 mirrored 网络模式或换代理工具, 可以再切回 HTTP/2 (`git config --global --unset http.version`)。

## 问题 26: HBuilderX 在 WSL2 项目上编译报 "Cannot find module @rollup/rollup-win32-x64-msvc" (2026-07-19)

**症状**: `node-linker=hoisted` (#21) 解决"缺编译器模块"后, HBuilderX 又报:
```
Error: Cannot find module @rollup/rollup-win32-x64-msvc.
npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828).
Please try `npm i` again after removing both package-lock.json and node_modules directory.
    at requireWithFriendlyError (\\wsl$\...\node_modules\rollup\dist\native.js:121:9)
```
同样错误也可能来自 `@esbuild/win32-x64`(vite 内部用 esbuild 做 transform)。

**根因**:
- `rollup@4.x` 声明 24 个 `optionalDependencies`(@rollup/rollup-{platform}-{arch})
- `esbuild@0.20.x` 声明 22 个 `optionalDependencies`(@esbuild/{platform}-{arch})
- pnpm 在 WSL2 (Linux x64) 装时只挑匹配当前平台的 binary(rollup-linux-x64-gnu + rollup-linux-x64-musl / @esbuild/linux-x64)
- HBuilderX 在 Windows x64 跑 vite 时, `process.platform==='win32'` → rollup/esbuild 尝试 require 各自 Windows native binary → 找不到 → 报错
- 这是 pnpm "platform-aware optionalDependencies" 的设计, 但 WSL2 跨边界场景下 Windows 端拿不到 Windows binary

**正解**: 显式把 Windows binary 提到顶层 devDependencies(强制 pnpm 装跨平台包):
```bash
# 必须严格匹配版本 (跟 rollup/esbuild 主包一致)
pnpm add -D @rollup/rollup-win32-x64-msvc@4.61.1
pnpm add -D @esbuild/win32-x64@0.20.2
```
装完后:
- ✅ `node_modules/@rollup/rollup-win32-x64-msvc/rollup.win32-x64-msvc.node` (PE32+ DLL)
- ✅ `node_modules/@esbuild/win32-x64/esbuild.exe` (PE32+ exe)
- ✅ HBuilderX 在 Windows 跑 vite 能加载对应 binary

**何时还需要补**:
- 升级 rollup / esbuild 后, 必须同步更新这两个 dep 的版本号
- 跨 ARM (Apple Silicon / Windows ARM) 场景还要加 `@rollup/rollup-win32-arm64-msvc` 等
- 未来如果加 `@swc/core` / `@oxc-parser` 这类带 native 的包, 同样要补 Windows 版本

**注意事项**:
- 这两个 dep 只在 Windows 端的 HBuilderX 编译时被用到, **不影响** Linux 侧 CLI 编译(`pnpm run build:mp-weixin` 仍走 Linux binary)
- WSL2 侧的 npm install 装上 Windows .node 文件纯属"占位"(WSL2 加载不了 PE32+ DLL), 这没关系 — HBuilderX 走 Windows Node 加载才会用上
- 千万别再回退到 `npm install` 想"修复"optional deps 缺失 — 撞 #22 的 arborist bug

## 问题 27: HBuilderX `uniCloud本地调试服务启动失败 EISDIR watch .hbuilderx\launch.json` (2026-07-19)

**症状**: HBuilderX 编译报:
```
uniCloud本地调试服务启动失败:EISDIR:
illegal operation on a directory, watch '\'
\wsl.localhost\Ubuntu-24.04\home
\SchoolBuzzProjects\SchoolBuzzMate-
Uniapp\.hbuilderx\launch.json'。
```
同时云函数 `uniCloud-aliyun/` 一直显示 loading。

**根因**:
- HBuilderX 走 `\\wsl$\Ubuntu-24.04\home\...\uniCloud-aliyun` 9P 边界访问 WSL2 文件, 把路径里的 `\` 当成路径分隔符 → 路径被错切, 最后试图 watch 一个被解析成目录的 `launch.json`
- 路径里的换行符也证实 HBuilderX 的字符串拼接把 `\n` 当成 `\`, 走 9P 时炸了
- 同时 `uniCloud-aliyun/.dev.assign.json` 没生成 → HBuilderX 关联云空间从未成功, 一直转圈

**正解**(三步):
1. **删 `.hbuilderx/launch.json`**: 这个文件是 HBuilderX 自己生成的本地配置(.gitignore 已忽略), 删除后 HBuilderX 下次启动会重新写一份走正确路径的版本
2. **排查 HBuilderX 网络 (关键, 不解决就一直 loading)**:
   - 确认 `%UserProfile%\.wslconfig` 有 `[wsl2] networkingMode=mirrored`, 然后 `wsl --shutdown` 重启
   - 确认 Windows 侧 Clash 系统代理开着 (HBuilderX 访问 api.bspapp.com 走系统代理)
   - 重启 HBuilderX
3. **重新关联**: 右键 `uniCloud-aliyun` → 关联云服务空间 → `mp-c3e590c7-...` → 这次应该正常完成, `.dev.assign.json` 会被写入

**绝对不要**:
- ❌ 手写 `.hbuilderx/launch.json` — HBuilderX 启动时根据 `\\wsl$\...` 路径重新生成, 手写会被覆盖
- ❌ 用 Windows PowerShell 直接删 `.dev.assign.json` 后硬重写 — HBuilderX 关联后会自动覆盖, 自己写的版本可能 schema 不对

**症状**: 在 HBuilderX 里 "运行 → 运行到小程序模拟器 → 微信开发者工具" 报:
```
项目 SchoolBuzzMate-Uniapp 开始编译
node_modules缺少编译器模块，请执行npm install后重试
项目 SchoolBuzzMate-Uniapp 编译失败
```
但 WSL2 里 `pnpm install` 已经成功, `node_modules/@dcloudio/*` 看上去都在。

**根因**:
- pnpm 默认用 symlink 布局: `node_modules/@dcloudio/uni-app` → `.pnpm/@dcloudio+uni-app@.../node_modules/@dcloudio/uni-app`
- HBuilderX 编译时读 `node_modules/@dcloudio/uni-app/lib/...` 用 Node-style require/resolve, 跨 WSL2 9P 文件系统(`\\wsl$\...`)对 symlink 的 follow 在某些 stat + require 组合下超时或失败 → 报"缺少编译器模块"。
- 即使 `node_modules/.bin/vite` 是 pnpm 创建的 symlink, 也能找到, 但 HBuilderX 的额外 stat/检查过不去。

**正解**: 加 `.npmrc` 切 pnpm 到 hoisted 模式(真实目录, 不再 symlink):
```ini
# /home/SchoolBuzzProjects/SchoolBuzzMate-Uniapp/.npmrc
node-linker=hoisted
```
然后:
```bash
pnpm install   # 重装, symlink 全部变成真实目录
```
**效果**:
- ✅ HBuilderX 看到 npm 风格扁平布局, "缺少编译器模块"消失
- ✅ 微信开发者工具导入 dist 正常
- ⚠️ node_modules 体积 3-5x (每个包独立副本), 本项目约 828K 编译产物可接受
- ✅ CLI 编译性能几乎不变

**绝对不要**:
- ❌ 在 pnpm 项目里跑 `npm install` 试图"修复" — 见 #22
- ❌ 手写 symlink 把 `.pnpm/` 实体挂到顶层 — `pnpm install` 重装就失效
- ❌ 用 `shamefully-hoist=true` (老兼容方案, 不如 `node-linker=hoisted` 干净)

## 问题 22: pnpm 项目里跑 `npm install` 报 `Cannot read properties of null (reading 'matches')` (2026-07-19)

**症状**: WSL2 项目根跑 `npm install` 报:
```
npm error Cannot read properties of null (reading 'matches')
A complete log of this run in: /root/.npm/_logs/2026-07-19T06_34_28_417Z-debug-0.log
```

**根因**(从 stack 锁定):
```
TypeError: Cannot read properties of null (reading 'matches')
  at Link.matches (.../npm/.../@npmcli/arborist/lib/node.js:1137:41)
  at Link.canDedupe (.../arborist/lib/node.js:1091:15)
  at PlaceDep.pruneDedupable (.../arborist/lib/place-dep.js:426:14)
  at new PlaceDep (...)
  at #buildDepStep (.../arborist/lib/arborist/build-ideal-tree.js:920:18)
  at async Arborist.buildIdealTree (...)
```
npm 10 的 `@npmcli/arborist` 在 `BuildIdealTree` 时走 `node_modules/` 做 dedupe, 但 pnpm 已经创建了 `.pnpm/` symlink 树, arborist 解析 symlink 时撞到 null(Link.matches 拿不到预期对象)。

**重要事实**:
- `preinstall: "npx only-allow pnpm"` 没拦住是 npm 10.x 放宽了 preinstall 行为(早期 npm 版本会拒绝, 10.x 有时不拦)。
- 即使去掉 `packageManager` 字段, arborist 仍会读 `.pnpm/` 撞同样错 — 跟 packageManager 字段无关。

**正解**: **永远不要在 pnpm 项目里跑 `npm install`**。
- 若需要 npm 风格布局给 HBuilderX 用 → 加 `.npmrc` 的 `node-linker=hoisted` 重新 `pnpm install`(#21)
- 若只是临时想装一个包 → `pnpm add <pkg>`, 不是 `npm install <pkg>`
- 若不小心跑了 npm install 且撞了 → `pnpm install` 一次恢复即可, 不需要 `rm -rf node_modules`

**绝对不要**: `npm install --force` / `npm install --legacy-peer-deps` — 都是同一个 arborist bug, 会撞一样错。

## 问题 23: HBuilderX "关联云服务空间" 卡 loading 不返回 (2026-07-19)

**症状**: Windows HBuilderX → 右键 `uniCloud-aliyun` → "关联云服务空间或项目" → 选 `mp-c3e590c7-...` → 转圈 loading 不消失。

**最可能的 3 个根因**(按概率排):

1. **HBuilderX 进程没走 Clash 系统代理**: HBuilderX 是 Windows GUI, 访问 `api.bspapp.com` 时如果没拿到 Windows 系统代理(Clash 7890), 会 timeout → loading 不消失。
2. **WSL2 没开 mirrored 模式**: 即使 Windows 侧 Clash 开着, 如果 `%UserProfile%\.wslconfig` 没设 `networkingMode=mirrored`, WSL2 侧拿到的代理配置也传不回 Windows 进程(HBuilderX)。
3. **HBuilderX 内部状态卡死**: 之前 `npm install` 在项目根跑过留下了 `.npm/_cacache` 临时锁或 HBuilderX 自己维护的 `.dev.assign.json` 损坏。

**正解**(按顺序排查):

```powershell
# 1) 确认 .wslconfig 开了 mirrored
notepad $env:USERPROFILE\.wslconfig
# 内容应该是:
# [wsl2]
# networkingMode=mirrored
# swap=0
# ...其他按需

# 2) 重启 WSL 让配置生效
wsl --shutdown
wsl

# 3) 在 PowerShell 验证 bspapp 可达
curl -I https://api.bspapp.com
# 应该返回 200/301, 不应该超时

# 4) 如果上面 OK, 关掉 HBuilderX 重新打开再关联
#    (关之前先备份可能损坏的 .dev.assign.json)
#    rm \\wsl$\Ubuntu-24.04\home\SchoolBuzzProjects\SchoolBuzzMate-Uniapp\uniCloud-aliyun\.dev.assign.json
```

**绝对不要**:
- ❌ 在 HBuilderX 设置里改代理到 localhost:7890 — 这是 WS2 内部地址, Windows 进程访问不到(除非 mirrored)
- ❌ 关掉 Clash 切直连 — 公司网络可能拦截 bspapp

## 问题 24: HBuilderX `settings.json` 里 node/npm 路径不要配 WSL2 路径 (2026-07-19)

**常见误配置**:
```json
{
  "node.exe.path": "/opt/nvm/versions/node/v22.23.1/bin/node",      // ❌ WSL2 路径
  "npm.cmd.path": "/opt/nvm/versions/node/v22.23.1/lib/node_modules/npm/bin/npm-cli.js"  // ❌ WSL2 路径
}
```

**正解**:
- HBuilderX 是 **Windows GUI**, 用 `\\wsl$\Ubuntu\opt\nvm\...` 路径在 9P 驱动上不可靠。
- HBuilderX 的 **uni-app 编译走的是它自带的 Node runtime**(`HBuilderX/plugins/node/`), **完全不读** settings.json 里的 node/npm 路径。
- settings.json 里的 node/npm 路径**只对 "运行外部 JS 文件" 功能生效**(右键 → 运行), 本项目用不上。
- 推荐配置: 保持 `E:/nvm/v22.18.0/node.exe` 和 `E:/nvm/v22.18.0/npm.cmd`(Windows 本地 nvm)。

**核心理念**: **CLI 编译用 WSL2 自带 Node v22.23.1**; **HBuilderX GUI 用自带 Node**。两边互不依赖, 不要硬打通。

实际踩坑后总结的对应关系 (出问题查这张表):

| 用户想做的事 | 用什么编译/运行 | 产物路径 | uniCloud.init 是否注入 | 真机闭环能用? |
|---|---|---|---|---|
| 改前端 UI 看效果 | `pnpm run dev:mp-weixin` + 微信开发者工具导入 `dist/dev/mp-weixin` | `\\wsl$\Ubuntu-24.04\home\...\dist\dev\mp-weixin` | ❌ 警告会弹, 云函数 reject | ❌ |
| **M3 真机闭环验证** (发布→下单→支付→...) | **HBuilderX GUI "运行 → 运行到小程序模拟器 → 微信开发者工具"** | HBuilderX 自管临时目录 | ✅ | ✅ |
| 提交审核 (`pnpm run build:mp-weixin`) | CLI 编译 + 微信开发者工具"上传" | `dist/build/mp-weixin` | ⚠️ CLI 注入缺失, 但审核版运行时由微信 IDE 注 | ✅ (审核) / ❌ (本地预览) |
| 部署云函数 | `bash scripts/deploy-cloud.sh` (WSL2) 或 `bash scripts/deploy-cloud.sh` (Windows 互操作) | 不涉及前端产物 | n/a | n/a |

**关键认知**: "前端编译工具链"和"运行时 uniCloud 上下文注入"是 **两套独立机制**, CLI 只管前者, HBuilderX 同时管两者。M3 验证只能用后者。

## 问题 25: M3 真机闭环标准流程(整合 #19-#24, 2026-07-19 修订)

按以下顺序执行可走通 HBuilderX + WSL2 + 微信开发者工具全链路:

**一次性环境准备**:
1. 确认 `%UserProfile%\.wslconfig` 有 `[wsl2] networkingMode=mirrored`, 然后 `wsl --shutdown` 重启。
2. WSL2 项目根加 `.npmrc`:
   ```ini
   node-linker=hoisted
   ```
3. `pnpm install`(让 node_modules 变真实目录, 不再 symlink, 给 HBuilderX 看)。

**每次开发循环**:
1. WSL2: `pnpm run dev:mp-weixin` 起监听(可选, 只在改前端时需要)。
2. Windows HBuilderX: 打开项目 → 右键 `uniCloud-aliyun` → 关联云服务空间(若已关联则跳过)。
3. Windows HBuilderX: 顶部菜单 运行 → 运行到小程序模拟器 → 微信开发者工具。
4. 微信开发者工具: 弹出后会自动 reload, 走 M3 真机闭环流程。

**部署云函数**(独立环节, 用 WSL2 脚本):
```bash
bash scripts/deploy-cloud.sh         # 或 pnpm run deploy:cloud:sh
```

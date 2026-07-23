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

## 问题 28: HBuilderX "运行到小程序模拟器" 在 WSL2 项目上 EISDIR/watch 全面失败 — Windows fs.watch + 9P UNC 的根本限制 (2026-07-20)

**症状**: HBuilderX "运行 → 运行到小程序模拟器 → 微信开发者工具" 启动时报:
```
uniCloud本地调试服务启动失败:EISDIR:
illegal operation on a directory, watch '\'
\wsl.localhost\Ubuntu-24.04\home
\SchoolBuzzProjects\SchoolBuzzMate-
Uniapp\.hbuilderx\launch.json'

# + node:internal/fs/watchers:254 EISDIR '//wsl.localhost/Ubuntu-24.04/home/SchoolBuzzProjects/SchoolBuzzMate-Uniapp/src'
# + chokidar/lib/nodefs-handler.js:119
```

**根因**:
- HBuilderX 用 **Windows 自带 Node.js v22.18.0**(栈里 `node v22.18.0`), 不是 WSL2 内的 Node
- HBuilderX 在 Windows 上跑编译, 用 chokidar 做文件监听
- chokidar 在 Windows 走 `fs.watch()` → `ReadDirectoryChangesW`
- `ReadDirectoryChangesW` 对 `\\wsl$\Ubuntu\...` UNC 路径(9P 驱动的 WSL2 文件)不稳定:
  - 部分路径被解析成目录(EISDIR)
  - 部分路径 watch 返回但事件丢失
- 这是 **Windows 内核层 FS API 对 9P 的限制**, 跟项目配置 / pnpm / npm 都无关

**用户的工作流限制**:
- 用 `networkingMode=mirrored` 会让 Claude Code 联网 (socket) 报错失败, 所以只能用 NAT 模式
- NAT 模式 + 没 mirrored → HBuilderX Windows 进程对 WSL2 文件的访问更脆弱
- `.wslconfig` 里加 `[experimental] hostAddressLoopback=true` 也没替代 mirrored

**正解** (推荐 — **完全放弃 HBuilderX "运行" 功能**, 改用纯 WSL2 CLI 流程):

1. **WSL2 内 CLI 编译 + 后处理**:
   ```bash
   pnpm run build:mp-weixin   # 已链上 inject-unicloud-init.mjs, 自动注入 init 参数
   # 或 dev 模式:
   pnpm run dev:mp-weixin &   # 后台跑, vite HMR
   node scripts/inject-unicloud-init.mjs dist/dev/mp-weixin   # 一次性注入 (重 build 后再跑)
   ```

2. **微信开发者工具 自动监听**:
   - 微信开发者工具导入项目 → `\\wsl.localhost\Ubuntu-24.04\home\SchoolBuzzProjects\SchoolBuzzMate-Uniapp\dist\build\mp-weixin`(或 dev)
   - 微信开发者工具的 watcher (用 WeChat IDE 内置的 MiniProgram watcher) 比 chokidar + Windows fs.watch 对 UNC 路径更鲁棒
   - 它能正确监听 `\\wsl$\...` 路径下的文件变更并触发 IDE 自动刷新

3. **HBuilderX 只用于 "上传云函数" 这一件事** (用 `bash scripts/deploy-cloud.sh` 替代, 见 #16)

**为什么这样可行**:
- ✅ CLI 编译产物 (vendor.js) 已通过 `inject-unicloud-init.mjs` 注入 `Aa = [{provider, spaceId, clientSecret}]`, 运行时走 `nd.init(t)` 而非警告分支 → 云函数可用
- ✅ 微信开发者工具的 watcher 不依赖 chokidar + Windows ReadDirectoryChangesW, 用自家 Watchdog 机制
- ✅ WSL2 内 pnpm/npm/node 全在 Linux 原生 fs, 速度比 Windows 快 5-10x

**为什么 HBuilderX "关联云空间" 在 NAT 模式下可能仍卡 loading**:
- HBuilderX "关联云服务空间" 走 `api.bspapp.com` 验证登录态
- NAT 模式下, Windows 进程通过 WSL2 出口访问 bspapp.com, 中间代理链长, 容易超时
- 解法: 重启 HBuilderX 时**确保 Windows 侧 Clash 系统代理开着** + 不需要用 HBuilderX 这个功能 (我们的 inject 脚本已经替代它)

**绝对不要**:
- ❌ 在 WSL2 项目上硬跑 HBuilderX "运行" / "发行" — 必撞 EISDIR/watch, 这是已知 Windows 9P 限制
- ❌ 用 PowerShell `New-Item -ItemType HardLink` 把项目复制一份到 Windows 原生 fs 来给 HBuilderX — 同步混乱, 比上面方案差
- ❌ 调 HBuilderX settings 把 node 路径改成 WSL2 的 nvm 路径 — HBuilderX 进程是 Windows 的, 走 WSL2 互操作也不稳

## 问题 29: vendor.js 注入 uniCloud.init 的实现细节 (`scripts/inject-unicloud-init.mjs`, 2026-07-20)

**实现原理**:
- 编译产物 `dist/{build,dev}/mp-weixin/common/vendor.js` 里有 IIFE:
  ```js
  (()=>{
    const e=Aa;  // Aa 是 webpack 重命名后的 compile-time 变量
    let t={};
    if(e && 1===e.length) t=e[0], nd=nd.init(t), nd._isDefault=!0;
    else {
      // 警告 + 把 nd.* (uniCloud.*) 全换成 reject Promise 的 stub
    }
  })()
  ```
- CLI 编译时 `Aa` 是 undefined (HBuilderX GUI 会注入 pre-baked 配置, 见 #19)
- 注入脚本在 IIFE 前插入:
  ```js
  /* SchoolBuzzMate uniCloud.init injection */
  var Aa=[{provider:"aliyun",spaceId:"...",clientSecret:"..."}];
  ```
- 这样 IIFE 看到 `e.length===1`, 走 `nd.init(t)` 正确分支, `nd._isDefault=true`

**用法**:
```bash
# 默认 build 产物
pnpm run build:mp-weixin   # 已自动链上 inject

# dev 模式手动跑一次
pnpm run dev:mp-weixin &
sleep 12 && node scripts/inject-unicloud-init.mjs dist/dev/mp-weixin
```

**配置来源优先级**:
1. 环境变量 `UNICLOUD_PROVIDER` / `UNICLOUD_SPACE_ID` / `UNICLOUD_CLIENT_SECRET`(推荐, 不写到 manifest.json 避免泄露)
2. `src/manifest.json` 的 `uniCloud` 块(回退)

**已知边界**:
- 注入位置是 `vendor.js` 文件里 `(()=>{const e=Aa;` 这个特征串的第一个匹配位置
- 如果 uni-app 新版把 `Aa` 重命名, 脚本会报 "找不到 IIFE 标记" — 此时要更新 MARKER 字符串
- 幂等: 有 `/* SchoolBuzzMate uniCloud.init injection */` 哨兵字符串, 重跑不重复注入
- clientSecret 是敏感凭证, 强烈建议从 env 走; 如果用 manifest.json 兜底, 应该轮换 clientSecret 见 CHANGELOG.md 097e71d

## 问题 25: M3 真机闭环标准流程(整合 #19-#28, 2026-07-20 修订 — 不再用 HBuilderX "运行")

按以下顺序执行可走通 WSL2 + 微信开发者工具全链路, **不再依赖 HBuilderX GUI**:

**一次性环境准备**:
1. WSL2 项目根加 `.npmrc`:
   ```ini
   node-linker=hoisted
   ```
2. `pnpm install`(让 node_modules 变真实目录)
3. `pnpm add -D @rollup/rollup-win32-x64-msvc@4.61.1 @esbuild/win32-x64@0.20.2`(给 Windows 端兼容备用, 即使不用 HBuilderX 跑也建议装着 — 防止有人重启 HBuilderX "运行")

**每次开发循环**:
1. WSL2 终端: `pnpm run dev:mp-weixin`(起监听, vite HMR)
2. 另开 WSL2 终端: `node scripts/inject-unicloud-init.mjs dist/dev/mp-weixin`(一次性注入 init, 重 build 后再跑)
3. Windows 侧打开 **微信开发者工具** → 导入项目 → `\\wsl.localhost\Ubuntu-24.04\home\SchoolBuzzProjects\SchoolBuzzMate-Uniapp\dist\dev\mp-weixin`
4. 微信开发者工具里走 M3 真机闭环流程: 发布→下单→支付→发货→确认收货→评价
5. 改代码: WSL2 终端自动 rebuild → 微信开发者工具自动 reload

**生产构建 + 审核**:
```bash
pnpm run build:mp-weixin       # 已链 inject, 产物无需手动跑
```
然后微信开发者工具导入 `dist/build/mp-weixin` → 上传。

**部署云函数**(独立环节):
```bash
bash scripts/deploy-cloud.sh         # 或 pnpm run deploy:cloud:sh
```

**HBuilderX 现在的角色**:
- 仅作为 IDE 编辑器用 (语法高亮、代码补全) — 也可以用 VSCode / Cursor 替代
- **绝对不要**用 HBuilderX "运行" / "发行" 功能 — 见 #28

## 问题 30: vite HMR 反复覆盖 vendor.js, 手动注入失效 — 长效守护进程方案 (2026-07-21)

**症状**:
- `pnpm run build:mp-weixin` 链 `inject-unicloud-init.mjs` 自动注入成功 (单次 build 无 HMR)
- 但 `pnpm run dev:mp-weixin` 启 vite dev server 后, **用户改 src 文件 → vite HMR 重建 vendor.js → 之前的注入被覆盖 → 微信开发者工具重新报 "uni-app cli项目内使用uniCloud..." 警告**

**根因**:
- vite HMR 走 `@dcloudio/vite-plugin-uni` 自己的 emit pipeline, **不走** vite 标准 module graph
- vite plugin 的 `transform` hook 对源码 module 起效, **不拦截** uni-app 编译后 emit 的 vendor.js
- `renderChunk` / `writeBundle` / `closeBundle` 也只在 build mode (一次性编译) 触发, dev HMR 不走这些钩子
- 所以无论怎么写 vite plugin 都无法在 dev HMR 路径上自动注入

**正解**(独立守护进程 — 已验证可行):

### 方案 A: `scripts/unicloud-init-watcher.mjs` (推荐)
- 用 `node:fs.watch` + 800ms polling 双保险
  - fs.watch 在 atomic write (write tmp + rename) 时会漏事件
  - polling 兜底: 每 800ms stat 一次 vendor.js, size/mtime 变化则触发注入
- 任一信号触发 → 调用 `inject-unicloud-init.mjs <relDir>` 重新注入
- 注入脚本本身幂等(哨兵字符串 + size/mtime 缓存), 放心反复触发

**用法**:
```bash
# 终端 1 (后台守护, 一次启, 一直跑)
pnpm run watch:unicloud

# 终端 2 (正常 dev)
pnpm run dev:mp-weixin
```
守护进程会自动检测 `dist/{build,dev}/mp-weixin/common/vendor.js` 的创建/修改, 跑 `inject-unicloud-init.mjs` 重新注入。每次 vite HMR rebuild 后 0.5-1 秒内自动补注入, 微信开发者工具永远不会看到未注入的 vendor.js。

**已验证场景**:
- ✅ `dist/dev` 不存在 → 守护进程启动时 poll, 文件出现后立即注入
- ✅ vite 首次 build → polling 检测到 size 变化 → 注入 → vendor.js 大小变化 → 再次注入(防 lastSize 误判, 第二次会因哨兵命中跳过)
- ✅ HMR rebuild → fs.watch fire → 立即注入

### 方案 B: vite plugin `vite-plugin-unicloud-init.js` (兜底, 对 dev 无效)
- 已在 `vite.config.ts` 注册
- `transform` hook 仅拦截源码 module, 不拦截 uni-app 编译后的 vendor.js
- 对 dev 模式无效, 但保留无害, 未来 uni-app 改变 emit 流程后可能起作用

**已知坑**(修过的):
- ❌ 第一版 watcher 的 regex `(dist\/(?:build|dev)\/mp-weixin)` 把 `/common` 截断了 → 注入路径少了一段 → existsSync 永远 false → polling 看起来没工作
- ✅ 修: regex 提取仅用于日志展示, 实际路径用 `resolve(d, 'vendor.js')` 拼装 (d 是完整目录路径)

**清单**:
- 新增 `scripts/unicloud-init-watcher.mjs`(守护进程主体)
- 新增 `vite-plugin-unicloud-init.js` + `.d.ts`(兜底)
- 更新 `vite.config.ts`(注册 plugin)
- 更新 `package.json` 加 `watch:unicloud` 脚本

## 问题 31: vendor.js 顶层 const O 冲突 — 注入策略必须改为改写 IIFE 内部 (2026-07-22)

**症状**:
- 早期方案 (#29/#30) 在 vendor.js 顶层加 `var Aa = [...]; var O = [...]` 试图覆盖 webpack 的 free variable
- 用户在微信开发者工具报 `Error: file: common/vendor.js unknown: Unexpected token (11169:48)`, `app.js 错误: module 'common/vendor.js' is not defined`

**根因**(三个叠加 bug):
1. **位置错位** — webpack 把 IIFE 链写在嵌套作用域里, 看起来是模块顶层, 实际是某个内部函数体. 在 marker 之前注入 = 落到内部函数体内 = 语法错乱 (`var Aa = ...;` 后跟着 `}();` 闭合外层 IIFE, 但我们的 `var` 已经把这个 `}` 提前消耗了)
2. **const 重复声明** — vendor.js 在 line 8558 已经 `const b = true, E = "...", O = T("[]") || []`, 顶层有 `const O`. 在 module strict 模式下, `var O` + `const O` 同名冲突 → `SyntaxError: Identifier 'O' has already been declared`
3. **`"use strict"` 时序** — 如果把注入放在 `"use strict";` 之前, 注入行本身在非 strict 模式, 但 IIFE 在 strict, 跨模式的 const 重声明同样失败

**正解**(综合三种修法):
1. **锚点改成 IIFE 内部** — marker 从 `(() => {\n  const e2 = O;` 切, 这样注入位置天然在 IIFE 内部
2. **不注入新变量, 直接改写 IIFE 里的赋值** — 把 `const e2 = O;` 改成 `const e2 = __UNICLOUD_CFG__;`, 把 `const e = Aa;` 改成 `const e = __UNICLOUD_CFG__;`
3. **在 `"use strict";` 之后, 用唯一名字 `var __UNICLOUD_CFG__ = [...];` 注入** — 用 `var` (允许重复声明) + 唯一名 (避开任何已存在的变量), 放在 strict 之后避免跨模式问题

**位置**:
```js
// 1) 在 "use strict"; 之后立即注入 (lines ~3)
"use strict";
var __UNICLOUD_CFG__ = [{provider:"aliyun", spaceId:"...", clientSecret:"..."}];

// 2) 把 IIFE 里的赋值从 = O / = Aa 改成 = __UNICLOUD_CFG__ (line ~11173)
(() => {
  const e2 = __UNICLOUD_CFG__;   // ← 现在 length=1, 走 nd.init(t) 正确分支
  ...
})()
```

**为什么不用 var Aa / var O**:
- vendor.js 顶层 `const O` 已经声明(让 webpack 的自由变量有兜底 = `T("[]") || []`)
- 任何 `var O` 在 module strict 模式下都触发 `already declared`
- 选 `__UNICLOUD_CFG__` (独特下划线包裹) 是因为 webpack terser 几乎不会输出这么长的标识符, 100% 不冲突

**清单**:
- 改 `scripts/inject-unicloud-init.mjs`:
  - 删除 `var Aa / var O` 注入
  - 改为 `"use strict";` 之后注入 `var __UNICLOUD_CFG__ = [...];`
  - IIFE 字符串替换: `(()=>{const e=Aa;` → `(()=>{const e=__UNICLOUD_CFG__;` 和 `(() => {\n  const e2 = O;` → `(() => {\n  const e2 = __UNICLOUD_CFG__;`
- 验证 `node --check dist/dev/mp-weixin/common/vendor.js` 通过 (0 错误)
- 验证 HMR rebuild 后 watcher 自动重注入仍能产出合法 vendor.js

**踩过的弯路**(沉淀):
- ❌ 把 marker 锚点放在 `}();` 的 `}` 上 → 注入位置在 IIFE 体内
- ❌ 用 `var O` 试图覆盖 webpack free variable → `const O` 冲突
- ❌ 注入在 `"use strict";` 之前 → 跨模式问题
- ❌ 用 acorn 之类的语法验证 `node --check` 报错 → 注意 webpack 输出的 vendor.js 自带重复 `_export_sfc` 等 const (uni-app 设计如此), 只有注入本身的 const 重声明才是我们的错

## 问题 32: Git commit 误用 root@hxp-qc7.localdomain + Co-Authored-By: Claude footer (2026-07-23)

**症状**:
- WSL2 Ubuntu 24.04 容器内跑 `git commit` 后, GitHub collaborators 视图显示新 commit 作者是 `root <root@hxp-qc7.localdomain>`, 而不是真实身份 `PaxonHuang <quenchkidney@outlook.com>`
- 部分 commit message 末尾自动追加 `Co-Authored-By: Claude <noreply@anthropic.com>`

**根因**:
1. **git global identity 没设**: WSL2 容器开新 session 时, 全局 `user.name`/`user.email` 是空, git 退回宿主默认值 `root@hxp-qc7.localdomain`. 11 个 commit (37d7840 ~ 25ce6c6) 全部中招
2. **AI 协作 footer**: Claude Code / Cursor / Codex 等 AI 工具自动在 commit 末尾加 `Co-Authored-By: ... <noreply@anthropic.com>`, 用户没主动加但工具注入, 4 个 commit 中招

**预防**:
- ✅ 在容器/新 session 里提交前, 先验证 `git config user.email` 输出 `quenchkidney@outlook.com`; 否则 `git config --global user.name "PaxonHuang" && git config --global user.email "quenchkidney@outlook.com"`
- ✅ `.gitconfig` 加 `[commit] template = ~/.gitmessage` + 默认模板不含 `Co-Authored-By:` 段
- ✅ Claude Code `~/.claude/settings.json` 全局关闭 AI commit footer (如果工具支持)
- ✅ 提交后立即跑 `git log -1 --format='%an <%ae> | %s'` 自检

**修复流程**(已经走过的, 直接复用):
1. **备份**: `git branch backup/before-author-fix-$(date +%F)`, 防止 rebase 翻车
2. **抓原 dates**: `git log --reverse --format='%s|%aI|%cI' <good-parent>..backup/... > /tmp/orig_dates.txt`
3. **逐 commit 修正**:
   ```bash
   GIT_SEQUENCE_EDITOR='sed -i -e "s/^pick /edit /"' git rebase -i <good-parent>
   while rebase in progress; do
     GIT_AUTHOR_DATE="$adate" GIT_COMMITTER_DATE="$cdate" \
     GIT_AUTHOR_NAME="PaxonHuang" GIT_AUTHOR_EMAIL="quenchkidney@outlook.com" \
     GIT_COMMITTER_NAME="PaxonHuang" GIT_COMMITTER_EMAIL="quenchkidney@outlook.com" \
       git commit --amend --author="PaxonHuang <quenchkidney@outlook.com>" --no-edit --no-verify
     GIT_EDITOR=true git rebase --continue
   done
   ```
   - ⚠️ **`git commit --amend` 不读 `GIT_AUTHOR_*` env vars** — 必须用 `--author="Name <email>"` 标志
   - ⚠️ **`%s` 不一定只是 subject** — 如果 commit message 把 subject/body 拼成一行 (旧 sed 折叠过换行), `%s` 会返回整段; 用 `git log -1 --format=%B | head -1` 取 subject 才稳
4. **force push**: `git -c http.version=HTTP/1.1 push --force-with-lease origin <branch>` (走 HTTP/1.1 防 #17 HTTP/2 reset)
5. **验证**:
   ```bash
   gh api repos/PaxonHuang/SchoolBuzzMate-Uniapp/commits?sha=<branch>&per_page=15 \
     --jq '.[] | select(.commit.author.email == "root@hxp-qc7.localdomain") | .sha'
   gh api repos/PaxonHuang/SchoolBuzzMate-Uniapp/commits?sha=<branch>&per_page=15 \
     --jq '.[] | select(.commit.message | test("Co-Authored-By:.*Claude")) | .sha'
   ```
   两条 query 都应返回空。

**关联**:
- 修复脚本: `/tmp/fix-author-v3.sh` (backup: `/tmp/fix-author.sh`, `/tmp/fix-author-v2.sh`)
- 备份分支: `backup/before-author-fix-2026-07-23` (1 周后删)
- 同样的坑在 EchoGlove 项目也踩过 (2026-07-23 filter-branch fix), 互相印证这是反复出现的运维盲点
- 全局记忆文件: `~/.claude/projects/-home-SchoolBuzzProjects-SchoolBuzzMate-Uniapp/memory/git-identity-discipline.md` + `~/.claude/projects/-home-EchoGloveHugeProjects/memory/git-identity-discipline.md`

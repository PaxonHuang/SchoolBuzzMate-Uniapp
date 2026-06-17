# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# SchoolBuzzMate (校趣闪搭)

校园社交交易平台 - 二手交易、社交互动、营销活动

## 技术栈

- **前端**: UniApp + Vue3 + TypeScript + Vite5 + Pinia + UnoCSS + wot-design-uni
- **后端 MVP**: UniCloud (阿里云) + uni-id + uni-pay
- **后端成熟期**: Spring Boot → Spring Cloud (通过 API 抽象层无缝迁移)
- **目标平台**: 微信小程序 (主) + H5 + APP

## 常用命令

```powershell
# 安装依赖（强制使用 pnpm，preinstall hook 会阻止 npm/yarn）
pnpm install

# H5 开发
pnpm run dev:h5

# 微信小程序开发（主目标平台）
pnpm run dev:mp-weixin

# 生产构建
pnpm run build:mp-weixin

# 类型检查
pnpm run type-check

# ESLint
pnpm run lint
pnpm run lint:fix

# 一键启动开发环境（Windows）
.\scripts\dev.ps1 -Platform mp-weixin
```

模式变体：`:test` / `:prod` 后缀切换环境（读取 `env/.env.{mode}`）。

## ⚠️ 必须在 Windows + Node v22 下用 CLI，不要用 HBuilderX

HBuilderX 在 Windows + Node.js v22 下存在 ESM 路径 bug：
```
Error [ERR_UNSUPPORTED_ESM_URL_SCHEME]: Only URLs with a scheme in: file, data, and node are supported...
Received protocol 'e:'
```

**推荐工作流程：**
1. 终端运行 `pnpm run dev:mp-weixin` 启动编译监听
2. 打开微信开发者工具，导入 `dist/dev/mp-weixin` 目录
3. 修改代码后自动差量编译，微信开发者工具自动刷新

## 微信小程序 / 云服务配置

- **小程序 AppID**: `wxbc1260ebbefc26f6`
- **UniApp AppID**: `__UNI__8802791`
- **UniCloud 平台**: 阿里云
- **UniCloud SpaceID**: `mp-c3e590c7-e8f1-4877-95c5-346ba36e296c`
- **Dev server**: `0.0.0.0:9420`

## 关键架构

### API 抽象层 — 前后端迁移的"解耦点"

`src/api/*.ts` 是有意保持极薄的封装层。所有函数都通过 `callCloudFunction(name, action, params)` 调用 UniCloud：
```ts
// src/api/unicloud.ts
export async function callCloudFunction<T>(name, action, params = {}): Promise<T>
```

**目的**：MVP 阶段用 UniCloud，成熟期切到 Spring Boot 时，只需在 `src/api/` 下替换实现，**不改业务代码**。新增功能时永远走 `src/api/`，不要在页面里直接调 `uniCloud.callFunction`。

### 三表用户模型（易踩坑）

- `uni-id-users` — uni-id 管理的账户表（存 token、nickname、avatar 等）
- `school_users` — 学校扩展表（学号、学院、学生证、is_verified、信用分 100、余额）
- `products.seller_id` — ⚠️ **指向 `school_users._id`，不是 `uni-id-users._id`**

云函数里要拿当前用户的 `schoolUser._id`，需要先 `db.collection('school_users').where({ user_id: context.UNIID_USER._id }).get()`。所有商品所有权校验都用此规则（参见 `product-co/index.obj.js`）。

### 云函数路由模式（统一约定）

每个云函数都采用 `ACTIONS` map + `action` 参数分发：
```js
// uniCloud-aliyun/cloudfunctions/<name>-co/index.obj.js
const ACTIONS = {
  getList: async (params, context) => { ... },
  create: async (params, context) => { ... },
}
exports.main = async (event, context) => {
  const { action, params = {} } = event
  if (!ACTIONS[action]) return { code: -1, msg: `未知操作: ${action}` }
  try {
    return { code: 0, msg: 'success', data: await ACTIONS[action](params, context) }
  } catch (e) {
    return { code: -1, msg: e.message || '操作失败' }
  }
}
```

文件名用 `.obj.js` 后缀（DCloud 的对象式云函数）。新增 action 时同步在 `src/api/<name>.ts` 加对应函数，类型从 `src/types/<name>.ts` 导入。

### 权限校验公共模块

`uniCloud-aliyun/cloudfunctions/common/auth.js` 暴露三个守卫：
- `requireAuth(context)` — 必须登录
- `requireVerified(context)` — 必须通过学生认证（自动加载 `schoolUser`）
- `requireOwner(context, collection, docId, ownerField)` — 必须为资源所有者

目前 `user-co`/`school-co` 没有完全使用，需要时按 `product-co/index.obj.js` 中手动校验的方式引入。

### 前端架构

- **主包** `src/pages/` — 4 个 tabbar 页（首页/发布/消息/我的）+ 商品详情页
- **分包** `src/pages-core/` — 登录/学校选择（在 `pages.config.ts` 的 `subPackages` 配置）
- **Pinia store**（`src/store/`）— `user` 和 `school`，使用 `pinia-plugin-persistedstate` 的 `pick` 选择性持久化（不要存敏感临时态）
- **类型** `src/types/` — 与云函数返回结构对齐，新增字段前后端同步

### 商品状态机

`products.status`：`0` 下架（软删除）｜ `1` 上架（默认）｜ `2` 已售。
发布时 `status=1`，删除走软删除（status=0），不直接 `remove()`。

### 商品分类 / 成色常量

`src/types/product.ts` 已导出 `CATEGORY_OPTIONS`、`CONDITION_OPTIONS` — UI 直接引用，不要在页面里重写。

## 分阶段实施

| 阶段 | 状态 | 说明 |
|------|------|------|
| M0: 环境就绪 | ✅ | 项目骨架+文档 |
| M1: 用户系统 | ✅ | 登录+认证+学校 |
| M2: 商品系统 | ✅ | 商品发布/列表/详情/搜索 |
| M3: 交易核心 | 📋 | 订单+支付 |
| M4: MVP上线 | 📋 | 审核+发布 |

## 相关文档

位于同级目录 `../SchoolBuzzDocs/`：
- `SOP-SPEC-PLAN.md` — 完整技术规划
- `PROGRESS.md` — 开发进度

## 开发注意事项

- 所有云函数返回统一 `{ code, msg, data }`，前端 `callCloudFunction` 自动抛错当 `code !== 0`，业务代码只需 `try/catch` 拿 `error.message`。
- 列表分页默认 `size=10`，最大 50（云函数中硬编码 `Math.min(params.size || 10, 50)`）。
- 发布商品前必须通过学生认证（`product-co/create` 会校验）。
- 上传走 `src/api/upload.ts`，底层调 `uniCloud.uploadFile`，按目录分类（`schoolbuzz/`、`student-cards/`、`avatars/`）。
# 架构深度笔记 (M3 截止 2026-07-05)

## 三表用户模型 (易踩坑核心)

| 表 | 存什么 | 谁生成 |
|----|--------|--------|
| `uni-id-users` | uni-id 账户: token, nickname, avatar, mobile, wx_openid | uni-id 框架 |
| `school_users` | 学校扩展: student_no, college, major, grade, student_card, is_verified, credit_score (默认 100), balance | 我们 |
| `products.seller_id` | ⚠️ **指向 `school_users._id`** (不是 uni-id._id!) | 我们 |

**重要陷阱**:
- 云函数里 `context.UNIID_USER._id` 是 `uni-id-users._id`, **不能** 直接用作 `products.seller_id`
- 正确做法: 先查 `school_users` 拿 `schoolUser._id` 再用
- 代码模式: `db.collection('school_users').where({ user_id: context.UNIID_USER._id }).get()` → `schoolUser._id`
- `user-co.getUserStats` 历史上踩过这个坑 (commit `086a4bd` 已修)

## API 抽象层

**所有云函数调用走 `src/api/unicloud.ts` 的 `callCloudFunction`**:

```ts
export async function callCloudFunction<T>(
  name: string, action: string, params: Record<string, any> = {}
): Promise<T>
```

- 自动 throw 当 `code !== 0` (前端只需 `try/catch` 拿 `error.message`)
- 业务页面**永远不要**直接调 `uniCloud.callFunction`
- MVP UniCloud → 成熟期 Spring Boot 时只换 `src/api/` 实现, 业务代码不动

## 云函数路由模式

每个云函数 `index.obj.js`:
```js
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

**新增 action 流程**:
1. 在 `ACTIONS` 加 `xxx: async (params, context) => { ... }`
2. 在 `src/api/<name>.ts` 加对应导出函数 (调 `callCloudFunction('<name>', 'xxx', params)`)
3. 在 `src/types/<name>.ts` 加/补类型 (跟 cloud 返回结构对齐)
4. (新页面/状态机改) 在 schema 加字段, **前后端同步**

## 权限校验公共模块

`uniCloud-aliyun/cloudfunctions/common/auth.js` 暴露:
- `requireAuth(context)` — 必须登录
- `requireVerified(context)` — 必须通过学生认证 (自动加载 schoolUser)
- `requireOwner(context, collection, docId, ownerField)` — 必须为资源所有者

**当前使用情况**:
- `product-co` / `order-co` / `favorites-co` / `comment-co` 已统一用 `getSchoolUser(context)` 助手函数手动校验
- `user-co` / `school-co` 还没完全用, 需要时按 `product-co` 模式引入

## 商品状态机 (重要)

`products.status`:
- `0` 下架 (软删除, **不直接 remove**)
- `1` 上架 (默认, 发布即此状态)
- `2` 已售 (订单 confirm 时由 order-co 写入)

## 项目目录结构

```
src/
├─ api/           # 薄封装层, 永远走这里
│  ├─ unicloud.ts  # 通用 callCloudFunction + uploadFile
│  ├─ auth.ts, user.ts, school.ts (M1)
│  ├─ product.ts (M2)
│  ├─ order.ts, favorite.ts, comment.ts (M3)
├─ types/         # TS 类型, 前后端对齐
│  ├─ api.ts (通用 ApiResponse / PaginatedData)
│  ├─ user.ts, product.ts, order.ts, comment.ts
├─ store/         # Pinia
│  ├─ user.ts, school.ts (用 persistedstate 的 pick 选择性持久化)
├─ pages/         # 主包 (4 tabbar + 详情页)
├─ pages-core/    # 分包 (登录, 学校选择, 在 pages.config.ts 的 subPackages 配置)
├─ pages/order/, pages/product/favorites.vue (M3 新增, 在主包)
└─ uniCloud-aliyun/
   ├─ cloudfunctions/
   │  ├─ common/auth.js, common/uni-config-center/uni-id/
   │  ├─ user-co/, school-co/ (M1)
   │  ├─ product-co/ (M2)
   │  ├─ order-co/, favorites-co/, comment-co/ (M3)
   └─ database/  # schema.json (products, orders, school_users, comments, ...)
```

## 关键 schema 字段

| 表 | 字段 | 说明 |
|----|------|------|
| products | seller_id | school_users._id |
| products | status | 0/1/2 (下架/上架/已售) |
| orders | order_no | `SJ + yyyyMMddHHmmss + 6位随机` (uniCloud 同步用, 不能改) |
| orders | status | 0/1/2/3/4/5 (待支付/待发货/待收货/已完成/已取消/退款) |
| orders | product_snapshot | 锁定的商品快照 (title/price/images/...), 防商品改后订单错位 |
| orders | status_log[] | 每次状态变更追加一条 |
| orders | address? | 仅 express 模式有 |
| comments | rating | 1-5 整数 |
| comments | anonymous | bool, 对非本人显示"匿名用户" |

## 不变式 (改代码前先想)

- 任何商品所有权校验都基于 `school_users._id` (不是 uni-id._id)
- 任何云函数改动都要同步: types (前端) + API (调用) + 页面 (使用)
- 任何字段增删要: schema.json 改 + types/*.ts 改 + 现有查询/返回同步
- 状态机不允许跳级 (e.g. 0→3 不行, 必须 0→1→2→3)
- 商品永远软删除 (status=0), 不要 `.remove()`

## 参考文件清单 (按热度)

改云函数结构看 → `uniCloud-aliyun/cloudfunctions/product-co/index.obj.js`
改订单流程看 → `uniCloud-aliyun/cloudfunctions/order-co/index.obj.js`
改收藏/评价逻辑看 → `uniCloud-aliyun/cloudfunctions/favorites-co/index.obj.js` + `comment-co/`
改前端调用方式看 → `src/api/unicloud.ts` (通用), `<具体>.ts` (业务)
改类型看 → `src/types/product.ts`, `order.ts`, `comment.ts`
# 编码约定 (来自 M3 实践, 2026-07-05)

## TypeScript / Vue

### 类型定义

- 类型放 `src/types/*.ts`, 与云函数返回结构**严格对齐**
- 包装类型 vs 内嵌类型: 当 cloud function 返回 `{order: {...}, role, buyer, seller}` 时, 前端类型应该是 `interface OrderDetail { order: OrderBase; role; buyer; seller }`, **不要**让 `OrderDetail extends OrderBase` (会引起 `.order` 访问失败)

### API 层

```ts
// src/api/<name>.ts
import { callCloudFunction } from './unicloud'
import type { FooParams, FooResult } from '@/types/foo'

export function fooAction(params: FooParams): Promise<FooResult> {
  return callCloudFunction<FooResult>('foo-co', 'action', params)
}
```

- 永远 `callCloudFunction` 走, 不在页面直接 `uniCloud.callFunction`
- 入参和返回都用 `src/types` 里定义的接口, 不要 `any`

### Vue 页面

- 用 `<script setup lang="ts">` + Composition API
- onLoad/onShow/onPullDownRefresh/onReachBottom 等生命周期从 `@dcloudio/uni-app` 导入
- 数字不依赖 viewport (用 rpx 固定), letter-spacing 永远 0
- 文案 `class="i-carbon-xxx"` 用 iconify 的 carbon 图标集

## 云函数 (.obj.js)

### 文件结构

```
uniCloud-aliyun/cloudfunctions/<name>-co/
├─ index.obj.js      # 主入口, ACTIONS map + main
├─ package.json      # dependencies + cloudfunction-config + triggers
```

### index.obj.js 模板

```js
'use strict'

const db = uniCloud.database()
const dbCmd = db.command

// 助手函数 (放 ACTIONS 之前)
async function getSchoolUser(context) {
  const userId = context.UNIID_USER && context.UNIID_USER._id
  if (!userId) throw new Error('请先登录')
  const res = await db.collection('school_users').where({ user_id: userId }).get()
  if (!res.data || res.data.length === 0) throw new Error('请先完成学生认证')
  return { userId, schoolUser: res.data[0] }
}

async function resolveUsers(buyerId, sellerId) {
  // ... 解析 nickname/avatar/school_name
}

const ACTIONS = {
  getList: async (params, context) => { /* ... */ },
  getDetail: async (params, context) => { /* ... */ },
  create: async (params, context) => { /* ... */ },
}

exports.main = async (event, context) => {
  const { action, params = {} } = event
  if (!ACTIONS[action]) return { code: -1, msg: '未知操作: ' + action }
  try {
    const data = await ACTIONS[action](params, context)
    return { code: 0, msg: 'success', data }
  } catch (error) {
    console.error('[<name>-co.' + action + ']', error)
    return { code: -1, msg: error.message || '操作失败' }
  }
}
```

### package.json 模板

```json
{
  "name": "<name>-co",
  "version": "1.0.0",
  "main": "index.obj.js",
  "dependencies": {},
  "extensions": { "uni-cloud-jql": {} },
  "cloudfunction-config": {
    "concurrency": 10,
    "memorySize": 256,
    "timeout": 10,
    "triggers": []
  }
}
```

需要定时任务的: `"triggers": [{"name": "xxx", "type": "timer", "config": "0 0 * * * *"}]` (cron 表达式, 秒级, 6 位)

### 关键模式

1. **权限校验**: 每个 action 第一行 `const { schoolUser } = await getSchoolUser(context)`, 不需要登录的 (e.g. timeoutScan) 跳过
2. **跨表 join**: school_users + uni-id-users + schools 三表 join, 写一个 resolveUsers/resolveSellersMap 助手复用
3. **状态变更**: 构造新 `status_log` 数组 (`.concat([新一条]))`, 跟订单一起 `update`
4. **错误处理**: throw new Error('...'), 外层 main 捕获并返回 `{code: -1, msg: error.message}`
5. **参数校验**: 必填字段 if (!xxx) throw; 枚举/范围校验 if (xxx < 1 || xxx > 5) throw
6. **时间**: `new Date()` 直接用, 序列化为字符串在 client 端 dayjs 处理
7. **dbCmd.inc**: 计数器 (like_count, view_count) 用 `dbCmd.inc(1)` / `dbCmd.inc(-1)`, 不要先读后写

## 数据库 schema (database/*.schema.json)

```json
{
  "bsonType": "object",
  "required": ["field1", "field2"],
  "permission": { "create": false, "read": true, "update": false, "delete": false },
  "properties": {
    "_id": { "description": "..." },
    "field1": { "bsonType": "string", "title": "...", "maxLength": 100 },
    "field2": { "bsonType": "int", "defaultValue": 0 }
  }
}
```

- **永远把所有写权限设为 false**, 强制走云函数 (不能绕过)
- enum 字段列出所有允许值 (`category`, `condition`, `status`)
- 外键字段加 `foreignKey` 提示关系
- enum 值与前端 `src/types/*.ts` 里的类型 union 一一对应

## 命名约定

| 类型 | 命名 | 示例 |
|------|------|------|
| 云函数 | `<domain>-co` | `product-co`, `order-co` |
| 云函数 action | 动词 (单数) 或 getXxx | `create`, `getList`, `toggleLike` |
| API 函数 | 同 action 名 | `createProduct`, `getProductDetail` |
| 页面文件 | kebab-case 多级目录 | `pages/order/list.vue`, `pages/order/comment/index.vue` |
| 类型接口 | PascalCase | `ProductDetail`, `OrderListItem` |
| 类型枚举 | `<Domain>Status` 或 PascalCase 字符串字面量 union | `OrderStatus`, `TradeMethod` |
| 数据库表 | 复数名词 | `products`, `orders`, `school_users` (下划线) |

## 错误信息

- 中文, 用户可读 (前端 uni.showToast 直接展示)
- 不暴露技术细节 (e.g. "uni-id 校验失败" 不好, "登录已过期, 请重新登录" 好)
- 长度 < 30 字

## 提交规范

- 一个 commit 一个逻辑单元
- 标题格式: `feat(<scope>): ...` / `fix(<scope>): ...` / `chore(<scope>): ...` / `docs: ...`
- 标题 < 72 字符
- body 多行, 第一行简短总结, 后面 bullet 列出改了什么 + 为什么

## 文件命名陷阱 (M3 踩过)

- ❌ `pages/order/comment.vue` — 主包 + 单层目录, auto-import 可能找不到
- ✅ `pages/order/comment/index.vue` — 子目录 + index.vue, 路由 `/pages/order/comment`
- 之前 `order/list.vue` 跟 `order/comment/index.vue` 是两种风格, 建议统一用子目录 (避免和未来 `order/list/detail.vue` 冲突)
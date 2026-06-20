# 校趣闪搭 (SchoolBuzzMate)

> 校园社交交易平台 — 二手交易、社交互动、营销活动

一款面向在校大学生的二手交易与社交小程序。基于 UniApp + UniCloud 构建，初期采用云函数无服务器架构，成熟期可无缝迁移到 Spring Boot 微服务。

## 项目亮点哈哈

- 🎯 **三表用户模型** — uni-id 账户 + 学校扩展 + 商品所有权通过 `school_users._id` 关联
- 🏫 **校园闭环** — 学校维度的商品隔离、信用分体系、学生证强制认证
- 🛒 **完整商品系统** — 发布/列表/详情/搜索/点赞/上下架，支持图片、分类、成色、交易方式
- 🔌 **API 抽象层** — 业务代码与后端实现解耦，云函数 → Spring Boot 无侵入迁移
- 📦 **分包加载** — `pages-core` 独立分包，首屏体积优化

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | UniApp 3 + Vue 3 + TypeScript + Vite 5 |
| 状态管理 | Pinia + pinia-plugin-persistedstate |
| UI 组件 | wot-design-uni + UnoCSS (iconify icons) |
| 列表/分页 | z-paging |
| 时间处理 | dayjs |
| 后端（当前） | UniCloud 阿里云 + uni-id |
| 后端（计划） | Spring Boot → Spring Cloud |
| 目标平台 | 微信小程序（主）、H5、APP |

## 快速开始

### 环境要求

- Node.js ≥ 20
- pnpm ≥ 9（项目强制锁定 pnpm，`preinstall` hook 会阻止使用 npm/yarn）
- 微信开发者工具（用于小程序预览）

### 安装与启动

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务
pnpm run dev:mp-weixin    # 微信小程序（主目标）
pnpm run dev:h5           # H5 调试

# 3. 微信小程序：把 dist/dev/mp-weixin 导入微信开发者工具
```

模式变体：`:test` / `:prod` 后缀切换环境配置（读取 `env/.env.{mode}`）。

### Windows 一键脚本

```powershell
.\scripts\dev.ps1 -Platform mp-weixin   # mp-weixin | h5 | both
```

### ⚠️ 不要使用 HBuilderX

HBuilderX 在 Windows + Node.js v22 下存在 ESM loader 兼容 bug（`Received protocol 'e:'`）。本项目以 CLI 为唯一开发方式。

## 项目结构

```
SchoolBuzzUniAPP/
├── src/
│   ├── pages/                  # 主包页面（tabbar）
│   │   ├── index/              # 首页（商品瀑布流 + 分类筛选）
│   │   ├── product/            # 商品详情
│   │   ├── publish/            # 发布商品
│   │   ├── message/            # 消息中心
│   │   └── user/               # 个人中心 / 资料 / 认证 / 设置
│   ├── pages-core/             # 分包（登录、学校选择）
│   │   └── login/
│   ├── api/                    # ★ API 抽象层（迁移解耦点）
│   │   ├── unicloud.ts         # callCloudFunction / uploadFile 封装
│   │   ├── auth.ts             # 登录/登出
│   │   ├── user.ts             # 资料/认证/统计
│   │   ├── school.ts           # 学校列表/统计
│   │   ├── product.ts          # 商品 CRUD/搜索/点赞
│   │   └── upload.ts           # 文件上传（头像/学生证）
│   ├── store/                  # Pinia 状态（user / school）
│   ├── types/                  # TypeScript 类型（user / product / api）
│   ├── style/                  # 全局样式
│   └── tabbar/                 # tabbar 配置
│
├── uniCloud-aliyun/            # ★ 阿里云 UniCloud
│   ├── cloudfunctions/
│   │   ├── user-co/            # 用户服务云函数
│   │   ├── school-co/          # 学校服务云函数
│   │   ├── product-co/         # 商品服务云函数（M2 已完成）
│   │   └── common/
│   │       ├── auth.js         # 权限守卫：requireAuth / requireVerified / requireOwner
│   │       └── uni-config-center/uni-id/   # uni-id 配置（含微信 AppID/Secret）
│   └── database/               # 集合 schema
│       ├── schools.schema.json
│       ├── school_users.schema.json
│       └── products.schema.json
│
├── scripts/                    # 一键启动脚本（Windows PowerShell）
├── env/                        # 环境变量配置
├── pages.config.ts             # 页面路由 + tabbar + easycom
├── manifest.config.ts          # 小程序/UniCloud manifest
├── vite.config.ts              # Vite + uni-helper 插件链
└── package.json
```

## 核心架构

### API 抽象层

`src/api/*.ts` 是迁移 Spring Boot 的"解耦点"。所有函数都通过统一封装调用：

```ts
// src/api/unicloud.ts
export async function callCloudFunction<T>(
  name: string,        // 云函数名，如 'product-co'
  action: string,      // 路由 action，如 'getList'
  params: object = {}
): Promise<T>
```

云函数侧统一返回 `{ code: 0, msg: 'success', data: T }`，前端自动在 `code !== 0` 时抛错，业务代码只需 `try/catch`。

### 三表用户模型

```
uni-id-users  ←──uni-id 管理──→  token / nickname / avatar
      │
      │  user_id (1:1)
      ▼
school_users  ───is_verified=false 需审核──→  student_no / credit_score / balance
      │
      │  seller_id (= school_users._id)
      ▼
products
```

⚠️ **关键**：商品的 `seller_id` 指向 `school_users._id`（不是 `uni-id-users._id`），云函数的所有权校验都按此约定。

### 云函数路由模式

每个云函数采用统一的 `ACTIONS` map + `action` 分发：

```js
// uniCloud-aliyun/cloudfunctions/product-co/index.obj.js
const ACTIONS = {
  getList:  async (params, context) => { /* 分页查询 */ },
  getDetail: async (params, context) => { /* 详情 + 浏览数 +1 */ },
  create:   async (params, context) => { /* 校验 + 写入 */ },
  // ...
}
exports.main = async (event, context) => {
  const { action, params = {} } = event
  if (!ACTIONS[action]) return { code: -1, msg: `未知操作: ${action}` }
  try {
    return { code: 0, data: await ACTIONS[action](params, context) }
  } catch (e) {
    return { code: -1, msg: e.message }
  }
}
```

文件名 `.obj.js` 是 DCloud 的对象式云函数，新增 action 时同步在 `src/api/` 加对应函数。

### 商品状态机

```
   发布 ──→ status=1 (上架)
                │
                ├── 卖家下架 ──→ status=0
                ├── 软删除 ──→ status=0
                └── 已售 ──→ status=2   (M3 交易)
```

## 常用命令

```bash
# 开发
pnpm run dev:mp-weixin          # 微信小程序开发
pnpm run dev:h5                 # H5 开发
pnpm run dev:mp-weixin:prod     # 生产模式

# 构建
pnpm run build:mp-weixin
pnpm run build:h5

# 质量
pnpm run type-check             # vue-tsc --noEmit
pnpm run lint                   # ESLint
pnpm run lint:fix
```

## 云服务 / 小程序 配置

| 项 | 值 |
|---|---|
| 小程序 AppID | `wxbc1260ebbefc26f6` |
| UniApp AppID | `__UNI__8802791` |
| UniCloud 平台 | 阿里云 |
| UniCloud SpaceID | `mp-c3e590c7-e8f1-4877-95c5-346ba36e296c` |

⚠️ `uniCloud-aliyun/cloudfunctions/common/uni-config-center/uni-id/config.json` 包含微信 AppSecret 等敏感信息，**不要提交到公开仓库**。

## 进度

| 阶段 | 状态 | 说明 |
|---|---|---|
| M0: 环境就绪 | ✅ | 项目骨架 + 文档 |
| M1: 用户系统 | ✅ | 微信登录 + 学生认证 + 学校 |
| M2: 商品系统 | ✅ | 发布/列表/详情/搜索/点赞 |
| M3: 交易核心 | 📋 | 订单 + 支付（uni-pay） |
| M4: MVP 上线 | 📋 | 审核 + 发布 |

详见同级目录 `../SchoolBuzzDocs/PROGRESS.md`。

## 开发规范

1. **新增 API** — 在 `src/api/<feature>.ts` 加函数，从 `src/types/<feature>.ts` 导入类型，调用 `callCloudFunction('<feature>-co', 'action', params)`。
2. **新增云函数** — 在 `uniCloud-aliyun/cloudfunctions/<feature>-co/index.obj.js` 加 `ACTIONS[name]`，统一异常处理。
3. **新增页面** — `src/pages/`（主包）或 `src/pages-core/`（分包），路由自动从文件路径生成。
4. **类型先行** — 先在 `src/types/` 定义接口，前后端对齐数据结构。
5. **ESLint + Husky** — 提交前 `lint-staged` 自动修复。

## 相关文档

- `CLAUDE.md` — 给 Claude Code 的项目指引（架构决策、开发规范）
- `SOP-SPEC-PLAN.md` — 完整技术规划（位于 `../SchoolBuzzDocs/`）
- `PROGRESS.md` — 详细开发进度（位于 `../SchoolBuzzDocs/`）

## License

MIT
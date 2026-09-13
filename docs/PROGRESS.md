# SchoolBuzzMate 开发进度

> 最后更新：2026-07-17

## 阶段概览

| 阶段 | 状态 | 开始日期 | 完成日期 |
|------|------|----------|----------|
| M0: 环境就绪 | ✅ 完成 | 2026-06-03 | 2026-06-03 |
| M1: 用户系统 | ✅ 完成 | 2026-06-05 | 2026-06-05 |
| M2: 商品系统 | ✅ 完成 | 2026-06-05 | 2026-07-03 |
| M3: 交易核心 | ✅ 代码+部署完成, 真机闭环待跑 | 2026-07-03 | 2026-07-17 (云端) |
| M4: MVP上线 | 📋 待开始 | - | - |

> 开发环境: 2026-07-15 起从 Windows 迁移到 WSL2 Ubuntu 24.04 (混合工作流: 代码/编译在 WSL2, 微信开发者工具+HBuilderX 留 Windows)。详见项目 `docs/WSL2-MIGRATION.md`。

---

## M0: 环境就绪 ✅

- [x] SOP-SPEC-PLAN 文档合并（v1 + v2 → v3）
- [x] 项目目录重整（SchoolBuzzUniAPP → SchoolBuzzDocs）
- [x] 新建 SchoolBuzzUniApp 实现目录
- [x] UniCloud 服务空间配置
- [x] CLI 工具链配置（HBuilderX + 微信DevTools）
- [x] Git 远端仓库配置

---

## M1: 用户系统 ✅

### 完成内容

#### 项目基础
- [x] 项目骨架初始化（基于 yudao-ui-admin-uniapp 模板）
- [x] package.json, vite.config.ts, pages.config.ts, manifest.config.ts
- [x] tsconfig.json, uno.config.ts, .gitignore
- [x] env 环境变量配置（.env, .env.development, .env.production）
- [x] CLAUDE.md 项目指引文件

#### 类型系统
- [x] `src/types/user.ts` — UserProfile, SchoolUser, School, LoginParams, VerifyStudentParams
- [x] `src/types/api.ts` — ApiResponse, PaginatedData, ApiMode

#### Pinia Store
- [x] `src/store/index.ts` — Pinia 初始化
- [x] `src/store/user.ts` — 用户状态（login, fetchProfile, logout, verify）
- [x] `src/store/school.ts` — 学校状态（fetchSchools, switchSchool）

#### API 抽象层
- [x] `src/api/unicloud.ts` — UniCloud 通用调用封装
- [x] `src/api/auth.ts` — 登录/登出/获取当前用户
- [x] `src/api/user.ts` — 用户资料/更新/认证
- [x] `src/api/school.ts` — 学校列表/统计
- [x] `src/api/upload.ts` — 文件上传

#### 云函数
- [x] `user-co/index.obj.js` — getProfile, updateProfile, verifyStudent, getUserStats
- [x] `school-co/index.obj.js` — getSchoolList, getSchoolStats
- [x] `common/auth.js` — requireAuth, requireVerified, requireOwner
- [x] `uni-config-center/uni-id/config.json` — uni-id 微信登录配置

#### 数据库 Schema
- [x] `school_users.schema.json` — 学校用户扩展信息
- [x] `schools.schema.json` — 学校信息

#### 页面
- [x] `pages-core/login/index.vue` — 微信一键登录页
- [x] `pages-core/login/select-school.vue` — 学校选择页
- [x] `pages/user/index.vue` — 个人中心
- [x] `pages/user/profile.vue` — 资料编辑
- [x] `pages/user/verify.vue` — 学生认证（上传学生证+表单）
- [x] `pages/user/settings.vue` — 设置页
- [x] `pages/index/index.vue` — 首页骨架（含学校切换、商品列表占位）
- [x] `pages/index/search.vue` — 搜索页骨架
- [x] `pages/publish/index.vue` — 发布页骨架
- [x] `pages/message/index.vue` — 消息页骨架

---

## M2: 商品系统 ✅

- [x] product-co 云函数（create, getList, getDetail, update, delete, search, toggleLike, 上下架）
- [x] 商品 API 层（`src/api/product.ts`）+ 类型（`src/types/product.ts`, 含 CATEGORY/CONDITION 常量）
- [x] 商品发布页（real 上传 + 云函数对接）、列表页（分页+筛选+搜索）、详情页
- [x] product_likes / favorites schema（后补）
- [x] 商品状态机: 0 下架(软删) / 1 上架 / 2 已售

---

## M3: 交易核心 ✅ (代码+部署完成, 真机闭环待跑)

代码已完成并提交 (见项目 `CHANGELOG.md` 详细分解):

- [x] 订单核心 `order-co`: create/getList/getDetail/pay/cancel/ship/confirm/payNotify/timeoutScan
- [x] 支付: 接入 uni-pay 微信支付 (createOrder→prepay→requestPayment, payNotify 回调校验)
- [x] 超时清理: timeoutScan 定时器 (每小时), status=0 且 >24h → 4
- [x] 信用分: confirm 双方 +1, cancel 发起方 -2, timeoutScan 超时方 -1
- [x] 评价系统: `comment-co` (create/getByProduct/getBySeller) + comments schema + 评价页 + 商品页评价列表
- [x] E2E 脚本: `scripts/e2e-check.{ps1,sh}` + `pnpm e2e:check` / `e2e:check:sh`
- [x] type-check 0 错误
- [x] WSL2 环境 `pnpm install` + `pnpm type-check` + `pnpm run build:mp-weixin` 通过 (2026-07-17)
- [x] **云函数 + schema 已部署到 `mp-c3e590c7-...`** (2026-07-17, 经 HBuilderX CLI)
  - 6 个云函数: user-co / school-co / product-co / **order-co** / **favorites-co** / **comment-co**
  - 2 个公共模块: uni-pay / uni-config-center
  - 7 个 schema: schools / school_users / products / orders / product_likes / favorites / **comments**
- [x] 重写 deploy-cloud.{ps1,sh} 用正确 CLI 语法 (`cloud functions --upload X --prj <name> --provider aliyun --name <res>`)

### 仍待完成 (真机)
- [ ] 真机闭环: 发布→下单→支付→发货/自提→确认→评价 (仅 mp-weixin, 需用户在微信开发者工具导入 `\\wsl.localhost\...\dist\build\mp-weixin`)
- [ ] 微信支付商户号 / API 密钥配置 (uni-config-center/uni-pay) — M4 强依赖

---

## M4: MVP上线 📋 (待开始)

- [ ] 小程序审核 + 提审 + 性能优化
- [ ] 微信支付商户号 / API 密钥配置 (uni-config-center/uni-pay)
- [ ] 真机闭环端到端测试 (发布→下单→支付→发货→确认→评价)
- [ ] 私信/IM、退款流程等 (M4/M5 范围)
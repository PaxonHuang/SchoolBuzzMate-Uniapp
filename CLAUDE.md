# SchoolBuzzMate (校趣闪搭)

校园社交交易平台 - 二手交易、社交互动、营销活动

## 技术栈

- **前端**: UniApp + Vue3 + TypeScript + Vite5 + Pinia + UnoCSS + wot-design-uni
- **后端 MVP**: UniCloud (阿里云) + uni-id + uni-pay
- **后端成熟期**: Spring Boot → Spring Cloud (通过 API 抽象层无缝迁移)
- **目标平台**: 微信小程序 (主) + H5 + APP

## 快速开始

```powershell
# 安装依赖
pnpm install

# H5 开发
pnpm run dev:h5

# 微信小程序开发
pnpm run dev:mp-weixin

# 微信小程序构建
pnpm run build:mp-weixin
```

## 项目结构

```
src/
├── pages/              # 主包页面
│   ├── index/          # 首页（商品列表）
│   ├── publish/        # 发布商品
│   ├── message/        # 消息中心
│   └── user/           # 个人中心 + 认证 + 设置
├── pages-core/         # 核心分包（登录、选学校）
│   └── login/          # 登录页 + 学校选择
├── api/                # API 抽象层
│   ├── auth.ts         # 认证 API
│   ├── user.ts         # 用户 API
│   ├── school.ts       # 学校 API
│   ├── upload.ts       # 上传 API
│   └── unicloud.ts     # UniCloud 调用封装
├── store/              # Pinia 状态管理
│   ├── user.ts         # 用户 store
│   └── school.ts       # 学校 store
├── types/              # TypeScript 类型
│   ├── user.ts         # 用户类型
│   └── api.ts          # API 通用类型
├── style/              # 全局样式
└── tabbar/             # Tabbar 配置

uniCloud-aliyun/
├── cloudfunctions/
│   ├── user-co/        # 用户服务云函数
│   ├── school-co/      # 学校服务云函数
│   ├── product-co/     # 商品服务（待开发）
│   └── common/         # 公共模块
│       ├── auth.js     # 权限验证
│       └── uni-config-center/uni-id/  # uni-id 配置
└── database/
    ├── school_users.schema.json
    └── schools.schema.json
```

## 微信小程序配置

- **AppID**: `wxbc1260ebbefc26f6`
- **UniApp AppID**: `__UNI__8802791`

## 云服务

- **平台**: UniCloud 阿里云
- **SpaceID**: `mp-c3e590c7-e8f1-4877-95c5-346ba36e296c`

## 分阶段实施

| 阶段 | 状态 | 说明 |
|------|------|------|
| M0: 环境就绪 | ✅ | 项目骨架+文档 |
| M1: 用户系统 | ✅ | 登录+认证+学校 |
| M2: 商品系统 | 📋 | 商品发布/列表/详情 |
| M3: 交易核心 | 📋 | 订单+支付 |
| M4: MVP上线 | 📋 | 审核+发布 |

## 相关文档

位于同级目录 `SchoolBuzzDocs/`：
- `SOP-SPEC-PLAN.md` — 完整技术规划
- `PROGRESS.md` — 开发进度
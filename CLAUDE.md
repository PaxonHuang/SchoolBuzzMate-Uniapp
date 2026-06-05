# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About This Directory

This directory (`SchoolBuzzUniAPP`) is the **planning and documentation hub** for the SchoolBuzzMate project. It does not contain source code. The actual implementations live in sibling directories:

- **`../SchoolBuzzUniAppX/SchoolBuzzUniappXuts/SchoolBuzzMate/`** — Primary implementation: UniApp X (Vue 3 + UTS), Pinia, UniCloud, brutalist design system. Has its own `CLAUDE.md`.
- **`../SchoolBuzzTaro/campus-mini/`** — Alternative implementation: Taro 3.6 + React 18 + TypeScript, NutUI, Zustand, Spring Boot backend. Has its own `CLAUDE.md`.

## Project: SchoolBuzzMate (校趣闪搭)

A campus social trading platform for university students. Core features: second-hand trading, social interaction (comments, likes, follows, DMs), and marketing (coupons, points, group buying).

### Key Decision (2026-06-03)

**Base repository:** yudao-mall-uniapp (https://github.com/yudaocode/yudao-mall-uniapp) — frontend reuse
**MVP backend:** UniCloud (uni-id + uni-pay + cloud functions)
**Mature backend:** Spring Boot → Spring Cloud (migration via unified API layer)
**Strategy:** Reuse yudao-mall-uniapp pages/components, rewrite backend to UniCloud cloud functions, keep API signatures identical for seamless later migration.

### Reference Repositories (for engineering practices, not direct base)
- **JeecgUniapp** — TypeScript + Pinia + UnoCSS + ESLint/Prettier/Husky patterns
- **yudao-ui-admin-uniapp** — TypeScript + Pinia + UnoCSS + wot-design-uni patterns

### Tech Stack (MVP)

- UniApp + Vue 3 + TypeScript + Vite 5 + Pinia + wot-design-uni + UnoCSS
- Backend: UniCloud (Alibaba Cloud) with uni-id (auth) and uni-pay (payments)
- Target platforms: WeChat Mini Program (primary), H5, APP (later)

### Phased Approach

| Phase | Timeline | Backend | Scope |
|-------|----------|---------|-------|
| MVP | 6-8 weeks | UniCloud (serverless) | Single school, core trading |
| Feature completion | 3-6 months | UniCloud | 3-5 schools, marketing/social |
| Architecture upgrade | 6-12 months | Spring Boot/Cloud migration | 50+ schools |
| Scale | 12+ months | Microservices | 100+ schools |

### Database Collections (12)

`products`, `orders`, `comments`, `favorites`, `messages`, `coupons`, `user_coupons`, `points_log`, `groups`, `group_users`, `follows`, `reports`

### Cloud Function Groups (7)

`product-co`, `order-co`, `payment-co`, `social-co`, `marketing-co`, `school-co`, `admin-co`

## Development Tools

### CLI Tools
- **HBuilderX CLI:** `E:\HbuilderX\HBuilderX\cli.exe` — project management, cloud deploy
- **WeChat DevTools CLI:** `E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat` — preview, upload, auto-test
- **WeChat DevTools HTTP API:** `http://localhost:<port>/v2/` — programmatic control

### Key Commands
```powershell
# Dev
pnpm run dev:h5              # H5 dev mode
pnpm run dev:mp-weixin        # WeChat Mini Program dev
pnpm run build:mp-weixin      # WeChat Mini Program build

# WeChat CLI
$WX="E:\Tencent微信web开发者工具\微信web开发者工具\cli.bat"
& $WX open --project ".\dist\dev\mp-weixin"
& $WX preview --project ".\dist\dev\mp-weixin"
& $WX upload --project ".\dist\build\mp-weixin" -v "1.0.0" -d "desc"
```

## Key Documents

- **`SOP-SPEC-PLAN-v2.md`** (NEW - 2026-06-03) — Complete v2 SOP/Spec/Plan based on yudao-mall-uniapp reuse strategy
- **`SOP-SPEC-PLAN.md`** (v1.0, 2025-01) — Original plan, kept for reference
- **`CLAUDE-CODE-PROMPTS.md`** (1608 lines) — Ready-to-execute Claude Code prompts

## When Working on Implementation

Go to the appropriate sibling project and read its `CLAUDE.md` for build commands, architecture details, and constraints. The UniApp X project is the primary implementation aligned with the SOP-SPEC-PLAN in this directory.
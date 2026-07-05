# Codex 会话来源索引

本文件是给 Claude Code 的历史压缩索引, 不是原始聊天记录。迁移原则: 保留项目决策、当前计划、踩坑教训和验证状态；丢弃重复催促、工具噪声、失败尝试细节和所有敏感凭证。

## 主要相关会话

| 会话 ID | 价值 | 迁移结果 |
|--------|------|----------|
| `019f288d-7cd8-7fc3-9614-d5d9910d14a3` | SchoolBuzzMate M3 active goal, 8 步子目标, 后续多轮继续执行 | 已压缩进 `current-handoff.md`, `m3-transaction-core.md`, `pending-actions.md` |
| `019f312b-7d03-7f20-9ffd-01ec11c2f2f2` | 用户首次明确要求迁移 Codex 历史到 Claude Code | 已落实为当前 `.claude/memory/` 结构 |
| `019f3135-8971-7be1-b190-ec3167fcc639` | 重复迁移请求, 无新增技术事实 | 只记录为迁移动机, 不导入内容 |
| `019f3139-1b11-72f0-a12f-167aa9bf6dd0` | 重复迁移请求和短消息 | 不导入, 避免噪声 |
| `019f313f-f667-71b0-a0d1-971f6a1b2652` | 重复迁移请求 | 不导入 |
| `019f3152-6acb-7752-9bf5-e5718dd2c00a` | 重复迁移请求 | 不导入 |
| `019f315e-57f9-7bd3-9d1c-7b270cde13fd` | 重复迁移请求 | 不导入 |
| `019f3161-5823-78d0-aba5-f29a8a125684` | 当前迁移请求 | 已压缩进本文件和 `current-handoff.md` |

## 从历史中提炼出的核心目标

用户的阶段性目标是: 完成 SchoolBuzzMate M3 交易核心并达到可上线质量。

M3 子目标:

1. 修完 type-check 错误并证明 my code 0 错误。
2. 部署 `order-co` 和 `favorites-co` 到 UniCloud。
3. 用 `uni-pay` 微信支付替换 `order-co.pay` MVP 占位。
4. 增加订单 24h 超时自动取消 scheduled trigger。
5. 增加信用分自动调整。
6. 增加评价系统: `comment-co`, 评价页, 商品详情评价列表。
7. 跑通 mp-weixin 端到端冒烟: 发布 -> 下单 -> 支付 -> 发货 -> 确认 -> 评价。
8. commit 干净并同步 `../SchoolBuzzDocs/PROGRESS.md`, 然后进入 M4。

当前实现进度和风险以 `current-handoff.md` 为准。

## 刻意排除的会话

以下会话不是 SchoolBuzzMate 当前交接的一部分, 除非用户明确切换项目, 否则不要引用:

- NJTS Astro 博客站 / Cloudflare Pages 部署和改版会话。
- STM32F103C8T6 PWM 电机考试项目会话。
- Unity / PlatformIO / ESP32 / 其他历史项目会话。
- 插件、MCP、技能安装等与 SchoolBuzzMate 无关的命令会话。

## 敏感信息处理

历史聊天里出现过第三方平台 token/PAT/API key 类内容。迁移时一律不写入仓库、不复述、不用于任何后续请求。Claude Code 后续如果需要凭证, 必须让用户通过安全方式重新提供或确认本机环境变量/平台配置。

## 如何继续查证

1. 先看当前文件: `CHANGELOG.md`, `CLAUDE.md`, `.claude/memory/*.md`, `package.json`, `scripts/e2e-check.ps1`。
2. 再看 git: `git log --oneline -12`, `git status --short`, 相关文件 diff。
3. 只有在当前文件无法解释问题时, 才回查 Codex 原始 session。不要把原文复制进项目。

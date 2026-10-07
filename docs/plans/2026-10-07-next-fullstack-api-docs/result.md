# 需求执行记录：Next.js 全栈 API 接口文档

计划：`docs/plans/2026-10-07-next-fullstack-api-docs/plan.md`

- [x] 阶段 1：执行 `git fetch --prune origin` 并将 `develop` 快进到 `origin/main@4d5882b`；清理本轮未交付的独立 NestJS 服务、代理、依赖和生成物。并行 Solana SDK 安装改动迁入新规范要求的独立计划目录并保留。验证：`git rev-list --left-right --count HEAD...origin/main` 为 `0 0`；当前差异不含 `backend/` 或 Next 代理。
- [x] 阶段 2：完成 `docs/API.md` 的 Next.js 全栈目录、统一协议以及系统、认证、入驻、店铺、通道、工作流、订单、会话、知识、财务、报表、设置、隐私与 Webhook 契约。T2：逐项对照 PRD 八大页面和 6 步入驻；首版范围有接口，冲突或后续功能在第 12 节明确延后。
- [x] 阶段 3：完成统一响应/错误、OTP 会话、RBAC、cursor、幂等、版本并发、异步操作，以及消息/会话/支付/工作流状态机。T3：文档明确跨租户 404、退订/付款/接管停发、Webhook 原始字节验签、重复/乱序处理、confirmed 不入账和 finalized 后原子一次入账。
- [x] 阶段 4：更新 `AGENTS.md`、`docs/PRD.md` v1.2 与 `README.md`，统一为 Next.js 16 App Router 全栈架构。三路 Luna 只读审阅分别覆盖 PRD/UI 端点映射、Next.js 16 运行时边界、权限/Webhook/Solana 财务安全；根据审阅补入 Server Components 直接访问服务层、Node runtime、Cookie/CSRF、durable worker、人工退款和延后项。
- [x] 阶段 5：执行文档结构脚本、相对链接检查、接口唯一性检查、AGENTS 行数、`git diff --check` 与 `pnpm install --frozen-lockfile`。实际：API 文档 574 行、15 个主章节、96 个唯一接口操作、0 重复；全部 Markdown 表格列数一致；相对链接全部存在；无 patch 标记；AGENTS 140 行；diff 与冻结安装退出 0。
- [x] MVP 验收：接口契约覆盖认证、入驻和八大工作台页面，明确 Next.js 全栈目录、角色、状态、Schema、Webhook、支付与延后项；PRD/AGENTS/README 口径一致。此次仅验证文档和依赖一致性，未实现或运行 API、数据库、真实消息、链上交易、UI E2E 或生产部署。

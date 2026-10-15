# 需求执行记录：让 Devnet 测试充值在线上跑通，并限制为已绑定商户的登录用户

计划：docs/plans/2026-10-15-enable-devnet-payment-production/plan.md

## 执行前基线（2026-10-15）

- 线上库（Neon `ep-falling-sky-b5fgcy67-pooler`，与本地 `.env` 的 `DATABASE_URL` 同一实例）现有表：`payment_candidates`、`payment_orders`、`payment_sessions`、`payment_transfers`、`test_credit_ledger`。
- `payment_sessions`=0、`payment_orders`=0、`test_credit_ledger`=0。
- 缺少认证/租户表：`users`、`tenants`、`memberships`、`sessions`、`otp_challenges` 均不存在。
- Vercel Production 应用变量（共 8 个）：`DATABASE_URL`、`NODE_ENV`（值 `development`，被 Vercel 忽略）、`PAYMENTS_ALLOW_LOCAL_SESSION`、`PAYMENTS_DEVNET_ALLOW_PRODUCTION`（空值，代码零引用）、`PAYMENTS_DEVNET_ENABLED`、`PAYMENT_APP_ORIGIN`（空值）、`SOLANA_RECIPIENT`、`SOLANA_RPC_URL`。
- 生产最新部署为 7 天前；本地 HEAD 为 `db7c4a5`。

## Checklist

- [ ] 阶段 1：执行主迁移 + 补齐 Vercel 环境变量。
  - 测试 T1：`pnpm db:migrate` 输出 `Database migrations are up to date.`；出现 `users`/`tenants`/`memberships`/`sessions`/`otp_challenges`/`schema_migrations`；原有 5 张 devnet 表仍在。
  - 测试 T2：线上 `POST /api/v1/auth/otp/request` 不再返回 `CAPABILITY_UNAVAILABLE`。
  - 预期：…；实际：…；遗留/下一步：…
- [ ] 阶段 2：接入 OTP 投递端点（**阻塞：等待需求方提供端点与 Bearer**）。
  - 测试 T3：真实收到验证码；`/api/v1/auth/otp/verify` 返回 200 并下发 session cookie。
- [ ] 阶段 3：商户租户。
  - 测试 T4：`POST /api/v1/tenants` 成功；`GET /api/v1/auth/session` 返回非空 `currentTenant`。
- [ ] 阶段 4：支付闸门改造 + 鉴权。
  - 测试 T5：未登录 `POST /api/v1/payments/session` 返回 401。
  - 测试 T6：已登录返回 200，`payment_sessions.tenant_id` = `actor.tenantId`。
  - 测试 T7：`pnpm lint`、`pnpm exec tsc --noEmit`、`pnpm test` 全绿。
- [ ] 阶段 5：线上端到端。
  - 测试 T8：线上完成一次真实 devnet 付款并在 finalized 后入账一次。
  - 测试 T9：重复回调不重复入账。
  - 测试 T10：错金额/错 mint 不增加额度。
- [ ] MVP 验收：见 plan.md §7。验收项、测试结果、剩余风险：…

## 未运行/受阻说明

- 仓库目前未安装测试框架，`pnpm test`（vitest）是否可用待确认；如不可用将记录为未运行并给出手工步骤。
- 阶段 2 依赖需求方提供 OTP 投递 HTTP 端点，未提供前无法完成登录验收。

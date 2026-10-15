# 需求执行记录：让 Devnet 测试充值在线上跑通，并限制为已绑定商户的登录用户

计划：docs/plans/2026-10-15-enable-devnet-payment-production/plan.md

## 执行前基线（2026-10-15）

- 线上库（Neon `ep-falling-sky-b5fgcy67-pooler`，与本地 `.env` 的 `DATABASE_URL` 同一实例）原有表：`payment_candidates`、`payment_orders`、`payment_sessions`、`payment_transfers`、`test_credit_ledger`（均为 0 行）。
- 缺少认证/租户表：`users`、`tenants`、`memberships`、`sessions`、`otp_challenges` 均不存在。
- Vercel Production 应用变量（8 个）：`DATABASE_URL`、`NODE_ENV`（值 `development`，被 Vercel 忽略）、`PAYMENTS_ALLOW_LOCAL_SESSION`、`PAYMENTS_DEVNET_ALLOW_PRODUCTION`（空值，代码零引用）、`PAYMENTS_DEVNET_ENABLED`、`PAYMENT_APP_ORIGIN`（空值）、`SOLANA_RECIPIENT`、`SOLANA_RPC_URL`。
- 生产最新部署为 7 天前；本地 HEAD 为 `db7c4a5`。
- 线上复现：`GET/POST /api/v1/payments/session` → `503 {"error":"支付服务暂不可用，请检查数据库、Devnet RPC 和服务端配置后重试；不会自动增加额度"}`。

## Checklist

- [x] 阶段 0：devnet 表去冲突。
  - 交付内容：`lib/server/payments/schema.sql`（`payment_orders`→`devnet_payment_orders`、`payment_candidates`→`devnet_payment_candidates`，含 FK 与索引引用及尾部 CHECK 约束名）、`lib/server/payments/repository.ts`（14 处）、`lib/server/payments/repository.test.ts`（4 处）。
  - 测试 T0a：`pnpm exec vitest run lib/server/payments lib/payments`；预期：改名后 devnet 仓储在 PGlite 上仍可用，schema 可重复执行；实际：8 文件 112 用例全部通过（`repository.test.ts` 在同一 PGlite 上执行 schema 两次）。
  - 测试 T0b：线上库 `ALTER TABLE payment_orders RENAME TO devnet_payment_orders`、`ALTER TABLE payment_candidates RENAME TO devnet_payment_candidates`、`ALTER INDEX payment_orders_pkey RENAME TO devnet_payment_orders_pkey`、`ALTER INDEX payment_candidates_pkey RENAME TO devnet_payment_candidates_pkey`；实际：执行成功，`pg_tables` 确认旧表名消失、新表名存在。
  - 补充结论：用探针实测确认 CHECK 约束名是**表级**唯一（允许跨表重名），而 PRIMARY KEY/UNIQUE 背后的索引名是**schema 级**唯一（`relation "probe_dup_pkey" already exists`）。因此必须重命名 `_pkey` 索引；遗留的 `payment_orders_reference_key`、`payment_orders_tenant_id_idempotency_key_key` 与 `0005` 的 `payment_orders_reference_unique`、`payment_orders_tenant_id_unique` 不重名，无需处理。
- [x] 阶段 1：执行主迁移 + 补齐 Vercel 环境变量。
  - 测试 T1：`node --env-file=.env --import tsx scripts/migrate.ts`；预期：输出 `Database migrations are up to date.`，认证表出现；实际：首次执行输出该文案，`0001~0005` 全部记入 `schema_migrations`，public schema 共 48 张表，`users`/`tenants`/`memberships`/`sessions`/`otp_challenges` 均已存在；devnet 三张原表 + 两张改名表 + 正式计费表 `payment_orders`/`payment_candidates`/`credit_ledger` 共存；二次执行同样输出 `Database migrations are up to date.`（幂等）。
  - 环境变量：向 Vercel Production 写入 `SESSION_SIGNING_KEY`、`CSRF_SIGNING_KEY`、`CREDENTIAL_ENCRYPTION_KEY`、`OTP_HMAC_KEY`、`APP_ALLOWED_ORIGINS`、`TRUST_PROXY_HEADERS`、`PAYMENT_APP_ORIGIN`（原为空串）、`PAYMENTS_DEVNET_ALLOW_PRODUCTION=true`（原为空串）；移除被 Vercel 忽略且误导的 `NODE_ENV`；移除代码已不再引用的 `PAYMENTS_ALLOW_LOCAL_SESSION`。`vercel env ls production` 已确认结果。
  - 测试 T2：线上 `POST /api/v1/auth/otp/request`；预期：不再返回 `CAPABILITY_UNAVAILABLE`；实际：**未执行** —— 生产仍是 7 天前的旧构建，需重新部署后才能验证。遗留/下一步：待授权部署后复验。
- [ ] 阶段 2：接入 OTP 投递端点（**阻塞：等待需求方提供端点与 Bearer**）。
  - 测试 T3：真实收到验证码；`/api/v1/auth/otp/verify` 返回 200 并下发 session cookie。未执行。
- [ ] 阶段 3：商户租户。
  - 测试 T4：`POST /api/v1/tenants` 成功；`GET /api/v1/auth/session` 返回非空 `currentTenant`。未执行。
- [x] 阶段 4：支付闸门改造 + 鉴权（代码完成，线上复验待部署）。
  - 交付内容：`lib/server/payments/config.ts`、`lib/server/payments/http.ts`、`lib/server/payments/sol-test/http.ts`、`app/api/v1/payments/{session,billing,orders,orders/[id]}/route.ts`、`lib/server/payments/http.test.ts`、`lib/server/payments/sol-test/http.test.ts`、`components/billing/billing-payments.tsx`、`components/billing/solana-pay-modal.tsx`、`README.md`。
  - 关键变更：生产闸门从无条件 `NODE_ENV === "production"` 改为显式 `PAYMENTS_DEVNET_ALLOW_PRODUCTION === "true"`（未设置时生产仍 fail-closed，devnet genesis 校验继续阻止主网）；移除 localhost hostname 白名单与 `PAYMENTS_ALLOW_LOCAL_SESSION`；`createLocalSession`/`tenantSession` 改为要求 `requireActor` 并把 `payment_sessions.tenant_id` 绑定到 `actor.tenantId`（不再铸造随机租户），且校验已存会话租户与当前 actor 租户一致；`paymentResponse` 现在把 `ApiError` 映射为其自身状态码（401/403 不再被吞成 503）；sol-test 入口同样要求登录。UI 文案由"需先配置 PostgreSQL/Devnet 收款地址/本地会话开关"改为"仅限已登录并绑定商户的账户"并引导至 `/login`。
  - 测试 T5/T6（单元层）：`lib/server/payments/http.test.ts` 新增/改写用例覆盖未登录（401）、无租户 membership（403）、生产未显式开权（抛错）、已开权可用、会话租户与 actor 租户不一致被拒、会话绑定 `actor.tenantId` 而非随机铸租户、原始 cookie 不参与查询参数；`lib/server/payments/sol-test/http.test.ts` 覆盖未登录 401 且不触达 RPC。实际：8 文件 114 用例全部通过。
  - 测试 T7：`pnpm lint`（0 error 0 warning）、`pnpm exec next typegen && pnpm exec tsc --noEmit`（OK）、`pnpm exec vitest run`（24 文件 261 用例全部通过）、`pnpm build`（exit 0，路由清单正常）。实际：全部通过。
- [ ] 阶段 5：线上端到端。测试 T8/T9/T10 均未执行，需先完成阶段 2/3 并部署。

- [ ] MVP 验收：见 plan.md §7。当前完成 §7 第 6 项（表名冲突解除，迁移可幂等重复执行）；第 1~5 项待阶段 2/3/5 与线上复验。

## 未运行/受阻说明

- **阶段 2 阻塞**：OTP 投递需要需求方提供外部 HTTP 端点（`POST`、Bearer 鉴权、JSON `{email, code, locale}`）与 Bearer 令牌。仓库未实现任何投递服务，`OTP_DELIVERY_ENDPOINT` 在本地 `.env` 中也为空值，未提供前无人能登录，支付入口无法验收。
- **部署未执行**：未获部署授权，且阶段 2 未完成时部署会让支付入口从"503 不可用"变为"需登录但仍不可用"。生产当前仍为 7 天前构建，本次所有代码改动尚未上线。
- **未在生产库写入测试数据**：阶段 3/5 的验收会在线上库产生真实 `users`/`tenants`/`memberships`/`payment_orders` 行，按 AGENTS.md "测试数据与生产数据隔离" 未擅自造测试商户，待需求方以其真实商户账号完成登录后验证。
- **E2E 未运行**：`pnpm exec playwright test` 未执行；现有 E2E 用例未覆盖新的登录前置条件，待阶段 5 一并处理。

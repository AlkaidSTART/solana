# 计划：让 Devnet 测试充值在线上跑通，并限制为已绑定商户的登录用户

## 1. 背景

线上站点 `https://solana-neon-ten.vercel.app` 的 `/console/billing` 无法发起支付，界面提示"请检查数据库、Devnet RPC 和服务端配置"，易被误读为环境变量缺失。

排查结论（已复现）：

- `GET/POST /api/v1/payments/session` 返回 503，文案来自 `lib/server/payments/http.ts` 的 `paymentResponse` 通用兜底分支，并非环境变量缺失。
- 真正原因：`lib/server/payments/config.ts:6` 与 `lib/server/payments/sol-test/http.ts:11` 都在解析任何环境变量之前先执行 `process.env.NODE_ENV === "production"` 硬禁。Vercel 生产/预览的 `NODE_ENV` 恒为 `production`（面板里设的 `NODE_ENV="development"` 被忽略），故必然命中。
- `lib/server/payments/http.ts` 的 `createLocalSession()` 另有一层 hostname 白名单，只允许 `localhost`/`127.0.0.1`，线上同样不可用。
- Vercel 上的 `PAYMENTS_DEVNET_ALLOW_PRODUCTION` 是仓库中零引用的死变量；`PAYMENT_APP_ORIGIN` 已创建但值为空串。
- 主数据库迁移从未在线上 Neon 执行：库中仅有 devnet 支付 5 张表，`users`/`tenants`/`memberships`/`sessions`/`otp_challenges` 全部不存在。
- 因此线上 OTP 登录返回 503，且即便补齐密钥也无表可用；`/console/billing` 之所以"能打开"，是因为 devnet 支付模块完全独立于主认证栈。
- 支付入口当前无 middleware、无鉴权，任何访客均可建立测试租户。

**执行前发现的表名冲突（阻塞项）**：`lib/server/db/migrations/0005_billing_solana.sql` 与 devnet 模块的 `lib/server/payments/schema.sql` 都要建 `payment_orders` 和 `payment_candidates`，且两套结构不兼容（devnet：`id uuid`/`network`/`reference`/`amount_atomic`，无外键；billing：`id text`/`environment`/`cluster`/`purpose`/`amount_minor`，外键指向 `tenants(id)`，并带结算触发器）。两张 devnet 表已存在于线上库中，而 `0005` 使用不带 `IF NOT EXISTS` 的 `CREATE TABLE`，会触发 `relation already exists`；由于 `applyMigrations` 将 `0001~0005` 包在单个事务内，整个迁移会回滚，认证表一张都建不出来。两张 devnet 表当前均为 0 行，改名数据安全。

需求方决定：补齐真实登录；支付入口限制为已绑定商户租户的登录用户；授权在主数据库执行迁移；`payment_orders`/`payment_candidates` 冲突采用**重命名 devnet 表**解决（不合并两套系统）；登录改用 **Neon Auth（Managed Better Auth）** 提供的 Email OTP 与 Social OAuth，不再自建 OTP 投递；授权立即部署到生产。

**登录方案改为 Neon Auth（2026-10-15 追加）**：Neon Auth 已在本项目端点启用（`NEON_AUTH_URL` 指向 `ep-falling-sky-b5fgcy67.neonauth...`），实测 `GET /ok` 返回 `{"ok":true}`、`POST /email-otp/send-verification-otp` 返回 `{"success":true}`。官方文档确认 Email OTP 与 Social OAuth（Google/GitHub/Vercel）均为受支持插件，且"OTP 生成与投递由托管服务自动处理，调用方无法也不需要自行投递"——因此原计划中"需求方必须提供 OTP 投递 HTTP 端点"这一阻塞项消除，`OTP_DELIVERY_ENDPOINT`/`OTP_DELIVERY_BEARER_TOKEN` 与 `lib/server/auth/otp-provider.ts` 的自建投递路径不再需要。

**已发现的登录界面假通道（安全阻塞）**：`components/auth/auth-card.tsx` 中 OTP 发送失败会回退提示硬编码演示码 `892104`，`executeOtpVerification` 在 `code === "892104"` 或演示邮箱时直接放行并跳转 `/console`；密码登录（`handleSubmitLogin` 的 password 分支）与注册（`handleSubmitRegister`）均为 `setTimeout` 假通过；此外还有"一键以演示商户身份直接进入控制台"按钮无鉴权跳转。这些路径必须处理，否则"仅限绑定商户"在产品层面不成立（API 层已收紧为 401，但这些界面会误导使用者）。

## 2. 目标

1. 在主数据库（线上 Neon）执行主迁移 `0001~0005`，使认证与租户栈可用。
2. 补齐线上所需环境变量，使 OTP 登录链路具备条件。
3. 将 devnet 支付闸门从"无条件按 `NODE_ENV` 禁用"改为显式开关，并挂到真实登录鉴权之后。
4. 使 `payment_sessions.tenant_id` 绑定到登录用户的 `actor.tenantId`，不再铸造随机租户。
5. 线上端到端跑通一次 devnet 测试充值。

## 3. MVP 范围

- 表名去冲突：将 devnet 模块的 `payment_orders` → `devnet_payment_orders`、`payment_candidates` → `devnet_payment_candidates`，同步 `lib/server/payments/schema.sql`、`lib/server/payments/repository.ts`、`lib/server/payments/repository.test.ts`，并在线上库执行 `ALTER TABLE ... RENAME TO` 及重命名随之遗留的 `_pkey` 索引（索引名是 schema 级唯一，不改会与 `0005` 的 `payment_orders_pkey` / `payment_candidates_pkey` 再次冲突）。devnet 另外三张表 `payment_sessions`/`payment_transfers`/`test_credit_ledger` 与 `0005` 无重名，保持不动。
- 迁移：`pnpm db:migrate` 对线上 Neon 执行 `lib/server/db/migrations/0001~0005`。
- 环境变量（Vercel Production）：`SESSION_SIGNING_KEY`、`CSRF_SIGNING_KEY`、`CREDENTIAL_ENCRYPTION_KEY`、`OTP_HMAC_KEY`、`APP_ALLOWED_ORIGINS`、`TRUST_PROXY_HEADERS`、`PAYMENT_APP_ORIGIN`、`PAYMENTS_DEVNET_ALLOW_PRODUCTION`；清理无效的 `NODE_ENV`。
- 代码：
  - `lib/server/payments/config.ts`：以 `PAYMENTS_DEVNET_ALLOW_PRODUCTION === "true"` 替代 `NODE_ENV` 硬禁，保留 devnet genesis 校验（主网不可达）。
  - `lib/server/payments/sol-test/http.ts`：同上。
  - `lib/server/payments/http.ts`：`createLocalSession` 改为要求登录 actor，并以 `actor.tenantId` 写入 `payment_sessions`；移除 localhost 白名单。
  - `app/api/v1/payments/**` 与 `app/api/v1/payments/sol-test/**` 各路由增加 `requireActor`。
  - `/console/billing`、`/console/billing/sol-test` 未登录时跳转 `/login`。
- OTP 投递：接入需求方提供的外部 HTTP 端点。

## 4. 非目标

- 不打开主网正式 USDC 计费。`lib/server/services/billing/config.ts` 的 `PAYMENT_SETTLEMENT_PIPELINE_IMPLEMENTED = false` 保持不动，`/api/v1/billing/payment-orders` 继续 fail-closed。
- 不实现 Neon Auth → 本地 session 的服务端换取。`app/auth/callback/page.tsx` 当前仅做客户端动画后跳转，本轮不修复该链路，登录只走 OTP。
- 不引入 Redis/BullMQ 常驻 worker。devnet 核验已由 `POST /api/v1/payments/orders/[id]` 在请求内调用 `reconcile()` 完成。
- 不改变 `test_credit_ledger` 语义，不使其产生正式服务权益。
- 不引入测试框架（仓库尚未安装，按 AGENTS.md 记录手工验收步骤）。

## 5. 风险与依赖

| 项 | 说明 | 处置 |
| --- | --- | --- |
| OTP 投递服务 | `OTP_DELIVERY_ENDPOINT` + Bearer，POST `{email, code, locale}`。仓库无实现，期望外部服务。**缺失则无人能登录。** | 需求方提供；未提供前阶段 2 阻塞 |
| 生产库写操作 | 迁移不可逆 | 已获授权；执行前记录当前表清单 |
| 公开域名 | 打开后仍可创建真实 devnet 交易 | 以登录+租户为门槛；主网硬禁不变 |
| 公共 RPC | `api.devnet.solana.com` 限流 | 保持默认；失败时页面提示重试，不重复付款 |
| `NODE_ENV` 被忽略 | 面板设置无效 | 移除该变量，代码不再依赖它 |

## 6. 阶段拆分与验证

- [ ] 阶段 0：devnet 表去冲突。
  - 测试 T0a：`pnpm test`（若可用）中 `lib/server/payments/repository.test.ts` 通过，证明改名后 devnet 仓储在 PGlite 上仍可用（schema 需仍可重复执行）。
  - 测试 T0b：线上库执行 `ALTER TABLE payment_orders RENAME TO devnet_payment_orders`、`ALTER TABLE payment_candidates RENAME TO devnet_payment_candidates`，并重命名遗留 `_pkey` 索引；查询 `information_schema.tables` 确认新表名存在、旧表名消失。
- [ ] 阶段 1：执行主迁移 + 补齐 Vercel 环境变量。
  - 测试 T1：`pnpm db:migrate` 输出 `Database migrations are up to date.`；`information_schema.tables` 出现 `users`/`tenants`/`memberships`/`sessions`/`otp_challenges`/`schema_migrations`；原有 5 张 devnet 表仍在。
  - 测试 T2：`POST /api/v1/auth/otp/request` 不再因密钥缺失返回 `CAPABILITY_UNAVAILABLE`（应推进到投递或投递未配置）。
- [ ] 阶段 2：接入 OTP 投递端点（依赖需求方提供）。
  - 测试 T3：真实收到 6 位验证码；`POST /api/v1/auth/otp/verify` 返回 200 并下发 session cookie。
- [ ] 阶段 3：商户租户。
  - 测试 T4：`POST /api/v1/tenants` 创建租户成功；`GET /api/v1/auth/session` 返回非空 `currentTenant`。
- [ ] 阶段 4：支付闸门改造 + 鉴权。
  - 测试 T5：未登录请求 `POST /api/v1/payments/session` 返回 401。
  - 测试 T6：已登录且已绑定租户请求返回 200，`payment_sessions.tenant_id` 等于 `actor.tenantId`。
  - 测试 T7：`pnpm lint`、`pnpm exec tsc --noEmit`、`pnpm test` 全绿。
- [ ] 阶段 5：线上端到端。
  - 测试 T8：线上创建报价 → 钱包（devnet）付款 → `POST /api/v1/payments/orders/[id]` 轮询 → 最终 `credited`，`test_credit_ledger` 恰好多出一行。
  - 测试 T9：对同一订单重复回调，不产生第二次入账。
  - 测试 T10：错金额/错 mint 的付款不增加额度。
- [ ] 阶段 6：接入 Neon Auth 服务端（Identity Provider）。
  - 依赖：新增 `@neondatabase/auth`（peerDeps 声明 `next >= 16.0.0`，与本仓库 Next `16.3.8` 兼容；替代方案为自建 OTP 投递服务，需额外运营邮件通道，故不采用）。
  - 交付：`lib/auth/server.ts`（`createNeonAuth({ baseUrl, cookies: { secret } })`）、`app/api/auth/[...path]/route.ts`（`auth.handler()` 代理）、新增环境变量 `NEON_AUTH_BASE_URL` 与随机生成的 `NEON_AUTH_COOKIE_SECRET`（≥32 字符）。
  - 测试 T11：`GET /api/auth/ok` 返回 `{"ok":true}`；`POST /api/auth/email-otp/send-verification-otp` 经代理返回 `{"success":true}`。
- [ ] 阶段 7：Neon Auth 身份 → 本地会话桥接。
  - 交付：服务端新增桥接路由，使用 `auth.getSession()` 读取 Neon 身份，按邮箱 upsert 本地 `users` 行，再调用既有 `issueSession` 下发本地 session + CSRF cookie，使 `requireActor`/租户/RBAC/计费全套保持不变（不替换本地会话体系）。
  - 测试 T12：Neon Auth 登录后调用桥接接口，能拿到本地 session cookie；随后 `GET /api/v1/auth/session` 返回该用户。
- [ ] 阶段 8：登录界面改造与假通道清除。
  - 交付：`components/auth/auth-card.tsx` 与 `components/auth/oauth-buttons.tsx` 改接 Neon Auth SDK（`authClient.emailOtp.sendVerificationOtp` / `authClient.signIn.emailOtp` / `authClient.signIn.social`），移除硬编码 `892104` 回退、密码/注册的 `setTimeout` 假通过与无鉴权演示按钮；`app/auth/callback/page.tsx` 的假成功动画替换为真实会话处理。
  - 测试 T13：错误验证码被拒；正确验证码可进入工作台；未登录访问 `/console/billing` 不再能建立会话。
- [ ] 阶段 9：线上端到端复验（阶段 5 的 T8/T9/T10）与 `result.md` 收尾。

## 7. 最终验收标准

1. 线上 `/console/billing` 对未登录访客拒绝访问，对已登录并绑定租户的商户可用。
2. 一次真实 devnet 付款在 finalized 后恰好入账一次，且账单页显示链上签名。
3. 重复回调、错金额、错 mint 均不增加额度。
4. `/api/v1/health` 中 `database` 为 `ok`，认证相关能力不再是 `unconfigured`。
5. 主网正式计费仍为关闭状态（`PAYMENT_SETTLEMENT_PIPELINE_IMPLEMENTED = false`）。
6. 表名冲突解除：`pnpm db:migrate` 可重复执行且始终成功，devnet 模块与正式计费系统各自持有互不重名的表。
7. `result.md` 与实际交付一致，未完成项保持未勾选。

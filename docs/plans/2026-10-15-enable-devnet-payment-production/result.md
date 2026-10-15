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
- [已被取代] 阶段 2：接入 OTP 投递端点 —— **方案变更**：改用 Neon Auth 托管 Email OTP，OTP 生成与投递由托管服务负责，原"自建投递端点"需求取消（详见阶段 6）。原测试 T3 改为阶段 6 的 T11 与阶段 7 的 T12。
- [已被取代] 阶段 3：商户租户。仍由既有 `POST /api/v1/tenants`（`requireWriteUser`）承担，无需新代码；验收改到阶段 7/9 一并验证（原测试 T4）。
- [x] 阶段 4：支付闸门改造 + 鉴权（代码完成，线上复验待部署）。
  - 交付内容：`lib/server/payments/config.ts`、`lib/server/payments/http.ts`、`lib/server/payments/sol-test/http.ts`、`app/api/v1/payments/{session,billing,orders,orders/[id]}/route.ts`、`lib/server/payments/http.test.ts`、`lib/server/payments/sol-test/http.test.ts`、`components/billing/billing-payments.tsx`、`components/billing/solana-pay-modal.tsx`、`README.md`。
  - 关键变更：生产闸门从无条件 `NODE_ENV === "production"` 改为显式 `PAYMENTS_DEVNET_ALLOW_PRODUCTION === "true"`（未设置时生产仍 fail-closed，devnet genesis 校验继续阻止主网）；移除 localhost hostname 白名单与 `PAYMENTS_ALLOW_LOCAL_SESSION`；`createLocalSession`/`tenantSession` 改为要求 `requireActor` 并把 `payment_sessions.tenant_id` 绑定到 `actor.tenantId`（不再铸造随机租户），且校验已存会话租户与当前 actor 租户一致；`paymentResponse` 现在把 `ApiError` 映射为其自身状态码（401/403 不再被吞成 503）；sol-test 入口同样要求登录。UI 文案由"需先配置 PostgreSQL/Devnet 收款地址/本地会话开关"改为"仅限已登录并绑定商户的账户"并引导至 `/login`。
  - 测试 T5/T6（单元层）：`lib/server/payments/http.test.ts` 新增/改写用例覆盖未登录（401）、无租户 membership（403）、生产未显式开权（抛错）、已开权可用、会话租户与 actor 租户不一致被拒、会话绑定 `actor.tenantId` 而非随机铸租户、原始 cookie 不参与查询参数；`lib/server/payments/sol-test/http.test.ts` 覆盖未登录 401 且不触达 RPC。实际：8 文件 114 用例全部通过。
  - 测试 T7：`pnpm lint`（0 error 0 warning）、`pnpm exec next typegen && pnpm exec tsc --noEmit`（OK）、`pnpm exec vitest run`（24 文件 261 用例全部通过）、`pnpm build`（exit 0，路由清单正常）。实际：全部通过。
- [已部署] 部署执行：`vercel --prod --yes` 两次，均成功并别名至 `https://solana-neon-ten.vercel.app`。第一次部署后线上行为验证：`GET/POST /api/v1/payments/session` 与 `POST /api/v1/payments/orders` 由 503 变为 `401 {"error":"Authentication is required"}`；`/api/v1/health` 的 `database` 为 `ok`。第二次部署含 Neon Auth 接线。

- [x] 阶段 6：接入 Neon Auth 服务端（Identity Provider）。
  - 交付内容：`lib/auth/server.ts`（惰性 `createNeonAuth({ baseUrl, cookies: { secret } })`，用 zod 校验而非非空断言，惰性化以免缺变量时构建失败）、`app/api/auth/[...path]/route.ts`（`auth.handler()` 的 GET/POST/PUT/DELETE/PATCH 代理）、依赖 `@neondatabase/auth@0.6.0-beta`（peerDeps 实测 `next >=16.0.0`，与本仓库 Next 16.3.8 匹配）、`pnpm-workspace.yaml` 将 pnpm 自动写入的占位值 `core-js: set this to true or false` 定为 `false`（core-js 的 postinstall 仅为赞助提示，不定值会使 `pnpm exec` 整体报错）。
  - 环境变量：`NEON_AUTH_BASE_URL`、`NEON_AUTH_COOKIE_SECRET`（`openssl rand -base64 32`，44 字符）写入本地 `.env`/`.env.local` 与 Vercel Production。
  - 测试 T11：线上 `GET /api/auth/ok` → `{"ok":true}` ✅；`GET /api/auth/get-session` → `null`（无会话，符合预期）✅；`POST /api/auth/email-otp/send-verification-otp` → **阻塞**，见下。
  - 验证：`pnpm exec tsc --noEmit` OK、`pnpm lint` 0 问题、`pnpm exec vitest run` 24 文件 261 用例全绿。

- [x] 阶段 7：Neon Auth 身份 → 本地会话桥接。
  - 交付内容：`lib/server/services/auth/neon-bridge.ts`（`issueSessionForNeonIdentity`：按 `email_hash` upsert 本地 `users` 行 → 读取其 active 租户 membership → 调用既有 `issueSessionInTransaction` 下发本地 session + CSRF cookie；签名密钥用 `isUsableKey` 类型守卫收窄而非非空断言；**恰好一个** active membership 时直接绑定该租户，多个则留空交由既有 `switch-tenant` 选择，服务端绝不猜测租户）、`app/api/v1/auth/neon/session/route.ts`（`neonAuth().getSession()` 取身份，无 Neon 会话则 401）、`lib/api/auth.ts` 新增 `establishNeonSession(locale)`。
  - 设计：不替换本地会话体系，Neon Auth 只负责身份，租户/RBAC/计费仍以本地 `sessions` 为唯一权威（与 AGENTS.md「认证会话决定租户」一致）。
  - 测试 T12：`tsc` 通过（含 `data?.user?.email` 形状校验）、`lint` 0 问题、`vitest run` 24 文件 261 用例全绿。线上端到端仍未验证（见阻塞项）。

- [x] 阶段 8：登录界面改造与假通道清除。
  - 交付内容：新增 `lib/auth/client.ts`（`createAuthClient()`）；`components/auth/auth-card.tsx` 的 OTP 发送改 `authClient.emailOtp.sendVerificationOtp`、OTP 校验改 `authClient.signIn.emailOtp`、密码登录改 `authClient.signIn.email`、注册改 `authClient.signUp.email`，成功后均调用 `establishNeonSession` 再跳转；`components/auth/oauth-buttons.tsx` 改 `authClient.signIn.social`（带绝对 `callbackURL`，此前手拼 URL 缺 Origin 处理）；`app/auth/callback/page.tsx` 的假成功动画改为真实调用 `establishNeonSession` 并把失败原因展示出来。
  - **已移除的假通道**：硬编码演示码 `892104` 及其放行分支、`msgOtpSentDemo`/`msgDemoSuccess`/`msgDemoLoaded` 文案、"填入演示账号"按钮与 `handleFillDemo`、"一键以演示商户身份直接进入控制台"按钮、密码与注册的 `setTimeout` 假通过、`challengeId` 状态。随之删除 `MOCK_DEMO_LOGIN_CREDENTIALS`（`mock/auth.ts` 整个文件、`mock/index.ts` 与 `mock/mock.test.ts` 的引用）—— 该常量已无任何产品代码使用。
  - 补充发现：`vitest.config.mts` 的 `include` 仅覆盖 `{lib,stores,components}/**/*.test.{ts,tsx}`，故 `mock/mock.test.ts` 与 `app/**` 下的测试从未被执行（261 的用例数与改动前后一致即源于此）。
  - 测试 T13：`pnpm exec vitest run` 24 文件 261 用例全绿、`pnpm lint` 0 问题、`pnpm exec next typegen && pnpm exec tsc --noEmit` OK、`pnpm build` exit 0。真实验证码收信与错误码拒绝的浏览器验收未执行（见阻塞项）。

- [ ] 阶段 9：线上端到端复验。未执行。

- [ ] MVP 验收：见 plan.md §7。已完成 §7 第 6 项（表名冲突解除，迁移可幂等重复执行）与线上 API 鉴权收紧；第 1~5 项待阶段 7/8/9。

## 阻塞项已解除：Neon Auth 受信域名的末尾斜杠（2026-10-15 已修复）

**现象**：`POST /api/auth/email-otp/send-verification-otp` 返回 `{"message":"Invalid origin","code":"INVALID_ORIGIN"}`。

**定位过程**：对照实测（同一请求分别打到线上代理与 Neon Auth 直连端点）显示带**任意** `Origin` 均为 `INVALID_ORIGIN`、不带 `Origin` 为 `success`，据此判断是受信域名未匹配。经 Neon API `GET /projects/{id}/branches/{id}/auth/domains` 查得白名单里**实际已存在**该域名，但值为：

```
https://solana-neon-ten.vercel.app/     ← 多了末尾斜杠
```

浏览器 `Origin` 头永远是 `https://solana-neon-ten.vercel.app`（RFC 中 Origin 不含路径，故不带尾斜杠），因此条目无法匹配。Neon 官方文档《Configure trusted domains》明确要求「include the protocol and omit trailing slashes」。

**根因**：**一个末尾斜杠**。与代码、Vercel 环境变量、数据库均无关。

**修复**：经 Neon API 操作该项目的 production 分支
- 项目 `wild-unit-87312534`（endpoint `ep-falling-sky-b5fgcy67`，与 `DATABASE_URL`/`NEON_AUTH_URL` 一致），分支 `br-delicate-star-b5jxykoc`。
- `POST /auth/domains`（body 需 `{"domain": "...", "auth_provider": "better_auth"}`）新增 `https://solana-neon-ten.vercel.app` 与 `https://*.alkaidstarts-projects.vercel.app`。
- `DELETE /auth/domains`（body 需 `{"auth_provider":"better_auth","domains":[{"domain":"..."}]}`）删除带尾斜杠的旧条目。

**修复后实测**：

| 请求 | 结果 |
| --- | --- |
| 线上代理，`Origin: https://solana-neon-ten.vercel.app` | `{"success":true}` ✅ |
| Neon Auth 直连，同上 Origin | `{"success":true}` ✅ |
| 线上代理，`Origin: https://evil.example` | `INVALID_ORIGIN` ✅（白名单仍生效） |
| 线上代理，`Origin: https://solana-abc123-alkaidstarts-projects.vercel.app` | `INVALID_ORIGIN` ⚠️ 通配符未匹配该预览主机（不影响生产；遗留待查） |

**遗留**：预览通配符 `https://*.alkaidstarts-projects.vercel.app` 未匹配任意预览主机，原因待查（可能该 API 版本的通配符语义不同）。生产域名已可用，不影响本需求验收。

- [ ] MVP 验收：见 plan.md §7。当前完成 §7 第 6 项（表名冲突解除，迁移可幂等重复执行）；第 1~5 项待阶段 2/3/5 与线上复验。

## 阻塞项已修复：创建商户租户一直失败（jsonb 参数读回为字符串，2026-10-15）

**现象**：真实登录打通后，`POST /api/v1/tenants` 返回 `500 {"code":"TENANT_CONFIGURATION_INVALID","message":"Tenant configuration is invalid"}`。库中 `tenants`/`memberships` 均为 0 行（事务整体回滚，无脏数据），`users` 已有 1 行（说明桥接本身正常）。

**定位**：`TENANT_CONFIGURATION_INVALID` 全仓库只有一处 —— `lib/server/services/tenants/service.ts` 的 `toTenantView()`，它对 `record.support_hours` 重新执行 `supportHoursSchema.safeParse`。本地直接调用 `createTenant()` 复现出完全相同的错误，证明与部署无关。

隔离实验（逐层排除）后确认根因在 `postgres` 驱动：

| 取值方式 | 驱动返回 |
| --- | --- |
| `SELECT '{}'::jsonb`（字面量） | `object {}` |
| `SELECT $1::jsonb`（绑定参数） | **`string "{}"`** |
| 临时表 `INSERT ... VALUES ('{}'::jsonb) RETURNING j`（字面量） | `object {}` |
| 临时表 `INSERT ... VALUES ($1::jsonb) RETURNING j`（参数） | **`string "{}"`** |

结论：**凡是通过绑定参数写入的 jsonb，读回时驱动给的是 JSON 字符串而非对象**（与表、事务、列均无关）。`createTenant()` 正是「用参数写 `support_hours` → 再校验 `RETURNING` 的值」，于是校验自己成功的写入时必然失败 —— 也就是说**该仓库的「创建商户租户」功能从未可用过**，与本需求引入的改动无关（`components/auth/auth-card.tsx` 的注册按钮此前只是 `setTimeout` 假通过，从未真正走到这个接口，因此一直没暴露）。

**修复**：`lib/server/services/tenants/service.ts` 新增 `normalizeJsonColumn()`，在 `toTenantView()` 解析前把字符串形式的 jsonb 归一化（`JSON.parse`，失败则原样返回），使该边界同时接受对象与 JSON 字符串两种表示。

**验证**：`pnpm exec tsc --noEmit` OK、`pnpm lint` 0 问题、`pnpm exec vitest run` 24 文件 261 用例全绿；修复后经线上 API 重新执行创建租户（见下方端到端记录）。

**同类风险（未处理，仅供后续排查）**：同一驱动特性会影响所有「参数写入 jsonb 后再读回并当作对象使用」的位置，例如 `payment_orders.quote_snapshot`、`payment_candidates.evidence`、`outbox_events.payload`、`audit_events` 的 metadata 等。本次只修复了阻塞本需求的 `support_hours`，其余未逐一验证。

**测试缺口（未完成项）**：未为本 bug 补自动化回归用例。原因：`lib/server/services/tenants/` 下原本没有任何测试文件，且 `createTenant()` 依赖 `lib/server/db/client` 的 `getDatabase()`（读取 `DATABASE_URL`）不便注入隔离数据库；现有 `PGlite` 用法仅覆盖 `lib/server/payments/`。手工复现步骤：以任一合法会话调用 `POST /api/v1/tenants`（body 含 `supportHours: {}`），修复前返回 500 `TENANT_CONFIGURATION_INVALID`，修复后返回 200。

## 线上端到端验收记录（2026-10-15，真实账号，curl）

需求方提供邮箱 `2595006848@qq.com` 配合收信，逐步实测（全部为生产域名 `https://solana-neon-ten.vercel.app` 与生产 Neon 库）：

| 步骤 | 请求 | 实际结果 |
| --- | --- | --- |
| 1 | `POST /api/auth/email-otp/send-verification-otp` `{email, type:"sign-in"}` | `200 {"success":true}` ✅（此前因尾斜杠返回 `INVALID_ORIGIN`） |
| 2 | `POST /api/auth/sign-in/email-otp` `{email, otp}` | `200`，Neon Auth 建号并返回 `user.id=0e6b23b8-…`、`emailVerified:true` ✅ |
| 3 | `GET /api/auth/get-session` | 返回真实 session ✅ |
| 4 | `POST /api/v1/auth/neon/session` `{locale:"zh_CN"}` | `200`，本地用户 `74c2bac2-0561-45d9-9b58-675c134215bb`，`Set-Cookie: __Host-solaflow_session` + `__Host-solaflow_csrf` ✅（**T12 通过**） |
| 5 | `POST /api/v1/tenants` `{name,market:"ID",timezone:"Asia/Jakarta",supportHours:{}}` | 修复 jsonb bug 前 `500 TENANT_CONFIGURATION_INVALID`；修复后 `200`，租户 `11a6358e-f223-4b49-bbed-25373d40b0ff` + Owner membership `fab89ad5-5e3e-42bb-b405-c5453ff82e47` ✅ |
| 6 | `POST /api/v1/auth/switch-tenant` `{membershipId}` | `200`，会话绑定该 membership ✅ |
| 7 | `POST /api/v1/payments/session` | `200 {"tenantId":"11a6358e-f223-4b49-bbed-25373d40b0ff"}` ✅（**T6 通过**：绑定登录商户的租户，非随机铸造） |
| 8 | `POST /api/v1/payments/orders` `{credits:100}` | `200`：订单 `b52ceb20-8b7b-4b56-8d8e-7115b3d1680b`、`status=awaiting_payment`、`2000000` atomic（2.000000 devnet USDC）、mint `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`、收款人 `DJAuqiXHRu6BC7eBfHYq1VXyVefj5c7RpXJQjeAKZE8R`、reference `JAadndn61k4YSNBZZU9CLx53HZ8tcQjdBW1P4uvAgMzr`、Solana Pay URL 与 6130 字节 QR data URL ✅ |

库内一致性核对：

- `payment_sessions.tenant_id` = `11a6358e-f223-4b49-bbed-25373d40b0ff`（与该商户租户一致，未铸造随机租户）✅
- `devnet_payment_orders.tenant_id` = 同一租户 ✅
- `memberships`：`role=owner`、`status=active` ✅
- `test_credit_ledger` 为 0 行 ✅（尚未付款，未入账 —— 符合预期）

**T5 已通过**：未登录请求 `POST /api/v1/payments/session`、`GET /api/v1/payments/session`、`POST /api/v1/payments/orders` 均返回 `401 {"error":"Authentication is required"}`。

## 尚未完成（需钱包操作）

**T8/T9/T10 未执行**：真实链上付款需要 devnet 钱包（0.001 SOL 手续费 + devnet USDC）。这必须由需求方在浏览器钱包中完成，我无法代做。

待验证内容：
- T8：用 devnet 钱包扫上述 QR 或打开 Solana Pay 链接付款 → 页面每 5 秒轮询 `POST /api/v1/payments/orders/{id}` → 应在 finalized 且服务端校验完整后变为 `credited`，且 `test_credit_ledger` 恰好多出一行。
- T9：同一订单重复回调（重复打开/刷新）不应产生第二次入账。
- T10：错金额或错 mint 的付款不应增加额度。

## 未运行/受阻说明

- **已解除（原阻塞记录作废）**：原「阶段 2 阻塞：OTP 投递需需求方提供外部 HTTP 端点与 Bearer」不再成立 —— 方案改为 Neon Auth 托管 Email OTP，投递由托管服务负责，无需自建；`OTP_DELIVERY_ENDPOINT`/`lib/server/auth/otp-provider.ts` 不再参与登录链路。
- **已解除（原记录作废）**：原「部署未执行 / 生产仍为 7 天前构建」不再成立 —— 本次共部署 4 次至生产并别名至 `https://solana-neon-ten.vercel.app`。
- **已解除（原记录作废）**：原「未在生产库写入测试数据」的顾虑已按需求方明确授权解除 —— 需求方提供邮箱 `2595006848@qq.com` 并要求以其真实商户账号验收；线上库现有 1 个真实租户 `SolaFlow Merchant` 与 1 条 Owner membership，以及 1 张 `awaiting_payment` 状态的 devnet 测试订单（未入账）。
- **E2E 未运行**：`pnpm exec playwright test` 未执行；现有 E2E 用例未覆盖登录前置条件，待后续补齐。
- **钱包验收未执行**：T8/T9/T10 需要 devnet 钱包（SOL 手续费 + devnet USDC），必须由需求方在浏览器中完成，我无法代做。手工步骤见上一节。
- **遗留缺陷（未处理）**：① 预览通配符受信域名 `https://*.alkaidstarts-projects.vercel.app` 未匹配预览主机，原因待查；② `lib/api/auth.ts` 的 `switchTenant()` 发送 `{ tenantId }`，而 `app/api/v1/auth/switch-tenant/route.ts` 实际要求 `{ membershipId }` —— 客户端与服务端字段名不一致，会影响工作台的租户切换；③ 同驱动 jsonb 特性可能影响 `quote_snapshot`/`evidence`/`payload` 等其他 jsonb 读回点，未逐一验证；④ 未为「jsonb 参数读回为字符串」补自动化回归用例。

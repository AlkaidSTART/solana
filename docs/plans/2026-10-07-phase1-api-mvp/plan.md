# SolaFlow AI Phase 1 API MVP Implementation Plan

> **For agentic workers:** implementation is coordinated by the primary agent. Independent file domains may be implemented in parallel by Luna agents only after the shared interfaces below are locked. Every worker must read `AGENTS.md`, this plan, and its assigned API/PRD sections before editing.

**目标：**依据 `docs/API.md` 与 `docs/PRD.md` 落地可编译、可配置、不会伪造外部成功的 Phase 1 Next.js 全栈 API MVP；先锁定公共协议与安全边界，再并行实现核心领域。

**架构：**所有 HTTP 入口位于 `app/api/v1/**/route.ts`，只负责请求边界；认证、租户、数据库、幂等、审计、领域规则和第三方适配位于 `lib/server/**`。PostgreSQL 是权威持久化，BullMQ/Redis 只承载持久任务；数据库、Redis、邮件、WooCommerce、WhatsApp 或 Solana RPC 未配置时返回真实 `unconfigured`/`503`，不使用进程内假数据宣称业务成功。

**技术栈：**Next.js 16.3.8 App Router、React 19.2.8、TypeScript 5 strict、pnpm 11.17.0、PostgreSQL、BullMQ/ioredis、Zod、`@solana/pay` 1.0.0-beta.14、`@solana/kit` 6.10.0、Vitest（仅关键规则的最小定向测试）。

## 全局约束

- 保留当前 `develop` 分支和所有既有未提交改动；不创建/切换分支，不提交、不推送、不重置。
- API 根前缀固定为 `/api/v1`；`docs/API.md` 表格中的短路径均视为此前缀下的相对路径。
- Phase 1 包含公共基础、OTP 会话/租户权限、WooCommerce、15 分钟催付基础、会话/人工接管、知识事实边界、Credits 账本和 devnet 支付订单；COD 与效果归因报表按 PRD 留到 Phase 2。
- 外部真实发送、生产迁移、主网支付、钱包签名、交易发送和破坏性操作不在本次范围。
- 金额、代币和 Credits 的权威数量使用最小单位整数字符串或数据库整数；禁止 JavaScript 浮点账务。
- `confirmed` 不能入账；只有 `finalized` 且网络、mint、收款人、金额、reference、时间和唯一转账位置全部验证后，才允许同一事务入账一次。
- Cookie 写操作必须校验 Origin/CSRF；租户来自服务端会话；跨租户资源统一按不可枚举 `404` 处理。
- Webhook 必须对原始字节验签，验签成功且事件可靠持久化后才返回成功；重复/乱序不能重复产生副作用。
- 不把 `202`、供应商 HTTP 成功、交易 signature、`confirmed` 或模拟结果描述为最终成功。
- 不新增独立 `backend` 工程，不在 Route Handler 堆叠领域逻辑，不在 Server Component 内 fetch 本应用 API。
- 用户要求避免过度测试：不搭建 Playwright/UI E2E，不跑无关全量测试；只为认证/租户、Webhook 幂等、Solana finalized 入账等关键规则保留少量 Vitest 用例，并执行一次 lint/type/build 集成门。

## MVP 范围

1. 公共协议：统一成功/列表/异步/错误响应、request ID、`private, no-store`、JSON/body/header 校验、稳定错误码。
2. 运行时基础：严格环境读取、惰性 PostgreSQL/Redis 客户端、SQL 迁移入口、operation/outbox、加密凭证、审计和幂等执行器。
3. 身份与租户：OTP provider 边界、一次性 challenge、会话 Cookie、CSRF、RBAC、租户切换与 tenant-scoped DAL。
4. 系统接口：health、capabilities、auth/session、tenant、operations；未配置依赖清楚暴露证据状态。
5. Phase 1 领域：WooCommerce 店铺/凭证/验证/同步/Webhook；WhatsApp 通道/模板/Webhook与会话接管；payment reminder 工作流、订单读取与知识草稿；Credits/支付订单/候选核查/账本。
6. 最小自动化证据和文档记录；不接触真实商户、真实号码、真实资金或主网。

## 非目标

- 不实现 Shopify、TikTok Shop、Shopee、Lazada、非官方 WhatsApp、其他消息渠道、泰语自动回答、Coexistence/BSP 通用成功路径。
- 不实现 COD 自动处理、效果归因报表、自动地址修改/取消/发货/退款、自动续费、手工加点或自动链上退款。
- 不创建伪造的 Demo 商户、KPI、送达回执、已批准模板、链上付款或默认 Credits。
- 不补做完整前端工作台、TanStack Query、浏览器 E2E 或性能压测。

## 共享接口锁定

- `types/api/common.ts` 导出 `ApiRole`、`EvidenceStatus`、`OperationStatus`、`ApiMeta`、`ApiSuccess<T>`、`ApiProblem`、`PageInfo` 与 `ListData<T>`。
- `lib/server/http/errors.ts` 导出 `ApiError`；`lib/server/http/responses.ts` 导出 `ok`、`accepted`、`list`、`problem` 与 `noContent`，统一附加 request ID、server time 和 no-store 头。
- `lib/server/http/request.ts` 导出 `createRequestContext`、`parseJson`、`requireHeader`；外部输入先以 `unknown` 进入 Zod schema。
- `lib/server/auth/session.ts` 导出 `requireActor(request, allowedRoles?)`；返回 `ActorContext { userId, tenantId, membershipId, role, storeIds, sessionId, csrfTokenHash }`，业务请求不接受客户端 tenant ID。
- `lib/server/idempotency/service.ts` 导出 `executeIdempotent(actor, operation, key, payload, execute)`；数据库唯一约束是最终裁决。
- `lib/server/db/client.ts` 只惰性读取连接；模块导入和构建不得主动联网。`withTransaction` 是财务/停发的一致性入口。
- migration 文件编号归主智能体分配：`0001_foundation.sql`、`0002_store_woocommerce.sql`、`0003_whatsapp_conversations.sql`、`0004_workflows_orders_knowledge.sql`、`0005_billing_solana.sql`；代理不得改他域 migration。
- 根 `package.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`AGENTS.md`、`docs/API.md` 只由主智能体修改。

## 阶段拆分与验证

### 阶段 1：基线、依赖与公共契约

- [ ] 主智能体审阅当前差异并仅添加必要依赖：`zod`、`postgres`、`bullmq`、BullMQ 所需 Redis client `ioredis`，以及最小开发依赖 `vitest`、`tsx`；不安装 TanStack Query 或第二套状态/后端框架。固定核验版本为 Zod 4.6.5、postgres 3.4.9、BullMQ 6.3.11、ioredis 6.0.0、Vitest 4.1.11、tsx 4.23.15；Vitest 4 保留 Node 20/22/24 兼容，避免仅支持 Node 22+ 的 Vitest 5。
- [ ] Luna A 独占 `types/api/**` 与 `lib/server/http/**`，实现统一协议、错误映射和输入边界。
- [ ] Luna B 独占 `lib/server/config/**`、`lib/server/db/**`、`lib/server/security/**`、`scripts/migrate.ts` 和 `0001_foundation.sql`，实现惰性基础设施与 schema。
- [ ] Luna C 独占 `lib/server/auth/**`、`lib/server/idempotency/**`、`lib/server/audit/**`，实现会话、CSRF、RBAC、OTP provider 边界、幂等和审计。
- 测试 T1：`pnpm exec next typegen && pnpm exec tsc --noEmit`；预期公共接口签名一致，构建期不连接外部系统。仅运行公共协议/认证定向 Vitest 文件；预期错误结构、跨租户不可枚举、CSRF 拒绝和幂等 key 重用规则通过。

### 阶段 2：系统、认证、租户与 operation Route Handlers

- [ ] 主智能体实现 `app/api/v1/health/**`、`capabilities/**`、`auth/**`、`tenants/**`、`tenant/**`、`operations/**` 的薄 Route Handlers 和对应 service/DAL。
- [ ] OTP 邮件 provider 缺失时返回 `503 CAPABILITY_UNAVAILABLE`，不生成“已发送”假象；成功模式不把 OTP 或 session token 放进 JSON/日志。
- [ ] health/capabilities 将 `database`、`queue`、`otpEmail`、`woocommerce`、`whatsapp`、`solanaRpc` 分别标为 `ok/degraded/down/unconfigured` 与 `implemented/verified/unavailable`。
- 测试 T2：只对 `/api/v1/health`、未配置 OTP、未登录 session 做 HTTP smoke；预期 health 为 200 且无 secret，OTP 为明确 503，session 为 401。数据库可用时再验证 OTP/tenant happy path；不可用则记录环境阻塞，不伪报。

### 阶段 3：三个 Luna 领域并线

- [ ] Luna A 独占 `app/api/v1/stores/**`、`app/api/v1/webhooks/woocommerce/**`、`lib/server/integrations/woocommerce/**`、`lib/server/services/stores/**`、`0002_store_woocommerce.sql`；实现 WooCommerce 店铺、只写加密凭证、验证/同步 operation 与原始字节 HMAC Webhook。
- [ ] Luna B 独占 `app/api/v1/channels/**`、`app/api/v1/conversations/**`、`app/api/v1/translation-previews/**`、`app/api/v1/webhooks/whatsapp/**`、`lib/server/integrations/whatsapp/**`、`lib/server/services/conversations/**`、`0003_whatsapp_conversations.sql`；实现通道证据、模板、回调、人工接管与真实 unavailable 发送状态。
- [ ] Luna C 独占 `app/api/v1/workflows/**`、`app/api/v1/tasks/**`、`app/api/v1/orders/**`、`app/api/v1/knowledge-items/**`、`app/api/v1/knowledge-conflicts/**`、`lib/server/services/workflows/**`、`orders/**`、`knowledge/**`、`0004_workflows_orders_knowledge.sql`；仅实现 Phase 1 payment reminder，COD 返回明确未实现/不可用而非成功。
- 测试 T3：每个代理只运行自己域的一个定向测试文件或可复现 HTTP smoke；必须覆盖正常解析、签名/权限失败、重复事件无第二次副作用中的相关项，不扩张到全路由矩阵。

### 阶段 4：Credits 与 Solana Pay

- [ ] 主智能体独占 `app/api/v1/billing/**`、`lib/server/services/billing/**` 与 `0005_billing_solana.sql`；一名 Luna 代理仅独占 `lib/server/integrations/solana/settlement.ts` 及单一 `settlement.test.ts`，实现无 I/O 的核查规则，主智能体负责与持久化结算事务并线。
- [ ] 价格、cluster、原生 USDC mint、recipient 只从服务端配置/目录产生；创建 20 分钟报价和唯一 reference，客户端不得覆盖权威字段。
- [ ] claim/recheck 只登记候选并进入核查；完整验证 settlement 后才能在同一事务占用 `cluster + signature + transferIndex`、完成 payment order、写 credit batch 与追加账本。
- [ ] 默认仅允许 devnet；不生成、读取或保存私钥，不签名、不发送交易，不做自动退款。
- 测试 T4：只运行 `settlement` 规则定向测试，覆盖 `confirmed` 不入账、金额/mint/recipient 任一不符不入账、`finalized` 完整匹配一次入账、同一 transfer 重放不二次入账。RPC 未配置时 HTTP 返回真实 unavailable。

### 阶段 5：集成、文档与最小交付闸门

- [ ] 主智能体解决并线接口差异，审阅 `git diff`，更新本目录 `result.md`；同步 `docs/API.md` 的真实实现状态，仅把已经落地且验证的接口标记为 implemented。
- [ ] 运行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、定向 `pnpm exec vitest run <实际关键测试文件>`、`pnpm build`；不运行 Playwright、全浏览器矩阵、真实外部 API、RPC 写操作或无关测试。
- [ ] 启动发布态或开发态后，用本地 HTTP 只验证 health/capabilities 与 2～3 个关键拒绝路径；数据库/Redis/外部凭证缺失必须是可解释的状态，不允许空白 500。
- [ ] 执行 `git diff --check`、`(Get-Content AGENTS.md).Count`，确认 AGENTS ≤200 行、无 secret、无 npm/yarn 锁文件、无独立 backend 源码、无临时产物。

## 最终验收标准

1. 公共协议、认证、租户、RBAC、CSRF、幂等、审计、operation 和持久化边界可编译，并由最小定向用例证明关键拒绝规则。
2. Phase 1 核心领域 Route Handlers 位于 Next.js App Router，业务逻辑位于 `lib/server/**`，不存在独立后端工程。
3. 未配置外部依赖不会伪装成功；真实发送/链上写入未发生；所有异步受理与最终状态语义准确。
4. WooCommerce/WhatsApp Webhook 对原始字节验签并具备持久幂等边界；人工接管/退订/付款停发规则至少在服务接口和事务模型中明确。
5. Solana 只创建服务端权威 devnet 请求与核查候选；`confirmed` 不入账，`finalized` 完整匹配后一次入账。
6. 实际执行的 lint、typegen/typecheck、少量关键 Vitest、build 与 HTTP smoke 无本次引入的未处理失败；未运行项和环境阻塞如实记录。

## 风险与依赖

- API 文档仍是 draft，多个端点只有字段摘要。本计划用 Phase 1/PRD 优先级收口；遇到影响数据模型的歧义先由主智能体在计划中记录，不由代理自行扩展。
- PostgreSQL、Redis、OTP 邮件、WooCommerce、WhatsApp 和 Solana RPC 可能没有本地配置；实现必须支持惰性初始化和 truthful unavailable，无法完成的外部验收保持未勾选。
- `@solana/pay` beta 约束 Kit 6.x；不为追求新交易格式擅自升级至 Kit 8，升级需独立兼容性计划。
- 多代理共享工作区存在覆盖风险；严格按上述目录所有权分配，根 manifest/锁文件和迁移序号由主智能体串行处理。
- 用户明确要求不做过多测试；因此只测试高风险不变量。此取舍不能被描述为完整自动化覆盖。

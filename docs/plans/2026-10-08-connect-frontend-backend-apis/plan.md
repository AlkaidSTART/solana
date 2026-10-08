# 前端与后端接口全量连接实施计划

## 1. 背景与目标
- **背景**：SolaFlow AI 当前已在 `app/api/v1/**/route.ts` 实现了完整的 App Router 服务端 API（覆盖 Auth、Tenant、Stores、Channels、Orders、Workflows、Conversations、Knowledge、Billing 等核心领域），但前端各业务控制台页面（Orders、Stores、Workflows、Inbox、Knowledge、Settings、Overview、Auth）大多仍直接读取本地静态 Mock 数据或纯内存 Zustand store，未与后端 API 真正连通。
- **目标**：全量连接前端各页面与后端 App Router API。建立统一的端到端前端 API 客户端层与 React Query 数据状态管理，打通数据请求、变更提交、缓存刷新与失效、CSRF 携带、加载/空/错误状态展示及优雅降级，达成真正全栈连通。

## 2. MVP 范围
1. **统一 API 客户端层 (`lib/api/`)**：
   - 封装类型安全的 `apiFetch` 请求器，内置 RFC 7807 / ApiProblem 错误解析、自动识别与注入 CSRF Token (`x-csrf-token`)、超时中断与凭证模式。
   - 覆盖全部业务模块客户端函数：`authApi`、`tenantApi`、`ordersApi`、`storesApi`、`channelsApi`、`workflowsApi`、`conversationsApi`、`knowledgeApi`、`billingApi`。
2. **全局 TanStack Query 基础设施 (`components/providers/query-provider.tsx`)**：
   - 接入全局 `QueryClientProvider`，为整个 `/console` 路由树提供统一缓存、预取、自动重试与失效管理。
3. **前端各业务页面全面对接后端接口**：
   - **认证与会话 (`/login`, `/register`)**：对接 `/api/v1/auth/session`、`/api/v1/auth/otp/request`、`/api/v1/auth/otp/verify`、`/api/v1/auth/logout`，保留一键演示商户路径并标注 Demo。
   - **订单管理 (`/console/orders`)**：对接 `GET /api/v1/orders`、`POST /api/v1/orders/[orderId]/cod-actions`、`POST /api/v1/order-exports`。
   - **店铺与渠道 (`/console/stores`)**：对接 `GET /api/v1/stores`、`POST /api/v1/stores`、`GET /api/v1/channels`、`POST /api/v1/channels/[id]/verify`、`POST /api/v1/channels/[id]/test-messages`、`GET /api/v1/channels/[id]/templates`。
   - **规则工作流 (`/console/workflows`)**：对接 `GET /api/v1/workflows`、`POST /api/v1/workflows`、`POST /api/v1/workflows/[id]/activate`、`POST /api/v1/workflows/[id]/pause`、`POST /api/v1/workflows/[id]/versions/[vId]/restore`。
   - **多语言会话与收件箱 (`/console/inbox`)**：对接 `GET /api/v1/conversations`、`GET /api/v1/conversations/[id]/messages`、`POST /api/v1/conversations/[id]/messages`、`POST /api/v1/conversations/[id]/handoff`、`POST /api/v1/conversations/[id]/resume`。
   - **知识库问答 (`/console/knowledge`)**：对接 `GET /api/v1/knowledge-items`、`POST /api/v1/knowledge-items`、`PATCH /api/v1/knowledge-items/[id]`、`POST /api/v1/knowledge-items/[id]/publish`、`/api/v1/translation-previews`。
   - **仪表盘总览与设置 (`/console`, `/console/settings`)**：对接 `GET /api/v1/tenant`、`PATCH /api/v1/tenant`、`GET /api/v1/capabilities`、`GET /api/v1/billing/summary`。
4. **状态与降级体验**：
   - 所有交互覆盖 loading、empty、error、success 完整四态。
   - 当后端服务未配置数据库或处于离线演示模式时，UI 明确呈现状态并平滑回退至标注了 Demo/Mock 的沙盒数据集，保证用户界面与体验稳定可用。

## 3. 非目标
- 不重写后端 API 的数据库 Schema 与数据表结构（沿用既有迁移 0001-0005）。
- 不破坏既有 Solana Devnet 支付与 Webhook 签名逻辑。
- 不引入第三方非标 HTTP 请求库（如 Axios），固定采用原生 `fetch` + `@tanstack/react-query` + TypeScript 5。

## 4. 风险与依赖
- **依赖**：`@tanstack/react-query` 已在 `package.json` 安装；原生 `fetch` 与 Next.js App Router 客户端兼容。
- **CSRF 风险**：后端 `requireWriteActor` 强制校验 CSRF Token，写操作必须从 Cookie 解析 CSRF 并注入 `x-csrf-token` 请求头。
- **环境风险**：在无外部数据库或测试环境下，未配置连接串可能返回 503 DATABASE_UNAVAILABLE，API 客户端与 Hook 需具备明确的状态指示与 Demo 降级。

## 5. 阶段拆分
- **阶段 1**：搭建统一 API 客户端层与 React Query Provider（`lib/api/*`，`components/providers/query-provider.tsx`）。
- **阶段 2**：连接认证登录、租户设置与能力探测（`app/login`，`app/console/settings`，`layout`）。
- **阶段 3**：连接订单列表、COD 动作核验与控制台概览（`app/console/orders`，`app/console/page.tsx`）。
- **阶段 4**：连接店铺渠道、工作流、多语言会话收件箱与知识库（`app/console/stores`，`app/console/workflows`，`app/console/inbox`，`app/console/knowledge`）。
- **阶段 5**：自动化测试、类型检查、构建与 MVP 交付验收。

## 6. 各阶段测试步骤、输入及预期
- **阶段 1 测试**：
  - 测试输入：调用 API client 请求 `/api/v1/capabilities` 与 `/api/v1/health`。
  - 预期结果：正确解析 JSON，收到标准 `{ data, meta }` 结构，CSRF 头自动生成并携带。
- **阶段 2 测试**：
  - 测试输入：在登录页触发 OTP 发送并检查会话；在设置页修改归因配置。
  - 预期结果：表单正确调用对应 `/api/v1/auth/` 与 `/api/v1/tenant`，并处理加载与错误。
- **阶段 3 测试**：
  - 测试输入：进入订单页面筛选、审批 COD 订单、导出订单。
  - 预期结果：React Query 触发请求，审批后缓存自动失效并刷新。
- **阶段 4 测试**：
  - 测试输入：进入店铺、工作流、收件箱、知识库执行查看与变更操作。
  - 预期结果：所有列表与表单连接到相应 API，支持刷新与状态反馈。
- **阶段 5 测试**：
  - 测试步骤：执行 `pnpm test`、`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`。
  - 预期结果：所有测试通过，无类型错误，构建成功。

## 7. 最终验收标准
1. 前端所有业务页面（登录、概览、订单、店铺、工作流、收件箱、知识库、设置）均已接入 `lib/api/` 与 TanStack Query。
2. 所有数据查询与提交使用统一规范，覆盖 loading / error / empty / success。
3. 状态管理分层符合 `AGENTS.md`：服务端数据走 TanStack Query，UI 偏好走 Zustand，表单局部走 Hooks。
4. 全量自动化测试、类型检查及项目打包均 100% 成功通过。

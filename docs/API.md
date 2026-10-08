# SolaFlow AI Next.js 全栈 API 接口契约

- 文档版本：v1.0-draft
- 修订日期：2026-10-07
- API 前缀：`/api/v1`
- 实现状态：**阶段 1–4 已有部分源码；API 契约不代表数据库、外部服务或生产验收通过**
- 产品依据：[PRD](PRD.md)、[WhatsApp 接入指南](whatsapp-integration-guide.md)、[消息渠道可行性审查](channel-feasibility-review.md)
- 页面依据：[工作台 UI 规范](../ui_design/README.md)
- 计划与验收：[plan.md](plans/2026-10-07-next-fullstack-api-docs/plan.md)、[result.md](plans/2026-10-07-next-fullstack-api-docs/result.md)

本文定义 HTTP 契约、数据状态和安全边界。示例用于说明目标 Schema；下表仅记录当前源码落点，不代表数据库迁移已执行、接口已通过集成验收、存在真实商户数据、Meta 授权、消息发送、链上付款或生产部署。界面仍须按真实状态展示空值、阻塞项或 `Demo/Mock`，不能把目标响应当成已验证能力。

## 当前实现与验收状态（2026-10-07）

| 阶段 | 已有源码范围 | 尚未验证 / 不可据此宣称 |
| --- | --- | --- |
| 1：基础、认证、租户与系统 | foundation migration、auth/tenant/system services，以及 health、capabilities、OTP、租户和会话 Route Handlers | 数据库迁移未在目标数据库验证；OTP 邮件投递、数据库/队列运行和完整入驻闭环未外部验收 |
| 2：店铺与 WooCommerce | store service/routes、凭证处理、Webhook 领域代码及 migration | 未用真实 WooCommerce 商户凭证、订单事件和外网 Webhook 完成验收；同步 worker 不代表已运行 |
| 3：WhatsApp、会话、工作流、订单与知识 | channels/conversations 服务与 routes；workflow/order/knowledge 服务与 routes、规则代码和 migration | Meta 授权、真实消息发送/回执、持久 worker、真实订单同步与知识 provider 均未验收；相关数据库 migration 未验证 |
| 4：计费与 Solana | billing service 与 11 个 `/api/v1/billing/**` 端点已并入；credit-ledger/payment-orders 支持 cursor；纯 settlement evaluator 与内部单事务 settlement service 已实现 | 0005 尚未在 PostgreSQL 实际运行；无 RPC 查询或持久 worker，支付订单创建因此保持 fail-closed，且没有真实 finalized 入账验收。退款仍为 503；主网未验收，不能视为已启用 |

截至本修订，代码存在不等于可调用 API，更不等于生产能力。数据库迁移、第三方网络行为和持久 worker 必须分别验证并记录；未验证项继续显示阻塞或 unavailable。

除 Webhook 小节为强调外部回调地址而写出的完整 URL 外，端点矩阵中的 `/health`、`/auth/...` 等路径均是 `/api/v1` 下的相对路径。例如 `/health` 的实际地址是 `/api/v1/health`。

## 1. Next.js 全栈架构边界

本项目保持一个 Next.js 16 App Router 全栈代码库，不建立独立 NestJS 项目，不通过 rewrite 转发到另一个“后端服务”。

```text
app/
  api/v1/**/route.ts       # HTTP 薄适配器：解析、认证、校验、调用服务、映射响应
  (console)/**/page.tsx    # Server Components 优先，直接调用服务端 DAL / service
lib/server/
  auth/                    # OTP、会话、CSRF、RBAC
  db/                      # PostgreSQL 连接、迁移入口、事务
  dal/                     # 按租户、角色、店铺范围授权后的数据访问
  validation/              # 请求和外部数据 Schema
  services/                # 订单、会话、工作流、计费、报表领域服务
  integrations/
    woocommerce/
    whatsapp/
    solana/
  webhooks/                # 原始请求验签、持久化、去重和乱序协调
  jobs/                    # 持久化入队与 worker 共享任务定义
  audit/                   # 脱敏审计
types/
  api/                     # 客户端允许引用的可序列化 API 契约
```

### 1.1 Route Handler 规则

- API 使用 `app/api/v1/**/route.ts` 与 Web `Request` / `Response`；不新增 Pages Router `pages/api`。
- Route Handler 是公开可达的 HTTP 入口。每个 handler 都必须执行自身所需的认证、授权、输入校验和错误脱敏；`proxy.ts` 不能成为唯一权限边界。
- 数据库驱动、密码学、Solana SDK、Webhook 和队列接口使用 Node.js runtime。相关 route 显式 `export const runtime = "nodejs"`；不使用已弃用的 Edge runtime。
- Next.js 16 动态路由参数是 Promise，使用 `await ctx.params` 或 `RouteContext<"/api/v1/...">`；`cookies()` 同样是异步 API。
- 账户、订单、会话、余额和权限接口不得共享缓存。Route Handler 默认动态执行，并返回 `Cache-Control: private, no-store`；调用第三方平台或 RPC 时按业务需要显式 `cache: "no-store"`。
- Webhook 先对 `await request.arrayBuffer()` 得到的原始字节验签，只读取一次 body；验签通过后再解析 JSON。不能对 `request.json()` 的重序列化内容验签。
- Server Components 直接调用 `lib/server` 的 DAL / service，不从服务器 `fetch` 本应用 Route Handler，避免构建期无监听服务和额外 HTTP 往返。
- 客户端轮询、浏览器交互、第三方回调和外部集成使用本文 HTTP API。表单是否采用 Server Action 属实现选择，但必须复用同一服务、权限和校验规则，不能形成第二套业务语义。
- Route Handler 不在响应后启动不可恢复的进程内 Promise。耗时同步、发送、模型调用、支付补偿和导出任务先持久化入队，再返回 `202` 与 operation ID。
- 项目不能使用静态 `output: "export"` 部署；无服务器环境不能依赖进程内存、本地文件、WebSocket 或永久运行的计时器。worker 可与 Next.js 共用仓库和领域模块，但须有可独立重启、持久消费队列的部署单元。

## 2. 通用协议

### 2.1 内容、时间和金额

- 默认请求与响应：`application/json; charset=utf-8`。
- Webhook 接口按供应商要求接收原始 body；导出下载使用 `text/csv` 或对象存储的短期签名地址。
- 时间交换使用带时区的 ISO 8601 UTC，例如 `2026-10-07T08:30:00.000Z`。展示层按店铺时区转换。
- 货币、代币和 Credits 数量使用最小单位整数字符串，禁止 JavaScript 浮点财务计算。例如 50 USDC 为 `"amountMinor": "50000000"`、`"decimals": 6`。
- 资源 ID 使用不可预测的 UUID 或等价标识。外部平台 ID 单独保存，不能作为租户授权依据。
- 电话、地址、Token、钱包敏感信息按字段权限脱敏；凭证为只写字段，成功保存后不在任何响应返回明文。

### 2.2 成功响应

```json
{
  "data": {
    "id": "01JEXAMPLERESOURCEID"
  },
  "meta": {
    "requestId": "01JEXAMPLEREQUESTID",
    "serverTime": "2026-10-07T08:30:00.000Z"
  }
}
```

列表统一使用 cursor 分页：

```json
{
  "data": {
    "items": [],
    "pageInfo": {
      "nextCursor": null,
      "hasNextPage": false
    }
  },
  "meta": {
    "requestId": "01JEXAMPLEREQUESTID",
    "serverTime": "2026-10-07T08:30:00.000Z"
  }
}
```

异步任务受理返回 `202 Accepted`：

```json
{
  "data": {
    "operationId": "01JEXAMPLEOPERATION",
    "status": "queued",
    "statusUrl": "/api/v1/operations/01JEXAMPLEOPERATION"
  },
  "meta": {
    "requestId": "01JEXAMPLEREQUESTID",
    "serverTime": "2026-10-07T08:30:00.000Z"
  }
}
```

`202` 仅表示已可靠持久化或入队，不表示同步、发送、模型调用、导出或付款已经成功。

### 2.3 错误响应

```json
{
  "error": {
    "code": "WORKFLOW_NOT_READY",
    "message": "工作流尚未满足启用条件",
    "details": {
      "blockingChecks": ["whatsapp_template_unapproved"]
    },
    "retryable": false,
    "requestId": "01JEXAMPLEREQUESTID"
  }
}
```

| HTTP | 使用场景 |
| --- | --- |
| `400` | JSON、查询参数或请求头语法错误 |
| `401` | 未登录、会话失效或外部签名验证失败 |
| `403` | 已认证但角色、店铺范围、CSRF 或 Origin 不允许 |
| `404` | 资源不存在；跨租户和越权店铺也返回同样语义以防枚举 |
| `409` | 状态竞争、版本冲突、幂等键复用但 payload 不同、重复绑定 |
| `413` | 请求体超过接口限制 |
| `422` | Schema 合法但业务资格、金额、网络或状态不满足 |
| `429` | OTP、登录、翻译、支付核查等接口限流 |
| `502` | 上游返回无效或拒绝的结果，且本地知道请求未完成 |
| `503` | 上游/RPC/队列暂不可用，是否产生外部副作用不确定时返回明确未知状态 |
| `500` | 未分类的服务异常；不返回堆栈、SQL、Token 或上游私密内容 |

### 2.4 请求头和并发

| 请求头 | 规则 |
| --- | --- |
| `Idempotency-Key` | 有第三方、财务、消息、导出或重复副作用的 `POST` 必填；8～128 个安全字符 |
| `X-CSRF-Token` | 基于 Cookie 的浏览器写操作必填；Webhook 不使用 |
| `If-Match` | 修改有版本的资源时携带当前 ETag，例如工作流、知识条目、偏好 |
| `X-Request-ID` | 客户端可传；服务端验证格式后沿用，否则生成新值 |
| `Content-Type` | JSON 写接口只接受 `application/json`；Webhook 按供应商协议 |
| `X-WC-Webhook-Signature` | WooCommerce 原始字节 HMAC-SHA256 的 base64 |
| `X-Hub-Signature-256` | WhatsApp 原始字节 HMAC-SHA256 的 `sha256=<hex>` |

幂等记录按 `tenant + actor + operation + key` 保存请求摘要和最终响应。同 key、同 payload 返回原结果；同 key、不同 payload 返回 `409 IDEMPOTENCY_KEY_REUSED`。数据库唯一约束和事务是最终保证，Redis 锁不能替代。幂等事务回调只能写本地业务状态、operation/outbox 和审计；邮件、消息、RPC 等不可回滚的外部调用由持久 worker 消费 outbox 后执行，不能放在会随数据库回滚消失的事务中。

## 3. 认证、租户与角色

### 3.1 会话

登录方式以 UI 规范为准，使用邮箱 6 位 OTP / Magic Link，不设计密码登录 API。

- 生产会话 Cookie 使用 `__Host-solaflow_session`：`HttpOnly`、`Secure`、`SameSite=Lax`、`Path=/`，不设置 `Domain`。本地非 HTTPS 开发可使用不带 `__Host-` 的同名开发 Cookie，但不能带入生产。
- 写操作校验可信 `Origin` 与 CSRF token。CSRF token 使用独立、可读、`SameSite=Lax` 的 `__Host-solaflow_csrf` Cookie；请求头 `X-CSRF-Token`、Cookie 值和会话中保存的摘要必须同时匹配。CORS 只控制浏览器读取，不替代 CSRF。
- OTP 请求需防账号枚举：无论邮箱是否存在都返回相同外观；按 IP、邮箱 hash 和 challenge 限流。
- OTP 请求的 Idempotency-Key 同 key、同邮箱摘要与 locale 时返回原 challenge，不能再次发送；同 key 不同请求返回 `409`。OTP 消费、用户恢复/创建和会话签发在同一数据库事务完成，避免验证码已消费但登录会话未建立。
- OTP 验证后可以先建立尚未选择租户的用户会话；该会话只能创建租户、读取/切换本人 membership 或登出。业务接口要求活动租户 membership。会话服务端解析当前用户、租户和 membership。除“切换租户”外，业务请求不接受 `tenantId` / `tenant_id` 决定访问范围。
- 切换租户后重新签发会话并清理客户端旧租户缓存。

### 3.2 角色权限

| 能力 | Owner | Admin | Agent | Finance |
| --- | --- | --- | --- | --- |
| 店铺/通道绑定、解绑 | 全部 | 可配置与验证；不能解绑主店铺 | 无 | 无 |
| 工作流与知识库 | 全部 | 管理与审核 | 只读必要知识 | 无 |
| 订单与会话 | 全部 | 全部 | 仅授权店铺/分配队列 | 无 |
| 人工消息与 COD 处理 | 可 | 可 | 已认领或授权范围 | 无 |
| 充值、订阅、流水与付款申诉 | 可 | 无 | 无 | 可 |
| 成员与角色 | 全部 | 仅管理 Agent | 无 | 无 |
| 数据导出/删除 | 可 | 业务脱敏导出与删除申请 | 无 | 仅财务导出 |
| 租户删除、授予 Finance | 可 | 无 | 无 | 无 |
| 手工加点、退款执行 | 无 | 无 | 无 | 无 |

平台支持和平台财务不复用商户角色。后续若实现，须使用独立内部身份、限定租户/理由/时限、完整审计；入账调整和退款执行采用双人复核。当前文档不提供内部资金执行接口。

## 4. 状态枚举

### 4.1 通用异步操作

`queued → running → succeeded | failed | cancelled`

- `queued`：已持久化，尚未执行。
- `running`：worker 已领取；必须有 heartbeat / lease，超时后可恢复。
- `succeeded`：目标操作完成且证据已保存。
- `failed`：已知未完成，返回稳定错误码与可重试性。
- `cancelled`：在外部副作用前取消。已经交给第三方的操作不能伪装为已召回。

隐私删除、退款复核等资源可以有各自的领域状态机；它们不能塞入本通用 operation 枚举。operation 只描述异步执行生命周期，领域资源另行返回其业务状态。

### 4.2 消息

`queued → accepted → sent → delivered → read`，另有 `failed` 与 `unknown`。

平台 HTTP 成功最多证明 `accepted`；只有明确回调才能推进为 `delivered` / `read`。乱序状态按最强证据推进，重复回调不重复扣 Credit。请求超时而平台是否受理未知时使用 `unknown`，不能盲目重发。

### 4.3 会话

`automated → waiting_human → human_active → resolved`。

进入 `waiting_human` 或 `human_active` 时，必须在同一事务/一致性边界停止该买家在该店铺的 AI 回复与后续自动提醒。`resolved` 不自动恢复旧任务；恢复自动化须重新检查付款、发货、退订、24 小时窗口和工作流版本。

### 4.4 支付订单

`awaiting_payment → detected → confirming → credited`，异常分支为 `expired`、`review_required`、`failed`。

`confirmed` 只能推进到 `confirming`，不增加可用权益。只有 `finalized` 且完整校验成功后才能进入 `credited`。

### 4.5 工作流与任务

工作流：`draft | active | paused | blocked`。任务：`scheduled | submitted | stopped | failed | unknown`。

`blocked` 必须列出真实阻塞项，例如同意不足、模板未批准、通道权限失效或 worker 不可用。`submitted` 表示已交第三方，付款/退订发生后可停止后续任务，但不能宣称已撤回该条消息。

## 5. 系统、认证与入驻接口

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与规则 |
| --- | --- | --- | --- | --- |
| GET | `/health` | 公开 | 无 | `200`；仅返回服务、数据库、队列、RPC 的 `ok/degraded/down/unconfigured`，不返回密钥或虚构延迟 |
| GET | `/capabilities` | 登录用户 | 无 | 当前环境已启用能力、阻塞条件和 `implemented/verified/unavailable` 证据状态 |
| POST | `/auth/otp/request` | 公开 | `email`、`locale`、Idempotency-Key | provider 明确受理后才返回 `202` 与 `deliveryStatus:"sent"`；结果不确定时返回可重试的 `503 OTP_DELIVERY_UNKNOWN` 及 challenge 证据，等待 `Retry-After` 后用新幂等 key 重试；防枚举与限流 |
| POST | `/auth/otp/verify` | 公开 | `challengeId`、6 位 `code` | 一次性消费 OTP；建立会话；返回用户和 memberships，不在 JSON 返回 session token |
| GET | `/auth/session` | 登录用户 | 无 | 当前用户、当前租户、角色、授权店铺和 onboarding 摘要 |
| POST | `/auth/switch-tenant` | 登录用户 | `membershipId` | 验证 membership 后切换会话；返回新的租户/权限摘要 |
| POST | `/auth/logout` | 登录用户 | 无 | 撤销当前会话，删除 Cookie；`200` |
| POST | `/tenants` | 登录且无租户/有创建权 | `name`、`market`、`timezone`、`supportHours`、Idempotency-Key | 创建租户与 Owner membership；请求不能指定 owner user ID |
| GET | `/tenant` | 租户成员 | 无 | 当前租户公开配置；按角色隐藏财务和敏感设置 |
| PATCH | `/tenant` | Owner | 可变基本配置、`If-Match` | 新版本与审计；组织所有权变更不包含在首版 |
| GET | `/onboarding` | 租户成员 | 无 | 六步状态、真实检查项、缺项与可继续步骤 |
| POST | `/onboarding/simulations` | Owner/Admin | `storeId`、`workflowId`、仿真场景 | `202`；仅隔离仿真，不发真实消息、不扣正式 Credits |
| GET | `/onboarding/simulations/{operationId}` | Owner/Admin | 无 | 仿真任务与各检查证据，不把排队视作通过 |
| POST | `/onboarding/activate` | Owner | `storeId`、`acceptedTermsVersion`、Idempotency-Key | 只有全部真实门槛通过才激活并发放一次试用；重复店铺/号码不得重复领取 |
| GET | `/operations/{operationId}` | 发起者或有权角色 | 无 | 通用异步状态、进度、错误、开始/结束时间和结果资源链接 |

认证服务、OTP challenge/session 处理与 HTTP delivery adapter 已有源码，但真实邮件供应商配置和投递、目标数据库迁移及试用激活闭环未验收。以上路由仍是接口契约；不能据此宣称验证码邮件已真实送达或试用已激活。

## 6. 店铺、WhatsApp 与工作流接口

### 6.1 店铺和同步

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/stores` | Owner/Admin；Agent 仅授权店铺 | `cursor`、`status` | 店铺、平台、权限范围、同步状态；没有真实接入时为空 |
| POST | `/stores` | Owner/Admin | `name`、`platform:"woocommerce"`、`baseUrl`、`timezone` | 创建 `draft` 店铺；不接受客户端租户字段，不声称已连接 |
| GET | `/stores/{storeId}` | 有店铺权限的成员 | 无 | 脱敏详情、连接健康、最近同步与阻塞项 |
| PATCH | `/stores/{storeId}` | Owner/Admin | 名称、时区、支持时间；`If-Match` | 更新配置版本；不在普通 PATCH 接收凭证明文 |
| PUT | `/stores/{storeId}/credentials` | Owner/Admin | WooCommerce key/secret，只写 | 加密轮换凭证，清除旧验证状态；响应仅返回 `hasCredentials:true` |
| POST | `/stores/{storeId}/verify` | Owner/Admin | Idempotency-Key | `202`；只读验证归属、权限与必要数据字段；通过不等于 Webhook/自动化闭环已验收 |
| POST | `/stores/{storeId}/sync` | Owner/Admin | `scope` 取 `products`、`orders` 或 `all`；`since?`、Idempotency-Key | `202`；首次历史导入默认禁止生成催付任务 |
| DELETE | `/stores/{storeId}` | Owner | `confirmationName`、`reason`、Idempotency-Key | 停用和解绑：撤销凭证、停止排队任务、保留审计/财务历史；已提交消息不可召回 |

Shopify、TikTok Shop、Shopee 和 Lazada 不进入首版实现。API 不为这些平台返回“已支持”占位成功；未来扩展以新的 `platform` 能力版本和独立验收加入。

### 6.2 WhatsApp 通道

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/channels` | 租户成员；Agent 限授权店铺 | `storeId`、`status` | 脱敏账号、号码、模板/权限/计费/质量证据状态 |
| GET | `/channels/{channelId}` | 有店铺权限的成员 | 无 | 连接状态、资产 ID、最近回调、真实评级或 `unknown` |
| POST | `/stores/{storeId}/channels/whatsapp` | Owner/Admin | 手动接入所需资产 ID 和凭证，只写 | 创建 `configured` 通道；一个业务号码首版只绑定一个店铺 |
| PUT | `/channels/{channelId}/credentials` | Owner/Admin | 新 token / 资产材料，只写 | 加密轮换并清除旧验证结果；不回传 token |
| POST | `/integrations/whatsapp/embedded-signup/exchange` | Owner/Admin | `storeId`、一次性 `code`、`state`、返回资产摘要 | 条件性后续能力；验证 state 和资产后 `202` 处理；OAuth 成功不等于通道可用 |
| POST | `/channels/{channelId}/verify` | Owner/Admin | Idempotency-Key | `202`；验证资产、权限、Webhook、计费和号码元数据，逐项返回证据 |
| GET | `/channels/{channelId}/templates` | 有店铺权限的成员 | `locale`、`status`、cursor | 来自平台的模板类别、语言、审核状态；没有证据时不伪造批准 |
| POST | `/channels/{channelId}/templates/sync` | Owner/Admin | Idempotency-Key | `202`；同步审核状态 |
| POST | `/channels/{channelId}/test-messages` | Owner/Admin | `templateId`、批准的测试收件人、变量、Idempotency-Key | `202`；只允许测试白名单与合格模板；返回消息资源，不把 accepted 写成 delivered |
| DELETE | `/channels/{channelId}` | Owner | `confirmationPhoneNumber`、`reason`、Idempotency-Key | 停用通道、撤销凭证和排队任务；保留回调与财务证据 |

Embedded Signup、Coexistence 和 BSP 是三条不同接入路径。当前只定义标准 Cloud API 接口边界；Coexistence 与 BSP 需验证资格、同步、计费和退出迁移后再扩展。Baileys / WPPConnect 不提供首发或故障回退 API。

### 6.3 工作流与版本

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/workflows` | Owner/Admin | `storeId`、`status` | 工作流、当前版本、启用状态、阻塞项 |
| POST | `/stores/{storeId}/workflows` | Owner/Admin | 类型、延迟、模板、静默时段、频次、Idempotency-Key | 创建 `draft` v1；Phase 1 只启用 `payment_reminder`，`cod_confirmation` 属 Phase 2 |
| GET | `/workflows/{workflowId}` | Owner/Admin | 无 | 当前配置、readiness、最近运行证据 |
| PATCH | `/workflows/{workflowId}` | Owner/Admin | 完整可变规则、`If-Match` | 每次保存创建不可变新版本；版本竞争返回 `409` |
| GET | `/workflows/{workflowId}/versions` | Owner/Admin | cursor | 版本、创建者、差异和启用历史 |
| POST | `/workflows/{workflowId}/versions/{versionId}/restore` | Owner/Admin | Idempotency-Key | 复制历史快照为新版本，不覆盖历史版本 |
| POST | `/workflows/{workflowId}/preview` | Owner/Admin | 测试订单快照或已有订单 ID | 返回资格判定、计划时间和抑制原因；不发消息、不建正式任务、不扣点 |
| POST | `/workflows/{workflowId}/activate` | Owner/Admin | `versionId`、`acceptedWarnings`、Idempotency-Key | readiness 全部通过才激活；否则 `422 WORKFLOW_NOT_READY` |
| POST | `/workflows/{workflowId}/pause` | Owner/Admin | `reason`、Idempotency-Key | 停止后续 scheduled 任务；已提交消息保留真实状态 |
| GET | `/tasks` | Owner/Admin | `storeId`、`workflowId`、`status`、cursor | 持久任务、计划时间、停止/失败原因；不返回虚构 worker 进度 |
| GET | `/tasks/{taskId}` | Owner/Admin | 无 | 任务事件、尝试次数、第三方消息 ID 和结果证据 |

工作流启用前至少检查：店铺真实连接、通道和用途资格、买家同意来源、获批模板、静默时段、频次、订阅/额度、人工入口、worker 和告警。缺一项时返回 `blocked`，不能通过隐藏 UI 绕过。

## 7. 订单、会话与知识库接口

### 7.1 订单与 COD

订单读取、事件和催付资格属于 Phase 1。以下 COD 商家动作保留为 Phase 2 契约；Phase 1 运行环境必须返回明确 `CAPABILITY_UNAVAILABLE`，不能返回模拟成功。

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/orders` | Owner/Admin/Agent | `storeId`、平台/业务/COD/工作流状态、语言、搜索、cursor | 脱敏订单摘要；Agent 只看授权店铺 |
| GET | `/orders/{orderId}` | Owner/Admin/Agent | 无 | 原平台快照、商品、付款/履约事实、工作流、COD 记录和关联会话 |
| GET | `/orders/{orderId}/events` | Owner/Admin/Agent | `cursor`、`type` | 可审计时间线；accepted/sent/delivered/read 分开 |
| POST | `/orders/{orderId}/cod-actions` | Owner/Admin/已授权 Agent | `action`、`note`、`expectedOrderVersion`、Idempotency-Key | 记录商家决定并停止相应等待任务；不自动改址、取消、发货或退款 |
| POST | `/order-exports` | Owner/Admin | 过滤条件、`format:"csv"`、Idempotency-Key | `202`；只生成授权范围的脱敏导出 |
| GET | `/order-exports/{operationId}` | 发起者/Owner/Admin | 无 | 导出状态；成功时给短期一次性下载地址 |

`cod-actions.action` 首版只接受：

- `confirm_intent`：记录买家确认和商家复核结果，不创建发货单。
- `address_change_reviewed`：记录申请、商家决定及原平台人工处理结果，不自动写回 WooCommerce。
- `cancellation_reviewed`：记录申请与原平台最终结果，不把“申请取消”显示为“已取消”。
- `close_review`：记录商家继续履约或结束核验的决定。

UI 规范中“同意改址并同步回 WooCommerce”的自动写回与 PRD 冲突，首版接口以 PRD 的人工复核边界为准。

### 7.2 会话、翻译和人工接管

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/conversations` | Owner/Admin/Agent | `storeId`、`status`、`assignee`、搜索、cursor | 队列摘要、语言、24h 窗口和脱敏买家信息 |
| GET | `/conversations/{conversationId}` | Owner/Admin/授权 Agent | 无 | 会话、买家、关联订单、接管锁和事实来源摘要 |
| GET | `/conversations/{conversationId}/messages` | Owner/Admin/授权 Agent | `before`、`limit` | 原文、译文、来源、方向和真实通道状态 |
| POST | `/conversations/{conversationId}/claim` | Owner/Admin/授权 Agent | `assigneeId?`、Idempotency-Key | 原子进入 `human_active`，并暂停该买家在该店铺的自动化；并发认领返回 `409` |
| POST | `/conversations/{conversationId}/handoff` | Owner/Admin/当前处理 Agent | `assigneeId`、`reason`、Idempotency-Key | 转交处理权；保留完整历史 |
| POST | `/conversations/{conversationId}/resolve` | Owner/Admin/当前处理 Agent | `resolutionCode`、`note`、Idempotency-Key | 进入 `resolved`，不自动恢复旧任务 |
| POST | `/conversations/{conversationId}/resume` | Owner/Admin | `workflowVersionId`、`reason`、Idempotency-Key | 重新检查付款、发货、退订、窗口和规则；不补发失效提醒 |
| POST | `/conversations/{conversationId}/messages` | Owner/Admin/当前处理 Agent | `text`、`language`、可选模板、Idempotency-Key | `202`；校验服务窗口/模板/退订/身份；人工消息不消耗产品 Credit |
| POST | `/translation-previews` | Owner/Admin/Agent | `text`、`sourceLocale`、`targetLocale`、`context?` | 翻译草稿、术语提示和不确定项；不发送、不发布、不作为事实证明 |

只有买家入站消息可更新 WhatsApp 24 小时服务窗口。窗口关闭后，自由文本发送返回 `422 SERVICE_WINDOW_CLOSED`；满足资格的获批模板作为另一种明确请求，不悄悄改写用户输入。消息请求超时且结果未知时返回消息资源 `status:"unknown"`，由回调/核查确定，不自动重试制造重复发送。

### 7.3 知识库

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/knowledge-items` | Owner/Admin；Agent 只读 | `storeId`、`type`、`status`、`locale`、搜索、cursor | 商品/FAQ、多语言版本、来源和冲突状态 |
| POST | `/stores/{storeId}/knowledge-items` | Owner/Admin | FAQ 源文、多语言草稿、来源、Idempotency-Key | 创建 `draft`；不自动成为回答事实 |
| GET | `/knowledge-items/{itemId}` | Owner/Admin/Agent | 无 | 版本、来源、变量校验和冲突 |
| PATCH | `/knowledge-items/{itemId}` | Owner/Admin | 文案与语言草稿、`If-Match` | 创建新版本并重新运行冲突检测 |
| DELETE | `/knowledge-items/{itemId}` | Owner/Admin | `reason`、Idempotency-Key | 归档，不删除既有会话引用和审计 |
| POST | `/knowledge-items/{itemId}/translation-suggestions` | Owner/Admin | `sourceLocale`、`targetLocales`、Idempotency-Key | `202`；只生成草稿建议，不自动发布 |
| POST | `/knowledge-items/{itemId}/publish` | Owner/Admin | `version`、`reviewNote`、Idempotency-Key | 校验事实/变量/冲突后发布；未解决冲突返回 `422` |
| POST | `/stores/{storeId}/knowledge-syncs` | Owner/Admin | `scope:"products"`、Idempotency-Key | `202`；首版只同步已授权 WooCommerce 商品 |
| GET | `/knowledge-conflicts` | Owner/Admin | `storeId`、`status`、cursor | 跨语言和上游事实冲突 |
| POST | `/knowledge-conflicts/{conflictId}/resolve` | Owner/Admin | 采用来源/人工合并/忽略及理由、Idempotency-Key | 记录裁定版本；存在未解决冲突时相关自动检索保持阻塞 |

首发自动答复语言是印尼语和英语。泰语可以保存为扩展草稿，但在本地评测、模板和人工支持门槛通过前不能进入自动回答发布范围。

## 8. 财务与 Solana Pay 接口

实现状态：billing service 与 11 个 `/api/v1/billing/**` 端点已并入；credit-ledger 与 payment-orders 列表支持 cursor。支付订单创建、Signature 候选持久化/outbox 入队、recheck 入队及账本/订单查询已有代码。Solana settlement evaluator 是纯函数；内部 settlement service 已实现单数据库事务中的候选/订单锁定、转账去重、额度批次、追加账本、订单状态、outbox 与审计写入。但 `0005_billing_solana.sql` 尚未在 PostgreSQL 实际运行，当前也没有 RPC 查询或持久 worker；因此服务端即使收到启用环境变量也会让支付订单创建保持 `503 CAPABILITY_UNAVAILABLE`，且没有真实 finalized 支付的端到端入账验收。退款仍明确返回 `503 CAPABILITY_UNAVAILABLE`；主网未验收，不能视为已启用。以下矩阵描述目标契约，不代表所有字段和能力均已实现。

### 8.1 账本与套餐

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/billing/plans` | Owner/Finance | 无 | 当前已核定价格版本、权益、店铺上限和第三方费用边界 |
| GET | `/billing/summary` | Owner/Finance | 无 | 订阅周期、可用/预留/已消耗/过期/补偿余额、网络和数据更新时间 |
| GET | `/billing/credit-ledger` | Owner/Finance | `type`、`from`、`to`、cursor | 不可变流水；`delta` 为整数字符串，关联批次/窗口/支付订单 |
| GET | `/billing/subscription` | Owner/Finance | 无 | 当前套餐、开始/到期、待生效续费和店铺用量 |
| GET | `/billing/payment-orders` | Owner/Finance | `status`、`purpose`、cursor | 本租户支付订单与真实链上核查状态 |
| GET | `/billing/payment-orders/{paymentOrderId}` | Owner/Finance | 无 | 报价快照、URI、候选、确认状态和异常原因 |

`GET /billing/plans` 只返回经商业确认的价格版本。若价格仍处于内测方案，应明确 `status:"pilot"`，不能让设计稿中的金额成为无条件生产承诺。

### 8.2 创建与核查付款

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| POST | `/billing/payment-orders` | Owner/Finance | `purpose`、`planId` 或整数 `credits`、Idempotency-Key | 创建 20 分钟报价、唯一 reference、网络/mint/收款方/精确金额/权益快照和 Solana Pay URI |
| POST | `/billing/payment-orders/{id}/claims` | Owner/Finance | `signature`、Idempotency-Key | Signature 仅作为候选查询线索；`202`，不直接入账 |
| POST | `/billing/payment-orders/{id}/recheck` | Owner/Finance | Idempotency-Key | 限流触发同一服务端核查流程；RPC 不可用时保持处理中 |
| POST | `/billing/payment-orders/{id}/refund-requests` | Owner/Finance | `reason`、可选收款证明、Idempotency-Key | 冻结可退款未用权益并进入 `manual_pending`；不自动签署退款 |
| GET | `/billing/refund-requests/{refundRequestId}` | Owner/Finance | 无 | 人工复核、冻结、执行证据和保留原因；商户角色不能自行完成退款 |

创建请求示例：

当前 POST 实现的 strict schema 仅接受 `purpose:"credits_topup"` 与正整数 `credits`；尚不支持目标契约中的 `planId` 套餐下单，也不接受客户端 `quoteCurrency`。以下是当前可接受的请求示例。

```json
{
  "purpose": "credits_topup",
  "credits": 2500
}
```

响应核心字段：

```json
{
  "data": {
    "id": "01JEXAMPLEPAYMENT",
    "purpose": "credits_topup",
    "credits": 2500,
    "cluster": "devnet",
    "token": {
      "symbol": "USDC",
      "mint": "server-configured-native-mint",
      "decimals": 6
    },
    "recipient": "server-configured-recipient",
    "amountMinor": "50000000",
    "amountDisplay": "50",
    "reference": "unique-unpredictable-reference",
    "solanaPayUrl": "solana:...",
    "status": "awaiting_payment",
    "expiresAt": "2026-10-07T08:50:00.000Z"
  },
  "meta": {
    "requestId": "01JEXAMPLEREQUESTID",
    "serverTime": "2026-10-07T08:30:00.000Z"
  }
}
```

响应可包含 `amountDisplay` 以及 `token.decimals` 等展示字段。按目标契约，金额、mint、cluster、recipient、权益和价格版本由服务端目录决定；当前创建实现只开放上述整数 Credits 请求，套餐 ID 尚未实现，客户端也不能指定报价货币或其他权威字段。

### 8.3 最终入账规则

reference 只用于寻找候选，不是付款证明。自动入账前必须同时验证：

1. 支付订单属于当前租户和当前环境，测试与正式数据隔离。
2. RPC genesis / cluster 与订单一致，使用允许的原生 USDC mint 和 token program。
3. 交易成功，候选 signature 与完整交易一致。
4. reference 与该笔相关转账匹配，收款 token account / authority 正确。
5. 实收最小单位金额精确等于报价金额，不使用浮点比较。
6. 可信链上付款时间在报价有效期内；时间缺失进入人工复核。
7. 状态达到 `finalized`。`confirmed` 只显示“等待最终确认”。
8. `cluster + signature + transferIndex` 尚未被任何订单占用。

支付订单完成、唯一转账占位、订阅/额度批次和账本流水必须在同一数据库事务提交一次。监听、补偿和人工核查共用同一结算函数。少付、多付、过期、错网络/mint/收款方、重复转账或时间缺失均进入 `review_required`，不自动拼单、按比例发点或要求用户重复付款。

首版退款是人工流程：申请时冻结可退款未用权益；实际链上退款确认后以新的冲销流水记账，不能修改或删除原支付记录。退款地址不能只依据聊天内容或原交易发送地址推断；服务端不自动持有和使用退款签名密钥。

### 8.3 Solana Pay Devnet 支付运行时接口

以下端点均归属于 `/api/v1/payments/**`，提供面向控制台账单页及 Devnet 钱包的即时支付与测试闭环：

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/payments/billing` | 租户成员 | 无 | 读取当前 Devnet 支付租户账单概览与可用 Credits |
| POST | `/payments/session` | 仅本地/测试 | 无 | 创建本地 Devnet 测试会话（非生产模式） |
| GET | `/payments/session` | 租户成员 | 无 | 读取本地测试会话租户 ID |
| POST | `/payments/orders` | 租户成员 | `credits`、`Idempotency-Key` | 创建 20 分钟 Solana Pay 充值报价订单及二维码链接 |
| GET | `/payments/orders/{id}` | 租户成员 | 无 | 读取订单详情、二维码与结账状态 |
| POST | `/payments/orders/{id}` | 租户成员 | 无 | 触发链上对账核对（RPC 查询并流转状态） |
| PATCH | `/payments/orders/{id}` | 租户成员 | `{ status: "cancelled" }` | 仅允许取消 `awaiting_payment` 状态订单 |
| DELETE | `/payments/orders/{id}` | 租户成员 | 无 | 删除订单；已入账 (`credited`) 与确认中 (`confirmed`) 禁止删除 |
| POST | `/payments/sol-test/quote` | 仅开发/测试 | 无 | 创建 0.001 SOL Devnet 测试付款报价 |
| POST | `/payments/sol-test/check` | 仅开发/测试 | `token`、`signature` | 校验 SOL 测试交易签名与链上 finalized 状态 |

## 9. 总览、报表、设置与隐私接口

| 方法 | 路径 | 角色 | 请求 / 查询 | 核心响应与副作用 |
| --- | --- | --- | --- | --- |
| GET | `/dashboard/summary` | 租户成员 | `storeId?` | 角色可见的接入状态、待处理数、额度摘要和真实 KPI；无证据时为 `null/unknown/observing` |
| GET | `/reports/attribution` | Owner/Admin/Finance | `storeId`、`from`、`to`、`metric` | **Phase 2**；提醒/对照样本、观察窗口、分母、差异、数据质量和更新时间 |
| GET | `/settings/preferences` | Owner/Admin | 无 | 店铺时区、工作台语言、货币和支持时间 |
| PATCH | `/settings/preferences` | Owner/Admin | 可变偏好、`If-Match` | 校验 IANA 时区和语言，保存新版本 |
| GET | `/team/members` | Owner/Admin | cursor | 成员、角色、授权店铺与状态 |
| POST | `/team/invitations` | Owner/Admin | 邮箱、角色、授权店铺、Idempotency-Key | Admin 只能邀请 Agent；Owner 才能授予 Finance |
| PATCH | `/team/members/{memberId}` | Owner；Admin 仅 Agent | 角色/店铺、`If-Match` | 服务端校验不能移除最后一个 Owner |
| DELETE | `/team/members/{memberId}` | Owner | `reason`、Idempotency-Key | 撤销会话和权限；不能通过本接口删除自己作为最后 Owner |
| POST | `/report-exports` | Owner/Admin/Finance | 类型、过滤、`format:"csv"`、Idempotency-Key | **Phase 2**；`202`；按角色生成脱敏导出，成功后给短期下载 URL |
| GET | `/report-exports/{operationId}` | 发起者/有权角色 | 无 | **Phase 2**；导出状态、范围、过期时间和一次性下载地址 |
| POST | `/privacy/deletion-requests` | Owner/Admin | `storeId`、`buyerRef`、`reason`、Idempotency-Key | 立即停止相关自动化，进入 `queued/stopping/deleting/completed/retained_with_reason` |
| GET | `/privacy/deletion-requests/{id}` | Owner/Admin | 无 | 清除范围、保留原因、负责人和 30 天截止时间 |
| GET | `/audit-events` | Owner/Admin；Finance 仅财务事件 | 类型、资源、时间、cursor | 脱敏审计；不返回 token、消息全文或无需暴露的 PII |

报表必须带分母、样本量、观察窗口、排除项和数据更新时间。未到 7 天观察期、缺物流结果或样本不足时返回 `observing` / `insufficient_data`，不能使用 UI 线框中的示例数字。

## 10. Webhook 接口

| 方法 | 路径 | 调用方 | 鉴权方式 | 成功条件 |
| --- | --- | --- | --- | --- |
| POST | `/webhooks/woocommerce/{endpointId}` | WooCommerce | 店铺级原始字节 HMAC 签名 | 事件已可靠保存或判定为同内容重复 |
| GET | `/webhooks/whatsapp` | Meta 验证流程 | `hub.mode`、verify token | 原样返回合法 `hub.challenge` |
| POST | `/webhooks/whatsapp` | WhatsApp Cloud API | App Secret 原始字节 HMAC 签名 | 事件已可靠保存或判定为同内容重复 |

### 10.1 WooCommerce

`POST /api/v1/webhooks/woocommerce/{endpointId}`

- `endpointId` 是不可猜测、映射到已验证店铺与 secret 版本的内部标识，不是客户端 tenant ID。
- 使用原始 body 与该店铺 secret 计算 HMAC-SHA256，常量时间比较 `X-WC-Webhook-Signature` base64 值。
- `X-WC-Webhook-Delivery-ID`、Webhook ID、Topic、Resource、Event 用于事件标识和路由证据，但不能代替签名。
- 验签成功后先保存 provider、店铺、delivery ID、事件/接收时间、payload digest 和原始证据引用，再快速返回 2xx。
- 相同事件重复投递只产生一次业务作用；相同 ID 不同 digest 进入冲突复核。
- 事件过旧或状态冲突时查询原平台当前状态；无法查询则暂停该订单自动化。已付款、取消、发货等终态不能被迟到 pending 回退。
- 付款、取消、发货、店铺解绑会停止相关后续任务；首次导入历史订单不批量催付。
- 验签失败、载荷错误或持久化失败不返回虚假成功。连续失败可能导致平台停用 Webhook，因此必须告警和支持恢复。

成功响应保持简单：

```json
{
  "received": true,
  "duplicate": false,
  "eventId": "provider-or-adapter-event-id"
}
```

### 10.2 WhatsApp

- `GET /api/v1/webhooks/whatsapp`：验证 `hub.mode` 与保密的 verify token，成功时原样返回 `hub.challenge` 纯文本。
- `POST /api/v1/webhooks/whatsapp`：使用 App Secret 对原始 body 计算 HMAC-SHA256，常量时间比较 `X-Hub-Signature-256`，通过后才解析。
- verify token 与 App Secret 分开存储、轮换和审计，均不写日志或响应。
- 根据经过验证的 WABA / phone_number_id 映射租户和店铺；未知资产隔离并告警，不能猜测租户。
- WhatsApp 签名不证明首次投递。使用 message/status/业务对象稳定 ID、语义键和数据库唯一约束幂等。
- 入站退订、人工接管、付款和发货停止规则与事件写入须在一致性边界内完成。
- status 回调只推进已有消息，不凭孤立回调制造消息、送达或扣费。`delivered/read` 重复或乱序不重复扣 Credit。
- 当前渠道资格、模板、同意与发送尚未真实验收前，Webhook 可以先保持 `unconfigured`，不能通过 Mock 回调解锁生产自动化。

### 10.3 Webhook 响应和重试

Webhook 不套用浏览器会话响应格式。只有事件已可靠保存/入队后才返回 `200/204`。处理较慢时保存事件后返回，后续由持久 worker 消费。处理结果可在内部审计中查询，不向第三方暴露租户或业务详情。

## 11. 数据模型与事务边界

下表是逻辑模型，不指定 ORM。实际实现须使用 PostgreSQL 迁移、外键/唯一约束和事务，Redis 只做队列、节流或临时协调。

| 领域 | 关键实体 | 必须的约束 |
| --- | --- | --- |
| 身份 | users、otp_challenges、sessions、tenants、memberships、store_grants | session 绑定用户/当前租户；最后 Owner 不能被删除 |
| 接入 | stores、integration_credentials、channels、templates、sync_runs | secret 加密；业务号码唯一归属；验证证据带版本 |
| 买家 | contacts、consents、suppression_entries | 同意含用途/文案版本/来源/时间；退订用最小标识持续抑制 |
| 订单 | orders、order_snapshots、order_events、cod_cases | tenant + platform + external ID 唯一；终态防回退 |
| 会话 | conversations、messages、message_status_events、handoffs | 第三方消息 ID 唯一；状态单调；接管 owner 受并发保护 |
| 工作流 | workflows、workflow_versions、tasks、task_events | 版本不可变；任务幂等键和取消原因可审计 |
| 知识 | knowledge_items、knowledge_versions、knowledge_conflicts | 发布版本不可改；冲突未解阻断自动检索 |
| 财务 | plans、price_versions、payment_orders、transfer_candidates、settled_transfers、subscriptions、credit_batches、credit_ledger、refund_requests | 数量整数；转账位置全局唯一；账本追加写；支付与权益原子 |
| 系统 | operations、webhook_events、idempotency_records、outbox_events、audit_events | 事件、请求摘要、结果和副作用可恢复且可追踪 |

关键一致性边界：

- 退订或人工接管 + 停止排队任务。
- 订单付款/取消/发货 + 停止后续提醒。
- 消息首次明确 delivered + Credit 预留转消耗；重复回调只执行一次。
- finalized 支付 + 转账占位 + 支付订单完成 + 权益批次 + 账本流水。
- 店铺/通道解绑 + 凭证撤销 + 后续任务停止。
- 工作流版本发布 + 当前版本切换 + 审计。

跨第三方系统无法使用数据库事务时采用 outbox / operation 状态与补偿，不能在本地回滚失败时假装外部副作用也被撤销。

## 12. 首版延后与禁止项

以下不进入首轮接口实现，文档中保留边界但不得返回模拟成功：

1. Shopify、TikTok Shop、Shopee、Lazada 和尚未形成订单的弃购 checkout。
2. Telegram、LINE、Messenger、Instagram 等买家消息渠道。
3. Baileys / WPPConnect 扫码接入和“官方 API 故障时自动切换非官方通道”。
4. 未完成 Meta AI 用途资格、账号资产、模板、同意、付款方式及真实回调验收前的生产自动发送。
5. Coexistence 与 BSP 的通用成功接口；它们需独立验证和适配。
6. 泰语等扩展语言进入自动回答；当前只允许作为待审核草稿。
7. 自动修改 WooCommerce 地址、自动取消/发货/退款、自动判断欺诈或“地址真实性”。
8. 自动续费、任意金额折算、法币代收、自动退款、商户手工加点。
9. 浏览器或模型持有退款签名密钥、主网私钥、数据库凭证或通道 token。
10. “模拟 400ms 确认”、固定 RPC 手续费、默认 100 Credits、虚构质量评级或演示 KPI 被当作生产事实。

## 13. 后续验收与补全顺序

阶段 1–4 的代码已有并线版本，接下来按真实依赖完成验收，而不是将代码存在视作功能验收：

1. 在隔离数据库中顺序验证 0001–0005 migration、约束、事务与 ledger 写入；记录未执行或失败项。
2. 在 PostgreSQL 验证 0005，并补齐 RPC 候选核验与持久 worker；再验收 finalized 支付的同事务转账占位、订单完成、权益批次和账本流水。当前已有内部单事务 settlement service 代码，但尚无真实链上端到端验收。
3. 分别验证 WooCommerce 回调/订单同步、WhatsApp Meta 授权/模板/发送/回执，以及工作流停发与重放；未完成时保持 unavailable/blocked。
4. 再推进报表、导出、隐私删除和入驻自检；每项单独记录外部、数据库及浏览器验收证据。

共享契约（身份、错误、Schema、数据库迁移、幂等、审计）变更仍需串行协调；迁移序号由主任务统一管理。

## 14. 文档验收清单

- PRD 3.2 的八大工作台页面、登录/入驻、Webhook、支付和审计均有接口。
- 每个写接口有角色、验证、幂等/版本控制和副作用说明。
- 跨租户资源不可枚举；客户端不能决定 tenant、价格、付款成功或角色。
- 订单、消息、会话、任务和支付状态没有把“已受理”写成“已完成”。
- WooCommerce / WhatsApp 使用原始请求字节验签，并定义重放与乱序处理。
- Solana reference 只作候选索引；confirmed 不入账；finalized 完整校验后原子一次入账。
- API 文档、PRD、AGENTS 和 README 使用 Next.js 全栈口径。
- 当前未实现、条件性接入、人工流程和正式发布门槛均清楚标注。

## 15. 实施前复核资料

以下资料在真正编码和接入时重新核对版本与生效规则；链接证明平台契约，不证明本项目已经完成接入。

- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) 与 [Backend for Frontend](https://nextjs.org/docs/app/guides/backend-for-frontend)：Route Handler、缓存、Server Component、Webhook 和部署限制。
- [WooCommerce Webhooks](https://developer.woocommerce.com/docs/apis/rest-api/v3/webhooks)：签名和订单事件。
- [WhatsApp 接入方式指南](whatsapp-integration-guide.md) 与 [渠道可行性审查](channel-feasibility-review.md)：官方接入、资格、模板、回执和证据边界。
- [Solana Pay Transfer Requests](https://solana.com/docs/tools/solana-pay/quickstart/transfer-requests)：reference、转账请求和服务端验证。
- [Solana getTransaction](https://solana.com/docs/rpc/http/gettransaction)、[getSignatureStatuses](https://solana.com/docs/rpc/http/getsignaturestatuses) 与 [getGenesisHash](https://solana.com/docs/rpc/http/getgenesishash)：完整交易、确认状态和网络校验。
- [Circle USDC 地址](https://developers.circle.com/stablecoins/usdc-contract-addresses)：正式网与 devnet 原生 USDC mint。

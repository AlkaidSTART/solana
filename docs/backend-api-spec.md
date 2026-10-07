# 后端接口与 Zod 强校验契约

- 日期：2026-10-07；版本：设计草案 v0.1，**不是已实现 API**。
- 依据：[PRD v1.1](PRD.md)、[WhatsApp 接入指南](whatsapp-integration-guide.md)、现有工作台页面和 `stores/use-app-store.ts`。
- 计划与验证：[plan.md](plans/2026-10-07-backend-api-contracts/plan.md)、[result.md](plans/2026-10-07-backend-api-contracts/result.md)。
- 首版：WooCommerce 已创建订单、WhatsApp Cloud API、印尼语/英语、商户订阅与 USDC Credits。URL、DTO 和认证方案是建议契约；业务规则遵循 PRD。
- 不包含 Shopify、Telegram、未形成订单的 checkout、泰语、风险评分、自动修改原订单、自动退款和任意金额充值。Demo 类型不作为后端事实模型。

## 1. 架构与关键决策

```text
Next.js 控制台 → 认证/RBAC → NestJS API → Zod 契约 → 领域服务 → PostgreSQL
Webhook → 原始报文验签 → 适配器校验/去重 → 事件 + Outbox → BullMQ Worker
Worker → 发送前复查/额度预留 → WhatsApp → 回执 → 会话/账本/报表
支付查询与补偿 Worker → 服务端链上验证 → 数据库事务入账
```

| 决策 | 采用及理由 | 代价 / 边界 |
| --- | --- | --- |
| ADR-01 | 模块化 NestJS 服务 + Worker | 首版不拆微服务；事务边界仍需明确 |
| ADR-02 | Zod 4 为运行时与 TS 类型单一来源；`z.infer` 派生类型 | 不维护另一套手写 DTO；Schema 不是事实证明 [Z1][Z2] |
| ADR-03 | REST + 游标分页 + 短轮询；异步动作返回 Job | 暂不要求 WebSocket；推送也不能代替权威状态 |
| ADR-04 | 同源安全 Cookie 会话，当前租户来自服务端会话 | 邮箱验证码参考现有页面，认证提供方待确认；钱包不等于身份 |
| ADR-05 | 服务端定价、数据库唯一约束与事务账本 | 不接受前端改价/改余额；Redis 锁不是资金一致性保证 |

Zod 尚非仓库直接依赖；实施时单独安装、锁定版本，不依赖框架传递依赖。本次只交付文档，不建立后端代码或修改依赖。建议后续契约按 auth/stores/workflows/conversations/billing/events 分目录；浏览器只共享无密钥 Schema。

## 2. 通用协议

### 2.1 URL、身份与权限
- 商户接口前缀 `/api/v1`；第 3.1–3.6 节路径相对此前缀。平台 `/internal/v1`、回调 `/webhooks/v1`、短链 `/r` 独立。
- `O` 所有者、`A` 管理员、`S` 客服、`F` 商户财务；`M` 已登录租户成员；`U` 未登录；`P` 平台授权人员。P 与商户角色分离。
- 所有资源、异步 Job、下载按会话租户过滤。UUID 不代表权限；跨租户 404，角色不足 403。
- S 仅访问授权店铺和分配队列，发消息需占有处理权；A 只能邀请/管理客服，不能授予财务权限。禁止移除最后一名所有者。
- Cookie 使用 HttpOnly、Secure、适当 SameSite；写请求检查 CSRF/Origin；登录/切租户轮换会话。OTP 短时、限次数、一次性、服务端哈希保存。
- 只有切租户命令可接受 `tenantId` 且必须校验成员关系；其他商户请求禁止声明租户、操作人和系统角色。

### 2.2 数据、分页与返回值
- JSON camelCase；内部 ID 为 UUID，外部 ID 为有界字符串。时间 UTC ISO 8601；静默时段另存 IANA 时区，不能依赖浏览器时钟。
- 金额用最小单位十进制整数字符串；禁止浮点计算或 JSON BigInt。订单金额附 currency/minorUnit；支付单位以服务端配置为准。
- 成功：`{data: DTO, meta: {requestId, serverTime}}`；列表 `data = {items: DTO[], nextCursor: string|null}`；204 无 body。Webhook、文件下载、短链不套 envelope。
- 列表默认 limit=20，最大100；签名 cursor 绑定租户、筛选和排序。默认 `createdAt DESC, id DESC`；筛选/排序白名单，不接受 SQL 表达式。
- 创建 201，异步受理 202 + Job，普通命令/更新 200，撤销 204。表中另有说明时以该说明为准。
- Job 字段：`id, kind, status(queued|running|succeeded|failed), progress(0..100), resultResourceId(UUID|null), errorCode(string|null), createdAt, updatedAt`。可靠入队后才能受理；Job 成功不等于送达/入账。
- 建议初始限制普通 JSON 256 KiB、Webhook 1 MiB，超限 413；实施前用真实事件调整。字符串/数组也必须有界，不能无限读取报文。

### 2.3 幂等、并发与错误
- POST 业务命令要求 `Idempotency-Key` UUID（OTP、登录、切租户、只读预览除外）。键按租户/操作/资源隔离，同键同内容返回原结果，不同内容 409。
- 普通键建议保留至少24小时；试用、支付、消息、Webhook 的领域去重不依赖此 TTL。此键不保证第三方重复请求一定被去重。
- 可变资源返回 version/ETag；PATCH、删除及接管、分配、恢复、发布、启停、回滚要求 `If-Match`；缺失428，版本冲突409。重放已完成幂等结果先于重新执行版本检查。
- 错误：`{error: {code, message, issues: [{path: (string|number)[], code, message}], retryable}, meta}`。Zod issues 只映射白名单消息，不回显输入或密钥。[Z3]
- 400 JSON/查询语法；401未登录；403权限；404不存在/其他租户；409状态/幂等/版本冲突；422结构或业务不满足；429限流；502/503暂不可用。
- 业务码：VALIDATION_ERROR、VERSION_CONFLICT、IDEMPOTENCY_CONFLICT、CHANNEL_NOT_READY、CONSENT_REQUIRED、TEMPLATE_UNAVAILABLE、WINDOW_CLOSED、HANDOFF_REQUIRED、INSUFFICIENT_CREDITS、SUBSCRIPTION_INACTIVE、PAYMENT_REVIEW_REQUIRED。
- 未知发送结果不能因重试再发一条；Retry-After 与 retryable 区分可重试故障和需要人工修复的问题。

## 3. 接口清单

Request/Response 为待实现的严格 DTO，字段见第4节，复杂 Zod 示例见第5节。`Page<T>` 使用统一分页；`—` 无 JSON body；不能提供任意状态 PATCH。

### 3.1 身份、租户与启用（PRD 3.1、7.1）

| 方法 / 路径 | 权限 | Request → Response | 关键约束 |
| --- | --- | --- | --- |
| POST `/auth/otp/challenges` | U | `{email}` → 202 `{challengeId, expiresAt, retryAfterSeconds}` | 防邮箱枚举，邮箱/IP限流 |
| POST `/auth/otp/verify` | U | `{challengeId, code}` → Session | 6位数字，一次消费，设置Cookie |
| POST `/auth/logout` | M | — → 204 | 撤销服务端会话，CSRF |
| GET `/session` | M | — → Session | 当前身份、租户及权限 |
| POST `/session/tenant` | M | `{tenantId}` → Session | 验证成员并清空旧租户缓存 |
| POST `/tenants` | 已认证用户 | TenantCreate → 201 Tenant | 服务端授予创建者O，market=ID |
| GET `/onboarding` | O/A | — → Readiness | 检查项、阻塞原因、证据时间 |
| POST `/stores/:storeId/activation-checks` | O/A | — → 202 Job | 店铺/通道/同意/模板/演练 |
| POST `/stores/:storeId/activations` | O/A | `{checkId}` → Activation | 复查证据，首次试用原子授予 |
| GET `/jobs/:jobId` | M | — → Job | 仍需原动作权限，不越权查看财务 |

### 3.2 店铺、WhatsApp 与同意（PRD 4）

| 方法 / 路径 | 权限 | Request → Response | 关键约束 |
| --- | --- | --- | --- |
| GET `/stores` | M | StoreQuery → Page<StoreSummary> | 按角色/授权店铺返回最小摘要 |
| POST `/stores` | O/A | StoreConnect → 201 Store | 验证归属/权限，初始verifying |
| GET `/stores/:storeId` | O/A/S | — → Store | 连接健康、同步时间、阻塞项 |
| PATCH `/stores/:storeId` | O/A | StoreSettingsPatch → Store | 禁止改平台和归属 |
| POST `/stores/:storeId/authorizations` | O/A | StoreAuthorization → 202 Job | 仅写新凭证，验证后安全替换 |
| POST `/stores/:storeId/syncs` | O/A | `{scope: orders|products}` → 202 Job | 历史同步不批量催付 |
| DELETE `/stores/:storeId/connection` | O/A | — → 204 | 立即本地停任务/禁用授权；外部解绑失败告警 |
| GET `/stores/:storeId/whatsapp` | O/A | — → Channel | 账号/号码、权限和计费准备 |
| POST `/stores/:storeId/whatsapp` | O/A | ChannelConnect → 201 Channel | 正式授权，校验资产，一号码一店 |
| POST `/stores/:storeId/whatsapp/checks` | O/A | — → 202 Job | 不隐式发送真实消息 |
| POST `/stores/:storeId/whatsapp/test-messages` | O/A | TestMessage → 202 Message | 仅验证过的测试收件人；可能有通道费 |
| DELETE `/stores/:storeId/whatsapp` | O/A | — → 204 | 停止自动化，撤销本地授权 |
| GET `/stores/:storeId/whatsapp/templates` | O/A/S | TemplateQuery → Page<Template> | 平台同步状态，不自行批准 |
| GET `/stores/:storeId/contacts/:contactId/consents` | O/A/S | — → ConsentSummary | 店铺和联系人权限 |
| POST `/stores/:storeId/contacts/:contactId/consents` | O/A | ConsentRecord → 201 Consent | 追加真实证据，订单电话不等于同意 |
| POST `/stores/:storeId/contacts/:contactId/opt-outs` | O/A/S | `{reason}` → ConsentSummary | 立即停止主动提醒，重新启用需新同意 |

Embedded Signup、Coexistence 独立立项后增加授权会话/code exchange 契约，不默认属于首版。ChannelConnect 是正式授权后的受控接入，不索取商户个人密码或绕过审核。

### 3.3 订单、工作流与 COD（PRD 5.1–5.2）

| 方法 / 路径 | 权限 | Request → Response | 关键约束 |
| --- | --- | --- | --- |
| GET `/orders` | O/A/S | OrderQuery → Page<OrderSummary> | 店铺/付款类型/工作流/日期筛选 |
| GET `/orders/:orderId` | O/A/S | — → OrderDetail | 原平台状态、同步时间、来源链接 |
| GET `/orders/:orderId/events` | O/A/S | PageQuery → Page<OrderEvent> | 决策证据和抑制/停止原因 |
| POST `/orders/:orderId/refreshes` | O/A/S | — → 202 Job | 源查询失败停自动化，不改源订单 |
| GET `/workflows` | O/A | `{storeId, ...page}` → Page<Workflow> | 规则配置和运行实例分开 |
| POST `/workflows` | O/A | WorkflowWrite → 201 Workflow | 创建草稿，套餐功能校验 |
| PATCH `/workflows/:workflowId` | O/A | WorkflowWrite → Workflow | 完整替换配置并生成版本，storeId/kind不可变 |
| POST `/workflows/:workflowId/previews` | O/A | `{orderId}` → WorkflowPreview | 无发送/扣费，显示资格和检查时点 |
| POST `/workflows/:workflowId/enables` | O/A | — → Workflow | 通道/模板/套餐/额度启用检查 |
| POST `/workflows/:workflowId/pauses` | O/A | `{reason}` → Workflow | 停排队；已提交消息不能撤回 |
| GET `/workflows/:workflowId/versions` | O/A | PageQuery → Page<WorkflowVersion> | 历史配置、操作者和原因 |
| POST `/workflows/:workflowId/rollbacks` | O/A | `{targetVersion, reason}` → Workflow | 创建新版本，不覆盖历史 |
| GET `/orders/:orderId/cod` | O/A/S | — → CodCase | 申请≠订单取消或改址完成 |
| PATCH `/orders/:orderId/cod/deadline` | O/A/S | `{shippingDeadline}` → CodCase | 必须真实截止时间 |
| POST `/orders/:orderId/cod/decisions` | O/A/S | CodDecision → CodCase | 人工证据；不自动改址/取消/发货 |
| POST `/orders/:orderId/delivery-results` | O/A/S | DeliveryResult → 201 OrderEvent | 核实来源，未知不填成功 |

### 3.4 会话、人工队列与知识（PRD 5.3–5.4）

| 方法 / 路径 | 权限 | Request → Response | 关键约束 |
| --- | --- | --- | --- |
| GET `/conversations` | O/A/S | ConversationQuery → Page<Conversation> | 状态/负责人/授权队列 |
| GET `/conversations/:conversationId` | O/A/S | — → ConversationDetail | 身份核验、两种窗口分开 |
| GET `/conversations/:conversationId/messages` | O/A/S | PageQuery → Page<Message> | 消息证据和来源，不虚构已读 |
| POST `/conversations/:conversationId/handoffs` | O/A/S | `{reason}` → Conversation | 暂停该买家在本店所有自动化 |
| POST `/conversations/:conversationId/claims` | O/A/S | — → Conversation | 同时抢占仅一人成功 |
| POST `/conversations/:conversationId/assignments` | O/A/S | `{assigneeId, reason}` → Conversation | S仅交接持有会话；目标已有店铺权限 |
| POST `/conversations/:conversationId/messages` | O/A/S | ManualMessage → 202 Message | 处理权/窗口/模板/同意；人工不扣Credits |
| POST `/conversations/:conversationId/resolutions` | O/A/S | `{outcome, note}` → Conversation | resolved不自动恢复AI |
| POST `/conversations/:conversationId/resumptions` | O/A/S | `{reason}` → Conversation | 处理权+资格复查，不补发过期提醒 |
| POST `/conversations/:conversationId/identity-checks` | O/A/S | IdentityCheck → 201 IdentityEvidence | 订单、核验方法及证据 |
| GET `/knowledge/items` | O/A | KnowledgeQuery → Page<KnowledgeItem> | 草稿/待审/已发布/冲突 |
| POST `/knowledge/items` | O/A | KnowledgeWrite → 201 KnowledgeItem | 创建草稿，首发id/en |
| PATCH `/knowledge/items/:itemId` | O/A | KnowledgeWrite → KnowledgeItem | 已发布项修改生成草稿 |
| POST `/knowledge/items/:itemId/reviews` | O/A | `{decision: approve|reject, reason}` → KnowledgeItem | 审核绑定版本，冲突阻断 |
| POST `/knowledge/items/:itemId/publications` | O/A | `{revision}` → KnowledgeItem | 来源/审核版本一致 |
| DELETE `/knowledge/items/:itemId` | O/A | — → 204 | 立即停止检索引用，保留历史证据 |
| GET `/knowledge/conflicts` | O/A | `{storeId, ...page}` → Page<KnowledgeConflict> | 来源与待修订版本 |

翻译预览和俚语注解是待确认 UI 增强，不等于发送；模型输出不得直接调用人工发送接口。

### 3.5 订阅、Credits 与支付（PRD 6）

| 方法 / 路径 | 权限 | Request → Response | 关键约束 |
| --- | --- | --- | --- |
| GET `/billing/catalog` | O/F | — → PriceCatalog | 价格版本、权益、有效期和费用声明 |
| GET `/billing/subscription` | O/F | — → Subscription | 当前/下一周期和店铺上限 |
| GET `/entitlements` | M | — → Entitlements | 仅功能和预算提示，非财务明细 |
| PUT `/billing/subscription/retained-stores` | O | `{storeIds}` → Subscription | If-Match；下周期超限停用策略 |
| GET `/billing/credits` | O/F | — → CreditBalance | 可用/预留/消耗/过期/补偿及批次 |
| GET `/billing/ledger` | O/F | LedgerQuery → Page<LedgerEntry> | 不可变，关联窗口/消息/支付 |
| POST `/billing/payment-orders` | O/F | PaymentOrderCreate → 201 PaymentOrder | 服务端定价，固定20分钟报价 |
| GET `/billing/payment-orders` | O/F | PaymentQuery → Page<PaymentOrder> | 环境隔离、用途明确 |
| GET `/billing/payment-orders/:paymentOrderId` | O/F | — → PaymentOrder | 页面关闭后仍持续跟踪 |
| POST `/billing/payment-orders/:paymentOrderId/candidates` | O/F | `{signature}` → 202 Job | 仅线索，不入账，不覆盖其他候选 |
| POST `/billing/payment-orders/:paymentOrderId/appeals` | O/F | `{signature, reason}` → 201 FinancialCase | 无法改订单金额/绕过校验 |
| POST `/billing/payment-orders/:paymentOrderId/refund-requests` | O/F | RefundRequest → 201 FinancialCase | 冻结未消耗权益，人工核实 |
| GET `/billing/cases/:caseId` | O/F | — → FinancialCase | 进度、材料缺口、冻结和结果 |

没有手工加点、前端“确认到账”或自动续扣接口。试用在 activation 事务授予；Enterprise 使用有效合同报价，不能手填价格。

### 3.6 报表、成员、隐私与审计（PRD 2、7）

| 方法 / 路径 | 权限 | Request → Response | 关键约束 |
| --- | --- | --- | --- |
| GET `/dashboard` | M | ReportQuery → Dashboard | 按角色裁剪业务/财务数据 |
| GET `/reports/outcomes` | O/A | ReportQuery → OutcomeReport | 分组、分母、窗口、完整性/未知数 |
| GET `/settings` | M | — → TenantSettings | 工作台语言、人工服务时间 |
| PATCH `/settings` | O/A | TenantSettingsPatch → TenantSettings | 不得通过设置改变财务/成员权限 |
| GET `/members` | O/A | PageQuery → Page<Member> | A只返回客服管理视图 |
| POST `/invitations` | O/A | MemberInvite → 201 Invitation | A只能邀请S，校验店铺/队列 |
| POST `/invitations/acceptances` | 已认证用户 | `{token}` → Membership | 指定邮箱，一次性消费 |
| DELETE `/invitations/:invitationId` | O/A | — → 204 | A仅撤销客服邀请 |
| PATCH `/members/:memberId` | O/A | MemberPermissions → Member | 防提权，回收权限即时生效 |
| DELETE `/members/:memberId` | O/A | — → 204 | 保护最后O，回收会话与队列 |
| POST `/privacy/exports` | O/A/F | ExportRequest → 202 Job | A仅业务，F仅财务，O两者 |
| GET `/privacy/exports/:jobId/download` | 原授权角色 | — → 下载流 | 重新验权限，短时有效，无公开永久链接 |
| POST `/privacy/deletion-requests` | O/A | DeletionRequest → 201 DeletionCase | 删除租户仅O，立即停相关自动化 |
| GET `/privacy/deletion-requests/:caseId` | O/A | — → DeletionCase | 留存原因/期限、进度和截止日期 |
| GET `/audit-events` | O/A | AuditQuery → Page<AuditEvent> | A无财务审计，记录不可修改 |

删除是申请而非物理清空；执行 PRD 的90天/12个月/30天规则，财务留存期限待商业发布前明确。

### 3.7 外部入口与平台专用接口

以下是完整路径，普通商户会话不得访问平台接口。

| 方法 / 路径 | 身份 | 输入 → 输出 / 约束 |
| --- | --- | --- |
| GET `/webhooks/v1/whatsapp` | 验证挑战 | 检查verify token后返回challenge原文，不代替事件验签 |
| POST `/webhooks/v1/whatsapp` | Meta签名 | 原始字节验签→适配器→持久事件→平台协议响应 |
| POST `/webhooks/v1/woocommerce/:connectionId` | 店铺签名 | 按绑定配置验签，不信payload租户；持久化后响应 |
| GET `/r/:opaqueToken` | 短链持有者 | 302到授权店铺白名单目标；无效404；不接受redirect参数 |
| POST `/internal/v1/support-grants` | 支持授权P | `{tenantId, scope, reason, expiresAt, approvalId}` → Grant；无常驻全租户访问 |
| GET `/internal/v1/financial-cases` | 平台财务P | 分页脱敏待复核事项，不继承商户F |
| POST `/internal/v1/financial-cases/:caseId/rechecks` | 平台财务P | 202 Job，复用自动监听校验入口 |
| POST `/internal/v1/ledger-adjustments` | 财务提出者P | 账本关联/理由/精确变动/证据→待复核提案 |
| POST `/internal/v1/ledger-adjustments/:proposalId/approvals` | 另一财务P | 禁止自审；唯一执行、事务补偿、前后余额审计 |
| POST `/internal/v1/refund-cases/:caseId/settlements` | 独立财务P | 退款线索→202核验Job；核实后冲销，不在SaaS签名 |

Webhook 独立验签、大小/速率限制、去重，不套商户CSRF。链上回调只能作为候选信号。平台 POST 也要求幂等/资源版本/审计。签名算法和原生payload必须在适配器实施时按官方版本核验，不凭本文猜测。

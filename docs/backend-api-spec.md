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

续作核对时 `package.json` 已声明 `zod: ^4.6.5`，本地解析版本为 4.6.5；使用仓库直接依赖及锁文件，不依赖框架传递依赖。本次只交付文档，不建立后端代码或修改依赖。建议后续契约按 auth/stores/workflows/conversations/billing/events 分目录；浏览器只共享无密钥 Schema。

## 2. 通用协议

### 2.1 URL、身份与权限
- 商户接口前缀 `/api/v1`；第 3.1–3.6 节路径相对此前缀。平台 `/internal/v1`、回调 `/webhooks/v1`、短链 `/r` 独立。
- `O` 所有者、`A` 管理员、`S` 客服、`F` 商户财务；`M` 已登录租户成员；`U` 未登录；`P` 平台授权人员。P 与商户角色分离。
- 所有资源、异步 Job、下载按会话租户过滤。UUID 不代表权限；跨租户 404，角色不足 403。
- S 仅访问授权店铺和分配队列，发消息需占有处理权；A 只能邀请/管理客服，不能授予财务权限。禁止移除最后一名所有者。
- Cookie 使用 HttpOnly、Secure、适当 SameSite；写请求检查 CSRF/Origin；登录/切租户轮换会话。OTP 短时、限次数、一次性、服务端哈希保存。
- 除平台独立授权接口外，只有切租户命令可接受 `tenantId` 且必须校验成员关系；其他商户请求禁止声明租户、操作人和系统角色。

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

## 4. DTO 字段契约

以下为待实现字段约定，不是从 Demo 推断出的现成接口。`?` 表示可省略，`|null` 表示返回时明确为空；未标 `?` 的字段必须存在。复杂嵌套不得用 `Record<string, any>` 代替。

### 4.1 公共类型、身份和入驻

- `Id`：UUID；`ExternalId`：1–128 字符；`UtcTime`：带 `Z` 的 UTC ISO 时间；`Language`：`id|en`；`Reason`：去首尾空白后 1–500 字符。
- `Money`：`{amountMinor: 无符号十进制整数字符串, currency: 三位大写代码, minorUnit: 0..6整数}`；负向流水用 direction 表示。允许币种/精度由服务端配置，格式合法不代表币种被支持。
- 可变资源共享 `id, version(正整数), createdAt, updatedAt`；版本与 ETag 一致。不可变事件/流水只有 `id, createdAt`，不得伪造更新接口。
- `PageQuery`：`limit?: "1".."100"`（默认20）、`cursor?: 1..2048字符`；从 HTTP query 的单字符串解析；重复键/未知键拒绝。第5节转换后的 limit 是整数。
- 文中未重复展开的 ID 路径/简短 body 也必须用 strictObject 校验，不能只给“大对象”装校验器。

| DTO | 字段及含义 | 额外约束 |
| --- | --- | --- |
| Session | `user:{id,email}, currentTenantId:Id|null, memberships:[{tenantId,roles,storeIds,queueIds}], expiresAt` | roles是显式授予角色集合；未加入租户仍可创建租户 |
| TenantCreate / Tenant | 输入 `name(1..100), market:"ID", language, timezone`；输出增加公共资源字段 | 创建者由会话确定；不接受ownerId或roles |
| Readiness | `storeId, checkId:Id|null, checkedAt:UtcTime|null, ready:boolean, checks:[{code,status:passed|failed|pending,reasonCode:string|null,evidenceAt:UtcTime|null}]` | 激活时复查证据，不信浏览器ready |
| Activation | `storeId, status:active|blocked, checkedAt, reasonCodes:string[], trial:{granted:boolean,expiresAt:UtcTime|null}` | trial=false不一定失败，可能已经领取过 |
| Job | 第2.2节字段；`kind`为服务端支持的动作枚举 | 不返回第三方原文错误/密钥；成功结果还需读取目标资源 |

### 4.2 店铺、授权与同意

| DTO | 字段及约束 |
| --- | --- |
| StoreConnect | `platform:"woocommerce", name, baseUrl(HTTPS), timezone, language, authorization:{consumerKey,consumerSecret}`；两个密钥为有界非空字符串，仅输入 |
| StoreAuthorization | `{consumerKey,consumerSecret}`，加密暂存并验证，新授权成功后替换旧授权；失败不返回密钥 |
| StoreSettingsPatch | 非空对象，只允许 `name?, timezone?, language?`；不允许baseUrl/platform/tenantId |
| StoreSummary / Store | 摘要 `id,name,platform,status,language,timezone,version`；详情增加 `baseUrl,lastSyncedAt|null,authorizationStatus,blockedReasons,createdAt,updatedAt`；status=`verifying|active|degraded|disconnected` |
| ChannelConnect / Channel | 输入 `wabaId,phoneNumberId,accessToken`；输出 `id,storeId,wabaId,phoneNumberId,displayPhoneMasked,status,permissionsReady,billingReady,checkedAt|null,blockedReasons,version,createdAt,updatedAt`；status=`verifying|ready|blocked|disconnected` |
| TestMessage | `verifiedRecipientId:Id, message:模板分支ManualMessage`；测试联系人需事先核验、明确同意，不能任意输入手机号群发 |
| Template | `id,externalId,name,language,category,status,components,checkedAt`；category=`marketing|utility|authentication|unknown`；status=`approved|pending|rejected|paused|disabled|unknown`；components为有上限的text参数/按钮元数据，不透传任意对象 |
| ConsentRecord / Consent | 输入见第5节：用途、来源、文案版本、采集时间、证据引用；输出增加 `id,storeId,contactId,recordedAt,revokedAt|null`；一条记录一种用途 |
| ConsentSummary | `storeId,contactId,activePurposes,latestEvidenceIds,optedOutAt|null,version`；撤销事件独立追加，禁止改写旧证据 |

baseUrl 通过 Zod 的 URL 格式校验后，服务端仍须拦截私网/回环/元数据地址、DNS 重绑定和未重新校验的重定向。密钥不出现在读接口、任务、日志或导出中。联系人/测试收件人由店铺同步或受控启用流程产生；首次实施需定义证据采集 UI，不开放批量导入未获同意的号码。

### 4.3 订单、工作流与会话

| DTO | 字段及约束 |
| --- | --- |
| OrderSummary | `id,storeId,externalId,displayNumber,paymentMethod:prepaid|cod|unknown,paymentStatus:unpaid|paid|unknown,fulfillmentStatus:unfulfilled|shipped|delivered|unknown,cancelled:boolean,total:Money,sourceCreatedAt,lastSyncedAt,contactId:Id|null,automationStatus:eligible|running|stopped|blocked,reasonCodes` |
| OrderDetail / OrderEvent | 详情增加 `items:[{externalProductId,name,quantity,unitPrice:Money}], contactMasked,sourceUrl,codCaseId|null`；事件 `id,orderId,type,source,occurredAt,receivedAt,reasonCode|null,evidenceId|null`；敏感订单详情核对访问者权限 |
| WorkflowWrite / Workflow | 输入见第5节；输出公共字段 + 配置 + `status:draft|enabled|paused,activeRevision,blockedReasons`；更新必须提交完整配置，店铺和kind不可变 |
| WorkflowVersion / WorkflowPreview | 版本 `id,workflowId,revision,config:WorkflowWrite,actorId,reason,createdAt`；预览 `orderId,evaluatedAt,eligible,checks:[{code,passed,reasonCode|null}],nextAttemptAt|null,estimatedCreditReservation:0|1`；预览结果不能充当发送许可 |
| CodCase | `id,orderId,state:pending|confirmed|address_change_requested|cancellation_requested|no_response|contact_unreachable|closed,shippingDeadline:UtcTime|null,assignedTo:Id|null,lastEvidenceId:Id|null,sourceResult:pending|applied|rejected|unknown,version` |
| CodDecision | `action:confirm|request_address_change|request_cancel|continue_fulfillment|close, evidenceId,reason`；改址分支额外 `proposedAddress:{countryCode:"ID",region,city,lines:string[],postalCode?}`；其他分支禁止地址字段，申请不等于原平台已执行 |
| DeliveryResult | `outcome:delivered|refused|returned|unknown,occurredAt,source:store|carrier|merchant,evidenceId,reason?`；无证据不能将unknown改为成功 |
| Conversation / ConversationDetail | `id,storeId,contactId,language,status:open|waiting_human|human_owned|resolved,assigneeId:Id|null,queueId:Id|null,automationPaused,serviceWindowEndsAt:UtcTime|null,billingWindow:{id,startedAt,endsAt,automatedMessageCount}|null,version,createdAt,updatedAt`；详情增加关联orderIds和identityEvidence摘要 |
| Message | `id,conversationId,direction:inbound|outbound,origin:buyer|human|automation,type:text|template|unsupported,body:string|null,templateId:Id|null,status:received|queued|accepted|sent|delivered|read|failed|unknown,providerMessageId:string|null,occurredAt,statusUpdatedAt,errorCode:null|string`；正文按权限返回，未知媒体不伪造成文本 |
| ManualMessage | 见第5节区分联合；会话/操作者由路由和会话推导，不接收status、origin或扣点字段 |
| IdentityCheck / IdentityEvidence | 输入 `orderId,method:store_verified_contact|merchant_verification,evidenceId,verifiedAt`；输出增加 `id,conversationId,actorId,createdAt`；不能仅声明verified=true，也不保存验证码原文 |
| KnowledgeWrite / KnowledgeItem | 输入见第5节；输出公共字段 + `revision,status:draft|in_review|approved|published|rejected|withdrawn,reviewedRevision:null|integer,publishedRevision:null|integer,conflictIds:Id[]`；修改产生新修订，不默默改线上内容 |
| KnowledgeConflict | `id,storeId,itemIds,reasonCode,detectedAt,resolvedAt:UtcTime|null`；发布前确认冲突已解决 |

发送等待队列的状态与源订单状态分开。语言、同意、可用模板、静默时段、发货截止、额度、套餐、主动频控均在真正发送前重新求值。付款/取消/发货/退订/人工接管/解绑可以停止任务，不能声称撤回已提交消息。

### 4.4 财务、报告、成员与隐私

| DTO | 字段及约束 |
| --- | --- |
| PriceCatalog | `version,effectiveAt,plans:[{planId,price:Money,credits,storeLimit,features:string[]}],creditPack:{minimumCredits:100,unitPrice:Money},externalFeeNotice`；Enterprise需合同报价，不以最低标价自助结算 |
| Subscription | `id,status:trial|active|expired|suspended,currentPeriod:{planId,startsAt,endsAt,storeLimit}|null,nextPeriod:{planId,startsAt,endsAt}|null,retainedStoreIds:Id[],version` |
| Entitlements | `features,storeLimit,automationAllowed,reasonCodes`；只返回可操作能力，不给A/S泄露余额和支付流水 |
| CreditBalance | `available,reserved,consumed,expired,compensated`均为无符号整数字符串；`batches:[{id,source:trial|subscription|purchase|compensation,remaining,expiresAt}],asOf`；流水是权威源 |
| LedgerEntry | `id,type:grant|reserve|consume|release|expire|compensate|refund,direction:increase|decrease,quantity,account:available|reserved|consumed|expired,transactionId,windowId|null,messageId|null,paymentOrderId|null,reasonCode,createdAt`；quantity为正整数字符串，同一交易可有多账户分录 |
| PaymentOrderCreate / PaymentOrder | 请求与关键响应见第5节；用途区分订阅/续费/加购，priceVersion决定服务端报价；金额、网络、mint、recipient、reference、有效期和权益快照禁止由请求覆盖 |
| RefundRequest / FinancialCase | 请求 `{reason,signature,requestedCreditQuantity:正整数字符串}`，只是申请不是承诺退款；case输出 `id,paymentOrderId,kind:appeal|refund,status:submitted|reviewing|needs_evidence|resolved|rejected,frozenCredits,reasonCode,createdAt,updatedAt,version`；补充地址须独立核对，不能直接按转账发送方退回 |
| ReportQuery / Dashboard / OutcomeReport | 查询 `{storeId?,from,to,groupBy:day|store}`，UTC半开区间 `[from,to)`，from<to，建议最多90天；报告 `{from,to,asOf,definitionsVersion,groups:[{key,eligibleOrders,contactedOrders,paidOrders,unknownOrders,attributedRevenue:Money|null}],completeness:complete|partial,unknownReasons}`；Dashboard按角色只组合可见摘要，不能用模型推断付款/签收 |
| TenantSettings / TenantSettingsPatch | 输出 `language,humanServiceHours:{timezone,weekdays:1..7的去重数组,start:HH:mm,end:HH:mm},version`；写入只能更新上述配置，非空PATCH |
| MemberInvite / MemberPermissions | 邀请增加email；权限输入 `{roles:(owner|admin|support|finance)[],storeIds:Id[],queueIds:Id[]}`，去重且有界，roles非空；A仅能操作纯support成员，不得借其他数组升级权限 |
| Member / Membership / Invitation | Member=`{id,userId,displayName,roles,storeIds,queueIds,version}`；Membership增加tenantId；Invitation=`{id,emailMasked,roles,storeIds,queueIds,status:pending|accepted|revoked|expired,expiresAt,version}`；不返回邀请token |
| ExportRequest | 区分 `{scope:"business",storeIds,from,to}` / `{scope:"financial",from,to}`；字段/店铺范围由权限裁剪；生成与下载都复查权限 |
| DeletionRequest / DeletionCase | 输入区分 `{scope:"contact",storeId,contactId,reason}` / `{scope:"store",storeId,reason}` / `{scope:"tenant",reason}`；case返回 `id,scope,status:requested|processing|completed|partially_retained,dueAt,retained:[{category,reason,expiresAt|null}],version` |
| AuditEvent | `id,actorId,action,resourceType,resourceId,occurredAt,requestId,reasonCode,changes:[{field,beforeSummary,afterSummary}]`；脱敏摘要非密钥/聊天原文；平台访问包含grantId |

其他列表查询均扩展 PageQuery 并拒绝未知键：StoreQuery=`status?`；TemplateQuery=`language?,status?`；OrderQuery=`storeId?,paymentMethod?,paymentStatus?,automationStatus?,from?,to?`；ConversationQuery=`storeId?,status?,assigneeId?,queueId?`；KnowledgeQuery=`storeId?,language?,status?`；LedgerQuery=`type?,from?,to?`；PaymentQuery=`purpose?,status?,from?,to?`（环境由部署隔离，不允许客户端切主网）；AuditQuery=`action?,resourceId?,from?,to?`。日期成对提供、顺序有效；枚举必须复用对应资源 Schema。

## 5. Zod 4 强校验示例

以下一个 TypeScript 代码块可独立提取运行（Zod 4、ES2020+、strict）。涵盖金额、查询、同意、工作流、人工消息、知识、支付及归一化事件；**不是全部接口的实现**。其余 DTO 实施时也必须建立请求/响应 Schema，不能用未校验的强制类型转换补齐。API 用法已核对官方 [Z1]–[Z3]。

- 对自有 API 对象使用 `z.strictObject` 拒绝额外字段；重复 query 参数在 HTTP 适配层拒绝，数字字符串按白名单显式转换，不能把空字符串当0或 `"false"` 当true。
- 请求验证失败返回422（查询语法错误400）；响应验证失败是服务端错误，记录脱敏事件并返回500，不能归咎于用户。
- 外部原生 payload 与本服务 DTO 分层：提供方新加字段不应使全量 Webhook 永久失败。原生适配器校验实际消费字段，未知字段受限保留或忽略；再投影为下面的严格内部事件。

```ts
import { z } from "zod";

export const IdSchema = z.uuid();
const ExternalIdSchema = z.string().min(1).max(128);
const UtcTimeSchema = z.iso.datetime();
const LanguageSchema = z.enum(["id", "en"]);
const ReasonSchema = z.string().trim().min(1).max(500);
const VersionSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const TimeOfDaySchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const TimezoneSchema = z.string().min(1).max(100).refine((value) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}, "INVALID_TIMEZONE");

export const MinorAmountSchema = z.string().max(20).regex(/^(0|[1-9]\d*)$/);
const PositiveQuantitySchema = MinorAmountSchema.refine((v) => v !== "0");
const UsdcAmountSchema = PositiveQuantitySchema.pipe(z.string().refine(
  (v) => BigInt(v) <= 18446744073709551615n,
  "AMOUNT_OUT_OF_RANGE",
));
export const MoneySchema = z.strictObject({
  amountMinor: MinorAmountSchema,
  currency: z.string().regex(/^[A-Z]{3}$/),
  minorUnit: z.number().int().min(0).max(6),
});
export const PageQuerySchema = z.strictObject({
  limit: z.string().regex(/^(?:[1-9]|[1-9]\d|100)$/).default("20")
    .transform((value) => Number(value)),
  cursor: z.string().min(1).max(2048).optional(),
});

export const ConsentRecordSchema = z.strictObject({
  purpose: z.enum(["payment_reminder", "cod_confirmation"]),
  source: z.enum(["checkout_checkbox", "customer_message", "merchant_record"]),
  textVersion: z.string().trim().min(1).max(100),
  collectedAt: UtcTimeSchema,
  evidenceId: IdSchema,
});
const QuietHoursSchema = z.strictObject({
  timezone: TimezoneSchema,
  start: TimeOfDaySchema,
  end: TimeOfDaySchema,
}).refine((v) => v.start !== v.end, "AMBIGUOUS_QUIET_HOURS");
const workflowBase = {
  storeId: IdSchema,
  name: z.string().trim().min(1).max(100),
  language: LanguageSchema,
  templateId: IdSchema,
  secondReminderEnabled: z.boolean(),
  quietHours: QuietHoursSchema,
};
export const WorkflowWriteSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    ...workflowBase,
    kind: z.literal("payment_reminder"),
    firstDelayMinutes: z.literal(15),
    lateEventMaxAgeMinutes: z.literal(120),
    secondDelayHours: z.literal(6),
    expiresAfterHours: z.literal(24),
  }),
  z.strictObject({
    ...workflowBase,
    kind: z.literal("cod_confirmation"),
    firstDelayMinutes: z.literal(5),
    noResponseHours: z.literal(12),
    deadlineSource: z.literal("order_shipping_deadline"),
  }),
]);
// 固定数值来自PRD，不能由请求扩大频控/服务窗口。
// 实际发货截止是每张订单的事实，不是创建规则时编造的未来时间。
export const CodDeadlineSchema = z.strictObject({ shippingDeadline: UtcTimeSchema });

const TemplateParameterSchema = z.strictObject({
  name: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/),
  value: z.string().trim().min(1).max(1024),
});
export const ManualMessageSchema = z.discriminatedUnion("type", [
  z.strictObject({
    type: z.literal("text"),
    text: z.string().trim().min(1).max(4096),
  }),
  z.strictObject({
    type: z.literal("template"),
    templateId: IdSchema,
    language: LanguageSchema,
    parameters: z.array(TemplateParameterSchema).max(20).refine(
      (items) => new Set(items.map((item) => item.name)).size === items.length,
      "DUPLICATE_PARAMETER",
    ),
  }),
]);
export const KnowledgeWriteSchema = z.strictObject({
  storeId: IdSchema,
  kind: z.enum(["product", "shipping", "cod", "faq"]),
  language: LanguageSchema,
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20000),
  source: z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("store_product"), externalProductId: ExternalIdSchema }),
    z.strictObject({ kind: z.literal("merchant"), evidenceId: IdSchema }),
  ]),
  effectiveFrom: UtcTimeSchema,
  effectiveUntil: UtcTimeSchema.nullable(),
}).superRefine((value, ctx) => {
  if (value.effectiveUntil !== null &&
      Date.parse(value.effectiveUntil) <= Date.parse(value.effectiveFrom)) {
    ctx.addIssue({ code: "custom", path: ["effectiveUntil"], message: "INVALID_TIME_RANGE" });
  }
  if (value.source.kind === "store_product" && value.kind !== "product") {
    ctx.addIssue({ code: "custom", path: ["source"], message: "SOURCE_KIND_MISMATCH" });
  }
});

const priceVersion = z.string().trim().min(1).max(100);
const PlanChoiceSchema = z.discriminatedUnion("planId", [
  z.strictObject({ planId: z.literal("starter") }),
  z.strictObject({ planId: z.literal("growth") }),
  z.strictObject({ planId: z.literal("enterprise"), contractQuoteId: IdSchema }),
]);
export const PaymentOrderCreateSchema = z.discriminatedUnion("purpose", [
  z.strictObject({ purpose: z.literal("subscription"), plan: PlanChoiceSchema, priceVersion }),
  z.strictObject({ purpose: z.literal("renewal"), plan: PlanChoiceSchema, priceVersion }),
  z.strictObject({
    purpose: z.literal("credit_pack"),
    credits: z.number().int().min(100).max(Number.MAX_SAFE_INTEGER),
    priceVersion,
  }),
]);
// 不做大额加购的浮点乘法：服务端取整数量后用BigInt计算，并验证报价金额上限。
// 网络地址/签名的正则只验证编码形状，服务端SDK还须解码检查32/64字节。
const PublicKeySchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
const SignatureSchema = z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{64,88}$/);
export const PaymentCandidateSchema = z.strictObject({ signature: SignatureSchema });
const EntitlementSnapshotSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("subscription"),
    planId: z.enum(["starter", "growth", "enterprise"]),
    credits: PositiveQuantitySchema,
    storeLimit: z.number().int().positive(),
    startsAt: UtcTimeSchema,
    endsAt: UtcTimeSchema,
  }),
  z.strictObject({ kind: z.literal("credit_pack"), credits: PositiveQuantitySchema }),
]);
export const PaymentOrderSchema = z.strictObject({
  id: IdSchema,
  version: VersionSchema,
  purpose: z.enum(["subscription", "renewal", "credit_pack"]),
  status: z.enum(["awaiting_payment", "detected", "confirming", "credited", "expired", "review_required"]),
  priceVersion,
  network: z.enum(["solana-mainnet", "solana-devnet"]),
  mint: PublicKeySchema,
  recipient: PublicKeySchema,
  reference: PublicKeySchema,
  amountMinor: UsdcAmountSchema,
  decimals: z.literal(6),
  createdAt: UtcTimeSchema,
  updatedAt: UtcTimeSchema,
  expiresAt: UtcTimeSchema,
  entitlement: EntitlementSnapshotSchema,
  payUrl: z.string().max(4096).refine((v) => {
    try { return new URL(v).protocol === "solana:"; } catch { return false; }
  }, "INVALID_PAY_URL"),
  creditedAt: UtcTimeSchema.nullable(),
  settledSignature: SignatureSchema.nullable(),
}).superRefine((value, ctx) => {
  const issue = (path: string, message: string) => {
    ctx.addIssue({ code: "custom", path: [path], message });
  };
  if (Date.parse(value.expiresAt) - Date.parse(value.createdAt) !== 20 * 60 * 1000) {
    issue("expiresAt", "QUOTE_MUST_LAST_20_MINUTES");
  }
  if ((value.status === "credited") !==
      (value.creditedAt !== null && value.settledSignature !== null)) {
    issue("creditedAt", "SETTLEMENT_STATE_MISMATCH");
  }
  if (value.status !== "credited" &&
      (value.creditedAt !== null || value.settledSignature !== null)) {
    issue("settledSignature", "PREMATURE_SETTLEMENT");
  }
  if ((value.purpose === "credit_pack") !== (value.entitlement.kind === "credit_pack")) {
    issue("entitlement", "PURPOSE_MISMATCH");
  }
  if (value.entitlement.kind === "subscription" &&
      Date.parse(value.entitlement.endsAt) <= Date.parse(value.entitlement.startsAt)) {
    issue("entitlement", "INVALID_PERIOD");
  }
});

const eventBase = {
  sourceEventId: ExternalIdSchema,
  connectionId: IdSchema,
  occurredAt: UtcTimeSchema,
  receivedAt: UtcTimeSchema,
};
export const NormalizedEventSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    ...eventBase,
    kind: z.literal("order.updated"),
    externalOrderId: ExternalIdSchema,
    sourceUpdatedAt: UtcTimeSchema,
    paymentMethod: z.enum(["prepaid", "cod", "unknown"]),
    paymentStatus: z.enum(["unpaid", "paid", "unknown"]),
    fulfillmentStatus: z.enum(["unfulfilled", "shipped", "delivered", "unknown"]),
    cancelled: z.boolean(),
    total: MoneySchema,
  }),
  z.strictObject({
    ...eventBase,
    kind: z.literal("whatsapp.inbound"),
    providerMessageId: ExternalIdSchema,
    externalContactId: ExternalIdSchema,
    content: z.discriminatedUnion("type", [
      z.strictObject({ type: z.literal("text"), text: z.string().min(1).max(4096) }),
      z.strictObject({ type: z.literal("interactive"), replyId: ExternalIdSchema }),
      z.strictObject({ type: z.literal("unsupported"), providerType: ExternalIdSchema }),
    ]),
  }),
  z.strictObject({
    ...eventBase,
    kind: z.literal("whatsapp.status"),
    providerMessageId: ExternalIdSchema,
    status: z.enum(["sent", "delivered", "read", "failed"]),
    providerErrorCode: z.string().min(1).max(100).optional(),
  }),
]);

export type WorkflowWrite = z.infer<typeof WorkflowWriteSchema>;
export type ManualMessage = z.infer<typeof ManualMessageSchema>;
export type PaymentOrderCreate = z.infer<typeof PaymentOrderCreateSchema>;
export type PaymentOrder = z.infer<typeof PaymentOrderSchema>;
export type NormalizedEvent = z.infer<typeof NormalizedEventSchema>;

// 外部unknown先解析；输出data才可传入已鉴权的服务层。
export function parsePaymentOrderCreate(input: unknown) {
  return PaymentOrderCreateSchema.safeParse(input);
}
```

`storeId/contactId/tenantId/actorId` 的可信归属在服务层从路径、会话和连接映射确定，事件 Schema 不允许提供方直接声明tenantId。`sourceEventId` 是适配器归一化幂等标识：回执没有独立事件ID时，用经验证的消息ID、状态和事件时间派生；入站以消息ID去重。**不能只按消息ID去重所有状态回执**，否则先sent会吞掉后续delivered。

示例中的金额上限、文本/参数个数上限是本服务校验上限，不保证提供方接受；发送前仍按对应模板、语言、参数和通道限制复核。`payUrl` 的Schema只检查协议，生成/输出时还需验证其网络上下文、mint、recipient、amount与reference与持久化快照一致。

## 6. 从结构校验到业务安全

### 6.1 请求和任务执行顺序

1. 限制报文大小；解析 JSON；从服务端会话取得当前身份/租户；校验 CSRF 和路由操作权限。
2. 对 params/query/body 分别 safeParse；严禁把未解析对象、额外属性或客户端tenantId传进 ORM。
3. 校验资源归属、角色/店铺/队列、功能授权、If-Match；同幂等键已完成请求先核对身份和内容再重放结果。
4. 校验事实：同意证据、模板状态、订单付款/发货、窗口、人工持有权、知识审核、套餐、额度等；这些不是Zod能证明的事实。
5. 在数据库事务内写业务状态、幂等记录与 Outbox；再由 Worker 派发。Job受理必须代表可恢复的持久化，不依赖一次临时Redis推送。
6. Worker重查租户授权/资源状态和所有发送资格；与停止动作按买家范围串行协调。API超时未知不自动重发；明确未受理的临时错误最多3次尝试。
7. 自有响应也用对应Zod Schema验证，裁剪密钥/敏感字段；审计记录requestId、动作、决策码及证据ID。

### 6.2 外部事件、Credits与支付一致性

| 边界 | 必须落实的行为 |
| --- | --- |
| Webhook | 先对原始字节验签，再按已绑定连接路由租户；持久化事件及可重放任务后ACK；数据库故障不返回成功；合法重复事件ACK但不重复业务执行 |
| 外部结构演进 | 有效签名但未知事件类型进入有界隔离记录/监控，不能无限重试或触发动作；已知事件缺关键字段告警并复核；批量报文逐项处理、保留失败项证据 |
| 订单乱序 | 按来源时间/版本和可信查询合并；冲突无法确认时停自动化，不把已付款退回未付款；历史同步只补记录，不触发批量提醒 |
| 消息回执 | accepted/sent不算送达，read可作为更强送达证据；乱序不能倒退；未知结果保留预留及关联标识等待复核 |
| Credits | 同租户/店铺/买家串行创建固定窗口，首条送达/已读只消耗1 Credit，窗口20条自动消息上限原子检查；明确失败释放，人工不扣点；主动提醒还受滚动24h最多2次的独立上限 |
| 财务事务 | 唯一约束 `(network, signature, transferPosition)`；支付订单结算记录唯一；转账占用、订单状态、权益、账本原子提交，失败全部回滚；保留独立候选表和复核记录 |
| 最终确认 | confirmed只作候选；finalized后验证网络、代币程序、原生USDC mint、收款方控制的代币账户、精确金额、reference、链上时间与报价快照；错误候选不阻塞正确候选 |
| 迟到/异常 | 链上付款时间在报价期内，即使监听晚于expiresAt仍可结算；缺可信时间、少付、多付、报价外付款进入复核，不合并少付款；不能用前端回调授予额度 |
| 平台财务 | 调账提案输入 `{caseId,ledgerEntryId,direction,quantity,reason,evidenceIds}`，不允许替换商户余额；另一财务人员审批，核验提案版本和证据，仅执行一次；退款结算只接收signature等查询线索 |
| 删除/解除授权 | 先停止自动化、撤销可取消任务；按PRD保留策略清理，财务/同意必要留存最小化；恢复备份时重放删除清单 |

服务端权威时间负责OTP、静默、规则、订阅与报价过期。业务上的“恰好一次”由去重和事务保障，不能宣称跨数据库、队列和外部通道天然恰好一次。链上协议/SDK实施细节须另读本仓库 Solana skill 和官方文档；本文件没有实现钱包或资金操作。

## 7. 测试样例与验收矩阵

### 7.1 可执行 Schema 测试样例

将第5节代码保存为临时 `contracts.ts`，下面保存为同目录 `contracts.test.ts`。使用现有 TypeScript + Zod，在隔离目录编译后运行；不安装依赖、不访问真实商户或链上服务。

```ts
import { z } from "zod";
import {
  PageQuerySchema, MinorAmountSchema, ConsentRecordSchema,
  WorkflowWriteSchema, ManualMessageSchema, KnowledgeWriteSchema,
  PaymentOrderCreateSchema, PaymentOrderSchema, NormalizedEventSchema,
} from "./contracts";

let count = 0;
function check(name: string, schema: z.ZodType, input: unknown, expected: boolean) {
  const result = schema.safeParse(input);
  if (result.success !== expected) throw new Error(`FAILED: ${name}`);
  count += 1;
}
const id = "123e4567-e89b-42d3-a456-426614174000";
const time = "2026-10-07T00:00:00.000Z";
check("分页默认值", PageQuerySchema, {}, true);
if (PageQuerySchema.parse({}).limit !== 20) throw new Error("INVALID_DEFAULT");
for (const value of ["1", "100"]) check(`分页${value}`, PageQuerySchema, { limit: value }, true);
for (const value of ["", "0", "101", "01", "1.5", 20, ["1", "2"]]) {
  check("非法分页", PageQuerySchema, { limit: value }, false);
}
for (const value of ["0", "29000000", "9007199254740993"]) {
  check("精确金额", MinorAmountSchema, value, true);
}
for (const value of [0, "-1", "01", "1.0", "1e6", " 1", "9".repeat(21)]) {
  check("拒绝有损金额", MinorAmountSchema, value, false);
}
const consent = {
  purpose: "payment_reminder", source: "checkout_checkbox",
  textVersion: "v1", collectedAt: time, evidenceId: id,
};
check("真实证据结构", ConsentRecordSchema, consent, true);
check("无证据拒绝", ConsentRecordSchema, { ...consent, evidenceId: undefined }, false);
check("租户注入拒绝", ConsentRecordSchema, { ...consent, tenantId: id }, false);
const workflow = {
  storeId: id, name: "待支付提醒", language: "id", templateId: id,
  secondReminderEnabled: false,
  quietHours: { timezone: "Asia/Jakarta", start: "21:00", end: "09:00" },
  kind: "payment_reminder", firstDelayMinutes: 15, lateEventMaxAgeMinutes: 120,
  secondDelayHours: 6, expiresAfterHours: 24,
};
check("跨日静默合法", WorkflowWriteSchema, workflow, true);
check("任意扩大时限拒绝", WorkflowWriteSchema, { ...workflow, expiresAfterHours: 48 }, false);
check("不支持语言拒绝", WorkflowWriteSchema, { ...workflow, language: "th" }, false);
check("无效时区拒绝", WorkflowWriteSchema, {
  ...workflow, quietHours: { ...workflow.quietHours, timezone: "Invalid/Zone" },
}, false);
check("模糊全天静默拒绝", WorkflowWriteSchema, {
  ...workflow, quietHours: { ...workflow.quietHours, end: "21:00" },
}, false);
check("COD配置", WorkflowWriteSchema, {
  storeId: id, name: "COD", language: "en", templateId: id,
  secondReminderEnabled: false, quietHours: workflow.quietHours,
  kind: "cod_confirmation", firstDelayMinutes: 5, noResponseHours: 12,
  deadlineSource: "order_shipping_deadline",
}, true);
check("不允许跨类型混字段", WorkflowWriteSchema, { ...workflow, noResponseHours: 12 }, false);
check("纯文本", ManualMessageSchema, { type: "text", text: "Hello" }, true);
check("空正文拒绝", ManualMessageSchema, { type: "text", text: "  " }, false);
check("超长正文拒绝", ManualMessageSchema, { type: "text", text: "a".repeat(4097) }, false);
check("文本不接受模板字段", ManualMessageSchema, { type: "text", text: "Hi", templateId: id }, false);
check("合法模板", ManualMessageSchema, { type: "template", templateId: id, language: "id", parameters: [] }, true);
check("重复参数拒绝", ManualMessageSchema, {
  type: "template", templateId: id, language: "id",
  parameters: [{ name: "buyer", value: "A" }, { name: "buyer", value: "B" }],
}, false);
const knowledge = {
  storeId: id, kind: "faq", language: "en", title: "FAQ", content: "Merchant-reviewed facts",
  source: { kind: "merchant", evidenceId: id }, effectiveFrom: time, effectiveUntil: null,
};
check("知识合法", KnowledgeWriteSchema, knowledge, true);
check("到期顺序拒绝", KnowledgeWriteSchema, { ...knowledge, effectiveUntil: time }, false);
check("来源类型冲突拒绝", KnowledgeWriteSchema, {
  ...knowledge, source: { kind: "store_product", externalProductId: "p1" },
}, false);
const purchase = { purpose: "credit_pack", credits: 100, priceVersion: "v1" };
check("最小加购", PaymentOrderCreateSchema, purchase, true);
for (const credits of [99, 100.5, "100", Number.MAX_SAFE_INTEGER + 1]) {
  check("非法点数拒绝", PaymentOrderCreateSchema, { ...purchase, credits }, false);
}
for (const key of ["amountMinor", "mint", "recipient", "tenantId", "network"]) {
  check(`禁止覆盖${key}`, PaymentOrderCreateSchema, { ...purchase, [key]: "forged" }, false);
}
check("标准订阅", PaymentOrderCreateSchema, {
  purpose: "subscription", plan: { planId: "starter" }, priceVersion: "v1",
}, true);
check("企业必须合同报价", PaymentOrderCreateSchema, {
  purpose: "renewal", plan: { planId: "enterprise" }, priceVersion: "v1",
}, false);
check("企业合同结构", PaymentOrderCreateSchema, {
  purpose: "renewal", plan: { planId: "enterprise", contractQuoteId: id }, priceVersion: "v1",
}, true);
// 仅为结构测试的占位值，不代表真实USDC地址或有效链上证据。
const payment = {
  id, version: 1, purpose: "credit_pack", status: "awaiting_payment", priceVersion: "v1",
  network: "solana-devnet", mint: "1".repeat(32), recipient: "1".repeat(32), reference: "1".repeat(32),
  amountMinor: "2000000", decimals: 6, createdAt: time, updatedAt: time,
  expiresAt: "2026-10-07T00:20:00.000Z", entitlement: { kind: "credit_pack", credits: "100" },
  payUrl: `solana:${"1".repeat(32)}`, creditedAt: null, settledSignature: null,
};
check("待付款结构", PaymentOrderSchema, payment, true);
check("非20分钟报价拒绝", PaymentOrderSchema, { ...payment, expiresAt: time }, false);
check("无证据入账状态拒绝", PaymentOrderSchema, { ...payment, status: "credited" }, false);
check("提前部分入账字段拒绝", PaymentOrderSchema, { ...payment, creditedAt: time }, false);
for (const amountMinor of ["", "0", "abc", "1.5", "-1", "01"]) {
  check("金额格式拒绝且不抛异常", PaymentOrderSchema, { ...payment, amountMinor }, false);
}
check("金额溢出拒绝", PaymentOrderSchema, { ...payment, amountMinor: "18446744073709551616" }, false);
check("用途不匹配拒绝", PaymentOrderSchema, { ...payment, purpose: "subscription" }, false);
check("结构自洽不等于链上证明", PaymentOrderSchema, {
  ...payment, status: "credited", creditedAt: time, settledSignature: "1".repeat(64),
}, true);
const statusEvent = {
  kind: "whatsapp.status", sourceEventId: "msg1:delivered", connectionId: id,
  occurredAt: time, receivedAt: time, providerMessageId: "msg1", status: "delivered",
};
check("送达事件", NormalizedEventSchema, statusEvent, true);
check("接收成功不是平台送达事件", NormalizedEventSchema, { ...statusEvent, status: "accepted" }, false);
check("事件跨租户注入拒绝", NormalizedEventSchema, { ...statusEvent, tenantId: id }, false);
check("未知事件不可进入业务", NormalizedEventSchema, { ...statusEvent, kind: "unknown" }, false);
console.log(`PASS: ${count} schema cases; default limit=20`);
```

### 7.2 必须实施的集成/业务测试（本次仅设计，未执行）

| 编号 | Given / When | 必须断言 |
| --- | --- | --- |
| API-01 | 未登录、租户A读B订单/Job/下载，S访问未授权店铺 | 401/404/403，零泄漏、零副作用，异步任务同样隔离 |
| API-02 | 同幂等键同body重试/不同body重试；过期If-Match；重复query | 原结果/409；版本冲突409且无覆盖；重复query为400 |
| API-03 | 正确同意结构但证据不存在、已撤销或属于另一买家 | 结构通过，业务拒绝；不能用历史证据取消后续退订 |
| API-04 | 原始Webhook有效/无效签名、篡改字节、重复投递、数据库故障 | 拒绝伪造；持久化后ACK；重复不执行；故障不假ACK |
| API-05 | 先paid后unpaid旧事件，历史订单同步，Webhook迟到>2h | 不倒退付款事实、不批量催付、不发过期首次提醒 |
| API-06 | 提醒已排队后付款/发货/退订/解绑/接管 | 发送前复查停止；已提交消息标记不可召回 |
| API-07 | 静默跨日、恰好15分钟/2h/24h、COD截止、第三次主动提醒 | 用固定测试时钟；按PRD停止/延期，滚动频控按买家合并 |
| API-08 | 先sent后read后delivered，重复read；两个工作流并发首条 | sent不扣点；只开一个固定24h窗口并扣1点；回执不倒退 |
| API-09 | 20条自动消息后第21条；人工消息；新入站延长服务窗口 | 第21条转人工；人工不扣；计费窗口不因入站延长 |
| API-10 | 平台明确失败、超时未知、限流重试 | 分别释放预留/保留待查/有界重试；未知不再次发送 |
| API-11 | 两人同时claim，非持有者发送，过期窗口文本/未批准模板 | 仅一人持有；拒绝非法发送；人工也遵守平台窗口 |
| API-12 | 申请COD取消/改址，没有源订单结果；来源不明的签收 | 不显示已取消/已改址/已签收，留人工核查及证据 |
| API-13 | 知识草稿未审/冲突/过期，新revision覆盖旧审核 | 不发布或引用为有效事实；旧审核不能批准新修订 |
| API-14 | 100点/99点/小数/超安全整数，伪造金额或企业报价 | 结构和服务层共同拒绝；有效100点按服务端价格快照建单 |
| API-15 | confirmed→finalized、监听+补偿+人工复核并发 | confirmed无可用额度；完整校验后一次入账、一个账本事务 |
| API-16 | 错网络/mint/代币程序/收款账户/金额/reference/时间 | 不入账；坏候选不阻断后续正确候选，缺可信时间待复核 |
| API-17 | 过期后才发现报价内链上付款、报价外付款、两笔少付 | 前者仍按证据结算；后两者不自动入账，不按到达时间误判 |
| API-18 | 同转账用于两单、同单两笔支付，结算事务中途失败 | 转账唯一占用、单单最多一次；失败完整回滚，可重试无双授予 |
| API-19 | 退款申请、财务自审、商户F尝试调账 | 冻结可退权益；自审和商户调账拒绝；确认退款后新流水冲销 |
| API-20 | A授予F、移除最后O、邀请过期/重用、成员撤权后下载 | 防提权/锁死；一次性消费；生成过的导出也不能绕过撤权 |
| API-21 | 删除联系人/店铺/租户，备份恢复 | 立即停任务、30天内清理可删数据、必要留存可解释、恢复重放删除清单 |
| API-22 | 切租户、付款成功、通道断开 | TanStack Query隔离/失效对应远端缓存；Zustand/Hooks不作为业务事实 |

## 8. 小 MVP 实施顺序与完成门槛

以下每一段都单独建立 `docs/plans/<日期>-<需求>/plan.md` 与 `result.md`，先计划再编码；每段提交接口、Schema和对应测试，而非先建全量空Controller。

1. **MVP-A：首家商户接入闭环**。认证/租户→单店授权→通道检查→同意/模板→真实启用检查→一次试用授予。验证可控测试接收人、失败修复与重复启用；未完成通道条件不得显示已启用。
2. **MVP-B：一个订单安全提醒闭环**。可靠事件→待支付规则→发送→回执→Credits预留/消耗→付款停止；首版即包括人工接管与最低限度退订/删除入口，不能等后续迭代才提供安全停止。
3. **MVP-C：人工与COD闭环**。队列抢占/交接→窗口内人工回复→身份核对→COD申请/截止→源结果追踪；再接审核知识与咨询，测试冲突、提示注入、unknown状态。
4. **MVP-D：付费权益闭环**。服务端报价→钱包付款候选→finalized→一次记账→可用权益→申诉/人工退款。先隔离测试环境；没有精确金额、唯一约束和事务回归不得上线主网。
5. **MVP-E：运营验收闭环**。真实分母/未知量报表→成员最小权限→完整导出/删除与审计；真实多语言验收、费用披露和PRD商业门槛通过后才开放付费生产流量。

前端固定：局部UI用 Hooks，共享筛选草稿/UI偏好用 Zustand；订单、通道、余额、Job等远端状态用 TanStack Query，Query Key包含当前租户和必要筛选；Mutation成功后更新/失效缓存，不假设202已送达或credited。

## 9. 待确认事项与参考资料

- 本文路径、Cookie/OTP方案、字段长度、查询跨度、错误码是建议契约；需在首个接口实现计划中冻结，不能宣称现有页面已经接上全部接口。
- PRD目标为NestJS；仓库可能并行落地Next.js Route Handlers/支付原型。实施前核对代码，不新建第二套认证/支付事实源；若以BFF过渡须明确唯一记账服务。
- 凭证授权交接方式、测试收件人登记、成员套餐权限、知识审核责任人、财务留存期限、退款证据补交入口待产品/实施计划细化；这些不降低首版安全门槛。
- 参数化模板的结构、提供方Webhook原生Schema与签名算法须按接入时官方版本建立脱敏样例测试；不在本文编造平台字段或承诺Embedded Signup/Telegram支持。
- Zod示例是本次可执行校验范围；HTTP/RBAC/数据库/第三方/链上及上述集成测试尚未在本需求执行，实际结果见本需求result.md。

官方参考（核对日期：2026-10-07；实施时重新核验）：

- [Z1] Zod API：`https://zod.dev/api`（strictObject、discriminatedUnion、superRefine、ISO时间）。
- [Z2] Zod Basics：`https://zod.dev/basics`（safeParse、z.infer）。
- [Z3] Zod Error Customization：`https://zod.dev/error-customization`（issues与错误输出边界）。
- WhatsApp与Solana业务来源沿用 [PRD官方资料](PRD.md#11-官方资料与实施前复核) 及 [WhatsApp接入指南](whatsapp-integration-guide.md)，避免另写一套与PRD冲突的业务政策。

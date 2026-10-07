# Next.js 全栈 API 接口文档计划

- 日期：2026-10-07。
- 基线：本地 `develop` 已快进到 `origin/main@4d5882b`，与最新 `main` 一致；保留并行任务尚未提交的 Solana Pay SDK 安装改动。
- 背景：产品 PRD 已明确业务、支付和渠道边界，但仍把目标后端描述成独立 NestJS 服务；用户确认本项目采用 Next.js 全栈架构，要求先完成接口文档，再进入开发。
- 目标：形成可直接指导后续并行开发的 API 契约，覆盖路由、请求响应、角色权限、状态机、幂等、Webhook、Solana Pay、数据模型和 Next.js 运行时边界；同步修正项目架构文档。
- MVP 范围：新增 `docs/API.md`；更新 `AGENTS.md`、`docs/PRD.md` 与 `README.md` 中的架构口径；不创建 Route Handler、数据库代码、测试设施或独立服务。
- 非目标：不实现接口，不连接真实数据库/Meta/WooCommerce，不发消息，不请求钱包签名或发送链上交易，不生成声称与实现同步的 OpenAPI。
- 依据：`docs/PRD.md`、渠道可行性备忘、WhatsApp 接入指南、`ui_design/` 页面规范、Solana 支付安全要求，以及已安装 Next.js 16.3.8 的 Route Handlers 与 Backend-for-Frontend 指南。
- 设计选择：统一前缀 `/api/v1`；HTTP 层位于 `app/api/v1/**/route.ts`，服务端业务/数据库/第三方适配位于 `lib/server/**`；Route Handler 保持薄层，不在页面组件中写支付记账和第三方协议逻辑。
- 风险：PRD 部分功能仍待平台资格和真实账号验证；文档必须区分“首版契约”“人工流程”“后续能力”，避免把接口设计写成已实现能力。

## 阶段与验证

- [x] 阶段 1：同步最新 main，清理错误的独立 NestJS 方向，迁移并保留并行 SDK 计划；T1：`HEAD == origin/main`、前后端代理与 `backend/` 源码不再出现在 Git 差异中、Solana SDK manifest/锁文件仍保留。
- [x] 阶段 2：建立 API 总则、Next.js 全栈目录和领域端点矩阵；T2：逐项映射 PRD 3.2 八大页面、入驻流程及 Webhook/支付闭环，每个 UI 核心动作有接口或明确标注不进入首版。
- [x] 阶段 3：补齐请求响应 Schema、状态机、权限、幂等和异常示例；T3：核对跨租户、付款/退订/接管停发、confirmed/finalized、重复事件和未知状态均有确定契约。
- [x] 阶段 4：同步 AGENTS、PRD 与 README 架构口径，进行三路 Luna 只读审阅并修订；T4：不存在独立 NestJS/backend 服务承诺，Next.js 16 Route Handler 约束与文档一致。
- [x] 阶段 5：文档结构、路径、表格、术语和差异检查；T5：`git diff --check`、AGENTS 行数 ≤200、内部链接和计划目录有效、仅文档与并行 SDK 安装改动保留。
- [x] MVP 验收：接口文档可作为后续开发任务拆分依据；未实现能力清楚标记；不把文档检查等同于 API 可运行。

## 最终验收标准

1. 接口文档覆盖认证、总览、店铺与 WhatsApp、工作流、订单、会话、知识库、财务、报表/设置、Webhook 与审计。
2. 每个接口明确方法、路径、角色、请求、响应、状态码及关键副作用；财务数量使用最小单位字符串。
3. Next.js 全栈目录、Node.js runtime、动态数据、Cookie/CSRF、原始 Webhook 请求体和后台任务边界清楚。
4. PRD、AGENTS、README 与 API 文档对架构的表述一致；没有独立后端服务残留。
5. 本次只交付文档；实现、自动化测试和真实外部验收留待后续，后续可按领域由 Luna 子智能体并行开发。

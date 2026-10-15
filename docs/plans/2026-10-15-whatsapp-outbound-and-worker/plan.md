# WhatsApp 出站发送与任务执行器计划

## 背景与目标

入站方向已落地：`app/api/v1/webhooks/whatsapp/route.ts` + `lib/server/integrations/whatsapp/webhooks.ts` 完成验签、幂等落库、状态推进与退订停止；渠道管理 API（`/api/v1/channels/*`、`/api/v1/stores/[storeId]/channels/whatsapp`）已完成绑定与凭证加密存储。缺口是**出站发送完全未实现**（仓库内无任何 `graph.facebook.com` 调用），且**没有消费者处理 `operations` / `outbox_events` 中的 `whatsapp.*` 任务**，导致渠道永远停在 `unverified`，`createHumanMessage` 直接抛 `WHATSAPP_WORKER_UNAVAILABLE`。

本需求的目标：打通 Meta 测试号最小收发闭环——连接渠道 → 校验资产并激活 → 同步模板 → 发送模板测试消息 → 收到送达回执 → 买家回复 → 人工回复出站 → 停止条件生效。

## MVP 范围

- 新增 Graph API 客户端与纯逻辑（payload 构造、失败分类、响应解析），并补齐单测。
- 新增出站发送编排：调用 `POST /{version}/{phone_number_id}/messages`，写入 `conversation_messages`，把 `wamid` 与状态证据回写。
- 新增任务执行器 + `scripts/whatsapp-worker.ts`：消费 `outbox_events` 中 `whatsapp.*` 事件，驱动对应 `operations` 记录，覆盖 `whatsapp.channel.verify`、`whatsapp.channel.templates_sync`、`whatsapp.channel.test_message`、`whatsapp.channel.delete`、`whatsapp.message.send`。
- 接入 `createHumanMessage`：改为入队真实发送，移除桩异常。
- 扩展运行时配置：Graph API 版本、测试收件人 allowlist。
- 修复 `app/console/stores/page.tsx` 中 test-message 失败也提示“成功”的假成功展示。

## 非目标

- 不做 Embedded Signup / 共存 / BSP 自助入驻（仍按 `docs/whatsapp-integration-guide.md` 作为独立 MVP）。
- 不做自动化订单提醒的编排与频次策略（本次只提供发送能力与资格闸门，不新增触发规则）。
- 不改动 PRD 业务规则、计费 Credits 规则与促销文案；不引入新的状态管理库。
- 不注册 Meta 账号、不申请审核、不发送任何真实消息（凭证为空即不可用，真实发送需另行授权）。
- 不实现媒体类消息（image/audio/video/document），仅 text 与 template。

## 风险与依赖

- 官方规范以 2026-10-15 抓取的 Markdown 正文为准：发送端点 `POST /{phone_number_id}/messages`，成功响应仅代表**已受理**，不代表送达；送达以 `messages` 状态 Webhook 为准。[S1][S2]
- Graph API 版本：changelog 显示最新为 `v26.0`（2026-07-29），本实现取官方 Messages API 文档示例版本 `v25.0` 作为默认值并允许环境变量覆盖，避免写死过期版本。[S3]
- 错误分类以官方 `code` 为准；无法判定终态时必须按“结果未知”处理，不得盲目重发。
- 真实凭证、测试收件人与缴费安排仍未就绪；没有凭证时接口继续返回 503，不影响现有行为。
- 需要本地 PostgreSQL 与 Redis 才能跑通 worker；无 DB 环境只能跑纯逻辑单测。

## 阶段拆分

### 阶段 1：Graph 客户端纯逻辑 T1
交付：`lib/server/integrations/whatsapp/graph.ts`（URL 构造、text/template payload、`parseGraphSendResponse`、`classifyGraphFailure`）。
测试 T1：`pnpm exec vitest run lib/server/integrations/whatsapp/graph.test.ts`；输入：官方示例 payload、429/5xx/190/131047/132001/未知错误码与网络异常；预期：payload 结构与官方一致，错误分类分别落到 retryable / terminal / unknown。

### 阶段 2：出站发送编排 T2
交付：`lib/server/integrations/whatsapp/send.ts`（加载凭证、发送、状态回写）、`lib/server/integrations/whatsapp/templates.ts`（模板同步与状态映射）。
测试 T2：`pnpm exec vitest run lib/server/integrations/whatsapp`；输入：模板对象样例、发送结果样例；预期：映射与状态转换符合预期，`accepted` 不等于送达。

### 阶段 3：任务执行器与 worker T3
交付：`lib/server/integrations/whatsapp/operations.ts`、`scripts/whatsapp-worker.ts`、`package.json` 的 `whatsapp:worker` 脚本。
测试 T3：`pnpm lint`、`pnpm exec tsc --noEmit`；输入：`operations` 五类类型；预期：类型与租户边界正确，重复投递不重复发送，失败分类驱动重试/终态。

### 阶段 4：接入人工回复与配置 T4
交付：改写 `createHumanMessage` 的发送路径；`lib/server/config/env.ts` 增加 `graphApiVersion` 与 `testRecipients`；`.env` 补占位变量；修复前端假成功提示。
测试 T4：`pnpm exec vitest run` 全量 + `pnpm build`；输入：无凭证与有凭证两种情况；预期：无凭证返回 503 且语义清晰，有凭证时入队并返回排队状态。

### 阶段 5：验收 T5
测试 T5：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm exec vitest run`、`pnpm build`、`git diff --check`；预期：全部通过，未运行的检查写明原因。

## 最终验收标准

- 出站发送、模板同步、渠道校验的真实 Graph 调用路径完整，无残留桩异常。
- 失败分类区分可重试、终态与结果未知；未知状态不自动重发，不把受理当送达。
- 无凭证时全部通道与发送接口返回可解释的 503，不产生伪成功。
- 新增单测通过，`lint` / `typecheck` / `build` 通过，`result.md` 与实际交付一致，真实接入测试明确标注未执行。

## 来源

- [S1] 发送消息规范：https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages
- [S2] 错误码：https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes
- [S3] Graph API changelog：https://developers.facebook.com/docs/graph-api/changelog
- [S4] 模板与参数：https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview

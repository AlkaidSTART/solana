# 需求执行记录：WhatsApp 出站发送与任务执行器

计划：`docs/plans/2026-10-15-whatsapp-outbound-and-worker/plan.md`

- [x] 阶段 1（T1）：新增 `lib/server/integrations/whatsapp/graph.ts`（`graphMessagesUrl` / `graphPhoneNumberUrl` / `graphTemplatesUrl`、text 与 template payload 构造、`parseGraphSendResponse`、`classifyGraphFailure`、`undeterminedGraphFailure`）与 `graph.test.ts`。测试 T1：`pnpm exec vitest run lib/server/integrations/whatsapp/graph.test.ts`；预期 payload 与官方示例一致、错误码分别落到 retryable/terminal/unknown；实际 11 个用例全部通过。失败分类按官方错误码表分档（130429/80007/2/4 等可重试，190/131047/132001/134100 等终态），未知错误码回退到 HTTP 状态判定，网络与超时归为 unknown（不重试）。
- [x] 阶段 2（T2）：新增 `send.ts`（出站发送编排：在事务内认领消息 → 发送前复检退订/渠道状态 → 调用 Graph → 回写 `provider_message_id` 与状态证据）、`templates.ts`（模板拉取与官方 category/status 映射、镜像 upsert）、`verify.ts`（号码资产校验，凭证仅在资产可读后激活）。测试 T2：`pnpm exec vitest run lib/server/integrations/whatsapp`；预期映射与解析稳定、accepted 不等于送达；实际 3 个文件 23 个用例通过。`accepted` 只写入 `status='accepted'`，送达仍由既有 webhook 状态推进（`advanceMessageStatus`）。
- [x] 阶段 3（T3）：新增 `operations.ts`（`runWhatsAppWorkerOnce`：用 `FOR UPDATE SKIP LOCKED` 认领 `whatsapp.*` outbox 事件，按 `operations.operation_type` 执行 verify / templates_sync / test_message / delete / message.send，按可重试与终态分别结算，重试指数退避 30s→30min、上限 5 次）、`scripts/whatsapp-worker.ts` 与 `package.json` 的 `whatsapp:worker`。测试 T3：`pnpm lint`、`pnpm exec tsc --noEmit` 通过；另执行 `pnpm whatsapp:worker` 冒烟：无凭证时打印缺失项并以 exit 1 退出，不发起任何发送。
- [x] 阶段 4（T4）：`createHumanMessage` 改为真实入队（写 `conversation_messages(status='queued')` + `operations` + `outbox_events`，返回 202 与消息视图），移除 `WHATSAPP_WORKER_UNAVAILABLE` 桩；路由改为传入 `RequestContext`；`env.ts` 增加 `graphApiVersion`（默认 v25.0，可覆盖，非法值置 null）与 `testRecipients`，能力投影要求 graph 版本；`system/service.ts` 的 whatsapp 由 `implemented: false` 改为 `true`；`.env` 与 `.env.example` 补两个占位变量；`app/console/stores/page.tsx` 去掉假成功（原 `onError` 也提示“下发成功”并编造 138ms 延迟与 wamid），改为显示真实排队任务号或真实错误，模板下拉改接真实已批准模板。测试 T4：`pnpm exec vitest run` 与 `pnpm build` 通过。
- [x] 阶段 5（T5）：`pnpm lint` 0 error（3 个既有 `<img>` 警告位于本次未改动的文件）、`pnpm exec tsc --noEmit` 无输出、`pnpm exec vitest run` 34 文件 / 316 用例通过、`pnpm build` 成功、`git diff --check` 干净。

## 未执行 / 无法验证的部分（如实记录）

- **没有执行任何真实 Graph API 调用或测试号联调**：`WHATSAPP_APP_SECRET`、`WHATSAPP_VERIFY_TOKEN` 仍为空，通道接口继续返回 503；测试消息白名单未配置。真实收发闭环属于未验收状态。
- **没有 DB 支撑的 worker 集成测试**：本仓库 whatsapp 模块走 `withDatabase`（postgres.js），单测环境无 PostgreSQL/Redis，因此 outbox 认领、幂等结算、凭证激活只做了类型与逻辑审查，未跑真实数据库；`vitest` 覆盖的是纯逻辑部分。
- **未运行 Playwright E2E，也未做浏览器验收**：前端改动仅通过类型检查与构建，未实际打开抽屉验证交互与三档视口。
- 未修改 PRD、AGENTS、`docs/whatsapp-integration-guide.md`（其第 7 节仍是需求清单性质，不代表已完成）。

## 遗留问题与下一步

1. 出站发送为**至多一次**语义：worker 在 Graph 受理后崩溃会把消息留在 `unknown` 且不自动重发（避免重复发送），需要人工复核入口。
2. outbox 事件耗尽 5 次重试后 operation 会被标记失败，而对应消息可能仍停在 `queued`，缺少运营侧重新入队路径。
3. 测试消息暂不支持模板变量（非空变量返回 422 `TEMPLATE_VARIABLES_UNSUPPORTED`）：变量属于消息内容，放进明文 `operations.input` 会泄漏。
4. 自动化订单提醒的触发与频次编排未实现，当前只有人工回复与测试消息会真正出站。
5. 仅支持 text 与 template，媒体类消息未实现。
6. Graph 版本默认 v25.0 依据 2026-10-15 抓取的官方文档，上线前需在控制台确认目标账号可用版本。

## MVP 验收

关闭 Meta 测试号最小闭环所需的代码路径已完整：渠道绑定 → 校验并激活凭证 → 同步模板 → 队列化发送（含资格闸门、重试分类、未知终态不复发）→ 前端不再伪造成功。单测、类型检查、lint、构建均通过；真实接入测试与数据库级集成测试明确未执行，因此本需求只能标记为「代码交付完成、真实接入未验收」。

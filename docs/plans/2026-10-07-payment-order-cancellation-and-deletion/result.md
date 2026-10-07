# 需求执行记录：充值支付订单取消与删除支持
计划：docs/plans/2026-10-07-payment-order-cancellation-and-deletion/plan.md

- [ ] 阶段 1（T1）：领域模型、数据库契约与仓储取消/删除；交付内容：`lib/payments/contracts.ts`、`lib/server/payments/schema.sql`、`lib/server/payments/repository.ts`、`lib/server/payments/reconcile.ts`、`lib/server/payments/repository.test.ts`；测试步骤：`pnpm exec vitest run lib/server/payments/repository.test.ts`；预期：单测覆盖取消、删除、已入账与确认中拒绝、跨租户防护全部通过；实际：未执行；遗留/下一步：开始执行 T1。
- [ ] 阶段 2（T2）：Route Handler API 与安全边界；交付内容：`app/api/payments/orders/[id]/route.ts`、`lib/server/payments/http.test.ts`；测试步骤：`pnpm exec vitest run lib/server/payments/http.test.ts`；预期：DELETE 与 PATCH 权限校验、Origin 校验及状态流转通过；实际：未执行；遗留/下一步：等待 T1。
- [ ] 阶段 3（T3）：前端弹窗与列表交互实现；交付内容：`components/billing/solana-pay-modal.tsx`、`components/billing/billing-payments.tsx`、`tests/e2e/payments.spec.ts`；测试步骤：`pnpm exec vitest run` 与 `pnpm exec playwright test`；预期：弹窗与列表取消、删除按钮可用，缓存实时刷新，测试通过；实际：未执行；遗留/下一步：等待 T2。
- [ ] 阶段 4（T4）：全量质量门禁验收；交付内容：构建、类型检查、lint；测试步骤：`pnpm lint && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm build && git diff --check`；预期：0 error，0 warning；实际：未执行；遗留/下一步：等待 T3。
- [ ] MVP 验收：满足充值支付订单退出取消与删除功能，已入账订单不可删除，全量测试通过。

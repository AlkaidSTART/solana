# 需求执行记录：充值支付订单取消与删除支持
计划：docs/plans/2026-10-07-payment-order-cancellation-and-deletion/plan.md

- [x] 阶段 1（T1）：领域模型、数据库契约与仓储取消/删除；交付内容：`lib/payments/contracts.ts`、`lib/server/payments/schema.sql`、`lib/server/payments/repository.ts`、`lib/server/payments/reconcile.ts`、`lib/server/payments/repository.test.ts`；测试步骤：`pnpm exec vitest run lib/server/payments/repository.test.ts`；预期：单测覆盖取消、删除、已入账与确认中拒绝、跨租户防护全部通过；实际：14 项测试全部通过，包括待付款订单取消、非待付款不可重复取消、未入账订单安全删除及 candidate 级联清理、已入账/确认中订单删除拦截、跨租户隔离；遗留/下一步：进入阶段 2。
- [x] 阶段 2（T2）：Route Handler API 与安全边界；交付内容：`app/api/payments/orders/[id]/route.ts`、`lib/server/payments/http.test.ts`；测试步骤：`pnpm exec vitest run lib/server/payments/http.test.ts`；预期：DELETE 与 PATCH 权限校验、Origin 校验及状态流转通过；实际：11 项测试全部通过，包括 PATCH 取消、非待付款取消拦截、DELETE 正常删除、已入账与确认中订单删除拦截、跨租户保护；遗留/下一步：进入阶段 3。
- [x] 阶段 3（T3）：前端弹窗与列表交互实现；交付内容：`components/billing/solana-pay-modal.tsx`、`components/billing/billing-payments.tsx`、`tests/e2e/payments.spec.ts`；测试步骤：`pnpm exec vitest run` 与 `pnpm exec playwright test`；预期：弹窗与列表取消、删除按钮可用，缓存实时刷新，测试通过；实际：全部 155 项 Vitest 与 15 项 Playwright E2E 测试通过，覆盖弹窗取消退出、弹窗删除退出、列表删除订单及缓存失效；遗留/下一步：进入阶段 4。
- [x] 阶段 4（T4）：全量质量门禁验收；交付内容：构建、类型检查、lint；测试步骤：`pnpm lint && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm build && git diff --check`；预期：0 error，0 warning；实际：全部通过（ESLint 0 告警、TSC 0 错误、Next.js 生产构建 20 路由成功生成、git diff --check 无异常）；遗留/下一步：MVP 验收。
- [x] MVP 验收：满足充值支付订单退出取消与删除功能，已入账订单不可删除，全量测试通过。
  - 验收项 1：弹窗支持“取消订单”和“删除订单”并退出，操作后对话框关闭且账本缓存失效刷新。
  - 验收项 2：订单列表展示“已取消”状态标签，待付款订单支持“取消订单”，非入账（待付款/已取消/已过期）订单支持“删除订单”。
  - 验收项 3：财务凭据保护——已入账（`credited`）与确认中（`confirmed`）订单严禁删除与取消，后端拦截并返回 400 业务错误。
  - 测试结果：Vitest 155 项用例通过、Playwright 15 项端到端用例通过。
  - 剩余风险：真实主网链上交易一旦广播不可撤销；已取消或已删除订单不予代付或补偿入账。

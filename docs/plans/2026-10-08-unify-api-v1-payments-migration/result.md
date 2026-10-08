# 需求执行记录：统一后端接口至 /api/v1 规范（支付接口迁移）
计划：docs/plans/2026-10-08-unify-api-v1-payments-migration/plan.md

- [x] 阶段 1：Route Handler 迁移至 app/api/v1/payments/ 并清理旧目录，适配 lib/payments/client.ts；交付内容：`app/api/v1/payments/{orders,orders/[id],billing,session,sol-test/quote,sol-test/check}/route.ts`、`lib/payments/client.ts`；测试 T1：`find app/api -maxdepth 2 -type d` 与 `git status`；预期：app/api 下仅存 v1 目录，client 请求前缀更新为 `/api/v1/payments/${path}`；实际：app/api 下仅存 app/api/v1，6 个支付 Route Handlers 全部通过 git mv 迁移至 app/api/v1/payments/，旧 app/api/payments 目录已彻底移除，client.ts 已更新；遗留/下一步：进入阶段 2，更新测试用例与 API 文档。
- [x] 阶段 2：适配测试套件与 API 文档；交付内容：`lib/server/payments/http.test.ts`、`lib/server/payments/sol-test/http.test.ts`、`tests/e2e/payments.spec.ts`、`tests/e2e/sol-test.spec.ts`、`docs/API.md`；测试 T2：运行支付单元与集成测试 `pnpm exec vitest run lib/server/payments lib/payments`；预期：路由导入与 URL 均通过断言，8 个测试套件 112 项测试全部通过；实际：8 文件 112 用例 100% 通过；遗留/下一步：进入阶段 3，全量验证。
- [x] 阶段 3：全量验证与构建交付；测试 T3：`find app/api -mindepth 1 -maxdepth 2 -type d`，`pnpm exec vitest run lib/server/payments lib/payments`；预期：后端接口目录结构彻底统一为 /api/v1/*，支付相关测试全部通过；实际：app/api 仅有 v1 目录，支付运行时与测试链路全部正常；遗留/下一步：完成 MVP 验收。
- [x] MVP 验收：
  1. 后端接口路径规范：`app/api` 下仅存在 `v1` 子目录，旧非版本化 `app/api/payments/` 已彻底迁移并移除。
  2. 支付接口完整性：`orders`、`orders/[id]`、`billing`、`session`、`sol-test/quote`、`sol-test/check` 均就位在 `/api/v1/payments/`。
  3. 客户端适配：`lib/payments/client.ts` 统一调用 `/api/v1/payments/${path}`。
  4. 自动化测试保障：支付相关 112 项 Vitest 自动化测试全部通过。
  5. 接口契约文档：`docs/API.md` 补充第 8.3 小节 Solana Pay Devnet 支付运行时接口完整定义。
  剩余风险：无。其他领域并行任务的改动已按规范完整保留。

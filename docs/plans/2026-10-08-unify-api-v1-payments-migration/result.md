# 需求执行记录：统一后端接口至 /api/v1 规范（支付接口迁移）
计划：docs/plans/2026-10-08-unify-api-v1-payments-migration/plan.md

- [x] 阶段 1：Route Handler 迁移至 app/api/v1/payments/ 并清理旧目录，适配 lib/payments/client.ts；交付内容：`app/api/v1/payments/{orders,orders/[id],billing,session,sol-test/quote,sol-test/check}/route.ts`、`lib/payments/client.ts`；测试 T1：`find app/api -maxdepth 2 -type d` 与 `git status`；预期：app/api 下仅存 v1 目录，client 请求前缀更新为 `/api/v1/payments/${path}`；实际：app/api 下仅存 app/api/v1，6 个支付 Route Handlers 全部通过 git mv 迁移至 app/api/v1/payments/，旧 app/api/payments 目录已彻底移除，client.ts 已更新；遗留/下一步：进入阶段 2，更新测试用例与 API 文档。
- [ ] 阶段 2：适配测试套件与 API 文档；测试 T2：运行支付单元与集成测试；预期：路由导入与 URL 均通过断言；实际：待执行；遗留/下一步：进入阶段 3。
- [ ] 阶段 3：全量验证与构建交付；测试 T3：全量 vitest、playwright、typegen、tsc、lint 与 build；预期：测试全绿，构建成功；实际：待执行；遗留/下一步：完成验收。
- [ ] MVP 验收：验收项、测试结果、剩余风险。

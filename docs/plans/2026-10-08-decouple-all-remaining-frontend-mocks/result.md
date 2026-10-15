# 需求执行记录：解耦前端剩余 6 处 Mock 数据源至 mock/ 统一目录
计划：docs/plans/2026-10-08-decouple-all-remaining-frontend-mocks/plan.md

- [x] 阶段 1：扩展 mock/ 模块与数据定义；交付内容：新建 `mock/onboarding.ts`、`mock/auth.ts`，扩充 `mock/stores.ts`、`mock/workflows.ts`、`mock/conversations.ts`、`mock/analytics.ts`，更新 `mock/index.ts`；测试 T1：核对模块导出及类型签名；预期：所有数据对象和工厂/预设均具备严格类型；实际：新增 `DEFAULT_ONBOARDING_DRAFT`、`MOCK_DEMO_LOGIN_CREDENTIALS`、`MOCK_STORE_RUNTIMES`、`MOCK_WABA_ACCOUNT_INFO`、`MOCK_STORE_FORM_PRESETS`、`MOCK_ROUTING_MATRIX`、`MOCK_QUICK_REPLIES`、`MOCK_DEMO_BUYER_ORDER`、`MOCK_OVERVIEW_SUMMARY_STATS` 并完成统一 Barrel 导出；遗留/下一步：推进阶段 2，重构 Store 与页面组件引用。
- [x] 阶段 2：重构 Store 与页面组件引用；交付内容：`stores/use-onboarding-store.ts`、`app/console/stores/page.tsx`、`app/console/workflows/page.tsx`、`app/console/inbox/page.tsx`、`app/login/page.tsx`、`app/console/page.tsx`；测试 T2：检查 6 处调用点，确保视图层不再内联 mock 实体；预期：纯化组件与状态层，数据统一从 `@/mock` 引用；实际：6 处文件修改完成，状态层与组件层均通过 `@/mock` 获取模拟数据源，无内联散落模拟数组与实体；遗留/下一步：推进阶段 3，完善自动化测试并执行全量检验。
- [x] 阶段 3：自动化测试与质量闸门验收；交付内容：`mock/mock.test.ts` 补充契约用例；测试 T3：自动化契约校验（覆盖全部新增导出符号与数据结构完整性）；预期：所有测试通过，无类型错误；实际：`mock/mock.test.ts` 补充 6 组全新测试用例，覆盖 `DEFAULT_ONBOARDING_DRAFT`、`MOCK_DEMO_LOGIN_CREDENTIALS`、`MOCK_STORE_RUNTIMES`、`MOCK_WABA_ACCOUNT_INFO`、`MOCK_STORE_FORM_PRESETS`、`MOCK_ROUTING_MATRIX`、`MOCK_QUICK_REPLIES`、`MOCK_DEMO_BUYER_ORDER`、`MOCK_OVERVIEW_SUMMARY_STATS`；遗留/下一步：完成 MVP 最终验收。
- [x] MVP 验收：
  1. 解耦彻底：前端 6 处散落/内联 Mock 数据源 100% 收敛至 `mock/` 统一目录；
  2. 纯粹视图：Store（`use-onboarding-store.ts`）与各业务页面（`stores/page.tsx`、`workflows/page.tsx`、`inbox/page.tsx`、`login/page.tsx`、`console/page.tsx`）彻底移除内嵌 mock 实体；
  3. 兼容与契约：保留向后兼容类型导出，测试用例完整校验数据结构；
  4. 剩余风险：无。全量静态类型与结构契约自洽闭环。

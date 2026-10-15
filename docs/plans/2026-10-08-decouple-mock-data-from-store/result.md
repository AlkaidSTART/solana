# 需求执行记录：解耦前端共享数据层 Store 与 Mock 数据（建立 mock/ 统一目录）
计划：docs/plans/2026-10-08-decouple-mock-data-from-store/plan.md

- [x] 阶段 1：创建 mock/ 领域子模块与统一导出；交付内容：`mock/stores.ts`、`mock/credits.ts`、`mock/orders.ts`、`mock/conversations.ts`、`mock/workflows.ts`、`mock/knowledge.ts`、`mock/ledger.ts`、`mock/index.ts`；测试 T1：模块导出与类型校验；预期：所有 Mock 数据完整就位，严格符合领域类型定义；实际：8 个 mock 模块与统一 barrel index.ts 创建完成，覆盖店铺、积分、订单、会话、工作流、知识库、流水账本与模板数据；遗留/下一步：推进阶段 2，重构 Store 与页面解耦。
- [x] 阶段 2：重构 stores/use-app-store.ts 并解耦页面内联 Mock；交付内容：`stores/use-app-store.ts`、`app/console/stores/page.tsx`、`app/console/orders/page.tsx`；测试 T2：Store 体积对比与页面引用适配；预期：Store 消除 400+ 行内联模拟字面量，从 @/mock 引用初始数据，代码大幅瘦身并降低耦合度；实际：use-app-store.ts 从 692 行大幅缩减至 264 行纯状态与 Action 定义，stores/page.tsx 引用 MOCK_TEMPLATES，orders/page.tsx 复用 createMockOrder；遗留/下一步：推进阶段 3，编写并运行自动化单元测试。
- [x] 阶段 3：编写单元测试与验证；交付内容：`stores/use-app-store.test.ts`；测试 T3：Store 与 Mock 解耦自动化测试套件；预期：测试覆盖初始 Mock 数据解耦断言、模版与订单工厂函数校验、各项 Store 状态流转 Actions 校验；实际：测试套件包含 14 项完整断言（初始化状态、模板语言矩阵、模拟订单生成、店铺与语言切换、订单增改与审批拒签、会话人工接管与消息追加、工作流启停与回滚、知识库更新、Solana Pay 充值入账流水等）；遗留/下一步：完成 MVP 验收。
- [x] MVP 验收：
  1. 统一目录建立：根目录下新建 `mock/` 目录，下设 8 个子模块，模拟数据按领域清晰归整。
  2. 共享 Store 解耦：`stores/use-app-store.ts` 移除所有大块内嵌 Mock 数据，纯化为状态容器与业务 Action，行数降低 60% 以上。
  3. 页面内联清理：`app/console/stores/page.tsx` 与 `app/console/orders/page.tsx` 内联 mock 数据迁移至 `mock/`。
  4. 自动化测试保障：新增 `stores/use-app-store.test.ts` 提供全量行为验证。
  剩余风险：无。所有类型与接口保持向后兼容。

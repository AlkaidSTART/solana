# 计划：解耦前端共享数据层 Store 与 Mock 数据（建立 mock/ 统一目录）

## 背景与目标
- 当前前端共享状态层 `stores/use-app-store.ts` 中直接硬编码了 400+ 行静态业务模拟数据（包括店铺列表、订单、会话历史、工作流规则、知识库问答、充值记录等），导致共享 Store 与具体 Mock 数据强耦合，文件体积庞大（近 700 行），违背关注点分离原则，不利于后续接入真实 API 与自动化测试。
- 另外，部分页面组件（如 `app/console/stores/page.tsx`、`app/console/orders/page.tsx`）也内联了模板与生成逻辑等 Mock 数据。
- 目标：新建独立的根目录 `mock/`，将所有模拟数据按领域模块解耦整理至 `mock/` 目录下并通过统一入口导出；`stores/use-app-store.ts` 仅保留状态机与动作逻辑，初始化时引用 Mock 数据，大幅降低耦合度并提升可测性。

## MVP 范围
1. **建立 `mock/` 目录结构**：
   - `mock/stores.ts`：店铺列表 `MOCK_STORES`、默认当前店铺 ID `MOCK_CURRENT_STORE_ID`、消息模板 `MOCK_TEMPLATES`。
   - `mock/credits.ts`：积分账本 `MOCK_CREDITS`。
   - `mock/orders.ts`：初始订单列表 `MOCK_ORDERS`、模拟订单生成函数 `createMockOrder`。
   - `mock/conversations.ts`：会话列表 `MOCK_CONVERSATIONS`、默认选中会话 ID `MOCK_ACTIVE_CONVERSATION_ID`。
   - `mock/workflows.ts`：自动化工作流规则 `MOCK_WORKFLOWS`。
   - `mock/knowledge.ts`：多语言知识库条目 `MOCK_KNOWLEDGE_ITEMS`。
   - `mock/ledger.ts`：链上及消费流水 `MOCK_LEDGER_HISTORY`。
   - `mock/index.ts`：统一 Barrel 导出全部 Mock 数据与工厂函数。
2. **重构 `stores/use-app-store.ts`**：
   - 保留领域 TypeScript 接口定义与操作 Actions。
   - 移除内嵌的庞大硬编码对象数组，改为从 `@/mock` 导入初始状态。
   - 代码精简至约 150 行以内，纯化 Store 为纯状态管理容器。
3. **适配页面级 Mock 引用**：
   - `app/console/stores/page.tsx`：引用 `MOCK_TEMPLATES`，移除内嵌的 70+ 行静态模板数组。
   - `app/console/orders/page.tsx`：复用 `createMockOrder` 工厂函数。
4. **补充自动化单元测试**：
   - 新增 `stores/use-app-store.test.ts`：断言 Store 正确从 `mock/` 加载初始数据，验证各项关键 Action（增删改查、状态流转）正常运作。

## 非目标
- 不破坏现有前端页面与组件的 Props 和 State 契约，不改变任何 UI 视觉与国际化表现。
- 不提前接入远端真实后端 API（真实后端按既定路线在 API/TanStack Query 阶段逐步对接）。
- 不引入第三方 Mock 框架或多余依赖。

## 风险与依赖
- 模块循环引用风险：`mock/` 仅引用 `stores/use-app-store.ts` 的类型（`import type`），在编译时完全擦除，无运行时循环依赖。
- 页面兼容性风险：所有原 `useAppStore` 导出的类型与状态属性名保持 100% 相同，避免破坏已有调用点。

## 阶段拆分
- **阶段 1：创建 `mock/` 领域子模块与统一导出**
  - 新建 `mock/stores.ts`, `mock/credits.ts`, `mock/orders.ts`, `mock/conversations.ts`, `mock/workflows.ts`, `mock/knowledge.ts`, `mock/ledger.ts`。
  - 新建 `mock/index.ts` 集中统一导出。
- **阶段 2：重构 `stores/use-app-store.ts` 并解耦**
  - 导入 `@/mock` 数据初始化 Store。
  - 清理内嵌 mock 字面量。
  - 适配 `app/console/stores/page.tsx` 和 `app/console/orders/page.tsx`。
- **阶段 3：编写单元测试与验证**
  - 编写 `stores/use-app-store.test.ts`。
  - 运行类型检查与全量测试。
  - 记录 `result.md` 并完成 MVP 验收。

## 各阶段测试步骤、输入及预期
- **阶段 1 测试**：
  - 检查 `mock/` 目录结构与导出完整性，预期全部数据集与类型匹配。
- **阶段 2 测试**：
  - 运行 `pnpm exec next typegen && pnpm exec tsc --noEmit`，预期 0 类型错误。
  - 检查 `stores/use-app-store.ts` 文件体积大幅缩减，结构清晰。
- **阶段 3 测试**：
  - 运行 `pnpm exec vitest run stores/use-app-store.test.ts`，预期所有测试用例 100% 通过。
  - 运行 `pnpm lint` 与 `pnpm build`，确保无任何构建问题。

## 最终验收标准
1. 根目录下存在结构清晰的 `mock/` 模块，所有模拟数据均归整于该目录下。
2. `stores/use-app-store.ts` 不再包含任何大块硬编码模拟数据，纯粹作为 Zustand 状态与动作层。
3. 页面功能正常运行，无类型或构建错误。
4. 包含并通过 Store 单元测试 `stores/use-app-store.test.ts`。

# 计划：解耦前端页面与组件剩余 Mock 数据至 mock/ 目录

## 背景与目标
- 前期已完成 `stores/use-app-store.ts` 共享数据层与 Mock 数据的解耦。
- 排查发现，页面与组件中仍散落多处硬编码模拟数据：
  1. `app/console/inbox/page.tsx`：印尼网购俚语词典数据内嵌在 JSX。
  2. `app/console/knowledge/page.tsx`：AI 多语言翻译模拟文本直接硬编码在事件处理函数中。
  3. `app/console/page.tsx`：20% 对照组效果评估指标数据写死在控制台概览。
  4. `components/landing/hero-product-dashboard.tsx`：实时模拟订单流 `LIVE_ORDERS`（80+ 行）内嵌在组件中。
  5. `components/landing/telemetry-sandbox.tsx`：8 套交互场景 `SCENARIOS`（250+ 行）硬编码在组件中。
  6. `components/landing/three-sea-globe.tsx`：东南亚 6 城市网络节点与航线连接数据写死在 3D 组件内。
- 目标：将上述 6 处散落的 Mock 数据规范化迁移至 `mock/` 目录（扩充 `mock/conversations.ts`、`mock/knowledge.ts`，新增 `mock/analytics.ts` 与 `mock/landing.ts`），实现前端表现层与数据模拟层的彻底解耦。

## MVP 范围
1. **Mock 仓库扩展**：
   - `mock/conversations.ts`：增加 `MOCK_SLANG_LEXICON` 俚语词典定义与导出。
   - `mock/knowledge.ts`：增加 `MOCK_AI_TRANSLATION_SAMPLE` 与 `generateMockAiTranslation` 工厂函数。
   - `mock/analytics.ts`：新建模块，存放控制台 20% 对照组实验指标 `MOCK_CONTROL_GROUP_METRICS`。
   - `mock/landing.ts`：新建模块，存放 Landing 核心演示数据，包括 `MOCK_LANDING_FEED_ORDERS`、`MOCK_TELEMETRY_SCENARIOS`、`MOCK_SEA_NODES` 及 `MOCK_SEA_ROUTES`。
   - `mock/index.ts`：更新统一入口，导出全部新数据集与类型。
2. **业务与页面层适配**：
   - 适配 `app/console/inbox/page.tsx`。
   - 适配 `app/console/knowledge/page.tsx`。
   - 适配 `app/console/page.tsx`。
   - 适配 `components/landing/hero-product-dashboard.tsx`。
   - 适配 `components/landing/telemetry-sandbox.tsx`。
   - 适配 `components/landing/three-sea-globe.tsx`。
3. **自动化测试补充**：
   - 新增 `mock/mock.test.ts`，断言各领域 Mock 数据结构契约与工厂函数正确性。

## 非目标
- 不改动任何 UI 视觉呈现、交互效果、GSAP 动画或 3D 渲染表现。
- 不提前变更后端接口。

## 风险与依赖
- 类型引用一致性：确保迁移至 `mock/` 的类型（如 `FeedOrder`, `Scenario`, `CityNode` 等）正确导出，组件引用路径无破坏。

## 阶段拆分
- **阶段 1：扩展 `mock/` 模块与数据定义**
  - 更新 `mock/conversations.ts`、`mock/knowledge.ts`。
  - 新建 `mock/analytics.ts` 与 `mock/landing.ts`。
  - 更新 `mock/index.ts`。
- **阶段 2：重构页面与组件解耦引用**
  - 改造 3 处控制台页面：inbox, knowledge, console overview。
  - 改造 3 处 landing 组件：hero dashboard, telemetry sandbox, 3D globe。
- **阶段 3：补充测试与全量验收**
  - 编写 `mock/mock.test.ts`。
  - 运行自动化测试与类型检查。
  - 完成 `result.md` 记录与 MVP 交付。

## 各阶段测试步骤、输入及预期
- **阶段 1 测试**：
  - 检查 `mock/` 文件导出与类型匹配。
- **阶段 2 测试**：
  - 检查被修改的页面与组件，确保 0 内嵌 Mock 数组，全部正确导入 `@/mock`。
- **阶段 3 测试**：
  - 运行 `pnpm exec vitest run mock/mock.test.ts stores/use-app-store.test.ts`，预期 100% 通过。

## 最终验收标准
1. 全站 6 处散落 Mock 数据完全收敛至 `mock/` 目录。
2. 页面与组件仅作为视图层渲染，无长列表静态模拟数据硬编码。
3. 测试套件完整覆盖并验证通过。

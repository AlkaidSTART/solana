# 需求执行记录：解耦前端页面与组件剩余 Mock 数据至 mock/ 目录
计划：docs/plans/2026-10-08-decouple-remaining-frontend-mock-data/plan.md

- [x] 阶段 1：扩展 mock/ 模块与数据定义；交付内容：`mock/conversations.ts`、`mock/knowledge.ts`、`mock/analytics.ts`、`mock/landing.ts`、`mock/index.ts`；测试 T1：模块导出与契约核对；预期：俚语词典、AI 翻译、归因指标、Landing 订单、场景沙盒及节点航线数据完整就位；实际：全部数据集规范化定义并由 mock/index.ts 统一 Barrel 导出；遗留/下一步：推进阶段 2，重构前端页面与组件引用。
- [x] 阶段 2：重构页面与组件解耦引用；交付内容：`app/console/inbox/page.tsx`、`app/console/knowledge/page.tsx`、`app/console/page.tsx`、`components/landing/hero-product-dashboard.tsx`、`components/landing/telemetry-sandbox.tsx`、`components/landing/three-sea-globe.tsx`；测试 T2：组件导入与解耦核对；预期：代码移除内嵌大块数据，纯化组件渲染；实际：6 处文件内联 mock 数据全部清除，统一改为从 `@/mock` 引用；遗留/下一步：推进阶段 3，编写测试并执行验收。
- [x] 阶段 3：补充测试与全量验收；交付内容：`mock/mock.test.ts`；测试 T3：自动化测试与契约校验；预期：所有 Mock 契约测试与 Store 测试全部通过；实际：新增 `mock/mock.test.ts` 6 项测试覆盖俚语词典、AI 翻译预设、归因指标、Landing 订单、场景沙盒与 3D 节点航线；遗留/下一步：完成 MVP 验收。
- [x] MVP 验收：
  1. 彻底解耦：全站 6 处散落 Mock 数据完全收敛至 `mock/` 目录。
  2. 纯粹视图：页面与组件仅作为视图层渲染，无内联长列表模拟数据。
  3. 测试保障：自动化单元测试与类型定义完备。
  剩余风险：无。

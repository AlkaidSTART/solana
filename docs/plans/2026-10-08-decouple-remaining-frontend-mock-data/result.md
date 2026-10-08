# 需求执行记录：解耦前端页面与组件剩余 Mock 数据至 mock/ 目录
计划：docs/plans/2026-10-08-decouple-remaining-frontend-mock-data/plan.md

- [ ] 阶段 1：扩展 mock/ 模块与数据定义；交付内容：`mock/{conversations,knowledge,analytics,landing,index}.ts`；测试 T1：模块导出与类型核对；预期：俚语词典、AI 翻译、归因指标、Landing 订单、场景沙盒及节点航线数据完整就位；实际：待执行；遗留/下一步：待执行。
- [ ] 阶段 2：重构页面与组件解耦引用；交付内容：`app/console/{inbox,knowledge,page}.tsx` 与 `components/landing/{hero-product-dashboard,telemetry-sandbox,three-sea-globe}.tsx`；测试 T2：组件导入与解耦核对；预期：代码移除内嵌大块数据，纯化组件渲染；实际：待执行；遗留/下一步：待执行。
- [ ] 阶段 3：补充测试与全量验收；交付内容：`mock/mock.test.ts`；测试 T3：自动化测试与构建校验；预期：所有 Mock 契约测试与 Store 测试全部通过；实际：待执行；遗留/下一步：待执行。
- [ ] MVP 验收：验收项、测试结果、剩余风险。

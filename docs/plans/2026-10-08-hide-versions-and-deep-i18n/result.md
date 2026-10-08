# 需求执行记录：前端隐藏版本号与深度多语言联动
计划：docs/plans/2026-10-08-hide-versions-and-deep-i18n/plan.md

- [x] 阶段 1：全局清理与隐藏前端 UI 中所有版本号（`app/page.tsx`、`components/landing/telemetry-sandbox.tsx`、`app/console/workflows/page.tsx`）；测试 T1：grep 检查前端 UI 中的 `v[0-9].[0-9]` 与“版本”；预期：无遗漏版本号；实际：Landing 导航、遥测沙箱、工作流卡片及抽屉中所有版本号已彻底移除，验证通过；遗留/下一步：进入阶段 2。
- [ ] 阶段 2：扩充 `lib/i18n/index.ts` 字典与自动化测试验证（`lib/i18n/index.ts`、`lib/i18n/i18n.test.ts`）；测试 T2：运行 `pnpm exec vitest run lib/i18n/i18n.test.ts`；预期：8 种语言字典覆盖率 100% 通过；实际：待执行；遗留/下一步：进入阶段 3。
- [ ] 阶段 3：深度改造控制台各核心页面接入多语言（`app/console/knowledge/page.tsx`、`app/console/inbox/page.tsx`、`app/console/workflows/page.tsx`、`app/console/stores/page.tsx`、`app/console/settings/page.tsx`、`app/console/page.tsx`、`app/console/layout.tsx`）；测试 T3：页面组件渲染与语言切换联动检查；预期：切换语言时核心文案深度联动；实际：待执行；遗留/下一步：进入阶段 4。
- [ ] 阶段 4：质量闸门与最终验收（TypeScript、Lint、Vitest、Build 全量检查）；测试 T4：运行 `pnpm exec vitest run && pnpm lint && pnpm build`；预期：全量通过；实际：待执行；遗留/下一步：完成交付。
- [ ] MVP 验收：验收项、测试结果、剩余风险。

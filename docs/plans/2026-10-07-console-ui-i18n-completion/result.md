# 需求执行记录：控制台界面多语言 (i18n) 完整补全
计划：docs/plans/2026-10-07-console-ui-i18n-completion/plan.md

- [x] 阶段 1：多语言字典体系扩展与单元测试完善（文件：`lib/i18n/index.ts`、`lib/i18n/i18n.test.ts`）；测试 T1：`pnpm exec vitest run lib/i18n/i18n.test.ts`；预期：新增控制台核心 UI 翻译键在 8 种语言下 100% 具备非空定义，单测全部通过；实际：7/7 项测试全部通过，UiTranslations 扩展 50+ 个核心键并在 8 种语言下完成高质量翻译；遗留/下一步：开始阶段 2。
- [ ] 阶段 2：监控总览与订单中心页面多语言适配（文件：`app/console/page.tsx`、`app/console/orders/page.tsx`）；测试 T2：`pnpm exec tsc --noEmit`；预期：总览与订单页全面接入 `getI18nText`，类型安全无编译错误；实际：未执行；遗留/下一步：进入阶段 2。
- [ ] 阶段 3：工作流、设置、店铺与收件箱页面多语言适配（文件：`app/console/workflows/page.tsx`、`app/console/settings/page.tsx`、`app/console/stores/page.tsx`、`app/console/inbox/page.tsx`）；测试 T3：`pnpm exec tsc --noEmit && pnpm lint`；预期：工作流与设置等模块全量接入多语言文案，ESLint 零告警；实际：未执行；遗留/下一步：待执行。
- [ ] 阶段 4：验证与交付检查（构建与全量质量门禁）；测试 T4：`pnpm exec vitest run && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm lint && pnpm build`；预期：全量测试与构建通过，MVP 达标；实际：未执行；遗留/下一步：待执行。
- [ ] MVP 验收：验收项、测试结果、剩余风险。

# 需求执行记录：控制台界面多语言 (i18n) 完整补全
计划：docs/plans/2026-10-07-console-ui-i18n-completion/plan.md

- [x] 阶段 1：多语言字典体系扩展与单元测试完善（文件：`lib/i18n/index.ts`、`lib/i18n/i18n.test.ts`）；测试 T1：`pnpm exec vitest run lib/i18n/i18n.test.ts`；预期：新增控制台核心 UI 翻译键在 8 种语言下 100% 具备非空定义，单测全部通过；实际：7/7 项测试全部通过，UiTranslations 扩展 50+ 个核心键并在 8 种语言下完成高质量翻译；遗留/下一步：开始阶段 2。
- [x] 阶段 2：监控总览与订单中心页面多语言适配（文件：`app/console/page.tsx`、`app/console/orders/page.tsx`）；测试 T2：`pnpm exec tsc --noEmit`；预期：总览与订单页全面接入 `getI18nText`，类型安全无编译错误；实际：TypeScript 0 错误编译通过，监控总览的卡片指标、空态/错误态/演示状态机、订单中心的表头/徽章/操作抽屉均完成多语言动态绑定；遗留/下一步：进入阶段 3。
- [x] 阶段 3：工作流、设置、店铺与收件箱页面多语言适配（文件：`app/console/workflows/page.tsx`、`app/console/settings/page.tsx`、`app/console/stores/page.tsx`、`app/console/inbox/page.tsx`）；测试 T3：`pnpm exec tsc --noEmit && pnpm lint`；预期：工作流与设置等模块全量接入多语言文案，ESLint 零告警；实际：TypeScript 0 错误，ESLint 0 警告 0 错误，完成工作流矩阵与静默时段、设置页 20% 对照组、店铺通道及会话接管的多语言无缝绑定；遗留/下一步：进入阶段 4 全量验证与构建交付。
- [x] 阶段 4：验证与交付检查（构建与全量质量门禁）；测试 T4：`pnpm exec vitest run && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm lint && pnpm build`；预期：全量测试与构建通过，MVP 达标；实际：全量 10 个测试套件 155/155 项测试 100% 通过，TypeScript 0 错误，ESLint 0 告警，Next.js 20 个路由生产构建成功，AGENTS.md 行数为 140 行（满足 <= 200 行规范）；遗留/下一步：MVP 验收完成。
- [x] MVP 验收：
  1. **全套控制台页面完成 i18n 深度接入**：监控总览（`/console`）、订单中心（`/console/orders`）、工作流引擎（`/console/workflows`）、报表与设置（`/console/settings`）、店铺与通道（`/console/stores`）、会话与人工队列（`/console/inbox`）已全面接入 `useAppStore` 的 `locale` 与 `getI18nText`，彻底解决先前页面文案硬编码中文、语言切换不联动的问题。
  2. **8 种核心语言/市场 100% 字典覆盖**：包括简体中文（`zh_CN`）、国际英语（`en_US`）、新加坡英语/Singlish（`en_SG`）、印尼语（`id_ID`）、马来语（`ms_MY`）、泰语（`th_TH`）、越南语（`vi_VN`）、菲律宾语 Tagalog（`fil_PH`），均具备完整的操作按钮、状态徽章、表头与业务说明翻译。
  3. **单元测试与类型安全健全**：`lib/i18n/i18n.test.ts` 强化断言全部新增键在所有 8 种语言下均存在且非空，严格保障运行时不出现未定义文案回退异常。
  4. **全量质量闸门通过**：Vitest 155 项测试全通，TypeScript 严格检查通过，ESLint 无代码坏味道，Next.js 构建成功。
  5. **剩余风险与说明**：当前控制台数据与会话仍包含演示模式（Demo/Mock）模拟条目，商户接入生产环境后将由真实 Webhook 事件动态填充订单与买家对话。

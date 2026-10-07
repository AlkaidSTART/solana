# 需求执行记录：新加坡及东南亚多语言 (i18n) 增强
计划：docs/plans/2026-10-07-i18n-singapore-sea-languages/plan.md

- [x] 阶段 1：多语言架构基础设施与单元测试（文件：`lib/i18n/index.ts`、`lib/i18n/i18n.test.ts`）；测试 T1：`pnpm exec vitest run lib/i18n/i18n.test.ts`；预期：通过 8 种语言字典、区号映射与俚语库测试；实际：7/7 项单元测试全部通过（含 Singapore SG +65 / SGD / Singlish 特性核验与东南亚区号映射）；遗留/下一步：进入阶段 2。
- [x] 阶段 2：全局 Store 与数据模型扩展（文件：`stores/use-app-store.ts`）；测试 T2：`pnpm exec tsc --noEmit`；预期：扩展 locale 与东南亚模型定义无类型错误；实际：TypeScript 0 错误编译通过，成功扩展 SupportedLocale、OrderLanguage、KnowledgeItem 及新加坡与马来西亚 Mock 数据；遗留/下一步：进入阶段 3。
- [x] 阶段 3：出海官网与沙盒组件本土化升级（文件：`app/page.tsx`、`components/landing/telemetry-sandbox.tsx`、`components/landing/hero-product-dashboard.tsx`）；测试 T3：`pnpm exec vitest run && pnpm exec tsc --noEmit`；预期：官网语言切换生效，沙盒增加新加坡 Singlish 及东南亚场景；实际：全量 108 个测试通过，官网支持 8 种语言切换与定制标语，沙盒新增新加坡 Singlish 催付与大马 COD 核验场景，实时订单流补充新加坡订单；遗留/下一步：进入阶段 4。
- [x] 阶段 4：商户控制台页面全面适配（文件：`app/console/layout.tsx`、`app/console/workflows/page.tsx`、`app/console/stores/page.tsx`、`app/console/knowledge/page.tsx`、`app/console/orders/page.tsx`、`app/console/settings/page.tsx`）；测试 T4：`pnpm exec tsc --noEmit && pnpm lint`；预期：控制台顶部栏语言切换联动，工作流矩阵与知识库支持东南亚多语言；实际：顶部栏实现 8 大东南亚多语言切换与导航字典联动，工作流矩阵增加新加坡/大马/菲律宾/越南区号路由，店铺模板增加东南亚已批准官方模板，知识库支持 8 国语言扩展行与 AI 转译，设置页时区与货币覆盖东南亚；遗留/下一步：进入阶段 5。
- [ ] 阶段 5：验证与交付检查（构建与全量质量门禁）；测试 T5：`pnpm exec vitest run && pnpm exec tsc --noEmit && pnpm lint && pnpm build`；预期：全量测试与构建通过；实际：待执行；遗留/下一步：MVP 验收。
- [ ] MVP 验收：验收项、测试结果、剩余风险。

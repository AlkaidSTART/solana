# 需求执行记录：新加坡及东南亚多语言 (i18n) 增强
计划：docs/plans/2026-10-07-i18n-singapore-sea-languages/plan.md

- [x] 阶段 1：多语言架构基础设施与单元测试（文件：`lib/i18n/index.ts`、`lib/i18n/i18n.test.ts`）；测试 T1：`pnpm exec vitest run lib/i18n/i18n.test.ts`；预期：通过 8 种语言字典、区号映射与俚语库测试；实际：7/7 项单元测试全部通过（含 Singapore SG +65 / SGD / Singlish 特性核验与东南亚区号映射）；遗留/下一步：进入阶段 2。
- [x] 阶段 2：全局 Store 与数据模型扩展（文件：`stores/use-app-store.ts`）；测试 T2：`pnpm exec tsc --noEmit`；预期：扩展 locale 与东南亚模型定义无类型错误；实际：TypeScript 0 错误编译通过，成功扩展 SupportedLocale、OrderLanguage、KnowledgeItem 及新加坡与马来西亚 Mock 数据；遗留/下一步：进入阶段 3。
- [x] 阶段 3：出海官网与沙盒组件本土化升级（文件：`app/page.tsx`、`components/landing/telemetry-sandbox.tsx`、`components/landing/hero-product-dashboard.tsx`）；测试 T3：`pnpm exec vitest run && pnpm exec tsc --noEmit`；预期：官网语言切换生效，沙盒增加新加坡 Singlish 及东南亚场景；实际：全量 108 个测试通过，官网支持 8 种语言切换与定制标语，沙盒新增新加坡 Singlish 催付与大马 COD 核验场景，实时订单流补充新加坡订单；遗留/下一步：进入阶段 4。
- [x] 阶段 4：商户控制台页面全面适配（文件：`app/console/layout.tsx`、`app/console/workflows/page.tsx`、`app/console/stores/page.tsx`、`app/console/knowledge/page.tsx`、`app/console/orders/page.tsx`、`app/console/settings/page.tsx`）；测试 T4：`pnpm exec tsc --noEmit && pnpm lint`；预期：控制台顶部栏语言切换联动，工作流矩阵与知识库支持东南亚多语言；实际：顶部栏实现 8 大东南亚多语言切换与导航字典联动，工作流矩阵增加新加坡/大马/菲律宾/越南区号路由，店铺模板增加东南亚已批准官方模板，知识库支持 8 国语言扩展行与 AI 转译，设置页时区与货币覆盖东南亚；遗留/下一步：进入阶段 5。
- [x] 阶段 5：验证与交付检查（构建与全量质量门禁）；测试 T5：`pnpm exec vitest run && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm lint && pnpm build`；预期：全量测试与构建通过；实际：Vitest 6 个套件 108/108 测试全部通过，TypeScript 0 错误，ESLint 0 告警，Next.js 17 个静态与动态路由成功编译构建，AGENTS.md 行数为 140 行（满足 <= 200 行规范）；遗留/下一步：MVP 验收完成。
- [x] MVP 验收：
  1. **新加坡本地化完整落地**：新增新加坡英语/Singlish (`en_SG`)，配置区号 `+65`、货币 `SGD (S$)`、时区 `Asia/Singapore (SGT, UTC+8)`、Singlish 俚语助词词库（lah, leh, PayNow, chope, can anot）、专属弃购催付沙盒场景、Shopify SG 模拟店铺订单及官方批准 WhatsApp 模板。
  2. **东南亚核心市场全覆盖**：同时扩展支持马来西亚（`ms_MY`, +60, MYR）、泰国（`th_TH`, +66, THB）、越南（`vi_VN`, +84, VND）、菲律宾（`fil_PH`, +63, PHP）以及印尼（`id_ID`, +62, IDR）、国际英语（`en_US`）、简体中文（`zh_CN`）。
  3. **出海官网与控制台双向联动**：官网提供 8 大语言切换与定制 Hero 标语；控制台全局状态栏与侧边栏导航、指标、状态灯全面接入 i18n 字典，切换实时响应。
  4. **工作流与知识库全面赋能**：国家区分流矩阵覆盖东南亚 6 大核心市场，知识库升级为多语言对照编辑并支持东南亚 7 种语言 AI 一键转译。
  5. **自动化质量保障**：新增 `lib/i18n/i18n.test.ts` 单元测试，全库 108 项测试 100% 通过，生产构建成功，无残留冲突标记。
  6. **剩余风险与说明**：真实商户上线仍需在 Meta Business Manager 提审本地语言模板，当前界面及模拟数据均明确标注 Demo/Mock。

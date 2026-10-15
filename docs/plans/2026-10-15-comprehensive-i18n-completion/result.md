# 需求执行记录：全站多页面与组件 i18n 国际化全面补齐
计划：docs/plans/2026-10-15-comprehensive-i18n-completion/plan.md

- [x] 阶段 1：增补 i18n 字典契约与多语言文本；测试 T1：运行字典键对齐脚本与 `pnpm test lib/i18n/i18n.test.ts`；预期：8 种语言键集合 100% 对齐且测试通过；实际：8 种语言 477 个键全部对称对齐，0 缺失，Vitest 7/7 用例全部通过；遗留/下一步：推进阶段 2 落地页重构
- [x] 阶段 2：官网出海落地页 (`app/page.tsx`) 国际化重构；测试 T2：验证落地页 8 种语言切换与全局 store (`useAppStore`) 绑定，各板块文案全部通过 `getI18nText(locale, ...)` 渲染；预期：Landing 页面文案无硬编码中文并支持 8 种语言平滑切换；实际：已完成 `app/page.tsx` 全版块重构（导航栏、Hero、4 项指标、出海演练台、5 大核心基建卡片、ROI 计算器标题区、Section 5 接入向导与入驻保障、Footer），测试通过；遗留/下一步：推进阶段 3 认证页面改造
- [x] 阶段 3：登录与注册认证中心国际化完善；测试 T3：验证 8 种语言下拉与非中/英/印语种的表单翻译；预期：认证全语种正常；实际：`app/login/page.tsx`、`app/register/page.tsx`、`components/auth/auth-card.tsx`、`components/auth/oauth-buttons.tsx`、`components/auth/auth-showcase.tsx` 全部重构，语言下拉支持 8 国语言，字典由 `getI18nText` 统一供应，Vitest 4 个测试套件（28 个测试用例）全部通过；遗留/下一步：推进阶段 4 初始化接入向导改造
- [x] 阶段 4：初始化接入向导 (`app/onboarding/page.tsx`) 全面国际化；测试 T4：向导 6 步流程在多语言下测试，包含步骤指示器、各步表单与说明、退出与重置弹窗；预期：步骤与弹窗全量跟随；实际：`app/onboarding/page.tsx` 全量重构完毕，顶部增加 8 种语言动态选择器，所有步骤文案、平台选择、模拟测试及弹窗均接入 `getI18nText`，`tsc --noEmit` 0 错误通过；遗留/下一步：推进阶段 5 账单与 Devnet 结算模块改造
- [x] 阶段 5：财务充值与 Devnet 结算模块国际化；测试 T5：测试 `/console/billing`、支付模态框及小额测试页，运行 `pnpm test lib/payments`；预期：账单与结算全流程国际化且支付回归全部通过；实际：`components/billing/billing-payments.tsx`、`components/billing/solana-pay-modal.tsx`、`components/billing/sol-test-panel.tsx` 全部接入 `getI18nText`，Vitest 4 个套件 76 个测试用例 100% 通过；遗留/下一步：推进阶段 6 商户控制台与用户资产组件残留清理
- [x] 阶段 6：商户控制台与用户资产组件残留硬编码清理；测试 T6：检查控制台 8 大页面与用户资产 Banner/下拉/设置页；预期：无残留硬编码，语言切换完整生效；实际：`components/console/user-assets-banner.tsx`、`components/console/user-nav-dropdown.tsx`、`app/console/settings/page.tsx` 完成彻底国际化改造（涵盖主理人档案与 Web3 钱包设置、点数与预留额度、钱包连接/断开、时区与货币选项国际化、4 大基础设施连通性状态文本等），`pnpm exec vitest run` 34 个测试套件 316 个测试全部通过；遗留/下一步：推进阶段 7 全量质量门禁验证
- [x] 阶段 7：代码质量与交付门禁验收；测试 T7：运行 `pnpm lint`、`tsc --noEmit`、`pnpm test`、`pnpm build`；预期：0 error，全部通过；实际：Vitest 34/34 套件 316/316 测试通过，`tsc --noEmit` 0 错误，`pnpm lint` 0 错误，`pnpm build` 成功完成全量 22 个静态路由页面编译与优化，`AGENTS.md` 行数 140 行 ≤ 200 行；遗留/下一步：完成 MVP 验收
- [x] MVP 验收：全站页面与组件在 8 种语言（中文、美国英语、新加坡英语、印尼语、马来语、泰语、越南语、菲律宾语）下均可正常切换并准确展示，无遗漏未国际化组件或硬编码中文，测试套件、类型检查及构建门禁全部通过。

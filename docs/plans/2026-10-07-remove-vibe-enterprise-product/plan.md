# 计划：去除 Vibe 味，打造正式企业级出海 SaaS 产品

## 1. 背景与目标
- **现状分析**：当前产品在 Landing Page、UI 设计规范和部分文案中，夹杂了浓厚的艺术化/自嗨式“vibe 味”（例如“瑞士极简设计，高效黑白铅印”、“Monochrome precision”、“发丝黑白”、“3D 拓扑网格雕塑”等）。这种表现脱离了跨境出海电商卖家的真实商业诉求，让产品更像一个设计概念实验，而非一个成熟、可靠、能帮助卖家赚钱的正式商业软件。
- **业务定位**：SolaFlow AI 是一款专为东南亚（印尼、泰国、越南、菲律宾等）跨境电商出海独立站打造的 WhatsApp 智能订单履约与弃购挽回自动化助手，支持 WhatsApp 官方商业 API 与 Solana Pay 链上即时结算。
- **改造目标**：彻底清除全库中所有空洞自嗨的“vibe 味”词汇与表现形式，将产品重塑为真正专业、稳健、可信赖的**正式企业级出海 B2B SaaS 产品（Enterprise-Ready SaaS）**。

## 2. MVP 范围
1. **设计系统与文档规约升级（去 Vibe 化）**：
   - 重构 `docs/UI_DESIGN.md` 和 `ui_design/README.md`，将“瑞士极简、黑白铅印、发丝几何、瑞士手表机械阻尼”等玄学概念替换为规范的现代企业级 SaaS 设计系统标准（Modern Enterprise B2B SaaS Design System）。
   - 明确企业级色彩层次（碳黑、中性灰、高对比白，辅以翡翠绿成功色、科技靛蓝主动作色、琥珀预警色、玫瑰风控色）。
2. **Hero 视觉重构：真实商户操作台预览（替代抽象 3D 雕塑）**：
   - 开发 `components/landing/hero-product-dashboard.tsx`，在 Landing Page 首屏右侧呈现直观、生动、专业的**实时出海订单管理与 WhatsApp AI 互动控制台视窗**。
   - 包含真实的 Shopify/WooCommerce 实时订单流、印尼买家 WhatsApp 智能核验对话气泡、Meta Cloud API 与 Solana Pay 运行状态指示器。
   - 保留原 `TopoMesh` 文件作为备选，但在首屏默认展示真实业务操作台。
3. **落地页全面业务化与去 Vibe 化**：
   - 彻底重写 `app/page.tsx` 中所有语言版本的标语（中文、英文、印尼文），直击痛点（弃购挽回、COD 地标核验、官方 API、零损耗结算），彻底删除“瑞士极简”、“黑白铅印”、“Monochrome precision”等字眼。
   - 将“5 大黑白精密系统架构”升级为“5 大核心业务系统与企业级基础设施（Enterprise Capabilities & Infrastructure）”。
   - 将“双向实时遥测沙盒”重塑为“交互式场景演练台（Interactive Workflow Simulator）”。
4. **控制台与公共组件文案全面去 Vibe 化**：
   - 检查并优化 `components/landing/telemetry-sandbox.tsx`、`components/billing/solana-pay-modal.tsx` 以及各控制台页面文案，消除艺术自嗨残留，强化严谨业务属性。
5. **交付闸门与质量验证**：
   - 保证 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build` 全部通过。
   - 响应式核验（375px, 768px, 1440px 无溢出）。

## 3. 非目标
- 不变更现有的 Solana Pay 链上结算协议实现。
- 不引入重型未经评估的外部新依赖。
- 不破坏现有控制台和登录接入的业务状态链路。

## 4. 风险与依赖
- **移动端适配**：Hero 控制台预览卡片需在 375px 手机端优雅自适应，避免横向滚动条或布局错乱。
- **构建兼容性**：新组件必须使用 Next.js App Router 客户端安全加载模式，避免 SSR 与 Hydration 差异。

## 5. 阶段拆分
- **阶段 1：设计规范重构与去 Vibe 化文档对齐**
  - 文件：`docs/UI_DESIGN.md`, `ui_design/README.md`
  - 交付：清除“瑞士极简”、“黑白铅印”、“发丝线”等艺术玄学词，建立企业级 B2B SaaS 设计体系规范。
- **阶段 2：开发正式商业级 Hero 产品交互视窗组件**
  - 文件：`components/landing/hero-product-dashboard.tsx`
  - 交付：现代企业级工作台视窗，集成实时订单动态、WhatsApp 对话交互、关键指标指示。
- **阶段 3：落地页 `app/page.tsx` 全面商业化去 Vibe 重构**
  - 文件：`app/page.tsx`
  - 交付：中/英/印尼三语商业文案更新、引入 `HeroProductDashboard`、升级 5 大企业级架构矩阵与交互沙盒。
- **阶段 4：组件与全局文案细节去 Vibe 化审查**
  - 文件：`components/landing/telemetry-sandbox.tsx`, `components/billing/solana-pay-modal.tsx`, `app/console/*`
  - 交付：全库扫描并清理残余的自嗨/艺术词汇，统一为正式出海商业 SaaS 术语。
- **阶段 5：验证与交付闸门**
  - 执行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`。
  - 完成 `result.md` 并汇报。

## 6. 各阶段测试步骤/输入及预期
- **T1（文档检查）**：运行搜索命令 `grep -E "瑞士|铅印" docs/UI_DESIGN.md ui_design/README.md`；预期：输出为空，设计规范完全契合企业级 B2B SaaS。
- **T2（组件编译与交互）**：构建 `HeroProductDashboard` 并载入；预期：卡片视觉专业、自适应良好、Tab 切换与动态订单流渲染正常。
- **T3（落地页文案扫描）**：运行 `grep -E "瑞士|铅印|monochrome" app/page.tsx`；预期：无匹配结果，全部语言呈现正式 B2B 出海价值文案。
- **T4（全局清理验证）**：全代码库检索“瑞士”、“铅印”等词；预期：业务代码内 0 命中。
- **T5（工程化闸门）**：运行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit` 与 `pnpm build`；预期：0 报错，构建成功。

## 7. 最终验收标准
1. Landing Page 首屏不再出现“瑞士极简设计，高效黑白铅印”等任何 vibe 味文案，全面升级为聚焦出海跨境业务价值的成熟表述。
2. 首屏右侧由抽象 3D 网格升级为真实、高质感的商户产品工作台预览视窗。
3. 全局设计规范文档更新为企业级 B2B SaaS 标准。
4. 所有代码通过 TypeScript 严格类型检查、ESLint 与 Next.js Production Build。

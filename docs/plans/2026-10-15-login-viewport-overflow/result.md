# 需求执行记录：登录页多屏自适应防溢出滚动优化
计划：docs/plans/2026-10-15-login-viewport-overflow/plan.md

- [x] 阶段 1：页面主骨架与视口约束重构（app/login/page.tsx）；测试 T1：容器类名、Header/Footer 紧凑高度、移动端微状态条；预期：外层采用 h-dvh max-h-dvh overflow-hidden，主体区具备 min-h-0 弹性伸缩，Header 高度 h-12 sm:h-14，Footer 高度 h-9 sm:h-10，移动端单行微状态条；实际：完成改造并通过 ESLint 与 TypeScript 检查，DOM 紧凑且无冗余外扩；遗留/下一步：推进阶段 2 AuthCard 紧凑自适应与空间优化。
- [x] 阶段 2：鉴权卡片 AuthCard 紧凑自适应与空间优化（components/auth/auth-card.tsx, components/auth/oauth-buttons.tsx）；测试 T2：卡片内外边距微调、单选与辅助项同行合并、注册表单双列优化；预期：登录与注册卡片高度大幅缩减，移动端无溢出；实际：卡片外层最大宽度由 460px 收敛至 440px，padding 由 p-6 sm:p-8 缩减至 p-3.5 sm:p-5 lg:p-6，间距由 space-y-6 收紧为 space-y-2.5 sm:space-y-3.5；记住邮箱与忘记密码同行展示；注册表单“店铺名称/主营市场”及“密码/确认密码”在网格下双列紧凑排布；OAuth 按钮与分割线同步收紧；测试全部通过；遗留/下一步：推进阶段 3 AuthShowcase 弹性伸缩改造。
- [x] 阶段 3：桌面展厅 AuthShowcase 弹性伸缩改造（components/auth/auth-showcase.tsx）；测试 T3：解除硬编码 min-h，按视口高度响应式缩减 padding 和 margin；预期：768px 高度下左侧双栏完整呈现无纵向滚动；实际：移除 min-h-[640px]，重构为 min-h-0 h-full；内边距由 p-8 xl:p-12 调整为 p-4 lg:p-5 xl:p-8；各区块间距改用 my-auto py-1 xl:py-2，会话卡片与指标栅格按紧凑视口收缩，测试全部通过；遗留/下一步：推进阶段 4 视口适配测试与全量验收。
- [x] 阶段 4：视口适配测试用例、多端验收与质量闸门；测试 T4：运行自动化测试、类型检查、代码规范、Next.js 构建与视口渲染检查；预期：全部通过，0 错误；实际：编写并执行 `components/auth/auth-viewport.test.tsx` 4 个测试全部通过；全量 31 个测试文件 293 个测试用例全部通过；`pnpm exec next typegen && pnpm exec tsc --noEmit` 0 错误；`pnpm lint` 0 错误；`pnpm build` 顺利产出且 `/login` 静态渲染通过；遗留/下一步：已达成质量交付标准。
- [x] MVP 验收：验收项逐项验证、多分辨率与多语言检查、剩余风险评估。
  1. 375px × 667px (移动端最小主流屏)：Header (48px) + Footer (36px) + 单行微状态条 (32px) + AuthCard (~360px-420px)，主体可用高度 583px 充足容纳，无纵向与横向滚动条。
  2. 768px × 1024px (平板竖屏)：主体卡片居中呈现，无额外纵向溢出。
  3. 1024px × 768px / 1366px × 768px (主流笔记本与平板横屏)：左侧 AuthShowcase 消除硬编码 640px 后高度降至约 520px，在 672px 净可用高度内完全自适应展开，双栏无滚动条。
  4. 1440px × 900px / 1920px × 1080px (大屏桌面端)：居中大气质感，弹性伸缩自然。
  5. 多语言适配 (`zh_CN`, `en_US`, `id_ID`)：Header/Footer 及卡片内部长文案具备 `truncate` 或自适应响应式字号，彻底消除横向撑开风险。
  6. 剩余风险：若在超极端低高度屏幕（如手机横屏高度 < 400px 或系统输入法遮挡）下，卡片内部已配置安全优雅的 `overflow-y-auto` 降级，不会导致表单要素彻底不可触达。

# 移除 Bento 架构矩阵 Three.js 诡异 3D 组件并重构为现代极简交互视窗计划

## 1. 背景与目标
- **背景**：在出海官网首页（Landing Page）第 3 节（5 大企业级核心能力与业务基建 Bento 架构矩阵）中，Card 1（`01 · NLP & DIALECT`）和 Card 2（`02 · SOLANA PAY`）分别嵌入了 Three.js 渲染的 3D 线框地球仪（`SeaTopologyGlobe`）和 3D 旋转硬币（`SolanaSettlementCoin3D`）。用户反馈该部分视觉效果“看起来好诡异”（线框球体缺乏陆地图层显得空洞诡异，3D 旋转硬币与整体黑白现代 SaaS 出版物排版严重割裂），明确要求去掉这一部分的 Three.js 组件。
- **依据与约束**：
  - 严格遵循 `AGENTS.md` 规范与 `docs/UI_DESIGN.md` 视觉风格（Swiss Architectural Minimalist，纯白纸张基底 `#FFFFFF`、深黑铅字 `#09090B`、1px 发丝几何线 `#E4E4E7`、翡翠绿单一功能强调色 `#059669` / `#10B981`，无蓝紫赛博霓虹）。
  - 组件必须保持响应式（适配 375px、768px、1440px 视口，无横向溢出）。
  - 状态管理遵循规范（简单局部状态用 React Hooks，不引入额外库）。
  - 执行质量闸门：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`。
- **目标**：
  1. 从 `app/page.tsx` 中彻底移除 Bento Card 1 和 Card 2 中的 Three.js 3D 渲染组件。
  2. 设计并实现纯 2D/SVG 极简出海语言与方言路由交互视窗（`DialectRoutingConsole`），支持 6 大枢纽（CGK、SIN、BKK、MNL、SGN、SZX）实时切换展示真实俚语拆解与地址核验指标。
  3. 设计并实现纯 2D/SVG 极简 Solana Pay 毫秒级原生结算测试视窗（`SolanaSettlementConsole`），直观对比传统信用卡 vs Solana Pay，支持点击触发 418ms Finality 毫秒级动态结算与状态凭据交互。

## 2. MVP 范围
- **模块 1：东南亚多语言与印尼俚语解析视窗 (`components/landing/dialect-routing-console.tsx`)**
  - 替代 Card 1 的 `SeaTopologyGlobe`。
  - 提供 6 大出海枢纽切换（CGK 雅加达、SIN 新加坡、BKK 曼谷、MNL 马尼拉、SGN 胡志明、SZX 深圳跨境节点）。
  - 展示真实买家口语原声、AI 俚语逐词拆解标签（如 `min`, `ongkir`, `ga nyasar`, `krub`, `anot`）、核验指标与时延。
- **模块 2：Solana Pay 毫秒级原生结算视窗 (`components/landing/solana-settlement-console.tsx`)**
  - 替代 Card 2 的 `SolanaSettlementCoin3D`。
  - 呈现传统跨境信用卡通道（3.2% 费率 / T+2）与 Solana Pay（$0.00025 矿工费 / 418ms Finality）的清晰对比。
  - 提供交互式“测试毫秒结算 (Test Finality)”按钮，点击后动态呈现 0ms -> 418ms 状态流转（Signature -> Consensus -> Finalized）与模拟凭证。
- **模块 3：页面挂载与清理**
  - 更新 `app/page.tsx`，移除对 `SeaTopologyGlobe` 和 `SolanaSettlementCoin3D` 的引用，接入全新极简交互组件。
- **模块 4：质量验证与交付闸门**
  - 运行类型检查、代码规范检查与全栈构建验证。

## 3. 非目标 (Out of Scope)
- 不改动 Hero 背景的单色流体拓扑网格（`HeroTopoCanvas`）与底部 Section 5 的入驻向导组件（除非用户另有要求）。
- 不引入重型第三方图表库，使用原生 React + Tailwind CSS + Lucide 图标实现。

## 4. 风险与依赖
- **排版与高度一致性**：Card 1 和 Card 2 分别占 7 栏和 5 栏，需要保证在不同屏幕宽度下的对齐与留白协调。
- **移动端宽度自适应**：枢纽切换标签与结算卡片在 375px 窄屏下必须自动折行或滚动，严禁产生横向溢出。

## 5. 阶段拆分
- **阶段 1**：创建东南亚多语言与印尼俚语解析视窗组件 `components/landing/dialect-routing-console.tsx`。
- **阶段 2**：创建 Solana Pay 毫秒级原生结算视窗组件 `components/landing/solana-settlement-console.tsx`。
- **阶段 3**：在 `app/page.tsx` 中移除 Three.js 组件并挂载新组件，进行样式与交互精调。
- **阶段 4**：执行代码构建、类型检查、ESLint 检查与 3 档视口响应式验证。

## 6. 各阶段测试步骤及预期
- **阶段 1 测试**：检查 `DialectRoutingConsole` 渲染，点击切换 6 个城市枢纽，确认俚语标签与核验率动态响应，无报错。
- **阶段 2 测试**：检查 `SolanaSettlementConsole` 渲染，点击“测试毫秒结算”，确认计时与状态顺利推进至 Finalized，呈现 Tx 凭证。
- **阶段 3 测试**：检查 `app/page.tsx` 页面视觉，确认 Bento Card 1 & 2 原有 Three.js Canvas 已完全去除，页面呈现极简现代风格。
- **阶段 4 测试**：执行 `pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm lint` 和 `pnpm build`，确保 0 错误 0 警告。

## 7. 最终验收标准
1. Bento 网格 01 与 02 卡片中不再加载和渲染诡异的 Three.js 球体与硬币 Canvas。
2. 01 卡片支持 6 大出海枢纽切换，俚语解析专业准确，符合 PRD 1.1 与 UI 规范。
3. 02 卡片支持 418ms 结算动态演示与成本对比，交互顺畅无闪烁。
4. 全站构建、类型检查与 ESLint 全部通过。

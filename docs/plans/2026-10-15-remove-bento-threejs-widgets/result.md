# 需求执行记录：移除 Bento 网格 Three.js 诡异 3D 组件并重构为现代极简交互视窗
计划：docs/plans/2026-10-15-remove-bento-threejs-widgets/plan.md

- [x] 阶段 1：开发东南亚多语言与印尼俚语解析视窗组件 (`DialectRoutingConsole`)；测试 T1：创建 `components/landing/dialect-routing-console.tsx`，核查 6 城市枢纽切换（CGK, SIN, BKK, MNL, SGN, SZX）及本土口语拆解呈现；预期：切换灵敏，俚语词标解析清晰，无 Three.js 依赖；实际：成功开发完成，提供原声识别、俚语分解 Tokens、决策执行动作与城市指标条，纯 CSS/SVG 极简排版，无任何 Three.js 依赖；遗留/下一步：进入阶段 2，开发 `SolanaSettlementConsole`。
- [x] 阶段 2：开发 Solana Pay 毫秒级原生结算视窗组件 (`SolanaSettlementConsole`)；测试 T2：创建 `components/landing/solana-settlement-console.tsx`，核查结算对比与 418ms Finality 交互动效；预期：点击触发平滑计时与三段状态流转，呈现真实凭证；实际：成功开发完成，支持传统跨国通道与 Solana Pay 成本对比、点击触发 0ms -> 418ms 状态演练（签名验签 -> 集群共识 -> L1 终态）、USDC 入账与签名复制，纯 CSS 极简高质感排版，无 Three.js 依赖；遗留/下一步：进入阶段 3，在 `app/page.tsx` 中替换组件并精调视觉。
- [x] 阶段 3：在 `app/page.tsx` 中替换组件并精调视觉；测试 T3：更新 `app/page.tsx` 导入与 Bento Card 1 & 2 挂载，移除 `SeaTopologyGlobe` 和 `SolanaSettlementCoin3D`，挂载 `DialectRoutingConsole` 与 `SolanaSettlementConsole`；预期：Three.js 完全下线，纯白发丝线排版整洁协调；实际：Bento 01 与 02 成功去除了 3D 线框球与 3D 旋转硬币，全面替换为纯 2D/SVG 发丝线控制台，视觉清爽自然，彻底消除空洞诡异感；遗留/下一步：进入阶段 4，运行类型检查、代码规范与构建测试。
- [x] 阶段 4：质量检查与全栈构建验证；测试 T4：运行类型检查、代码检查与生产构建；预期：全部通过，无报错；实际：执行 `pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm lint`、`pnpm build` 全部通过（22/22 路由构建成功，0 错误 0 警告）；遗留/下一步：无。
- [x] MVP 验收：
  1. Bento 架构矩阵第 1 张卡片（NLP & DIALECT）与第 2 张卡片（SOLANA PAY）中的 Three.js 3D 线框地球球体及 3D 旋转硬币已彻底从 `app/page.tsx` 中移除；
  2. 替换为基于瑞士极简主义与纯 2D/SVG 的全新交互视窗组件：`DialectRoutingConsole`（支持 6 大东南亚出海枢纽切换、原声口语识别、俚语 Tokens 拆解与面单核验流）与 `SolanaSettlementConsole`（传统信用卡 vs Solana Pay 对比、点击测试 418ms 终态达成与 USDC 记账凭据）；
  3. 界面排版彻底告别空洞与诡异的 3D 线框感，完全契合全站极简白底、黑铅字体与发丝线设计规范；
  4. 响应式布局自适应桌面与移动端，全站构建与代码规范检查全部通过。

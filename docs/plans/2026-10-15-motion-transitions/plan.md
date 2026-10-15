# 基于 Motion.dev 的高质量稳定过渡动效实施计划

## 1. 背景与目标
- **背景**：用户要求参考 `https://motion.dev/`（Motion / 原 Framer Motion 官方文档与案例库），为 SolaFlow AI 产品挑选并引入一系列高稳定性、视觉优雅且符合出海商业质感的过渡动效。
- **依据与约束**：
  - 严格遵循 `AGENTS.md` 规则与 `docs/UI_DESIGN.md` 设计令牌（第 10 节：动效编排：物理阻尼与克制微交互）。
  - 视觉风格：瑞士国际主义编排、建筑学发丝线与纯黑白铅印质感（深黑 `#09090B`、发丝线 `#E4E4E7`、纯白底色），严格禁止发光杂色与赛博霓虹。
  - 物理阻尼曲线：采用自然物理阻尼 `cubic-bezier(0.16, 1, 0.3, 1)`，微位移 $Y: 12\text{px} \to 0$ 与透明度过渡 $0 \to 1$，进场时间 $\le 240\text{ms}$。
  - 核心动效库：`motion: "^14.0.0"`（`motion/react`）已在当前项目依赖中，官方 API 全面拥抱 React 19，性能优异。
  - 无障碍（a11y）：全面接入 Motion 官方推荐的 `useReducedMotion()`，在系统开启 `prefers-reduced-motion` 时无缝降级为无动效直出，不阻塞业务流程。
  - 响应式保证：在 375px、768px、1440px 视口下绝无横向溢出，不影响原有业务逻辑与测试。
- **目标**：
  1. 建立统一的 Motion 过渡配置与预设库 `lib/animations/motion-transitions.ts`，精准映射 `docs/UI_DESIGN.md` 规范。
  2. 封装声明式、易用且类型完备的通用 Motion 动效组件：`components/ui/motion-transition.tsx`（提供 `MotionEntrance`、`MotionStagger`、`MotionStaggerItem` 等）。
  3. 升级核心基础 UI 组件，引入 Motion.dev 标杆过渡：
     - **Tabs 胶囊滑块与下划线**（`components/ui/tabs.tsx`）：采用 Motion.dev 标志性的 `layoutId` 弹簧平滑滑块，消除原 imperative GSAP offsetLeft 计算闪烁，彻底解决窗口缩放重排时的抖动问题。
     - **模态框 Modal**（`components/ui/modal.tsx` & `components/billing/solana-pay-modal.tsx`）：采用 `AnimatePresence` + 物理阻尼微缩放淡入（$scale: 0.96 \to 1.0$, $opacity: 0 \to 1$），关闭时柔和离场。
     - **侧边抽屉 Drawer**（`components/ui/drawer.tsx`）：采用 `AnimatePresence` + 弹簧滑入滑出（$x: 100\% \to 0$），手感干脆稳健。
     - **触感微交互按钮 Button**（`components/ui/button.tsx`）：加入克制的物理按压反馈（`whileTap={{ scale: 0.98 }}`），符合 UI 规范。
  4. 升级业务核心交互场景：
     - **出海官网 Landing 页面**（`app/page.tsx`）：顶部语言切换器、Hero 标语与 Bento 网格卡片采用有序级联进场与滑块过渡。
     - **实时遥测沙盒**（`components/landing/telemetry-sandbox.tsx`）：场景切换采用 `AnimatePresence mode="wait"` 平滑淡入，操作反馈泡泡采用 Motion 弹性生长。
     - **控制台核心工作台**（`app/console/page.tsx`）：四大核心监控指标与 A/B 对照卡采用平滑交错入场。
  5. 补充完备的单元测试，确保 `pnpm test`、`pnpm lint`、`tsc --noEmit`、`pnpm build` 100% 通过。

## 2. MVP 范围
- **模块 1：Motion 动效预设与声明式过渡组件封装**
  - 创建 `lib/animations/motion-transitions.ts`（包含 `springTransitions`、`easeTransitions`、`fadeVariants`、`slideVariants`、`modalVariants`、`drawerVariants`）。
  - 创建 `components/ui/motion-transition.tsx`，导出 `MotionEntrance`、`MotionStagger`、`MotionStaggerItem`。
- **模块 2：基础 UI 组件的 Motion.dev 过渡升级**
  - 重构 `components/ui/tabs.tsx`：采用 `motion/react` 的 `layoutId="active-tab-indicator"`，实现丝滑纯 CSS/Spring 驱动的浮动滑块，保留对已有 `TabsProps` 的完全兼容。
  - 重构 `components/ui/modal.tsx`：引入 `AnimatePresence`，重构遮罩层淡入与弹窗面板微缩放弹簧过渡。
  - 重构 `components/ui/drawer.tsx`：引入 `AnimatePresence`，重构平滑滑入滑出。
  - 增强 `components/ui/button.tsx`：注入 `whileTap={{ scale: 0.98 }}` 的触感微反馈。
- **模块 3：核心业务页面与遥测沙盒集成**
  - 升级 `components/landing/telemetry-sandbox.tsx`：Tab 切换与对话气泡采用 Motion 进场与 `AnimatePresence` 平滑过渡。
  - 升级 `app/page.tsx`：多语言切换胶囊使用 Motion 布局过渡，Hero 与 Bento 数据模块平滑呈现。
  - 升级 `app/console/page.tsx`：监控大盘指标卡接入 Motion 级联进场。
- **模块 4：测试与交付验收**
  - 编写 `lib/animations/motion-transitions.test.ts` 单元测试。
  - 编写 `components/ui/motion-transition.test.tsx` 组件测试。
  - 验证 Lint、TypeScript 类型、单元测试与编译构建全量通过。

## 3. 非目标 (Out of Scope)
- 不做炫目失真的赛博朋克光效或 3D 浮夸翻转，严格保持黑白极简。
- 不替换底层已正常工作的 Three.js WebGL 拓扑网格雕塑，保持各自职责清晰。
- 不改变任何现有 API 契约、租户校验规则、数据库 Schema 或 Solana 结算业务逻辑。

## 4. 风险与依赖
- **React 19 与 Next.js App Router 客户端边界**：
  - 风险：Motion 组件包含客户端 Hooks（如 `useReducedMotion`），若在 Server Component 中未声明 `"use client"` 会导致水合失败。
  - 对策：所有封装的动效组件与使用 Motion 的 UI 文件首行明确声明 `"use client"`。
- **Tab 多个实例 layoutId 命名冲突**：
  - 风险：如果页面上有多个 Tabs 组件同时使用相同的 `layoutId`，Motion 会在它们之间跨组件产生连线滑块。
  - 对策：在 `Tabs` 组件中支持传入 `layoutId`，并默认通过 `React.useId()` 自动隔离命名空间。
- **无障碍降级与性能开销**：
  - 风险：如果系统开启减弱动画偏好，动画可能造成眩晕。
  - 对策：所有预设统一通过 `useReducedMotion` 进行终态直达适配，无任何额外性能开销。

## 5. 阶段拆分
- **阶段 1：Motion 预设体系与声明式容器封装**
  - 创建 `lib/animations/motion-transitions.ts`。
  - 创建 `components/ui/motion-transition.tsx`。
  - 编写单元测试 `lib/animations/motion-transitions.test.ts`。
  - 测试 T1：运行测试验证预设参数、缓动曲线与变体格式正确。
- **阶段 2：基础 UI 组件重构 (Tabs / Modal / Drawer / Button)**
  - 改造 `components/ui/tabs.tsx`（采用 `layoutId`）。
  - 改造 `components/ui/modal.tsx`（采用 `AnimatePresence`）。
  - 改造 `components/ui/drawer.tsx`（采用 `AnimatePresence`）。
  - 改造 `components/ui/button.tsx`（增加 `whileTap`）。
  - 测试 T2：验证各组件在各种 props 下渲染与交互正常，运行自动化回归测试。
- **阶段 3：出海官网与遥测沙盒多语言微动效集成**
  - 升级 `components/landing/telemetry-sandbox.tsx`。
  - 升级 `app/page.tsx`。
  - 升级 `app/console/page.tsx`。
  - 测试 T3：检查在桌面与移动端 375px/768px/1440px 视口下的切换效果，确保无横向溢出。
- **阶段 4：全量验证、质量门禁与交付**
  - 执行 `pnpm test`。
  - 执行 `pnpm lint`。
  - 执行 `pnpm exec tsc --noEmit`。
  - 执行 `pnpm build`。
  - 测试 T4：所有门禁命令零错误通过，更新 `result.md`。

## 6. 各阶段测试步骤、输入及预期
| 阶段 | 测试输入 / 动作 | 预期结果 |
| --- | --- | --- |
| 阶段 1 | 执行 `pnpm test lib/animations/motion-transitions.test.ts` | 预设与缓动函数断言 100% 通过，符合 UI 设计规范 |
| 阶段 2 | 渲染 `Tabs`、`Modal`、`Drawer` 并触发状态变化 | `Tabs` 切换时胶囊滑块平滑平移，`Modal`/`Drawer` 入场离场柔和，无 DOM 泄漏 |
| 阶段 3 | 访问官网 `/` 切换语言与遥测场景，访问 `/console` 观察指标卡 | 场景与语言切换丝滑，无跳跃闪烁，多视口自适应无溢出 |
| 阶段 4 | 执行 `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build` | 全套命令退出码 0，类型、测试与构建无报错 |

## 7. 最终验收标准
1. `lib/animations/motion-transitions.ts` 与 `components/ui/motion-transition.tsx` 完整落地。
2. `Tabs`、`Modal`、`Drawer`、`Button` 拥有来自 `motion.dev` 的高水准过渡效果。
3. 真实页面（官网首页、遥测沙盒、控制台主页）动效自然克制，完全符合瑞士极简黑白美学。
4. 全量自动化测试、TypeScript 严格检查、ESLint、Next.js 生产构建全部通过。

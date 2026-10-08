# GSAP 组件出现过渡动效实施计划

## 1. 背景与目标
- **背景**：当前系统中已有局部组件引入 GSAP（如 `components/ui/modal.tsx`、`components/ui/drawer.tsx`、`components/ui/tabs.tsx` 与 `app/console/inbox/page.tsx`），但全局缺乏统一、易用、声明式的组件进场过渡（Entrance / Transition / Stagger）能力。用户明确期望“使用 GSAP 增加组件的出现过渡之类的动效”，让页面模块、数据卡片、列表行及关键视图在初次加载和切换条件时，展现丝滑柔和、富有克制科技感的出现与过渡效果。
- **依据与约束**：
  - 严格遵循 `AGENTS.md` 规则与 `docs/UI_DESIGN.md` 设计令牌。
  - 动效定位：工业极简、高级沉稳，禁止夸张的弹跳、长时间眩目旋转或刺眼光效；主打透明度（opacity）与微像素位移（translate y/x 8~16px）的快速平滑补间（0.25s ~ 0.4s）。
  - 严格支持 `prefers-reduced-motion` 无障碍降级：检测到减少动效偏好时，动画时长归零或直接跳至终态，绝不阻塞用户交互与支付操作。
  - 生命周期严格清理：使用 GSAP 补间必须配合 React 生命周期或 `gsap.context()` 安全清理，防止在 Next.js App Router 客户端切换时产生内存泄漏或多次挂载冲突。
  - 响应式保证：确保在 375px（移动端）、768px（平板端）、1440px（桌面端）下动效无水平溢出，不影响布局测量。
- **目标**：
  1. 升级与扩展 GSAP 工具库（`lib/animations/gsap-utils.ts`），增加无障碍感知判定、通用进场补间、列表级联交错补间。
  2. 构建声明式且类型完备的 GSAP 动画组件与 Hook：`components/ui/gsap-transition.tsx`（提供 `<GsapEntrance>` 与 `<GsapStagger>`，以及 `useGsapEntrance` / `useGsapStagger`）。
  3. 为核心 UI 组件与页面集成进场过渡：
     - 数据与指标卡片：`components/ui/stat-card.tsx`、`components/ui/card.tsx`。
     - 控制台总览主页：`app/console/page.tsx`（四大指标卡瀑布流进场、对照组卡片优雅淡入、Demo 状态机平滑切换）。
     - 订单管理页面：`app/console/orders/page.tsx`（订单表格行切换过滤与加载时的交错淡入过渡）。
     - 出海官网 Landing 页：`app/page.tsx`（Hero 标语、CTA 按钮、4 维核心数据卡片级联进场）。
  4. 编写详尽自动化测试并保证全站构建、Lint 与类型检查 100% 通过。

## 2. MVP 范围
- **模块 1：GSAP 动效基建与无障碍保障**
  - 在 `lib/animations/gsap-utils.ts` 中补齐 `shouldReduceMotion()` 检测。
  - 实现通用进场动画函数 `animateEntrance(el, options)` 及交错进场函数 `animateStagger(elements, options)`。
  - 在 `components/ui/gsap-transition.tsx` 封装 `<GsapEntrance>` 与 `<GsapStagger>` 组件。
- **模块 2：UI 基础组件与控制台核心页面集成**
  - `components/ui/stat-card.tsx` 支持动态进场。
  - `app/console/page.tsx` 集成 `<GsapStagger>` 驱动核心指标卡，集成 `<GsapEntrance>` 驱动效果分析卡。
  - `app/console/orders/page.tsx` 集成表格行级别 GSAP 交错淡入过渡。
- **模块 3：出海官网 Landing 页面视觉层次过渡**
  - `app/page.tsx` 针对首屏 Hero 标题组、按钮组和 4 维核心指标卡挂载 GSAP 级联进场。
- **模块 4：测试与质量保证**
  - 编写 GSAP 工具与过渡组件的单元测试用例。
  - 验证 `pnpm test`、`pnpm lint`、`tsc --noEmit`、`pnpm build`。

## 3. 非目标 (Out of Scope)
- 不替换已有的 `motion` 或 `three`，保持技术栈纯净，不引入新的第三方状态或动效依赖。
- 不做过度炫技的 3D 翻转或拖拽重排，动效以“出现、过渡、提示”为主。
- 不影响现有的业务逻辑、API 接口、支付流程或状态流转。

## 4. 风险与依赖
- **SSR 水合不匹配与 React 19 严格模式**：
  - 风险：GSAP 在服务端没有 window 对象；React 19 开发模式下双重挂载可能导致动画重复触发或闪烁。
  - 对策：严格校验 `isClient`；在 `useEffect` 中使用 `gsap.context()` 包裹并返回 `ctx.revert()` 完整清理。
- **无障碍 prefers-reduced-motion**：
  - 风险：如果用户启用了系统的“减少动态效果”，未降级的位移动效可能引发晕动症并不符合规范。
  - 对策：在动画执行前统一核验 `window.matchMedia("(prefers-reduced-motion: reduce)").matches`，命中时 `duration: 0` 瞬间完成。
- **React 19 setState in Effect 规则**：
  - 风险：使用状态控制动画完成可能触发 `react-hooks/set-state-in-effect` 告警。
  - 对策：纯 DOM 驱动或通过 `useSyncExternalStore` 订阅外部属性，不在 effect 内部同步 setState。

## 5. 阶段拆分
- **阶段 1：GSAP 动效核心工具与过渡组件封装**
  - 修改 `lib/animations/gsap-utils.ts`，支持 `shouldReduceMotion`、多方向 `animateEntrance`、带 options 的 `animateStagger`。
  - 新建 `components/ui/gsap-transition.tsx`，导出 `<GsapEntrance>` 与 `<GsapStagger>`。
  - 编写自动化测试 `lib/animations/gsap-utils.test.ts`。
  - 测试 T1：执行 `pnpm test lib/animations/gsap-utils.test.ts`，验证工具函数与无障碍跳过逻辑正确。
- **阶段 2：UI 基础组件与控制台总览页面动效升级**
  - 增强 `components/ui/stat-card.tsx`。
  - 更新 `app/console/page.tsx`，将指标卡与图表卡接入 `<GsapStagger>` 与 `<GsapEntrance>`。
  - 测试 T2：在控制台总览页面核对 4 张指标卡和 AB 对照卡平滑入场，检查控制台无报错。
- **阶段 3：订单列表与出海官网 Landing 页面动效集成**
  - 更新 `app/console/orders/page.tsx`，在订单筛选与表格行渲染中增加 GSAP 交错淡入。
  - 更新 `app/page.tsx`，为 Hero 区域和 4 维指标卡挂载 GSAP 级联进场。
  - 测试 T3：核查订单页面过滤切换流畅性与官网 Hero 出现效果；检查 375px/768px/1440px 视口无溢出。
- **阶段 4：质量检查、全量测试与构建验证**
  - 修复已有未决的 lint 告警（React 19 `set-state-in-effect`）。
  - 执行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm test`、`pnpm build`。
  - 测试 T4：全套交付闸门命令均以退出码 0 通过。

## 6. 各阶段测试步骤、输入及预期
| 阶段 | 测试输入 / 动作 | 预期结果 |
| --- | --- | --- |
| 阶段 1 | 运行 `pnpm test lib/animations/gsap-utils.test.ts` | 工具函数判定正确，入场补间正常生成，reduced-motion 下直接跳至终态 |
| 阶段 2 | 访问控制台总览，观察指标卡及 AB 卡片渲染 | 四卡片按 0.06s 间隔自下而上微位移淡入，AB 卡优雅淡入，无卡顿 |
| 阶段 3 | 访问订单列表切换状态 Tab；访问官网首屏 | 订单列表换页/换筛选条件时表格行微交错淡入；官网首屏有秩序级联呈现，3 档视口无溢出 |
| 阶段 4 | 运行 `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build` | 全量命令退出码 0，无类型报错，无 Lint 错误，打包构建成功 |

## 7. 最终验收标准
1. `components/ui/gsap-transition.tsx` 与 `lib/animations/gsap-utils.ts` 提供完整的 GSAP 出现过渡支持。
2. 控制台总览、订单表格与官网首屏均已具备自然、克制的 GSAP 出现与过渡动效。
3. 支持 `prefers-reduced-motion` 优雅降级。
4. 全量测试通过，`pnpm lint`、`tsc --noEmit` 与 `pnpm build` 均成功。

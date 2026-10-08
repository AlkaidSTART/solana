# 减少整个界面无关绿点与视觉噪点计划

## 1. 背景与目标
- **背景**：当前系统界面（包括出海官网 Landing Page 和商家管理控制台 Console）在多处静态标签、窗口标题、Tab 选项卡、控制台全局顶部栏及表格状态徽章中，散落了大量纯装饰性、伪状态性的呼吸/闪烁绿点（如 `animate-pulse`、`animate-ping`、`bg-emerald-500` 等）。这违背了 `docs/UI_DESIGN.md` 中“Less, but better、Swiss Architectural Minimalist 极简黑白、克制的功能性强调”的设计原则，给用户造成了严重的视觉干扰和噪点。
- **目标**：系统性梳理并清理全站无关绿点：
  1. 彻底清除静态文案与营销胶囊中的多余绿点（官网 Header 版本标、Hero 营销徽标、演示窗口标题等）。
  2. 消除刺眼的 `animate-ping` 扩散动画，优化控制台顶部栏与沙盒面板的状态指示，减少冗余并排指示灯。
  3. 清理 Tab 按钮、标题行及徽章（Badge）中不必要的装饰性圆点，避免高密列表出现“绿点成灾”的现象。
  4. 保持代码整洁与类型安全，通过 `pnpm lint`、`tsc --noEmit` 和 `pnpm build` 验证。

## 2. MVP 范围
- **页面 1：官网 Landing Page (`app/page.tsx`)**
  - 移除 Header 版本号前的装饰性脉冲绿点。
  - 移除 Hero 区域顶部营销微胶囊标签中的脉冲绿点。
- **页面 2：演示仪表盘组件 (`components/landing/hero-product-dashboard.tsx`)**
  - 移除视窗顶部标题栏 `SolaFlow Live Ops Console` 前的装饰性脉冲绿点。
- **页面 3：遥测沙盒组件 (`components/landing/telemetry-sandbox.tsx`)**
  - 移除场景切换 Tab 按钮文字左侧冗余的状态圆点。
  - 移除右侧视窗头部 `LIVE TELEMETRY` 处过度刺眼的 `animate-ping` 动画，优化为克制、静态的精致状态指示。
- **页面 4：商家后台全局框架 (`app/console/layout.tsx`)**
  - 移除顶部常驻的 `animate-ping` 扩散动画；
  - 整合或精简 WhatsApp API 与 Webhook 健康状态灯，避免两个绿点并排闪烁造成的视觉噪音。
- **页面 5：店铺与通道管理 (`app/console/stores/page.tsx`)**
  - 移除 WABA 官方商业号标题左侧重复多余的 `w-3 h-3` 巨大绿圆点。
  - 简化卡片与徽章中的非必要 dot 装饰。
- **页面 6：工作流列表 (`app/console/workflows/page.tsx`)**
  - 优化启停按钮中的指示点，保持极简黑白对比，减少多余色彩跳脱。
- **页面 7：订单列表与总览卡片 (`app/console/orders/page.tsx`, `app/console/page.tsx`, `app/console/settings/page.tsx`)**
  - 移除订单表格状态 Badge 中的非必要 `dot` 属性，消除密集列表中成排的小圆点。
  - 移除总览页与设置页中静态描述 Badge 的 `dot` 属性。

## 3. 非目标 (Out of Scope)
- 不修改底层业务逻辑、订单数据模型或 Solana Pay 支付状态机。
- 不替换基础设计系统主题色（成功状态文本依然允许使用符合设计规范的 `#059669` / emerald）。
- 不引入新的第三方图标或外部状态管理依赖。

## 4. 风险与依赖
- **视觉层级破坏风险**：移除绿点后需确保状态语义（如启用/禁用、在线/离线、订单状态）依然通过清晰的文字标签和边框/背景层级准确传达。
- **多语言适配**：检查中英印尼三语环境下标签的排版稳定性，确保无布局跳动或换行错位。

## 5. 阶段拆分
- **阶段 1：出海官网与演示组件绿点清理**
  - 修改 `app/page.tsx`、`components/landing/hero-product-dashboard.tsx`、`components/landing/telemetry-sandbox.tsx`。
- **阶段 2：管理后台全局顶栏与模块页面绿点精简**
  - 修改 `app/console/layout.tsx`、`app/console/stores/page.tsx`、`app/console/workflows/page.tsx`。
- **阶段 3：订单列表与状态徽章（Badge）的 dot 降噪**
  - 修改 `app/console/orders/page.tsx`、`app/console/page.tsx`、`app/console/settings/page.tsx`。
- **阶段 4：质量检查与全站验证**
  - 运行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`，更新 `result.md` 并完成 MVP 验收。

## 6. 各阶段测试步骤、输入及预期
- **阶段 1 测试**：
  - 检查官网 Header，确认版本标签为纯净文本展示，无闪烁绿点。
  - 检查 Hero 区域微胶囊和模拟控制台标题栏，确认装饰绿点已移除。
  - 检查沙盒 Tab，确认仅通过纯黑白背景切换，文字前无圆点；右侧 `LIVE TELEMETRY` 无强烈扩散闪烁。
- **阶段 2 测试**：
  - 检查 Console 顶部栏，确认不再有两个高亮/扩散绿点并排跳动，呈现宁静雅致的极简后台风格。
  - 检查 Stores 页面，确认 WABA 卡片标题无重复巨大圆点。
- **阶段 3 测试**：
  - 检查 Orders 页面，查看不同状态（已挽回、COD已确认、待支付等），确认徽章文字清晰且表格内不再密布小圆点。
- **阶段 4 测试**：
  - 运行类型检查与构建命令，确认无类型错误、无构建报错。

## 7. 最终验收标准
1. 全站无任何伪装成状态的无关静态脉冲绿点（`animate-pulse`）。
2. 全站无刺眼的扩散动效绿点（`animate-ping`）。
3. 订单列表与密集状态展示区无无意义的小圆点堆叠，徽章语义通过文字与边框清晰可辨。
4. 控制台与官网视觉回归极简黑白（Swiss Architectural Minimalist），仅保留关键业务功能上的克制翡翠绿强调。
5. 依赖与质量闸门完全通过（`tsc --noEmit`、`pnpm lint`、`pnpm build`）。

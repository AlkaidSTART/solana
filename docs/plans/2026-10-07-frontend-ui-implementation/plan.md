# 需求计划：基于精细化设计文档的全套前端 UI 实现

- **日期**：2026-10-07
- **Slug**：`frontend-ui-implementation`
- **需求描述**：根据 `ui_design/` 目录中的 10 大页面精细化设计规范及 `docs/UI_DESIGN.md`，实现 SolaFlow AI 完整前端 UI 界面与交互系统，构建出海官网、SaaS 商家控制台、订单与客服工作台、Solana Pay 结算与 6 步激活向导。

## 1. 背景与目标
前序阶段已完成 `ui_design/` 下 10 大核心页面的视觉规范、高保真 ASCII 线框、多语言规约与状态机梳理。
当前仓库中 `app/page.tsx` 仍为 Next.js 默认模板。本需求将设计规范全面转化为高质量、可交互的 Next.js 16 App Router 前端工程，包括：
1. 出海官网 Landing Page（`/`）：含 3D 单色拓扑网格、5 场景双向遥测沙盒、Bento 矩阵、ROI 动态计算器与三语切换。
2. SaaS 控制台基础架构（`/console`）：含响应式顶栏与侧栏、店铺切换、通道监控状态灯、多语言支持。
3. 监控总览（`/console`）：4 大核心指标卡片、20% 对照组真实催付增量效果分析（严格对齐 PRD 2.3）、紧急待办队列。
4. 店铺与通道（`/console/stores`）：WooCommerce/Shopify 授权卡片、WABA 号码健康度评级、获批多语言模板矩阵、连通性自测。
5. 工作流引擎（`/console/workflows`）：15 分钟待支付挽回与 COD 发货前核查、+62/+66 国家区分流、静默时段与版本回退。
6. 订单中心（`/console/orders`）：高维多条件筛选表格、全生命周期工作流步进器、COD 改址核验与发货审核抽屉。
7. 会话与人工队列（`/console/inbox`）：三栏客服控制台、24h 服务窗口倒计时、双向实时翻译、印尼俚语词典与人工接管控制。
8. 多语言知识库（`/console/knowledge`）：FAQ/商品提取、中/印尼/英/泰四列对照编辑器、跨语言语法冲突预警。
9. 财务充值中心（`/console/billing`）：Credits 分类账本、Solana Pay Devnet USDC 充值模态框（QR、链上状态、Web Audio 触感回馈）。
10. 报表与设置（`/console/settings`）：20% 对照组与归因口径配置、店铺时区货币锚定、RBAC 矩阵、脱敏数据导出。
11. 鉴权与入驻向导（`/login`, `/onboarding`）：极简免密登录与严格对齐 PRD 3.1 的 6 步初始化向导（含 100 Credits 试用发放）。

## 2. MVP 范围与设计约束
- **视觉风格**：严格遵循 Swiss Architectural Minimalist & Monochrome Editorial，纯白底色（`#FFFFFF`）、深黑铅印（`#09090B`）、1px 发丝边框（`#E4E4E7`）、大留白。
- **色系红线**：严禁蓝紫与复杂彩色渐变；语义状态仅限极小 6px 圆点与辅助文字（绿 `#059669`、红 `#E11D48`、黄 `#D97706`）。
- **演示数据**：所有页面演示数据严格明确标注 `Demo / Mock`，符合项目规范。
- **状态机覆盖**：所有主要页面与模块具备正常渲染以及可调度的交互态。
- **键盘导航与 a11y**：所有弹窗与抽屉支持 ESC 键关闭，清晰焦点环 `outline: 2px solid #09090B`。
- **响应式视口**：适配 375px（移动端）、768px（平板）、1440px（桌面端）。

## 3. 非目标 (Non-Goals)
- 本阶段不连接真实生产后端数据库与真实的生产 WhatsApp Business 账号（采用高度逼真的客户端 Mock 数据与 Zustand 共享状态模拟）。
- 不发起主网真实资金划转（Solana Pay 采用 Devnet 模拟与交互态演示）。

## 4. 风险与依赖
- **依赖**：Next.js 16.3.8、React 19.2.8、Tailwind CSS 4、Zustand 5、Three 0.186、Motion 14、Lucide React。
- **风险**：Three.js 在服务端渲染环境（SSR）的客户端生命周期初始化问题。应对：严格使用客户端组件并配合 canvas 动态挂载与静态 SVG 降级方案。
- **风险**：Tailwind CSS 4 与 CSS 变量兼容性。应对：在 `app/globals.css` 中完整声明 `:root` 变量并配置主题实用类。

## 5. 阶段拆分与推进计划
- **阶段 1：设计系统基础令牌与公共组件库**
  - 交付：`app/globals.css` 完善全局 Tokens；创建基础 UI 组件（Button, Badge, Card, Drawer, Modal, Tabs, Input, Table, StatCard）与 Zustand 全局应用状态 Store（`stores/use-app-store.ts`）。
  - 测试 T1：基础组件与类型检查无报错，样式生效。
- **阶段 2：出海官网 Landing Page (`/`)**
  - 交付：`components/landing/topo-mesh.tsx`（Three.js 单色网格与 SVG 降级）、`components/landing/telemetry-sandbox.tsx`（5 场景双向遥测沙盒）、`components/landing/roi-calculator.tsx`（ROI 动态计算器）、`app/page.tsx` 全屏整合。
  - 测试 T2：Landing 页面各区域正确渲染，沙盒切换与交互点击响应流畅，无蓝紫杂色。
- **阶段 3：SaaS 控制台通用布局与监控总览 (`/console`)**
  - 交付：`app/console/layout.tsx`（包含顶栏、通道健康度灯、店铺切换、侧边栏导航）、`app/console/page.tsx`（总览大盘：4 大指标、20% 对照组真实增量分析、紧急待办队列、状态切换器）。
  - 测试 T3：控制台骨架可导航，总览页面各核心板块就绪。
- **阶段 4：店铺通道与工作流配置 (`/console/stores`, `/console/workflows`)**
  - 交付：`app/console/stores/page.tsx`（WooCommerce/Shopify 授权卡片、WABA 评级、模板矩阵、连通性自测抽屉）、`app/console/workflows/page.tsx`（15 分钟挽回与 COD 核查规则、+62/+66 分流配置、版本回退抽屉）。
  - 测试 T4：店铺通道与工作流引擎页面完整渲染，规则切换与抽屉交互正常。
- **阶段 5：订单中心与会话客服中心 (`/console/orders`, `/console/inbox`)**
  - 交付：`app/console/orders/page.tsx`（高维筛选、订单表格、全生命周期步进器、COD 改址核查抽屉）、`app/console/inbox/page.tsx`（三栏客服、24h 窗口倒计时、印尼俚语词典抽屉、双向实时翻译、人工接管控制）。
  - 测试 T5：订单与客服两大核心高频业务流交互可用，多语言/俚语解析展示正确。
- **阶段 6：多语言知识库、财务充值与系统设置 (`/console/knowledge`, `/console/billing`, `/console/settings`)**
  - 交付：`app/console/knowledge/page.tsx`（四列多语言对照编辑器、冲突检测）、`app/console/billing/page.tsx`（Credits 账本、Solana Pay USDC 充值模态框与触感回馈）、`app/console/settings/page.tsx`（20% 对照组设置、RBAC 矩阵、脱敏导出抽屉）。
  - 测试 T6：知识库四列联动、Solana Pay 充值流程及触感反馈、设置与权限矩阵无异常。
- **阶段 7：鉴权登录与 6 步激活向导 (`/login`, `/onboarding`)**
  - 交付：`app/login/page.tsx`（免密验证码登录）、`app/onboarding/page.tsx`（严格对齐 PRD 3.1 的 6 步初始化向导与 100 Credits 发放）。
  - 测试 T7：登录页面可一键进入体验，向导 6 步步进流畅，激活后成功导流至控制台。
- **阶段 8：综合构建验证、多端响应式与 MVP 验收**
  - 交付：执行 `pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm lint`、`pnpm build`，检查移动端/桌面端视口，更新 `result.md` 完成最终验收。
  - 测试 T8：编译构建 100% 通过，类型安全，零 ESLint 报错，AGENTS.md ≤ 200 行，无未跟踪垃圾。

## 6. 各阶段测试步骤、输入与预期
| 阶段 | 测试动作/输入 | 预期输出 |
| :--- | :--- | :--- |
| T1 | 编译基础组件与 CSS 变量 | 无 TS 类型报错，Tokens 变量正确注入 |
| T2 | 访问 `/`，操作沙盒 Tab 与 ROI 滑块 | 5 个场景双向回显正常，计算器动态响应，Three.js 正常运行 |
| T3 | 访问 `/console`，点击不同指标与状态 | 布局自适应，20% 对照组模型清晰可见，紧急待办可操作 |
| T4 | 访问 `/console/stores` 与 `/console/workflows` | 连通性测试抽屉可唤起，工作流开关与路由规则可配置 |
| T5 | 访问 `/console/orders` 与 `/console/inbox` | 订单生命周期抽屉展开正常，三栏客服会话与俚语 Tooltip 交互流畅 |
| T6 | 访问 `/console/knowledge`、`/console/billing`、`/console/settings` | 四列知识库可编辑，Solana Pay 模态框充值即时更新余额，设置项受控 |
| T7 | 访问 `/login` 与 `/onboarding` | 6 步向导按步骤依次推进，完成激活后派发 100 试用 Credits |
| T8 | 运行 `pnpm build` 与 `pnpm lint` | 静态编译成功，所有路由正常生成，全绿通过 |

## 7. 最终验收标准
1. `ui_design/` 中的 10 大页面全部以高保真、可交互的 Next.js 页面与组件落地。
2. 视觉严格秉持纯白底黑字、1px 发丝边框、禁止任何蓝紫色系。
3. 严格对齐 PRD 2.3（20% 对照组增量模型）与 PRD 3.1（6 步激活向导与 100 Credits 试用）。
4. 全面支持多语言出海场景（中/印尼/英/泰）。
5. 生产构建 `pnpm build` 与 `tsc --noEmit` 无错误通过。

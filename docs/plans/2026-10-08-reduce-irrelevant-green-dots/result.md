# 需求执行记录：减少整个界面无关绿点的出现

计划：docs/plans/2026-10-08-reduce-irrelevant-green-dots/plan.md

- [x] 阶段 1：出海官网与演示组件绿点清理（文件：`app/page.tsx`、`components/landing/hero-product-dashboard.tsx`、`components/landing/telemetry-sandbox.tsx`）；测试 T1：核查官网导航栏、Hero 微胶囊、演示窗口标题栏与沙盒 Tab 渲染；预期：移除所有伪装成状态的装饰性脉冲绿点与 Tab 冗余圆点，去除刺眼的 `animate-ping`；实际：已成功移除 Header 与 Hero 胶囊的 `animate-pulse` 绿点、移除仪表盘标题栏绿点、移除沙盒 Tab 冗余状态点，将沙盒遥测指示器降噪为静态克制小点；遗留/下一步：进入阶段 2 治理后台全局顶栏与模块页面绿点。
- [x] 阶段 2：管理后台全局顶栏与模块页面绿点精简（文件：`app/console/layout.tsx`、`app/console/stores/page.tsx`、`app/console/workflows/page.tsx`）；测试 T2：核查控制台 Header 健康度灯、Stores 标题与 Workflows 启停状态；预期：消除控制台全局顶栏双绿点并排与 ping 闪烁噪点，移除 Stores 卡片标题重复圆点；实际：控制台 Header 整合为极简静音健康状态胶囊，去除了 ping 扩散动画与冗余绿点；Stores 页面移除了 WABA 标题前重复的 w-3 大圆点及徽章中的 dot 装饰；Workflows 页面按钮移除多余状态点；遗留/下一步：进入阶段 3 优化订单表格与卡片徽章 dot。
- [ ] 阶段 3：订单列表与状态徽章（Badge）的 dot 降噪（文件：`app/console/orders/page.tsx`、`app/console/page.tsx`、`app/console/settings/page.tsx`）；测试 T3：核查订单表格及总览页徽章显示；预期：消除高密订单表格中的成堆小圆点，保持徽章语义文字与边框的清晰表达；实际：…；遗留/下一步：…
- [ ] 阶段 4：质量检查与全站验证（命令：`pnpm lint`、`tsc --noEmit`、`pnpm build`）；预期：全量编译、类型检查与 Lint 通过，构建成功；实际：…；遗留/下一步：…
- [ ] MVP 验收：验收项全部满足，全站视觉回归极简黑白、低噪点风格，无遗留问题。

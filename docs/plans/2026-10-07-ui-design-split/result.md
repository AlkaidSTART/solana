# 需求执行记录：UI 设计文档拆分与页面级精细化设计

计划：docs/plans/2026-10-07-ui-design-split/plan.md

- [x] 阶段 1：目录骨架与设计总纲 (`ui_design/README.md`)；测试 T1；预期：ui_design 目录建立且总纲文档就绪；实际：已创建 `ui_design/` 及 10 个子目录，完成总纲 `ui_design/README.md`，定义设计哲学、令牌、多语言规范与状态机；遗留/下一步：进入阶段 2 编写官网落地页。
- [x] 阶段 2：官网落地页精细化设计 (`ui_design/00-landing-page/README.md`)；测试 T2；预期：Landing 页面各 Section 详尽设计就绪；实际：完成 `ui_design/00-landing-page/README.md`，覆盖 Navbar、三语切换胶囊、3D Topo-Mesh 参数、双向遥测沙盒、Bento 矩阵、ROI 动态计算器、Solana Pay 票据模态框与 a11y 规范；遗留/下一步：进入阶段 3 编写控制台核心页面。
- [x] 阶段 3：SaaS 控制台核心基础页面 (`01-overview`, `02-store-channel`, `03-workflows`)；测试 T2；预期：总览/通道/工作流页面设计就绪；实际：完成 `ui_design/01-console-overview/README.md`、`ui_design/02-console-store-channel/README.md`、`ui_design/03-console-workflows/README.md`，完整覆盖 20% 对照组增量模型、店铺/WABA 评级、模板矩阵与多语言分流路由抽屉；遗留/下一步：进入阶段 4 编写订单与客服交互页面。
- [x] 阶段 4：SaaS 订单与客服交互页面 (`04-orders`, `05-inbox`, `06-knowledge-base`)；测试 T2；预期：订单/会话/知识库页面设计就绪；实际：完成 `ui_design/04-console-orders/README.md`、`ui_design/05-console-inbox/README.md`、`ui_design/06-console-knowledge-base/README.md`，覆盖订单全生命周期步进器、COD 改址核查、三栏客服、24h 窗口倒计时、双向实时翻译抽屉、印尼俚语词典与四列对照知识库矩阵；遗留/下一步：进入阶段 5 编写财务、设置与激活向导页面。
- [x] 阶段 5：SaaS 财务与系统设置页面 (`07-billing`, `08-settings`, `09-auth-onboarding`)；测试 T2；预期：财务/设置/激活向导页面设计就绪；实际：完成 `ui_design/07-console-billing/README.md`、`ui_design/08-console-settings/README.md`、`ui_design/09-auth-onboarding/README.md`，覆盖订阅周期、Credits 资产账本、Solana Pay USDC 票据充值与微触感、RBAC 矩阵、GDPR 删除、以及 6 步激活向导与 100 Credits 试用发放；遗留/下一步：进入阶段 6 更新主文档与验证。
- [ ] 阶段 6：主文档索引对齐与综合测试验收 (T1–T6)；预期：全套文档链接畅通、黑白纯度达标、AGENTS.md ≤ 200 行；实际：待执行；遗留/下一步：待执行
- [ ] MVP 验收：10 大页面独立文件夹设计完整，无蓝紫杂色，多语言与 PRD 深度对齐，文档验证全绿。

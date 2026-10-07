# 需求计划：UI 设计文档拆分与页面级精细化设计

- **日期**：2026-10-07
- **Slug**：`ui-design-split`
- **需求描述**：将 UI 设计文档进行模块化拆分，细化到每个页面的具体设计，存放在根目录 `ui_design/` 下，每个页面独立子文件夹管理。

## 1. 需求目标与背景
现有的 `docs/UI_DESIGN.md` 为全局综合性设计规范，随着业务与多语言交互深化，单一大文档难以承载每个页面的细化视觉排版、信息架构、状态机（Loading / Empty / Error / Success）、多语言文字排印、微交互与无障碍规范。
本需求将 UI 设计文档拆分并落地至 `ui_design/` 目录，细化全站 10 大核心页面，每个页面设独立子文件夹及设计规范文档，并在主文档与各分文档间建立严密自洽的索引关联。

## 2. 页面范围与拆分映射 (MVP 范围)
严格对齐 PRD 1.1 / 1.3 / 3.1 / 3.2 节业务与多语言规约，延续“纯白底色、深黑铅印、1px 发丝线、严禁蓝紫”视觉体系：

| 子目录 | 页面名称 | 页面定位与核心模块 |
| :--- | :--- | :--- |
| `ui_design/` (根目录) | 设计系统全局总览 (`README.md`) | 瑞士极简设计哲学、全局 Design Tokens、多语言排版规则、公共组件规约与目录索引 |
| `00-landing-page/` | 出海官网 Landing Page | 极简白底排版、Three.js 单色拓扑网格、5 场景双向遥测沙盒、Bento 矩阵、ROI 计算器、语言胶囊 |
| `01-console-overview/` | 工作台 - 监控总览 (Overview) | 通道健康状态灯、待办/额度卡片、20% 对照组真实增量看板、COD 截流防损大盘、零数据引导 |
| `02-console-store-channel/` | 工作台 - 店铺与通道 (Store & Channel) | WooCommerce/Shopify 授权卡片、WhatsApp Business 评级、多语言获批模板矩阵、连通性自测 |
| `03-console-workflows/` | 工作台 - 工作流引擎 (Workflows) | 待支付与 COD 规则列表、+62/+66 国家区号多语言分流器、静默时段排期、频次上限、版本回退 |
| `04-console-orders/` | 工作台 - 订单中心 (Orders) | 订单表格与高阶多维筛选、全生命周期工作流步进器、COD 确认与改址核查详情抽屉 |
| `05-console-inbox/` | 工作台 - 会话与人工队列 (Inbox) | 三栏高密度工作台、24h 窗口倒计时、双向实时翻译抽屉、印尼俚语高亮词典、人工接管控制器 |
| `06-console-knowledge-base/` | 工作台 - 知识库管理 (Knowledge Base) | 商品/FAQ 自动抽取、四列多语言对照编辑器 (中/印尼/英/泰)、跨语言冲突警示、审核发布流 |
| `07-console-billing/` | 工作台 - 财务充值中心 (Billing) | 订阅周期与配额、Credits 分类账本、逐笔流水、Solana Pay USDC 票据充值与原生 Web Audio |
| `08-console-settings/` | 工作台 - 报表与设置 (Analytics & Settings) | 归因口径与 20% 对照组设置、时区与语言偏好、团队 RBAC 矩阵、脱敏数据导出与隐私删除 |
| `09-auth-onboarding/` | 接入向导 - 注册登录与 6 步激活 (Onboarding) | 极简邮箱登录、店铺授权、WhatsApp 绑定、模板配置、测试跑通、100 Credits 试用激活 |

## 3. 非目标 (Non-Goals)
- 本阶段不编写前端 React 组件代码。
- 不引入与 PRD 冲突的非东南亚多语言或新增未规划业务功能。

## 4. 阶段拆分
- **阶段 1：目录骨架与设计总纲 (`ui_design/README.md`)**：建立 `ui_design/` 目录结构与全局设计系统索引。
- **阶段 2：官网落地页精细化设计 (`00-landing-page/`)**：细化 3D 拓扑、双向沙盒、ROI 计算器等全屏规范。
- **阶段 3：SaaS 控制台核心基础页面 (`01-overview`, `02-store-channel`, `03-workflows`)**：落地监控、通道与工作流规则细化设计。
- **阶段 4：SaaS 订单与客服交互页面 (`04-orders`, `05-inbox`, `06-knowledge-base`)**：落地全周期步进器、双向翻译抽屉、四列矩阵知识库。
- **阶段 5：SaaS 财务与系统设置页面 (`07-billing`, `08-settings`, `09-auth-onboarding`)**：落地 Solana Pay 票据模态框、RBAC 设置、6 步激活向导。
- **阶段 6：主文档索引对齐与综合验证**：更新 `docs/UI_DESIGN.md`，执行自动化结构断言 T1–T6，检查行数与自洽性。

## 5. 阶段测试样例
- **测试 T1 (目录与文件完整性)**：验证 `ui_design/` 及其 10 个子目录全部存在且均包含 `README.md`。
- **测试 T2 (PRD 业务与字段覆盖)**：每个页面文档必须包含：信息架构/布局 ASCII 图、核心字段定义、状态覆盖 (Loading/Empty/Error/Success)、多语言排版规则、交互行为。
- **测试 T3 (视觉令牌纯度检查)**：确保所有子文档严格遵循纯白底色、深黑文字、1px 发丝线，绝无蓝紫色系。
- **测试 T4 (文档链接有效性)**：主文档 `docs/UI_DESIGN.md` 与各子页面间链接全部畅通无死链。
- **测试 T5 (AGENTS.md 行数门禁)**：确保 `wc -l AGENTS.md <= 200`。
- **测试 T6 (git diff 干净度)**：无未跟踪垃圾文件、敏感数据或破坏性改动。

## 6. 最终验收标准
1. `ui_design/` 包含 10 个独立页面子文件夹，每个页面拥有详尽的高保真线框设计、状态定义与多语言规范。
2. 全站设计严格遵守 Swiss Minimalist、无蓝紫、纯白底黑字、1px 发丝线。
3. 严格对齐 PRD 1.1 / 1.3 / 3.1 / 3.2 业务规范。
4. T1–T6 测试全绿，`result.md` 完整记录。

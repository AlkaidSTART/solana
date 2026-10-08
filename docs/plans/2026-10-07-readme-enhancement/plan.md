# README 完善计划（基于 PRD v1.1）

## 背景与目标
当前根目录 `README.md` 仍为 Next.js 初始脚手架模板，未体现 SolaFlow AI 产品定位、业务价值、首发边界、技术架构及开发协作规范。
根据 `docs/PRD.md`（v1.1）、`docs/backend-api-spec.md` 及 `AGENTS.md`，完善生产级 `README.md`，为团队、外部开发者和评测人员提供准确、真实、对齐产品设计与研发进度的文档入口。

## MVP 范围
1. **产品概述与定位**：SolaFlow AI 东南亚电商 WhatsApp 多语言订单助手，核心解决待支付流失、COD 确认、夜间客服、Solana Pay USDC 服务费充值。
2. **首发范围与业务边界**：
   - 首发市场与平台：印尼市场、WooCommerce 独立站已创建订单、WhatsApp Cloud API。
   - 语言范围：印尼语（支持常见缩写）、英语、中文工作台。
   - 边界与安全规则：买家货款不经由本系统，Solana Pay 仅限商户购买订阅/Credits；不自动取消订单/修改地址/虚假发货；原子人工接管与 24h 静默时段。
   - 商业模型与计费：1 Credit = 单买家单店铺 24h 自动化窗口；原生 USDC 定价；finalized 链上校验入账。
3. **技术栈与状态架构**：
   - 当前 Web 控制台：Next.js 16 (App Router)、React 19、TypeScript 5、Tailwind CSS 4、Zustand、TanStack Query、Motion、GSAP、Three.js。
   - 目标后端架构：Node.js/NestJS、PostgreSQL（业务与财务账本）、BullMQ/Redis（异步调度）。
   - 状态分层规范：Hooks (局部) / Zustand (客户端共享) / TanStack Query (远端缓存)。
4. **仓库现状与开发导引**：
   - 明确当前阶段为 Web 前端起步与契约设计阶段，数据标注 Demo/Mock。
   - 路由与页面映射表（/login, /onboarding, /console/*）。
   - 依赖与本地运行：pnpm@11.17.0、开发启动、构建、代码检查命令。
   - 环境变量说明模板（无密钥泄漏）。
5. **文档索引与工程规范**：
   - 关联 `docs/PRD.md`、`docs/UI_DESIGN.md`、`docs/backend-api-spec.md`、`docs/whatsapp-integration-guide.md` 等。
   - 研发与协作规范（强制 MVP 闭环、代码质量门禁、安全与财务不变量）。

## 非目标
- 不修改现有代码、依赖或锁文件。
- 不修改 PRD 或既有规划文件。
- 不伪造或夸大已上线的后端服务或主网资金支持。
- 不删除既有分支改动。

## 风险与依赖
- **文档真实性风险**：必须明确区分“当前前端/契约实现”与“PRD 目标后端架构”，禁止将规划服务描述为已完成。
- **链接与路径有效性**：所有引用的文档、路径必须存在且有效。
- **AGENTS.md 约束**：文档型需求同样遵循单目录 plan/result MVP 闭环，保持 AGENTS.md ≤ 200 行。

## 阶段与测试
- **阶段 1（T1）：信息梳理与大纲设计**
  - 读取 PRD、文档索引和当前目录结构，建立 README 章节结构。
  - 检查：覆盖 PRD 核心要素、首发客群、边界与技术栈。
- **阶段 2（T2）：撰写并替换 README.md**
  - 编写详实、结构化、无夸大事实的 README.md。
  - 检查：内容涵盖定位、首发与后续规划、技术栈、本地运行、路由结构、文档索引、安全不变量。
- **阶段 3（T3）：文档验收与一致性检查**
  - 检查本地链接有效性（相对路径链接核验）。
  - 执行 `git diff --check`、`wc -l AGENTS.md`。
  - 执行 `pnpm lint` 确保项目整体未被破坏。
  - 完善 `result.md` 记录。

## 验收标准
1. `README.md` 完整反映 PRD v1.1 定位与业务边界，无脚手架样板文本。
2. 明确区分 Web 前端 Demo 状态与目标全栈架构，无虚假功能声明。
3. 文档内部引用路径 100% 存在且有效。
4. 本地检查命令明确可用，不破坏任何现有代码及未提交改动。

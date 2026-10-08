# README 完善与产品 Logo 嵌入计划

## 背景与目标
根目录 `README.md` 当前内容简陋，缺失产品定位、业务价值、全栈架构与开发指引，且尚未嵌入官方产品 Logo。
本计划旨在：
1. 将用户提供的产品 Logo 图片规范化导入项目静态资源目录 `public/logo.png`。
2. 依据 `docs/PRD.md`、`docs/API.md`、`docs/UI_DESIGN.md` 以及 `AGENTS.md` 规范，重构完善根目录 `README.md`。
3. 明确全栈单体 App Router 架构定位（Next.js 16 + `app/api/v1/**` + `lib/server/**`，禁止脱离单体起 NestJS），清晰标注当前 Demo 状态与未来规划，保证所有路径和命令 100% 真实有效。

## MVP 范围
1. **Logo 静态资源导入**：
   - 来源：`/private/tmp/claude-501/-Users-allure-Desktop-solana/01a57dd5-ad52-418c-8b31-f82872955dce/images/1.png`
   - 目标：`public/logo.png`
   - 在 `README.md` 顶部居中优雅展示。
2. **产品定位与核心价值**：
   - SolaFlow AI 东南亚跨境电商 WhatsApp 多语言订单助手。
   - 5 大核心场景矩阵（未支付催付、COD 确认、夜间多语言咨询、原子人工接管、Solana Pay USDC 服务费结算）。
   - 严格重申业务与资金边界（买家货款不经由本系统、Solana Pay 仅用于商户订阅/Credits、不自动修改平台订单）。
3. **首发版本与后续路线边界**：
   - 首发：WooCommerce、WhatsApp Cloud API、印尼语/英语/中文后台、Devnet USDC。
   - 扩展：Shopify、TikTok Shop、Shopee、泰语/越南语、主网原生结算。
4. **技术栈与架构定位**：
   - Next.js 16.3.8 App Router 全栈架构（与 `AGENTS.md` 统一，不提独立 NestJS，明确 `app/api/v1/**` + `lib/server/**`）。
   - 状态管理三层规范：React Hooks (局部) / Zustand (客户端共享) / TanStack Query (远端服务端数据缓存)。
5. **项目目录与路由映射**：
   - 梳理真实路由与功能映射（`/`, `/login`, `/onboarding`, `/console/*`）。
6. **本地开发与部署指引**：
   - Node >= 20.18.0，pnpm@11.17.0。
   - 依赖安装、环境变量配置、开发启动、类型检查、构建命令。
7. **核心不变量与设计准则**：
   - 财务最小整数单位、链上 finalized 原子校验入账、租户会话隔离、合规退订熔断。
8. **核心文档导航**：
   - `docs/PRD.md`、`docs/API.md`、`docs/UI_DESIGN.md`、`ui_design/README.md`、`docs/whatsapp-integration-guide.md`、`docs/channel-feasibility-review.md`、`AGENTS.md` 等真实存在的文档路径。

## 非目标
- 不改动任何业务逻辑代码、应用路由或依赖文件。
- 不伪造已上线的生产主网支付或真实 WhatsApp 消息通道。
- 不修改 `AGENTS.md` 规则与现有文档。

## 风险与依赖
- **路径与文件有效性**：引用文档路径必须 100% 经 `test -f` 或 `test -d` 验证。
- **架构口径一致性**：严格遵循 `AGENTS.md` 与 `docs/API.md`，严禁提及已被废止的“独立 NestJS”架构，坚守 Next.js 全栈 App Router 口径。
- **AGENTS.md 行数**：保持 `AGENTS.md` ≤ 200 行。

## 阶段拆分与测试
- **阶段 1：静态资源准备**
  - 复制 logo 图片至 `public/logo.png`，检查文件存在与权限。
  - 测试 T1：`test -f public/logo.png`。
- **阶段 2：撰写并完善 README.md**
  - 重写 `README.md`，包含 Logo 展示与全方位规范内容。
  - 测试 T2：内容检查，覆盖 Logo、场景、架构、路由、本地命令、文档索引与安全准则。
- **阶段 3：验收与一致性检查**
  - 测试 T3：文档链接有效性测试（全量引用路径校验）。
  - 执行质量门禁：`git diff --check`、`pnpm lint`、`wc -l AGENTS.md`。
  - 记录 `result.md` 并完成 MVP 验收。

## 最终验收标准
1. `public/logo.png` 真实存在，并在 `README.md` 顶部正确引入。
2. `README.md` 内容全面对齐 PRD v1.1、API.md 与 AGENTS.md，消除初始脚手架模板。
3. 文档内所有相对链接经脚本测试 100% 有效。
4. `pnpm lint` 正常通过，未破坏项目代码质量。

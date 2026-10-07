# 项目协作规范

适用于本仓库所有需求。本文总行数（含空行和 Next.js 自动区块）不得超过 200 行。

## 1. 项目边界与依据
- 产品：SolaFlow AI，面向东南亚电商的 WhatsApp 多语言订单助手。
- 业务以 `docs/PRD.md` 为准，视觉与交互以 `docs/UI_DESIGN.md` 为准；冲突时先记录并澄清，不能为视觉效果改变业务规则。
- 当前仓库是 Web 前端起步阶段；文档里的目标架构不代表已实现，演示数据必须标注 Demo/Mock。
- 开始前阅读相关文件及局部 `AGENTS.md`，检查 `git status`；保留用户和其他任务的改动，不擅自重置或清理。

## 2. 技术栈与依赖约束
- 包管理器固定为 `package.json` 的 `pnpm@11.17.0`；只维护 `pnpm-lock.yaml`，禁止混用 npm/yarn 锁文件。
- 当前框架：Next.js `16.3.8` App Router、React/React DOM `19.2.8`；禁止新增 Pages Router 或替换构建体系。
- 语言：TypeScript 5、`strict: true`、`@/*` 根目录别名；新增应用代码使用 `.ts/.tsx`，不降低类型检查强度。
- 样式：Tailwind CSS 4 + CSS 变量；类名组合用 `clsx` / `tailwind-merge`，图标用 `lucide-react`。
- 动效用 `motion`，3D 用 `three`；状态管理固定分层：简单局部状态用 React Hooks，共享客户端状态用 `zustand`，服务端数据状态用 TanStack Query（`@tanstack/react-query`）。
- Zustand 已安装，TanStack Query 尚未安装；首次接入相关数据需求时纳入计划并安装，不引入重复的状态管理库。
- 质量配置沿用 ESLint 9、`eslint-config-next` 的 Core Web Vitals 和 TypeScript 规则；不通过禁用规则隐藏问题。
- PRD 目标后端：Node.js/NestJS、PostgreSQL、BullMQ/Redis；尚未落地，相关需求先计划再引入，不另起无关服务栈。
- 依赖版本以 manifest 和锁文件为准；新增/升级依赖须在计划说明必要性、兼容性与替代方案，同步锁文件。
- 涉及 Solana 实现时先读 `.agents/skills/solana-dev/SKILL.md`，核验官方资料及 SDK 兼容性；禁止凭记忆拼接过期 API。

## 3. 强制 MVP 工作流
1. **先计划**：任何实现修改前，完成 `docs/plans/YYYY-MM-DD-<slug>.md`；禁止先实现再补计划。
2. 计划必须有背景/目标、MVP 范围、非目标、风险/依赖、阶段拆分、各阶段测试步骤/输入及预期、最终验收标准。
3. **分段实施**：按可独立验证的小阶段推进；范围变化先更新计划，不夹带无关重构。
4. **即时记录**：每完成一段任务，在继续下一段前更新根目录 `result.md` 的对应需求 checklist，保留历史章节。
5. 每项记录：完成内容/文件、测试样例、执行命令或检查步骤、预期与实际结果、遗留问题、下一步。
6. 未完成或未验证保持 `[ ]`；完成并验证后才勾选 `[x]`；失败/未运行写明原因，禁止虚报通过。
7. **MVP 验收**：范围内最小功能可用，验收逐项满足，相关测试已执行且无未处理失败，才标记需求完成。
8. 文档型需求也执行同一闭环，以内容/结构检查替代不相关的业务测试；阻塞时保留未完成项并报告。

记录格式：
```md
## YYYY-MM-DD：需求名称
计划：docs/plans/YYYY-MM-DD-slug.md
- [ ] 阶段 N：交付内容（文件）；测试 Tn：步骤/命令；预期：…；实际：…；遗留/下一步：…
- [ ] MVP 验收：验收项、测试结果、剩余风险。
```

## 4. 目录与职责
- `app/`：路由、布局、页面与 Route Handlers；页面负责组合，不堆叠业务计算、支付记账或第三方协议逻辑。
- `components/`：可复用 UI；按需创建 `ui/` 基础组件及业务子目录，不提前搭空壳架构。
- `lib/`：纯函数、业务规则、协议适配；按需创建 `lib/server/` 放服务端敏感逻辑，避免客户端导入。
- `hooks/`、`stores/`、`types/`：仅在有复用需求时创建；领域类型靠近领域模块，避免万能 utils/types 文件。
- `public/` 放静态资源；`app/globals.css` 放主题令牌和全局基础样式，组件细节就近维护。
- 单元/组件测试采用同目录 `*.test.ts(x)`；E2E 放 `tests/e2e/*.spec.ts`；测试数据与生产数据隔离。
- `docs/` 放产品/设计/计划；不手改 `.next/`、`node_modules/`、`next-env.d.ts` 等生成内容。

## 5. TypeScript 与代码风格
- 延续现有风格：2 空格缩进、双引号、分号、支持处使用尾逗号；不为格式化重写无关文件。
- 组件/类型用 PascalCase，函数/变量用 camelCase，常量用 UPPER_SNAKE_CASE；普通文件/目录用 kebab-case。
- 遵守 Next.js 的 `page.tsx`、`layout.tsx` 等特殊文件名；Hook 名称以 `use` 开头。
- 默认命名导出；框架要求的页面/布局保留默认导出。Props 明确类型，类型导入使用 `import type`。
- 禁止无依据的 `any`、非空断言和 `@ts-ignore`；外部数据用 `unknown` 接收并校验/收窄后使用。
- 导入分组：框架/第三方、`@/` 内部模块、相对路径与样式；组间空行，避免深层 `../../`。
- 函数保持单一职责，优先 guard clause；可计算值不重复存状态，业务常量命名化，禁止散落魔法数字。
- 状态流转用显式联合类型和受控转换；不要用一组相互矛盾的布尔值表示支付/发送状态。
- Promise 必须处理失败；禁止空 catch、吞掉异常或用强制类型转换掩盖契约错误。
- 注释解释业务原因/约束，不复述代码；TODO 写清原因和后续处理；界面文案与业务逻辑分离。

## 6. Next.js / React / 状态边界
- 编码前先读已安装 Next.js 的相关指南；本版本 API 不按旧经验假设，参数、缓存及服务端边界按本地文档实现。
- 页面与布局优先 Server Components；仅在必要交互边界加 `"use client"`，不把整棵应用无差别客户端化。
- 数据库、密钥、权限判断留在服务端；客户端收到的 Props 应可序列化，服务端模块不依赖浏览器 API。
- `window`、WebGL、音频及钱包访问放在安全的客户端生命周期；正确清理计时器、订阅、事件和 3D 资源。
- Effect 只用于外部同步，依赖必须完整；避免用 Effect 串联可直接推导的 UI 状态。
- 简单局部状态用 React Hooks（`useState` / `useReducer`），例如单组件弹窗开关和输入框；不要为此创建全局 store。
- 共享客户端状态用 Zustand，例如跨页面筛选草稿、全局 UI 偏好；按领域拆分 store，按需选择状态。
- 服务端数据状态用 TanStack Query：订单列表等远端数据的请求、缓存、刷新、提交与失效统一管理；禁止在 Zustand 或自制 Effect 中重复维护远端缓存。
- Query Key 包含必要的租户/资源/筛选参数，变更成功后更新或失效相关缓存；切换账号/租户时隔离或清理旧缓存，缓存不能替代服务端鉴权。
- 纯 Server Components 可直接读取服务端数据；需要客户端同步时按官方 Next.js 指南接入 Query Provider、预取与 hydration，服务端 QueryClient 不跨请求共享。
- Zustand、Hooks 和 Query 缓存均不作为订单、余额、权限或服务端持久化数据的权威来源，最终以服务端校验结果为准。
- 交互必须覆盖 loading、empty、error、success；提交期间防重复，失败允许恢复，不能假装成功。
- 图片/字体/导航优先项目框架能力；重资源按需加载，保持首屏可用，避免不必要的客户端依赖。

## 7. UI、可访问性与性能
- 复用 `docs/UI_DESIGN.md` 的设计令牌；全局颜色/间距/排版集中定义，避免各组件私造一套主题。
- 语义化 HTML；按钮用 button，导航用链接；输入有 label，图标按钮有可访问名称，图片有适当 alt。
- 弹窗管理焦点、支持 Escape、关闭后恢复焦点；键盘能操作所有核心流程，焦点状态清晰。
- 支持 `prefers-reduced-motion`；WebGL 不可用或低性能设备有静态降级，不让动画阻塞订单/支付操作。
- 至少检查 375px、768px、1440px 视口，以及长文案/多语言；禁止横向溢出、截断关键金额或状态。
- 时间存储/交换用明确时区的格式，展示按店铺时区；金额/日期使用适当本地化格式，不拼接歧义字符串。
- 不自动播放声音、不伪造 KPI/已读/支付成功；性能目标用实际测量证明，不能凭感觉宣称达成。

## 8. 数据、安全与业务不变量
- 外部输入在服务端校验；认证会话决定租户，所有查询/修改/导出/异步任务核对租户归属，不信任传入 tenant_id。
- Secret 不进仓库、日志或 `NEXT_PUBLIC_*`；示例环境变量只放占位符；日志脱敏手机号、消息正文和钱包相关敏感信息。
- Webhook 必须验签、防重放并幂等；重试、重复和乱序事件不得重复发送、重复扣费或倒退状态。
- 消息发送遵守 PRD 的同意、模板、窗口、静默时段和频次规则；付款、退订、人工接管触发安全停止。
- 金额/链上数量使用最小单位整数或精确定点类型；禁止用浮点数计算财务账本，明确序列化边界。
- Solana Pay 仅用于商户购买本产品服务；买家商品付款保持原渠道，测试网与主网数据/配置严格隔离。
- 不把钱包签名、交易提交或 confirmed 当作额度可用；按 PRD 在 finalized 且完整校验后原子入账、去重。
- 校验网络、mint、收款人、金额、订单关联与租户；失败/过期/金额不符不自动加余额。
- 真实发送、主网支付、生产迁移或破坏性操作须先取得明确授权；测试默认使用隔离环境与 mock。

## 9. 测试策略与固定样例
- 当前未安装测试框架，也没有 `test` 脚本；禁止声称已有自动化覆盖，或直接把不存在的命令记作通过。
- 约定单元/组件测试采用 Vitest + React Testing Library，E2E 采用 Playwright；首次相关需求将最小测试设施纳入计划后落地。
- 纯规则测输入输出，组件测用户可见行为，接口测认证/校验/幂等；异步 Server Components 与关键跨页流程用 E2E 验证。
- 用例按 Arrange/Act/Assert 或 Given/When/Then 编写；名称说明场景和预期；修 bug 先补可复现的失败用例。
- 时间、随机数、网络、RPC 和第三方 API 可控；禁止测试访问真实商户或消耗真实资金，不用固定 sleep 掩盖竞态。
- 每个需求覆盖正常、边界、异常及相关回归；不适用的矩阵项在计划说明，不以快照替代行为断言。
- 暂缺设施时记录可复现手动步骤及缺口；支付、权限、计费等关键逻辑交付必须包含自动化回归。

| 场景 | 测试输入/动作 | 必须断言的预期 |
| --- | --- | --- |
| 正常路径 | 合法数据提交一次 | 请求/状态与预期一致，成功展示准确，无重复副作用 |
| 边界输入 | 空值、0、负数、超上限、长文本 | 按字段规则拒绝或处理；错误清楚，不写入非法数据 |
| 加载/失败 | 空列表、超时、服务端 500 后重试 | 空/错状态可见，可恢复，不展示虚假成功 |
| 权限隔离 | 未登录请求、租户 A 访问 B 资源 | 拒绝访问，不泄露资源内容或产生跨租户写入 |
| 幂等与并发 | 双击提交、同 Webhook 重放、并发重试 | 仅一次发送/扣费/入账，重复结果可追踪 |
| 发送停止 | 已排队时发生付款、退订或人工接管 | 后续自动发送停止，状态与审计可核对 |
| 支付异常 | 错网络/mint/金额/收款人、用户拒签 | 不增加额度；明确错误，允许按规则重试 |
| 支付确认 | 先 confirmed，再 finalized，重复回调 | 前者仅待确认；完整校验后入账一次，租户正确 |
| 可访问性/UI | 三档视口、Tab/Enter/Escape、减少动态效果 | 不溢出，键盘可完成流程，焦点正确，动效降级 |
| 状态分层 | 弹窗开关、跨页面筛选草稿、订单查询；修改订单/切换租户 | 分别用 Hooks/Zustand/TanStack Query；相关缓存刷新，不显示旧租户数据 |
| 文档变更 | 核对链接/路径、命令、行数、原有区块 | 引用有效，内容自洽，AGENTS.md ≤ 200 行 |

## 10. 验证命令与交付闸门
- 安装依赖：`pnpm install --frozen-lockfile`；有意改依赖时用 pnpm 更新并审阅 manifest/锁文件差异。
- 本地开发：`pnpm dev`；发布态启动：先 `pnpm build`，再 `pnpm start`。
- 代码改动：执行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、相关测试和 `pnpm build`。
- 测试设施落地后：`pnpm exec vitest run`、`pnpm exec playwright test`；在计划和结果写明实际运行范围。
- 文档改动：检查路径/内容、`wc -l AGENTS.md` 和 `git diff --check`；不要求无关的构建，但明确哪些检查未运行。
- UI 需求补充浏览器验收记录/截图；接口和业务需求记录输入、响应、状态副作用；不得只以编译通过代替功能验收。
- 环境阻塞、既有失败与本次引入失败分别记录；关键验收未完成时，需求不能勾选完成。
- 交付前审阅 `git diff`，确保只包含本次范围，不提交密钥、临时产物或无关格式变更；未经要求不提交/推送。
- 最终回复简述修改文件、验证结果、剩余风险；`result.md` 必须与实际交付一致。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

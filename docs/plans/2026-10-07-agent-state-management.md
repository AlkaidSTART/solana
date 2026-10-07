# 计划：明确前端状态管理分层

- 背景：现有 AGENTS.md 将简单状态与 Zustand 区分，但未明确 TanStack Query 的服务端数据状态职责。
- 目标：统一约束局部 UI 状态使用 React Hooks、共享客户端状态使用 Zustand、服务端数据状态使用 TanStack Query。
- MVP 范围：只修改 AGENTS.md 与本计划、result.md 的记录；不安装依赖、不编写业务实现。
- 非目标：不将 TanStack Query 误称为后端持久化数据的权威来源，不强制纯 Server Components 无差别使用客户端 Query。
- 依赖/风险：Zustand 已在 package.json，`@tanstack/react-query` 尚未安装；实际使用前须纳入相应需求的依赖计划；Next.js 自动区块须保留。

## 阶段

- [x] 阶段 1：核对当前规范、依赖及 TanStack Query 官方 Next.js 指南；登记状态和测试方案。
- [x] 阶段 2：更新 AGENTS.md，写清三类状态的选择和职责边界。
- [x] 阶段 3：完成结构与案例校验，在 result.md 记录结果并验收。

## 测试样例/验收

- T1：查看 AGENTS.md 技术栈与状态边界；预期 Hooks=局部状态、Zustand=共享客户端状态、TanStack Query=服务端数据状态（请求/缓存/同步），无职能混淆。
- T2：检查当前 package.json；预期准确记载已安装 Zustand、TanStack Query 尚未安装；不新增依赖或伪报测试。
- T3：场景判定：单组件弹窗开关→Hooks；跨页面筛选草稿→Zustand；订单列表远端查询/缓存/刷新→TanStack Query；预期都可按规则唯一归类。
- T4：查看 Next.js 自动区块及 `wc -l AGENTS.md`、`git diff --check`；预期区块不变、总行数≤200、无空白错误。

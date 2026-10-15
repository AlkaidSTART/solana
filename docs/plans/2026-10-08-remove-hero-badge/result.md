# 需求执行记录：移除官网 Hero 顶部微胶囊标签

计划：docs/plans/2026-10-08-remove-hero-badge/plan.md

- [x] 阶段 1：移除 Hero 微胶囊标签与清理 badge 字段（文件：`app/page.tsx`）；测试 T1：全文检索 `badge`；预期：源码无 `t.badge` / `badge:` 字段与胶囊 DOM，Hero 其余结构完整；实际：已删除 Hero 顶部微胶囊 `<div>` 区块及 `<span>{t.badge}</span>`，将 `heroTitles` 类型收敛为 `{ headline: string; subhead: string }` 并移除 ZH/EN/SG/ID/MY/TH/VI/PH 共 8 个语言的 `badge` 文案；`grep -n "badge" app/page.tsx` 无任何残留；Hero 标题、副标、CTA 与 3D 背景结构保持完整；遗留/下一步：进入阶段 2 质量检查。
- [x] 阶段 2：质量检查与验证（命令：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`）；预期：全部通过且无残留引用；实际：`pnpm lint` 通过（0 错误 0 警告）；`next typegen` 生成类型成功、`tsc --noEmit` 退出码 0 无类型错误；`pnpm build` 成功完成全站页面与全部 API 路由构建；另用 `grep -rl` 复查 `.next/static` 产物，已不含被移除的中/英文徽标文案；遗留/下一步：无遗留，进入 MVP 验收。
- [x] MVP 验收：验收项逐项核对完毕：
  1. `app/page.tsx` 中 Hero 顶部微胶囊标签 UI 已移除，`heroTitles` 不再含 `badge` 字段，源码与构建产物均无该文案残留；
  2. Hero 标题、副标与行动按钮结构完整，语言切换仅引用 `headline` / `subhead`，不再触发已删除字段；
  3. `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build` 全部通过；
  4. 本次范围改动仅涉及 `app/page.tsx` 与本计划目录。附注：因工作区存在并行任务，改动被一并包含在提交 `fde4307` 中（同一提交亦含他人 telemetry mock 相关改动），本次未自行提交或推送。

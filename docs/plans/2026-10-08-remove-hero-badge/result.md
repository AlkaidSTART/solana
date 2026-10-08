# 需求执行记录：移除官网 Hero 顶部微胶囊标签

计划：docs/plans/2026-10-08-remove-hero-badge/plan.md

- [ ] 阶段 1：移除 Hero 微胶囊标签与清理 badge 字段（文件：`app/page.tsx`）；测试 T1：全文检索 `badge`；预期：源码无 `t.badge` / `badge:` 字段与胶囊 DOM，Hero 其余结构完整；实际：…；遗留/下一步：…
- [ ] 阶段 2：质量检查与验证（命令：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`）；预期：全部通过且无残留引用；实际：…；遗留/下一步：…
- [ ] MVP 验收：Hero 顶部微胶囊标签移除且无 badge 残留；Hero 渲染正常；质量闸门通过；git diff 仅含本次范围。

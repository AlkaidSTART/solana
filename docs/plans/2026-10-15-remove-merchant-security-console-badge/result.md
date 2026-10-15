# 需求执行记录：移除登录卡片“商户安全工作台”与绿色指示灯
计划：docs/plans/2026-10-15-remove-merchant-security-console-badge/plan.md

- [x] 阶段 1：交付内容：修改 `components/auth/auth-card.tsx` 移除微徽章与绿灯节点；测试 T1：静态代码排查 `grep -n "商户安全工作台"`；预期：卡片内部彻底无徽章与呼吸灯结构；实际：成功移除，无多余未引用字段；遗留/下一步：进入阶段 2。
- [x] 阶段 2：交付内容：更新 `components/auth/auth-centered-redesign.test.tsx` 断言；测试 T2：运行 `pnpm exec vitest run components/auth/auth-centered-redesign.test.tsx` 及全量测试；预期：所有测试通过且确认不再包含“商户安全工作台”与微徽章；实际：32 个测试套件、297 个用例 100% 通过；遗留/下一步：进入阶段 3。
- [x] 阶段 3：交付内容：执行质量验证闸门；测试 T3：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`；预期：编译与类型检查零报错；实际：ESLint 0 报错、TypeScript 0 报错、Next.js 16.3.8 生产构建全路由输出成功；遗留/下一步：最终交付。
- [x] MVP 验收：
  - 验收项 1：登录与注册卡片顶部绿色呼吸灯（`animate-pulse bg-emerald-500`）已完全去除。
  - 验收项 2：登录与注册卡片顶部“商户安全工作台”（及其英文/印尼文徽标）已彻底不展示，卡片头部更干净、居中、专注。
  - 验收项 3：核心登录、注册、OTP、密码、OAuth 交互及合规信息保持完全正常。
  - 测试结果：Vitest 32 个测试套件（297 个用例）全部 100% 通过；生产构建全部通过。
  - 剩余风险：无。

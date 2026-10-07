# 需求执行记录：Devnet 原生 SOL 小额付款测试
计划：docs/plans/2026-10-07-devnet-sol-smoke/plan.md
- [x] T1 计划：确认用户持有 Devnet SOL，固定 0.001 SOL、独立测试收据、无 Credits；读项目 skill/PRD/现有支付模块与 Next Route Handler；git 初始干净；Solana MCP 已配置。
- [x] T1 依赖：`pnpm add @solana-program/system@0.15.0` 成功；peer `@solana/kit ^8.3.0` 兼容本地 8.4.0，沿用官方 System 转账构造器；核验官方 System 仓库、instructions 和 getTransaction 文档及本地类型。只修改 manifest/pnpm lock；发现其他任务的 i18n result.md 改动，保留。下一步 T2。
- [ ] T2 服务端与验证自动化。
- [ ] T3 钱包、页面与浏览器回归。
- [ ] T4 质量闸门及本地配置预检。
- [ ] MVP 实链验收：等待用户钱包签名、finalized 和完整校验；不能以 Mock 测试宣称实链成功。
- [x] T2（第一段）：新增 `lib/payments/sol-test/{contracts,verify}.ts`、`lib/server/payments/sol-test/{quote,service,http}.ts` 与 quote/check POST routes；金额为整数 lamports，HMAC 绑定收款/reference/时间，非 production + 来源检查，无数据库/额度写入。自动化：`pnpm exec vitest run lib/payments/sol-test/verify.test.ts lib/server/payments/sol-test`，34/34 通过；`pnpm exec tsc --noEmit` 通过。覆盖错额/程序/网络/地址/reference、异常时间、篡改、进程重启、跨来源、confirmed/finalized/重查。下一步 T3 钱包及 UI。

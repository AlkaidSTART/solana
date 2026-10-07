# 需求执行记录：Devnet 原生 SOL 小额付款测试
计划：docs/plans/2026-10-07-devnet-sol-smoke/plan.md
- [x] T1 计划：确认用户持有 Devnet SOL，固定 0.001 SOL、独立测试收据、无 Credits；读项目 skill/PRD/现有支付模块与 Next Route Handler；git 初始干净；Solana MCP 已配置。
- [x] T1 依赖：`pnpm add @solana-program/system@0.15.0` 成功；peer `@solana/kit ^8.3.0` 兼容本地 8.4.0，沿用官方 System 转账构造器；核验官方 System 仓库、instructions 和 getTransaction 文档及本地类型。只修改 manifest/pnpm lock；发现其他任务的 i18n result.md 改动，保留。下一步 T2。
- [ ] T2 服务端与验证自动化。
- [ ] T3 钱包、页面与浏览器回归。
- [ ] T4 质量闸门及本地配置预检。
- [ ] MVP 实链验收：等待用户钱包签名、finalized 和完整校验；不能以 Mock 测试宣称实链成功。
- [x] T2（第一段）：新增 `lib/payments/sol-test/{contracts,verify}.ts`、`lib/server/payments/sol-test/{quote,service,http}.ts` 与 quote/check POST routes；金额为整数 lamports，HMAC 绑定收款/reference/时间，非 production + 来源检查，无数据库/额度写入。自动化：`pnpm exec vitest run lib/payments/sol-test/verify.test.ts lib/server/payments/sol-test`，34/34 通过；`pnpm exec tsc --noEmit` 通过。覆盖错额/程序/网络/地址/reference、异常时间、篡改、进程重启、跨来源、confirmed/finalized/重查。下一步 T3 钱包及 UI。
- [x] T3：新增 SOL wallet、独立页面/客户端面板、账单页入口；v1 按能力选用、v0 回退，固定 1,000,000 lamports，无优先费；sessionStorage 在发送前落防重标记，支持签名恢复和只读刷新。`pnpm exec vitest run lib/payments/sol-test lib/server/payments/sol-test` 41/41；Playwright 专项 5/5（375/768/1440、Enter、减少动态、网络错误/查询失败/无效签名/恢复）。首轮 5 个 E2E 因 Next route-announcer 同为 alert 导致定位不唯一失败，改为页面 p[role=alert] 后复跑全部通过，未隐藏产品异常。截图位于 test-results/sol-test-Mock-SOL-workflow-and-recovery-at-{375,768,1440}px/sol-test-*.png；375px 已人工查看，无横向溢出、金额完整。页面无弹窗，Escape/焦点恢复不适用。拒签/余额不足/超时覆盖在钱包单测，无真实付款。
- [x] T4 预检：对已运行 localhost:3000 的 `/api/payments/sol-test/quote` 发同源 POST 返回 HTTP 200，网络预检通过且金额为 1000000；未读取/修改 .env，未签名/广播。T3 初次 typecheck 发现 ES2017 不支持 bigint literal 以及 v0 不接受 v1 priorityFee 参数，已改用 BigInt() 并移除 v0 参数；同时观察到并行取消订单任务的 cancelled 文案映射/rowCount 类型暂未同步，未覆盖他人更改，待全量复验。

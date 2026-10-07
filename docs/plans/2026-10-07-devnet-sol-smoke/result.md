# 需求执行记录：Devnet 原生 SOL 小额付款测试
计划：docs/plans/2026-10-07-devnet-sol-smoke/plan.md
- [x] T1 计划：确认用户持有 Devnet SOL，固定 0.001 SOL、独立测试收据、无 Credits；读项目 skill/PRD/现有支付模块与 Next Route Handler；git 初始干净；Solana MCP 已配置。
- [x] T1 依赖：`pnpm add @solana-program/system@0.15.0` 成功；peer `@solana/kit ^8.3.0` 兼容本地 8.4.0，沿用官方 System 转账构造器；核验官方 System 仓库、instructions 和 getTransaction 文档及本地类型。只修改 manifest/pnpm lock；发现其他任务的 i18n result.md 改动，保留。下一步 T2。
- [x] T2 服务端与验证自动化（见下方执行记录）。
- [x] T3 钱包、页面与浏览器回归（Mock transport；真实签名仍待用户操作）。
- [x] T4 质量闸门及本地配置预检（最终构建/类型检查通过；完整实链验收另列）。
- [ ] MVP 实链验收：等待用户钱包签名、finalized 和完整校验；不能以 Mock 测试宣称实链成功。
- [x] T2（第一段）：新增 `lib/payments/sol-test/{contracts,verify}.ts`、`lib/server/payments/sol-test/{quote,service,http}.ts` 与 quote/check POST routes；金额为整数 lamports，HMAC 绑定收款/reference/时间，非 production + 来源检查，无数据库/额度写入。自动化：`pnpm exec vitest run lib/payments/sol-test/verify.test.ts lib/server/payments/sol-test`，34/34 通过；`pnpm exec tsc --noEmit` 通过。覆盖错额/程序/网络/地址/reference、异常时间、篡改、进程重启、跨来源、confirmed/finalized/重查。下一步 T3 钱包及 UI。
- [x] T3：新增 SOL wallet、独立页面/客户端面板、账单页入口；v1 按能力选用、v0 回退，固定 1,000,000 lamports，无优先费；sessionStorage 在发送前落防重标记，支持签名恢复和只读刷新。`pnpm exec vitest run lib/payments/sol-test lib/server/payments/sol-test` 41/41；Playwright 专项 5/5（375/768/1440、Enter、减少动态、网络错误/查询失败/无效签名/恢复）。首轮 5 个 E2E 因 Next route-announcer 同为 alert 导致定位不唯一失败，改为页面 p[role=alert] 后复跑全部通过，未隐藏产品异常。截图位于 test-results/sol-test-Mock-SOL-workflow-and-recovery-at-{375,768,1440}px/sol-test-*.png；375px 已人工查看，无横向溢出、金额完整。页面无弹窗，Escape/焦点恢复不适用。拒签/余额不足/超时覆盖在钱包单测，无真实付款。
- [x] T4 预检：对已运行 localhost:3000 的 `/api/payments/sol-test/quote` 发同源 POST 返回 HTTP 200，网络预检通过且金额为 1000000；未读取/修改 .env，未签名/广播。T3 初次 typecheck 发现 ES2017 不支持 bigint literal 以及 v0 不接受 v1 priorityFee 参数，已改用 BigInt() 并移除 v0 参数；同时观察到并行取消订单任务的 cancelled 文案映射/rowCount 类型暂未同步，未覆盖他人更改，待全量复验。

- [x] T4 全量回归第一轮：`pnpm lint` 通过；`pnpm test` 10 文件 / 155 测试通过；`pnpm exec playwright test` 13/13 通过，包含原 USDC 流程与 SOL 新入口。`next typegen` 通过，首次全量 tsc 被并行取消订单任务的 repository.ts rowCount 契约阻塞，未修改其代码，待最终复验。`git diff --check` / `git diff --cached --check` 通过；`wc -l AGENTS.md` = 140。
- [x] T4 路由互通预检：真实本地 quote HTTP 200，随后用其签名 token + 隔离的不存在交易签名调用 check，HTTP 200 / pending；验证两个路由共享签名密钥且不会把签名输入当成功。只有只读 RPC，无交易广播。

## 用户实际验收步骤（待执行）
1. `pnpm dev`，打开 `/console/billing/sol-test`，选择创建 0.001 SOL 报价；本轮 localhost:3000 已运行且报价配置预检成功。
2. 钱包切换 Devnet，连接有测试 SOL 的钱包。核对收款地址归属；付款钱包必须与收款钱包不同。不索取/填写私钥。
3. 点击「确认支付 0.001 SOL」，在钱包核对网络、收款和金额（另有网络手续费）后手动批准。
4. 页面显示签名 / Explorer，然后只读查询。confirmed 仍待确认，只有 finalized 且验证通过显示 SOL 测试成功；不会加 Credits。
5. 网络超时或刷新后不自动付款，可粘贴钱包交易签名继续核验。报价 20 分钟过期；旧交易仍按链上付款时间核验。服务重启使签名 token 失效时去 Explorer 确认，不要自动新付。

## 边界与风险
- 仅非 production 的 Devnet 测试 capability，无生产登录、租户账本、永久收据；不能用于充值或生产付款。
- 浏览器发送使用公开 Devnet RPC，服务端 RPC 地址不会泄露到浏览器；公开 RPC 不可用时可恢复核验，不自动重发。
- 未访问受保护环境文件、未代签/广播、未执行 git commit/push；工作区存在并行需求改动和外部自动提交，保留现状。
- 实链签名、到账及 finalized 验收尚未发生；禁止以自动化结果宣称真实付款已跑通。

- [x] T4 最终复验：并行订单/i18n 修改期间一度出现 `orders_rule_cart_recovery` 翻译 key 未同步，首次 build 因该外部类型错误失败；未修改其文件。其他任务同步后再次 `pnpm exec tsc --noEmit` 退出 0，`pnpm build` 退出 0，20 个页面生成完毕，含两个 SOL API 及 `/console/billing/sol-test`。375/768/1440 截图均已人工查看。构建仅保留上级目录 pnpm-workspace.yaml 被忽略的既有警告，无本需求失败。
- [ ] MVP 实链最终验收：代码、自动化、真实本地配置与只读 RPC 预检已交付；尚缺用户钱包批准产生的真实交易签名及 finalized 成功证据。最终状态为“可进入钱包付款测试”，不是“已实链支付成功”。

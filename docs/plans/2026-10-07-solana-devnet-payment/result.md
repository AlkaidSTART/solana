# 需求执行记录：Solana Devnet USDC 支付
计划：docs/plans/2026-10-07-solana-devnet-payment/plan.md
- [x] 调研：读取项目 skill/支付安全参考、PRD 6.3–6.6、UI_DESIGN、Next Route Handler/Cookies/组件边界文档；git status 初始干净。发现原支付是假成功，按 PRD 替换；Docker daemon 未运行，CLI 无 solana/surfpool。
- [x] 阶段 1：Kit 8.4 / wallet 0.20 / RPC 0.19、Query、PostgreSQL 及测试依赖已安装；`pnpm peers check` 无冲突，Vitest 固定到兼容 Node 类型的 4.x。官方 Circle USDC 地址核对一致；`curl getGenesisHash` 返回完整 Devnet hash，发现原常量仅前缀并修正（新增独立常量回归）。资料：Circle USDC contract addresses、Solana Pay spec。
- [x] 阶段 2 首轮：`pnpm exec vitest run` 2 文件 40 用例通过（PGlite 隔离数据库、RPC 合成输入，不是实链）。覆盖报价边界、交易验证、并发/回放、租户、回滚、confirmed/finalized、分页、过期补偿。后续补 API 安全和真实 RPC 格式证据后复验。
- [ ] 阶段 2：服务端实现及自动化回归。
- [ ] 阶段 3：钱包/支付 UI 及浏览器验证。
- [ ] 阶段 4：质量闸门、Devnet 联调。
- [ ] MVP 验收：真实链上支付和全部关键检查完成前不勾选。
- [x] 阶段 3 首轮检查：安装 Chromium 成功；`pnpm exec playwright test` 实际 2 通过 / 3 失败。失败为 375/768 顶栏横向溢出及 1440 到账后账本未刷新；已保存失败 trace 于忽略目录 test-results。下一步修复共享缓存、假报价兼容入口和顶栏后重跑，未宣称浏览器验收通过。

## 阶段 2 / 3 后续执行历史
- [x] 服务端/钱包隔离回归首轮：`pnpm test` 6 文件 108 用例通过；`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit` 通过。覆盖 review_required、金额不符后有效候选、租户/开关检查、钱包 ATA/reference/版本选择/拒签/余额/网络；使用 PGlite 和 mock RPC/钱包，不是实链。
- [x] 浏览器修复回归：375/768px 顶栏溢出及支付弹窗 QueryClient 缓存边界已修复；此前 5 条浏览器测试通过。移除首页默认假报价，改为导航账单；375px 截图目视无横向溢出且长地址换行。
- [x] Mock Wallet Standard 注册 fixture 修复：首轮扩展全集在注册事件上失败（误用 CustomEvent）；修复后 `pnpm exec playwright test -g 'Wallet Standard'` 1 passed。覆盖错误网络、恢复订单不重发；仍需复跑完整套件。
- [ ] 最新质量闸门：此前 `pnpm build` 编译通过但并行任务的 app/page.tsx JSX 类型检查失败，不能记为构建通过；下一步重跑所有检查。
- [ ] Devnet 实链验收：Docker daemon 不可用，无已确认的隔离 PostgreSQL、收款配置和已备资测试钱包；尚无真实签名/finalized/实库入账证据。公共 RPC genesis/mint 格式核验不是付款凭证。

## 本地 Devnet 联调步骤（待执行）
前提：使用独立的本地测试 PostgreSQL、商户 Devnet 收款公钥、支持 Devnet 的钱包。付款钱包至少准备 2 Devnet USDC 和足够测试 SOL（手续费及可能的 ATA 租金）。不使用主网资产、生产数据库或生产权益。以下值均需自行替换，不把凭据提交到仓库；在启动各进程的终端设置相同变量：

```sh
export PAYMENTS_DEVNET_ENABLED=true
export PAYMENTS_ALLOW_LOCAL_SESSION=true
export DATABASE_URL='postgresql://TEST_USER:TEST_PASSWORD@127.0.0.1:5432/solaflow_devnet'
export SOLANA_RECIPIENT='REPLACE_WITH_DEVNET_RECIPIENT_PUBLIC_KEY'
export SOLANA_RPC_URL='https://api.devnet.solana.com'
export PAYMENT_APP_ORIGIN='http://localhost:3000'
pnpm payments:db
pnpm dev
# 另一个已设置相同变量的终端保持运行：
pnpm payments:worker
```

访问 `http://localhost:3000/console/billing`，创建本地测试会话、购买 100 测试 Credits；核对 2 Devnet USDC、mint、收款公钥后签名，或用已切换 Devnet 的钱包扫描 Solana Pay QR。确认阶段不可增加额度；最终完整校验后余额增加 100 且仅一条账本记录。关闭页面再打开、重复检查和重启 worker 后不得重复入账。保存订单 ID、signature、finalized 查询及数据库账本证据后方可勾选实链验收。拒签、错误网络、错误金额不得入账。测试余额不会改变 Demo/生产 Credits。

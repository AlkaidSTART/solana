# 需求执行记录：Solana Devnet USDC 支付
计划：docs/plans/2026-10-07-solana-devnet-payment/plan.md
- [x] 调研：读取项目 skill/支付安全参考、PRD 6.3–6.6、UI_DESIGN、Next Route Handler/Cookies/组件边界文档；git status 初始干净。发现原支付是假成功，按 PRD 替换；Docker daemon 未运行，CLI 无 solana/surfpool。
- [x] 阶段 1：Kit 8.4 / wallet 0.20 / RPC 0.19、Query、PostgreSQL 及测试依赖已安装；`pnpm peers check` 无冲突，Vitest 固定到兼容 Node 类型的 4.x。官方 Circle USDC 地址核对一致；`curl getGenesisHash` 返回完整 Devnet hash，发现原常量仅前缀并修正（新增独立常量回归）。资料：Circle USDC contract addresses、Solana Pay spec。
- [x] 阶段 2 首轮：`pnpm exec vitest run` 2 文件 40 用例通过（PGlite 隔离数据库、RPC 合成输入，不是实链）。覆盖报价边界、交易验证、并发/回放、租户、回滚、confirmed/finalized、分页、过期补偿。后续补 API 安全和真实 RPC 格式证据后复验。
- [ ] 阶段 2：服务端实现及自动化回归。
- [ ] 阶段 3：钱包/支付 UI 及浏览器验证。
- [ ] 阶段 4：质量闸门、Devnet 联调。
- [ ] MVP 验收：真实链上支付和全部关键检查完成前不勾选。

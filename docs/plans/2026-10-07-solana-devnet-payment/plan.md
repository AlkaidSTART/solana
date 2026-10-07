# Solana Devnet USDC 支付 MVP

## 背景与目标
现有弹窗用定时器、假 signature、Zustand 入账，不构成支付。按项目 solana-dev skill 和 PRD 6.3–6.6，实现可配置的 Devnet 点数加购闭环，测试额度与原 Demo / 正式额度隔离。UI_DESIGN 的即时到账、赠额和声音与 PRD 冲突，本次采用 PRD 定价及 finalized 规则，不更改业务规则迎合视觉稿。

## MVP 范围
- 100 Credits 起购、整数数量、0.02 USDC/Credit；服务端快照、20 分钟报价、唯一 reference。
- Devnet 原生 USDC 固定允许列表，RPC genesis 校验；服务端生成 Solana Pay URL / QR。
- Wallet Standard 连接、签名、金额/网络/收款方说明、拒签/失败/过期恢复。核验已安装 Kit API；支持 v1 的钱包使用 v1，不支持时使用 v0。
- PostgreSQL 持久化订单、测试会话、候选审计、转账占用与测试额度流水；租户来源于服务端会话，原子入账与唯一约束。
- confirmed 仅提示，finalized + token program/mint/收款 ATA/金额/reference/链上时间完整验证后入账。无效候选不阻断后续候选。独立 worker 在关页后继续检测。
- TanStack Query 管理服务端状态；重开后恢复订单/账本，不写入 Zustand Demo 余额。
- 本地开发会话必须显式开启且仅 loopback、非 production 可签发；不是生产身份认证。

## 非目标
主网、真实商户/发送、套餐订阅/续费、退款自动化、生产认证/部署、全面重构现有 Demo、Anchor 合约或新后端框架。正式权益未开放。

## 风险/依赖
- 无现成 DB、钱包与资金配置，Docker daemon 当前未运行；真实 Devnet 付款依赖 RPC、测试 SOL/USDC 与钱包。缺失时明确阻塞，不伪报实链通过。
- 新增 Kit 8 + wallet/RPC 插件、SPL token 构造器（替代 legacy web3.js）、TanStack Query（符合状态分层）、pg（PRD PostgreSQL）、Zod（边界校验）、qrcode（服务端 QR）、server-only。
- 测试新增 Vitest、Playwright、PGlite（仅测试使用的 PostgreSQL 引擎，不作为产品后端）、tsx（worker/初始化）。以 registry/包声明核验 peer 兼容性并固定锁文件。
- 部分钱包/网络 v1 支持可能不同，以官方资料、安装类型和实际仿真为准；不得盲从 skill 示例。
- 支付服务禁止 production/主网上线；轮询 worker 需持续运行，候选分页与补偿可恢复，异常 fail closed。

## 阶段与验证
1. T1 调研/依赖：读 skill、PRD、UI、Next 本地指南；核验官方 Pay spec/Circle/Kit；创建计划后安装最小依赖。预期版本兼容，无无关文件变化。
2. T2 服务端与规则：schema、配置、会话、报价、RPC 适配、验证、数据库结算、API/worker。Vitest 正常、100/0/负数/小数/过大、错误 mint/程序/金额/收款/reference/时间、confirmed、失败交易、重放/并发/跨租户、过期后发现有效付款、无效候选后有效付款、原子回滚。预期仅完整 finalized 一次入账。
3. T3 前端：替换假支付与账本，Query、钱包、QR、焦点/键盘、重开恢复。浏览器隔离 API/RPC mocks 测 loading/empty/error/retry、三档视口、拒签与减少动效；与真实网络结果明确区分。
4. T4 验收：lint、next typegen + tsc、Vitest、Playwright、build、git diff --check、AGENTS 行数；尝试 Devnet 网络连通/实链联调，保存证据或阻塞原因。运行说明写入 result.md / README，不提交 secrets 或测试产物。

## 实施补充
- 钱包使用已安装 wallet 插件的 React hooks 及局部 client，不另装 @solana/react Provider（避免重复上下文）。公共浏览器 Devnet RPC 不携带密钥；服务端 RPC 可单独配置。
- 账单页保留已有企业视觉，但用隔离测试账本替换假支付 KPI/赠额，不改其他页面；首页旧弹窗入口改为账单导航，避免绕过服务端报价。专用 native dialog 管理焦点，不重构共享 Modal。
- 生产环境完全禁止本模块，必须显式 PAYMENTS_DEVNET_ENABLED=true。钱包提交不明确时禁止自动重发；用户核查后方可手动重试。

## 最终验收
范围内正常/异常/权限/并发自动化无未处理失败；界面不再伪造支付、费用、耗时或正式 Credits；服务重开可读持久订单，worker 独立运行；所有检查真实记录。只有真实 Devnet 交易验证和全部关键验收完成才标记整个需求完成，否则明确剩余用户操作/环境阻塞。

### T3 回归修复补充
浏览器首轮复现 375/768px 顶栏溢出、弹窗独立 QueryClient 使账本失效不传播。修复同一账单缓存边界及顶栏必要响应式约束；兼容首页无 checkout 的调用，但仅提供账单导航，不生成默认假订单/二维码。新增钱包模块隔离测试（真实 SPL 指令构造 + mock 钱包/RPC）验证拒签、余额不足、网络不符和版本选择；不把这些测试视为实链付款。

### T2 安全复验补充
补充 review_required 隔离状态：少付/多付、缺失链上时间、有效期外付款、已 confirmed 候选消失时不入账并提示核查；正确的后续候选仍可结算。扩展约束须兼容已初始化的测试表，不删除记录。会话读取同样执行 Devnet 开关检查；客户端校验响应租户/订单，避免会话切换时展示旧账本和付款弹窗。运营审批、备用 RPC/30 分钟告警与实际部署仍未实现，不能将此开发闭环当作完整生产 PRD 验收。

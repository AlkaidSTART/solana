# Devnet 原生 SOL 小额付款测试

## 背景 / 目标
用户只有 Devnet SOL，希望实际连接钱包并支付；明确不是 USDC。保留 PRD 的 USDC 商品计价，新增隔离的原生 SOL 测试收据，不购买订阅、不增加任何 Credits。

## MVP 范围
- `/console/billing/sol-test` 固定每笔 0.001 SOL（1,000,000 lamports），不开放任意金额。账单页提供明显入口。
- Kit 8 / Wallet Standard 构造 System Program 原生转账，绑定唯一只读 reference，核验 Devnet genesis；按钱包能力使用 v1 或 v0，签名前显示收款人/金额/网络。
- 仅显式启用、非 production 的本地测试服务。使用现有 SOLANA_RECIPIENT / SOLANA_RPC_URL / PAYMENT_APP_ORIGIN；本入口无需数据库或 USDC。
- 服务端签名短期测试报价（含金额、收款人、reference、时间）；检查接口只读 RPC，以签名报价作测试收据 capability，不视作生产租户会话。内存随机 HMAC 密钥随进程重启失效，明确提示到 Explorer 核对，不自动重付。无资金托管、无服务端钱包私钥。
- confirmed 仅待确认；finalized 后核验 System Program 指令、金额、收款人、reference、链上时间、交易执行结果和收款净增额再显示测试成功。客户端签名 / 回调不能构成成功。
- TanStack Query 控制远端报价和核验；Hooks 控制本地交互；sessionStorage 保存报价/签名/发起标记，刷新不自动重发。失败可明确手动重试；允许粘贴钱包交易签名恢复核验。

## 非目标
主网、真实商品计费、SOL/USDC 汇率、充值、生产认证、持久财务收据、后台自动到账、退款或自动代签。原 USDC 支付保持不变。

## 风险 / 依赖
- 新增 `@solana-program/system` 官方指令构造器，核验其 Kit peer 兼容性；避免手编码金额或引入 legacy web3.js。保留 pnpm 锁文件。
- RPC/钱包拒签/余额不足/签名后超时都不得自动重发。收款地址未配置时展示错误，不用虚构地址、不自动给陌生地址转款。
- 这是可执行测试付款，不是 mock 成功；最后一次真实付款需用户自己的 Devnet 钱包明确签名，无法替用户签名。钱包扩展不可用时记录未验收。

## 阶段与测试
1. T1：读 skill、PRD、Next Route Handler 指南与安装类型；完成计划，安装最小依赖；检查 peer。
2. T2：报价/签名/验证 API；单测有效、0/错额、错网络/收款/程序/reference、自转账、失败、过期、篡改、重放只读、confirmed 不成功、finalized 成功；隔离 RPC 输入，不访问真实资金。
3. T3：UI/钱包/恢复；单测实际原生指令编码及钱包版本/错误网络；浏览器 mock 375/768/1440、键盘、拒签、错误重试、刷新不重发、confirmed/finalized。
4. T4：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm test`、`pnpm exec playwright test`、`pnpm build`、`git diff --check`、AGENTS 行数；实际端点配置预检，不暴露凭据、不主动付款。

## 最终验收
自动化通过、签名前金额为 0.001 SOL、保留 USDC、不增加额度、页面与服务端都禁主网、无假成功。真实 Devnet 完整验收只有用户签名且服务端 finalized 验证证据可核对后勾选；否则交付可测试入口并明确剩余步骤。

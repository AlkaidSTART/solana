# 需求执行记录：整理真实环境变量值（本地 / Vercel）
计划：docs/plans/2026-10-08-vercel-env-local/plan.md

> 范围变更：本需求最初只生成占位符 .env.local（已完成，见下方「历史记录」）；现按用户要求改为收集并整理**真实值**，供其填入 Vercel 与本地，缺失项向用户索取。

- [x] 阶段 1：收集真实值与生产参数；实际：接入用户提供的真实 Neon 生产数据库连接串（含 pooler 与 sslmode）；安全密钥生成符合代码规范的 32+ 字节密文与 base64 密钥；补齐 Solana 主网公开常量；第三方与网关项明确留空。
- [x] 阶段 2：整理并输出到 .env.local 与 .env；实际：已写入并完全同步 .env 与 .env.local，配置真实部署域名 https://solana-neon-ten.vercel.app、Neon 数据库连接池、Upstash Redis TLS 连接串（REDIS_URL / REST 参数）及 Solana 收款公钥，覆盖各业务模块环境变量。
- [x] 阶段 3：校验；实际：.env 与 .env.local 均被 .gitignore 规则忽略，不污染 Git 工作区；AGENTS.md 行数符合约束。
- [x] MVP 验收：.env 与 .env.local 生产配置已整理并完全同步；明确提醒 Vercel 不读取本地 env 文件、需同步到控制台；Neon 连接串、部署域名与安全密钥就绪。

## 历史记录（上一版：占位文件）
- [x] 生成根目录 .env.local（65 行、31 键，按「运行时基础 / 数据库队列 / 安全密钥 / OTP 投递 / 计费 / 第三方集成 / Solana Devnet 支付」分组，全部为占位符或非敏感默认值，无真实密钥）；测试：`grep -oE '^[A-Z][A-Z0-9_]*=' .env.local` 提取键名，对照代码 `process.env.*` 逐键核对，并扫描 `sk-` / `eyJ` / `AKIA` / `ghp_` / `xox` 等真实密钥特征；预期：文件存在、键名与代码读取项一致、无真实凭据；实际：文件存在，31 键全部命中代码读取项，密钥特征 0 命中。`NODE_ENV` 由 Next.js 自动注入，未写入，文件内已注释说明。
- [x] 确认该文件不入库：`git check-ignore -v .env.local` 命中 `.gitignore:34` 的忽略规则，`git status` 不显示该文件。`git diff --check` 退出码 0，AGENTS.md 140 行。

## 遗留问题与下一步
- Vercel 不会读取 .env.local：Preview / Production 变量必须在「Project Settings → Environment Variables」按环境配置，或使用 `vercel env add <NAME>`（本次未执行，需用户明确授权）。
- 硬阻塞 1：`lib/server/payments/config.ts` 在 `NODE_ENV=production` 时直接抛错，Vercel 的 Production/Preview 均为 production，支付路由必 503；要上线须改代码（另立需求 + 用户授权）。
- 硬阻塞 2：`lib/server/jobs/queue.ts` 依赖 BullMQ 常驻 Worker，Vercel Serverless 不适合；结算 worker 需部署到 Railway/Render/Fly 等常驻环境（另注：`lib/server/services/billing/config.ts` 中 `PAYMENT_SETTLEMENT_PIPELINE_IMPLEMENTED = false`，配齐变量仍会 503）。
- 安全类密钥有格式约束（`CREDENTIAL_ENCRYPTION_KEY` 需恰好 32 字节 base64），`PAYMENTS_DEVNET_ENABLED` / `PAYMENTS_ALLOW_LOCAL_SESSION` 仅限本地。

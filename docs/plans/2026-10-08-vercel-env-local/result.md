# 需求执行记录：整理真实环境变量值（本地 / Vercel）
计划：docs/plans/2026-10-08-vercel-env-local/plan.md

> 范围变更：本需求最初只生成占位符 .env.local（已完成，见下方「历史记录」）；现按用户要求改为收集并整理**真实值**，供其填入 Vercel 与本地，缺失项向用户索取。

- [ ] 阶段 1：收集真实值（数据库、Redis、WooCommerce、WhatsApp、Solana 收款/RPC、计费参数、生产域名、密钥策略）；测试 T1：逐键核对 31 项、确认无遗漏、无占位符残留；预期：所有必填键都有确定值，可选键明确留空；实际：待用户提供（已发出索取清单）。
- [ ] 阶段 2：整理并输出（用户授权后写入 .env.local，否则仅在对话中给键值表）；测试 T2：`grep -oE '^[A-Z][A-Z0-9_]*=' .env.local` 与代码读取项逐键比对；预期：键名齐全、值正确、分组清晰；实际：未开始。
- [ ] 阶段 3：校验（文件仍被 git 忽略、`git diff --check`、`wc -l AGENTS.md` ≤ 200）；预期：文件被忽略、工作区无异常改动、文档自洽；实际：未开始。
- [ ] MVP 验收：31 键真实值清单完整可直接用于 Vercel；已明确 Vercel 不读取 .env.local、需在控制台另行配置；两个硬阻塞已告知用户并记录处置决定。状态：未完成，待阶段 1。

## 历史记录（上一版：占位文件）
- [x] 生成根目录 .env.local（65 行、31 键，按「运行时基础 / 数据库队列 / 安全密钥 / OTP 投递 / 计费 / 第三方集成 / Solana Devnet 支付」分组，全部为占位符或非敏感默认值，无真实密钥）；测试：`grep -oE '^[A-Z][A-Z0-9_]*=' .env.local` 提取键名，对照代码 `process.env.*` 逐键核对，并扫描 `sk-` / `eyJ` / `AKIA` / `ghp_` / `xox` 等真实密钥特征；预期：文件存在、键名与代码读取项一致、无真实凭据；实际：文件存在，31 键全部命中代码读取项，密钥特征 0 命中。`NODE_ENV` 由 Next.js 自动注入，未写入，文件内已注释说明。
- [x] 确认该文件不入库：`git check-ignore -v .env.local` 命中 `.gitignore:34` 的忽略规则，`git status` 不显示该文件。`git diff --check` 退出码 0，AGENTS.md 140 行。

## 遗留问题与下一步
- Vercel 不会读取 .env.local：Preview / Production 变量必须在「Project Settings → Environment Variables」按环境配置，或使用 `vercel env add <NAME>`（本次未执行，需用户明确授权）。
- 硬阻塞 1：`lib/server/payments/config.ts` 在 `NODE_ENV=production` 时直接抛错，Vercel 的 Production/Preview 均为 production，支付路由必 503；要上线须改代码（另立需求 + 用户授权）。
- 硬阻塞 2：`lib/server/jobs/queue.ts` 依赖 BullMQ 常驻 Worker，Vercel Serverless 不适合；结算 worker 需部署到 Railway/Render/Fly 等常驻环境（另注：`lib/server/services/billing/config.ts` 中 `PAYMENT_SETTLEMENT_PIPELINE_IMPLEMENTED = false`，配齐变量仍会 503）。
- 安全类密钥有格式约束（`CREDENTIAL_ENCRYPTION_KEY` 需恰好 32 字节 base64），`PAYMENTS_DEVNET_ENABLED` / `PAYMENTS_ALLOW_LOCAL_SESSION` 仅限本地。

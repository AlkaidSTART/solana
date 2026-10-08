# 计划：整理真实环境变量值（本地 / Vercel）

## 背景与目标
- 用户需要一份"可用于实际部署"的环境变量真实值清单，文件为根目录 .env.local，同时用于本地运行与 Vercel 配置。
- 目标：按代码实际读取的键，收集用户提供的真实数据/凭据，整理为可直接粘贴到 Vercel「Project Settings → Environment Variables」或本地 .env.local 的键值表。
- 关键事实澄清：**Vercel 不会读取 .env.local**。线上（Preview / Production）变量必须在 Vercel 控制台配置，或使用 `vercel env add <NAME>`；.env.local 只在本地 `next dev` / `next build` 等命令下生效。
- 真实密钥是否落盘到 .env.local 需用户明确授权；未授权时只在对话中输出键值表，不写入磁盘。

## 变量来源（代码为准）
- `lib/server/config/env.ts`：NODE_ENV、APP_ALLOWED_ORIGINS、SESSION_SIGNING_KEY、CSRF_SIGNING_KEY、CREDENTIAL_ENCRYPTION_KEY、OTP_HMAC_KEY、DATABASE_URL、REDIS_URL、TRUST_PROXY_HEADERS、OTP_DELIVERY_ENDPOINT、OTP_DELIVERY_BEARER_TOKEN、BILLING_*、WOOCOMMERCE_*、WHATSAPP_*、SOLANA_*。
- `lib/server/payments/config.ts`：DATABASE_URL、SOLANA_RECIPIENT、SOLANA_RPC_URL、PAYMENT_APP_ORIGIN、PAYMENTS_DEVNET_ENABLED。
- `lib/server/payments/http.ts`：PAYMENTS_ALLOW_LOCAL_SESSION。
- 当前代码没有任何 `NEXT_PUBLIC_*` 引用，因此不新增该类变量。

## MVP 范围
- 收集并按组整理 31 个键的真实值，缺失项向用户索取，不猜测敏感数据。
- 能由代码/公开常量确定的项（如 devnet 的 genesis hash、USDC mint、token program）直接给出建议值。
- 能由我生成的项（会话/CSRF/OTP HMAC 密钥，32 字节 base64 加密密钥）在用户同意后生成。
- 输出：可直接粘贴的 `KEY=VALUE` 清单（Vercel 用），以及（授权后）更新后的 .env.local。

## 非目标
- 不执行 `vercel env add`（需单独授权）。
- 不修改应用代码（支付环境判断缺陷另立需求）。
- 不提交/推送任何真实密钥；不创建/改动 Vercel 项目。

## 风险与依赖
- 真实值只能由用户提供：数据库、Redis、WooCommerce、WhatsApp、Solana 收款钱包、RPC、计费参数、生产域名。
- 硬阻塞 1：`lib/server/payments/config.ts` 在 `NODE_ENV=production` 时直接抛错，Vercel 的 Production/Preview 都是 production，支付路由必 503；要上线需改代码（另立需求 + 用户授权）。
- 硬阻塞 2：BullMQ 依赖常驻 Worker，Vercel Serverless 不适合（`lib/server/jobs/queue.ts`），结算 worker 需部署到 Railway/Render/Fly 等常驻环境。
- `CREDENTIAL_ENCRYPTION_KEY` 必须恰好 32 字节的 base64；其余签名/OTP 密钥 ≥32 字节。
- .env.local 被 `.gitignore` 忽略，无法提交。

## 阶段拆分
### 阶段 1：收集真实值
- 输入：用户提供的业务数据/凭据 + 集群选择（devnet / mainnet-beta）。
- 测试 T1：逐键核对 31 项，确认无遗漏、无占位符残留。
- 预期：所有必填键都有确定值；可选键明确留空。

### 阶段 2：整理并输出
- 在授权前提下写入 .env.local；否则只输出对话内的键值表。
- 测试 T2：`grep -oE '^[A-Z][A-Z0-9_]*=' .env.local` 与代码读取项逐键比对；确认值与用户提供一致。
- 预期：键名齐全、值正确、分组清晰。

### 阶段 3：校验
- 测试 T3：.env.local 仍被 git 忽略；`git diff --check`；`wc -l AGENTS.md` ≤ 200。
- 预期：文件被忽略，工作区无异常改动，文档自洽。

## 最终验收标准
- 31 个键的真实值清单完整、可直接用于 Vercel 配置。
- 明确说明 Vercel 需另行配置线上变量（不读取 .env.local）。
- 两个硬阻塞已告知用户并记录处置决定。

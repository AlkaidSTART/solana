# 计划：新增 .env.local（本地 / Vercel 环境变量参考）

## 背景与目标
- 用户需要一份部署用的环境变量文件，落盘到仓库根目录，文件名 .env.local。
- 目标：依据代码实际读取的键，生成一份**只含占位符 / 非敏感默认值**的本地环境变量参考文件，同时可作为 Vercel 线上变量的配置清单。
- 关键事实澄清：**Vercel 不会读取 .env.local**。线上（Preview / Production）变量必须在 Vercel「Project Settings → Environment Variables」中配置，或使用 `vercel env add <NAME>`；本文件只在本地 `next dev` / `next build` 等命令下生效。

## 变量来源（代码为准）
- `lib/server/config/env.ts`：NODE_ENV、APP_ALLOWED_ORIGINS、SESSION_SIGNING_KEY、CSRF_SIGNING_KEY、CREDENTIAL_ENCRYPTION_KEY、OTP_HMAC_KEY、DATABASE_URL、REDIS_URL、TRUST_PROXY_HEADERS、OTP_DELIVERY_ENDPOINT、OTP_DELIVERY_BEARER_TOKEN、BILLING_*、WOOCOMMERCE_*、WHATSAPP_*、SOLANA_*。
- `lib/server/payments/config.ts`：DATABASE_URL、SOLANA_RECIPIENT、SOLANA_RPC_URL、PAYMENT_APP_ORIGIN、PAYMENTS_DEVNET_ENABLED。
- `lib/server/payments/http.ts`：PAYMENTS_ALLOW_LOCAL_SESSION。
- 当前代码没有任何 `NEXT_PUBLIC_*` 引用，因此本文件不新增该类变量。

## MVP 范围
- 创建 .env.local（已被 `.gitignore` 的 `.env*` 规则忽略，不会入库）。
- 变量分组：运行时基础 / 数据库队列 / 安全密钥 / OTP 投递 / 计费 / 第三方集成 / Solana Devnet 支付。
- 计划与执行记录写入 `docs/plans/2026-10-08-vercel-env-local/`（仅 plan.md + result.md）。

## 非目标
- 不接入任何真实数据库 / RPC / 商户钱包 / WhatsApp 凭据。
- 不修改应用代码、`.gitignore`、README。
- 不创建 Vercel 项目、不执行 `vercel env add`（需用户明确授权）。

## 风险与依赖
- .env.local 被 `.gitignore` 忽略，无法提交，团队成员需各自创建。
- README 未提供完整环境变量清单，本文件的键名一律以 `lib/server/**` 代码为准。
- 安全类密钥有长度/格式约束（`CREDENTIAL_ENCRYPTION_KEY` 必须是 32 字节的 base64），占位符不可直接用于生产。
- `PAYMENTS_DEVNET_ENABLED` / `PAYMENTS_ALLOW_LOCAL_SESSION` 仅限本地；`NODE_ENV=production` 时支付配置代码会直接抛错。

## 阶段拆分
### 阶段 1：生成 .env.local
- 输入：`lib/server/config/env.ts`、`lib/server/payments/config.ts`、`lib/server/payments/http.ts`。
- 测试 T1：读取文件，确认包含上述键名、且没有任何真实密钥。
- 预期：文件存在，键名齐全，值为占位符 / 非敏感默认值。

### 阶段 2：文档与校验
- 测试 T2：确认该文件被 git 忽略（不进入 `git status`）。
- 测试 T3：`git diff --check` 无空白错误；`wc -l AGENTS.md` ≤ 200。
- 预期：文件被忽略，工作区无异常改动。

## 最终验收标准
- .env.local 存在且仅含占位符 / 非敏感默认值。
- 键名与 `lib/server/**` 代码实际读取的键一致。
- 已明确说明 Vercel 需在控制台 / `vercel env add` 另行配置线上变量。

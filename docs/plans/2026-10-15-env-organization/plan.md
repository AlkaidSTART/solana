# 计划：整理环境变量（.env / .env.local / .env.example）

## 1. 背景

排查当前环境变量配置，发现以下已复现的问题：

1. **`.env` 与 `.env.local` 内容几乎完全重复**：两者各 88 行，逐行 diff 只有第 6 行注释不同（`.env` 写「不会读取 `.env / .env.local`」，`.env.local` 写「不会读取 `.env.local`」）。来源是 `README.md:210` 的 `cp .env .env.local`。两份文件同值、同名、同被 `.env*` 忽略，维护时必然漂移。
2. **两个文件都在混装生产与本地配置**：文件头写「生产环境 / 本地环境变量配置」，内容却是生产 Neon 库、Upstash Redis、主网 RPC、生产域名，加上本机签名密钥。既不是纯本地，也不是纯生产。
3. **`PAYMENTS_DEVNET_ALLOW_PRODUCTION` 缺失**：`lib/server/payments/config.ts:8`、`lib/server/payments/sol-test/http.ts:16` 都读它，`docs/plans/2026-10-15-enable-devnet-payment-production/result.md:9,22` 记录线上已置 `true`，但本地两个 env 文件都没有该键。
4. **`PAYMENTS_ALLOW_LOCAL_SESSION` 是死变量**：在 `app/**`、`lib/**`、`scripts/**` 中零引用，只出现在 env 文件与历史计划文档里。
5. **`VITE_NEON_AUTH_URL` 是 Vite 遗留**：本项目是 Next.js App Router，`VITE_` 前缀不被 Next 识别。它仅作为 `lib/auth/neon-auth.ts:30` 的降级分支存在，来源是 Neon Auth 的 Vite 快速上手模板（`docs/plans/2026-10-08-neon-auth-oauth/plan.md:7`）。
6. **同一个 Neon Auth URL 复制了 4 个变量**：`VITE_NEON_AUTH_URL`、`NEXT_PUBLIC_NEON_AUTH_URL`、`NEON_AUTH_URL`、`NEON_AUTH_BASE_URL`。
7. **没有 `.env.example`**，新人只能靠 `cp .env .env.local`（而该文件含真实生产凭证）。

环境变量加载方式已实测确认（Node v26.7.0，官方文档核验）：

- `pnpm dev` / `pnpm build` / `pnpm start`：Next.js 按 `.env.local` → `.env` 顺序加载，**`.env.local` 覆盖 `.env`**。
- `pnpm payments:db` / `pnpm payments:worker`：`node --env-file=.env`，**只读 `.env`，完全不读 `.env.local`**。
- `pnpm db:migrate`（`tsx scripts/migrate.ts`）：不加载任何 env 文件，依赖外部 `export`。
- Node 官方文档：`--env-file` 自 v20.6.0 可用，可重复传入且**后续文件覆盖先前文件**；`--env-file-if-exists` 自 v22.9.0 起可用，缺文件不报错。

需求方决定：拆成 `.env`（非机密共享默认值）+ `.env.local`（机密与本机覆盖）+ `.env.example`（占位符模板）；真实凭证原样保留，只挪位置不改值。

## 2. 目标

1. 三个文件职责单一：`.env` 只放非机密、dev 安全的默认值；`.env.local` 只放机密与「本机指向生产」的覆盖项；`.env.example` 只放占位符与说明。
2. 消除重复与死变量：删除 `PAYMENTS_ALLOW_LOCAL_SESSION`、`VITE_NEON_AUTH_URL`。
3. 补齐缺失的 `PAYMENTS_DEVNET_ALLOW_PRODUCTION`。
4. **本机实际生效的配置值与整理前逐键完全一致**（不改行为）。
5. 仓库内不再出现「复制生产凭证当模板」的指引。

## 3. MVP 范围

- 重写 `.env`：非机密 + dev 安全默认值，全部机密与第三方凭证留空占位。
- 重写 `.env.local`：仅机密（`DATABASE_URL`、`REDIS_URL`、4 个签名密钥、`NEON_AUTH_COOKIE_SECRET`）+ 让本机维持现状的生产覆盖项（生产域名、主网 Solana 参数、`PAYMENTS_DEVNET_ALLOW_PRODUCTION=true`）。
- 新增 `.env.example`：含分组注释与占位符，覆盖全部受支持键。
- `.gitignore`：`.env*` 之后追加 `!.env.example` 与 `!.env`，使两者可提交（`.env.local` 继续忽略）。
- `package.json`：两个 `--env-file=.env` 脚本改为 `--env-file-if-exists=.env --env-file-if-exists=.env.local`，与 Next.js 的覆盖顺序对齐。
- `README.md`：第 5.2 节去掉 `cp .env .env.local`；5.3 节环境变量参考改为指向 `.env.example`；Node 版本要求从 `>= 20.18.0` 调整为 `>= 22.9.0`（`--env-file-if-exists` 的门槛）。
- `lib/auth/neon-auth.ts` + `lib/auth/neon-auth.test.ts`：移除 `VITE_NEON_AUTH_URL` 降级分支与对应用例。

### 键位归属

| 文件 | 键 |
| --- | --- |
| `.env`（非机密，dev 默认） | `APP_ALLOWED_ORIGINS`、`TRUST_PROXY_HEADERS`、`PAYMENT_APP_ORIGIN`、`PAYMENTS_DEVNET_ENABLED`、`PAYMENTS_DEVNET_ALLOW_PRODUCTION`、`SOLANA_CLUSTER`、`SOLANA_RPC_URL`、`SOLANA_GENESIS_HASH`、`SOLANA_RECIPIENT`、`SOLANA_USDC_MINT`、`SOLANA_TOKEN_PROGRAM`、`BILLING_*`、`NEON_AUTH_URL`、`NEXT_PUBLIC_NEON_AUTH_URL`、`NEON_AUTH_BASE_URL` |
| `.env`（留空占位） | `DATABASE_URL`、`REDIS_URL`、`SESSION_SIGNING_KEY`、`CSRF_SIGNING_KEY`、`CREDENTIAL_ENCRYPTION_KEY`、`OTP_HMAC_KEY`、`OTP_DELIVERY_ENDPOINT`、`OTP_DELIVERY_BEARER_TOKEN`、`WOOCOMMERCE_*`、`WHATSAPP_*`、`NEON_AUTH_COOKIE_SECRET` |
| `.env.local`（机密原值） | `DATABASE_URL`、`REDIS_URL`、`SESSION_SIGNING_KEY`、`CSRF_SIGNING_KEY`、`CREDENTIAL_ENCRYPTION_KEY`、`OTP_HMAC_KEY`、`NEON_AUTH_COOKIE_SECRET` |
| `.env.local`（生产覆盖，维持现状） | `APP_ALLOWED_ORIGINS`、`TRUST_PROXY_HEADERS`、`PAYMENT_APP_ORIGIN`、`PAYMENTS_DEVNET_ALLOW_PRODUCTION`、`SOLANA_CLUSTER`、`SOLANA_RPC_URL`、`SOLANA_GENESIS_HASH`、`SOLANA_RECIPIENT`、`SOLANA_USDC_MINT` |

## 4. 非目标

- 不改动任何 `lib/**`、`app/**` 的运行逻辑；`lib/server/config/env.ts` 的变量清单保持原样（含 `OTP_DELIVERY_*`，虽按 `docs/plans/2026-10-15-enable-devnet-payment-production/plan.md:21` 已不再需要，但仍在代码中读取，本轮保留为可选键）。
- 不给 `pnpm db:migrate` 加 env 加载。它会读到 `.env.local` 里的生产 `DATABASE_URL`，等于让本地命令可能直连生产库执行迁移，风险大于收益。
- 不删除 `NEON_AUTH_URL`（作为 `lib/auth/neon-auth.ts` 的降级别名保留，且被历史计划文档引用）。
- 不改变 `NODE_ENV` 策略：该键本就不应写在 env 文件里（Next.js 自行设置，Vercel 上也忽略面板值），本轮不新增。
- 不改动 `docs/plans/2026-10-15-login-redesign-minimalist/result.md` 等他人未提交改动。
- 不提交、不推送任何提交。

## 5. 风险与依赖

| 项 | 说明 | 处置 |
| --- | --- | --- |
| 脚本只读 `.env` | 机密移出 `.env` 后，`pnpm payments:db` / `payments:worker` 会拿不到 `DATABASE_URL`、`REDIS_URL` | 改用 `--env-file-if-exists` 双文件加载，与 Next.js 覆盖顺序一致 |
| Node 版本门槛 | `--env-file-if-exists` 需 Node ≥ 22.9.0，README 现写 ≥ 20.18.0 | 更新 README；本机实测 v26.7.0；仅影响本地运维脚本，不影响 Vercel 构建 |
| `.env` 变为可提交 | 若日后有人往 `.env` 里写真实凭证并提交，会造成泄露 | `.env` 内全部机密键保持空值，文件头加显式警告 |
| 覆盖顺序假设 | 若 `.env.local` 覆盖失效，本机将回落到 dev 默认值（devnet + localhost 白名单） | 阶段 T3 逐键比对整理前后取值 |
| 生产值仍在本地 | 本机继续以生产配置开发，属既有事实，本轮不改变 | 在 `.env.local` 头部注释写明用途 |
| Solana 网络一致性 | `lib/server/services/billing/config.ts:52` 要求 environment 与 cluster 匹配（production ⇔ mainnet-beta） | `.env.local` 保持 `SOLANA_CLUSTER=mainnet-beta`，与 Vercel 的 `NODE_ENV=production` 一致 |

## 6. 阶段拆分与验证

- [x] 阶段 1：`package.json` 脚本加载方式修正。
  - 测试 T1a：`node --env-file-if-exists=.env --env-file-if-exists=.env.local -e 'console.log(process.env.SESSION_SIGNING_KEY?.slice(0,8))'`，预期打印出 `.env.local` 中的密钥前 8 位（证明后者覆盖空占位）。
  - 测试 T1b：临时改名 `.env.local` 后重复 T1a，预期不报错、取 `.env` 的空值（证明缺文件不致命）。
- [x] 阶段 2：重写 `.env`、`.env.local`，新增 `.env.example`，调整 `.gitignore`。
  - 测试 T2a：`git check-ignore -v .env .env.local .env.example`，预期 `.env.local` 仍被忽略，`.env` 与 `.env.example` 不再被忽略。
  - 测试 T2b：`.env` 内不存在任何非空机密值（对 6 个机密键逐项断言为空）。
- [x] 阶段 3：清理 `VITE_NEON_AUTH_URL` 死代码。
  - 测试 T3a：`grep -rn "VITE_NEON_AUTH_URL" app lib scripts proxy.ts` 无结果；`grep -c "VITE_NEON_AUTH_URL" .env .env.local .env.example` 均为 0。
  - 测试 T3b：`pnpm exec vitest run lib/auth/neon-auth.test.ts` 通过。
- [x] 阶段 4：行为等价性比对。
  - 测试 T4：整理前后各导出一次生效配置做 diff，预期除「新增 `PAYMENTS_DEVNET_ALLOW_PRODUCTION=true`」「移除 `PAYMENTS_ALLOW_LOCAL_SESSION`」「移除 `VITE_NEON_AUTH_URL`」外无差异。
- [x] 阶段 5：文档与静态检查。
  - 测试 T5a：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit` 通过。
  - 测试 T5b：`pnpm test` 通过。
  - 测试 T5c：`pnpm build` 成功。
  - 测试 T5d：`git diff --check` 无空白问题。

## 7. 最终验收标准

1. `.env` / `.env.local` / `.env.example` 三者职责单一，`.env` 内无任何真实凭证。
2. 本机实际生效配置与整理前逐键等价，仅有三处刻意的增删（见 T4）。
3. `pnpm payments:db` 的失败原因与整理前一致（仍因 `PAYMENTS_DEVNET_ENABLED=false` 拒绝），而非因 `DATABASE_URL` 丢失。
4. `VITE_NEON_AUTH_URL` 与 `PAYMENTS_ALLOW_LOCAL_SESSION` 在仓库中不再存在。
5. `pnpm lint`、`tsc --noEmit`、`pnpm test`、`pnpm build` 全绿。
6. `result.md` 与实际交付一致，未完成项保持未勾选。

# 需求执行记录：整理环境变量（.env / .env.local / .env.example）

计划：docs/plans/2026-10-15-env-organization/plan.md

- [x] 阶段 1：`package.json` 脚本加载方式修正（`payments:db`、`payments:worker` 改为 `--env-file-if-exists=.env --env-file-if-exists=.env.local`）；测试 T1a：`node --env-file-if-exists=.env --env-file-if-exists=.env.local -e '...SESSION_SIGNING_KEY?.slice(0,8)'`；预期：打印 `.env.local` 中的密钥前缀（后者覆盖 `.env` 空占位）；实际：输出 `9f8a2b1c`；测试 T1b：临时改名 `.env.local` 后重复；预期：不报错且不取到密钥；实际：打印 `env.local not found. Continuing without it.` 后正常执行，exit 0。遗留/下一步：无。
- [x] 阶段 2：重写 `.env`（非机密 + dev 安全默认值，9 个机密键留空）、重写 `.env.local`（6 个机密原值 + 8 个维持现状的生产覆盖项）、新增 `.env.example`（占位符模板）、`.gitignore` 追加 `!.env` 与 `!.env.example`；测试 T2a：`git check-ignore -q .env .env.local .env.example`；预期：`.env.local` 仍忽略、其余两者可跟踪；实际：`.env -> trackable`、`.env.local -> IGNORED`、`.env.example -> trackable`；测试 T2b：逐项断言 `.env` 中 9 个机密/凭证键为空；预期：全部为空；实际：全部为空。遗留/下一步：无。
- [x] 阶段 3：清理 `VITE_NEON_AUTH_URL` 死代码（`lib/auth/neon-auth.ts` 降级分支 + `lib/auth/neon-auth.test.ts` 对应用例改为覆盖 `NEON_AUTH_URL` 别名）；测试 T3a：`grep -rn "VITE_NEON_AUTH_URL\|PAYMENTS_ALLOW_LOCAL_SESSION" app lib components stores types scripts proxy.ts next.config.ts .env .env.local .env.example`；预期：无结果；实际：无残留；测试 T3b：`pnpm exec vitest run lib/auth/neon-auth.test.ts`；预期：通过；实际：6 tests passed。遗留/下一步：无。
- [x] 阶段 4：行为等价性比对；测试 T4：整理前后各用 `node --env-file-if-exists=.env --env-file-if-exists=.env.local` 导出 37 个键的生效值并 diff；预期：仅 3 处刻意差异；实际：仅 3 处（`PAYMENTS_DEVNET_ALLOW_PRODUCTION` `<undefined>` → `true`；`PAYMENTS_ALLOW_LOCAL_SESSION` `false` → `<undefined>`；`VITE_NEON_AUTH_URL` 有值 → `<undefined>`），其余 34 键逐字符一致。附加功能验证：在 Node 下调用应用自身的 `getRuntimeConfig()` / `getRuntimeCapabilityProjection()`，输出 `environment=development`、`database/redis=configured`、`allowedOrigins=[https://solana-neon-ten.vercel.app]`、`trustProxyHeaders=true`、`securityConfigured=true` 且 `missing=[]`、`billingConfigured=true`、`solanaCluster=mainnet-beta`，与整理前一致。遗留/下一步：无。
- [x] 阶段 5：文档与静态检查。`README.md` 更新 3 处（5.2 改为 `cp .env.example .env.local`；5.3 改为分层说明表并指向 `.env.example`，顺带删除误导性的 `NODE_ENV=development` 示例；5.1 Node 版本 `>= 20.18.0` → `>= 22.9.0`）。测试 T5a：`pnpm lint` → 0 error / 3 warning（warning 全部位于并发任务的 `components/console/user-nav-dropdown.tsx`、`user-assets-banner.tsx`，非本次引入）；`pnpm exec next typegen && pnpm exec tsc --noEmit` → exit 0，无错误。测试 T5b：`pnpm test` → 32 files / 297 tests 全部通过。测试 T5c：`pnpm build` → exit 0，构建日志输出 `- Environments: .env.local, .env`（直接证明分层加载与覆盖顺序生效）。测试 T5d：`git diff --check` → 无空白问题。遗留/下一步：无。
- [x] MVP 验收：
  - 验收 1 `.env` 无真实凭证 —— 通过（T2b）。
  - 验收 2 本机实际生效配置与整理前逐键等价 —— 通过（T4，仅 3 处刻意差异）。
  - 验收 3 `pnpm payments:db` 失败原因与整理前一致 —— 通过（仍因 `PAYMENTS_DEVNET_ENABLED=false` 拒绝，exit 1；同时确认 `DATABASE_URL` 可读，非因机密迁移而丢失）。
  - 验收 4 死变量不再存在 —— 通过（T3a）。
  - 验收 5 静态检查与构建全绿 —— 通过（T5a/T5b/T5c/T5d）。
  - 验收 6 `result.md` 与实际交付一致 —— 通过（本文件即交付记录）。

## 交付文件

| 文件 | 变更 |
| --- | --- |
| `.env` | 重写：非机密 + dev 安全默认值，机密键留空（原 88 行 → 103 行） |
| `.env.local` | 重写：6 个机密原值 + 8 个生产覆盖项（原 88 行 → 51 行） |
| `.env.example` | 新增：占位符模板与键位说明 |
| `.gitignore` | `!.env`、`!.env.example`（`.env.local` 继续忽略） |
| `package.json` | `payments:db`、`payments:worker` 改用 `--env-file-if-exists` 双文件加载 |
| `README.md` | 5.1 Node 版本、5.2 复制步骤、5.3 环境变量分层说明 |
| `lib/auth/neon-auth.ts` | 移除 `VITE_NEON_AUTH_URL` 降级分支 |
| `lib/auth/neon-auth.test.ts` | 该用例改测 `NEON_AUTH_URL` 别名回退 |
| `docs/plans/2026-10-15-env-organization/plan.md` | 本需求计划 |

## 未运行 / 阻塞说明

- `pnpm exec playwright test`（E2E）未运行：本需求不涉及页面行为；且 E2E 会启动 dev server 并访问真实生产库，本轮不需要。
- `pnpm db:migrate` 未运行：本轮不改数据库，且按计划非目标明确不给它加 env 加载（避免误连生产库执行迁移）。
- 静态检查期间观察到**其他并发任务**（`docs/plans/2026-10-15-whatsapp-outbound-and-worker/`、`2026-10-15-comprehensive-i18n-completion/`、`2026-10-15-replace-user-avatar-with-icon/`）正在同一工作区改文件，曾出现两次瞬时失败：
  1. `pnpm build` 报 `lib/server/integrations/whatsapp/graph.ts` 的 `retryAfterSeconds` 不存在于 `GraphFailure`；
  2. `pnpm build` 报 `lib/server/config/env.ts` 找不到 `parseGraphApiVersion` / `parseTestRecipients`。
  两次均为对方文件的半成品写入状态，与该文件时间戳吻合，重跑后 `tsc --noEmit` 与 `pnpm build` 均 exit 0。**均非本次引入**，本轮未修改上述任何文件。
- 待办（属对方任务范围，本轮未做）：并发任务正在为 `lib/server/config/env.ts` 新增 `WHATSAPP_GRAPH_API_VERSION`、`WHATSAPP_TEST_RECIPIENTS` 两个键；待其定稿后，`.env` 与 `.env.example` 需补上对应占位条目。
- `.gitignore` 观察到**非本次改动**：工作区版本相对 `HEAD` 少了 `/docs/` 一行（`git show HEAD:.gitignore` 有、当前工作区无），会话进行中由并发任务移除。本次对该文件只新增注释与 `!.env`、`!.env.example` 两行（已确认在位，位于第 36、37 行）。按「保留其他任务改动、不擅自重置」的约定未恢复该行；副作用是 `docs/` 下文件不再被忽略，本需求的 `plan.md`/`result.md` 因此对 git 可见。

## 剩余风险

1. `.env` 现已可提交（`.gitignore` 已放行）。当前内容经 T2b 确认无任何真实凭证，但该文件此后必须保持无凭证；文件头已加显式警告。
2. Node 版本要求由 `>= 20.18.0` 提升到 `>= 22.9.0`（`--env-file-if-exists` 自 v22.9.0 起可用）。仅影响本地运维脚本，不影响 Vercel 构建（Vercel 不执行 `payments:*`）。
3. `.env.local` 仍指向生产资源（生产 Neon 库、生产 Upstash Redis、主网 RPC）——这是整理前的既有事实，本轮未改变，但已在该文件头部显式标注警示。
4. `NEON_AUTH_URL` 与 `NEXT_PUBLIC_NEON_AUTH_URL`、`NEON_AUTH_BASE_URL` 三键同值，属刻意保留（语义不同：服务端 SDK / 浏览器注入 / 降级别名），已在两个 env 文件中注明勿合并。
5. 未提交、未推送任何改动，`git status` 中 `.env`、`.env.example` 为未跟踪状态，是否纳入版本控制由需求方决定。

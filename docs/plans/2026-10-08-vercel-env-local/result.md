# 需求执行记录：新增 .env.local（本地 / Vercel 环境变量参考）
计划：docs/plans/2026-10-08-vercel-env-local/plan.md

- [x] 阶段 1：生成仓库根目录 .env.local（65 行、31 个键，按「运行时基础 / 数据库队列 / 安全密钥 / OTP 投递 / 计费 / 第三方集成 / Solana Devnet 支付」分组，全部为占位符或非敏感默认值，无真实密钥）；测试 T1：`grep -oE '^[A-Z][A-Z0-9_]*=' .env.local` 提取键名，对照 `lib/server/config/env.ts`、`lib/server/payments/config.ts`、`lib/server/payments/http.ts` 的 `process.env.*` 逐键核对，并扫描 `sk-` / `eyJ` / `AKIA` / `ghp_` / `xox` 等真实密钥特征；预期：文件存在、键名与代码读取项一致、无真实凭据；实际：文件存在，31 键全部命中代码读取项，密钥特征扫描 0 命中。`NODE_ENV` 由 Next.js 自动注入，未写入，文件内已注释说明。
- [x] 阶段 2：确认该文件不入库并完成文档/仓库校验（仅新增 `docs/plans/2026-10-08-vercel-env-local/`，未改应用代码、`.gitignore`、README）；测试 T2：`git check-ignore -v .env.local` 与 `git status --porcelain`；预期：文件被 `.gitignore` 的 `.env*` 规则忽略、不出现在 `git status`；实际：命中 `.gitignore:34:.env*`，`git status` 仅显示计划目录，文件未出现。测试 T3：`git diff --check` 与 `wc -l AGENTS.md`；预期：无空白错误、AGENTS.md ≤ 200 行；实际：`git diff --check` 退出码 0，AGENTS.md 140 行。
- [x] MVP 验收：范围最小可用、验收逐项满足、检查已执行无未处理失败。验收项①.env.local 存在且仅含占位符/非敏感默认值（通过，31 键，密钥特征 0 命中）；验收项②键名与 `lib/server/**` 实际读取项一致（通过，逐键核对，`NODE_ENV` 例外已注释）；验收项③已明确 Vercel 需另行配置线上变量（通过，文件头注释 + 计划文档均写明 Vercel 不读取 .env.local）。测试结果：T1/T2/T3 均通过；剩余风险见下。

## 遗留问题与下一步
- Vercel 不会读取 .env.local：Preview / Production 变量必须在「Project Settings → Environment Variables」按环境配置，或使用 `vercel env add <NAME>`（本次未执行，需用户明确授权）。
- 该文件被 `.gitignore` 忽略，无法提交，团队成员需各自创建；当前占位符不可直接用于生产。
- 安全类密钥有格式约束（如 `CREDENTIAL_ENCRYPTION_KEY` 需 32 字节 base64），`PAYMENTS_DEVNET_ENABLED` / `PAYMENTS_ALLOW_LOCAL_SESSION` 仅限本地，`NODE_ENV=production` 时支付配置会直接抛错。

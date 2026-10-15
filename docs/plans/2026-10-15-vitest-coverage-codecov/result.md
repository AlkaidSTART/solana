# 需求执行记录：Vitest 覆盖率 + Codecov 接入 GitHub Actions CI

计划：docs/plans/2026-10-15-vitest-coverage-codecov/plan.md
请求来源：`安装 @vitest/coverage-v8，将 codecov 增加到 GitHub Actions CI`（https://app.codecov.io/gh/AlkaidSTART/solana/new）
说明：用户给的 npm 命令按仓库规范（AGENTS.md：包管理器固定 pnpm）改为 pnpm 执行；`vitest` 已存在于 devDependencies，仅新增覆盖率包。

- [x] 阶段 1：依赖 + 覆盖率配置（`package.json`、`pnpm-lock.yaml`、`vitest.config.mts`）；测试 T1：`pnpm test:coverage`；预期：316 用例通过并生成 lcov；实际：`Test Files 34 passed (34) / Tests 316 passed (316)`（2.70s），生成 `coverage/lcov.info` 与 `coverage/lcov-report/`。安装 `@vitest/coverage-v8 4.1.11`（与 vitest 4.1.11 严格对齐；registry 最新 5.0.4 不兼容已避开）。覆盖率总览：Statements 24.14%、Branches 26.91%、Functions 23.47%、Lines 23.64%（口径为 lib/stores/components 全量文件，偏低是现状——大量 `lib/server/services/**` 无用例）。遗留/下一步：覆盖率低的模块后续单独补用例；本轮不设阈值。
- [x] 阶段 2：新增 `.github/workflows/ci.yml`（push/PR 目标 `main`、`dev-m`；checkout@v7 → pnpm/action-setup@v6 → setup-node@v7（node 22 + pnpm cache）→ `pnpm install --frozen-lockfile` → `pnpm lint` → `next typegen && tsc --noEmit` → `pnpm test:coverage` → `codecov/codecov-action@v7` 上传 `coverage/lcov.info`，flags=unit，`fail_ci_if_error: true`，token 走 `secrets.CODECOV_TOKEN`（未配置时 public 仓库 tokenless 上传））；测试 T2：ruby YAML 解析通过 + 对照各 action 最新 tag 的 `action.yml` 核验输入（pnpm action v6 自动读 `packageManager: pnpm@11.17.0`；codecov v7 支持 files/flags/token/fail_ci_if_error）；实际：通过。遗留：GitHub Actions 无法在本地端到端执行，首次真实运行需推送/开 PR 后在 Actions 页确认；如需覆盖 `develop` 分支或接入 e2e，另行扩展。
  - 附带修复：`eslint.config.mjs` `globalIgnores` 增加 `coverage/**`（否则 `pnpm lint` 会扫覆盖率生成的 JS 并报 warning）；实际：lint 由 4 warnings（含产物 1 条）降为 3 条既有 warnings（`components/console/user-assets-banner.tsx`、`user-nav-dropdown.tsx` 的 `<img>` 提示，非本次引入）。
- [x] 阶段 3：本地全量检查；`pnpm lint`（0 errors / 3 既有 warnings，exit 0）、`pnpm exec next typegen && pnpm exec tsc --noEmit`（通过）、`pnpm test:coverage`（通过）、`pnpm build`（通过，exit 0）；文档：本 result.md 与计划同步。
- [ ] MVP 验收：仓库侧全部完成（见下）；剩余一件事需用户在 GitHub/Codecov 侧完成并验证首次 CI 运行。
  - [x] `@vitest/coverage-v8@^4.1.11` 已入 devDependencies，lockfile 同步（无无关依赖增删，diff 仅 peer 哈希重排）。
  - [x] `pnpm test:coverage` 通过并生成 lcov。
  - [x] `.github/workflows/ci.yml` 含 lint / typecheck / test+coverage / codecov 上传。
  - [x] lint、typegen+tsc、vitest+coverage、build 本地全部通过。
  - [ ] 首次 CI 真实运行 + Codecov 上传成功（需 push 或开 PR；public 仓库无需 token 即可 tokenless 上传）。

## 未提交说明

按仓库规范未执行 commit/push。改动文件：
- `package.json`（devDependency + `test:coverage` 脚本）
- `pnpm-lock.yaml`
- `vitest.config.mts`（coverage 配置）
- `eslint.config.mjs`（忽略 `coverage/**`）
- `.github/workflows/ci.yml`（新增）
- `docs/plans/2026-10-15-vitest-coverage-codecov/{plan.md,result.md}`（新增）

## Codecov 一次性配置（用户操作）

1. 打开 https://app.codecov.io/gh/AlkaidSTART/solana/new —— public 仓库由首次 tokenless 上传自动建立（推送本分支并让 CI 跑一次即可）。
2. 可选（推荐，防止未来转为 private 或 tokenless 被关闭）：Codecov → solana → Settings → General → Access Token 复制 token，在 GitHub 仓库 Settings → Secrets and variables → Actions 新建 `CODECOV_TOKEN`；workflow 已预留该 secret，无需再改 YAML。
3. 可选：README 增加 badge（本轮未加，避免超范围）：
   `[![codecov](https://codecov.io/gh/AlkaidSTART/solana/graph/badge.svg)](https://codecov.io/gh/AlkaidSTART/solana)`

# 需求执行记录：Vitest 覆盖率 + Codecov 接入 GitHub Actions CI

计划：docs/plans/2026-10-15-vitest-coverage-codecov/plan.md
请求来源：`安装 @vitest/coverage-v8，将 codecov 增加到 GitHub Actions CI`（https://app.codecov.io/gh/AlkaidSTART/solana/new）
说明：用户给的 npm 命令按仓库规范（AGENTS.md：包管理器固定 pnpm）改为 pnpm 执行；`vitest` 已存在于 devDependencies，仅新增覆盖率包。

- [x] 阶段 1：依赖 + 覆盖率配置（`package.json`、`pnpm-lock.yaml`、`vitest.config.mts`）；测试 T1：`pnpm test:coverage`；预期：316 用例通过并生成 lcov；实际：`Test Files 34 passed (34) / Tests 316 passed (316)`（2.70s），生成 `coverage/lcov.info` 与 `coverage/lcov-report/`。安装 `@vitest/coverage-v8 4.1.11`（与 vitest 4.1.11 严格对齐；registry 最新 5.0.4 不兼容已避开）。覆盖率总览：Statements 24.14%、Branches 26.91%、Functions 23.47%、Lines 23.64%（口径为 lib/stores/components 全量文件，偏低是现状——大量 `lib/server/services/**` 无用例）。遗留/下一步：覆盖率低的模块后续单独补用例；本轮不设阈值。
- [x] 阶段 2：新增 `.github/workflows/ci.yml`（push/PR 目标 `main`、`dev-m`；checkout@v7 → pnpm/action-setup@v6 → setup-node@v7（node 22 + pnpm cache）→ `pnpm install --frozen-lockfile` → `pnpm lint` → `next typegen && tsc --noEmit` → `pnpm test:coverage` → `codecov/codecov-action@v7` 上传 `coverage/lcov.info`，flags=unit，`fail_ci_if_error: true`，token 走 `secrets.CODECOV_TOKEN`（未配置时 public 仓库 tokenless 上传））；测试 T2：ruby YAML 解析通过 + 对照各 action 最新 tag 的 `action.yml` 核验输入（pnpm action v6 自动读 `packageManager: pnpm@11.17.0`；codecov v7 支持 files/flags/token/fail_ci_if_error）；实际：通过。遗留：GitHub Actions 无法在本地端到端执行，首次真实运行需推送/开 PR 后在 Actions 页确认；如需覆盖 `develop` 分支或接入 e2e，另行扩展。
  - 附带修复：`eslint.config.mjs` `globalIgnores` 增加 `coverage/**`（否则 `pnpm lint` 会扫覆盖率生成的 JS 并报 warning）；实际：lint 由 4 warnings（含产物 1 条）降为 3 条既有 warnings（`components/console/user-assets-banner.tsx`、`user-nav-dropdown.tsx` 的 `<img>` 提示，非本次引入）。
- [x] 阶段 3：本地全量检查；`pnpm lint`（0 errors / 3 既有 warnings，exit 0）、`pnpm exec next typegen && pnpm exec tsc --noEmit`（通过）、`pnpm test:coverage`（通过）、`pnpm build`（通过，exit 0）；文档：本 result.md 与计划同步。
- [x] 阶段 4：Test Analytics（失败测试展示）——`package.json` 增加 `test:ci` 脚本（`vitest run --coverage --reporter=default --reporter=junit --outputFile.junit=./test-results/junit.xml`，JUnit 为 vitest 内置 reporter、零新依赖）；`ci.yml` 测试步骤改 `pnpm test:ci`，新增 `report_type: test_results` 上传步骤，两个 codecov step 加 `if: ${{ !cancelled() }}`（测试失败也要上传）；测试 T5：`pnpm test:ci` → 34 文件 / 316 用例通过，`test-results/junit.xml` 生成（77959 字节，REXML 解析合法，`//testcase` 316 个，failures=0）；实际：通过。遗留：失败场景（用例失败时 JUnit 仍会写出，但本地无失败用例实测，首次红 CI 时复核）；`test-results/` 已在 .gitignore，无脏文件。
- [ ] MVP 验收：仓库侧全部完成（见下）；剩余需用户在 GitHub/Codecov 侧完成并验证首次 CI 运行。
  - [x] `@vitest/coverage-v8@^4.1.11` 已入 devDependencies，lockfile 同步（无无关依赖增删，diff 仅 peer 哈希重排）。
  - [x] `pnpm test:coverage` 通过并生成 lcov；`pnpm test:ci` 通过并生成合法 `test-results/junit.xml`。
  - [x] `.github/workflows/ci.yml` 含 lint / typecheck / test+coverage / codecov 覆盖率上传 / codecov test_results 上传。
  - [x] lint、typegen+tsc、vitest+coverage、build 本地全部通过。
  - [ ] 首次 CI 真实运行 + Codecov 覆盖率与 Test Analytics 上传成功（需 push 或开 PR；public 仓库无需 token 即可 tokenless 上传）。
  - [ ] Codecov GitHub App 安装授权（PR 评论/失败测试评论的前提；仅 dashboard 不需要）。

## 未提交说明

- 前四类改动已由用户提交：`34a871c feat: integrate Vitest coverage with Codecov in GitHub Actions CI`。
- 本阶段（Test Analytics）改动文件：
  - `package.json`（新增 `test:ci` 脚本）
  - `.github/workflows/ci.yml`（测试步骤改 `pnpm test:ci`，新增 test_results 上传 + `!cancelled()` 条件）
  - `docs/plans/2026-10-15-vitest-coverage-codecov/plan.md`（追加范围）
  - 本 `result.md`
- 观察（非本次改动，未触碰）：工作区存在未提交的 `.gitignore` 变更（第 50 行新增 `/docs/`），会影响后续新增的 `docs/` 文档被 git 跟踪；如需继续提交计划文档需先与需求方确认该行去留。

## Codecov 一次性配置（用户操作）

1. 打开 https://app.codecov.io/gh/AlkaidSTART/solana/new —— public 仓库由首次 tokenless 上传自动建立（推送并让 CI 跑一次即可）。
2. 安装 Codecov GitHub App 并授权 `AlkaidSTART/solana`：否则 Codecov 有数据，但 PR 上不会出现覆盖率/失败测试评论。
3. 可选（推荐，防止未来转为 private 或 tokenless 被关闭）：Codecov → solana → Settings → General → Access Token 复制 token，在 GitHub 仓库 Settings → Secrets and variables → Actions 新建 `CODECOV_TOKEN`；workflow 已预留该 secret，无需再改 YAML。
4. Test Analytics 生效路径：首次 CI 跑完 → `report_type: test_results` 上传成功 → Failed tests dashboard 立即有数据；之后开 PR（含失败用例时）才会在 PR 评论中显示失败测试摘要。
5. 可选：README 增加 badge（本轮未加，避免超范围）：
   `[![codecov](https://codecov.io/gh/AlkaidSTART/solana/graph/badge.svg)](https://codecov.io/gh/AlkaidSTART/solana)`

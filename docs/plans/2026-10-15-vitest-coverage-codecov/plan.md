# 计划：Vitest 覆盖率 + Codecov 接入 GitHub Actions CI

需求：`安装 @vitest/coverage-v8，将 codecov 增加到 GitHub Actions CI`（https://app.codecov.io/gh/AlkaidSTART/solana/new）

## 1. 背景

- 仓库已具备：`vitest@4.1.11`（devDependencies）、`vitest.config.mts`、`package.json` 中的 `test` / `test:unit` 脚本、`tests/e2e`（Playwright）。实测基线：`pnpm exec vitest run` → 34 个文件 / 316 个用例全部通过（1.58s）。
- 尚未安装 `@vitest/coverage-v8`；vitest 要求覆盖率包与 vitest 主版本严格对齐（当前 registry 上 `@vitest/coverage-v8` 最新为 5.0.4，与本仓库 vitest 4.1.11 不兼容，必须装 `^4.1.11`）。
- 仓库没有 `.github/` 目录，即目前没有任何 GitHub Actions CI，需要一并新建 workflow。
- `.gitignore` 已忽略 `/coverage`，无需改动。
- 远程仓库 `origin` = `https://github.com/AlkaidSTART/solana.git`（public，默认分支 `main`；Codecov 对 public 仓库支持 GitHub Actions tokenless 上传，配置 token 为可选项、推荐项）。
- 约束（AGENTS.md）：包管理器固定 pnpm，用户给的 `npm install --save-dev ...` 改为 pnpm 等价命令；`vitest` 已安装，只新增覆盖率包。改动只涉及依赖、测试配置与 CI，不触碰 `lib/**`、`app/**` 业务逻辑。

## 2. 目标

1. 安装 `@vitest/coverage-v8@^4.1.11`（devDependency），与 vitest 版本对齐。
2. `vitest.config.mts` 增加 coverage 配置：provider v8，reporter `text` + `lcov`，输出到 `./coverage`。
3. `package.json` 增加脚本 `test:coverage`。
4. 新建 `.github/workflows/ci.yml`：push（main/dev-m）与 PR（目标 main/dev-m）触发 → pnpm 安装（frozen lockfile）→ lint → typegen + tsc → `vitest run --coverage` → `codecov/codecov-action@v5` 上传 `coverage/lcov.info`。
5. 给出 Codecov 侧一次性配置步骤（token secret、badge 可选），并在 result.md 记录。

## 3. MVP 范围

- `package.json`：新增 devDependency `@vitest/coverage-v8@^4.1.11`；新增 script `"test:coverage": "vitest run --coverage"`；同步 `pnpm-lock.yaml`。
- `vitest.config.mts`：`test.coverage = { provider: "v8", reporter: ["text", "lcov"], reportsDirectory: "./coverage", include: ["lib/**/*.{ts,tsx}", "stores/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"], exclude: ["**/*.test.{ts,tsx}", "**/*.d.ts"] }`。覆盖率口径与现有测试目录一致（不把 app/e2e/mock 计入）。
- `.github/workflows/ci.yml`：
  - 触发：`push` to `main`、`dev-m`；`pull_request` targeting `main`、`dev-m`。
  - 步骤：checkout → pnpm/action-setup（读取 `packageManager: pnpm@11.17.0`，不重复写版本）→ setup-node（node 22，cache pnpm）→ `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm exec next typegen && pnpm exec tsc --noEmit` → `pnpm test:coverage` → `codecov/codecov-action@v5`（`files: ./coverage/lcov.info`，`fail_ci_if_error: true`，`token: ${{ secrets.CODECOV_TOKEN }}` 可选——public 仓库未配置 token 时 codecov-action 走 tokenless 上传）。
  - `concurrency` 取消同分支旧运行。

## 4. 非目标

- 不把 Playwright e2e 接入 CI（需要浏览器安装与数据库/Redis 环境，单独需求立项）。
- 不设置覆盖率阈值 gate（先观察基线，避免无依据地卡 CI）。
- 不引入 React Testing Library / jsdom（现有测试为 node 环境纯逻辑测试，组件测试设施另行计划）。
- 不新增 Codecov badge 到 README（可后续按需补，不属于本次请求）。
- 不包含 `pnpm build` 到 CI（CI 无 `.env`/数据库注入，构建依赖运行时环境变量，先不引入误报来源；本地验证阶段单独尝试）。
- 不修改 `lib/**`、`app/**`、现有测试用例；不提交、不推送任何 commit。

## 5. 风险与依赖

- **版本错配**：`@vitest/coverage-v8` 必须与 `vitest` 4.x 对齐，固定 `^4.1.11`；若未来升级 vitest，需同步这两个包。
- **Codecov 首次上传**：public 仓库支持 tokenless，但若仓库在 Codecov 侧配置了“必须 token”，则需在 GitHub 仓库 Settings → Secrets 添加 `CODECOV_TOKEN`（Codecov → solana → Settings → General → Access token）。未配置时先观察 CI 上传结果。
- **CI Node 版本**：项目 README 要求 Node >= 22.9.0，CI 用 22.x 满足；本地为 26.7.0，无版本专属语法依赖。
- **typegen**：`next typegen` 为 Next 16 命令，需确认本地可执行，否则 CI 同步骤会失败。

## 6. 阶段拆分与验证

### 阶段 1：依赖 + 覆盖率配置
- 执行：`pnpm add -D @vitest/coverage-v8@^4.1.11`；编辑 `vitest.config.mts`、`package.json`。
- 测试 T1：`pnpm exec vitest run --coverage`；预期：316 用例全过，终端输出覆盖率表，生成 `coverage/lcov.info` 与 `coverage/lcov-report/`。

### 阶段 2：CI workflow
- 执行：新建 `.github/workflows/ci.yml`。
- 测试 T2：按 YAML 结构逐项核对触发条件/步骤/action 版本；用 node 内置方式校验 YAML 语法（如 `node -e "require('yaml')"` 不可用则人工审阅），并核对 codecov-action 输入参数与官方文档一致。

### 阶段 3：本地全量检查 + 文档
- 测试 T3：`pnpm lint`；`pnpm exec next typegen && pnpm exec tsc --noEmit`。预期：均无错误。
- 测试 T4（尽力执行）：`pnpm build`；若因本地/环境既有问题失败，记录原因，不作为本次门禁（本次未改业务代码）。
- 更新 `result.md`（检查清单、命令、实际结果、遗留项）。

## 7. 最终验收标准

- [ ] `@vitest/coverage-v8` 安装为 devDependency 且与 vitest 4.1.11 兼容，`pnpm-lock.yaml` 同步。
- [ ] `pnpm test:coverage` 本地通过并生成 lcov。
- [ ] `.github/workflows/ci.yml` 存在，含 lint / typecheck / test+coverage / codecov 上传步骤。
- [ ] `pnpm lint`、typegen + `tsc --noEmit`、`vitest run --coverage` 全部通过。
- [ ] result.md 记录实际结果与遗留（含 Codecov 一次性配置说明；CI 真实运行需用户推送/开 PR 后验证）。

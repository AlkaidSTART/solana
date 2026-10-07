# 解决与 origin/main 的分支合并冲突计划

**目标：**解决当前 `dev-m` 分支与远端 `origin/main` 之间的合并冲突，保留两端有效交付成果（包含 `origin/main` 的全栈 API 规范与文档，以及 `dev-m` 的完整 Devnet 支付、东南亚多语言与控制台交互系统），确保类型检查、全量单元测试与构建门禁 100% 通过。

**实施方式：**在当前工作区由主智能体顺序推进。

## 1. 背景与冲突分析

- 远端 `origin/main` 通过 PR #6 合入了 `develop` 分支改动（commit `6dc5f7d`），引入了 `docs/API.md`、全栈 API 文档计划、修改了 `AGENTS.md`、`README.md`，并在其离线计划中临时增加了 `@solana/pay@beta` 与 `@solana/kit@6.10.0`。
- 本地 `dev-m` 分支根据项目 `solana-dev` 规范及 PRD，升级并完整实现了基于 `@solana/kit@8.4.0` 的真实 Devnet USDC 支付闭环、多语言国际化系统、完整测试矩阵（Vitest / Playwright）及商业级控制台。
- 两个分支三路合并产生冲突的文件：
  1. `README.md`：`origin/main` 增加了全栈 API 声明与链接；`dev-m` 进行了全面的文档与路由架构重构。
  2. `package.json`：`origin/main` 包含旧版 `@solana/kit: 6.10.0` 与未使用的 `@solana/pay`；`dev-m` 包含了 `@solana/kit: 8.4.0` 及全套全栈支付、测试与动效依赖。
  3. `pnpm-lock.yaml`：依赖树分叉冲突。
- 自动合并的文件（验证无语法/规则冲突）：
  - `AGENTS.md`
  - `docs/PRD.md`
- `origin/main` 新增文件正常纳入：
  - `docs/API.md`
  - `docs/plans/2026-10-07-next-fullstack-api-docs/`
  - `docs/plans/2026-10-07-solana-sdk-install/`

## 2. 冲突解决策略与不变量

1. **依赖仲裁**：保留 `dev-m` 的 `@solana/kit@8.4.0` 及全部依赖与脚本，维持已有的 108 个单元测试与全栈支付闭环，不引入破坏性的降级与冲突的旧 beta 包。
2. **文档融合**：在 `README.md` 中融合 `origin/main` 的 Next.js 全栈 API 契约声明与 `docs/API.md` 索引，保留 `dev-m` 的企业级结构、环境变量与架构说明。
3. **协作规范守护**：确保合并后的 `AGENTS.md` 行数严格不超过 200 行。
4. **锁文件与环境**：保持 `pnpm-lock.yaml` 与 `package.json` 一致，避免混合包管理器。

## 3. 阶段拆分与测试矩阵

### 阶段 1：合并发起与冲突分析
- 发起 `git merge origin/main`，明确具体冲突文件列表。
- 检查工作区暂存与未暂存状态，保护已有工作。

### 阶段 2：逐文件解决冲突并融合改动
- 解决 `README.md` 冲突，融合两边文档与架构索引。
- 解决 `package.json` 冲突，确保依赖以 `dev-m` 完整可运行环境为准。
- 解决 `pnpm-lock.yaml` 冲突，确保锁文件与依赖完全同步。
- 阶段测试：检查工作区文件无 Git 冲突标记（例如三路对比分隔符）。

### 阶段 3：代码质量与测试验证
- 阶段测试 T1：`pnpm exec next typegen && pnpm exec tsc --noEmit`（TypeScript 零错误）。
- 阶段测试 T2：`/usr/local/bin/node ./node_modules/vitest/vitest.mjs run`（全量 108+ 单元测试全绿）。
- 阶段测试 T3：`AGENTS.md` 行数检查（≤ 200 行）。
- 阶段测试 T4：`git diff --check`（无空白/格式错误）。

### 阶段 4：合并提交与最终验收
- 完成 git 合并提交。
- 最终核验 `git status`、`git log` 与分支健康度。

## 4. 最终验收标准
1. `dev-m` 成功合并 `origin/main`，无未解决冲突。
2. `docs/API.md` 与相关文档完整保留。
3. 全量单元测试（Vitest 108 项测试）全部通过。
4. TypeScript 类型检查零错误。
5. `AGENTS.md` 行数不超过 200 行。
6. 执行记录 `result.md` 详实完整。

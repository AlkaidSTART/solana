# 解决 develop 分支与 origin/main 的合并冲突计划

**目标：**在 `develop` 分支上合并远端 `origin/main`（包含 PR #10 的最新控制台 i18n 适配与 UI 升级成果），解决冲突并保留两端功能（`develop` 的 Phase 1 全栈 API 与后台服务 + `origin/main` 的现代控制台 UI、多语言体系与 Devnet 支付系统），确保依赖完整、类型检查通过、测试全绿、构建成功。

## 1. 背景与冲突分析

- 远端 `origin/main` 合入了 `dev-m` 的 PR #10（commit `030c431`），包含：
  - `app/console/inbox/page.tsx` 与 `app/console/stores/page.tsx` 的全量 8 语言多语言适配、GSAP 动效与组件优化；
  - `docs/plans/2026-10-07-console-ui-i18n-completion/result.md` 交付验收记录；
  - 前端动画库 `gsap`。
- 本地与远端 `develop` 分支（commit `19b5978`）包含：
  - Phase 1 API 完整服务（`app/api/v1/**`、`lib/server/**`）；
  - 后端依赖 `bullmq`、`ioredis`、`postgres` 及相关迁移与脚本；
  - 但其合并基准停留于 PR #9 阶段，缺少 PR #10 的多语言与 UI 升级。
- 三路合并冲突文件列表：
  1. `app/console/inbox/page.tsx`：`origin/main` 进行了 i18n 接入与 GSAP 升级；`develop` 分支保留旧版文案。
  2. `app/console/stores/page.tsx`：`origin/main` 进行了 i18n 接入与多语言模板扩展；`develop` 分支使用旧版本。
  3. `docs/plans/2026-10-07-console-ui-i18n-completion/result.md`：`origin/main` 存在完成态结果记录，`develop` 分支缺少此文件（modify/delete 冲突）。
- 依赖协同文件：
  - `package.json` & `pnpm-lock.yaml`：融合前端 `gsap` 与后端 `bullmq`、`ioredis`、`postgres` 依赖。

## 2. 冲突解决策略与不变量

1. **页面 UI 与多语言仲裁**：保留 `origin/main` 的 `inbox/page.tsx` 与 `stores/page.tsx`，确保控制台全量 8 语言支持与最新组件动效不退化。
2. **计划文档保护**：保留 `docs/plans/2026-10-07-console-ui-i18n-completion/result.md`。
3. **后端 API 完整性**：100% 保留 `develop` 分支的全部 `app/api/v1/**` 路由与 `lib/server/**` 业务逻辑。
4. **依赖全量并存**：融合 `package.json`，同时包含 `gsap`（前端）和 `bullmq`/`ioredis`/`postgres`（后端）。使用 `pnpm install` 刷新并锁定 `pnpm-lock.yaml`。
5. **协作规范守护**：`AGENTS.md` 行数严格保持 ≤ 200 行。

## 3. 阶段拆分与测试矩阵

### 阶段 1：发起合并与标记冲突
- 在 `develop` 分支上执行 `git merge origin/main`。
- 确认三处冲突点：`inbox/page.tsx`、`stores/page.tsx`、`result.md`。

### 阶段 2：解决冲突并融合依赖
- 解决 `app/console/inbox/page.tsx` 冲突（以 `origin/main` 最新多语言版本为准）。
- 解决 `app/console/stores/page.tsx` 冲突（以 `origin/main` 最新多语言版本为准）。
- 解决 `docs/plans/2026-10-07-console-ui-i18n-completion/result.md`（保留文件）。
- 融合 `package.json` 依赖，运行 `pnpm install` 同步 `pnpm-lock.yaml`。

### 阶段 3：代码质量与测试验证
- 阶段测试 T1：`pnpm exec next typegen && pnpm exec tsc --noEmit`（TypeScript 零错误）。
- 阶段测试 T2：`pnpm exec vitest run`（全量测试通过）。
- 阶段测试 T3：`pnpm lint`（ESLint 检查通过）。
- 阶段测试 T4：`pnpm build`（Next.js 生产构建通过）。
- 阶段测试 T5：`AGENTS.md` 行数检查（≤ 200 行）。

### 阶段 4：合并提交与交付检查
- 提交合并 commit。
- 确认 `git status` 与分支健康状态。

## 4. 最终验收标准
1. `develop` 分支成功合入 `origin/main`，无残留 Git 冲突标记。
2. 控制台页面保留最新 8 语言多语言适配与 UI 交互。
3. Phase 1 全栈 API 路由与后端服务完整无损。
4. TypeScript 类型检查 0 错误、Vitest 测试全绿、ESLint 0 告警、Next.js 构建成功。
5. `AGENTS.md` 行数不超过 200 行。
6. `result.md` 执行记录真实完整。

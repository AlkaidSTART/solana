# 需求执行记录：Plan 与 Result 单文件夹协同管理规范

计划：`docs/plans/2026-10-07-plan-result-folder-management/plan.md`

- [x] 阶段 1：创建本需求专属文件夹与 `plan.md`、`result.md`。测试 T1：核查目录建立与文件配对；预期：`docs/plans/2026-10-07-plan-result-folder-management/` 包含 `plan.md` 与 `result.md`；实际：PASS。下一步：修改 `AGENTS.md`。
- [x] 阶段 2：修改 `AGENTS.md`，确立单目录文件夹管理规范，核验行数与 Next.js 区块。测试 T2：读取 AGENTS.md 第 3 节与第 10 节；预期：明确“每个需求以专属文件夹 docs/plans/YYYY-MM-DD-<slug>/ 统一管理，内部必须且仅维护 plan.md 与 result.md”，行数 140 行（≤ 200 行），Next.js 区块原样保留；实际：PASS。下一步：迁移既有 6 组 plan/result 到各自独立文件夹，清理顶层扁平文件。
- [x] 阶段 3：迁移既有 6 组 plan/result 到各自独立文件夹，清理顶层扁平文件。测试 T3：核查 `docs/plans/` 下所有子目录及其内部文件；预期：6 个历史需求全部转换为子目录，各子目录内成对包含 `plan.md` 与 `result.md`，顶层无任何遗留 `*.md` 扁平文件；实际：PASS。下一步：自动化结构校验与回归测试（T1–T4）。
- [ ] 阶段 4：自动化结构校验与回归测试（T1–T4）。
- [ ] MVP 验收：验收标准逐项核对。

# 需求计划：Plan 与 Result 单文件夹协同管理规范

- 日期：2026-10-07
- 背景：此前计划和结果文件散落在 `docs/plans/` 根层（`*.md` 与 `*.result.md`），用户要求“一个 plan 和 result，然后一个文件夹进行管理，补充 AGENTS.md”。根目录 `result.md` 已由用户移除，需求执行完全转为文件夹内自闭环。
- 目标：
  1. 更新 `AGENTS.md`：规范每个需求必须建立专属文件夹 `docs/plans/YYYY-MM-DD-<slug>/`，内部配对 `plan.md` 与 `result.md`；禁止扁平散落或根目录混写。
  2. 迁移重构 `docs/plans/` 下既有所有历史任务至独立目录结构。
  3. 保留总行数 ≤ 200 行及 Next.js 规则区块。
- MVP 范围：更新 `AGENTS.md`、重构既有 plan/result 目录结构、建立本需求专属文件夹与记录。
- 非目标：不修改业务代码、不重新创建根目录 `result.md`、不触碰无关设计或 PRD 文档。
- 风险/依赖：
  1. 保持 `docs/plans/2026-10-07-prd-channel-feasibility` 的最新记录无损迁移。
  2. `AGENTS.md` 总行数严格 ≤ 200 行。

## 最小可交付成果与验收标准

1. `AGENTS.md` 明确规定：每个需求在 `docs/plans/YYYY-MM-DD-<slug>/` 独立文件夹下管理，内部必须且仅维护 `plan.md` 与 `result.md`。
2. `docs/plans/` 下所有历史需求均迁移为该目录结构，原有扁平 `*.md` 与 `*.result.md` 完全清理。
3. `wc -l AGENTS.md` ≤ 200，Next.js 原区块保持不变，`git diff --check` 通过。

## 阶段与检查

- [x] 阶段 1：创建本需求专属文件夹与 `plan.md`、`result.md`。
- [x] 阶段 2：修改 `AGENTS.md`，确立单目录文件夹管理规范，核验行数与 Next.js 区块。
- [x] 阶段 3：迁移既有 6 组 plan/result 到各自独立文件夹，清理顶层扁平文件。
- [x] 阶段 4：自动化结构校验与回归测试（T1–T4）。
- [x] MVP 验收：验收标准逐项核对。

## 测试样例

- T1 目录结构标准：检查 `docs/plans/` 下各子目录均包含且仅包含 `plan.md` 与 `result.md`。
- T2 AGENTS.md 规范与行数：检查规则表述与行数（≤ 200 行），Next.js 区块比对。
- T3 扁平文件清理：检查 `docs/plans/` 顶层无遗留 `*.md` 扁平文件。
- T4 无空白错误与脏变更：`git diff --check` 通过。

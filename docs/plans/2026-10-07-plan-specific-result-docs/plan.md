# 需求计划：每个 Plan 独立专属 result.md 规范

- 日期：2026-10-07
- 背景：原 `AGENTS.md` 规定所有任务阶段记录集中追加在根目录 `result.md`，导致多需求历史交织、单个文件无限膨胀；用户明确要求“每一个 plan 都要有个 result.md”。
- 目标：补充并修正 `AGENTS.md` 规范，确立“每个 plan 必须有且仅有一个独立专属的 result 文档（`docs/plans/YYYY-MM-DD-<slug>.result.md`）”原则；历史记录分拆归位至对应 plan 的专属 result 文档，根目录 `result.md` 转为索引。
- MVP 范围：
  1. 更新 `AGENTS.md` 第 3、10 节规范与行数核对（≤ 200 行，原 Next.js 区块保留）。
  2. 既有 5 个 plan 的执行记录分拆至同名 `*.result.md`。
  3. 根目录 `result.md` 调整为目录索引。
  4. 新增本计划与专属结果记录文件。
- 非目标：不修改业务实现代码、不安装新依赖、不触碰无关设计或 PRD 文档。
- 风险/依赖：
  1. `AGENTS.md` 行数严格 ≤ 200 行，Next.js 自动维护区块保持原样。
  2. 保留工作区未提交修改（如 `docs/UI_DESIGN.md`、`docs/plans/2026-10-07-awwwards-ui-design.md`、`docs/plans/2026-10-07-prd-channel-feasibility.md`）。

## 最小可交付成果与验收标准

1. `AGENTS.md` 明确规定：每个 plan 必须配对专属 result 文档（`docs/plans/YYYY-MM-DD-<slug>.result.md` 或计划专属目录下的 `result.md`），禁止多需求混写全局单一 result。
2. 既有所有 plan 均拥有对应的独立 `*.result.md` 文件，阶段与验收内容无损迁移。
3. 根目录 `result.md` 作为总览索引，清晰指向各 plan 的专属 result 文档。
4. `wc -l AGENTS.md` ≤ 200，Next.js 区块与原规则完整保留，`git diff --check` 无空白错误。

## 阶段与检查

- [x] 阶段 1：创建本计划与专属 result 文档（`docs/plans/2026-10-07-plan-specific-result-docs/result.md`）。
- [x] 阶段 2：修改 `AGENTS.md`，更新 MVP 工作流记录规则及交付闸门，核验行数（≤ 200 行）与原区块。
- [x] 阶段 3：拆分迁移既有 5 个 plan 的 result 记录至各自同名 `*.result.md`，更新根目录 `result.md` 为索引。
- [x] 阶段 4：自动化结构校验与回归测试（T1–T5）。
- [x] MVP 验收：逐项核对验收标准，无遗留错误。

## 测试样例

- T1 前置计划与专属 result 配对：检查新计划是否存在对应的 `*.result.md`。
- T2 规范完整性：检查 `AGENTS.md` 是否明确“每个 plan 专属 result 文档”及禁止全局混写。
- T3 既有历史归位：检查 5 个已有 plan 是否均有对应的 `*.result.md` 且内容完整。
- T4 根目录索引健康：检查 `result.md` 是否有效索引所有 plan 及其专属 result 路径。
- T5 约束检查：`wc -l AGENTS.md` ≤ 200，Next.js 区块比对一致，`git diff --check` 通过。

# 需求执行记录：每个 Plan 独立专属 result.md 规范

计划：`docs/plans/2026-10-07-plan-specific-result-docs.md`

- [x] 阶段 1：创建计划文档与专属结果记录文件。测试 T1：核对计划含背景、目标、范围、阶段、验收、测试样例，核对专属结果文档已建立；预期：两文件成对存在；实际：PASS。遗留问题：无；下一步：修改 `AGENTS.md`。
- [x] 阶段 2：修改 `AGENTS.md`，明确每个 plan 配对独立专属 result 文档，核查行数与 Next.js 区块。测试 T2：核查 Section 3 第 4、5 条规则与 Section 10 交付闸门；预期：明确禁止混写全局单一文件、规定同目录成对命名为 `docs/plans/YYYY-MM-DD-<slug>.result.md`；实际：通过，行数 140 行（≤ 200 行），Next.js 区块保持一致。遗留：无；下一步：拆分迁移既有 5 个 plan 的 result 记录。
- [x] 阶段 3：拆分迁移既有 5 个 plan 的 result 记录至各自专属 `*.result.md`，重构根目录 `result.md` 为索引总览。测试 T3/T4：核查 5 个历史 plan 的专属 result 文档是否存在且内容无损，核查根目录 `result.md` 是否正确建立索引表；预期：5 组历史成对文件均存在、根目录建立统一索引表；实际：PASS。遗留：无；下一步：自动化校验与测试样例执行（T1–T5）。
- [x] 阶段 4：自动化校验与测试样例执行（T1–T5）。测试 T1–T5：运行 Python 脚本检验计划/结果配对、AGENTS.md 行数与规则、历史迁移无损、索引表完整性、`git diff --check`；预期：全部通过；实际：PASS，AGENTS.md 为 140 行（≤ 200 行），无空白错误。遗留：无；下一步：MVP 验收。
- [x] MVP 验收：4 项验收标准逐项核对满足。交付物：更新 `AGENTS.md`、更新根目录 `result.md` 索引、建立 6 组配对的 `docs/plans/*.result.md`（含本需求及 5 个历史 plan），未改动业务代码，无遗留风险。

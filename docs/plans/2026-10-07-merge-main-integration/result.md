# 需求执行记录：选择性合并 main 支付模块并交付

计划：`docs/plans/2026-10-07-merge-main-integration/plan.md`

- [x] 阶段 1：选择边界与计划更新；测试 T1：`git status --short --branch`、merge 双亲核对、三路 Luna 静态依赖/路径审查；预期：工作区干净，main 支付闭包可独立挂载在 ours 全局壳层；实际：本地未推送 merge 为 `fb0f66c`，双亲为我们的 `7888477` 与 `main@d848aaf`，起始工作区干净；审查一致确认支付白名单为 `app/api/payments/**`、billing 页面与组件、`lib/payments/**`、`lib/server/payments/**`、payment 脚本/测试/fixtures，且不依赖 main 的全局 layout、theme、store、i18n、landing 或通用 UI；`/api/v1/billing/**` 明确归 ours；遗留/下一步：按白名单恢复非支付路径并求解根依赖并集。
- [x] 阶段 2：按模块选择版本；测试 T2：精确白名单恢复、`git diff` 双基线比较、lockfile 重建与 frozen install；预期：支付等同 `HEAD^2`、非支付等同 `HEAD^1`、集成例外可解释；实际：从初次合并的 119 个差异中保留 54 个 main 支付文件与 8 个集成边界，将 57 个非支付路径精确恢复到 `HEAD^1`；支付白名单相对 `HEAD^2` 差异为 0，最终相对 ours 的 62 个差异全部属于支付/计划/根配置允许项，意外非支付差异为 0；恢复 ours 后无 `gsap` 引用，已从 manifest 移除，pnpm 11.17.0 重建锁文件后 frozen install 退出 0；遗留/下一步：执行最小 lint、类型、4 文件定向测试和一次 build。
- [x] 阶段 3：最小错误修复与验证；测试 T3：`pnpm.cmd lint`、`pnpm.cmd exec next typegen`、`pnpm.cmd exec tsc --noEmit`、4 个高风险定向 Vitest 文件与一次 `pnpm.cmd build`；预期：全部退出 0且不运行过量测试；实际：lint 输出干净，Next 路由类型生成和 TypeScript 严格检查通过；`lib/payments/verify.test.ts`、payment repository、SOL test service 与 ours settlement 共 4 文件/59 项全部通过；webpack 生产构建编译、类型检查、20 个静态页面和全部 API 路由生成完成，支付路由与 ours `/api/v1/**` 同时存在且无 warning/error；遗留/下一步：未运行全量 Vitest/Playwright，进入提交、远端推送和真实 Devnet Demo。
- [ ] 阶段 4：提交与 GitHub 推送；测试 T4：双亲、远端 ref、ahead/behind 与工作区检查；预期：非强制推送成功且本地/远端一致；实际：待执行；遗留/下一步：待执行。
- [ ] 阶段 5：本地真实 Devnet 支付 Demo 录制；测试 T5：模块核验与链上 finalized 一致，视频元数据可读，临时私钥删除且产物被 Git 忽略；预期：真实最小额 Devnet 支付可回放且不泄露密钥；实际：待执行；遗留/下一步：待执行。
- [ ] MVP 验收：支付取 main、其余取 ours；最小验证通过，GitHub 已同步，本地真实 Devnet 支付 Demo 可播放，所有未验证生产能力如实记录。

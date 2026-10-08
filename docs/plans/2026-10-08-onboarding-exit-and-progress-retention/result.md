# 需求执行记录：免费接入向导支持任意阶段退出与进度保留
计划：docs/plans/2026-10-08-onboarding-exit-and-progress-retention/plan.md

- [x] 阶段 1：创建 Onboarding 领域 Store 与单元测试；交付内容：`stores/use-onboarding-store.ts`, `stores/use-onboarding-store.test.ts`, `vitest.config.mts`；测试 T1：`pnpm vitest run stores/use-onboarding-store.test.ts`；预期：全部单元测试通过；实际：5/5 测试通过，全量 232 项测试通过；遗留/下一步：进入阶段 2，设计与实现退出向导弹窗和页面交互。
- [ ] 阶段 2：实现退出向导交互弹窗与进度恢复交互；交付内容：`app/onboarding/page.tsx` 等；测试 T2：验证任意阶段退出交互及多出口（首页/控制台）；预期：支持任意步骤安全退出并给出已保存反馈；实际：待执行；遗留/下一步：进入阶段 3。
- [ ] 阶段 3：改造 Onboarding 页面全面接入持久化 Store；交付内容：`app/onboarding/page.tsx`；测试 T3：页面持久化验证与进度恢复提示；预期：刷新或离开后恢复步骤与表单数据，支持重新开始与完成激活；实际：待执行；遗留/下一步：进入阶段 4。
- [ ] 阶段 4：质量闸门核验与全套测试回归；交付内容：代码质量检查；测试 T4：`pnpm test` && `pnpm lint` && `pnpm exec next typegen && pnpm exec tsc --noEmit` && `pnpm build`；预期：测试全过、类型无报错、构建成功；实际：待执行；遗留/下一步：最终交付。
- [ ] MVP 验收：验收项（任意阶段退出、离开后保留进度、再次进入恢复、支持重置/重新开始、激活完成闭环）、测试结果、剩余风险。

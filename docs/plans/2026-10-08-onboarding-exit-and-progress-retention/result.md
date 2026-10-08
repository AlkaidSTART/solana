# 需求执行记录：免费接入向导支持任意阶段退出与进度保留
计划：docs/plans/2026-10-08-onboarding-exit-and-progress-retention/plan.md

- [x] 阶段 1：创建 Onboarding 领域 Store 与单元测试；交付内容：`stores/use-onboarding-store.ts`, `stores/use-onboarding-store.test.ts`, `vitest.config.mts`；测试 T1：`pnpm vitest run stores/use-onboarding-store.test.ts`；预期：全部单元测试通过；实际：5/5 测试通过，全量 232 项测试通过；遗留/下一步：进入阶段 2，设计与实现退出向导弹窗和页面交互。
- [x] 阶段 2：实现退出向导交互弹窗与进度恢复交互；交付内容：`app/onboarding/page.tsx`, `components/ui/modal.tsx`；测试 T2：验证任意阶段退出交互及多出口（首页/控制台）；预期：支持任意步骤安全退出并给出已保存反馈；实际：顶部增加“退出向导”与“自动保存提示”，底部增加“暂存进度并退出”，退出弹窗支持返回首页或控制台，全部正常运作；遗留/下一步：进入阶段 3。
- [x] 阶段 3：改造 Onboarding 页面全面接入持久化 Store；交付内容：`app/onboarding/page.tsx`, `app/console/page.tsx`；测试 T3：页面持久化验证与进度恢复提示；预期：刷新或离开后恢复步骤与表单数据，支持重新开始与完成激活；实际：9 项场景单元测试全部通过，控制台概览增加未完成向导继续入口；遗留/下一步：进入阶段 4 质量闸门核验。
- [x] 阶段 4：质量闸门核验与全套测试回归；交付内容：代码质量检查；测试 T4：`pnpm test` && `pnpm lint` && `pnpm exec next typegen && pnpm exec tsc --noEmit` && `pnpm build`；预期：测试全过、类型无报错、构建成功；实际：全套 21 个测试套件 236 项测试 100% 通过，ESLint 0 错误 0 告警，Next.js typegen 与 tsc --noEmit 0 错误，Next.js 16.3.8 生产构建全量通过（含 20/20 静态页面预渲染）；遗留/下一步：需求验收完成。
- [x] MVP 验收：
  1. 任意阶段退出：第 1~6 步任意阶段均支持通过顶部导航或底部操作条点击“退出向导 / 暂存退出”，弹出清晰确认框，并可自主选择“返回官网首页”或“前往商户控制台”；
  2. 进度自动保留：基于 `useOnboardingStore` (Zustand + `localStorage` 持久化)，表单输入与步骤变更即时持久化，误触离开、刷新或浏览器关闭零数据丢失；
  3. 再次进入无缝恢复：重新进入免费接入页面自动恢复上次步骤与全部填写数据，并在向导顶端显示“已恢复上次填写的接入进度”横幅；
  4. 支持从头重置：提供“从头开始”按钮，二次确认后可一键清空草稿并重置向导；
  5. 试用激活与完成闭环：第 6 步成功激活派发 100 试用 Credits 后标记为已完成，并在控制台概览提供进行中草稿续填指引；
  6. 剩余风险：无。客户端 Store 采用 `useSyncExternalStore` 与 hydration 守卫，无 SSR 水合冲突。

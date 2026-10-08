# 需求执行记录：前端隐藏版本号与深度多语言联动
计划：docs/plans/2026-10-08-hide-versions-and-deep-i18n/plan.md

- [x] 阶段 1：全局清理与隐藏前端 UI 中所有版本号（`app/page.tsx`、`components/landing/telemetry-sandbox.tsx`、`app/console/workflows/page.tsx`）；测试 T1：grep 检查前端 UI 中的 `v[0-9].[0-9]` 与“版本”；预期：无遗漏版本号；实际：Landing 导航、遥测沙箱、工作流卡片及抽屉中所有版本号已彻底移除，验证通过；遗留/下一步：进入阶段 2。
- [x] 阶段 2：扩充 `lib/i18n/index.ts` 字典与自动化测试验证（`lib/i18n/index.ts`、`lib/i18n/i18n.test.ts`）；测试 T2：运行 `pnpm exec vitest run lib/i18n/i18n.test.ts`；预期：8 种语言字典覆盖率 100% 通过；实际：7 个测试全部通过，所有新增键在 8 种语言中 100% 映射；遗留/下一步：进入阶段 3。
- [x] 阶段 3：深度改造控制台各核心页面接入多语言（`app/console/layout.tsx`、`app/console/knowledge/page.tsx`、`app/console/inbox/page.tsx`、`app/console/workflows/page.tsx`、`app/console/stores/page.tsx`、`app/console/settings/page.tsx`、`app/console/page.tsx`）；测试 T3：页面组件渲染与语言切换联动检查；预期：切换语言时核心文案深度联动；实际：知识库 8 国语言对照、收件箱客服接管与画像、工作流规则列表与抽屉、店铺直连授权/WABA/获批模板抽屉、设置归因/RBAC矩阵/数据导出与被遗忘权、监控总览调试与 20% 对照组均已深度接入 `locale` 与 `getI18nText`，验证通过；遗留/下一步：进入阶段 4。
- [x] 阶段 4：质量闸门与最终验收（TypeScript、Lint、Vitest、Build 全量检查）；测试 T4：运行 `pnpm exec vitest run && pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm lint && pnpm build`；预期：全量通过；实际：Vitest（21 个文件，236/236 全部通过）、TypeScript（0 错误）、ESLint（0 警告）、Next.js Build（全部 20 个页面生成成功，无构建错误）；遗留/下一步：完成交付。
- [x] MVP 验收：
  - 1. 全局版本号清理：Landing 导航、遥测沙箱、工作流规则列表及抽屉中所有版本号字符（`v1.1`, `v2.4`, `v1.2` 等）均已清理完毕，UI 不再显示任何软件版本号。
  - 2. 多语言字典完备性：支持全部 8 种语言（中文、美式英语、新加坡英语、印尼语、马来语、泰语、越南语、菲律宾语），字典键覆盖率 100%，单元测试通过。
  - 3. 核心页面深度联动：控制台所有核心业务页面全面绑定全局 `locale`，界面语言切换时所有标题、字段、徽章、抽屉与操作按钮均实时响应联动。
  - 4. 质量闸门：全量自动化测试、静态类型检查、代码规范检查与打包编译全部无阻塞通过。剩余风险：无。


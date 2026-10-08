# SolaFlow AI 前端隐藏版本号与深度多语言联动计划

## 1. 背景与目标
用户反馈：
1. **整个前端 UI 不显示版本号**：包括 Landing 头部、遥测沙箱、控制台工作流列表及抽屉等处出现的各类版本号（如 `Devnet v1.1`、`NLP Parser v2.4`、`确定性规则引擎 · v1.2`、工作流卡片与抽屉中的版本标签等），需要一律移除或隐藏展示，保持 UI 界面整洁干净。
2. **深度适配多语言的切换**：当前控制台多个核心页面（特别是多语言知识库 `app/console/knowledge/page.tsx` 完全未接入 `locale`，会话收件箱、店铺通道、工作流配置、全局设置、总览指标细节等仍有大量硬编码中文/英文）在切换界面语言时没有联动更新。
本需求目标是在整个前端彻底清理版本号展示，并深度完善 `lib/i18n/` 字典体系，全面重构控制台核心页面与组件，实现 8 种语言（中文、美国英语、新加坡英语/Singlish、印尼语、马来语、泰语、越南语、菲律宾语）在界面切换时的全深度无缝响应。

## 2. MVP 范围
1. **前端 UI 版本号全量隐藏与清理**：
   - Landing 导航栏：`Devnet v1.1 · Meta BAA` -> `Devnet · Meta BAA`
   - Landing 遥测沙箱：`NLP Parser v2.4` -> `NLP Parser`，`确定性规则引擎 · v1.2` -> `确定性规则引擎`
   - Workflows 页面：移除规则卡片上的版本号徽章展示；抽屉内副标题移除当前版本号；版本回退模块重构为“规则配置历史 (Rule History)”并移除具体版本号字符串。
2. **多语言字典体系大幅扩充 (`lib/i18n/index.ts`)**：
   - 扩展 `UiTranslations`，补齐知识库（问答分类、八国语言对照标签、编辑操作、冲突提示）、收件箱（买家画像、俚语词库、快捷短语、翻译状态、客服坐席标签）、店铺与通道（电商直连、WABA 质量、连通性 Ping、模板插槽映射）、工作流（触发延时、静默时段、安全上限、矩阵表头）、设置（对照组参数、时区货币、RBAC 矩阵、合规导出）、总览（对照组实验数据对比、状态机调试选项）等全部所需文本。
   - 为全部 8 个支持的地区语言（`zh_CN`, `en_US`, `en_SG`, `id_ID`, `ms_MY`, `th_TH`, `vi_VN`, `fil_PH`）提供完整、地道的高质量翻译。
3. **控制台页面深度适配多语言联动**：
   - `app/console/knowledge/page.tsx`：全面接入 `useAppStore` 的 `locale` 与 `getI18nText`，彻底解决未接入多语言问题。
   - `app/console/inbox/page.tsx`：买家画像、印尼俚语词典说明、输入框实时翻译开关与提示、会话状态标签全量国际化。
   - `app/console/workflows/page.tsx`：表头、参数卡片、矩阵表、抽屉配置全量国际化。
   - `app/console/stores/page.tsx`：直连卡片、WABA 认证状态、连通性探测、模板抽屉与动态插槽全量国际化。
   - `app/console/settings/page.tsx`：对照组下拉选项、置信度、RBAC 团队矩阵权限状态、合规导出全量国际化。
   - `app/console/page.tsx`：总览指标副文案、20% 对照组双卡片分析图表文案、调试状态标签全量国际化。
   - `app/console/layout.tsx`：侧栏底部租户与环境元信息国际化联动。
4. **测试与质量守护**：
   - 补充 `lib/i18n/i18n.test.ts` 测试用例，确保 8 个语言的所有字典键 100% 具备非空字符串定义。
   - 运行 `vitest`、`tsc --noEmit`、`pnpm lint` 和 `pnpm build`。

## 3. 非目标 (Out of Scope)
- 不改动后端 API 内部协议（如 `WorkflowVersion` 数据库模型或接口字段保持兼容）。
- 不破坏现有订单、支付、工作流状态机的业务逻辑。
- 不引入重型外部运行时 i18n 框架，延续轻量级类型安全字典与 Zustand 响应式架构。

## 4. 风险与依赖
- **风险**：新增翻译键较多，若有遗漏会导致 TypeScript 编译报错或运行时返回 fallback。
  *应对策略*：利用 TypeScript `UiTranslations` 严格接口强校验，并在 `i18n.test.ts` 中遍历测试全部 8 种语言的完整键覆盖。
- **UI 布局风险**：泰语、越南语等较长字符可能在卡片或按钮产生折行。
  *应对策略*：保持 Flex 弹性布局与自适应高度，避免写死宽度导致溢出截断。

## 5. 阶段拆分
- **阶段 1：全局清理与隐藏前端 UI 中所有版本号**
  - 修改 `app/page.tsx`、`components/landing/telemetry-sandbox.tsx`、`app/console/workflows/page.tsx` 等。
  - 验证页面无任何版本号字符呈现。
- **阶段 2：扩充 `lib/i18n/index.ts` 字典与自动化测试验证**
  - 在 `UiTranslations` 接口中定义各页面所需文本键。
  - 编写 8 种语言字典映射，更新 `lib/i18n/i18n.test.ts` 并通过 Vitest 测试。
- **阶段 3：深度改造控制台各核心页面接入多语言**
  - 改造 `app/console/knowledge/page.tsx`（彻底接入 `locale`）。
  - 改造 `app/console/inbox/page.tsx`。
  - 改造 `app/console/workflows/page.tsx`。
  - 改造 `app/console/stores/page.tsx`。
  - 改造 `app/console/settings/page.tsx`。
  - 改造 `app/console/page.tsx` 与 `app/console/layout.tsx`。
- **阶段 4：质量闸门与最终验收**
  - 运行 `pnpm exec vitest run`。
  - 运行 `pnpm exec next typegen && pnpm exec tsc --noEmit`。
  - 运行 `pnpm lint` 与 `pnpm build`。
  - 编写 `result.md`，执行 MVP 验收。

## 6. 最终验收标准
1. 前端 UI（Landing、工作流、总览等）不再出现版本号。
2. 控制台顶部切换 8 种语言时，知识库、收件箱、工作流、店铺、设置、总览等页面文字均完整联动切换。
3. 知识库页面由完全硬编码重构为完整接入 `locale` 响应式联动。
4. `pnpm exec vitest run` 全部通过，无缺失字典键。
5. `pnpm exec tsc --noEmit`、`pnpm lint`、`pnpm build` 均成功通过。

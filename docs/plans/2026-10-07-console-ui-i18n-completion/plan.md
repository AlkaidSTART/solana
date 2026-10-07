# SolaFlow AI 控制台界面多语言 (i18n) 完整补全计划

## 1. 背景与目标
在先前的阶段中，系统已在 `lib/i18n/` 中建立了覆盖新加坡（`en_SG`）、马来西亚（`ms_MY`）、印尼（`id_ID`）、泰国（`th_TH`）、越南（`vi_VN`）、菲律宾（`fil_PH`）、国际英语（`en_US`）和中文（`zh_CN`）的 8 国市场配置与基础词库。
然而，当前商户控制台（Console）各子页面（包括监控总览、订单中心、工作流引擎、报表与设置、店铺通道、会话收件箱等）的主体内容仍多为硬编码中文文本，切换语言后页面内核心文案（表头、状态标签、操作按钮、空态与报错说明）未完全实现多语言联动。

本需求目标：
- 扩充 `lib/i18n/` 中的 UI 字典体系，全面覆盖商户控制台核心视图的文案。
- 完整提供全部 8 种支持语言（含新加坡 Singlish 与东南亚 6 种官方语言）的对应高质量界面翻译。
- 重构并接入控制台关键页面（`app/console/page.tsx`、`app/console/orders/page.tsx`、`app/console/workflows/page.tsx`、`app/console/settings/page.tsx`、`app/console/inbox/page.tsx`、`app/console/stores/page.tsx` 等），实现随顶部栏语言切换实时更新。
- 补充与强化 `lib/i18n/i18n.test.ts` 自动化测试，确保字典无遗漏、类型安全无断层。

## 2. MVP 范围
1. **多语言字典扩充 (`lib/i18n/index.ts`)**：
   - 扩展 `UiTranslations`，新增通用动作（保存、重置、搜索、筛选、导出、刷新）、状态提示（正常、加载中、空数据、异常报错）、总览指标与卡片文案、订单中心（表头、状态标签、抽屉操作、COD 审核）、工作流（触发条件、静默时段、国家矩阵）、设置页（对照组模型、时区、货币、合规说明）等关键文本键。
   - 为全部 8 种语言（`zh_CN`, `en_US`, `en_SG`, `id_ID`, `ms_MY`, `th_TH`, `vi_VN`, `fil_PH`）提供完整字典映射。
2. **监控总览国际化 (`app/console/page.tsx`)**：
   - 接入当前 `locale`，翻译指标卡片、人工接管告警、待核验订单、空状态与异常恢复按钮等。
3. **订单中心国际化 (`app/console/orders/page.tsx`)**：
   - 表头（订单号、买家、渠道、金额、状态、操作）、筛选标签、状态徽章（已挽回、COD已核验、待核验/待付、高危拦截、已取消）、详情抽屉（地址核验、重发消息、核验通过/拒绝按钮）。
4. **工作流与设置页面国际化 (`app/console/workflows/page.tsx` & `app/console/settings/page.tsx`)**：
   - 规则标题、开关状态、执行动作描述、静默时段与频次说明；对照组分流开关、统计分析窗口、保存全局配置按钮与反馈信息。
5. **店铺与会话收件箱国际化 (`app/console/stores/page.tsx` & `app/console/inbox/page.tsx`)**：
   - 接入通用字典与状态标签。
6. **自动化回归与测试保障 (`lib/i18n/i18n.test.ts`)**：
   - 断言全量 UI 字典键在 8 种语言中 100% 具备非空字符串定义。
   - 验证多语言切换时的 fallback 机制及特定市场文案正确性。

## 3. 非目标 (Out of Scope)
- 不改动已落地的 Solana Devnet 支付协议与数据库流水模型。
- 不引入外部庞大的重量级运行时 i18n 依赖（如 react-intl / next-intl 服务端中间件改造），保持轻量级类型安全字典与 Zustand 响应式架构。
- 不影响现有的 108 个自动化测试。

## 4. 风险与依赖
- **依赖**：Zustand `useAppStore` 中的 `locale` 响应式流转。
- **风险**：翻译字典字段数量较多，若有缺失可能导致界面显示 fallback 或类型报错。
  *应对策略*：在 TypeScript 编译层使用严格 `UiTranslations` 接口约束，并通过 `i18n.test.ts` 遍历所有 8 种语言检查键完整性。
- **UI 排版风险**：不同语言文本长度不同（如泰语、越南语、菲律宾语较长），可能引起布局折行或溢出。
  *应对策略*：按钮与表格采用弹性布局，限制文字换行与最小宽度，确保在 375px/768px/1440px 视口下均正常呈现。

## 5. 阶段拆分
- **阶段 1：多语言字典体系扩展与单元测试完善 (`lib/i18n/index.ts` & `lib/i18n/i18n.test.ts`)**
  - 定义新增的 UI 字典键名并提供 8 种语言的全部翻译。
  - 扩展单元测试覆盖所有新增键，运行 `vitest`。
- **阶段 2：监控总览与订单中心页面多语言适配 (`app/console/page.tsx` & `app/console/orders/page.tsx`)**
  - 引入 `useAppStore` 的 `locale`，使用 `getI18nText` 替换硬编码中文。
  - 验证空态、加载态、表格与抽屉的多语言渲染。
- **阶段 3：工作流、设置、店铺与收件箱页面多语言适配 (`app/console/workflows/page.tsx`, `settings`, `stores`, `inbox`)**
  - 适配规则矩阵、设置保存、通道连接与人工接管队列文案。
- **阶段 4：全量验证与构建交付闸门**
  - 执行 `vitest`、`tsc --noEmit`、`pnpm lint`、`pnpm build`。
  - 编写与维护 `result.md`，执行 MVP 验收。

## 6. 最终验收标准
1. `UI_TRANSLATIONS` 覆盖全部控制台核心页面，且 8 种语言（中文、美国英语、新加坡英语/Singlish、印尼语、马来语、泰语、越南语、菲律宾语）均有完整译文。
2. 控制台顶部栏切换任意语言时，总览、订单、工作流、设置等界面的标题、操作按钮、状态标签均同步变为对应语言。
3. `pnpm exec vitest run` 全量通过（无失败）。
4. `pnpm exec tsc --noEmit` 和 `pnpm lint` 零错误零警告。
5. `pnpm build` 构建成功。

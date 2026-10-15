# 实施计划：全站多页面与组件 i18n 国际化全面补齐

## 1. 背景与目标
当前 SolaFlow AI 虽在 `lib/i18n/index.ts` 中规划了 8 种东南亚核心市场语言（`zh_CN`、`en_US`、`en_SG`、`id_ID`、`ms_MY`、`th_TH`、`vi_VN`、`fil_PH`），但在各页面与组件中存在大面积未跟随 i18n 切换的问题：
1. **官网出海落地页 (`app/page.tsx`)**：使用孤立的本地状态 `useState<LandingLang>("ZH")`，未与全局 `useAppStore().locale` 联动；且仅翻译了 Hero 标语，导航、数据格、交互演练台、五大核心能力、ROI 计算器、传送门及页脚全部硬编码中文。
2. **认证登录与注册 (`app/login`, `app/register`, `components/auth/*`)**：语言选择器仅硬编码展示 3 种语言；逻辑中采用 `isEn = locale === 'en_US'` 和 `isId = locale === 'id_ID'` 二值推导，当切换至 `en_SG`、`ms_MY`、`th_TH`、`vi_VN`、`fil_PH` 时全部失效并回退为中文。
3. **初始化接入向导 (`app/onboarding/page.tsx`)**：6 步向导流程（平台授权、WABA 绑定、规则配置、仿真演练、额度激活）及草稿暂存弹窗全量硬编码中文，未接入 i18n。
4. **财务与 Devnet 支付结算 (`components/billing/*`, `app/console/billing/*`)**：`BillingPayments`、`SolanaPayModal` 与 `SolTestPanel` 账单、报价、状态、二维码及钱包操作提示全量硬编码中文。
5. **商户控制台与通用资产组件 (`app/console/*`, `user-assets-banner.tsx`, `user-nav-dropdown.tsx`)**：存在残留硬编码（如钱包连接/断开、系统能力卡片状态、订单抽屉备注、冲突提示等）。

**目标**：彻底补全 `lib/i18n` 字典与各页面组件的国际化接入，使得全站（Landing、Auth、Onboarding、Console 各功能页、Billing、用户资产组件）在切换至 8 种任意语言时，所有可见界面文本均精准跟随切换。

---

## 2. MVP 范围与非目标

### MVP 范围
- 扩展 `lib/i18n/index.ts` 的 `UiTranslations` 契约与字典数据，覆盖落地页、认证、向导、财务及控制台残留文本，确保 8 种语言 100% 对齐。
- 重构 `app/page.tsx` 与相关组件，使其与 `useAppStore` 统一 `locale`，实现 8 种语言双向响应与完整文案国际化。
- 改造 `app/login/page.tsx`、`app/register/page.tsx` 及 `components/auth/*`，下拉支持全部 8 种语言，移除简单的 `isEn/isId` 二值逻辑，全面采用 `getI18nText` 或 8 语言映射字典。
- 改造 `app/onboarding/page.tsx`，6 步向导标题、说明、表单标签、操作按钮、提示及弹窗接入 `getI18nText`。
- 改造 `components/billing/*`（`BillingPayments`、`SolanaPayModal`、`SolTestPanel`），账单报价、订单状态、操作按钮接入国际化。
- 梳理并替换 `app/console/*` 及用户资产组件残留硬编码字符串。
- 扩充单元测试 `lib/i18n/i18n.test.ts`，并通过 lint、typecheck 及 build。

### 非目标
- 不引入第三方复杂 i18n 依赖（如 react-i18next/next-intl），保持轻量级纯 TypeScript 类型驱动设计。
- 不变更 Solana Pay 智能合约逻辑、账单数据库校验模型与 Webhook 签名协议。
- 不改变业务逻辑行为，仅进行视觉文本与语言切换绑定。

---

## 3. 风险与依赖
- **键完整性风险**：`UiTranslations` 增补键必须在全部 8 个语言字典中完整提供，否则 TypeScript 编译或运行时会报错。
- **状态同步风险**：Landing 页面之前使用内部状态，切换至 `useAppStore` 后需确保在客户端与服务端渲染生命周期平稳挂载，避免 hydration 警告。
- **现有测试保护**：`lib/i18n/i18n.test.ts` 与现有 32 个测试套件需全部保持绿色通过。

---

## 4. 阶段拆分与验证步骤

### 阶段 1：增补 i18n 字典契约与多语言文本
- **目标**：在 `lib/i18n/index.ts` 中新增 Landing、Auth、Onboarding、Billing 及 Console 缺少的翻译字段，并在 8 种语言中完整落地。
- **修改文件**：`lib/i18n/index.ts`、`lib/i18n/i18n.test.ts`。
- **测试步骤**：
  1. 执行 node 脚本校验全部 8 种语言键集合严格一致，无缺少键。
  2. 运行 `pnpm test` 验证 `lib/i18n/i18n.test.ts`。
- **预期结果**：8 种语言字典均包含新键，测试全部通过。

### 阶段 2：官网出海落地页 (`app/page.tsx`) 国际化重构
- **目标**：将 `app/page.tsx` 的语言切换与 `useAppStore().locale` 统一，打通 8 种语言切换；全量国际化 Topbar、Hero、Metrics、业务演练台、核心能力、ROI 计算器、传送门及 Footer。
- **修改文件**：`app/page.tsx` 及 `components/landing/*`（如需补充）。
- **测试步骤**：
  1. 检查落地页大屏药丸组和下拉切换器在切换 8 种语言时全局状态同步。
  2. 检查各项文案随语言变化。
- **预期结果**：落地页无硬编码中文，8 种语言精准响应。

### 阶段 3：登录与注册认证中心国际化完善
- **目标**：支持全部 8 种语言下拉选择，移除 `isEn/isId` 二值写死，`components/auth/auth-card.tsx`、`oauth-buttons.tsx`、`auth-showcase.tsx`、`app/login/page.tsx`、`app/register/page.tsx` 文本全语种支持。
- **修改文件**：`app/login/page.tsx`、`app/register/page.tsx`、`components/auth/*`。
- **测试步骤**：
  1. 切换至 `th_TH`、`vi_VN`、`ms_MY` 等非 EN/ID 语言，检查认证表单是否展示对应语言而非中文。
  2. 运行 `components/auth` 相关单元测试。
- **预期结果**：认证页面所有文案在 8 种语言下均正常切换。

### 阶段 4：初始化接入向导 (`app/onboarding/page.tsx`) 全面国际化
- **目标**：6 步向导流程所有文字（步骤名、输入框提示、WABA 授权指南、模板测试、额度激活、暂存与重置弹窗）接入 `getI18nText`。
- **修改文件**：`app/onboarding/page.tsx`。
- **测试步骤**：
  1. 在各种语言下进入向导，逐步点击下一步，验证每步文本与操作按钮。
- **预期结果**：向导无任何残留死文本，8 种语言一致。

### 阶段 5：财务充值与 Devnet 结算模块国际化
- **目标**：重构 `components/billing/billing-payments.tsx`、`components/billing/solana-pay-modal.tsx`、`components/billing/sol-test-panel.tsx`，接入 `useAppStore().locale` 与 `getI18nText`。
- **修改文件**：`components/billing/*`。
- **测试步骤**：
  1. 切换语言访问 `/console/billing`，验证标题、说明、账单状态、购买表单。
  2. 打开 Solana Pay 模态框，验证弹窗标题、取消按钮与状态标签。
- **预期结果**：财务中心及支付模态框文案根据当前语言准确渲染。

### 阶段 6：商户控制台与用户资产组件残留硬编码清理
- **目标**：梳理 `app/console/*` 各页面及 `user-assets-banner.tsx`、`user-nav-dropdown.tsx` 中残留硬编码文本。
- **修改文件**：`components/console/*`、`app/console/*`。
- **测试步骤**：
  1. 遍历控制台全部 8 个子模块（监控、店铺、工作流、订单、收件箱、知识库、账单、设置）。
  2. 验证用户资产下拉及资产 Banner 在连接/断开钱包、复制地址、额度展示处的文案。
- **预期结果**：控制台全流程无硬编码中文泄漏。

### 阶段 7：代码质量与交付门禁验收
- **执行命令**：
  1. `pnpm lint`
  2. `pnpm exec next typegen && pnpm exec tsc --noEmit`
  3. `pnpm test`
  4. `pnpm build`
- **预期结果**：0 lint error, 0 type error, 100% tests pass, build 成功。

---

## 5. 最终验收标准
1. [ ] 8 种语言（中文、国际英语、新加坡英语、印尼语、马来语、泰语、越南语、菲律宾语）均可正常切换并持久生效。
2. [ ] 官网出海首页 (`/`) 完整实现 8 语言切换，无任何硬编码中文泄漏。
3. [ ] 登录 (`/login`) 与注册 (`/register`) 支持全部 8 语言下拉与完整界面翻译。
4. [ ] 初始化向导 (`/onboarding`) 6 步流程及弹窗全量跟随 i18n。
5. [ ] 财务与支付中心 (`/console/billing`, `/console/billing/sol-test`) 全量跟随 i18n。
6. [ ] 控制台所有页面（概览、店铺、工作流、订单、会话、知识库、设置）及通用组件（顶部栏、用户资产、下拉菜单）全部跟随 i18n。
7. [ ] 代码门禁：`pnpm lint`、`tsc --noEmit`、`pnpm test`、`pnpm build` 全部通过。

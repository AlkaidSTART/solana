# 计划：解耦前端剩余 6 处 Mock 数据源至 mock/ 统一目录

## 背景与目标
- 前期已完成 `stores/use-app-store.ts` 与部分页面（inbox 俚语、knowledge 翻译、page 归因指标、3D 地球与沙盒等）的数据解耦。
- 全局排查发现，前端仍有 6 处内联/硬编码的 Mock 数据源未解耦：
  1. `stores/use-onboarding-store.ts`：`DEFAULT_ONBOARDING_DRAFT` 默认入驻草稿内嵌在 Store 中。
  2. `app/console/stores/page.tsx`：已连接电商店铺卡片、WABA 商业账号信息、连接测试与表单预设硬编码在 JSX。
  3. `app/console/workflows/page.tsx`：东南亚 6 国多语言分流路由矩阵表硬编码在 JSX。
  4. `app/console/inbox/page.tsx`：客服快捷回复短语数组与买家订单降级文本硬编码在组件内。
  5. `app/login/page.tsx`：商户免密登录演示邮箱与 6 位动态验证码预设写死在组件。
  6. `app/console/page.tsx`：概览核心统计卡片（待确认数、净挽回 GMV 等）部分写死在 JSX。
- 目标：将上述 6 处 Mock 数据完全收敛至 `mock/` 统一目录，保持前端表现层与数据模拟层彻底解耦，组件与页面仅作为纯渲染视图层。

## MVP 范围
1. **新建与扩充 `mock/` 模块**：
   - 新建 `mock/onboarding.ts`：定义并导出 `DEFAULT_ONBOARDING_DRAFT` 与其数据接口契约。
   - 新建 `mock/auth.ts`：定义并导出 `MOCK_DEMO_LOGIN_CREDENTIALS`。
   - 扩充 `mock/stores.ts`：导出 `MOCK_STORE_RUNTIMES`、`MOCK_WABA_ACCOUNT_INFO`、`MOCK_STORE_FORM_PRESETS`。
   - 扩充 `mock/workflows.ts`：导出东南亚 6 国分流矩阵 `MOCK_ROUTING_MATRIX`。
   - 扩充 `mock/conversations.ts`：导出 `MOCK_QUICK_REPLIES` 与 `MOCK_DEMO_BUYER_ORDER`。
   - 扩充 `mock/analytics.ts`：导出 `MOCK_OVERVIEW_SUMMARY_STATS`。
   - 更新 `mock/index.ts` 集中导出。
2. **重构前端状态与页面引用**：
   - 重构 `stores/use-onboarding-store.ts` 从 `@/mock` 引入默认草稿。
   - 重构 `app/console/stores/page.tsx` 动态循环渲染店铺卡片与 WABA 配置。
   - 重构 `app/console/workflows/page.tsx` 动态循环渲染路由矩阵。
   - 重构 `app/console/inbox/page.tsx` 引用快捷短语与买家关联订单降级。
   - 重构 `app/login/page.tsx` 引用演示商户登录预设。
   - 重构 `app/console/page.tsx` 引用概览核心统计指标。
3. **补充单元测试并全量验收**：
   - 扩充 `mock/mock.test.ts` 与相关 Store 测试，验证所有新导出的 Mock 数据结构契约。

## 非目标
- 不改动任何现有页面布局、视觉样式、UI 交互流程或业务逻辑。
- 不修改真实后端 API 路由。

## 风险与依赖
- 类型一致性：确保 `mock/` 导出的类型与 Zustand Store、组件 Props 严格对齐，不降级 TypeScript `strict: true`。

## 阶段拆分
- **阶段 1：扩展 `mock/` 模块与数据定义**
  - 新增 `mock/onboarding.ts`、`mock/auth.ts`。
  - 扩充 `mock/stores.ts`、`mock/workflows.ts`、`mock/conversations.ts`、`mock/analytics.ts`。
  - 更新 `mock/index.ts`。
- **阶段 2：重构 Store 与页面组件引用**
  - 重构 `stores/use-onboarding-store.ts`。
  - 重构 `app/console/stores/page.tsx`、`app/console/workflows/page.tsx`、`app/console/inbox/page.tsx`、`app/login/page.tsx`、`app/console/page.tsx`。
- **阶段 3：自动化测试与质量闸门验收**
  - 扩充 `mock/mock.test.ts`。
  - 运行 `pnpm test:unit`、`pnpm lint` 与 `tsc --noEmit`。
  - 记录 `result.md` 完成 MVP 闭环。

## 各阶段测试步骤、输入及预期
- **阶段 1 测试**：
  - 检查 `mock/index.ts` 导出符号，确认无类型报错。
- **阶段 2 测试**：
  - 检查 6 处文件修改，确认所有内联硬编码数组/对象完全移除，全部通过 `@/mock` 引入。
- **阶段 3 测试**：
  - 运行 `pnpm test:unit`，预期全部测试用例 100% 通过。
  - 运行 `pnpm exec tsc --noEmit`，预期 0 类型错误。

## 最终验收标准
1. 全局 6 处未解耦 Mock 数据源 100% 收敛至 `mock/` 目录。
2. 前端组件与 Store 中 0 散落长列表或演示业务实体硬编码。
3. 单元测试完整覆盖新增 Mock 契约，测试全绿。

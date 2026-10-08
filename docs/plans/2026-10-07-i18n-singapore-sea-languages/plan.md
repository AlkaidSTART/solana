# SolaFlow AI 新加坡及东南亚多语言 (i18n) 增强计划

## 1. 背景与目标
SolaFlow AI 面向东南亚跨境电商的 WhatsApp 多语言订单助手。当前系统基础已具备印尼语（`id_ID`）、泰语（`th_TH`）、国际英语（`en_US`）和中文（`zh_CN`），但缺少东南亚核心市场尤其是新加坡（Singapore English / Singlish `en_SG`）、马来西亚（`ms_MY`）、越南（`vi_VN`）以及菲律宾（`fil_PH`）的完整多语言架构与业务支持。
本需求目标：
- 建立统一且类型安全的东南亚多语言与市场配置中心（`lib/i18n/`）。
- 扩展出海官网（Landing Page）支持新加坡与东南亚多语言切换及 Singlish / SEA 场景沙盒体验。
- 升级全局状态（`useAppStore`）及商户工作台（Console），覆盖东南亚国家区号路由矩阵、多语言 WhatsApp 官方模板、知识库多语言与跨国店铺数据。
- 建立自动化测试套件，确保翻译键完整性、区号映射准确与类型安全性。

## 2. MVP 范围
1. **多语言配置体系 (`lib/i18n/`)**：
   - 定义 8 种语言/地区：`zh_CN`、`en_US`、`en_SG`（新加坡英语/Singlish）、`id_ID`（印尼语）、`ms_MY`（马来语）、`th_TH`（泰语）、`vi_VN`（越南语）、`fil_PH`（菲律宾语 Tagalog）。
   - 维护国家代码、区号（+65, +62, +60, +66, +84, +63）、官方时区（SGT, WIB, MYT, ICT, PHT）、结算币种（SGD, IDR, MYR, THB, VND, PHP, USD）及本土俚语特征。
   - 提取全局 UI 翻译字典与翻译函数 `getI18nText(locale, key)`。
2. **全局状态与领域模型 (`stores/use-app-store.ts`)**：
   - 扩展 `locale`、`OrderItem.language`、`Conversation.language`、`KnowledgeItem` 类型。
   - 补充新加坡、马来西亚、越南、菲律宾的模拟店铺、订单与多语言会话数据。
3. **出海官网体验 (`app/page.tsx` & Landing 组件)**：
   - 顶部导航栏语言切换胶囊支持切换 SEA 语言。
   - Hero 多语言标语扩充新加坡、马来西亚、泰国、越南、菲律宾文案。
   - 遥测沙盒（`TelemetrySandbox`）新增新加坡 Singlish 催付/咨询、马来西亚 COD 确认、越南物流核查、菲律宾地标核验等真实东南亚对话与俚语词库（Slang Lexicon）。
4. **商户控制台工作台 (`app/console/`)**：
   - Topbar 全局语言下拉框支持所有 8 种语言并联动界面标签。
   - 工作流页面（`workflows`）升级东南亚国家区号路由矩阵（SG, MY, VN, PH, TH, ID）。
   - 店铺与通道页面（`stores`）新增新加坡及东南亚已批准官方 WhatsApp 模板。
   - 知识库页面（`knowledge`）支持新加坡与东南亚多语言对照与 AI 翻译填充。
5. **自动化测试**：
   - 编写 `lib/i18n/i18n.test.ts`，验证所有语言字典完整性、时区区号映射、fallback 策略。
   - 执行 `vitest`、`tsc --noEmit`、`eslint` 交付闸门校验。

## 3. 非目标 (Out of Scope)
- 不接入需付费的第三方实时机器翻译服务（如 Google Cloud Translation API），采用确定性字典与本地 AI 模板模拟。
- 不修改底层 Solana 合约与账本结算逻辑（账本仍基于 USDC 最小单位与标准协议）。
- 不破坏现有通过的 85 项 Vitest 测试。

## 4. 风险与依赖
- **依赖**：Zustand 共享状态、Lucide 图标、Tailwind CSS 4 样式令牌。
- **风险**：语言列表增加可能导致顶部栏或卡片在小屏幕（375px）发生文本溢出或断行。
  *应对策略*：下拉选择器和网格布局做好响应式适配，小屏下展示紧凑代码（如 SG、ID、TH），大屏展示完整名称。

## 5. 阶段拆分
- **阶段 1：多语言架构基础设施与单元测试 (`lib/i18n/`)**
  - 创建 `lib/i18n/index.ts`，定义语言枚举、市场元数据、俚语词库与多语言字典。
  - 创建 `lib/i18n/i18n.test.ts`，编写健全的断言测试。
- **阶段 2：全局 Store 与数据模型扩展 (`stores/use-app-store.ts`)**
  - 扩展 `locale` 与业务语言类型。
  - 增加新加坡、马来西亚、越南等东南亚店铺、订单与对话 Mock 数据。
- **阶段 3：出海官网与沙盒组件本土化升级 (`app/page.tsx` & `components/landing/`)**
  - 官网顶部切换器升级。
  - Hero 多语言标题升级。
  - 沙盒新增新加坡 Singlish 场景及东南亚代表性场景。
- **阶段 4：商户控制台页面全面适配 (`app/console/*`)**
  - Topbar 语言切换器与导航国际化。
  - 工作流路由矩阵、店铺模板、知识库等更新。
- **阶段 5：验证与交付检查**
  - 运行 `vitest`、`tsc --noEmit`、`eslint`、`pnpm build`。
  - 检查多视口与排版一致性。

## 6. 最终验收标准
1. 支持新加坡英语/Singlish (`en_SG`) 及东南亚语言 (`ms_MY`, `th_TH`, `vi_VN`, `fil_PH`, `id_ID`, `en_US`, `zh_CN`)。
2. 官网与控制台均可自由切换语言，文案和状态指示正常更新无报错。
3. 工作流国家矩阵展示新加坡 +65 及各东南亚国家。
4. 所有新增及既有 Vitest 测试全部通过（无跳过、无失败）。
5. TypeScript 类型检查与 ESLint 0 警告 0 错误。

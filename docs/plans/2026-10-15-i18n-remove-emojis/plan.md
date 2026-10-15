# 计划：i18n 语言与市场切换全面去 Emoji 化（采用方案一：统一矢量图标 + 母语自称）

## 背景与目标
根据用户决策，系统国际化（i18n）切换部分全面采用【方案一：统一矢量图标 + 母语自称（Native Endonym）】：
1. 彻底移除界面中的所有原生国旗/符号 Emoji（如 🇨🇳, 🌐, 🇸🇬, 🇮🇩, 🇲🇾, 🇹🇭, 🇻🇳, 🇵🇭 等），解决跨平台渲染差异（如 Windows 系统降级为字符代码或缺字豆腐块）与“语言 ≠ 国家”的国际化混淆问题。
2. 统一使用 `lucide-react` 的 `<Globe />` 矢量图标，搭配各语言的母语真实自称（如 `English`、`简体中文`、`Bahasa Indonesia`、`ไทย` 等），对标 Stripe, Apple, Linear 等现代顶级 B2B SaaS 的设计规范。

## 范围与涉及文件
1. `app/console/layout.tsx`：控制台全局顶部栏语言选择器，去除 `meta.flag`，前置 `<Globe />` 图标容器，规范展示母语自称及简短标识。
2. `app/login/page.tsx` & `app/register/page.tsx`：登录与注册页面的多语言选择器下拉项去除硬编码 Emoji，保持矢量图标与母语呈现。
3. `app/page.tsx`：出海官网 Landing 页面头部语言切换药丸组及移动端下拉菜单，去除所有国旗 Emoji，呈现纯文本 ISO 代码与母语自称。
4. `components/auth/auth-card.tsx`：入驻/注册卡片中的东南亚目标出海市场选择项，去除国旗 Emoji，采用专业的市场与地区代码文本。

## 非目标
- 不变更底层业务翻译字典与多语言键值对（保留 `lib/i18n/index.ts` 的业务逻辑与映射契约）。
- 不破坏现有 TypeScript 类型定义及各组件已有的状态响应（`useAppStore` 的 `locale` / `setLocale`）。

## 阶段拆分
- [ ] **阶段 1：重构控制台全局 Header 及登录/注册页语言选择器**
  - 文件：`app/console/layout.tsx`、`app/login/page.tsx`、`app/register/page.tsx`
  - 内容：统一使用 `<Globe />` 矢量图标，去除所有下拉选项中的 Emoji，呈现母语名称。
  - 测试 T1：检查 DOM 渲染选项，确认无任何国旗/地球 Emoji，文字显示为母语自称。
- [ ] **阶段 2：重构官网 Landing 导航栏语言切换器**
  - 文件：`app/page.tsx`
  - 内容：重构 `LANDING_LANGS` 结构及药丸切换组/移动端选择器，彻底移除 `flag` emoji。
  - 测试 T2：大屏端药丸组与小屏下拉切换器无 emoji，点击切换语言功能正常响应。
- [ ] **阶段 3：重构认证卡片目标市场选项**
  - 文件：`components/auth/auth-card.tsx`
  - 内容：移除 `marketOptions` 选项文本中的国旗 emoji，采用标准规范文字。
  - 测试 T3：切换语言查看下拉选项，确认选项均无 emoji 且格式统一。
- [ ] **阶段 4：质量验证与自动化回归**
  - 命令：`pnpm exec vitest run lib/i18n/i18n.test.ts`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm lint`、`pnpm build`
  - 预期：测试全部通过，类型检查 0 错误，生产构建成功。

## 验收标准
1. 界面所有 i18n 切换与市场选择区域零原生 Emoji 残留。
2. 统一使用 `<Globe />` 矢量图标，语言名称呈现为其母语真实自称。
3. 全端响应式与交互正常，切换语言功能无状态回归。
4. 单元测试、TypeScript 类型检查、Lint 与 Next.js 生产构建全部通过。

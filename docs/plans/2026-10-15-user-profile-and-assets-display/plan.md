# 需求计划：增加显示用户信息与用户资产 (User Profile & Assets Display)

## 1. 背景与目标
- **背景**：当前控制台已支持店铺管理、AI 催付工单、多语言知识库与 Solana Devnet Credits 充值，但界面上缺乏完整的商户主理人身份展示（如姓名、邮箱、角色）及集中的用户数字资产概览（如 AI Credits 余额明细、Solana 钱包持仓 SOL/USDC 等）。
- **目标**：在 SolaFlow 控制台顶部全局导航、侧边栏及控制台总览页与设置页中，系统化展示当前登录用户的身份信息（姓名、邮箱、角色、租户店铺）和多维用户资产（平台 AI 消息 Credits、Solana Devnet 钱包 SOL/USDC 资产、累计挽回订单资产），提供清晰的可视化呈现与操作入口。

## 2. MVP 范围
1. **状态与数据层 (Zustand & TanStack Query & Types)**：
   - 扩展用户资料类型 `UserProfile`（姓名 `name`、邮箱 `email`、角色 `role`、头像 `avatar`、手机号脱敏 `phone` 等）与数字资产类型 `UserAssets`（Credits 明细、Solana Devnet 钱包地址、SOL 余额、USDC 余额、连接状态）。
   - 在 `stores/use-app-store.ts` 或专属 hook 中维护用户可编辑的资料状态，并与 `authApi.getSession()` 服务端数据互通。
   - 标注 Demo/Mock 数据标识，符合规范要求。
2. **多语言词条 (i18n)**：
   - 在 `lib/i18n/index.ts` 补充关于用户信息（姓名、邮箱、角色、账户状态）与资产（可用额度、预留额度、体验额度、Solana Devnet 钱包、SOL 余额、USDC 余额、折合估值）的翻译。
3. **全局 Topbar & Sidebar 用户资产组件 (`components/console/user-nav-dropdown.tsx`)**：
   - 顶部导航栏右侧显示包含用户姓名首字母头像、姓名与邮箱简略信息的胶囊按钮。
   - 点击可打开用户身份与资产浮窗：
     - 头部：用户姓名、邮箱、Owner/Admin 徽章、所属租户店铺。
     - 资产区：SolaFlow Credits（可用/冻结）、Solana Devnet 钱包地址、SOL 与 USDC 余额。
     - 快捷操作：复制钱包地址、前往充值、控制台设置、退出登录。
   - 升级侧边栏底部的商户身份小卡片，完整呈现主理人姓名、邮箱与钱包网络。
4. **控制台总览页仪表板看板 (`components/console/user-assets-banner.tsx`)**：
   - 在 `app/console/page.tsx` 页面顶部引入高质感的用户资产 Bento 卡片：
     - 左侧：商户主理人档案（姓名、邮箱、店铺等级、时区）。
     - 右侧：三列资产卡片（Credits 额度资产、Solana Devnet 钱包资产 SOL/USDC、电商 GMV 挽回累计资产）。
5. **设置页个人资料与资产区块 (`app/console/settings/page.tsx`)**：
   - 增加「个人资料与数字资产 (Profile & Digital Assets)」模块，支持查看/修改姓名、查看认证邮箱、绑定/断开钱包与查看资产。

## 3. 非目标 (Out of Scope)
- 不接入主网真实资金划转（严格限制在 Solana Devnet 测试环境）。
- 不破坏现有 Neon Auth 的 JWT / Session Cookie 路由守卫机制。
- 不引入外部庞大的状态管理库。

## 4. 风险与依赖
- **依赖**：TanStack Query、Zustand、Tailwind CSS 4、Lucide 图标、`@solana/kit` 现有钱包适配。
- **降级与防范**：在未连接钱包或离线状态下，使用标准的初始默认与 Demo 标注展示，保证界面不白屏、不报错。

## 5. 阶段拆分
- **阶段 1**：扩展数据模型、i18n 多语言词条与单元测试。
- **阶段 2**：开发 `UserNavDropdown` 组件并在 `app/console/layout.tsx` 中落地（顶部栏与侧栏底部）。
- **阶段 3**：开发 `UserAssetsBanner` 组件并在 `app/console/page.tsx` 与 `app/console/settings/page.tsx` 中落地。
- **阶段 4**：执行全套自动化测试、类型检查、构建验收，在 `result.md` 记录详细结果。

## 6. 各阶段测试步骤及预期
- **阶段 1 测试**：运行 Vitest 单元测试，验证 i18n 词条完整性与 Store 用户资产更新动作。
- **阶段 2 测试**：测试 Topbar 下拉菜单的展开/收起、Escape 键关闭、点击外部关闭、显示姓名/邮箱/Credits/SOL/USDC 余额。
- **阶段 3 测试**：测试总览页和设置页中用户信息与资产卡片的渲染，验证 375px/768px/1440px 视口无横向溢出，复制钱包地址成功反馈。
- **阶段 4 验收**：`pnpm test` 全绿，`pnpm exec tsc --noEmit` 0 错误，`pnpm lint` 0 错误，`pnpm build` 构建成功。

## 7. 最终验收标准
1. 控制台顶部右侧或侧栏清晰展示用户姓名、邮箱、角色徽章。
2. 展开面板或卡片中清晰展示用户资产（Credits 额度、Solana 钱包地址、SOL 余额、USDC 余额、折合估值等），明确标注 Demo/Devnet。
3. 支持响应式布局（移动端 375px、平板 768px、桌面 1440px 均不发生布局断裂或溢出）。
4. 代码符合 TypeScript strict 标准，所有既有和新增测试 100% 通过。

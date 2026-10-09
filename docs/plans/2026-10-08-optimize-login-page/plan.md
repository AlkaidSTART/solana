# 计划：登录页交互深度优化与极简质感升级 (Login Page Polish)

## 1. 背景与目标
- 产品背景：SolaFlow AI 面向东南亚出海电商，登录页是商户入驻接入的第一道核心门户。
- 现状问题：
  1. 当前登录页虽然具备双屏展示、OTP 及密码登录、第三方 OAuth 和基础多语言切换，但存在多处硬编码中文文本（未全量适配 `en_US` 和 `id_ID`）；
  2. 根据 `ui_design/09-auth-onboarding/README.md` 规范，OTP 验证码应支持“输入满 6 位自动提交，无需手动回车/点击”，目前仍需手动点击提交；
  3. 登录与注册、OTP 与密码切换较为生硬，缺少符合 AWWWARDS 极简工程美学的微动效与顺滑过渡（项目已装 `motion`）；
  4. 移动端（<1024px）展示较为单调，隐藏左侧展厅后缺乏业务亮点呈现；
  5. 缺少“记住邮箱 (Remember Email)”常用商户体验。
- 目标：全面对齐设计规范与多语言要求，完善 6 位 OTP 自动核验提交，融入精致微动效，补齐国际化，强化移动端表现，确保严格类型安全与自动化测试覆盖。

## 2. MVP 范围
- **范围包含**：
  1. **OTP 6 位自动验证提交流程**：当第 6 位输入完成或完整粘贴 6 位验证码时，自动触发核验流程，减少操作阻力；
  2. **深度国际化 (i18n)**：全量消除 `app/login/page.tsx`、`components/auth/auth-card.tsx`、`components/auth/auth-showcase.tsx` 中的硬编码中文，覆盖中 (`zh_CN`)、英 (`en_US`)、印尼 (`id_ID`)；
  3. **AWWWARDS 极简质感与微动效**：
     - 利用 `motion` 实现登录/注册平滑过渡与 Tab 灵动滑块；
     - 6 位 OTP 单元格聚焦呼吸感与输入弹性反馈；
     - 校验错误微抖动与成功过渡反馈；
  4. **商户体验细节提升**：
     - “记住工作邮箱”持久化（LocalStorage）；
     - 一键填入演示凭据（Fill Demo）的即时动效与聚焦反馈；
  5. **移动端适配优化**：
     - 移动端微型业务亮点折叠抽屉，让小屏幕商户也能直观感知 COD 防损与 15 分钟催付价值；
  6. **测试与回归验证**：
     - 更新并扩充 `components/auth/auth-utils.test.ts`，验证 OTP 逻辑与辅助函数；
     - 运行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm test` 及 `pnpm build`。

- **非目标**：
  - 不修改后端现有的 `/api/v1/auth/**` 接口契约；
  - 不引入新的外部依赖库（使用已有的 `motion`, `lucide-react`, `zustand`, `clsx`, `tailwind-merge`）；
  - 不改变主色调（严格遵守纯白底色、深黑铅印、1px 发丝几何线，严禁蓝紫色系）。

## 3. 风险与依赖
- 依赖：`motion` 已安装（v14），React 19，Tailwind CSS 4。
- 风险：
  - React 19 与 `motion` 的 client-side 导入需要确保 `"use client"` 边界清晰；
  - OTP 自动触发提交需防止重复触发与未填满时的意外调用。

## 4. 阶段拆分
- **阶段 1：国际化字典重构与硬编码彻底清零**
  - 为 `auth-card.tsx`、`auth-showcase.tsx`、`app/login/page.tsx` 建立完整三语对照字典（涵盖所有表单选项、错误提示、按钮、协议文案、移动端标头）。
- **阶段 2：交互增强与 OTP 自动提交、记住邮箱**
  - 在 `auth-card.tsx` 中实现 6 位 OTP 填满自动校验提交；
  - 增加“记住工作邮箱”逻辑；
  - 优化回车键提交流程。
- **阶段 3：微动效与视觉质感升级 (Motion & Polish)**
  - 加入 `motion` 的 Tab 切换动效、表单淡入淡出、OTP 单元格焦点与弹性过渡、错误抖动；
  - 移动端业务速览微抽屉组件。
- **阶段 4：测试套件扩充与全量代码验证**
  - 补充针对新交互与边界的单元测试；
  - 执行 `pnpm test`、`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`。

## 5. 测试步骤与最终验收标准
- 步骤 T1：语言切换（中文/英文/印尼文），验证页面所有元素无任何未翻译文本与歧义；
- 步骤 T2：OTP 模式下输入 6 位验证码（或粘贴），验证是否自动触发校验并跳转；
- 步骤 T3：切换登录/注册模式，验证动画流畅无闪烁或布局崩溃；
- 步骤 T4：勾选“记住邮箱”，刷新页面验证邮箱是否自动恢复；
- 步骤 T5：375px / 768px / 1440px 视口检查无横向溢出；
- 步骤 T6：自动化构建和测试全部通过。

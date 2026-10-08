# 需求计划：集成 Neon Auth 与第三方 OAuth 登录 (Neon Auth & OAuth Integration)

## 1. 背景与目标
- **背景**：当前系统鉴权支持邮箱 OTP 与密码登录模式，用户要求接入 Neon 官方托管认证服务（Neon Auth），配置环境地址 `https://ep-falling-sky-b5fgcy67.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth`，并引入第三方 OAuth 登录能力（如 Google、GitHub、Microsoft 等出海跨境电商高频使用的社会化登录入口）。
- **目标**：
  1. 安装并配置依赖 `@neondatabase/neon-js` 与 `react-router-dom`（以及 Neon Auth 客户端必要支持）；
  2. 在 `.env`、`.env.local` 中配置 `VITE_NEON_AUTH_URL` 以及兼容 Next.js App Router 的 `NEXT_PUBLIC_NEON_AUTH_URL` / `NEON_AUTH_URL`；
  3. 创建 Neon Auth 客户端与 OAuth 适配模块（支持从配置的 Neon Auth 端点发起 OAuth 授权流程，如 Google / GitHub / Microsoft）；
  4. 在登录/注册卡片 `components/auth/auth-card.tsx` 中增加第三方 OAuth 快捷登录区域，提供现代出海 SaaS 风格的社交登录按钮组与状态反馈；
  5. 兼容 OAuth 回调处理路由（`/auth/callback` 或客户端重定向捕获），处理凭证交换并顺利进入工作台；
  6. 严格保持既有极简黑白、1px 发丝线、功能绿的商业级设计规范，支持多语言（中/英/印尼）。

## 2. MVP 范围
- **环境变量配置**：
  - `.env`、`.env.local`：增加 `VITE_NEON_AUTH_URL`、`NEXT_PUBLIC_NEON_AUTH_URL`、`NEON_AUTH_URL`。
- **SDK 与依赖**：
  - 执行 `pnpm add @neondatabase/neon-js react-router-dom`。
- **客户端模块**：
  - `lib/auth/neon-auth.ts`（新增）：封装 Neon Auth 配置获取、第三方 OAuth 提供商（Google、GitHub、Microsoft、Apple）授权跳转 URL 构造、OAuth 重定向处理。
- **UI 界面增强**：
  - `components/auth/auth-card.tsx`：增加第三方 OAuth 登录分割线及社交登录按钮组（Google、GitHub），点击发起第三方 OAuth 授权重定向，并提供错误提示与加载状态；
  - `components/auth/oauth-buttons.tsx`（新增）：高品质发丝几何第三方 OAuth 按钮组件，包含品牌图标、悬浮状态、多语言支持；
  - `app/auth/callback/page.tsx`（新增）：处理 OAuth 回调重定向页面，提取 code/token 或完成凭据换取并导航至 `/console`。
- **验证与测试**：
  - 覆盖 OAuth 按钮触发、URL 生成、回调页面解析单元测试或模拟测试；
  - 确保现有测试套件与 TypeScript 检查完全通过。

## 3. 非目标 (Out of Scope)
- 不破坏现有邮箱 OTP 与密码登录既有功能；
- 不在客户端硬编码任何第三方 Client Secret；
- 不重写后端 PostgreSQL 用户会话架构，保持双轨平滑融合。

## 4. 风险与依赖
- **依赖安装与兼容性**：在 Next.js App Router 环境中安装 `react-router-dom` 与 `@neondatabase/neon-js` 时需确保无模块命名冲突与构建警告。
- **Neon Auth 端点可用性**：外部端点依赖网络通畅，若 Neon Auth 外部端点尚未在 Neon 控制台开启具体的 OAuth Provider Client ID，客户端提供明确优雅的错误提示与回退机制。

## 5. 阶段拆分
- **阶段 1**：环境与依赖——在 `.env` / `.env.local` 中配置 `VITE_NEON_AUTH_URL` 等变量，安装 `@neondatabase/neon-js react-router-dom` 依赖；
- **阶段 2**：Neon Auth SDK 客户端封装与回调路由——编写 `lib/auth/neon-auth.ts` 与 `app/auth/callback/page.tsx`；
- **阶段 3**：登录界面集成——在 `components/auth/auth-card.tsx` 中集成第三方 OAuth 登录按钮，适配多语言与发丝风格；
- **阶段 4**：测试与验证——编写 OAuth 逻辑测试，执行类型检查与构建验证。

## 6. 各阶段测试步骤、输入及预期
- **测试 T1 (环境变量与客户端)**：验证 `getNeonAuthUrl()` 正确返回配置的 Neon Auth 端点，测试生成的 Google / GitHub OAuth URL 符合 OAuth 2.0 规范；
- **测试 T2 (UI 交互)**：在登录与注册模式下均展示第三方 OAuth 按钮，点击触发重定向动作；
- **测试 T3 (回调处理)**：访问 `/auth/callback?code=mock_code`，验证能正确解析回调参数并重定向至控制台；
- **测试 T4 (工程闸门)**：运行 `pnpm test`、`pnpm lint`、`tsc --noEmit`、`pnpm build`，确保无报错。

## 7. 最终验收标准
1. `package.json` 包含 `@neondatabase/neon-js` 与 `react-router-dom`；
2. `.env` 与 `.env.local` 准确包含用户指定的 `VITE_NEON_AUTH_URL` 配置；
3. 登录页呈现质感上乘的第三方 OAuth 登录（Google、GitHub 等）；
4. 提供规范的 OAuth 回调处理机制；
5. 所有自动化测试、代码检查与构建通过。

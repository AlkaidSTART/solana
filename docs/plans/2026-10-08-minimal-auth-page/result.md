# 需求执行记录：简约登录注册页面 (Minimal Auth Page)
计划：docs/plans/2026-10-08-minimal-auth-page/plan.md

- [x] 阶段 1：设计与结构规划：梳理交互状态机、国际化词条与表单契约
  - 完成内容：制定统一 AuthCard 架构，规划登录（OTP 免密 + 密码登录）与注册（商户工作邮箱、店铺名、出海市场、密码强度）双模式切换机制。
  - 交付文件：`docs/plans/2026-10-08-minimal-auth-page/plan.md`。

- [x] 阶段 2：开发核心登录/注册页面组件：重构 `/login` 并支持 `/register` 路由，实现 OTP 验证码格、密码登录与商户注册表单
  - 完成内容：
    1. 编写高内聚商户认证组件 `components/auth/auth-card.tsx`；
    2. 实现 6 位动态验证码分格输入（自动聚焦下一格、退格回退、剪贴板多位粘贴自动分拆）；
    3. 重构 `app/login/page.tsx`，支持 URL 查询参数 `?mode=login` / `?mode=register` 预选；
    4. 新建独立商户注册路由 `app/register/page.tsx`。
  - 交付文件：
    - [components/auth/auth-card.tsx](file:///Users/allure/Desktop/solana/components/auth/auth-card.tsx)
    - [app/login/page.tsx](file:///Users/allure/Desktop/solana/app/login/page.tsx)
    - [app/register/page.tsx](file:///Users/allure/Desktop/solana/app/register/page.tsx)

- [x] 阶段 3：多语言、主题与动效打磨：对齐 Swiss Architectural Minimalist 视觉令牌、发丝边框与无障碍标签
  - 完成内容：
    1. 遵循 `docs/UI_DESIGN.md` 纯白基底（`#FFFFFF`）、深黑铅字（`#09090B`）、1px 发丝边框（`border-zinc-200`）、严禁蓝紫霓虹；
    2. 支持中 (zh_CN)、英 (en_US)、印尼 (id_ID) 三语界面动态翻译；
    3. 新增实时密码强度评估指示条（弱/中等/高强度）；
    4. 增加“已有商户账号？返回登录”与“还没有商户账号？免费注册”双向快速切换与演示凭据一键载入；
    5. 抽取可测试纯函数至 `components/auth/auth-utils.ts`。
  - 交付文件：
    - [components/auth/auth-utils.ts](file:///Users/allure/Desktop/solana/components/auth/auth-utils.ts)
    - [components/auth/auth-card.tsx](file:///Users/allure/Desktop/solana/components/auth/auth-card.tsx)

- [x] 阶段 4：质量检查与全链路验证：修复既有类型遗漏，运行 TypeScript 类型检查与项目构建，验证所有测试用例
  - 完成内容：
    1. 编写专用单元测试 `components/auth/auth-utils.test.ts`，覆盖邮箱格式验证、密码强度评估、剪贴板 OTP 粘贴解析及完整性检查；
    2. 执行 `pnpm test components/auth/auth-utils.test.ts`，13 项测试全部通过；
    3. 执行 `pnpm test` 全量回归，22 个测试套件、249 项测试全部通过；
    4. 执行 `pnpm lint`，ESLint 检查 0 错误 0 警告；
    5. 执行 `pnpm exec next typegen && pnpm exec tsc --noEmit`，TypeScript 类型检查无错误；
    6. 执行 `pnpm build` 全量生产构建成功，静态生成 `/login` 与 `/register` 路由。
  - 交付文件：
    - [components/auth/auth-utils.test.ts](file:///Users/allure/Desktop/solana/components/auth/auth-utils.test.ts)

- [x] MVP 验收：满足验收标准，页面交互与视觉自洽
  - **验收项 1（视觉基调）**：纯白画布、瑞士国际主义发丝排版、纯黑行动按钮，无蓝紫荧光杂色，符合 Awwwards 级别规范。
  - **验收项 2（登录能力）**：支持 6 位 OTP 免密动态码（带倒计时、粘贴解析、自动分格）与账号密码登录双子模式；提供一键载入演示凭据及直接进入控制台通道。
  - **验收项 3（注册能力）**：包含工作邮箱、店铺名、首发市场选择、密码强度评分与 Meta BAA 商业协议勾选，注册成功后平滑进入 `/onboarding` 向导。
  - **验收项 4（路由与多语言）**：`/login` 与 `/register` 均可用，顶部支持多语言无缝切换与返回官网。
  - **验收项 5（代码与构建）**：TypeScript、ESLint、Vitest、Next.js 生产打包全绿。
  - **剩余风险**：无阻塞性风险；生产部署时若接入外部真实邮件推送服务，可通过现有的 OTP Provider 接口配置 SMTP/Resend 密钥。

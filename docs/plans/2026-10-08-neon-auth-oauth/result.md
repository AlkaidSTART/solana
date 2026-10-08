# 需求执行记录：集成 Neon Auth 与第三方 OAuth 登录
计划：docs/plans/2026-10-08-neon-auth-oauth/plan.md

- [x] 阶段 1：环境与依赖——在 .env / .env.local 中配置 VITE_NEON_AUTH_URL、NEXT_PUBLIC_NEON_AUTH_URL、NEON_AUTH_URL，并在 package.json 中加入 @neondatabase/neon-js 与 react-router-dom；测试 T1：核验 .env 与 .env.local 变量注入；预期：正确注入 Neon Auth 端点；实际：成功写入且兼顾 Next.js 客户端环境；下一步：推进阶段 2。
- [x] 阶段 2：Neon Auth SDK 客户端封装与回调路由——编写 lib/auth/neon-auth.ts 与 app/auth/callback/page.tsx；测试 T2：验证 OAuth URL 构造与参数解析；预期：正确支持 google、github 等提供商跳转并解析回调；实际：完成模块并编写单元测试 lib/auth/neon-auth.test.ts；下一步：推进阶段 3。
- [x] 阶段 3：登录界面集成——在 components/auth/auth-card.tsx 中集成第三方 OAuth 登录按钮 components/auth/oauth-buttons.tsx；测试 T3：登录与注册模式均包含 Google 与 GitHub 按钮；预期：契合 1px 发丝几何风格与多语言；实际：成功融入卡片；下一步：阶段 4 验收。
- [x] 阶段 4：测试与工程闸门——编写测试 lib/auth/neon-auth.test.ts，验证端点解析与回调逻辑；测试 T4：单元用例覆盖；预期：逻辑准确无回归；实际：已覆盖端点优先级、Google/GitHub URL 构造、成功与失败回调解析；下一步：MVP 验收。
- [x] MVP 验收：Neon Auth 端点配置、依赖配置、第三方 Google/GitHub 授权发起与回调闭环已全部交付，契合出海 SaaS 质感与既有设计规范。

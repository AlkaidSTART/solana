# 需求计划：打通 Neon Auth 的 Google OAuth 登录（原含 GitHub，已收敛为仅 Google）

## 0. 范围变更记录

- **2026-10-15（用户决策）**：**去掉 GitHub，只保留 Google OAuth**。依据：Neon Managed Better Auth 不支持 GitHub 共享凭证——实测 `neonctl neon-auth oauth-provider add --provider-id github` 返回 `ERROR: request failed; reason:"OAuth provider does not support shared OAuth", code:"INVALID_SHARED_OAUTH_PROVIDER"`，官方文档（`docs/auth/guides/setup-oauth.md`）明确 GitHub / Vercel 必须自建 OAuth App，而自建 GitHub OAuth App 不在本期范围。据此：Neon 侧不启用 GitHub；登录 UI 移除 GitHub 按钮；`OAuthProvider` 类型收敛为 `"google"`。

## 1. 背景与目标

- **背景**：登录/注册卡片（`components/auth/auth-card.tsx`）与 `/auth/callback` 页面已存在，但实测两个问题：
  1. **GitHub provider 未启用**：`POST {NEON_AUTH_BASE_URL}/sign-in/social` 传 `provider=github` 返回 `400 {"error":"Provider is not supported or enabled for this project","code":"PROVIDER_NOT_SUPPORTED"}`；`provider=google` 正常返回 `{url, redirect:true}` 并 302 到 `accounts.google.com`（Neon 共享 OAuth app 已配好）。
  2. **回调换 session 缺失（根因）**：Neon Auth 在 OAuth 回来后重定向到 `callbackURL?neon_auth_session_verifier=...`，并依赖 SDK 的 middleware（`auth.middleware()` / `neonAuthMiddleware`）把 `neon_auth_session_verifier` + `__Secure-neon-auth.session_challenge` 换成 `__Secure-neon-auth.session_token`（见 `@neondatabase/auth` 的 `src/server/middleware/oauth.ts`）。本仓库 `proxy.ts` 是自写的乐观守卫，matcher 只有 `/console`、`/onboarding`，`/auth/callback` 既没进 matcher 也没跑 Neon 中间件 → 换 session 永不发生 → `app/api/v1/auth/neon/session/route.ts` 里 `neonAuth().getSession()` 拿不到 `data.user.email` → 返回 401 `UNAUTHENTICATED` → 回调页显示"授权未通过"。
- **目标**：
  1. ~~在 Neon 分支上启用 GitHub provider~~ → 收敛为：**不启用 GitHub**；Google 沿用 Neon 现有 provider 配置（当前为 shared 凭证，生产上线前建议换自建 Google OAuth App）。
  2. 在 `proxy.ts` 的 `/auth/callback` 路径上接入 `neonAuth().middleware({ loginUrl: "/login" })`，完成 OAuth verifier → session 交换。
  3. Google 入口与既有邮箱 OTP、密码登录共存，端到端可在浏览器完成登录并进入 `/console`；登录页不再出现 GitHub 按钮。

## 2. MVP 范围

- **Neon 侧配置**（运维，不改代码）：
  - `neon neon-auth oauth-provider list` 确认 provider 现状（`google / shared`）；**不再执行 GitHub 的 `oauth-provider add`**。
- **代码改动**：
  - `lib/auth/route-guard.ts`：新增 `OAUTH_CALLBACK_PATH = "/auth/callback"` 常量（供 proxy 判断，可单测）。
  - `proxy.ts`：改为 `async function proxy(request)`；`/auth/callback` 交给懒加载的 `neonAuth().middleware({ loginUrl: LOGIN_PATH })`，其余路径保持现有 `decideRouteAccess` 乐观守卫；matcher 增加 `"/auth/callback"`。
  - `lib/auth/route-guard.test.ts`：补 `OAUTH_CALLBACK_PATH` 与 `isProtectedPath("/auth/callback") === false` 的断言（后者已存在，改为引用常量）。
  - `components/auth/oauth-buttons.tsx`：删除 GitHub 按钮、其 i18n 文案与品牌 SVG，只保留 Google 按钮（单列全宽）。
  - `lib/auth/neon-auth.ts`：`OAuthProvider` 收敛为 `"google"`，文件头注释同步；`lib/auth/neon-auth.test.ts` 删除 GitHub URL 用例。
- **验证**：本地与线上的结构性与端到端验收（见 §6）。

## 3. 非目标 (Out of Scope)

- **不把 `/console`、`/onboarding` 的守卫换成 Neon 中间件**：页面守卫仍只看 `solaflow_session` 是否存在（乐观检查），授权仍由 `/api/v1/**` 的 `requireUser` 承担，沿用 `2026-10-15-console-auth-route-guard` 的结论。
- 不启用 Neon 托管 UI（`@neondatabase/auth-ui`）；不改登录页视觉与邮箱 OTP/密码流程。
- 不新增 `?next=` 回跳、不做社交账号与本地 `users` 的绑定关系表（沿用 `neon-bridge.ts` 的 email 归并）。
- 不引入自建 GitHub / Vercel OAuth App，也不提供 GitHub、Vercel、Apple、Microsoft 等其余 provider 入口（本期只做 Google）。
- `/api/v1/**` 不纳入 matcher，保持 JSON 401 语义不变。

## 4. 风险与依赖

- **依赖**：Neon API Key（`neonctl` 认证，用于确认 provider 现状与清理测试数据）。
- **风险 1（第三方 cookie/分区）**：SDK 把上游 Set-Cookie 重写为本域 cookie（`prepareResponseHeaders`：去掉 `Partitioned`、`sameSite=lax`、`secure=true`），因此 challenge cookie 会落在本站；本地 http 下 `__Secure-` + `Secure` 在 Chrome 属于 localhost 例外，Safari 需 `--experimental-https`。本地验收如需浏览器实测优先用 Chrome。
- **风险 2**：`@neondatabase/auth/next/server` 顶层 `import { cookies, headers } from "next/headers"`，引入 proxy（edge）需构建验证；若 edge 不兼容，退路是把 Neon 中间件调用挪到 `/auth/callback` 的 Route Handler（`app/auth/callback/route.ts`）做交换后再 302 到页面。
- **风险 3**：真实 OAuth 登录需要用户自己的 Google 账号，我无法代跑；故"真实登录"验收需用户配合一次浏览器点击，代码侧只做结构化验证，不虚报通过。

## 5. 阶段拆分

- **阶段 1**：~~Neon 侧启用 GitHub provider~~ → 收敛为：`neonctl` 确认 provider 现状（`google / shared`），不启用 GitHub。
- **阶段 2**：`lib/auth/route-guard.ts` + `proxy.ts` 接入 Neon 中间件，matcher 覆盖 `/auth/callback`；移除登录页 GitHub 入口与 `OAuthProvider` 的 GitHub 取值。
- **阶段 3**：单元测试与工程闸门（vitest / lint / typegen+tsc / build）。
- **阶段 4**：本地与线上结构性验证 +（用户配合）真实 Google 登录验收；写 `result.md`。

## 6. 各阶段测试步骤、输入及预期

- **测试 T1（provider 现状）**：`neon neon-auth oauth-provider list`；预期只列出 `google / shared`，且 `POST $NEON_AUTH_BASE_URL/sign-in/social {"provider":"google"}` 返回 `{url, redirect:true}`；`provider=github` 返回 `PROVIDER_NOT_SUPPORTED`（本期不再支持）。
- **测试 T2（单元）**：`pnpm exec vitest run lib/auth`；预期 `route-guard.test.ts` 覆盖 `/auth/callback` 为公共路径且 `OAUTH_CALLBACK_PATH` 与实现一致。
- **测试 T3（本地回调行为）**：对本地 dev server 发 `GET /auth/callback?neon_auth_session_verifier=invalid`（带/不带 challenge cookie）；预期：**不再被当作受保护页面重定向**，返回 200 页面（页内进入 error 态），且服务端不抛异常；伪造 verifier 时不得写入任何 session cookie（不产生越权登录）。
- **测试 T4（本地公共路径无回归）**：`/`、`/login`、`/register` 返回 200；匿名 `/console`、`/onboarding` 仍 307 → `/login`；`/api/v1/auth/session` 仍返回 JSON 401，无重定向。
- **测试 T5（工程闸门）**：`pnpm exec vitest run`、`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build` 全绿；build 输出仍包含 `ƒ Proxy (Middleware)`。
- **测试 T6（线上真实登录）**：部署到生产域名后，用真实 Google 账号点"使用 Google 账号登录"；预期：`accounts.google.com` → `/auth/callback`（中间件 302 去 verifier 并落 `__Secure-neon-auth.session_token`）→ 建立 `solaflow_session` → 进入 `/console`。
- **测试 T7（防回归/边界）**：`/auth/callback` 不带 verifier 直接访问 → 200 且不报错；OAuth 供应商拒绝授权（回调带 `error=access_denied`）→ 页面展示"授权未通过"，不写入 session。
- **测试 T8（移除 GitHub 无回归）**：登录页与注册页只渲染 1 个第三方按钮（Google），DOM 中不含 GitHub 文案/SVG；`grep -ri github components lib` 在产品代码中无残留。

## 7. 最终验收标准

1. `neon-auth oauth-provider list` 为 `google / shared`（GitHub 不启用），`/sign-in/social` 对 `provider=google` 返回跳转 URL。
2. `proxy.ts` 在 `/auth/callback` 执行 Neon 中间件的 verifier 交换，matcher 含 `/auth/callback`；其余路径行为与 `2026-10-15-console-auth-route-guard` 一致（公共页 200、匿名受保护页 307、`/api/v1/**` 无重定向）。
3. 真实 Google 账号完成一次登录并进入 `/console`（用户配合），或如实记录未完成原因；登录页不再有 GitHub 入口。
4. 单元测试、lint、typecheck、build 全部通过。
5. `result.md` 与实际交付一致，未验证项保持未勾选并写明原因。

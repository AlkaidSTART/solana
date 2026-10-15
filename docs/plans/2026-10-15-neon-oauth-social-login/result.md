# 需求执行记录：打通 Neon Auth 的 Google / GitHub 第三方登录

计划：docs/plans/2026-10-15-neon-oauth-social-login/plan.md

## 诊断结论（根因）

登录页两个问题，实测确认：

1. **GitHub provider 未在 Neon 侧启用**：`POST {NEON_AUTH_BASE_URL}/sign-in/social` 传 `provider=github` 返回 `400 {"error":"Provider is not supported or enabled for this project","code":"PROVIDER_NOT_SUPPORTED"}`；`provider=google` 正常返回 `{url, redirect:true}`。
2. **回调换 session 缺失（本次修复）**：Neon Auth 在 OAuth 回来后重定向到 `callbackURL?neon_auth_session_verifier=<uuid>`，需要 SDK 中间件把 `neon_auth_session_verifier` + `__Secure-neon-auth.session_challenge` 换成 `__Secure-neon-auth.session_token`。原 `proxy.ts` 是自写守卫且 matcher 不含 `/auth/callback` → 交换永不发生 → `app/api/v1/auth/neon/session/route.ts` 的 `neonAuth().getSession()` 拿不到 `data.user.email` → 401 `UNAUTHENTICATED` → 回调页显示"授权未通过"。

## Checklist

- [x] 阶段 2：`lib/auth/route-guard.ts` 新增 `OAUTH_CALLBACK_PATH = "/auth/callback"`；`proxy.ts` 改为 `async function proxy`，`/auth/callback` 交给懒加载的 `neonAuth().middleware({ loginUrl: LOGIN_PATH })`，其余路径保持原有 `decideRouteAccess` 乐观守卫；`config.matcher` 增加 `"/auth/callback"`（**必须写字面量**，Next 静态解析不接受变量，首次用常量导致 `can't recognize the exported config field ... matcher[4]` 构建失败，已修正）。`lib/auth/route-guard.test.ts` 补 1 个用例并把字面量改为引用常量。
  - 交付文件：`proxy.ts`、`lib/auth/route-guard.ts`、`lib/auth/route-guard.test.ts`（`lib/auth/server.ts` 仅为诊断临时改动，已还原）。
- [x] 阶段 3：工程闸门。
  - 测试 T2 `pnpm exec vitest run lib/auth`：3 文件 14 用例通过（`route-guard.test.ts` 6 例，含新增的 OAuth 回调公共路径断言）。
  - 测试 T5 `pnpm exec vitest run`：27 文件 276 用例通过；`pnpm exec next typegen && pnpm exec tsc --noEmit`：OK；`pnpm build`：成功且输出含 `ƒ Proxy (Middleware)`。
  - `pnpm lint`：0 error、2 warning，warning 全部来自**另一并行任务的未跟踪文件** `lib/animations/motion-transitions.test.ts`（未使用变量），与本次改动无关，未处理。
- [x] 阶段 4a：本地验收（生产构建 `next start -p 3100`）。
  - 测试 T4：匿名 `/console`、`/console/billing`、`/onboarding` 均 `307 → http://localhost:3100/login`；`/`、`/login`、`/register`、`/auth/callback` 均 `200`；`/api/v1/auth/session` 为 JSON `401`（无重定向）。全部符合预期。
  - 测试 T3（回调行为）：`GET /auth/callback` 与 `?neon_auth_session_verifier=...` 均 `200`，未产生任何 session cookie；伪造 challenge 时上游 `get-session` 返回非 2xx 并安全回落到 allow 分支，**不产生越权登录**。
  - 测试 T3b（证明交换路径真的在跑）：用真实 Neon 会话 cookie（见下方测试账号）访问 `/auth/callback`，上游成功返回并 mint 出 `__Secure-neon-auth.local.session_data`，证明 SDK 中间件确实在本仓库的 proxy 上执行（不是空挂）。
- [x] 阶段 4b：线上部署与验收。
  - `vercel --prod --yes` 部署成功，别名 `https://solana-neon-ten.vercel.app`（`Build Completed`，输出含 `ƒ Proxy (Middleware)`）。
  - 测试 T6a：线上匿名 `/console`、`/console/billing`、`/onboarding` 均 `307 → /login`；`/`、`/login`、`/register`、`/auth/callback` 均 `200`；`/api/v1/auth/session` 仍为 JSON `401`。
  - 测试 T6b（线上 edge 中间件）：带真实 Neon 会话 cookie 访问线上 `/auth/callback` 返回 `200` 且 `Set-Cookie: __Secure-neon-auth.local.session_data=...`，证明**部署后的 edge proxy 里 SDK 中间件在执行**；伪造 `challenge` 时 `set-cookie` 数量为 0。
  - 测试 T6c：线上 `POST /api/auth/sign-in/social`，`provider=google` 返回 `{url, redirect:true}`；`provider=github` 仍为 `PROVIDER_NOT_SUPPORTED`（见未完成项）。
- [x] 阶段 1：~~在 Neon 分支启用 GitHub provider~~ → **范围收敛为仅 Google（见文末"范围收敛"节）**。
  - 已用 `NEON_API_KEY` 跑通 `neonctl`：定位到项目 `wild-unit-87312534` / 分支 `production`（`br-delicate-star-b5jxykoc`，Base URL 与 env 一致）；`oauth-provider list` 为 `google / shared`。
  - **`oauth-provider add --provider-id github` 失败：`ERROR: request failed; reason:"OAuth provider does not support shared OAuth", code:"INVALID_SHARED_OAUTH_PROVIDER"`。** 官方文档确认：GitHub 与 Vercel 不支持 Neon 共享凭证，必须自建 OAuth App（`docs/auth/guides/setup-oauth.md`：shared credentials 仅 Google 可用且仅供开发）。
  - 用户据此决定**去掉 GitHub，只保留 Google**，故不再执行 GitHub 的 add；Neon 侧保持 `google / shared` 不变。
- [ ] 测试 T6（真实账号端到端）：用真实 Google 账号在浏览器完成登录并进入 `/console`。**未执行**：需要用户本人账号与授权点击，无法代跑；代码侧上游行为已通过 T3b/T6b 验证到"交换路径可用"为止（上游 `get-session` 在 verifier 未完成时返回 `400 VERIFICATION_NOT_FOUND`，符合设计；完成后返回 200 落 session）。

## 范围收敛（2026-10-15 用户决策）：移除 GitHub，只保留 Google OAuth

- **依据**：Neon Managed Better Auth 不支持 GitHub 共享凭证（`INVALID_SHARED_OAUTH_PROVIDER`），GitHub 必须自建 OAuth App；用户决定不做，直接从产品里去掉该入口。
- 交付内容：
  - `components/auth/oauth-buttons.tsx`：删除 GitHub 按钮、其 i18n 文案与品牌 SVG；单一 provider 后 `activeProvider: OAuthProvider | null` 简化为 `isRedirecting: boolean`，Google 按钮改为单列全宽（保留并行登录页重设计任务的 `h-8.5 sm:h-9` 等间距样式，未回退其改动）。
  - `lib/auth/neon-auth.ts`：`OAuthProvider` 由 `"google" | "github" | "microsoft" | "apple"` 收敛为 `"google"`，文件头注释同步。
  - `lib/auth/neon-auth.test.ts`：删除 GitHub URL 构造用例（Google 用例保留）。
- 测试 T8（移除无回归）：
  - `grep -ri github app components lib mock stores types hooks` → 0 命中（产品代码无残留）。
  - 构建产物 `.next/static/chunks` 中 `github` 仅 2 处，均在 `polyfills-*.js` 的 core-js 许可证 URL（`github.com/zloirock`），与应用无关。
  - **Playwright 浏览器实测（本地生产构建 + 线上）**：`/login`、`/register` 均只有 1 个第三方按钮且标题为"使用 Google 账号登录"，`GitHub` 文本出现次数 0；截图见 `scratchpad/shot-login.png`（分割线下方为单个全宽 Google 按钮，布局正常）。
  - 注意：`/login` 的 SSR HTML 不含认证卡片，是既有设计所致（`app/login/page.tsx` 用 `<Suspense>` + `useSearchParams` 使该子树静态化时退化为 fallback，卡片在客户端渲染），与本次改动无关；因此 UI 验收以浏览器渲染结果为准，`/register` 的 SSR 输出同样为 0 个 GitHub。

## 备注：GitHub 若日后要加回

GitHub → Settings → Developer settings → OAuth Apps → New OAuth App，Authorization callback URL 必须是 `{NEON_AUTH_BASE_URL}/callback/github`（即 `https://ep-falling-sky-b5fgcy67.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth/callback/github`，该路由实测存在，返回 302），而不是应用的 `/auth/callback`；拿到 Client ID + Secret 后 `neon neon-auth oauth-provider add --provider-id github --oauth-client-id <id> --oauth-client-secret <secret> --project-id wild-unit-87312534 --branch production`。

另注：Google 目前是 `shared` 凭证（Neon 官方标注"仅限开发，生产会出现 Neon 品牌与名称"）。生产上线建议换成自建 Google OAuth App，回调地址为 `{NEON_AUTH_BASE_URL}/callback/google`，并在 Google Cloud Console 配置同意屏品牌与 Authorized domains。

## 关键验证命令

- `pnpm exec vitest run` → 28 文件 286 用例通过（移除 GitHub 用例后的全量）
- `pnpm exec next typegen && pnpm exec tsc --noEmit` → OK
- `pnpm lint` → 0 problem
- `pnpm build` → BUILD OK，含 `ƒ Proxy (Middleware)`
- `pnpm exec next start -p 3100` + curl 矩阵 → 见阶段 4a
- `curl -D- "$BASE/get-session?neon_auth_session_verifier=<uuid>" -H 'Cookie: __Secure-neon-auth.session_challenge=<challenge>'` → `400 {"code":"VERIFICATION_NOT_FOUND"}`（未完成的 OAuth）；同 cookie 去掉 verifier 参数 → `200 null`
- `node scratchpad/oauth-ui-check.mjs`（Playwright，本地与 `CC_BASE=https://solana-neon-ten.vercel.app` 线上各跑一次）→ 两页各 1 个 Google 按钮、0 个 GitHub
- `vercel --prod --yes` → 两次部署成功并别名至 `https://solana-neon-ten.vercel.app`

## 未完成项与说明

- **GitHub 已按用户决策移除**：不在产品中提供该入口，也无需再启用其 provider（原 `INVALID_SHARED_OAUTH_PROVIDER` 阻塞项随之关闭）。
- **真实 OAuth 登录未经浏览器实测**：我无法代跑真实 Google 账号授权。已把能自动化验证的部分做到极限（中间件在本地与线上 edge 都确认执行、上游交换调用真实发生、失败时安全回落、登录页浏览器实测只有 Google 入口）。上线后需用户点一次"使用 Google 账号登录"确认闭环。
- **测试残留数据已清理**：验证用的临时账号 `oauth-smoke-test@example.com`（id `cead1c87-44aa-426d-b5db-1234a9735578`）已用 `neonctl neon-auth user delete` 删除（它从未写入本地 `users` 表，也未产生 `solaflow_session`）。
- **`/console`、`/onboarding` 守卫语义未改变**：仍是"cookie 存在性"乐观检查，授权由 API 层 `requireUser` 承担（沿用 `2026-10-15-console-auth-route-guard` 结论）。

## MVP 验收

对照 plan.md §7：

1. [x] `neon-auth oauth-provider list` 为 `google / shared`（GitHub 不启用），`/sign-in/social` 对 `provider=google` 返回跳转 URL。
2. [x] `proxy.ts` 在 `/auth/callback` 执行 Neon 中间件的 verifier 交换，matcher 含 `/auth/callback`；其余路径行为与既有守卫一致（本地 + 线上 curl 实测）。
3. [ ] 真实 Google 账号完成一次登录（用户浏览器验收）；登录页已无 GitHub 入口（[x]）。
4. [x] 单元测试、lint、typecheck、build 全绿。
5. [x] 本记录与实际交付一致，未验证项保持未勾选并写明原因。

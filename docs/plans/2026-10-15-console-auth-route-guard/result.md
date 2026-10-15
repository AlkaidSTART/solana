# 需求执行记录：未登录访问受保护页面时拦截到 /login

计划：docs/plans/2026-10-15-console-auth-route-guard/plan.md

## Checklist

- [x] 阶段 1：共享 cookie 名 + 纯函数守卫 + 单元测试。
  - 交付内容：`lib/auth/session-cookies.ts`（`SESSION_COOKIE_BASE`/`CSRF_COOKIE_BASE` 与 `sessionCookieName()`/`csrfCookieName()`，按 `NODE_ENV` 决定是否加 `__Host-` 前缀，纯模块无 `server-only` 与数据库依赖，供 proxy 与会话层共用）、`lib/auth/route-guard.ts`（`PROTECTED_PREFIXES`、`LOGIN_PATH`、`isProtectedPath()`、`decideRouteAccess()`）、`lib/auth/route-guard.test.ts`、`lib/auth/session-cookies.test.ts`；改造 `lib/server/auth/session.ts`：删除其内部重复的 `SESSION_COOKIE_BASE`/`CSRF_COOKIE_BASE` 常量与同名局部函数，改为从共享模块导入。
  - 测试 T1：`pnpm exec vitest run lib/auth`；预期：覆盖受保护根与子路径、前缀相似路径不误判、公共路径放行、`hasSession` 为真时放行；实际：3 文件 13 用例全部通过（其中 `route-guard.test.ts` 5 例、`session-cookies.test.ts` 1 例为本次新增）。
  - 测试 T2：`pnpm exec next typegen && pnpm exec tsc --noEmit`（OK）、`pnpm lint`（0 error 0 warning）、`pnpm exec vitest run`（26 文件 267 用例全部通过，较改动前 24 文件 261 用例增加 2 文件 6 用例）。实际：全部通过。
- [x] 阶段 2：接入 `proxy.ts`。
  - 交付内容：根目录 `proxy.ts`，具名导出 `proxy`（Next 16 约定，`middleware.ts` 已废弃），`NextResponse.redirect(new URL("/login", request.url))`，`matcher: ["/console", "/console/:path*", "/onboarding", "/onboarding/:path*"]`。显式列出根路径，不依赖 `:path*` 的零匹配语义；**不使用**全站负向匹配，以避免文档警告的"误拦 CSS/JS/图片"风险。
  - 测试 T3：`pnpm build` 通过（见下方构建记录）。
  - 测试 T4（本地）：对已存在的开发服务器（`http://localhost:3001`，同一目录）实测：`/console`、`/console/billing`、`/onboarding` 均 `307 → http://localhost:3001/login`；`/`、`/login`、`/register`、`/auth/callback` 均 `200`；`/favicon.ico` 为 `200`；`/api/auth/ok` 为 `200`；`/api/v1/payments/session` 返回 `503`（本地 `PAYMENTS_DEVNET_ENABLED=false`，属预期）且**未发生重定向**（证明 API 未被纳入 matcher）；带 `Cookie: solaflow_session=fake-token` 访问 `/console` 返回 `200`（乐观检查放行）。
  - 说明：本次未另行启动开发服务器 —— 首次尝试启动时因端口占用退出（"Another next dev server is already running"，PID 30492 属并行会话，未做处置），改测该已运行实例。
- [x] 阶段 3：线上验证（生产域名 `https://solana-neon-ten.vercel.app`，部署别名已更新）。
  - 测试 T5：匿名访问受保护页面全部 `307` 重定向到 `/login` —— `/console`、`/console/billing`、`/console/billing/sol-test`、`/console/settings`、`/onboarding`；`redirect_url` 均为 `https://solana-neon-ten.vercel.app/login`。实际：全部通过。
  - 测试 T6：`/`、`/login`、`/register`、`/auth/callback` 均 `200`；`/favicon.ico` 为 `200`（静态资源未被拦截）；`/api/auth/ok` 为 `200`；`/api/v1/payments/session` 为 `401` 且 `redirect=` 为空、响应体为 JSON `{"error":"Authentication is required"}`。实际：全部通过（API 语义未被改变）。
  - 测试 T7：带生产会话 cookie 名 `__Host-solaflow_session` 访问 `/console` 返回 `200`，证明 proxy 读取的 cookie 名与 `lib/auth/session-cookies.ts` 在生产下的取值一致（乐观检查放行路径可用）。实际：通过。
  - 说明：本次以"生产 cookie 名 + 伪造值"验证乐观检查分支；真实有效会话走的是同一代码路径（`request.cookies.has(sessionCookieName())` 为真即放行），未另做浏览器端登录验证。

## 构建与验证命令

- `pnpm exec vitest run lib/auth` → 3 文件 13 用例通过
- `pnpm exec vitest run` → 26 文件 267 用例通过
- `pnpm exec next typegen && pnpm exec tsc --noEmit` → OK
- `pnpm lint` → 0 error 0 warning
- `pnpm build` → `BUILD OK`，构建输出包含 `ƒ Proxy (Middleware)`，证明 proxy 已注册
- `vercel --prod --yes` → 部署成功并别名至 `https://solana-neon-ten.vercel.app`

## 未完成项与说明

- **未为 proxy 本身写集成测试**：Next 提供 `next/experimental/testing/server` 的 `unstable_doesProxyMatch`，可断言 matcher 覆盖范围；本次未引入。matcher 的实际覆盖改由本地与线上 curl 验证（阶段 2/3）。
- **不把 proxy 当作完整鉴权方案**：按 Next.js 16.3.8 官方文档（`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`）的明确指引，proxy 仅做 cookie 存在性的乐观检查；伪造 cookie 可拿到空的工作台外壳，但所有数据请求仍由 API 层会话校验拦下（401）。此项已在 plan.md 列为非目标。
- **`?next=` 回跳未实现**：登录成功后仍按既有逻辑跳 `/console`，不回到被拦截前的目标页。

## MVP 验收

对照 plan.md §7 逐项：

1. [x] 匿名访问 `/console`、`/console/**`、`/onboarding` 均被重定向到 `/login`（线上实测 307）。
2. [x] `/`、`/login`、`/register`、`/auth/callback` 匿名可访问（线上 200）。
3. [x] `/api/v1/**` 响应语义不变（仍为 JSON，未登录仍 401，无重定向）。
4. [x] 已登录路径行为不变（携带生产会话 cookie 名时 `/console` 为 200）。
5. [x] `lib/auth/route-guard.test.ts` 覆盖前缀边界与公共路径；`lint`/`tsc`/`vitest`/`build` 全绿。
6. [x] 本记录与实际交付一致，未完成项均保持未勾选并写明原因。

剩余风险：proxy 为乐观检查（仅看 cookie 是否存在），伪造 cookie 可获得空工作台外壳，但所有数据请求仍被 API 层 401 拦下；真实会话校验仍由 API 层承担。matcher 若被后续改动收窄会静默削弱覆盖，故 `route-guard` 内部也独立校验受保护前缀。

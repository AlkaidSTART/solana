# 计划：未登录访问受保护页面时拦截到 /login

## 1. 背景

支付链路已验收通过后，需求方提出：**没有登录注册（即未建立会话）时，受保护页面应被拦截并跳转到 `/login`**。

当前状态：

- 仓库根目录**没有任何 `proxy.ts` 或 `middleware.ts`**，因此 `/console/**` 对匿名访客直接返回 200，匿名访客能看到整个工作台外壳。
- 工作台内的页面是客户端组件，靠各自调用的 `/api/v1/**` 返回 401 来"失败"，但页面本身不会被拦截，也不会跳转登录页 —— 表现为进入工作台后到处是报错，而不是被引导去登录。
- API 层**已经**是真权威：未登录调用 `POST/GET /api/v1/payments/session`、`POST /api/v1/payments/orders` 均返回 401（已线上实测）。

## 2. 目标

1. 未建立会话的访客访问 `/console/**` 或 `/onboarding/**` 时，被重定向到 `/login`。
2. 公共页面不受影响：`/`（落地页）、`/login`、`/register`、`/auth/callback`。
3. 静态资源与 API 路由不受影响（不得拦截 `_next/static`、`_next/image`、`public/` 资源，也不得把 `/api/v1/**` 的 JSON 401 变成 HTML 跳转）。
4. 不引入回归：已登录用户访问工作台行为不变。

## 3. MVP 范围

- 新增共享 cookie 名模块 `lib/auth/session-cookies.ts`（纯函数，无 `server-only`、无数据库依赖），供 `lib/server/auth/session.ts` 与 `proxy.ts` 共用，避免 cookie 名在两处各自硬编码而漂移。
- 改造 `lib/server/auth/session.ts` 使用该共享模块（移除其内部的 `SESSION_COOKIE_BASE`/`CSRF_COOKIE_BASE` 与同名局部函数）。
- 新增纯函数 `lib/auth/route-guard.ts`：`isProtectedPath(pathname)` 与 `decideRouteAccess({ pathname, hasSession })`。
- 新增根目录 `proxy.ts`：用 `NextRequest.cookies.has(sessionCookieName())` 做**乐观检查**，未命中且路径受保护则 `NextResponse.redirect(new URL("/login", request.url))`；`matcher` 限定为受保护前缀。
- 新增单元测试 `lib/auth/route-guard.test.ts`。

## 4. 非目标

- **不**把 proxy 当作完整鉴权方案。按本地 Next.js 16.3.8 文档（`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`）："Proxy is _not_ intended for slow data fetching... it should not be used as a full session management or authorization solution"，且 "Proxy is meant to be invoked separately of your render code... you should not attempt relying on shared modules or globals"。因此 proxy 只做 cookie 存在性的乐观检查；**真正的授权仍以 API 层的会话校验为准**（已实现并实测）。
- 不在 proxy 中访问数据库校验会话（避免给每次导航加一次 DB 往返，也避免在 proxy 中持有连接池）。已知代价：伪造/过期的 cookie 能通过 proxy 拿到工作台外壳，但其所有数据请求仍会 401。
- 不把 `/api/v1/**` 纳入 matcher（否则会把 API 的 401 变成 HTML 跳转，破坏客户端逻辑）。
- 不实现 `?next=` 回跳参数（登录成功后仍按现有逻辑跳 `/console`）。
- 不改造 `app/console/layout.tsx` 为服务端组件（该项工作量与风险大，且与乐观检查的定位重复）。
- 不改动登录/注册页面本身的可见性。

## 5. 风险与依赖

| 项 | 说明 | 处置 |
| --- | --- | --- |
| matcher 漏配会拦截静态资源 | 文档明确警告：无 matcher 或负向匹配写错会导致 CSS/JS/图片被重定向 | 使用显式 matcher `['/console/:path*', '/onboarding/:path*']`，不用全站负向匹配 |
| matcher 变更会静默削弱覆盖 | 文档警告 matcher 改动会悄悄移除 proxy 覆盖 | `route-guard` 自身也校验受保护前缀，不完全依赖 matcher |
| cookie 名生产/开发不同 | 生产为 `__Host-solaflow_session`，开发为 `solaflow_session` | 由共享模块按 `NODE_ENV` 统一决定，proxy 与 session 层共用同一函数 |
| 乐观检查可被伪造 cookie 绕过 | 仅拿到空壳页面 | 记入非目标；API 层 401 为真权威 |
| Next 16 中 `middleware.ts` 已废弃 | 文件与导出名都变了 | 使用 `proxy.ts` + 具名导出 `proxy`（已核对本地文档） |

## 6. 阶段拆分与验证

- [ ] 阶段 1：共享 cookie 名 + 纯函数守卫 + 单元测试。
  - 交付：`lib/auth/session-cookies.ts`、`lib/auth/route-guard.ts`、`lib/auth/route-guard.test.ts`；改造 `lib/server/auth/session.ts`。
  - 测试 T1：`pnpm exec vitest run lib/auth`；预期：覆盖 `/console`、`/console/billing` 等子路径为受保护；`/consoleX` 这类前缀相似的路径**不**受保护；`/`、`/login`、`/register`、`/auth/callback` 不受保护；`hasSession` 为真时一律放行。
  - 测试 T2：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm exec vitest run`（全量）全绿。
- [ ] 阶段 2：接入 `proxy.ts`。
  - 测试 T3：`pnpm build` 通过，构建产物中出现 proxy。
  - 测试 T4：本地 `pnpm dev` 下 `curl -I http://localhost:3000/console` 预期 307 到 `/login`；带合法会话 cookie 时预期 200。
- [ ] 阶段 3：线上验证。
  - 测试 T5：`curl -I https://solana-neon-ten.vercel.app/console` 与 `/console/billing`、`/onboarding` 预期重定向到 `/login`；`/`、`/login`、`/register` 仍为 200。
  - 测试 T6：`/api/v1/**` 仍返回 JSON 401（未被跳转）；静态资源仍为 200。
  - 测试 T7：已登录会话访问 `/console` 仍为 200（用验收时的真实会话验证）。

## 7. 最终验收标准

1. 匿名访问 `/console`、`/console/**`、`/onboarding` 均被重定向到 `/login`。
2. `/`、`/login`、`/register`、`/auth/callback` 匿名可正常访问。
3. `/api/v1/**` 的响应语义不变（仍是 JSON，未登录仍 401）。
4. 已登录用户访问工作台行为不变（200）。
5. `lib/auth/route-guard.test.ts` 覆盖前缀边界与公共路径，`pnpm lint`/`tsc`/`vitest`/`build` 全绿。
6. `result.md` 与实际交付一致，未完成项保持未勾选。

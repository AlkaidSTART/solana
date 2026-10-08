# 计划：统一后端接口至 /api/v1 规范（支付接口迁移）

## 背景与目标
- 当前 SolaFlow AI 后端接口中，除支付模块（`app/api/payments/**`）外，所有接口均已统一遵循 `/api/v1/**` 规范。
- 需求目标：将支付模块所有接口完整迁移至 `app/api/v1/payments/**`，移除旧非版本化路由，使全仓库所有后端接口路径统一以 `/api/v1` 开头。

## MVP 范围
1. 迁移 Route Handlers：
   - `app/api/payments/orders/route.ts` → `app/api/v1/payments/orders/route.ts`
   - `app/api/payments/orders/[id]/route.ts` → `app/api/v1/payments/orders/[id]/route.ts`
   - `app/api/payments/billing/route.ts` → `app/api/v1/payments/billing/route.ts`
   - `app/api/payments/session/route.ts` → `app/api/v1/payments/session/route.ts`
   - `app/api/payments/sol-test/quote/route.ts` → `app/api/v1/payments/sol-test/quote/route.ts`
   - `app/api/payments/sol-test/check/route.ts` → `app/api/v1/payments/sol-test/check/route.ts`
2. 清理旧目录：完全移除 `app/api/payments/`。
3. 客户端适配：更新 `lib/payments/client.ts` 中的请求前缀为 `/api/v1/payments/${path}`。
4. 测试用例适配：
   - `lib/server/payments/http.test.ts`：更新动态路由导入路径与 Request URL。
   - `lib/server/payments/sol-test/http.test.ts`：更新 Request URL。
   - `tests/e2e/payments.spec.ts`：更新 Playwright route 匹配规则。
   - `tests/e2e/sol-test.spec.ts`：更新 Playwright route 匹配规则。
5. 文档更新：在 `docs/API.md` 中同步记录 `/api/v1/payments/**` 接口。

## 非目标
- 不变更支付数据契约、签名校验、Solana 链上交互或幂等逻辑。
- 不合并 `lib/server/payments/**` 与现有 `lib/server/services/billing/**` 逻辑。
- 不引入重定向或冗余适配层（全端点直接使用标准 `/api/v1`）。

## 风险与依赖
- Next.js App Router 动态路由参数类型生成依赖 `pnpm exec next typegen`。
- Playwright E2E 拦截路径若有遗漏会导致 UI 测试超时或报错，需全面校验。

## 阶段拆分
- **阶段 1：Route Handler 迁移与客户端请求更新**
  - 复制/移动 6 个 Route Handler 至 `app/api/v1/payments/**`。
  - 彻底删除 `app/api/payments/**`。
  - 更新 `lib/payments/client.ts`。
- **阶段 2：测试与文档适配**
  - 更新单测/集成测试中的路由导入与 URL (`http.test.ts`, `sol-test/http.test.ts`)。
  - 更新 E2E 测试中的 mock 路径 (`payments.spec.ts`, `sol-test.spec.ts`)。
  - 更新 `docs/API.md`。
- **阶段 3：全量验证与构建交付**
  - 运行单元与集成测试：`pnpm exec vitest run`。
  - 运行 E2E 测试：`pnpm exec playwright test`。
  - 静态检查与全量构建：`pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm lint && pnpm build`。

## 各阶段测试步骤、输入及预期
- **阶段 1 测试**：
  - 检查文件树：`find app/api -maxdepth 2`，预期仅有 `app/api/v1`。
- **阶段 2 测试**：
  - 运行支付相关单元测试：`pnpm exec vitest run lib/server/payments`，预期全部通过。
- **阶段 3 测试**：
  - 运行全量单元测试：`pnpm exec vitest run`，预期 18 文件 194+ 用例全部通过。
  - 运行 Playwright E2E：`pnpm exec playwright test`，预期 15 用例全部通过。
  - 运行编译检查：`pnpm exec next typegen && pnpm exec tsc --noEmit && pnpm lint && pnpm build`，预期 0 错误 0 警告。

## 最终验收标准
1. `app/api` 下不存在除 `v1` 以外的任何直接子目录或路由文件。
2. 所有支付相关功能通过 `/api/v1/payments/**` 正常工作。
3. 自动化测试套件（Vitest + Playwright）全部通过。
4. 项目构建与类型检查通过。

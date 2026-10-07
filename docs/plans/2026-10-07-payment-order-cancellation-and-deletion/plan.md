# 充值支付订单取消与删除支持

## 背景 / 目标
在 Devnet Credits 充值支付模块中，当前用户创建报价后若不想付款，只能点击“关闭”隐藏弹窗；后端与订单列表无取消状态，且列表缺少删除功能，导致未付款和废弃的测试报价永久堆积。
本需求按 MVP 闭环提供订单退出取消与删除能力，同时严格维护财务账本不变量：已入账订单作为法律/财务流水凭据严禁删除或取消。

## MVP 范围
1. **状态流转与仓储支持**：
   - `PaymentOrder` 状态新增 `'cancelled'`（已取消），更新模式约束与契约模式。
   - `PaymentRepository` 增加 `cancel(id, tenant)`：原子将待付款（`awaiting_payment`）订单更新为已取消。
   - `PaymentRepository` 增加 `delete(id, tenant)`：仅允许删除非入账（`awaiting_payment`、`expired`、`cancelled`）订单；级联清理候选审计记录，禁止删除 `credited`（已入账）与 `confirmed`（链上确认中）订单。
   - `reconcile` 与 `pending()` 过滤已取消订单，防止后台 worker 无效轮询。
2. **HTTP API 边界**：
   - `DELETE /api/payments/orders/[id]`：严格检验 Origin 与租户会话，调用删除逻辑并返回 `{ success: true, id }`。
   - `PATCH /api/payments/orders/[id]`：支持 `{ status: "cancelled" }`，调用取消逻辑并返回最新 Checkout。
3. **前端交互与状态分层**：
   - 弹窗 `SolanaPayModal`：增加“取消订单”和“删除订单”操作，执行后失效账本缓存并关闭弹窗；已取消状态隐藏二维码与钱包支付；更新说明文案。
   - 列表 `BillingPayments`：订单列表展示“已取消”状态；为未付款订单提供“取消订单”按钮，为非入账（待付款/已取消/已过期）订单提供“删除订单”按钮；已入账订单不可删除。
4. **自动化测试覆盖**：
   - Vitest 覆盖仓储取消与删除单元测试、非法状态拒绝、跨租户隔离、级联清理。
   - Vitest 覆盖 Route Handler 鉴权、Origin 校验、方法约束。
   - Playwright 覆盖浏览器内弹窗取消退出、弹窗删除退出、列表删除订单的端到端交互。

## 非目标
- 主网真实退款或撤销链上已广播交易（区块链交易不可逆）。
- 删除已入账流水（`test_credit_ledger` 与 `payment_transfers` 严禁删除）。
- 重构其他业务域（WooCommerce 电商订单保持原逻辑）。

## 风险 / 依赖
- 财务安全性：已入账（`credited`）订单受数据库外键和业务规则双重保护，试图删除必须 fail closed 并抛出明确异常。
- 并发与孤儿数据：删除订单前必须先清理 `payment_candidates`，或在事务中原子删除。
- 依赖兼容性：使用 Next.js App Router、TanStack Query 缓存失效、TypeScript 严格模式，不引入新外部依赖。

## 阶段与验证步骤

### 阶段 1：领域模型、数据库契约与仓储（T1）
- 修改 `lib/payments/contracts.ts`、`lib/server/payments/schema.sql`、`lib/server/payments/repository.ts`、`lib/server/payments/reconcile.ts`。
- 测试输入：
  - 取消 `awaiting_payment` 订单 -> 变为 `cancelled`。
  - 取消非 `awaiting_payment` 订单 -> 拒绝返回 null。
  - 删除 `awaiting_payment` / `expired` / `cancelled` 订单 -> 成功删除且清理 candidate。
  - 删除 `credited` 订单 -> 抛出错误拒绝。
  - 删除 `confirmed` 订单 -> 抛出错误拒绝。
  - 跨租户删除/取消 -> 拒绝。
- 运行命令：`pnpm exec vitest run lib/server/payments/repository.test.ts`。

### 阶段 2：Route Handler API 与安全边界（T2）
- 修改 `app/api/payments/orders/[id]/route.ts`。
- 增加 `DELETE` 和 `PATCH` 请求处理，校验 Origin、Session、Zod 参数。
- 测试输入：未登录、非法 Origin、跨租户删除、删除不存在订单、已入账订单删除拒绝、正常取消、正常删除。
- 运行命令：`pnpm exec vitest run lib/server/payments/http.test.ts`。

### 阶段 3：前端弹窗与列表交互实现（T3）
- 修改 `components/billing/solana-pay-modal.tsx` 与 `components/billing/billing-payments.tsx`。
- 接入 TanStack Query mutations，弹窗与列表按钮无缝响应，焦点与可访问性保持良好。
- 修复 `lib/payments/sol-test/` 中的 ES2017 BigInt/Address 类型问题确保全量类型健全。
- 补充 `tests/e2e/payments.spec.ts` 针对取消和删除的测试用例。
- 运行命令：`pnpm exec vitest run` 与 `pnpm exec playwright test`。

### 阶段 4：门禁验收与交付（T4）
- 运行 `pnpm lint`。
- 运行 `pnpm exec next typegen && pnpm exec tsc --noEmit`。
- 运行 `pnpm build`。
- 核验 `git diff --check` 与 `result.md` 交付记录。

## 最终验收标准
1. 充值支付弹窗中支持直接取消订单或删除订单并退出，退出后列表相应更新。
2. 订单列表可直接取消待付款订单，并可删除非入账（待付款、已取消、已过期）订单。
3. 已入账订单受到严格保护，无删除/取消入口，后端拒绝任何对已入账订单的删除请求。
4. 全量自动化测试（Vitest + Playwright）全部通过，类型检查与构建无错误。

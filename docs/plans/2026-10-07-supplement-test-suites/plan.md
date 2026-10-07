# 测试套件与业务测试样例补充计划

## 背景与目标
根据 `AGENTS.md` 第 9 节《测试策略与固定样例》以及 `docs/PRD.md` 第 8 节《验收标准》（AC-01～AC-28），项目需补全端到端核心业务不变量的自动化回归用例。
目前仓库已具备 `lib/payments/verify.test.ts` 及 `lib/server/payments/repository.test.ts`（40 项用例），但在：
1. `package.json` 缺少统一 `test` 运行脚本；
2. 服务端支付 HTTP 安全协议（Origin 验证、报文大小限制 2048 字节、Content-Type 校验、fail-closed 状态码映射）；
3. PRD 核心业务规则（15 分钟催付决策、静默时段抑制、退订熔断、COD 意愿流转、Credits 24 小时固定计费窗口与 20 条上限、RBAC 角色权限矩阵）
尚缺少明确纯函数实现与同目录可运行的单元测试覆盖。

## MVP 范围
1. **统一测试脚本**：在 `package.json` 的 `scripts` 中补充 `"test": "vitest run"`，支持标准测试指令。
2. **服务端 HTTP 传输与安全校验测试**：
   - 创建 `lib/server/payments/http.test.ts`。
   - 覆盖：`readBody`（非 JSON 415、超大包 413、畸形 JSON 400）、`assertOrigin`（来源白名单校验 403）、`paymentResponse`（PaymentHttpError、ZodError 400、未知异常 503 fail-closed 兜底）。
3. **PRD 核心业务决策引擎与测试样例**：
   - 创建 `lib/rules/workflow.ts` 实现 PRD 规定的纯业务规则（催付决策、COD 状态机、Credits 计费窗口、RBAC 权限矩阵）。
   - 创建 `lib/rules/workflow.test.ts` 提供详尽测试用例，严格覆盖 AGENTS.md 固定样例表中的正常路径、边界输入、异常抑制、状态流转与权限隔离。
4. **全量执行与验证**：执行 `pnpm test`，验证所有既有与新增用例全部通过。

## 非目标
- 不连接真实外部网络或消耗真实代币。
- 不重构现有 UI 页面。
- 不引入与 PRD 冲突的非首版逻辑。

## 风险与依赖
- `vitest` 与 `pglite` 已在 devDependencies 中，必须保证用例无外部数据库或网络依赖，纯内存执行。
- 业务规则必须严格遵照 PRD v1.1，不得凭空发明规则（如 21:00～09:00 静默时段、15 分钟催付、1 Credit/24h/20条消息）。

## 阶段拆分
- **阶段 1（T1）：配置脚本与 HTTP 安全测试**
  - 在 `package.json` 中添加 `"test": "vitest run"`。
  - 编写 `lib/server/payments/http.test.ts`，覆盖 `readBody`、`assertOrigin`、`paymentResponse`。
  - 运行测试并验证。
- **阶段 2（T2）：PRD 核心业务规则与测试用例落地**
  - 编写 `lib/rules/workflow.ts`：催付检查、COD 确认、Credits 窗口判定、RBAC 矩阵。
  - 编写 `lib/rules/workflow.test.ts`：覆盖正常、边界、静默时段、退订、人工接管、并发多订单与越权拒绝。
- **阶段 3（T3）：全量测试与质量闸门验收**
  - 运行 `pnpm test`。
  - 执行 `pnpm lint` 和 `pnpm exec next typegen && pnpm exec tsc --noEmit`。
  - 完善 `result.md`，记录测试用例清单与覆盖情况。

## 验收标准
1. `pnpm test` 命令可用，全量用例（既有 40 项 + 新增用例）100% 通过无失败。
2. 覆盖 PRD 核心催付、COD、Credits 窗口及 RBAC 安全矩阵。
3. 代码通过类型检查与 lint。

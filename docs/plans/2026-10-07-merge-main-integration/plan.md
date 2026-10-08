# 选择性合并 main 支付模块、修复并交付计划

> **执行约束：**主智能体在当前 `develop` 分支实施；已获用户明确授权的 Luna 子智能体仅执行只读审查，不写共享工作区。严格控制验证数量，不运行全量测试、主网交易或生产数据库操作。

**目标：**保留 `main@d848aaf` 的支付模块，仓库其余业务代码恢复为合并前我们的 `develop@7888477`；解决两套代码在根依赖和构建边界上的必要兼容问题，形成可审计的双父 merge commit，推送到 GitHub `origin/develop`，随后本地录制以支付模块为主、包含一次真实最小额 Devnet 支付的 Demo。

**选择原则：**支付模块以 `main` 为唯一基线；其余应用代码以 merge commit 第一父提交（ours）为基线。`package.json`、锁文件、pnpm 构建策略、Next/Vitest/Playwright 配置、支付测试支撑与 `.gitignore` 属于必要集成边界，按真实依赖做最小并集，不机械地整文件择边。

## 背景与当前状态

- 当前分支为 `develop`，本地未推送 merge commit 为 `fb0f66c`；第一父提交为我们的 `7888477`，第二父提交为 `origin/main@d848aaf`，工作区起始干净。
- 初次合并已证明 Kit 8.4.0、Phase 1 与 main 支付代码可共同通过类型检查、定向测试和构建，但当时带入了 main 的非支付页面与全站视觉代码。
- 用户进一步明确最终仲裁：支付模块使用 main，其余采用我们的版本；完成后推送 GitHub，并本地录制支付 Demo，其中包含真实最小支付使用。
- 三路 Luna 只读审查确认 main 支付代码不依赖 main 的全局布局、主题、store、i18n、landing 或通用 UI；它可挂载在我们的 console layout 与 Tailwind 4 全局样式下。

## MVP 范围

1. 保留 main 支付运行时：`app/api/payments/**`、`app/console/billing/page.tsx`、`app/console/billing/sol-test/**`、`components/billing/**`、`lib/payments/**`、`lib/server/payments/**`、`scripts/payment-*`。
2. 保留 main 支付定向测试和支撑：支付 Vitest、两份支付 Playwright spec、payment/sol-test fixtures、`server-only` 测试替身及必要测试配置。
3. 将初次合并引入的其余非支付应用/文档代码恢复为 `develop@7888477`；`app/api/v1/billing/**` 与 Phase 1 服务保持我们的版本。
4. 根 manifest 保留我们的 BullMQ/ioredis/postgres/motion/three 等依赖，并保留 main 支付的 Kit 8.4、system/token/plugins、TanStack Query、pg、qrcode、server-only 与支付测试依赖；移除最终源码未使用的 `@solana/pay` 与 `gsap`。
5. 更新既有 merge commit 而不改写 `main`；执行最小 lint、typecheck、支付/结算定向测试和一次构建。
6. 推送 `develop` 到 `origin/develop`，核验远端对象与 ahead/behind。
7. 在本地启动支付模块，用隔离临时钱包和 Devnet 水龙头资金完成一次最小额真实 SOL 转账，等待 `finalized` 并由支付页面/API 核验；录制页面进入、付款参数、链上核验与结果反馈。

## 非目标

- 不重构 main 的支付订单、钱包、RPC、对账、取消/删除或 Devnet SOL/USDC 流程。
- 不统一 `/api/payments/**` 与我们的 `/api/v1/billing/**` 数据模型、认证会话或账本。
- 不运行全量 Vitest、完整 Playwright 套件、多视口矩阵、真实生产 PostgreSQL/Redis、主网钱包或主网资金交易。
- 不推送或修改 `main`，不 force push，不提交 Demo 视频、浏览器缓存、临时钱包或密钥。

## 风险与依赖

- 支付模块要求 `@solana/kit@8.4.0`，而我们的旧 manifest 使用 Kit 6.10；最终依赖必须以 Kit 8 为准并以类型检查确认 Phase 1 兼容。
- 我们的后端实际使用 BullMQ、ioredis 与 postgres；不能因选择 main 支付而删除这些共享依赖。恢复 ours 后源码不再导入 main 新增的 `gsap`，因此该依赖不保留。
- 支付账单 API 依赖 PostgreSQL；Demo 必须使用隔离本地数据库或模块现有安全测试路径，不连接生产库。
- Devnet 水龙头/RPC 属于外部服务，可能限流。只生成本次使用的临时密钥，录制完成后删除；视频和日志不得出现私钥。若水龙头不可用，应如实记录外部阻塞，不伪造成功。
- GitHub 推送属于外部状态变更，已获用户本轮明确授权；只推送当前 `develop` 到其同名远端，不使用强推。
- 视频录制依赖本机 Playwright 浏览器能力；若 MP4 转码工具不可用，交付浏览器原生 WebM，并明确格式。

## 阶段拆分与验证

### 阶段 1：选择边界与计划更新

- [x] 记录当前 merge 双亲、远端状态和干净工作区。
- [x] 由三名 Luna 分别审查支付路径闭包、manifest/config 并集、main/ours 路径选择；主智能体汇总白名单。
- [x] 在任何选择性代码修改前更新本计划与 `result.md`。
- 测试 T1：`git status --short --branch`、静态 import/路径审查；预期：支付闭包可独立挂载在 ours 全局壳层，且工作区没有待保护的用户改动。

### 阶段 2：按模块选择版本

- [ ] 以 `HEAD^1` 为 ours 基线，恢复所有非支付代码；保留本计划目录和明确支付白名单。
- [ ] 保留必要集成文件的最小并集：manifest/lock/workspace、Next/Vitest/Playwright 配置、支付测试支撑、支付产物忽略规则。
- [ ] 重新生成 lockfile，并用 frozen install 反验 manifest/lock 一致。
- 测试 T2：精确路径 diff、未合并/冲突标记扫描、`pnpm install --frozen-lockfile`；预期：支付白名单与 `HEAD^2` 相同，非支付路径与 `HEAD^1` 相同，例外全部可解释。

### 阶段 3：最小错误修复与验证

- [ ] 运行 lint 与 Next typegen/TypeScript 检查；仅修复选择性合并造成的实际错误。
- [ ] 仅运行支付验证、支付 repository/SOL service 与我们的 settlement 高风险定向测试。
- [ ] 运行一次 webpack 生产构建；保留必要的 `serverExternalPackages: ["bullmq"]` 集成边界。
- 测试 T3：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、4 个定向 Vitest 文件、`pnpm build`；预期全部退出 0，无未处理 warning/error。不运行全量 E2E。

### 阶段 4：提交与 GitHub 推送

- [ ] 更新 `result.md`，运行 `git diff --check`、AGENTS 行数、敏感/冲突标记与最终路径归属审查。
- [ ] amend 当前未推送 merge commit，保持双亲为 `7888477` 与 `d848aaf`；确认工作区干净。
- [ ] 以非强制方式推送 `develop:develop`，读取远端 ref，核验本地/远端提交一致且 ahead/behind 为 0/0。
- 测试 T4：`git show --format=%P`、`git ls-remote origin refs/heads/develop`、`git rev-list --left-right --count HEAD...origin/develop`；预期父提交正确、远端对象等于本地 HEAD。

### 阶段 5：本地真实 Devnet 支付 Demo 录制

- [ ] 使用隔离本地数据库/配置在独立端口启动当前已推送提交，确认 `/console/billing` 与 `/console/billing/sol-test` 可访问。
- [ ] 创建临时付款/收款钱包，仅申请 Devnet 水龙头资金；通过支付模块生成最小额报价/订单，提交真实 Devnet SOL 交易并等待 `finalized`。
- [ ] 录制支付模块主流程与真实链上核验结果；画面明确显示 Devnet、最小金额和交易签名/状态，不展示私钥，不宣称主网或生产到账。
- [ ] 视频保存到被忽略的 `test-results/demo/`；检查媒体元数据，删除临时私钥文件，停止服务并确认仓库仍干净。
- 测试 T5：链上 RPC 查询与模块核验结果一致；视频存在、大小大于 0、可读取基本媒体元数据且 Git 不跟踪。

## 最终验收标准

1. 最终双父 merge commit 只从 main 采用支付模块及其必要集成支撑；所有其他业务代码等同我们的 `develop@7888477`。
2. main 支付保护路径内容不被改写，Kit 保持 8.4.0；ours 的 Phase 1、队列、数据库及非支付 UI 保持可编译。
3. frozen install、lint、typecheck、4 个定向测试和一次生产构建通过；未执行的生产外部能力如实记录。
4. `origin/develop` 与本地 `develop` 指向同一提交，未 force push、未更改 `main`，远端核验为 0/0。
5. 本地 Demo 视频可读取，展示真实、finalized 的最小额 Devnet 支付闭环，不包含私钥、主网交易或伪造成功，录制后工作区干净。

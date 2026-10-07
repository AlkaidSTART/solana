# Solana Pay SDK 安装计划

**目标：**在当前仓库根应用安装用户指定的 `@solana/pay@beta` 与兼容的 `@solana/kit`，同步 pnpm 锁文件并验证本地可用。

**实施方式：**在当前工作区由主智能体顺序实施，保留已有后端及配置改动；不使用子智能体。只增加依赖与本需求文档，不实现支付业务。

**技术栈：**pnpm 11.17.0、Node.js 24.15.0、Next.js 16.3.8、TypeScript 5。

## 背景与依据

- 用户提供安装指令 `npm install @solana/pay@beta @solana/kit`；仓库要求只使用 pnpm，因此改用等价 pnpm 命令。
- 已阅读根 `AGENTS.md`、Solana 开发技能、PRD 中的 Solana Pay 边界和已安装 Next.js 的安装指南。
- 官方安装指南：https://solana.com/docs/tools/solana-pay/quickstart/installation。
- 2026-10-07 npm registry 元数据：Pay beta 为 `1.0.0-beta.14`，其 Kit peer 为 `^6.5.0`；Kit 最新为 `8.4.0`，该范围内版本为 `6.10.0`。
- 当前 Node.js 满足 Pay 的 `>=20` 和 Kit 的 `>=20.18.0` 要求。

## MVP 范围与文件

- `package.json`：在根应用添加两个运行时依赖并固定本次已核验版本。
- `pnpm-lock.yaml`：由 pnpm 更新，保留已有 workspace 依赖。
- 本计划与对应 `result.md`：记录各阶段实际证据。
- 安装所需 peer 由 pnpm 默认机制解析，检查安装输出与实际导入，不额外引入钱包或测试框架。

## 非目标

- 不实现钱包、支付页面、RPC 调用、转账、余额或 finalized 入账逻辑。
- 不升级 Kit 到 8.x，不使用 npm/yarn，不创建其他锁文件。
- 不修改已有后端、TypeScript、ESLint 或 workspace 设置，不提交或推送。
- 无 UI、认证、账本或网络业务修改，相应 E2E、权限、幂等与真实支付矩阵不适用。

## 风险、依赖与替代方案

- Pay 是预发布 SDK，固定 `1.0.0-beta.14`；后续升级须重新核验 peer 与业务行为。
- 用户未指定 Kit 主版本，安装 `6.10.0` 以满足 Pay peer，避免直接安装 Kit 8.4.0 产生不兼容组合。
- 替代方案是更换 Pay 版本或整体迁移到 Kit 8；超出本次安装范围。
- 依赖下载需要 registry 网络；失败时如实记录并保留未完成项。
- 工作区已有其他需求的未提交改动；只追加本需求记录，不重置、清理或覆盖历史。
- SDK 安装与离线验证不能证明真实钱包或链上支付可用。

## 阶段、测试输入与预期

### 阶段 1：计划及兼容性检查

- [x] T1：读取 git 状态、manifest、workspace 与规则；执行 `node --version`、`pnpm --version`、`pnpm view @solana/pay@beta version engines peerDependencies dependencies repository --json`、`pnpm view '@solana/kit@^6.5.0' version engines --json`；预期工具版本及 Kit peer 兼容，变更边界明确。
- [x] 在安装前完成本计划，并在对应 `result.md` 追加本需求阶段记录。

### 阶段 2：安装与离线 SDK 验证

- [x] 执行 `pnpm add -w --save-exact @solana/pay@beta @solana/kit@6.10.0`；预期两个根依赖及锁文件同步，无本次 SDK peer 冲突。
- [x] T2：执行 `pnpm list @solana/pay @solana/kit --depth 0`、`pnpm install --frozen-lockfile`；预期版本分别为 `1.0.0-beta.14`、`6.10.0` 且冻结安装成功。
- [x] T3：使用 `node --input-type=module` 导入 Kit 的 `address` 和 Pay 的 `encodeURL`、`parseURL`；仅离线生成并解析带测试商户标签的 URL，断言接收地址及标签一致，断言非法地址被拒绝；预期导入成功、URL 往返正确、异常输入拒绝。不发送交易。
- [x] 更新对应 `result.md` 的安装及验证结果后进入阶段 3。

### 阶段 3：项目检查与验收

- [x] T4：执行 `pnpm lint`、`pnpm exec next typegen`、`pnpm exec tsc --noEmit`、`pnpm build`；预期现有应用质量检查通过，失败时区分安装引入或其他任务已有问题。
- [x] T5：审阅 manifest/锁文件差异，核对之前的 scripts/dependencies 和 workspace 配置保留；检查无 `package-lock.json` / `yarn.lock`，统计 `AGENTS.md` 行数并执行 `git diff --check`；预期无越界修改、规则不超过 200 行、无新增空白错误。
- [x] 完成对应 `result.md` 的最终验收记录。

## 最终验收标准

1. 两个指定 SDK 在根应用安装，manifest/锁文件一致，版本满足 peer 约束。
2. 冻结安装、离线正常/异常输入验证通过。
3. 项目检查无本次安装引入的未处理失败；其他任务已有或并发问题独立记录，不误报整个仓库通过。
4. 不产生其他包管理器锁文件，已有改动保留，计划与结果一致。

## 实际验收

- T1–T5 通过；安装、冻结安装、离线 SDK 断言、类型检查及生产构建退出码均为 0。
- lint 退出 0，有 1 条来自当时并发工作文件 `backend/src/app.ts:64:70` 的 `_next` 未使用警告，不记作零警告。
- 与安装前读取的根 manifest/workspace 对比：原依赖、scripts 和其他字段不变，仅增加两个 SDK 依赖，workspace 配置不变。
- `AGENTS.md` 为 139 行；没有生成 npm/yarn 锁文件；`git diff --check` 通过。
- 仅安装 SDK，不运行无关后端业务测试或 UI E2E，不将本次离线验收等同于真实支付验收。

# SolaFlow AI

> 面向东南亚跨境电商的 WhatsApp 多语言智能订单助手与自动化引擎。
> Multilingual WhatsApp order assistant & automation engine for Southeast Asia cross-border e-commerce.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.8-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-11.17.0-orange?style=flat&logo=pnpm)](https://pnpm.io/)
[![Solana](https://img.shields.io/badge/Solana-Pay%20USDC-14F195?style=flat&logo=solana)](https://solana.com/)

---

## 1. 产品定位与核心价值

SolaFlow AI 专为中国出海东南亚及东南亚本地中小电商卖家打造。产品围绕独立站订单履约生命周期，通过官方 WhatsApp Business Platform（Cloud API）提供自动化触达、智能多语言应答与人工接管支持。

### 核心解决场景

| 业务场景 | 痛点 | SolaFlow AI 解决方案 | 预期成效 |
| :--- | :--- | :--- | :--- |
| **场景 A：未支付订单催付** | 东南亚独立站弃单率高，人工难以 24 小时跟进 | 订单创建 15 分钟后触发，核验订单、同意记录与静默时段后发出带安全恢复链接的本地化模板 | 提升待支付订单挽回率（内测目标支付率 ≥15%） |
| **场景 B：COD 发货前确认** | 货到付款（COD）拒签与虚假地址导致高额往返物流损失 | 订单创建 5 分钟后触发，向买家核验收货意愿，收集改址/取消诉求并同步商户审核 | 降低无谓发货与拒签率（内测目标下降 5～8 个百分点） |
| **场景 C：夜间多语言咨询** | 跨时区夜间咨询无人应答，本地俚语与缩写识别困难 | 在 24 小时服务窗口内以印尼语（支持常见俚语缩写）及英语自动解答商品与 FAQ | 缩短响应时间，保障夜间流量不流失 |
| **场景 D：原子人工接管** | 机器误答或买家投诉导致客诉风险升级 | 买家申请人工、改址/取消、退款投诉或达消息上限时，原子挂起自动化并进入专属客服队列 | 明确服务责任边界，保障高风险订单安全 |
| **场景 E：链上服务费结算** | 传统跨境小额支付开户难、费率高、账期长 | 商户端使用 Solana Pay 原生 USDC 充值服务费与自动化 Credits，基于 finalized 交易单次原子入账 | 充值秒级确认，点数流水清晰可审计 |

> ⚠️ **关键业务边界**：
> - **买家货款与物流款**：买家商品货款仍在商户原有电商网关结算，COD 仍按商户既有物流渠道收款；本系统**不介入买家货款交易**。
> - **Solana Pay 用途**：仅用于商户向 SolaFlow AI 购买软件订阅套餐和充值自动化 Credits。
> - **无自动平台改单**：系统记录买家改址、取消或意愿证据，由商家确认后在原平台操作，不擅自修改商户电商后台订单。

---

## 2. 首发范围与扩展路线

根据 [PRD v1.1](docs/PRD.md) 规划，系统严格界定首发交付边界：

```
                    ┌────────────────────────┐
                    │      首发版本 (MVP)     │
                    │  - WooCommerce 独立站   │
                    │  - 印尼语 / 英语        │
                    │  - WhatsApp Cloud API  │
                    │  - 印尼市场 15m 催付/COD │
                    │  - Solana Devnet/USDC  │
                    └───────────┬────────────┘
                                │ 验证通过后演进
                                ▼
                    ┌────────────────────────┐
                    │      后续扩展路线       │
                    │  - Shopify 独立站      │
                    │  - TikTok Shop / Shopee│
                    │  - 泰语 / 越南语 / 马来语 │
                    │  - Solana 主网原生结算   │
                    └────────────────────────┘
```

### 范围对照表

| 维度 | 首发版本 (MVP) 包含 | 后续扩展或非目标 |
| :--- | :--- | :--- |
| **电商平台** | WooCommerce（已创建未支付订单、COD 订单） | Shopify、TikTok Shop、Shopee、Lazada |
| **消息通道** | 官方 WhatsApp Business Platform (Cloud API) | Baileys / WPPConnect 扫码接入（仅作技术研究，不承诺交付） |
| **支持语言** | 印尼语（含常见缩写如 `bisa COD?`、`ongkir brp?`）、英语、中文商家后台 | 泰语、越南语、马来语、菲律宾市场语言 |
| **发送合规** | 营销模板、24h 客户服务窗口、21:00～09:00 静默时段、买家退订严格停止、滚动 24h 频控（最多 2 次） | 未经授权的主动群发、越过退订限制的补发 |
| **计费单位** | **1 Credit** = 同租户、同店铺、同买家在 24h 窗口内的自动化额度（上限 20 条消息） | 任意金额折算、无上限滥用、无底线负余额 |
| **支付结算** | 原生 USDC、Solana Pay 二维码/深链接、基于 finalized 交易原子入账 | 法币代收代付、EURC、自动代扣续费 |

---

## 3. 技术栈与工程架构

### 3.1 前端应用栈（当前仓库）

- **应用框架**：[Next.js 16.3.8](https://nextjs.org/)（App Router 架构，强制 React Server Components 优先）
- **UI 核心**：[React 19.2.8](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/)（`strict: true`）
- **样式与系统**：[Tailwind CSS 4](https://tailwindcss.com/) + CSS 变量设计令牌（对齐 [UI 设计规范](docs/UI_DESIGN.md)）
- **动效与交互**：[GSAP 3.15](https://greensock.com/gsap/)、[Motion 14](https://motion.dev/)、[Three.js 0.186](https://threejs.org/)（支持 `prefers-reduced-motion` 降级）
- **图标体系**：[Lucide React](https://lucide.dev/)
- **链上支付组件**：`@solana/kit` (v8.4.0)、`@solana-program/token`、`qrcode`

### 3.2 状态管理分层规范

严格遵循 [AGENTS.md](AGENTS.md) 规定的三层状态流转，避免远端缓存与本地状态混杂：

```
                    ┌───────────────────────────────────────────────┐
                    │               UI Presentation                 │
                    └───────┬───────────────────────┬───────────────┘
                            │                       │
              ┌─────────────▼─────────────┐   ┌─────▼─────────────────────────┐
              │     React Local Hooks     │   │      Zustand Client Store     │
              │  (useState / useReducer)  │   │     (stores/use-app-store.ts) │
              │  • 弹窗开关 / 表单本地草稿   │   │  • 跨页筛选偏好 / 全局 UI 状态 │
              └───────────────────────────┘   └───────────────────────────────┘
                            │
              ┌─────────────▼─────────────────────────────────────────┐
              │           TanStack Query (@tanstack/react-query)      │
              │  • 订单列表 / 财务账本 / 会话消息等服务端数据缓存与失效 │
              └───────────────────────────────────────────────────────┘
```

### 3.3 目标后端架构（规划设计）

当前仓库处于 Web 前端与接口契约设计阶段，目标全栈服务架构设计已在 [后端接口契约](docs/backend-api-spec.md) 中明确定义：

- **核心 API 服务**：Node.js / NestJS（RESTful 规范，前缀 `/api/v1`，Zod 4 运行时强契约）
- **业务与账本数据库**：PostgreSQL（租户强隔离、订单快照、不可篡改的单向只增财务账本）
- **异步任务与队列**：BullMQ + Redis（用于 Webhook 验签后异步解耦、催付定时调度、超时重试）
- **链上监听 Worker**：独立轮询/补偿服务（基于 Solana RPC 监听 reference，校验 finalized 状态并原子写入 PostgreSQL）

---

## 4. 仓库结构与路由清单

### 4.1 目录组织

```text
├── app/                        # Next.js App Router 页面、布局与路由
│   ├── (marketing)/page.tsx    # 官方首页 (Landing Page / ROI 计算器)
│   ├── login/                  # 商户登录与模拟认证
│   ├── onboarding/             # 店铺与 WhatsApp 通道开通引导
│   └── console/                # 商户工作台核心界面
│       ├── page.tsx            # 工作台总览 Dashboard
│       ├── orders/             # 订单流水与多阶段自动化状态
│       ├── inbox/              # 统一会话中心与人工接管队列
│       ├── workflows/          # 自动化规则、时区与频次控制
│       ├── stores/             # 绑定的独立站与 WhatsApp 号码
│       ├── knowledge/          # 商户 FAQ 与商品知识库
│       ├── billing/            # 订阅套餐、Credits 余额与充值
│       └── settings/           # 租户配置、成员角色与审计日志
├── components/                 # 可复用 UI 组件
│   ├── landing/                # 落地页业务组件 (Hero, ROI, TopoMesh 等)
│   ├── billing/                # 充值与 Solana Pay 交互组件
│   └── ui/                     # 基础原子 UI 组件
├── docs/                       # 核心业务、设计与工程文档
│   ├── PRD.md                  # 产品需求文档 (v1.1 权威基准)
│   ├── UI_DESIGN.md            # 视觉与交互设计规范
│   ├── backend-api-spec.md     # 后端 REST 接口与 Zod 4 契约
│   ├── whatsapp-integration-guide.md # WhatsApp Cloud API 接入指南
│   ├── channel-feasibility-review.md # 东南亚电商与消息通道可行性
│   └── plans/                  # 强制 MVP 计划与执行记录目录
├── lib/                        # 业务纯函数、动效与支付工具
├── stores/                     # Zustand 客户端共享状态
├── package.json                # 依赖清单与工程脚本
└── AGENTS.md                   # 团队与 AI 协作规范 (行数 ≤ 200)
```

### 4.2 路由与页面功能索引

| 路由路径 | 页面定位 | 核心能力与操作 |
| :--- | :--- | :--- |
| `/` | 官网落地页 | 产品价值传递、动态 3D 网格、交互式 ROI 收益测算器、套餐方案 |
| `/login` | 商家认证 | 商家邮箱/工作台登录、租户身份切换演示 |
| `/onboarding` | 接入向导 | WooCommerce 凭证授权验证、WhatsApp Business 通道配置与测试样例验证 |
| `/console` | 经营总览 | 今日自动化订单、COD 挽回率、待人工会话、Credits 余额与快捷动作 |
| `/console/orders` | 订单管理 | 订单同步状态、工作流阶段（已排队/已送达/已停止）、买家意愿标记 |
| `/console/inbox` | 会话与客服 | 多语言双向消息流、AI 自动问答证据、一键人工接管（独占处理权） |
| `/console/workflows` | 自动化工作流 | 15 分钟催付规则、COD 确认规则、静默时段设置、频次上限配置 |
| `/console/stores` | 店铺与通道 | WooCommerce 绑定状态、WhatsApp 模板审批状态、Webhook 连通性 |
| `/console/knowledge` | 知识库 | 商品增量同步状态、商家审核 FAQ、事实冲突标记 |
| `/console/billing` | 财务与支付 | 套餐有效期、Credits 消耗流水、Solana Pay USDC 点数充值与状态追踪 |
| `/console/settings` | 租户设置 | 成员管理与 RBAC 权限（所有者/管理员/客服/财务）、数据保留与脱敏 |

---

## 5. 本地开发与快速上手

### 5.1 环境要求

- **Node.js**：`>= 20.18.0`（推荐使用 LTS 版本）
- **包管理器**：固定使用 `pnpm@11.17.0`（仓库只维护 `pnpm-lock.yaml`，禁止混用 npm/yarn）

### 5.2 快速运行

```bash
# 1. 克隆代码仓库
git clone https://github.com/your-org/solana.git
cd solana

# 2. 安装依赖（遵循严格锁文件）
pnpm install --frozen-lockfile

# 3. 复制环境变量配置
cp .env.example .env.local

# 4. 启动本地开发服务
pnpm dev
```

启动完成后，在浏览器中打开 `http://localhost:3000` 即可预览落地页与控制台。

### 5.3 环境变量说明

创建 `.env.local` 并配置基础环境变量：

```ini
# Next.js 应用基础配置
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Solana 支付配置 (首发测试使用 Devnet)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
# Circle Devnet 原生 USDC Mint 地址
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
# 商户端服务费收款公钥
NEXT_PUBLIC_MERCHANT_RECIPIENT_WALLET=YourSolanaPublicKeyHere

# 后端服务接口配置 (开发阶段可指向本地模拟或目标 NestJS 服务)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

> 🔒 **安全守则**：私钥、WhatsApp Access Token、数据库密码等敏感密钥严禁写入 `.env.local` 并在客户端暴露，严禁提交到代码仓库。

### 5.4 质量验证与构建命令

在提交任何代码前，必须执行以下检查门禁：

```bash
# 1. ESLint 代码质量检查
pnpm lint

# 2. Next.js 类型生成与 TypeScript 严格检查
pnpm exec next typegen && pnpm exec tsc --noEmit

# 3. 生产环境打包构建
pnpm build

# 4. 启动生产构建服务
pnpm start
```

---

## 6. 核心不变量与设计准则

为了保障业务可靠性、商户数据隐私及资金账本绝对正确，开发过程中必须恪守以下不变量：

1. **财务账本绝对精确**
   - 金额与链上代币数量必须使用最小整数单位（如 USDC 6 位精度下的精确整数）或整数字符串存储。
   - **严禁使用浮点数（Float/Double）** 计算财务金额。
2. **Solana Pay 验证与入账单向性**
   - 不把钱包签名或交易提交当作充值成功。
   - 必须通过服务端读取 RPC 节点，确认交易达到 `finalized` 最终确定性，并完整校验网络、Mint、收款方、精确金额与唯一 reference 后，原子入账一次。
3. **严格的租户隔离 (RBAC)**
   - 服务端依据身份会话（Cookie/Session）锁定当前租户，严禁信任前端传入的 `tenant_id`。
   - 客服角色不可访问财务中心，财务角色不可手动无证据增减 Credits。
4. **合规自动化与安全熔断**
   - 主动消息严格遵守 WhatsApp Business 消息政策与获批 Marketing 模板。
   - 买家一旦发送退订关键词（如 STOP/UNSUBSCRIBE），立即停止所有主动触达。
   - 遭遇未决异常、退款争议或改址取消申请，自动化立即原子转入人工接管。

---

## 7. 文档索引与协作规范

### 7.1 核心文档导航

- 📘 [PRD 业务需求文档 (v1.1)](docs/PRD.md)：业务定义、KPI 口径、场景规则与验收标准。
- 🎨 [UI 设计规范](docs/UI_DESIGN.md)：视觉设计语言、色彩令牌、排版系统与交互规范。
- 🔌 [后端接口与 Zod 契约](docs/backend-api-spec.md)：RESTful 接口表、数据传输对象及复杂校验逻辑。
- 💬 [WhatsApp 官方接入指南](docs/whatsapp-integration-guide.md)：Cloud API 接入流程、模板规则与扣费说明。
- 📊 [东南亚电商与通道可行性评审](docs/channel-feasibility-review.md)：各渠道接口可行性与市场研究。

### 7.2 强制 MVP 协作闭环

本仓库所有功能需求均执行规范的 MVP 迭代闭环（详见 [AGENTS.md](AGENTS.md)）：
- 任何需求实施前，必须在 `docs/plans/YYYY-MM-DD-<slug>/` 下建立 `plan.md` 明确背景、范围、分阶段测试与验收标准。
- 开发推进过程中，必须同步维护该目录下的 `result.md`，真实记录各阶段执行结果与遗留问题。
- 未经过独立测试或存在未解决阻塞时，禁止虚报通过。

---

## 8. 开源协议与声明

本项目依据业务规划开发，当前演示环境数据均为 Mock 仿真。未经过正式商业授权与安全审查前，请勿用于真实资金交易与生产环境短信群发。

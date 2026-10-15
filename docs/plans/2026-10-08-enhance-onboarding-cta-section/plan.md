# 官网“立即接入出海店铺”转化区 3D 视觉与指引增强计划

## 1. 背景与目标
- **背景**：在出海官网 Landing Page 末尾的商业转化区（Section 5：“立即接入您的首个出海店铺”），当前仅有纯黑背景文字与两个跳转按钮，视觉层级相对扁平，缺少吸引眼球的 3D 空间交互，也未直观展开 6 步商户向导的具体承诺（如 0 信用卡要求、Meta BAA 合规、3 分钟授权、100 免费 Credits 分配）。用户期望在此区域进行视觉与功能性扩展增强。
- **依据与约束**：
  - 严格遵循 `docs/UI_DESIGN.md` 中 Swiss Architectural Minimalist、纯黑夜景深沉质感（`bg-zinc-950`）、1px 发丝边框（`border-zinc-800`）、纯白高反文字与单一功能翡翠绿（`#059669` / `#10B981`）视觉规范；
  - 严格遵守 Next.js 16.3.8 App Router、React 19 及 Three.js 规范；
  - 保持离屏休眠（`IntersectionObserver`）与 `prefers-reduced-motion` 静态 SVG 降级能力，避免无意义的 GPU 渲染开销；
  - 保证 375px（移动端）、768px（平板）和 1440px（桌面端）响应式排版良好，无横向溢出。
- **目标**：
  1. 开发并集成一款贴合暗夜主题的 3D WebGL 接入微组件 `ThreeOnboardingGateway`（3D 浮动几何传送门/算力晶体节点与环绕粒子）；
  2. 新增“3 步极速开通流线”（01 店铺授权 -> 02 绑定 WhatsApp -> 03 激活 100 额度），让出海商家一目了然入驻路径；
  3. 新增 4 维“企业级入驻信任徽章卡片”（0 信用卡门槛、3 分钟免代码接入、Meta 官方 BAA 合规、Solana 极速原生结算）；
  4. 完成全套构建与测试验证（`pnpm lint`、`tsc --noEmit`、`pnpm test`、`pnpm build`）。

## 2. MVP 范围
- **模块 1：暗夜 3D 接入传送门组件 (`components/landing/three-onboarding-gateway.tsx`)**
  - 构建几何悬浮多面体/光环结构，辅以发丝线刻度和轨道环绕数据粒子；
  - 响应光标移动实现物理视差阻尼倾斜与呼吸浮动；
  - 点击时产生 360° 加速飞旋与脉冲扩散环；
  - 内建 `IntersectionObserver` 离屏休眠与静态 SVG 发丝降级。
- **模块 2：3 步极速开通流线与 4 维商户信任卡片**
  - 在 `app/page.tsx` Section 5 中构建 3 步可视化极简流线步进器；
  - 排布 4 维高信赖度发丝线卡片（100 免密额度、3min Webhook 直连、Meta 官方 API、Solana USDC 零汇损）；
  - 优化按钮组层级与视觉排版，增强 CTA 转化号召力。

## 3. 非目标 (Out of Scope)
- 不修改 `/onboarding` 实际业务路由与入驻表单持久化逻辑；
- 不引入外部大型 3D 模型文件（保持 Three.js 程序化几何体生成，零额外网络体积负担）；
- 不使用浮夸蓝紫霓虹色彩，保持黑白与翡翠绿克制美学。

## 4. 风险与依赖
- **性能与 Canvas 渲染**：
  - 风险：页面存在多个 3D Canvas 时，若同时运行会消耗 GPU。
  - 对策：严格使用 `IntersectionObserver`，仅在滚入当前视口时执行渲染循环。
- **移动端小屏断点适配**：
  - 风险：卡片与 3D 视窗在 375px 窄屏可能挤压换行或溢出。
  - 对策：采用 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` 响应式网格及自适应高度。

## 5. 阶段拆分
- **阶段 1：开发暗夜 3D 接入传送门微组件 (`ThreeOnboardingGateway`)**
  - 创建 `components/landing/three-onboarding-gateway.tsx`，包含 3D 空间多面体、粒子环、光标交互、离屏休眠与 SVG 降级。
- **阶段 2：在官网 Section 5 布局 3 步开通流线与 4 维入驻信任卡片**
  - 在 `app/page.tsx` 中挂载 `ThreeOnboardingGateway`，并补充 3 步极速开通向导和 4 维免密安心保障卡片。
- **阶段 3：响应式核对、质量闸门验证与验收交付**
  - 执行 `pnpm lint`、`tsc --noEmit`、`pnpm test` 与 `pnpm build`，完成 `result.md` 交付记录。

## 6. 各阶段测试步骤、输入及预期
- **阶段 1 测试**：
  - 单独挂载测试 `ThreeOnboardingGateway`，预期 3D 几何传送门呼吸悬浮、光标视差微转、点击飞旋加速，移出视口暂停。
- **阶段 2 测试**：
  - 滚动至 Section 5，预期呈现大气的暗夜 3D 晶体视窗，上方显示 3 步入驻流程，下方排列 4 块发丝线保障徽章，按钮点击通畅。
- **阶段 3 测试**：
  - 验证 375px、768px、1440px 视口无溢出；全套构建与测试 100% 通过。

## 7. 最终验收标准
- [ ] Section 5 接入区具备 3D 交互微组件，视觉冲击力显著提升。
- [ ] 3 步入驻流程与 4 维信任保障卡片排版整洁、文字自洽。
- [ ] 离屏节能休眠正常生效，支持 reduced-motion 静态优雅降级。
- [ ] `pnpm lint`、`tsc --noEmit`、`pnpm test`、`pnpm build` 全部通过。

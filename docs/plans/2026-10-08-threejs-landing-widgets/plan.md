# 出海官网 Three.js 视觉微组件增强计划

## 1. 背景与目标
- **背景**：当前 SolaFlow AI 出海官网（Landing Page）具备完备的业务文字、多语言切换、交互演练沙盒与计算器，但在首屏（Hero）与企业级核心架构矩阵（Bento Grid）中，视觉表达以平面卡片为主。仓库中存在一个未挂载的原型组件 `components/landing/topo-mesh.tsx`。用户期望在出海官网使用 Three.js 制作一些精致、抓眼球的 3D 小组件效果，提升出海独立站的国际化质感与科技感。
- **依据与约束**：
  - 严格遵循 `docs/UI_DESIGN.md` 第 4 节《3D WebGL 极简单色拓扑雕塑规范》与设计禁令：严格禁止使用发光蓝紫色系与赛博霓虹，采用纯白纸张基底（`#FFFFFF`）、深黑铅字（`#09090B`）、1px 发丝几何线（`#E4E4E7`）、三维单色拓扑线条（`#18181B`）及单一功能性深翡翠绿（`#059669` / `#10B981`）。
  - 必须支持 `prefers-reduced-motion` 静态优雅降级；WebGL 初始化异常时不中断页面渲染。
  - 必须具备视口检测（不在可视区时自动暂停 `requestAnimationFrame`），并在组件卸载时彻底释放 WebGL 资源、几何体与材质内存。
  - 确保移动端（375px）、平板（768px）和桌面端（1440px）自适应无横向溢出。
- **目标**：打造 3 款兼具出海跨境业务隐喻与高精度交互质感的 Three.js 微组件并集成到官网：
  1. **组件 1：`HeroTopoCanvas`（首屏 3D 单色流体拓扑微感网格）**：将单色地形拓扑网格集成于首屏背景，具备鼠标阻尼微牵引形变与东南亚经纬度微标注，赋予 Hero 空间纵深。
  2. **组件 2：`SeaTopologyGlobe`（东南亚跨境多语言与订单航线 3D 拓扑交互地球仪）**：嵌入 Bento 架构矩阵第 1 卡片（多语言与本土化），3D 线框球体呈现雅加达(CGK)、曼谷(BKK)、新加坡(SIN)、马尼拉(MNL)、胡志明(SGN)、深圳(SZX)节点，带动态飞线粒子与节点悬浮微交互。
  3. **组件 3：`SolanaSettlementCoin3D`（Solana 极简 3D 结晶/硬币结算微组件）**：嵌入 Bento 架构矩阵第 2 卡片（Solana Pay 毫秒级原生结算），具备 3D 浮动跟随、418ms 结算脉冲光环与点击/悬浮触感旋转。

## 2. MVP 范围
- **模块 1：首屏 3D 单色拓扑网格组件重构与挂载**
  - 重构/增强 `components/landing/topo-mesh.tsx` 为高性能、响应式、抗锯齿的背景网格组件 `HeroTopoCanvas`。
  - 在 `app/page.tsx` 的 Hero 区域优雅挂载，设置 `pointer-events-none` 避免阻挡按钮点击。
- **模块 2：东南亚跨境拓扑航线 3D 球体微组件 (`components/landing/three-sea-globe.tsx`)**
  - 实现基于 Three.js 的参数化线框点阵球体。
  - 渲染东南亚关键电商枢纽点（CGK, BKK, SIN, MNL, SGN, SZX）及贝塞尔航线粒子弧线。
  - 支持鼠标悬浮/拖拽交互，提供当前聚焦枢纽的极简发丝线信息悬浮卡片。
  - 嵌入 `app/page.tsx` 的 Bento Card 1（NLP & DIALECT 东南亚多语言）。
- **模块 3：Solana Pay 3D 结算硬币/棱镜微组件 (`components/landing/three-solana-coin.tsx`)**
  - 构建几何雕刻感 3D 硬币/棱镜，刻有 Solana 经典几何标识与发丝线倒角。
  - 纯黑白灰阶单色线框材质，带克制的翡翠绿状态发光边缘与 418ms 毫秒波纹环。
  - 响应鼠标指针倾斜视差（Tilt Gyro），悬浮时平滑自转加速。
  - 嵌入 `app/page.tsx` 的 Bento Card 2（SOLANA PAY 原生结算）。
- **模块 4：通用 3D 性能与无障碍保障**
  - 所有 3D 组件统一添加 `IntersectionObserver` 离屏休眠。
  - 统一监听 `(prefers-reduced-motion: reduce)` 提供极简发丝线 SVG/CSS 静态降级。
  - 完善 WebGL 上下文销毁生命周期（`cancelAnimationFrame`, `dispose()`）。

## 3. 非目标 (Out of Scope)
- 不引入重型 3D 库（如 `@react-three/fiber`、`@react-three/drei`），保持使用已安装的原生 `three` 与 React 19 完美兼容。
- 不使用任何大型外部 GLTF/GLB 外部模型文件下载，避免网络延迟和数百 KB 的静态资源负担；所有几何体均采用 Three.js 原生几何体程序化生成。
- 不使用彩色霓虹与蓝紫赛博朋克光效，严格遵从黑白极简与翡翠绿单一功能强调色规范。

## 4. 风险与依赖
- **性能开销与多 Canvas 资源占用**：
  - 风险：页面存在多个 Three.js Canvas 时可能造成 GPU 显存或渲染占用过高。
  - 对策：使用 `IntersectionObserver`，仅在组件进入视窗时启动渲染循环，移出视窗时立刻暂停；像素比限制在 `Math.min(window.devicePixelRatio, 2)`。
- **移动端小屏触摸与尺寸**：
  - 风险：在 375px 移动端卡片内 Canvas 宽度可能变形或横向撑开。
  - 对策：容器使用自适应百分比宽高及 `ResizeObserver` 动态计算 Camera aspect 和 Renderer 大小。
- **React 19 严格模式双重挂载**：
  - 风险：React 19 在开发环境下可能导致 Canvas 重复创建或内存泄露。
  - 对策：严格管理 cleanup 闭包，清除 domElement 并释放 geometry/material。

## 5. 阶段拆分
- **阶段 1：首屏单色流体拓扑网格组件 (`HeroTopoCanvas`) 优化与挂载**
  - 优化 `components/landing/topo-mesh.tsx`，解决视口观察、内存销毁、移动端自适应，并在 `app/page.tsx` Hero 区域挂载。
- **阶段 2：开发东南亚跨境航线 3D 交互球体 (`SeaTopologyGlobe`)**
  - 创建 `components/landing/three-sea-globe.tsx`，绘制航线粒子流动与经纬度节点，并嵌入 Bento Card 1。
- **阶段 3：开发 Solana Pay 3D 结算结晶硬币 (`SolanaSettlementCoin3D`)**
  - 创建 `components/landing/three-solana-coin.tsx`，绘制 3D 纯黑单色 Solana 硬币与 418ms 脉冲环，并嵌入 Bento Card 2。
- **阶段 4：响应式视口检查、降级验证与质量闸门构建**
  - 针对 375px、768px、1440px 进行布局核对。
  - 运行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build` 全流程验证。

## 6. 各阶段测试步骤、输入及预期
- **阶段 1 测试**：
  - 访问 `/` 首页 Hero 区域，预期呈现淡雅的黑色发丝单色拓扑网格，鼠标移动时网格微起伏响应，文本与按钮点击无阻碍；向下滚动超出视口后渲染暂停。
- **阶段 2 测试**：
  - 滚动至 Bento 网格卡片 1，预期呈现 3D 交互点阵球体，光点与弧线平滑流动，鼠标悬停时可查看 CGK/SIN/BKK 等经纬度枢纽数据，拖拽可平滑旋转。
- **阶段 3 测试**：
  - 查看 Bento 网格卡片 2，预期呈现悬浮微动的 3D 单色 Solana 结算硬币，鼠标移入卡片时硬币随光标阻尼倾斜，显示 418ms 结算脉冲。
- **阶段 4 测试**：
  - 开启 `prefers-reduced-motion`，预期所有 3D 组件均安全切换为极简 SVG/CSS 发丝几何静态图形；
  - 运行全套构建命令无报错通过。

## 7. 最终验收标准
- [ ] 3 款 Three.js 微组件全部可用，视觉符合 Swiss Architectural Minimalist 黑白极简与克制功能绿规范。
- [ ] 离屏休眠与卸载清理机制完备，无内存泄露与未捕获 WebGL 异常。
- [ ] 响应式良好（375px / 768px / 1440px 均无溢出），支持 reduced-motion 静态降级。
- [ ] `pnpm lint`、`tsc --noEmit`、`pnpm build` 全部成功通过。

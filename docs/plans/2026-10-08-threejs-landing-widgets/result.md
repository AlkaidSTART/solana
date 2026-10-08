# 需求执行记录：出海官网 Three.js 视觉微组件增强

计划：docs/plans/2026-10-08-threejs-landing-widgets/plan.md

- [x] 阶段 1：首屏单色流体拓扑网格组件 (`HeroTopoCanvas`) 优化与挂载；测试 T1：核查首页 Hero 背景 3D 网格渲染、鼠标互动与视口遮蔽暂停；预期：发丝线网格平滑流体起伏，不遮挡按钮与文字选择，滚动出屏时暂停；实际：成功重构 `components/landing/topo-mesh.tsx`，实现基于时间周期的平滑微波动力学起伏、ResizeObserver 容器自适应、IntersectionObserver 离屏节能休眠、WebGL 资源彻底回收及 SVG 静态优雅降级，并在 `app/page.tsx` Hero 背景层优雅挂载，TypeScript 编译 0 报错；遗留/下一步：进入阶段 2，设计并开发东南亚跨境航线 3D 交互球体 (`SeaTopologyGlobe`)。
- [x] 阶段 2：开发东南亚跨境航线 3D 交互球体 (`SeaTopologyGlobe`)；测试 T2：核查 Bento Card 1 3D 地球仪渲染、枢纽点标注与飞线粒子；预期：3D 点阵球体自转平滑，支持拖拽旋转，呈现雅加达/新加坡/曼谷等跨境数据弧线；实际：成功创建 `components/landing/three-sea-globe.tsx`，通过经纬度球面转换绘制 6 大核心出海城市节点（CGK、SIN、BKK、MNL、SGN、SZX）及贝塞尔跨境航线光束，支持鼠标/触屏阻尼拖拽旋转与一键定点平滑聚焦，嵌入 Bento Card 1，TypeScript 编译通过；遗留/下一步：进入阶段 3，开发 Solana Pay 3D 结算结晶硬币 (`SolanaSettlementCoin3D`)。
- [ ] 阶段 3：开发 Solana Pay 3D 结算结晶硬币 (`SolanaSettlementCoin3D`)；测试 T3：核查 Bento Card 2 3D 硬币渲染与倾斜微交互；预期：单色线框雕刻硬币随光标阻尼倾斜，呈现 418ms 结算脉冲光圈；实际：…；遗留/下一步：…
- [ ] 阶段 4：响应式视口检查、降级验证与质量闸门构建；测试 T4：运行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`，并检查 375px/768px/1440px 视口与 prefers-reduced-motion 降级；预期：构建与类型检查通过，全尺寸无横向溢出，降级正常；实际：…；遗留/下一步：…
- [ ] MVP 验收：3 款 Three.js 微组件稳定运行，符合 Swiss 极简黑白规范与克制功能绿要求，无报错无性能瓶颈。

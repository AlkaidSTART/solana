# 需求执行记录：i18n 语言与市场切换全面去 Emoji 化（方案一）
计划：docs/plans/2026-10-15-i18n-remove-emojis/plan.md

- [x] 阶段 1：重构控制台全局 Header 及登录/注册页语言选择器（app/console/layout.tsx, app/login/page.tsx, app/register/page.tsx）；测试 T1：`pnpm exec next typegen && pnpm exec tsc --noEmit` 并检查选项文本；预期：零 emoji，显示统一 Globe 矢量图标及各语言母语自称；实际：控制台 Header 增加 Globe 图标与 `${meta.nativeLabel} (${meta.shortLabel})` 格式选项，登录/注册页去掉硬编码国旗 Emoji，类型检查 0 错误；遗留/下一步：推进阶段 2。
- [x] 阶段 2：重构官网 Landing 导航栏语言切换器（app/page.tsx）；测试 T2：`pnpm exec next typegen && pnpm exec tsc --noEmit` 并检查选项无 emoji；预期：零 emoji，纯文本代码/母语标签；实际：LANDING_LANGS 移除 flag 字段，大屏药丸组增补 Globe 矢量图标并呈现纯文本 ISO 码，移动端下拉展现 `${l.label} (${l.code})`，类型检查通过；遗留/下一步：推进阶段 3。
- [x] 阶段 3：重构认证卡片目标市场选项（components/auth/auth-card.tsx）；测试 T3：`pnpm exec next typegen && pnpm exec tsc --noEmit` 并检查选项文本；预期：规范市场与国家代码文本，零 emoji；实际：marketOptions 中 6 处出海市场国旗 emoji 及 msgRegisterSuccess 中的庆祝 emoji 全部移除，类型检查通过；遗留/下一步：推进阶段 4。
- [x] 阶段 4：质量验证与自动化回归；测试 T4：执行 vitest、tsc、lint 与 build；预期：全部通过，0 错误；实际：vitest 7 个用例全部通过，tsc 0 错误，eslint 0 错误，pnpm build 22 个静态页面与全部 API 端点构建成功；遗留/下一步：完成 MVP 验收。
- [x] MVP 验收：验收项逐项对照，全局零原生国旗/符号 Emoji，统一引入 Lucide `<Globe />` 矢量图标，语言选项规范呈现母语真实自称（如 `简体中文`、`English`、`Bahasa Indonesia`），全端切换交互平稳无退化。

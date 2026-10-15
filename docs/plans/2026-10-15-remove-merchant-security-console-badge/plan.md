# 计划：移除登录/注册卡片上的“商户安全工作台”徽标及绿色指示灯

## 1. 背景与目标
- **背景**：在 `components/auth/auth-card.tsx` 的登录/注册卡片顶部，之前放置了一个带有绿色呼吸灯指示器（`animate-pulse bg-emerald-500`）及“商户安全工作台 / ENTERPRISE CONSOLE / KONSOL ENTERPRISE”的微徽章（badge）。
- **用户需求**：“商户安全工作台，绿色灯去掉，商户安全工作台也不展示”。
- **目标**：彻底移除 `AuthCard` 卡片顶部的“商户安全工作台”徽标及其绿色呼吸灯，使卡片头部直接呈现主标题与说明文案，减少视觉噪点，符合极简设计原则。

## 2. MVP 范围
1. `components/auth/auth-card.tsx`：
   - 移除卡片顶部的微徽章节点（包含绿色呼吸灯 `span` 与 `t.badge` 文字）。
   - 清理 `t` 字典中未使用的 `badge` 字段定义。
2. `components/auth/auth-centered-redesign.test.tsx`：
   - 更新单元测试断言：验证卡片中不再呈现“商户安全工作台”及该绿色呼吸指示灯。
3. 验证构建、类型检查与全量相关测试通过。

## 3. 非目标
- 不改动登录、注册、找回密码、密码强度、OAuth、表单提交等任何核心交互逻辑。
- 不改动页面全局顶栏、导航栏或其他独立功能模块的状态指示灯。

## 4. 风险与依赖
- **依赖**：无新增依赖，沿用既有 TypeScript 与 Vitest 测试套件。
- **风险**：断言如果引用了“商户安全工作台”，需同步更新为“不包含”，避免测试失败。

## 5. 阶段拆分
- **阶段 1：代码与样式清理**
  - 修改 `components/auth/auth-card.tsx`，移除微徽章与绿灯 DOM 结构，移除无用 `badge` 字典项。
- **阶段 2：测试回归与自动化断言更新**
  - 更新 `components/auth/auth-centered-redesign.test.tsx`，运行单元测试。
- **阶段 3：代码质检与交付验收**
  - 运行 `pnpm lint`。
  - 运行 `pnpm exec next typegen && pnpm exec tsc --noEmit`。
  - 运行 `pnpm build`。

## 6. 各阶段测试步骤及预期
- 阶段 1：手动/静态检查 `components/auth/auth-card.tsx` 渲染输出，确认无 `t.badge` 与绿灯节点。
- 阶段 2：运行 `pnpm exec vitest run components/auth/auth-centered-redesign.test.tsx`，预期 4 个用例全部通过，断言确认不再包含“商户安全工作台”。
- 阶段 3：运行全局 lint、类型检查和 build，预期零错误。

## 7. 最终验收标准
- [x] 登录与注册卡片顶部不再显示绿灯。
- [x] 登录与注册卡片顶部不再显示“商户安全工作台”字样。
- [x] 单元测试全部通过。
- [x] Next.js 类型检查和生产构建全部成功。

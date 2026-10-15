# 需求计划：使用图标库替换用户默认手绘/首字母头像 (Replace User Default Avatar with Icon Library)

## 1. 背景与目标
- **背景**：当前控制台用户身份模块（如顶部导航用户下拉菜单 `UserNavDropdown`、主界面资产横幅 `UserAssetsBanner`）使用了自己绘制的渐变圆形/方块并内嵌英文字符串首字母（`initials`）作为默认头像。用户明确提出：“用户的默认头像用图标库替代，不要自己画”。
- **目标**：使用项目官方图标库 `lucide-react`（如 `User` 图标）替代原有的手绘/字符截取头像；支持在无真实头像 URL 时统一规范呈现图标库的用户头像，保持界面质感专业、现代与视觉统一。

## 2. MVP 范围与非目标
- **MVP 范围**：
  1. `components/console/user-nav-dropdown.tsx`：
     - 触发按钮头像：移除手绘渐变色及首字母截取，采用来自 `lucide-react` 的 `User` 矢量图标与精致底框。
     - 下拉面板主理人名片头像：同样替换为标准 `User` 矢量图标。
  2. `components/console/user-assets-banner.tsx`：
     - 主理人身份卡片头像：移除手绘渐变背景与首字母，采用来自 `lucide-react` 的 `User` 矢量图标。
  3. 测试与验证：
     - 更新对应单元测试 `user-nav-dropdown.test.tsx` 与相关组件断言。
     - 运行全量测试套件、ESLint、TypeScript 类型检查与 Next.js 生产构建。
- **非目标**：
  1. 不改动控制台权限、Neon Auth 认证状态与用户资产数据流。
  2. 不新增第三方头像处理库。

## 3. 风险与依赖
- **风险 1：既有用例断言了首字母 "AR"**
  - *应对方案*：同步更新 `user-nav-dropdown.test.tsx`，将对 "AR" 首字母的断言更新为断言图标与用户名的正确呈现。

## 4. 阶段拆分
- **阶段 1：重构 UserNavDropdown 用户头像为 lucide-react 矢量图标**
  - 交付文件：`components/console/user-nav-dropdown.tsx`
- **阶段 2：重构 UserAssetsBanner 用户头像为 lucide-react 矢量图标**
  - 交付文件：`components/console/user-assets-banner.tsx`
- **阶段 3：更新测试用例与执行质量闸门核验**
  - 交付文件：`components/console/user-nav-dropdown.test.tsx`、`docs/plans/2026-10-15-replace-user-avatar-with-icon/result.md`

## 5. 各阶段测试步骤与预期
- **阶段 1 测试**：
  - 步骤：检查 `UserNavDropdown`，确认不再使用 `initials`，而是渲染 `User` 图标。
  - 预期：代码规范无误，图标正常渲染。
- **阶段 2 测试**：
  - 步骤：检查 `UserAssetsBanner`，确认头像区域使用 `User` 图标。
  - 预期：样式精致优雅，无手绘渐变色块与首字母拼贴。
- **阶段 3 测试**：
  - 步骤：运行 `pnpm test`、`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`。
  - 预期：全部绿灯通过，0 错误。

## 6. 最终验收标准
1. [ ] 控制台所有默认头像均采用 `lucide-react` 矢量图标，不再使用手绘或字母拼写。
2. [ ] `UserNavDropdown` 触发按钮与展开弹层均使用标准用户图标。
3. [ ] `UserAssetsBanner` 主理人卡片使用标准用户图标。
4. [ ] 自动化测试全部通过，无回归缺陷。
5. [ ] 质量闸门（lint, tsc, build）100% 绿灯。

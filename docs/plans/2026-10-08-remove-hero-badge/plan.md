# 移除官网 Hero 顶部微胶囊标签计划

## 1. 背景与目标
- **背景**：出海官网首页 Hero 区域顶部有一个营销微胶囊标签（`app/page.tsx`），其在中文语境下展示为“2026 东南亚电商 AI · 新加坡 / 印尼 / 大马 / 泰国 / 越南 / 菲律宾”，并在其他语言下对应各语言版本营销文案。
- **目标**：按用户要求移除该顶部微胶囊标签 UI（整块胶囊元素），并清理随之失去引用的 `badge` 多语言文案字段，保持代码整洁、类型安全。

## 2. MVP 范围
- 移除 `app/page.tsx` Hero 区域中的微胶囊标签 DOM 区块（含 `<div className="inline-flex ... rounded-full">` 与其中 `<span>{t.badge}</span>`）。
- 从 `heroTitles` 的 `Record` 类型定义中移除 `badge: string` 字段，并移除全部 8 个语言条目（ZH/EN/SG/ID/MY/TH/VI/PH）的 `badge` 属性。
- 保留标题、副标、CTA、3D 背景等其余 Hero 内容与整体布局。

## 3. 非目标 (Out of Scope)
- 不修改 `docs/PRD.md`、`docs/UI_DESIGN.md` 等产品/设计文档中对该定位的描述。
- 不调整 Hero 标题、副标、CTA 按钮、页脚 Markets 文案或任何其他页面。
- 不重构 `app/page.tsx` 结构或引入新依赖。

## 4. 风险与依赖
- **布局空档风险**：移除胶囊后 Hero 顶部间距可能变化，需确认标题仍与上方 Header 保持合理留白，不出现塌陷或突兀。
- **类型一致性**：`heroTitles` 采用 `Record<LandingLang, {...}>` 严格类型，移除字段时须同步修改类型与全部 8 个条目，避免类型检查失败。
- 无新增依赖；依赖现有 `pnpm lint`、`next typegen && tsc --noEmit`、`pnpm build` 闸门。

## 5. 阶段拆分
- **阶段 1：移除 Hero 微胶囊标签与清理 badge 字段**
  - 修改 `app/page.tsx`：删除胶囊 DOM 区块；删除类型与 8 个语言的 `badge` 属性。
- **阶段 2：质量检查与验证**
  - 运行 `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`，并复查 `app/page.tsx` 无残留 `badge` 引用，更新 `result.md` 并完成 MVP 验收。

## 6. 各阶段测试步骤、输入及预期
- **阶段 1 测试**（输入：`app/page.tsx`；步骤：全文检索 `badge`）：
  - 预期：源码中不再出现 `t.badge`、`badge:` 字段或胶囊 `<span>{t.badge}</span>`；Hero 标题/副标/CTA 结构完整。
- **阶段 2 测试**（命令：`pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build`）：
  - 预期：Lint 0 错误；类型检查 0 错误；构建成功且无未使用变量报错。
  - 人工检查：本地首页 Hero 顶部不再渲染微胶囊标签，标题上方留白自然，375px / 768px / 1440px 无横向溢出。

## 7. 最终验收标准
1. `app/page.tsx` 中不再存在 Hero 顶部微胶囊标签 UI 与相关 `badge` 文案字段。
2. Hero 标题、副标与行动按钮渲染正常，多语言切换不受影响（切换语言不再引用已删除的 `badge`）。
3. `pnpm lint`、`pnpm exec next typegen && pnpm exec tsc --noEmit`、`pnpm build` 全部通过。
4. `git diff` 仅包含本次范围改动与计划/结果文档。

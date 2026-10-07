# 执行记录：后端接口与 Zod 契约文档

计划：`docs/plans/2026-10-07-backend-api-contracts/plan.md`

- [x] 阶段 1（T1）：读取 AGENTS.md、PRD v1.1、UI 页面索引、stores/use-app-store.ts 及登录 Demo。预期确定首版边界和既有改动；实际确认 WooCommerce + WhatsApp、印尼语/英语、租户权限和支付账本要求；Demo 包含 Shopify/泰语/风险分数等非首版内容，不照抄为接口。package.json、pnpm-lock.yaml 已修改，本需求不触碰。下一步核验 Zod 并编写契约。
- [x] 阶段 2（T2）：完成 docs/backend-api-spec.md 的接口表、请求/响应字段、Zod 4可执行Schema、权限/幂等/事件/账本边界、测试矩阵与5段小MVP顺序。检查样例：同意证据、工作流区分联合、模板/文本消息、精确金额和支付用途均对应Schema；阶段内容检查通过，代码示例编译与执行在T3验收。续作核对package.json已由其他任务加入Zod直接依赖，本需求未安装或修改依赖。遗留：外部HTTP/链上未实现，本次仅文档；下一步运行示例与结构检查。
- [ ] 阶段 3（T3）：结构、Schema 示例和差异验证。
- [ ] 文档 MVP 验收。

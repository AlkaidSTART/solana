# SolaFlow AI — UI 设计系统总纲与页面索引

- **系统定位**：面向东南亚跨境电商的 WhatsApp 多语言订单助手 × Solana Pay 结算引擎
- **设计哲学**：Swiss Architectural Minimalist & Monochrome Editorial (瑞士国际主义编排、建筑学发丝线与纯黑白铅印质感)
- **视觉红线**：**严格禁止使用蓝紫色系、渐变光晕与霓虹**。整站纯白底色（`#FFFFFF`）、深黑铅字（`#09090B`）、1px 发丝几何线（`#E4E4E7`）与大留白。
- **关联业务文档**：`docs/PRD.md`、`docs/UI_DESIGN.md`

---

## 1. 页面模块与目录索引

全站划分为 10 个独立页面/体验流，每个页面在独立子目录中维护专属设计规范与高保真线框：

| 序号 | 目录路径 | 路由映射 | 页面名称 | 核心设计要点 |
| :---: | :--- | :--- | :--- | :--- |
| **00** | [`00-landing-page/`](./00-landing-page/README.md) | `/` | 出海官网 Landing Page | 3D 单色拓扑网格雕塑、双向遥测沙盒、Bento 矩阵、ROI 动态计算器、三语切换胶囊 |
| **01** | [`01-console-overview/`](./01-console-overview/README.md) | `/console` | 监控总览 (Overview) | 通道健康状态灯、待办/额度高密卡片、20% 对照组真实催付效果分析、COD 防损大盘 |
| **02** | [`02-console-store-channel/`](./02-console-store-channel/README.md) | `/console/stores` | 店铺与通道 (Store & Channel) | WooCommerce/Shopify 授权卡片、WhatsApp 号码评级、多语言获批模板矩阵、连通性自测 |
| **03** | [`03-console-workflows/`](./03-console-workflows/README.md) | `/console/workflows` | 工作流引擎 (Workflows) | 待支付与 COD 规则列表、+62/+66 区号多语言分流路由、静默时段排期、频次上限与版本回退 |
| **04** | [`04-console-orders/`](./04-console-orders/README.md) | `/console/orders` | 订单中心 (Orders) | 订单表格与高阶多维筛选、全生命周期工作流步进器、COD 确认与改址核验详情抽屉 |
| **05** | [`05-console-inbox/`](./05-console-inbox/README.md) | `/console/inbox` | 会话与人工队列 (Inbox) | 三栏高密度工作台、24h 服务窗口倒计时、双向实时翻译抽屉、印尼俚语词典、人工接管控制器 |
| **06** | [`06-console-knowledge-base/`](./06-console-knowledge-base/README.md) | `/console/knowledge` | 知识库管理 (Knowledge Base) | 商品/FAQ 自动抽取、四列多语言对照编辑器 (中/印尼/英/泰)、跨语言冲突预警、审核发布流 |
| **07** | [`07-console-billing/`](./07-console-billing/README.md) | `/console/billing` | 财务充值中心 (Billing) | 订阅周期与配额、Credits 分类账本、逐笔流水、Solana Pay USDC 票据充值与原生 Web Audio |
| **08** | [`08-console-settings/`](./08-console-settings/README.md) | `/console/settings` | 报表与设置 (Analytics & Settings) | 归因口径与 20% 对照组设置、时区与语言偏好、团队 RBAC 矩阵、脱敏数据导出与隐私删除 |
| **09** | [`09-auth-onboarding/`](./09-auth-onboarding/README.md) | `/login`, `/onboarding` | 注册登录与 6 步激活 (Onboarding) | 极简邮箱登录、店铺授权、WhatsApp 绑定、模板配置、测试跑通、100 Credits 试用激活 |

---

## 2. 全局黑白设计令牌 (Monochrome Tokens)

所有页面严格继承以下 CSS 变量体系，禁止在任何组件内部自定义未经论证的杂色：

```css
:root {
  /* 基础画板与实体纸张 (Canvas & Paper Surfaces) */
  --bg-canvas:         #FFFFFF; /* 纯白主画布 */
  --bg-subtle:         #FAFAFA; /* 浅灰二级底色 (表格交替行、次级侧栏) */
  --bg-muted:          #F4F4F5; /* 三级底色 (输入框底色、代码块底色、标签胶囊) */
  --bg-elevated:       rgba(255, 255, 255, 0.92); /* 悬浮面板与弹窗毛玻璃 */

  /* 几何发丝线与边框 (Hairlines & Precision Borders) */
  --border-hairline:   #E4E4E7; /* 1px 极细发丝线 (卡片外框、表格分割线) */
  --border-subtle:     #EEEEEE; /* 极浅辅助微细线 */
  --border-contrast:   #18181B; /* 高对比激活线 (输入框聚焦、激活 Tab 底线) */

  /* 墨黑铅印文字层级 (Typography & Ink Levels) */
  --ink-primary:       #09090B; /* 深度纯黑 (主标题、关键金额、关键指标) */
  --ink-secondary:     #27272A; /* 次级纯黑 (正文、表头、卡片标题) */
  --ink-muted:         #71717A; /* 中灰辅助 (时间戳、次要说明、状态辅助文案) */
  --ink-faint:         #A1A1AA; /* 浅灰极弱 (输入占位符、禁用态文字) */

  /* 功能性限定语义指示色 (严禁作为背景大面积滥用，仅做 6px 状态圆点或文字) */
  --functional-green:  #059669; /* WhatsApp 连通正常、获批模板、通过验证 */
  --functional-red:    #E11D48; /* COD 高危风险、阻断性错误、取消、退订 */
  --functional-amber:  #D97706; /* 待处理提醒、人工介入中、观察期中 */
}
```

---

## 3. 多语言出海交互三大准则

东南亚跨境电商涉及**中国出海卖家**、**本土买家（印尼/泰国等）**与**跨国买家**，全站所有页面须贯彻三大交互准则：

1. **角色语言精准分层**：
   - **商家工作台**：默认为中文（`zh_CN`），支持一键切换为国际英文（`en_US`）。
   - **买家 WhatsApp 触达**：首发必须支持印尼本土口语（`id_ID`，Bahasa Gaul）与国际英语（`en_US`）；泰语（`th_TH`）作为 V2 储备。
   - **双向实时转译**：凡涉及买家原声（印尼语/英语）与卖家交互的界面，必须提供双向转译抽屉与印尼俚语 Tooltip 解释。
2. **长文本与排版防溢出防截断**：
   - 印尼语长单词（如 *Konfirmasi Alamat Pengiriman*）强制声明 `hyphens: auto; word-break: break-word;`。
   - 泰语多重声调符号上下标高度超出常规，泰语文案容器行高强制 `line-height >= 1.6`。
3. **时区与货币严格锚定本土店铺**：
   - 时间绝对禁止使用本地浏览器随意推断，必须展示店铺当地时区（如雅加达 `WIB / UTC+7`、曼谷 `ICT / UTC+7`）。
   - 涉及买家侧金额使用本地货币（如 `Rp 349.000`、`฿ 890`），SaaS 结算使用原生 `USDC`。

---

## 4. 全局页面状态机定义 (State Machine Contract)

全站每一个页面均须完整覆盖 4 种交互状态，禁止空白假死：

| 状态 | 表现形式与规范 | 恢复动作 |
| :--- | :--- | :--- |
| **Loading** | 白底浅灰骨架屏（Skeleton），骨架闪烁脉冲速度 1.5s，禁止使用全屏遮罩菊花旋转 | 异步数据到达后平滑渐显（200ms） |
| **Empty** | 纯白发丝线虚线框卡片，居中黑铅字提示，配以 1 个核心主行动按键（如“立即绑定店铺”） | 点击主行动按键跳转或唤起配置抽屉 |
| **Error** | 发丝红线卡片或顶部警告条，明确告知原因（如“网络超时 / 权限凭据失效”）与请求 TraceID | 提供“重试连接”黑底按键与复制诊断信息按钮 |
| **Success** | 纯白卡片，右上方带极小深绿点（`#059669`），数值与状态平滑就绪 | 保持实时轮询或 TanStack Query 后台刷新 |

---

## 5. 无障碍 (a11y) 与键盘导航

- **颜色对比度**：纯黑字（`#09090B`）/ 纯白底（`#FFFFFF`）对比度达到 **19.8:1**（远超 WCAG AAA 7:1 标准）。
- **键盘焦点环**：所有交互控件（Button、Link、Input、Select、Switch）在获得键盘焦点时，呈现 `focus-visible: outline 2px solid #09090B; outline-offset: 2px`。
- **ESC 键支持**：所有侧边抽屉（Drawer）与模态框（Modal）按 `Escape` 立即平滑收起，并将焦点返还唤起按钮。

# Product Agent — 产品概述文档 (v2)

> 状态：已确认并实施。本文档描述「Product Agent」是什么、为谁服务、如何工作，
> 作为 UI / Agent / 后端的统一依据。
> 日期：2026-06-10（v2 重构：按 docs/saas-blueprint-framework.md 转向 Solo SaaS Builder 定位）
>
> **v2 重定位**：目标用户从「泛开发者」聚焦为 **solo SaaS builder / vibe coder**——
> 一个人、有想法、会用 AI 写代码、但产品规划能力弱。Agent 的使命：把 SaaS 想法变成
> 「可开发、可交付、可追踪、可商业化」的执行蓝图，主线为
> Idea → Customer → Problem → Use Case → MVP → Feature → Data → Page → Task →
> **Coding Prompt** → Delivery → Metrics → Iteration。
> 六阶段重构为：① Idea Intake & Founder Fit ② Customer, Problem & Positioning
> ③ MVP Scope & Feature Architecture ④ Build Blueprint（含数据模型/页面蓝图/
> **可直接粘贴给 Cursor/Claude Code 的 AI Coding Prompt**）⑤ Development Roadmap
> ⑥ Delivery, Tracking & Iteration（含上线清单与 5 个核心指标）。
> 运行时 prompt：`prompt/en/step1_idea_intake.md` 等六份。
> 以下 v1 章节中与六阶段名称/产出相关的描述以本段和源 prompt 文件为准。

---

## 1. 一句话定义

**Product Agent 是一个「AI 产品经理工作台」：用户用自然语言和一个六阶段 AI 产品经理对话，
Agent 负责把模糊的想法逐步加工成结构化、可执行、可持续维护的开发文档和 Scrum 工件
（Product Backlog → Scrum Backlog → Sprint Backlog → Burndown），并在整个开发周期内持续跟踪和调整。**

它解决的核心问题：独立开发者 / 学生 / 小团队往往「会写代码，但不会做产品规划」——
需求模糊、没有优先级、没有时间规划、文档缺失。Product Agent 把一个资深咨询团队
（需求分析师 → 情报分析师 → 产品架构师 → 解决方案架构师 → 交付经理 → 敏捷教练）
装进一个聊天框里。

---

## 2. 核心工作流：六阶段思维链（Six-Stage Chain）

Agent 不是一个普通聊天机器人，而是一条**有状态的六阶段流水线**。每个阶段由一个独立的
专家角色（System Prompt）驱动，阶段之间通过「交接摘要（Handoff Summary）」传递上下文。
六份 Prompt 源文件位于 `prompt/step1~6.md`（产品化时翻译为英文）。

| 阶段 | 角色 | 做什么 | 产出（写入系统的工件） |
|------|------|--------|------------------------|
| **Step 1 需求捕获** (Requirement Capture) | 资深业务需求分析师 | 漏斗式追问（最多3轮），从模糊描述中提取「动作 + 目的」 | **意图对 Intent Pair**（项目的 action / purpose 字段） |
| **Step 2 深度采集** (Deep Discovery) | 战略情报分析师 & 用户研究顾问 | 按「背景 / 约束 / 期望 / 能力」四维度访谈；行为事件法评估用户真实技术能力；推断相关方（评委/甲方）偏好 | **任务画像 Task Profile + 相关方分析报告**。此阶段可触发 **MCP 联网搜索**（查比赛规则、往届获奖作品、竞品等） |
| **Step 3 节点拆分** (Node Breakdown) | 首席产品架构师 | 确认最终用户 → 线性用户旅程叙事 → 拆分功能模块 → **MoSCoW 排序** → 标注关键路径 | **Product Backlog**（粗粒度 User Story 卡片，含优先级和价值理由） |
| **Step 4 三轮确认** (Three-Round Refinement) | 技术解决方案架构师 | 第一轮需求清晰化 → 第二轮转技术方案 → 第三轮目标对齐检查，每轮用户确认 | **Scrum Backlog**（细粒度可执行需求规格：编号/功能/优先级/技术方案/对齐状态，即每条卡片的详细开发文档） |
| **Step 5 执行规划** (Execution Planning) | 高级交付经理 | 20% 缓冲铁律 + 能力校准工时估算（熟练×0.8 / 基础×1.2 / 新学×1.5）→ 每日产出目标 + Sprint% + 里程碑 + 三档完成线 | **Sprint Backlog**（带工时、Sprint 百分比、里程碑的任务列表）+ Burndown 理想线 |
| **Step 6 持续跟踪** (Continuous Tracking) | 敏捷交付教练 | 用户汇报进度 → 每累计 5% 触发一次偏差评估 → 超前/持平/轻微落后/严重落后分级响应 → 动态调整计划 | **Burndown 实际线更新 + 任务状态颜色 + 计划调整记录**。循环直到交付 |

**关键设计原则（来自六份 Prompt 的共性）：**

- **不编造信息**——缺信息就问用户，或标注「待确认」。
- **每阶段必须用户确认才能推进**（✅ 确认 / ❌ 修改 / 📝 其他 三选项模式）。
- **结构化产出**——每个阶段结束输出固定格式的工件 + 交接摘要，前端把这些结构化数据
  渲染成看板卡片，而不只是聊天文本。
- **主目标锚定**——所有调整以「帮最终用户达到期望结果」为不可妥协的底线。

---

## 3. UI：三个视图，一种风格

整个应用是**单页工作台**，左侧一条窄边栏（rail）切换三个视图（对应三张线框图）。
聊天和看板是同一套数据的两个面——**对话产生工件，看板展示工件**。

### 3.1 Agent Chat（线框图 2）
- 主视图。气泡式对话流 + 底部输入框（带附件/上传按钮 + 发送按钮）。
- 六阶段进度在对话中以阶段横幅呈现（"📌 Entering Step 3 — Chief Product Architect"）。
- Agent 的提问、确认选项（✅/❌/📝）渲染为可点击的交互元素。
- 阶段产出（表格、MoSCoW 列表、计划）以结构化卡片嵌入对话流，并同步写入看板。

### 3.2 Backlogs 看板（线框图 1）
三栏布局，体现工件的「逐步精炼」管线：

| 栏 | 来源阶段 | 卡片粒度 |
|----|----------|----------|
| **Product Backlog** | Step 3 | 粗粒度功能节点（User Story + MoSCoW 优先级） |
| **Scrum Backlog** | Step 4 | 细化后的可执行需求（含技术方案的开发文档，点开看详情） |
| **Sprint Backlog** | Step 5 | 进入当前 Sprint 的任务（含工时、Sprint%） |

### 3.3 Sprint + Burndown（线框图 3）
- 左侧：Sprint Backlog 任务列表，每行右侧一个**状态色块**
  （如 红=Blocked/落后、橙=进行中有风险、蓝=进行中、黑/空=未开始、绿=完成——具体配色待定）。
- 右侧：**Burndown Chart**——理想直线（Step 5 生成） vs 实际折线（Step 6 跟踪更新）。

### 3.4 视觉风格：Apple 液态玻璃（Liquid Glass）
- 纯 CSS 实现，参照 `UI_sample/纯CSS液态玻璃/`：
  网格浅灰背景 + 容器用多层 inset 高光阴影 + `backdrop-filter: blur` + 渐变描边，
  营造真实折射感的玻璃容器。
- 看板列、卡片、聊天气泡、输入框、侧边栏按钮统一使用该玻璃容器语言。

---

## 4. 技术架构（目标形态）

```
┌─ Next.js (App Router, 单页工作台) ─────────────────────────┐
│  视图: Chat / Backlogs / Sprint+Burndown   样式: 液态玻璃 CSS │
└──────────────┬──────────────────────────────────────────────┘
               │ API Routes (streaming)
┌──────────────▼──────────────────────────────────────────────┐
│  Agent 编排层 — LangChain (LangGraph 状态机)                  │
│  · 6 个阶段节点，每节点挂载对应英文 System Prompt             │
│  · 阶段状态机：当前阶段、交接摘要、用户确认门控               │
│  · 结构化输出 (zod schema) → 工件写入                         │
│  · 工具: MCP Web Search（联网搜索，主要服务 Step 2 调研）      │
└──────────────┬──────────────────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────────────────┐
│  数据层 — 项目 / 工件存储                                     │
│  Project · IntentPair · TaskProfile · BacklogItem(3类) ·      │
│  Sprint · ProgressLog · Burndown 快照 · 生成的开发文档(MD)     │
└──────────────────────────────────────────────────────────────┘
```

- **LLM**：通过 LangChain 接入（现有代码用 DeepSeek，保留可配置）。
- **MCP Web Search**：Agent 在需要外部事实时（比赛规则、竞品、技术可行性）调用
  MCP 搜索工具，搜索结果注入阶段推理，并在相关方分析等产出中标注信息来源。
- **文档维护**：每条 Scrum Backlog 卡片背后是一份**非常详细的开发文档**
  （需求描述、技术方案、目标对齐、验收标准），支持随对话更新和 Markdown 导出——
  这是「帮用户维护合适的开发文档」这一核心价值的落点。

---

## 5. 一个典型使用故事

1. 用户："我想做个网站。" → **Step 1** 追问后锁定意图：参加 Hackathon、目标前三。
2. **Step 2** 访谈四个维度，期间 Agent 通过 MCP 搜索该比赛的评审标准和往届获奖作品，
   产出任务画像 + 「Demo 优先、概念驱动」策略。
3. **Step 3** 确定最终用户，拆出 4 Must + 2 Should + 2 Could + 2 Won't
   → **Product Backlog 栏出现 10 张卡片**。
4. **Step 4** 三轮确认把 Must/Should 细化成 F1–F7 技术规格
   → **Scrum Backlog 栏出现带开发文档的卡片**。
5. **Step 5** 算出 24h 有效时间 + 6h 缓冲，排出带 Sprint% 的计划
   → **Sprint Backlog 栏 + Burndown 理想线生成**。
6. 开发开始。用户随时回来汇报："AI 引擎做完了，多花了 2 小时。"
   → **Step 6** 触发评估，调整计划，Burndown 实际线和任务色块同步更新——直到交付。

---

## 6. 范围边界（当前版本不做）

- 多人协作 / 团队权限（单用户工作台）。
- 自动读取代码仓库判断进度（进度来自用户汇报，符合「不编造进度」原则）。
- 项目管理工具集成（Jira / Linear 等）。
- 移动端适配优先级靠后，桌面优先。

---

## 7. 已确认的产品决策（2026-06-10）

1. **Scrum Backlog 栏语义**：✅ 确认为「Step 4 细化后的需求规格」
   （Product=粗 → Scrum=细 → Sprint=进行中 的管线）。
2. **Sprint 视图的状态色块 = MoSCoW 优先级**：
   🔴 红 = Must / 🟠 橙 = Should / 🔵 蓝 = Could / ⚫ 黑（灰）= Won't。
   每条 Sprint 任务的色块来自其对应 Backlog 卡片的 MoSCoW 级别。
3. **联网搜索用 Exa**（用户已有免费额度）：通过 LangChain 接入 Exa 的 MCP server
   （`https://mcp.exa.ai/mcp`，`EXA_API_KEY`）。Stripe 是支付服务，本项目用不到。
4. **模型**：DeepSeek 为主通道（`deepseek-v4-flash` 快 / `deepseek-v4-pro` 强），
   额外保留 GPT-5.5 通道（`OPENAI_API_KEY` + `OPENAI_STRONG_MODEL=gpt-5.5`），
   现有 `model-router.ts` 已支持，保留。
5. **现有后端**：审计结论为质量合适，**复用** `src/server/scrum/`（store / schemas /
   priority / markdown / API routes）；AI 编排层（`src/server/ai/`）按本文档第 4 节
   重写为 LangChain 六阶段编排 + Exa MCP 搜索。

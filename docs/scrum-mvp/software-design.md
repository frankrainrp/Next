# Software Design Format

本文定义 ai product manager Scrum MVP 的软件形态。当前目标不是再做一个普通聊天机器人，而是做一个以传统 AI 对话为入口、以 Scrum 表格和复盘为事实源的开发指引系统。

## Expected Product Shape

界面应该由两层组成：

1. **传统 AI 对话区**
   - 用户用自然语言描述产品、功能、设计方向、架构限制、团队情况和当前问题。
   - AI 像产品经理 / Scrum Master 一样追问、总结、生成建议。
   - AI 的回答不能只停留在聊天记录里，必须能转成 Scrum artifact。

2. **Scrum 维护工作台**
   - Product Backlog、Sprint Backlog、Increment Evidence 三张核心表作为事实源。
   - Burndown chart 显示 sprint 进度。
   - Review / Retro 区记录效果复盘。
   - Priority Engine 给 backlog item 系统赋值、排序、解释原因。

核心原则：**聊天是输入和协商层，Scrum 表格是执行层。**

## Primary Layout

MVP 第一版建议采用三栏或两栏半布局。

### Desktop

| Zone | Width | Purpose |
| --- | --- | --- |
| Left rail | 28-34% | AI conversation, clarification, apply suggestions |
| Main workspace | 44-52% | Scrum 三件套表格、selected artifact detail |
| Right insight rail | 18-24% | Burndown chart, priority explanation, risks, review summary |

如果屏幕宽度不足，右侧 insight rail 可以折叠成 tab。

### Mobile

移动端按流程堆叠：

1. Chat
2. Product Backlog
3. Sprint Backlog
4. Increment Evidence
5. Burndown
6. Review / Retro

移动端不强求同时展示三栏，重点是能编辑和查看当前 sprint。

## Main Navigation

推荐顶层 tabs：

1. `Chat`
2. `Backlog`
3. `Sprint`
4. `Burndown`
5. `Review`
6. `Docs`

`Chat` 是入口，但 `Backlog` 和 `Sprint` 才是开发执行的主工作区。

## AI Conversation Behavior

AI 消息应该分成三类：

| Type | Behavior |
| --- | --- |
| Clarification | 追问缺失信息，不直接改表 |
| Proposal | 提议新增、修改、拆分、排序 Scrum artifact |
| Applied Change | 用户确认后写入表格和 decision log |

AI 不应该悄悄修改 backlog。所有影响 sprint 范围、优先级、验收标准、完成状态的变更都需要留下记录。

## Scrum Table Three-Piece

MVP 的 Scrum 表格三件套采用 Scrum 三个 artifact 的产品化表达：

1. **Product Backlog Table**
   - 管理所有候选开发项。
   - 系统根据价值、风险、依赖、紧急度、投入成本生成优先级。

2. **Sprint Backlog Table**
   - 管理当前 sprint 承诺交付的条目。
   - 每项需要 owner、status、remaining effort、blocker、done condition。

3. **Increment Evidence Table**
   - 管理已经完成并可演示的结果。
   - 每项需要验收证据、QA 状态、demo 说明、review 结论。

这三张表是产品核心，不是附属报表。

## Burndown Chart

Burndown chart 用来显示当前 sprint 的工作燃尽情况。

MVP 需要显示：

- ideal remaining line
- actual remaining line
- projected finish line
- scope change markers
- non-working day handling
- sprint start / end date

Y 轴优先使用 story points。若用户没有估点，则使用任务数量。系统必须明确显示当前使用的是哪一种。

## Review And Retro

Review 和 Retro 不应该混在一起。

Sprint Review 关注结果：

- 本 sprint 交付了什么
- demo 能不能展示
- stakeholder 反馈是什么
- 哪些 backlog item 需要调整

Retrospective 关注过程：

- 哪些做法有效
- 哪些阻碍了交付
- 下个 sprint 要实验什么改进
- 哪些 action item 需要跟踪

## Priority Engine

系统需要自动给 backlog item 赋优先级，但必须可解释。

每个 priority decision 至少显示：

- value score
- urgency score
- risk reduction score
- dependency unlock score
- confidence
- effort penalty
- final priority band
- explanation

用户可以覆盖系统优先级，但覆盖动作必须记录在 decision log。

## Expected MVP Flow

1. 用户在 Chat 输入产品想法。
2. AI 追问产品、设计、架构、交付相关问题。
3. AI 生成 Product Backlog draft。
4. 系统为 backlog items 打分和排序。
5. 用户确认进入 sprint 的 items。
6. 系统生成 Sprint Backlog。
7. 系统生成 Burndown 初始数据。
8. 开发过程中用户通过 Chat 或表格更新进度。
9. Burndown 自动更新。
10. Sprint 结束后生成 Review 和 Retro。
11. Review / Retro action items 回流 Product Backlog。

## Non-Negotiable Product Rules

- Chat output must become structured artifacts.
- Backlog rows must always include acceptance criteria.
- Sprint Backlog rows must always include done conditions.
- Increment rows must always include evidence.
- Priority scores must be explainable.
- Burndown chart must reflect scope changes, not hide them.
- Retro action items must not disappear after a sprint.

## Current Design Style

UI must follow [ui-ux-style.md](./ui-ux-style.md): Vintage Analog / Retro Film with warm, readable, task-focused Scrum surfaces.

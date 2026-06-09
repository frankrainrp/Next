# Scrum Artifacts And Tables

本文定义 ai product manager MVP 中需要维护的 Scrum 表格三件套、燃尽图和复盘记录。

## Table 1: Product Backlog

Product Backlog 是所有候选开发项的事实源。

| Column | Required | Description |
| --- | --- | --- |
| ID | Yes | Stable item id, for example `PBI-001`. |
| Title | Yes | Short feature or story title. |
| User Story | Yes | `As a..., I want..., so that...`. |
| Problem | Yes | The user or team problem this item solves. |
| Acceptance Criteria | Yes | Checklist-style done requirements. |
| Priority Score | Yes | System-generated score. |
| Priority Band | Yes | `P0`, `P1`, `P2`, or `P3`. |
| Effort | Yes | Story points or small/medium/large. |
| Risk | Yes | Product, design, technical, or delivery risk. |
| Dependency | No | Items or constraints that must be completed first. |
| Source | Yes | Chat, review, retro, manual, imported doc. |
| Status | Yes | Idea, Ready, Selected, Deferred, Done, Dropped. |
| Explanation | Yes | Why the system ranked it this way. |

Rules:

- A row without acceptance criteria cannot become `Ready`.
- A row without priority explanation cannot be selected for sprint.
- AI can propose rows, but user confirmation applies rows.

## Table 2: Sprint Backlog

Sprint Backlog is the current sprint execution source.

| Column | Required | Description |
| --- | --- | --- |
| Sprint ID | Yes | For example `SPR-001`. |
| PBI ID | Yes | Link back to Product Backlog. |
| Task ID | Yes | Stable sprint task id. |
| Task | Yes | Concrete development task. |
| Owner | No | Person or team role. |
| Status | Yes | Todo, In Progress, Blocked, Review, Done. |
| Remaining Effort | Yes | Remaining story points, hours, or task count. |
| Done Condition | Yes | What must be true before Done. |
| Blocker | No | Current blocker, if any. |
| Due / Target Date | No | Optional internal sprint target. |
| Evidence Link | No | Link or note after completion. |

Rules:

- Sprint Backlog is derived from Product Backlog but can be broken into smaller tasks.
- Status changes update burndown data.
- Blocked items must appear in the daily Scrum summary.
- Done status requires evidence or explicit manual confirmation.

## Table 3: Increment Evidence

Increment Evidence records what is actually done and reviewable.

| Column | Required | Description |
| --- | --- | --- |
| Increment ID | Yes | Stable id, for example `INC-001`. |
| PBI ID | Yes | Link to Product Backlog. |
| Sprint ID | Yes | Sprint where it was completed. |
| Deliverable | Yes | What was shipped or demonstrated. |
| Acceptance Evidence | Yes | How acceptance criteria were proven. |
| QA Status | Yes | Untested, Passed, Failed, Waived. |
| Demo Notes | No | What to show in sprint review. |
| Review Decision | Yes | Accepted, Needs Follow-up, Deferred. |
| Follow-up Item | No | New backlog item if needed. |

Rules:

- Increment Evidence is not a task list.
- It records verified output.
- Failed QA creates follow-up backlog items or returns work to Sprint Backlog.

## Burndown Data

Burndown chart uses sprint work data.

Required fields:

- sprintStartDate
- sprintEndDate
- workingDays
- totalCommittedPoints
- remainingByDay
- idealRemainingByDay
- scopeChanges
- blockedCountByDay

Chart rules:

- Ideal line decreases only on configured working days.
- Actual line uses remaining work from Sprint Backlog.
- Scope increases must be marked visually.
- If estimates are missing, use task count and label the chart clearly.
- The chart should not pretend progress happened on days where no status changed.

## Review Record

Sprint Review records outcome quality.

| Field | Description |
| --- | --- |
| Sprint Goal | Goal agreed before sprint. |
| Demo Outcome | What was shown. |
| Accepted Items | Increments accepted. |
| Rejected / Follow-up Items | Items needing changes. |
| Stakeholder Feedback | Feedback from review. |
| Backlog Changes | New, reprioritized, or removed backlog items. |

## Retro Record

Retrospective records process improvement.

| Field | Description |
| --- | --- |
| What Worked | Practices to keep. |
| What Did Not Work | Process or coordination problems. |
| Root Cause | Why problems happened. |
| Experiment | Improvement to try next sprint. |
| Action Item | Concrete action. |
| Owner | Person or role responsible. |
| Due Date | When to check action. |

Rules:

- Retro action items must become backlog items or tracked improvement tasks.
- Review feedback affects product backlog.
- Retro feedback affects process and sprint planning.

## Daily Scrum Summary

The MVP does not need a full meeting tool, but it should generate a daily summary:

- completed since last update
- planned next
- blockers
- risk to sprint goal
- recommended priority adjustment

This summary should update Sprint Backlog and burndown state.

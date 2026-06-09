# Priority Model

本文定义系统如何给 backlog item 自动赋值、排序和解释优先级。

## Goal

Priority Engine 的目标不是替用户拍脑袋，而是让排序依据显性化。系统可以建议优先级，用户可以覆盖，但所有覆盖都必须记录原因。

## Score Inputs

所有分项使用 1-5 分。

| Factor | Weight | Meaning |
| --- | ---: | --- |
| User Value | 25 | 对最终用户或主要使用者的直接价值。 |
| Product / Business Value | 20 | 对产品目标、MVP 成功标准、商业结果的贡献。 |
| Urgency | 15 | 时间敏感度、deadline、外部窗口。 |
| Risk Reduction | 15 | 是否能提前降低技术、设计、交付或需求风险。 |
| Dependency Unlock | 15 | 是否能解锁后续多个工作项。 |
| Confidence | 10 | 当前信息是否足够明确，能否稳定实施。 |

Effort is a penalty, not a value factor.

Recommended effort scale:

- 1 = very small
- 2 = small
- 3 = medium
- 5 = large
- 8 = very large
- 13 = too large, should split

## Formula

```text
valueScore =
  ((UserValue * 25)
 + (BusinessValue * 20)
 + (Urgency * 15)
 + (RiskReduction * 15)
 + (DependencyUnlock * 15)
 + (Confidence * 10)) / 5

priorityScore = round(valueScore / sqrt(max(Effort, 1)))
```

This keeps high-value small items near the top, while large items must justify their cost.

## Priority Bands

| Band | Score | Meaning |
| --- | ---: | --- |
| P0 | 75+ | Sprint-critical or must address now. |
| P1 | 55-74 | Strong candidate for current sprint. |
| P2 | 35-54 | Useful but can wait or needs clarification. |
| P3 | 0-34 | Defer, split, or drop. |

## Required Explanation

Every system priority must include:

- top scoring reason
- biggest weakness
- effort penalty
- dependency impact
- whether the item should be split
- whether user confirmation is needed

Example:

```text
PBI-004 is P1 because it unlocks sprint planning and directly supports MVP success.
Weakness: acceptance criteria are incomplete.
Effort penalty: medium.
Recommendation: clarify acceptance criteria before selecting it for Sprint 1.
```

## Human Override

Users may override priority when they know context the AI does not.

Override record must include:

- old priority
- new priority
- user reason
- timestamp
- affected sprint or backlog item

## AI Rules

- Do not assign P0 to more than 20% of backlog items.
- If effort is 13, recommend splitting before sprint selection.
- If confidence is below 3, ask clarification before promoting to Ready.
- If acceptance criteria are missing, status must stay below Ready.
- If a priority changes because of review or retro feedback, link the change to that source.

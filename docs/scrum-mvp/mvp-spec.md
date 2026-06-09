# Scrum MVP Specification

## MVP Goal

Build a usable AI Scrum PM workflow that converts a rough software idea into a first sprint development package.

The MVP should help a team move from uncertainty to implementation-ready Scrum artifacts.

## Primary Workflow

1. Input rough idea.
2. AI extracts product goal, user type, business value, constraints, and unknowns.
3. AI asks clarification questions.
4. User confirms or edits the product direction.
5. AI generates a product brief.
6. AI generates user stories.
7. AI generates acceptance criteria.
8. AI ranks backlog items.
9. AI proposes a sprint goal.
10. AI selects a sprint backlog.
11. AI generates developer guidance.
12. AI generates QA checklist.
13. User applies confirmed items into Product Backlog, Sprint Backlog, and Increment Evidence tables.
14. System updates burndown, review records, retro actions, and priority scores.

## MVP Screens

Current screen model:

- Traditional AI conversation.
- Scrum table three-piece.
- Burndown chart.
- Review / Retro panel.
- Priority explanation panel.

### 1. Idea Intake

Purpose:

- collect the user's raw product idea
- collect target users
- collect product type
- collect team context
- collect constraints

Required fields:

- product or feature idea
- target users
- intended outcome
- platform
- known design constraints
- known architecture constraints
- timeline expectation

### 2. Clarification

Purpose:

- identify missing information before generating backlog items

AI should ask about:

- user goal
- core workflow
- must-have features
- excluded features
- user roles
- data involved
- integration needs
- quality bar
- deadline or sprint length

### 3. Product Brief

Purpose:

- convert raw idea into a concise product document

Output sections:

- product summary
- target users
- problem
- value
- MVP scope
- non-goals
- assumptions
- risks

### 4. Scrum Backlog

Purpose:

- create user stories and prioritize them

Each backlog item must include:

- title
- user story
- priority
- reason
- acceptance criteria
- dependencies
- estimated complexity
- suggested sprint inclusion

### 4A. Scrum Table Three-Piece

The MVP must maintain:

- Product Backlog Table
- Sprint Backlog Table
- Increment Evidence Table

These are the execution source of truth. Chat history is not the source of truth.

### 5. Sprint Plan

Purpose:

- create a first sprint plan from the backlog

Output sections:

- sprint goal
- selected stories
- deferred stories
- risks
- expected demo result
- development notes

### 6. Developer Guidance

Purpose:

- give developers enough context to implement

Each selected story should include:

- expected behavior
- UI/state notes
- API/data notes
- edge cases
- test checklist
- done condition

## Core Data Objects

### ProductBrief

- id
- title
- summary
- targetUsers
- problem
- value
- scope
- nonGoals
- assumptions
- risks
- createdAt
- updatedAt

### UserStory

- id
- productBriefId
- title
- role
- need
- benefit
- priority
- complexity
- dependencies
- acceptanceCriteria
- status

### SprintPlan

- id
- productBriefId
- sprintGoal
- sprintLength
- selectedStoryIds
- deferredStoryIds
- risks
- demoOutcome
- developerNotes
- qaChecklist

### DecisionLogEntry

- id
- productBriefId
- decision
- reason
- impact
- createdAt

### PriorityScore

- id
- backlogItemId
- userValue
- businessValue
- urgency
- riskReduction
- dependencyUnlock
- confidence
- effort
- finalScore
- priorityBand
- explanation

### BurndownPoint

- id
- sprintPlanId
- date
- idealRemaining
- actualRemaining
- projectedRemaining
- scopeChange
- blockedCount

### ReviewRecord

- id
- sprintPlanId
- demoOutcome
- acceptedItems
- followUpItems
- stakeholderFeedback
- backlogChanges

### RetroRecord

- id
- sprintPlanId
- whatWorked
- whatDidNotWork
- rootCause
- experiment
- actionItems

## User Stories For The MVP

### Story 1: Submit Rough Product Idea

As a product owner, I want to submit a rough product idea so that the AI can turn it into structured Scrum planning material.

Acceptance criteria:

- User can enter a free-form idea.
- User can add target users, platform, and constraints.
- User can submit without filling every optional field.
- System preserves the original raw input.

### Story 2: Receive Clarifying Questions

As a product owner, I want the AI to ask focused questions so that missing requirements are handled before backlog generation.

Acceptance criteria:

- AI generates a short list of relevant questions.
- Questions are grouped by product, design, architecture, and delivery.
- User can answer, skip, or edit responses.
- AI uses the answers in later generated artifacts.

### Story 3: Generate Product Brief

As a team member, I want a concise product brief so that everyone understands the goal and MVP boundary.

Acceptance criteria:

- Brief includes summary, target users, problem, value, scope, non-goals, assumptions, and risks.
- User can edit the brief.
- Brief is used as the source for backlog generation.

### Story 4: Generate Scrum Backlog

As a scrum team, I want user stories with acceptance criteria so that developers can start from clear tasks.

Acceptance criteria:

- System generates 5 to 12 user stories.
- Every story uses the format: "As a..., I want..., so that..."
- Every story has acceptance criteria.
- Every story has priority and estimated complexity.
- Stories can be selected or deferred.

### Story 5: Generate Sprint Plan

As a scrum master, I want a first sprint plan so that the team can focus on a realistic delivery slice.

Acceptance criteria:

- System proposes a sprint goal.
- System selects a realistic subset of backlog items.
- System explains why selected items are included.
- System lists deferred items and reasons.
- System defines a demo outcome.

### Story 6: Generate Developer Guidance

As a developer, I want implementation guidance for each selected story so that I know what to build and how to verify it.

Acceptance criteria:

- Each selected story has behavior notes.
- Each selected story has UI/state notes when relevant.
- Each selected story has API/data notes when relevant.
- Each selected story has edge cases.
- Each selected story has a QA checklist.

## MVP Acceptance Criteria

The MVP is acceptable when:

- a user can enter a rough idea
- the AI can produce clarification questions
- the AI can produce a product brief
- the AI can produce user stories
- the AI can produce acceptance criteria
- the AI can create a first sprint plan
- the AI can create developer guidance
- generated artifacts are visible as structured sections, not only chat messages
- the user can edit or regenerate important sections

## AI Behavior Rules

The AI must:

- ask before assuming when a missing detail changes scope
- mark assumptions clearly
- keep MVP scope narrow
- produce structured artifacts
- avoid vague backlog items
- include acceptance criteria for every story
- explain priority decisions
- separate selected and deferred work
- avoid promising delivery certainty
- propose artifact mutations instead of silently applying them
- show priority scoring factors and explanation
- record review and retro outputs as structured artifacts

## First Implementation Slice

The first implementation slice should be:

1. A single page workflow.
2. Raw idea input.
3. AI-generated clarification questions.
4. Editable product brief preview.
5. Generated backlog with acceptance criteria.
6. Generated first sprint plan.
7. Scrum table three-piece with mock data.
8. Burndown chart with mock sprint data.
9. Review / Retro mock panel.

Do not build integrations before this flow works locally.

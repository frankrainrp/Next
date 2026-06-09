# Scrum MVP Documentation Index

This folder is the current development basis for **ai product manager**.

## Document Map

| File | Purpose |
| --- | --- |
| [software-design.md](./software-design.md) | Defines the target product shape: AI chat plus Scrum workspace. |
| [scrum-artifacts.md](./scrum-artifacts.md) | Defines Product Backlog, Sprint Backlog, Increment Evidence, burndown, review, and retro records. |
| [priority-model.md](./priority-model.md) | Defines explainable system priority scoring. |
| [product-brief.md](./product-brief.md) | Defines the product, target users, value, and MVP boundaries. |
| [mvp-spec.md](./mvp-spec.md) | Defines the Scrum MVP scope, user flows, backlog, and acceptance criteria. |
| [development-docs.md](./development-docs.md) | Defines the documentation system developers need during software development. |
| [ui-ux-style.md](./ui-ux-style.md) | Defines the dark Liquid Glass default UI and preserved Sketch theme direction. |
| [source-notes.md](./source-notes.md) | Records local old notes used as references for burndown and dashboard behavior. |

Related root docs:

| File | Purpose |
| --- | --- |
| [../mcp-six-stage-tools.md](../mcp-six-stage-tools.md) | Defines the AI Chat six-stage MCP tool contract and `/api/mcp` behavior. |
| [../ai-chat-six-stage-prompts.md](../ai-chat-six-stage-prompts.md) | Defines the six-stage prompt structure and confirmation rules. |

## Current Product Summary

ai product manager is an AI product manager for software teams. It turns rough product ideas, design directions, architecture constraints, and team context into Scrum-ready development guidance.

The current MVP only focuses on Scrum:

- clarify the product goal
- produce a product brief
- generate user stories
- define acceptance criteria
- prioritize a backlog
- plan a sprint
- give developers implementation guidance

## Required Product Format

The MVP should feel like a traditional AI assistant connected to a Scrum maintenance console:

- AI chat captures context and proposes changes.
- Product Backlog, Sprint Backlog, and Increment Evidence are maintained as the core table three-piece.
- Burndown chart reflects sprint health and scope changes.
- Review and Retro records turn outcomes and process lessons back into backlog/action items.
- Priority Engine assigns explainable scores and priority bands.

## UI/UX Direction

The default visual direction is the dark iOS Liquid Glass SaaS UI. The earlier **Vintage Analog / Retro Film** direction remains available as the `Sketch` theme and should stay readable for Scrum artifacts.

## Working Assumption

The product name is treated as a working name. The MVP behavior matters more than the name: the tool must flatten ambiguity between product, design, architecture, and development work.

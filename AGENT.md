# AI Scrum PM Development Brief

This repository is now oriented around the working product direction: **ai product manager**.

The current MVP is not a generic project-management assistant. It is an AI product manager focused on Scrum delivery guidance for design, architecture, and development teams.

## Current Source Of Truth

Read these files first:

1. [PROGRESS.md](./PROGRESS.md)
2. [TODO.md](./TODO.md)
3. [docs/scrum-mvp/README.md](./docs/scrum-mvp/README.md)
4. [docs/scrum-mvp/software-design.md](./docs/scrum-mvp/software-design.md)
5. [docs/scrum-mvp/scrum-artifacts.md](./docs/scrum-mvp/scrum-artifacts.md)
6. [docs/scrum-mvp/priority-model.md](./docs/scrum-mvp/priority-model.md)
7. [docs/scrum-mvp/product-brief.md](./docs/scrum-mvp/product-brief.md)
8. [docs/scrum-mvp/mvp-spec.md](./docs/scrum-mvp/mvp-spec.md)
9. [docs/scrum-mvp/development-docs.md](./docs/scrum-mvp/development-docs.md)
10. [docs/scrum-mvp/ui-ux-style.md](./docs/scrum-mvp/ui-ux-style.md)
11. [docs/architecture.md](./docs/architecture.md)
12. [docs/security.md](./docs/security.md)
13. [docs/api-contract.md](./docs/api-contract.md)
14. [docs/ai-function-todo.md](./docs/ai-function-todo.md)
15. [docs/ui-ux-audit-2026-06-08.md](./docs/ui-ux-audit-2026-06-08.md)
16. [docs/mcp-six-stage-tools.md](./docs/mcp-six-stage-tools.md)
17. [docs/ai-chat-six-stage-prompts.md](./docs/ai-chat-six-stage-prompts.md)

Older top-level documents such as `PROJECT_MANAGEMENT_AI_TECHNICAL_SPEC.md` and `MVP_TECHNICAL_DECISIONS.md` are historical references. Use them for technology context only after checking the current Scrum MVP docs above.

## MVP Focus

The current product only supports Scrum MVP planning and guidance:

- Convert an unclear software idea into a Scrum-ready product brief.
- Generate user stories, acceptance criteria, backlog items, sprint goals, and developer guidance.
- Help a team decide what to build first, what to defer, and how to verify done work.
- Keep decisions and progress visible enough for developers to work without guessing.

Do not expand into Kanban, Waterfall, SAFe, OKR tooling, multi-framework governance, enterprise portfolio management, or broad AI-agent orchestration until the Scrum MVP is working.

## Current Product Shape

The target software format is:

- traditional AI chat as the input and negotiation layer
- the 6-step Scrum builder inside AI Chat as a subfunction
- Product Backlog, Scrum Backlog, and Sprint Backlog as the main working board
- backlog cards that open developer-facing technical requirement details
- Increment Evidence generated from completed sprint items
- burndown chart for sprint health
- review and retro records for outcome and process learning
- one-click Markdown export for all core Scrum artifacts
- visible AI agent preset prompts that can be included in exported Markdown
- six-stage MCP tools available through `/api/mcp` for agent-facing Scrum workflow calls
- explainable system priority scoring for backlog ordering
- clean main workspace with secondary controls and runtime feedback moved into Settings

Chat is not the source of truth. Confirmed Scrum artifacts are the source of truth.

This must be a real SaaS architecture, not a demo-only web page. Preserve API routes, Prisma models, auth boundaries, and persistence contracts while building UI.

Current local state: the MVP has a usable dev flow backed by `.data/scrum-store.json`. This is only a local persistence layer. Production work still needs Prisma-backed services, auth, ownership checks, and decision logs.

## Working Rules

- Product docs lead implementation.
- Default UI is the dark Liquid Glass theme based on `UI_sample/纯CSS液态玻璃` with Instagram-like dark contrast. The old Vintage Analog / Retro Film sketch direction is preserved as the `Sketch` theme in the app.
- UI layout should stay aligned with `UI/chat.png`, `UI/backlogs.png`, and `UI/scrum.png`; the 6-step Scrum flow belongs inside AI Chat.
- Every feature needs acceptance criteria before coding.
- Every sprint feature should map back to a user story and a measurable done condition.
- AI-proposed changes must be confirmed before mutating Scrum artifacts.
- The six-stage MCP tools must follow `docs/mcp-six-stage-tools.md`; mutating MCP calls require explicit user confirmation and `confirmed: true`.
- AI Chat prompt behavior must follow `docs/ai-chat-six-stage-prompts.md`.
- Runtime stage prompts live in `prompt/step1_需求捕获.md` through `prompt/step6_持续跟踪.md`; `/api/ai/chat` selects them with `promptStage`.
- Priority changes must show system reasoning or a human override reason.
- UI work must map to API contracts in `docs/api-contract.md`.
- Backlog technical detail and Markdown export must stay API-backed, not page-only behavior.
- DeepSeek provider wiring must stay isolated in `src/server/ai/deepseek.ts`; `/api/ai/chat` may fall back to local structured proposals, while `/api/ai/deepseek` is the direct provider interface.
- Burndown must separate actual history from projected future points; do not show future dates as real actual progress.
- Keep the main UI free of demo data, debug strings, and configuration clutter.
- Do not create page-only state as the long-term source of truth.
- Keep documents short enough to be used during development.
- Update `PROGRESS.md` when the product direction, implementation state, or next task changes.

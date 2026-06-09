# Todo

This is the active task list for **ai product manager** Scrum MVP.

## Now

- [x] Replace the old planning workspace UI with the new AI Chat + Scrum Workspace layout.
- [x] Keep the 6-step Scrum builder inside AI Chat as a subfunction.
- [x] Align the UI with `UI/chat.png`, `UI/backlogs.png`, and `UI/scrum.png`.
- [x] Wire Product Backlog to `/api/projects/[projectId]/backlog`.
- [x] Wire Sprint Backlog to `/api/projects/[projectId]/sprints`.
- [x] Wire Increment Evidence to persisted sprint/increment data.
- [x] Implement Burndown chart against the burndown API.
- [x] Implement Review / Retro panel against review and retro APIs.
- [x] Add priority scoring utility based on `docs/scrum-mvp/priority-model.md`.
- [x] Add proposal confirmation flow between AI chat and Scrum artifacts.
- [x] Replace contract placeholder handlers with usable local dev persistence.
- [ ] Replace local dev persistence with Prisma-backed services.
- [ ] Add auth and project ownership checks.

## Next

- [x] Define Zod schemas for Product Backlog, Sprint Backlog, Increment Evidence, Review, Retro, and Priority Score.
- [x] Add SaaS API contract routes for projects, backlog, sprints, burndown, reviews, retros, and proposals.
- [x] Add Prisma Scrum domain models.
- [x] Add Prisma dependencies and Prisma 7 config.
- [x] Add server-side dev persistence in `.data/scrum-store.json`.
- [x] Add task update API: `PATCH /api/projects/[projectId]/sprints/[sprintId]/items/[itemId]`.
- [x] Verify UI flow in browser from workspace creation through Review / Retro save.
- [x] Add clickable Backlog technical requirement detail panel.
- [x] Add Backlog technical documentation API.
- [x] Add one-click Markdown export for the full Scrum workspace.
- [x] Add AI agent preset prompt support inside Markdown export.
- [x] Wire `/api/ai/chat` to DeepSeek with validated structured proposals and local fallback.
- [x] Move debug/settings controls out of the main workspace and into Settings.
- [x] Remove prefilled demo prompt and review/retro placeholder content from the default UI.
- [x] Add blue-glow black Liquid Glass feedback styling.
- [x] Add detailed AI function completion todo in `docs/ai-function-todo.md`.
- [x] Add UI/UX audit record in `docs/ui-ux-audit-2026-06-08.md`.
- [x] Add DeepSeek API key field to Settings and send it with AI requests.
- [x] Add AI Chat six-stage MCP tool endpoint and tool definitions.
- [x] Add six-stage prompt structure documentation.
- [x] Load user-provided six-stage prompts from `prompt/`.
- [x] Add Prompt stage selector and non-mutating Test prompt action in AI Chat.
- [x] Add `/api/ai/prompts` for prompt catalog inspection.
- [ ] Add editable artifact detail drawer.
- [ ] Add tests for priority scoring.
- [ ] Add tests for burndown actual/projected data calculation.
- [ ] Add tests for prompt stage loading and `/api/ai/chat` promptStage routing.
- [ ] Add tests for `/api/mcp` tools/list and confirmation-required behavior.
- [ ] Add tests for API validation and ownership rejection.
- [ ] Add decision log writes for confirmed AI proposal application.

## Later

- [ ] Add file upload as product/design/architecture context.
- [x] Add export to Markdown.
- [ ] Add import/export for Jira or Linear only after local workflow is stable.
- [ ] Add sprint history.
- [ ] Add team member and owner management.
- [ ] Add billing and workspace limits after auth exists.

## Do Not Do Yet

- [ ] Do not build Jira/Linear integration before the local workflow works.
- [ ] Do not build multi-framework agile support.
- [ ] Do not build autonomous coding.
- [ ] Do not build enterprise reporting dashboards.
- [ ] Do not replace Scrum artifacts with chat-only history.
- [ ] Do not build a demo-only page that bypasses API contracts.

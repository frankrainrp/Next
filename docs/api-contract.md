# SaaS API Contract

This product must be built as a real SaaS, not as a demo-only page.

The UI may start with mock data during early development, but every core interaction must map to a stable API contract and a persistent domain model.

## API Principles

- Keep API routes even while UI is being redesigned.
- Do not put the source of truth in React component state.
- Chat messages may propose changes, but Scrum artifacts are persisted records.
- Mutations require validation, auth, ownership checks, and decision logging before production.
- API payloads must be validated with Zod.
- API handlers should remain provider/database agnostic at the boundary.

## Retained Core Endpoints

Existing endpoints that must remain:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Runtime/service readiness and API surface check. |
| `POST /api/ai/chat` | AI conversation and artifact proposal generation. |
| `POST /api/ai/deepseek` | Direct DeepSeek structured Scrum proposal interface. |
| `GET /api/ai/prompts` | List or inspect the six runtime stage prompt files from `prompt/`. |
| `POST /api/mcp` | JSON-RPC MCP endpoint for the AI Chat six-stage Scrum tools. |
| `POST /api/files/upload` | Product/design/architecture context upload. |
| `POST /api/inngest` | Background workflow entrypoint. |

New SaaS Scrum endpoints:

| Endpoint | Purpose |
| --- | --- |
| `GET /api/projects` | List user's projects. |
| `POST /api/projects` | Create a project workspace. |
| `GET /api/projects/[projectId]/backlog` | Read Product Backlog. |
| `POST /api/projects/[projectId]/backlog` | Create Product Backlog item. |
| `GET /api/projects/[projectId]/backlog/[itemId]/technical-doc` | Read developer-facing technical requirements for one backlog item. |
| `GET /api/projects/[projectId]/sprints` | Read project sprints. |
| `POST /api/projects/[projectId]/sprints` | Create sprint plan. |
| `GET /api/projects/[projectId]/sprints/[sprintId]/burndown` | Read burndown series. |
| `PATCH /api/projects/[projectId]/sprints/[sprintId]/items/[itemId]` | Update sprint task status, remaining effort, blocker, and evidence. |
| `GET /api/projects/[projectId]/reviews` | Read sprint reviews. |
| `POST /api/projects/[projectId]/reviews` | Create sprint review record. |
| `GET /api/projects/[projectId]/retros` | Read sprint retrospectives. |
| `POST /api/projects/[projectId]/retros` | Create retrospective record. |
| `GET /api/projects/[projectId]/ai/proposals` | Read pending AI artifact proposals. |
| `POST /api/projects/[projectId]/ai/proposals` | Create AI artifact proposal. |
| `POST /api/projects/[projectId]/exports/markdown` | Export project Scrum artifacts, technical docs, and optional AI agent prompt preset as Markdown. |

## Current Implementation State

The endpoints now support a usable local dev workflow.

Meaning:

- Route handlers exist.
- Request payloads are validated where applicable.
- Projects, backlog items, sprints, sprint task updates, burndown, reviews, retros, and proposals are persisted server-side in `.data/scrum-store.json`.
- `/api/ai/chat` calls DeepSeek when either `DEEPSEEK_API_KEY` is configured server-side or `providerApiKey` is supplied per request from Settings. It can return a local structured Product Backlog proposal when provider access is unavailable.
- `/api/ai/deepseek` is the direct provider interface and returns `503` only when neither `DEEPSEEK_API_KEY` nor request `providerApiKey` is configured.
- `/api/ai/chat` and `/api/ai/deepseek` accept optional `promptStage` values: `step1`, `step2`, `step3`, `step4`, `step5`, or `step6`.
- `/api/ai/prompts` returns the loaded stage prompt catalog; `/api/ai/prompts?stage=step3` returns one prompt file for inspection.
- `/api/mcp` exposes the six-stage Scrum MCP tools through JSON-RPC `initialize`, `tools/list`, and `tools/call`.
- MCP tools reuse the same Scrum service semantics as the API routes; mutating tool calls return a confirmation request unless `confirmed: true` is supplied.
- Every backlog item can generate a technical requirement detail document.
- Markdown export includes project, backlog, technical docs, sprints, increments, burndown, reviews, retros, and agent preset prompts.
- This is still not the final production SaaS implementation.
- Prisma dependencies are installed.
- Prisma v7 config exists in `prisma.config.ts`; the database URL is configured there instead of inside `schema.prisma`.
- Production work must replace the local JSON store with Prisma-backed services and ownership checks.

## Required Production Behavior

Before production:

1. Add auth middleware.
2. Resolve the current user.
3. Check project ownership on every project-scoped endpoint.
4. Persist data through Prisma.
5. Write decision log entries for important mutations.
6. Ensure AI proposals require confirmation before artifact mutation.
7. Add rate limits to AI and file endpoints.

## Domain Models

The Prisma schema now includes SaaS Scrum models:

- `ProductBacklogItem`
- `ScrumSprint`
- `SprintBacklogItem`
- `IncrementEvidence`
- `BurndownPoint`
- `PriorityScore`
- `SprintReview`
- `SprintRetro`
- `ArtifactProposal`
- `DecisionLogEntry`

These models are the durable source of truth for the SaaS.

Burndown API note:

- `actualRemaining` is a number for real history points and `null` for future sprint dates.
- `projectedRemaining` is the forecast line for future dates.
- UI must not treat projected future points as completed actual progress.

## API And UI Relationship

UI components should call or be designed around these API boundaries:

| UI Surface | API |
| --- | --- |
| AI chat | `POST /api/ai/chat` |
| Direct DeepSeek proposal | `POST /api/ai/deepseek` |
| Prompt stage inspection | `GET /api/ai/prompts` |
| AI Chat six-stage MCP tools | `POST /api/mcp` |
| Product Backlog table | `/api/projects/[projectId]/backlog` |
| Backlog technical detail | `/api/projects/[projectId]/backlog/[itemId]/technical-doc` |
| Sprint Backlog table | `/api/projects/[projectId]/sprints` |
| Sprint task status | `PATCH /api/projects/[projectId]/sprints/[sprintId]/items/[itemId]` |
| Burndown chart | `/api/projects/[projectId]/sprints/[sprintId]/burndown` |
| Review panel | `/api/projects/[projectId]/reviews` |
| Retro panel | `/api/projects/[projectId]/retros` |
| Proposal confirmation | `/api/projects/[projectId]/ai/proposals` |
| Context upload | `POST /api/files/upload` |
| Markdown export | `POST /api/projects/[projectId]/exports/markdown` |

## Non-Negotiable Rule

Do not build a feature that only works inside a single static page unless its SaaS API contract, persistence model, and ownership boundary are also defined.

## API Key Handling

- Settings can store a DeepSeek API key in the user's browser local storage.
- The UI sends that key as `providerApiKey` only when calling AI endpoints.
- The key must not be written into `.data/scrum-store.json`, Scrum artifacts, technical docs, or Markdown exports.
- Provider error responses must not echo raw provider error bodies because they can include masked key fragments or provider account details.
- Production multi-user mode should replace browser-local keys with an encrypted user secret store or organization-level provider configuration.

## MCP Handling

- MCP endpoint: `POST /api/mcp`.
- Discovery endpoint for local development: `GET /api/mcp`.
- Implemented tools are documented in [mcp-six-stage-tools.md](./mcp-six-stage-tools.md).
- Prompt behavior is documented in [ai-chat-six-stage-prompts.md](./ai-chat-six-stage-prompts.md).
- MCP tools must not bypass Scrum API validation, persistence, ownership checks, or future decision logs.

# Progress

Date reset: 2026-06-08 · Product Agent rework started: 2026-06-10

Current product direction: **Product Agent — AI Product Manager for Solo SaaS Builders**. The user
chats with one stateful agent (LangChain orchestration + Exa MCP web search) that walks
Idea Intake & Founder Fit → Customer/Problem/Positioning → MVP Scope & Feature Architecture →
Build Blueprint (data model + pages + AI coding prompts) → Development Roadmap →
Delivery/Tracking/Iteration, writing artifacts (Product/Scrum/Sprint Backlog, Burndown,
per-feature Cursor/Claude-Code prompts) through tools as each stage is confirmed.
Source of truth: `docs/product-agent-overview.md` + `docs/saas-blueprint-framework.md`.

## Current Status (2026-06-10)

- The standalone 6-step Wizard view was REMOVED (component, page wiring, CSS). The six-stage flow
  now lives in the conversational agent itself.
- Runtime stage prompts are the English translations in `prompt/en/step1_*.md` … `step6_*.md`
  (Chinese originals in `prompt/` are kept as source references).
- New agent layer in `src/server/ai/`: `lc-models.ts` (DeepSeek primary + GPT-5.5 channel via
  LangChain), `exa-search.ts` (Exa MCP tools, REST fallback), `agent-session.ts` (per-project stage
  state machine persisted in `.data/agent-sessions.json`), `agent-tools.ts` (artifact-writing tools,
  confirmation-gated), `six-stage-agent.ts` (ReAct orchestration).
- New routes: `POST /api/agent/chat`, `GET/DELETE /api/agent/session`.
- Chat UI talks to the real agent: stage progress chips, session restore, auto-creates a project on
  first message. Boards refresh after every agent reply.
- MoSCoW is mapped 1:1 onto priority bands and shown as colored chips:
  Must=P0 red, Should=P1 orange, Could=P2 blue, Won't=P3 black/muted.
- Requires `pnpm install` (new deps: @langchain/core, @langchain/openai, @langchain/langgraph,
  @langchain/mcp-adapters) and `.env`: DEEPSEEK_API_KEY (+ optional OPENAI_API_KEY, EXA_API_KEY).
- Prisma Scrum models and API schemas exist, but production Prisma services and auth are still pending.

Required UI/UX direction:

- Use the user's UI reference images in `UI/chat.png`, `UI/backlogs.png`, and `UI/scrum.png` as the layout target.
- Default UI is an English dark Liquid Glass SaaS interface using the user's `UI_sample/纯CSS液态玻璃` reference and Instagram-like dark contrast.
- The earlier Vintage Analog / Retro Film paper/sketch interface is preserved as a switchable `Sketch` theme.

## Active MVP Scope

Current phase: Scrum-only MVP implementation.

Core Scrum workspace:

- Product Backlog.
- Scrum Backlog / confirmed proposal queue.
- Sprint Backlog.
- Increment Evidence generated from done sprint tasks.
- Burndown chart.
- Review / Retro records.
- Explainable priority scoring.

SaaS requirement:

- This must not become a demo-only page.
- Core Scrum data must have API contracts, persistence path, Prisma models, auth boundaries, and production service wiring.
- Chat history is not the source of truth; confirmed Scrum artifacts are.

## Completed In This Reset

- Defined the documentation basis developers need.
- Defined the product direction as an AI Scrum product manager.
- Created the Scrum MVP documentation structure.
- Removed the old reference snapshot from the workspace.
- Adopted the UI style direction and added the user's three UI reference images.
- Added software design format for AI Chat + Scrum Workspace.
- Added Scrum artifact table definitions.
- Added system priority scoring model.
- Added architecture, security, progress index, source notes, and todo documents.
- Added SaaS API contract and route handlers for core Scrum surfaces.
- Added Prisma Scrum domain models, Zod API schemas, Prisma dependencies, and Prisma 7 config.
- Added a local dev Scrum store at `.data/scrum-store.json`.
- Replaced placeholder contract handlers with usable local API behavior for projects, backlog, sprints, sprint task updates, burndown, reviews, retros, and proposals.
- Rebuilt the home UI into a sketch-style SaaS shell matching the reference layout:
  - left rail navigation
  - AI Chat canvas
  - in-chat 6-step Scrum builder
  - three-column Backlogs board
  - Sprint Backlog + Burndown view
  - Review / Retro save flow
- Added clickable Backlog technical requirement detail panels.
- Added technical documentation generation for every Product Backlog item.
- Added one-click Markdown export for the full Scrum workspace.
- Added AI agent preset prompt support in the exported Markdown.
- Removed remote Google font dependency so production build does not require font downloads.
- Renamed the default product surface to `ai product manager` and switched the app language to English.
- Preserved the old paper/sketch visual as the `Sketch` theme and rebuilt the default UI as a dark Liquid Glass theme.
- Wired the DeepSeek API interface using `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `deepseek-v4-flash`, and `deepseek-v4-pro`.
- Updated burndown data so future dates use `projectedRemaining` instead of fake actual progress.
- Removed prefilled demo prompt and review/retro text from the default UI.
- Moved workspace selection, refresh, theme switching, and runtime status into a Settings drawer.
- Reset local dev store placeholder data so the default workspace starts clean.
- Added blue-glow iOS Liquid Glass interaction feedback for default theme controls and artifact cards.
- Added detailed AI completion todo and UI/UX audit documents.
- Added Settings support for a browser-local DeepSeek API key and per-request provider use.
- Sanitized DeepSeek provider errors so invalid-key responses do not include provider raw error text.
- Added `/api/mcp` JSON-RPC endpoint for the AI Chat six-stage Scrum MCP tools.
- Added six-stage MCP tool definitions and handlers in `src/server/mcp/six-stage-tools.ts`.
- Added MCP tool documentation in `docs/mcp-six-stage-tools.md`.
- Added AI Chat six-stage prompt documentation in `docs/ai-chat-six-stage-prompts.md`.

## Verification

Latest verified on 2026-06-08:

- `pnpm typecheck` passed.
- `pnpm build` passed.
- DeepSeek direct API check passed:
  - `POST /api/ai/deepseek` returns `503 DEEPSEEK_API_KEY_NOT_CONFIGURED` when no key is configured
  - `POST /api/ai/chat` still returns a usable local structured proposal fallback
- Burndown API check passed:
  - future sprint dates return `actualRemaining: null`
  - `projectedRemaining` is present for forecast rendering
- Browser UI flow passed:
  - create workspace
  - generate AI Product Backlog proposal
  - apply proposal to Product Backlog API
  - create Sprint Backlog
  - mark one Sprint task Done
  - burndown remaining changed from `16 pts` to `13 pts`
  - save Review / Retro
- Backlog detail browser check passed:
  - clicking a Product Backlog card opens technical documentation
  - detail includes functional, technical, API/data, UI, risk, verification, done checklist, and agent handoff prompt sections
- Markdown export browser check passed:
  - export panel opens from the top bar
  - Scrum Developer Agent preset is selected by default
  - custom agent prompt can be added
  - export API produces `ai-product-manager-scrum-saas-2026-06-08.md`
  - exported burndown table separates `Actual` and `Projected`
- Theme browser check passed:
  - default theme is `Liquid`
  - `Sketch` theme preserves the old paper/sketch border treatment
  - default HTML lang, page title, H1, and workspace title are English

Latest UX cleanup on 2026-06-08:

- `pnpm typecheck` passed after Settings drawer and placeholder removal.
- `pnpm build` passed after Settings drawer, status fix, and placeholder removal.
- Browser check passed:
  - default store starts with no projects
  - Export is disabled until a workspace exists
  - main top bar has no workspace selector or runtime status
  - AI prompt starts empty with domain-specific placeholder guidance
  - default Liquid theme uses blue glowing glass borders
  - no horizontal overflow at desktop viewport
- Real UI flow check passed before resetting the dev store:
  - create/use workspace
  - enter a real prompt
  - generate 4 Product Backlog draft items
  - apply drafts to API-backed Product Backlog
  - create Sprint Backlog
  - render Burndown chart
  - Review/Retro fields stay empty with real placeholders
- Settings API key check passed:
  - DeepSeek API key field appears only inside Settings
  - field uses password input
  - entered key persists after reload through browser-local storage
  - Clear key removes the visible value and returns status to `Not configured`
  - fake per-request key reaches DeepSeek path and returns sanitized `DEEPSEEK_REQUEST_FAILED_401`, not missing-key `503`
  - `.data/scrum-store.json` remains empty after key tests
- Browser layout checks passed:
  - Chat view contains the 6-step subfunction
  - Backlogs view shows `Product Backlog`, `Scrum Backlog`, and `Sprint Backlog`
  - Scrum view shows 4 sprint rows and a Burndown chart
  - no horizontal overflow at desktop viewport
  - no mojibake after UI-driven data creation

Latest MCP and prompt preparation on 2026-06-09:

- `pnpm typecheck` passed.
- `pnpm build` passed.
- `GET /api/mcp` returned the six MCP tool definitions.
- `POST /api/mcp` `tools/list` returned valid JSON tool definitions.
- `POST /api/mcp` `scrum_capture_requirements` returned structured Stage 2 clarification output.
- `POST /api/mcp` `scrum_create_workspace` without `confirmed: true` returned `confirmation_required` and did not write to `.data/scrum-store.json`.
- Added runtime prompt loading from `prompt/step1_需求捕获.md` through `prompt/step6_持续跟踪.md`.
- Added `/api/ai/prompts` for prompt catalog and single-stage inspection.
- Added `promptStage` support to `/api/ai/chat` and `/api/ai/deepseek`.
- Added Prompt stage selector and non-mutating Test prompt action in AI Chat.
- Verified `GET /api/ai/prompts` loads all six prompt files.
- Verified `/api/ai/chat` can route `promptStage: step5` and returns `prompt/step5_执行规划.md`.
- Browser check passed: Prompt stage selector and Test prompt button are visible, and Test prompt reports `prompt/step3_节点拆分.md` without saving artifacts.
- `.data/scrum-store.json` stayed empty after prompt tests.

## Next Tasks

1. Replace `.data/scrum-store.json` dev persistence with Prisma-backed services.
2. Add auth and project ownership checks to every project-scoped endpoint.
3. Add production auth and project ownership checks before hosted multi-user use.
4. Add editable artifact detail drawers for backlog and sprint tasks.
5. Add tests for priority scoring, burndown calculation, API validation, and ownership rejection.
6. Add decision log entries for confirmed AI mutations and task updates.
7. Add context upload flow into AI proposal generation.
8. Keep UI aligned with `UI/*.png`, `UI_sample/`, and `docs/scrum-mvp/ui-ux-style.md`.
9. Add API tests for `/api/mcp` tools/list, confirmation-required behavior, and confirmed tool mutations.
10. Add API tests for `/api/ai/prompts` and `/api/ai/chat` `promptStage` routing.

## Development Principle

The product must reduce ambiguity for developers. If a generated output does not help a developer know what to build, why it matters, how to build it, or how to verify it, the output is not good enough for the MVP.

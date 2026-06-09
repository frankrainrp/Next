# AI Function Completion Todo

This document tracks the remaining work required to make `ai product manager` a production-ready AI Scrum assistant.

## Current AI Status

- `/api/ai/chat` returns structured Scrum proposals.
- DeepSeek is wired through `src/server/ai/deepseek.ts`.
- `/api/ai/deepseek` is the direct DeepSeek provider endpoint.
- If no provider key is configured, the app uses a local structured fallback so the Scrum workflow remains usable.
- Settings supports a browser-local DeepSeek API key and sends it as `providerApiKey` per AI request.
- Confirmed AI proposals still require explicit user action before they mutate Scrum artifacts.
- `/api/mcp` exposes the AI Chat six-stage Scrum workflow as MCP JSON-RPC tools.
- Six-stage prompt structure is documented in `docs/ai-chat-six-stage-prompts.md`.
- Runtime prompt files live in `prompt/` and are selected through the `promptStage` request field.

## P0: Provider Reliability

- [x] Add DeepSeek base URL and model environment variables.
- [x] Route `/api/ai/chat` through DeepSeek when `DEEPSEEK_API_KEY` exists.
- [x] Allow Settings-provided DeepSeek API key to power AI requests without writing the key to project artifacts.
- [x] Keep local structured fallback when provider access fails.
- [ ] Add provider health metadata to Settings without exposing internal debug in the main workspace.
- [ ] Add retry policy with capped exponential backoff for transient provider failures.
- [ ] Add request timeout handling with a user-facing failure reason.
- [ ] Add encrypted production secret storage for user/team provider keys.
- [ ] Log provider mode, model, latency, and validation result to a server-side decision/event log.

## P0: Structured Artifact Quality

- [x] Validate provider backlog proposals before returning them to the UI.
- [x] Define the six-stage MCP tool contract for workspace, requirements, backlog draft, backlog apply, sprint/burndown, review/retro/export.
- [x] Define six-stage AI Chat prompt templates and confirmation rules.
- [x] Load the six runtime prompt files from `prompt/` and expose them through `/api/ai/prompts`.
- [x] Add `promptStage` support to `/api/ai/chat` and `/api/ai/deepseek`.
- [ ] Expand schema coverage for sprint planning, review summaries, retro action items, and priority changes.
- [ ] Add repair pass for malformed provider JSON.
- [ ] Add artifact diff preview before applying AI changes.
- [ ] Add per-item confidence, risk, and missing-information fields.
- [ ] Add acceptance criteria quality checks before a backlog item can be marked Ready.

## P1: Context Ingestion

- [ ] Connect uploaded design, architecture, and product documents to AI proposal generation.
- [ ] Add context source citations inside backlog technical details.
- [ ] Add a context freshness indicator in Settings.
- [ ] Add limits and validation for uploaded file type, size, and extracted content.

## P1: User Experience

- [x] Remove prefilled demo prompt from the composer.
- [x] Move workspace selection, refresh, theme, and runtime status into Settings.
- [ ] Add streaming response feedback for long AI calls.
- [ ] Add inline validation when the prompt is too vague.
- [ ] Add a clean proposal review screen with Apply / Reject / Edit actions.
- [ ] Add undo for the last confirmed AI mutation.

## P1: Safety And Governance

- [ ] Add auth and project ownership checks before production use.
- [ ] Add rate limits for `/api/ai/chat` and `/api/ai/deepseek`.
- [ ] Store confirmed AI mutations in `DecisionLogEntry`.
- [ ] Record human override reasons for priority changes.
- [ ] Prevent AI from directly applying changes without user confirmation.

## P2: Evaluation And Tests

- [ ] Unit test local fallback backlog generation.
- [ ] Unit test DeepSeek JSON parsing and validation failure paths.
- [ ] Unit test burndown actual/projected semantics.
- [ ] API test `/api/ai/deepseek` missing-key response.
- [ ] API test `/api/ai/chat` provider fallback behavior.
- [ ] API test `/api/ai/prompts` catalog and single-stage inspection behavior.
- [ ] API test `/api/mcp` tools/list and mutating confirmation behavior.
- [ ] Add fixture prompts for vague idea, technical architecture, design direction, and sprint review.
- [ ] Add fixture prompts from `docs/ai-chat-six-stage-prompts.md` for six-stage tool routing.

## Done Definition

AI functionality is complete for the Scrum MVP when:

- provider-backed proposal generation works with DeepSeek in a configured environment;
- malformed provider output cannot mutate project artifacts;
- every AI mutation requires explicit confirmation;
- backlog, sprint, review, retro, burndown, technical docs, and Markdown export remain API-backed;
- tests cover provider success, fallback, validation failure, and confirmed mutation paths.

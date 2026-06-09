# AI Chat Six-Stage MCP Tools

Research date: 2026-06-09.

This document defines the MCP tool layer for the AI Chat six-step Scrum subflow in **ai product manager**. The tools are implemented in `src/server/mcp/six-stage-tools.ts` and exposed through `POST /api/mcp`.

## Source Basis

- MCP tools are listed with `tools/list` and called with `tools/call`; a tool definition includes `name`, `title`, `description`, `inputSchema`, optional `outputSchema`, and optional `annotations`: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- MCP structured results can use `structuredContent`, and output schemas let clients validate tool results: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
- Tool descriptions should explain what the tool does, when to use it, what data it returns, and important parameter meaning: https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
- Function/tool calling should be used when a model needs to bridge into application data or actions; structured response formats are better when only shaping the model response: https://developers.openai.com/api/docs/guides/structured-outputs

## MCP Endpoint

Endpoint:

```text
POST /api/mcp
```

Supported JSON-RPC methods:

| Method | Purpose |
| --- | --- |
| `initialize` | Returns protocol version, tool capability, and server metadata. |
| `tools/list` | Returns the six Scrum MCP tool definitions. |
| `tools/call` | Calls one Scrum MCP tool by `params.name` and `params.arguments`. |

Development discovery:

```text
GET /api/mcp
```

## Tool Policy

- MCP is the agent-facing tool layer.
- Scrum API routes and server services remain the system of record.
- Chat text is not the source of truth.
- Read-only tools may run without user confirmation.
- Any tool that creates or changes Scrum artifacts must return `confirmation_required` unless `confirmed: true` is supplied after explicit user confirmation.
- Tool calls must never accept or return provider API keys.
- Tool results should return structured JSON through `structuredContent`.
- If a tool also returns Markdown content, hidden prompts, API keys, provider metadata, and debug traces must be excluded.

## Six Tools

| Stage | Tool | Writes Data | Main API Mapping |
| ---: | --- | --- | --- |
| 1 | `scrum_create_workspace` | Yes, after confirmation | `POST /api/projects` |
| 2 | `scrum_capture_requirements` | No | `POST /api/ai/chat` conceptually, local requirements capture |
| 3 | `scrum_draft_product_backlog` | No | `POST /api/ai/chat`, proposal draft |
| 4 | `scrum_apply_product_backlog` | Yes, after confirmation | `POST /api/projects/[projectId]/backlog` |
| 5 | `scrum_plan_sprint_burndown` | Yes, after confirmation | `POST /api/projects/[projectId]/sprints`, then `GET /burndown` |
| 6 | `scrum_record_review_retro_export` | Review/retro yes after confirmation; export-only no | review, retro, and Markdown export APIs |

## Stage 1: Workspace

Tool: `scrum_create_workspace`

Use when the product name, main action, and purpose are known. This creates a real project workspace. Without `confirmed: true`, the tool returns a preview and no data is written.

Required input:

```json
{
  "title": "ai product manager",
  "action": "Guide Scrum MVP delivery from AI chat into persistent artifacts",
  "purpose": "Help design, architecture, and development teams reduce ambiguity",
  "confirmed": true
}
```

Expected result:

```json
{
  "stage": 1,
  "status": "applied",
  "project": {
    "id": "proj_...",
    "title": "ai product manager"
  },
  "nextTool": "scrum_capture_requirements"
}
```

## Stage 2: Requirements Capture

Tool: `scrum_capture_requirements`

Use when the chat prompt needs to be converted into an explicit Scrum planning snapshot. It returns objective, assumptions, source notes, known artifacts, and clarification questions.

Required input:

```json
{
  "projectId": "proj_...",
  "prompt": "Build the Scrum MVP around AI chat, backlog details, burndown, review, retro, and Markdown export.",
  "knownArtifacts": ["UI/chat.png", "docs/scrum-mvp/mvp-spec.md"],
  "sourceNotes": ["Local Scrum notes mention burndown and dashboard behavior."]
}
```

## Stage 3: Product Backlog Draft

Tool: `scrum_draft_product_backlog`

Use after Stage 2 has enough information. This creates a draft proposal only. It does not mutate Product Backlog records.

Required input:

```json
{
  "projectId": "proj_...",
  "prompt": "Confirmed Scrum MVP requirements...",
  "maxItems": 4,
  "includeTechnicalNotes": true
}
```

Expected result includes:

- `proposal.type = ProductBacklogDraft`
- `payload.productBacklogItems`
- `payload.technicalNotes`
- `nextTool = scrum_apply_product_backlog`

## Stage 4: Apply Product Backlog

Tool: `scrum_apply_product_backlog`

Use only after the user confirms the draft items. This writes Product Backlog records and lets the existing priority scorer fill missing priority fields.

Required input:

```json
{
  "projectId": "proj_...",
  "items": [
    {
      "title": "Generate Product Backlog from AI chat",
      "userStory": "As a Scrum team, I want AI conversation output to become backlog items so planning can move into execution.",
      "problem": "Pure chat planning cannot be handed to developers as an actionable artifact.",
      "acceptanceCriteria": ["AI returns a structured backlog proposal", "Users can confirm and apply generated items"],
      "status": "Ready",
      "effort": 5,
      "dependencies": [],
      "source": "AiProposal"
    }
  ],
  "confirmed": true
}
```

## Stage 5: Sprint And Burndown

Tool: `scrum_plan_sprint_burndown`

Use after Product Backlog items exist. It creates a Sprint Backlog and immediately returns the burndown series. Future dates must use projected remaining work, not fake actual progress.

Required input:

```json
{
  "projectId": "proj_...",
  "sprintNumber": 1,
  "name": "Sprint 1 - Scrum MVP",
  "goal": "Make the AI Chat to Scrum artifact loop usable end to end.",
  "startDate": "2026-06-09",
  "endDate": "2026-06-16",
  "workingDays": ["2026-06-09", "2026-06-10", "2026-06-11", "2026-06-12", "2026-06-15", "2026-06-16"],
  "selectedBacklogItemIds": ["pbi_..."],
  "confirmed": true
}
```

## Stage 6: Review, Retro, Export

Tool: `scrum_record_review_retro_export`

Use at the end of a sprint or when the user wants a one-click Markdown export. Review and retro writes require `confirmed: true`. Export-only calls can run without confirmation.

Required input for full closeout:

```json
{
  "projectId": "proj_...",
  "sprintId": "spr_...",
  "review": {
    "demoOutcome": "The team demonstrated AI chat to backlog to sprint to burndown.",
    "acceptedItems": ["pbi_..."],
    "followUpItems": ["Add tests for MCP tool calls"],
    "stakeholderFeedback": "Keep the workspace clean and hide debug in Settings.",
    "backlogChanges": ["Add MCP prompt fixtures"]
  },
  "retro": {
    "whatWorked": ["Scrum artifacts stayed API-backed"],
    "whatDidNotWork": ["Prompt vagueness still needs inline validation"],
    "rootCause": "The product needs a stronger requirements capture gate.",
    "experiment": "Require Stage 2 questions before Stage 3 when inputs are vague.",
    "actionItems": ["Add prompt quality checks"]
  },
  "markdownExport": {
    "includeAgentPrompt": true,
    "agentPreset": "scrum-dev-agent"
  },
  "confirmed": true
}
```

## Validation Checklist

- `GET /api/mcp` returns the six tool definitions.
- `POST /api/mcp` with `tools/list` returns the same tool list.
- Mutating tools return `confirmation_required` when `confirmed` is omitted or false.
- Mutating tools write data only when `confirmed: true`.
- Stage 5 returns burndown data with `actualRemaining: null` for future sprint dates.
- Stage 6 Markdown export includes only visible user-controlled agent prompts.

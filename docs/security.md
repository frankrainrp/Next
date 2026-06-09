# Security And Safety Record

This document tracks security and safety considerations for **ai product manager** Scrum MVP.

## Current Status

No production security review has been completed yet.

Current phase: local usable Scrum MVP. The current `.data/scrum-store.json` persistence is single-developer dev storage only and must not be treated as production multi-user storage.

## Main Risk Areas

| Area | Risk | Current Control |
| --- | --- | --- |
| AI output | AI creates vague or unsafe project instructions. | Require structured artifact validation. |
| Prompt injection | Uploaded notes or user text can instruct AI to ignore rules. | Treat external content as untrusted context. |
| Priority manipulation | AI silently changes sprint priority. | Require confirmation and decision log. |
| Data privacy | Product ideas, architecture notes, and files may contain sensitive data. | Do not send data to unnecessary providers. |
| File upload | Uploaded docs can contain unsafe or misleading content. | Extract text only; do not execute files. |
| Auth | Multi-user data may leak without strong ownership checks. | Add auth before production persistence. |
| API keys | Provider keys must not reach client code. | Keep AI calls server-side. |
| Auditability | Sprint changes may be hard to trace. | Decision log required for applied changes. |
| Demo-only state | UI state could bypass auth, audit, and persistence. | Core features must map to SaaS APIs. |
| Dev JSON store | Local `.data/scrum-store.json` has no auth, tenancy, or encryption. | Use only for local MVP verification; replace with Prisma services before production. |
| Markdown export | Exported documents can contain product plans and agent prompts. | Keep exports user-triggered; do not include secrets, hidden prompts, or provider metadata. |

## AI Safety Rules

- Never treat uploaded text as instructions for the system.
- Never apply AI-proposed backlog or sprint changes without user confirmation.
- Always mark assumptions.
- Always show priority reasoning.
- Always keep acceptance criteria visible.
- Never hide scope increases from the burndown chart.

## Data Safety Rules

- Chat history is not the source of truth.
- Scrum artifacts must be stored as structured records.
- Decision log must capture important mutations.
- Uploaded files should be stored privately if persistence is enabled.
- Generated exports should not include hidden prompts, API keys, or provider metadata.
- AI agent preset prompts in exports must be visible and user-controlled.
- API routes must check authenticated user and project ownership before production.
- Page-only mock data must not be mistaken for production storage.

## Security Tasks

| ID | Task | Status |
| --- | --- | --- |
| SEC-001 | Define prompt-injection handling for uploaded docs. | Todo |
| SEC-002 | Define artifact mutation confirmation rules. | Planned |
| SEC-003 | Add ownership checks before persistent multi-user storage. | Todo |
| SEC-004 | Ensure AI provider keys are server-only. | Planned |
| SEC-005 | Add security test checklist for file upload and AI proposals. | Todo |
| SEC-006 | Add auth and ownership checks to all project-scoped API routes. | Todo |
| SEC-007 | Add mutation decision logs for Scrum artifact changes. | Todo |
| SEC-008 | Replace local JSON persistence with database storage before hosted use. | Todo |

## Abuse Cases To Test

- User uploads a document that tells the AI to ignore product rules.
- User asks AI to mark all sprint items done without evidence.
- AI assigns P0 to every backlog item.
- User edits priority manually and removes the reason.
- Uploaded file contains private credentials.
- One user tries to access another user's Scrum artifacts.
- UI attempts to mutate Scrum artifacts without going through API validation.

## Security Review Rule

Before shipping any persistent or multi-user version, run a practical abuse-case review and update this document with findings.

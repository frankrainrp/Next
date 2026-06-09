# Developer Documentation Basis

This document defines what documentation a software project needs, what developers rely on most, and what the AI Scrum PM must generate or preserve.

## Core Question

Software development documentation must help developers answer:

- What are we building?
- Why are we building it?
- Who is it for?
- What is in scope?
- What is out of scope?
- What does done mean?
- What data, API, UI, and workflow rules must be respected?
- How do we verify that the work is correct?

## Required Documents

| Document | Purpose | MVP Importance |
| --- | --- | --- |
| Product brief | Explains product goal, users, pain points, value, and MVP boundary. | High |
| PRD | Describes feature requirements, business rules, edge cases, and constraints. | High |
| User stories | Converts requirements into Scrum backlog-ready work items. | High |
| Acceptance criteria | Defines exact done conditions for each story. | Critical |
| UX flow / prototype | Shows screens, interaction order, states, and user decisions. | High |
| Technical spec | Defines architecture, modules, API, database, auth, deployment, and risks. | High |
| API contract | Defines request, response, validation, errors, and ownership. | High |
| Data model | Defines entities, fields, relationships, permissions, and lifecycle. | High |
| Sprint backlog | Defines what the team is building in the current sprint. | Critical |
| QA checklist | Defines how to test important flows and edge cases. | High |
| Release notes | Records what changed, what shipped, and what remains. | Medium |
| Decision log | Records major product and technical decisions. | Medium |

## Most Important Developer Resources

For developers, the most important resource is not a long PRD. It is a clear task package:

1. User story.
2. Acceptance criteria.
3. UI or workflow reference.
4. API and data contract.
5. Known constraints.
6. Test or verification checklist.

If a developer has these six items, they can usually start implementation without guessing.

## Most Commonly Checked Resources

Developers most often check:

- Current sprint board.
- User story and acceptance criteria.
- Figma, wireframe, or UX flow.
- API documentation.
- Data schema and type definitions.
- README and setup instructions.
- Existing code patterns.
- CI/build/test output.
- Error logs and monitoring.
- Decision log.

## What The AI Scrum PM Must Produce

For the Scrum MVP, the AI should generate these artifacts from user input:

- Product brief.
- Clarifying questions.
- User stories.
- Acceptance criteria.
- Backlog priorities.
- Sprint goal.
- Sprint backlog.
- Developer implementation notes.
- QA checklist.
- Decision log entries.

## Documentation Quality Bar

A document is useful only if it is:

- specific enough for implementation
- short enough to be read during development
- tied to a feature or decision
- clear about done conditions
- explicit about out-of-scope items
- easy to update after sprint review

Avoid documents that sound impressive but do not change what developers build.

## Development Attention Points

During development, the team must watch for:

- unclear requirements
- changing scope
- missing acceptance criteria
- missing error, empty, loading, and permission states
- unstable API contracts
- data model changes without migration planning
- UI behavior that is not represented in user stories
- sprint backlog items that are too large
- AI output that cannot be verified
- hidden technical debt
- missing tests for core flows

## Scrum Definition Of Done Template

A story is done only when:

- the accepted user flow works
- all acceptance criteria pass
- core UI states are handled
- required API/data changes are implemented
- errors are handled clearly
- tests or manual verification steps are documented
- the story result can be demonstrated in sprint review

## AI Output Rule

The AI Scrum PM should never produce only a conversational answer when the user is trying to plan development. It should produce structured development artifacts that can be copied into a backlog, handed to a developer, and verified by QA.

# UI/UX Audit: 2026-06-08

Scope: `ai product manager` Scrum MVP web app.

## Audit Summary

The main UX issue was that operational controls and test-like default content were competing with the user's primary Scrum workflow. This pass reduces the main workspace to one clean working surface, moves secondary controls into Settings, removes prefilled demo content, and strengthens the dark iOS Liquid Glass visual system with blue glowing edges and clearer interaction feedback.

## Findings And Actions

| Issue | UX impact | Solution | Status |
| --- | --- | --- | --- |
| Top bar exposed workspace select, refresh, theme, status, and project description at all times. | Main workspace felt like a debug console instead of a focused product surface. | Moved workspace select, refresh, theme, and runtime status into a Settings drawer. | Done |
| Chat composer was prefilled with a long sample prompt. | Users could confuse sample text with their own input or send it accidentally. | Composer now starts empty and uses placeholder guidance. | Done |
| Review and Retro fields had demo text. | Sprint review flow looked pre-scripted instead of real. | Review/Retro now start empty with domain-specific placeholders. | Done |
| Local dev store contained old generated sample data and mojibake. | First load looked polluted and inconsistent with English default language. | Reset `.data/scrum-store.json` to an empty project list. | Done |
| Liquid Glass theme used mostly neutral white borders. | User requested black iOS glass with blue glowing line edges. | Updated default glass border and hover/focus shadows to blue glow tokens. | Done |
| Interaction feedback was too subtle. | Buttons and cards did not feel responsive enough. | Added hover glow, pressed scale, focused blue outline, and active feedback. | Done |
| Operational status was visible in the main workflow. | Status strings can read like debug details. | Status now lives in Settings under Runtime feedback. | Done |
| Burndown future points previously looked like actual progress. | Chart could mislead users about completed work. | Future points use projected line only; actual history remains separate. | Done |
| Settings content had no dedicated structure. | Secondary controls could become a mixed drawer later. | Added Settings sections for Workspace, Appearance, and Runtime feedback. | Done |

## Remaining UX Work

- Add mobile 375px and tablet visual QA after the next responsive pass.
- Add streaming feedback for long AI requests.
- Add proposal review/edit flow before applying AI output.
- Add empty-state illustrations or compact onboarding only if they support the Scrum workflow directly.
- Add inline validation for vague prompts and empty review/retro notes.

## Design Rules To Preserve

- Main workspace should stay focused on the current Scrum task.
- Settings should contain configuration, diagnostics, and secondary controls.
- Default theme is black iOS-style Liquid Glass with blue edge glow.
- Sketch theme remains available for the older vintage analog reference.
- UI may show user-facing feedback, but implementation/debug status belongs in Settings.

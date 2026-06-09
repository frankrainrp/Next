# Source Notes

本文记录本轮产品设计参考了哪些本机旧笔记，以及哪些内容被吸收或舍弃。

## Local Notes Used

Found local notes:

- `D:\Sorted\Projects_Code\OLD\项目说明文档.md`
- `D:\Sorted\Projects_Code\OLD\SRS_output.txt`

These notes describe a previous learning/project dashboard with burndown chart, task list, progress tracking, calendar surfaces, and strict layout constraints.

## Ideas Reused

Reusable ideas for ai product manager:

- Burndown chart should have ideal and actual lines.
- Burndown should handle non-working days.
- Work status must map clearly to visual states.
- Dashboard layout should use explicit grid proportions, not uncontrolled default layout.
- Progress views must be responsive and stack on mobile.
- Empty data states must be handled instead of rendering broken charts.
- Task completion should be visible and auditable.
- Local file / document references can become useful context inputs.

## Ideas Adapted

The previous notes used course/task/event tracking. For this product, they are adapted as:

| Old Concept | New Scrum MVP Equivalent |
| --- | --- |
| Task list | Sprint Backlog |
| Course progress bars | Sprint / increment progress indicators |
| Burndown chart | Sprint burndown chart |
| Calendar preview | Sprint timeline and target dates |
| Local file reference | Product/design/architecture context attachment |
| Status color mapping | Backlog, sprint, QA, and review states |

## Ideas Not Carried Forward

These old constraints are not current product rules:

- Express/EJS architecture.
- In-memory-only storage.
- No AJAX interaction.
- Bootstrap-specific layout.
- Course-specific 26 segment progress bars.
- Pure learning dashboard domain.

The current product uses Next.js and AI-assisted Scrum artifacts. The old notes are layout and tracking references, not architectural requirements.

## Product Interpretation

The new MVP should keep the old dashboard's discipline around progress visibility, but combine it with a modern AI conversation layer.

The resulting product shape:

- AI chat captures and negotiates context.
- Scrum tables preserve execution truth.
- Burndown shows whether sprint progress is healthy.
- Review and retro convert results back into backlog and process improvements.

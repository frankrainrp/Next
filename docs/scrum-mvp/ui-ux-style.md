# UI/UX Style Direction

Current required style: **dark Liquid Glass as the default SaaS UI, with the previous Vintage Analog / Retro Film paper sketch preserved as a switchable theme**.

Sources:

- installed `ui-ux-pro-max` style direction
- user `UI_sample/纯CSS液态玻璃` CSS reference for pure CSS liquid glass
- user `UI_sample/导航栏对比` and `UI_sample/Go Pro升级按钮` references for compact rounded controls
- user reference images:
  - `UI/chat.png`
  - `UI/backlogs.png`
  - `UI/scrum.png`

## Design Intent

ai product manager should feel like a real Scrum SaaS with a dark, Apple-like Liquid Glass shell: translucent panels, fine highlight borders, blurred surfaces, compact controls, and high-contrast artifact tables.

The UI must stay useful for Scrum work. Liquid Glass is a surface treatment, not permission to hide backlog, acceptance criteria, sprint status, or burndown signal. The older paper/sketch style remains available as the `Sketch` theme for continuity.

## Reference Layout Rules

- Global shell uses a left rail with compact icon buttons.
- Chat is the primary first screen.
- The 6-step Scrum builder belongs inside AI Chat as a subfunction.
- Backlogs view uses three columns:
  - Product Backlog
  - Scrum Backlog / proposal queue
  - Sprint Backlog
- Scrum view uses two main panels:
  - Sprint Backlog list
  - Burndown chart
- Review / Retro belongs in the Scrum workflow, not as a marketing section.

## Default Liquid Glass Attributes

- dark Instagram-like base palette with black, graphite, blue, violet, rose, and high-contrast white text
- translucent panels with `backdrop-filter`
- fine glass borders, inner highlights, and restrained shadow depth
- compact left rail navigation
- rounded Apple-like controls
- lucide-react icon buttons
- system fonts only; do not depend on remote font downloads for build

## Preserved Sketch Theme Attributes

- white / warm paper background
- black hand-drawn borders
- light grain overlay
- irregular rounded sketch panels
- minimal shadows
- restrained red, orange, blue, and green status accents
- clear icon buttons from lucide-react
- system fonts only; do not depend on remote font downloads for build

## Default Liquid Palette

| Role | Color | Hex / Token |
| --- | --- | --- |
| App background | Near black | `#050507` |
| Glass surface | Dark translucent | `rgba(17, 18, 27, 0.62)` |
| Glass border | White translucent | `rgba(255, 255, 255, 0.22)` |
| Text | Primary white | `#F7F7FB` |
| Muted text | Secondary gray | `#AEB1BD` |
| Blue | Active / actual burndown | `#54A8FF` |
| Rose | Urgent / chart point | `#FF5B76` |
| Orange | Warning / projected burndown | `#FFB04C` |
| Green | Done / success | `#48D59A` |
| Purple | Draft proposal accent | `#D46CFF` |

## Sketch Palette

| Role | Color | Hex |
| --- | --- | --- |
| Paper | Main background | `#FBFAF5` |
| Warm paper | Outer background | `#F2EFE5` |
| Ink | Text and primary outline | `#202020` |
| Muted ink | Secondary text | `#676159` |
| Red | P0 / urgent / chart point | `#DF3F36` |
| Orange | P1 / warning | `#F09A2F` |
| Blue | P2 / actual burndown / active status | `#2778C7` |
| Green | Done / success | `#2F936F` |
| Purple | Draft proposal accent | `#6F5BB8` |

## Typography

Use system fonts for reliable local and production builds:

```css
font-family: Inter, "Segoe UI", "Microsoft YaHei", "PingFang SC", Arial, sans-serif;
```

Use a handwriting fallback only for major sketch headings:

```css
font-family: "Segoe Print", "Comic Sans MS", "Microsoft YaHei", cursive;
```

Do not rely on `next/font/google` for this MVP because production build must not fail when font downloads are unavailable.

## Component Guidance

Buttons:

- icon buttons for rail navigation and compact actions
- visible focus states
- minimum touch target around 44px where practical
- disabled states must be visibly muted

Cards and panels:

- default Liquid theme uses fine translucent borders and glass highlights
- Sketch theme uses thick black sketch borders and irregular but consistent rounded corners
- avoid decorative nested cards unless representing repeated Scrum artifacts
- keep text density practical for backlog scanning

Forms:

- inputs look like glass planning fields in the default theme
- inputs look like planning fields on paper in the Sketch theme
- labels remain visible
- focus state uses blue outline

Backlog and sprint artifacts:

- backlog items should look like index cards or rows on a planning board
- priority and status use text plus color, not color alone
- sprint tasks must expose Start/Done actions

Burndown:

- use custom SVG for MVP
- ideal line in ink
- actual line in blue
- projected line in orange
- points in red
- metrics show committed, remaining, forecast end, blocked, and scope change
- future sprint dates must not render as actual progress

## Accessibility Rules

- Maintain WCAG AA contrast for all body text.
- Do not place grain over small text at high opacity.
- Respect `prefers-reduced-motion`.
- Keep critical Scrum artifact text plain and readable.
- Avoid viewport-scaled font sizes.
- Avoid negative letter spacing.
- Avoid horizontal scroll at desktop and mobile breakpoints.

## Pre-Delivery Checklist

- [x] Chat view contains the 6-step Scrum builder as an in-chat subfunction.
- [x] Backlogs view follows the three-column reference.
- [x] Scrum view follows Sprint Backlog + Burndown reference.
- [x] UI-created Chinese data renders without mojibake.
- [x] Desktop viewport has no horizontal overflow.
- [x] Production build does not depend on remote fonts.
- [x] Default theme is dark Liquid Glass.
- [x] Sketch theme preserves the old Vintage Analog / Retro Film paper direction.
- [x] Burndown separates actual history from projected future points.
- [ ] Mobile 375px visual pass after the next UI iteration.

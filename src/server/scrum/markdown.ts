import type { z } from "zod";
import type { BacklogItemRecord, ProjectRecord, SprintRecord } from "./store";
import { getBurndown, getProjectSnapshot } from "./store";
import type { MarkdownExportRequestSchema } from "./schemas";

type MarkdownExportInput = z.infer<typeof MarkdownExportRequestSchema>;

export type BacklogTechnicalDoc = {
  itemId: string;
  title: string;
  summary: string;
  sections: Array<{
    title: string;
    bullets: string[];
  }>;
  doneChecklist: string[];
  agentHandoffPrompt: string;
};

const agentPresets: Record<MarkdownExportInput["agentPreset"], string> = {
  "scrum-dev-agent": [
    "You are a senior Scrum delivery agent.",
    "Use the exported Markdown as the source of truth.",
    "Preserve Product Backlog priority order, acceptance criteria, sprint goals, and review/retro decisions.",
    "When implementing, update progress, decisions, risks, and done evidence in Markdown.",
  ].join("\n"),
  "frontend-ui-agent": [
    "You are a frontend implementation agent.",
    "Follow the UI reference, accessibility rules, responsive layout constraints, and component behavior in this document.",
    "Do not replace Scrum artifacts with decorative UI.",
    "Verify interaction states, no horizontal overflow, and readable backlog detail panels.",
  ].join("\n"),
  "backend-api-agent": [
    "You are a backend/API implementation agent.",
    "Keep API contracts stable while replacing local dev persistence with production services.",
    "Validate all payloads, preserve ownership boundaries, and record important mutations.",
    "Do not expose provider keys or private project data to the client.",
  ].join("\n"),
  "qa-review-agent": [
    "You are a QA and review agent.",
    "Build tests from acceptance criteria, technical requirements, burndown behavior, and review/retro outcomes.",
    "Flag missing ownership checks, fake progress, unclear done conditions, and unverified AI mutations.",
  ].join("\n"),
  custom: "",
};

function mdEscape(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function list(values: string[]) {
  if (values.length === 0) return "- None";
  return values.map((value) => `- ${mdEscape(value)}`).join("\n");
}

function heading(level: number, value: string) {
  return `${"#".repeat(level)} ${mdEscape(value)}`;
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : "n/a";
}

export function buildBacklogTechnicalDoc(item: BacklogItemRecord): BacklogTechnicalDoc {
  const dependencies =
    item.dependencies.length > 0 ? item.dependencies : ["No explicit dependency recorded. Confirm during planning."];
  const risk = item.risk ?? "No explicit risk recorded. Review during sprint planning.";

  return {
    itemId: item.id,
    title: item.title,
    summary: `${item.userStory} This item is scored ${item.priorityBand}/${item.priorityScore} and estimated at ${item.effort} points.`,
    sections: [
      {
        title: "Functional Requirements",
        bullets: [
          item.problem,
          ...item.acceptanceCriteria.map((criterion) => `Acceptance: ${criterion}`),
          `Status: ${item.status}`,
        ],
      },
      {
        title: "Technical Requirements",
        bullets: [
          "Implement through stable API contracts, not page-only state.",
          "Persist confirmed artifact changes server-side.",
          "Validate request and response shapes with Zod before mutation.",
          "Keep user-facing Scrum artifacts exportable as Markdown.",
        ],
      },
      {
        title: "API And Data Requirements",
        bullets: [
          "Backlog source: `/api/projects/[projectId]/backlog`.",
          "Sprint source: `/api/projects/[projectId]/sprints` when selected.",
          "Export source: `/api/projects/[projectId]/exports/markdown`.",
          "Production target: Prisma-backed service with ownership checks.",
        ],
      },
      {
        title: "UI Requirements",
        bullets: [
          "Backlog cards must open this technical detail view.",
          "Priority and status must use text plus color.",
          "Details must remain readable in desktop and mobile layouts.",
          "Do not hide acceptance criteria behind chat history.",
        ],
      },
      {
        title: "Risk And Dependencies",
        bullets: [`Risk: ${risk}`, ...dependencies.map((dependency) => `Dependency: ${dependency}`)],
      },
      {
        title: "Verification Requirements",
        bullets: [
          "Run typecheck and production build.",
          "Verify the workflow through browser interaction where UI changes are involved.",
          "Confirm all acceptance criteria are visible in the detail view and exported Markdown.",
        ],
      },
    ],
    doneChecklist: [
      "Acceptance criteria are implemented or explicitly deferred.",
      "API mutation path is validated and persistent.",
      "Developer-facing technical notes are included in Markdown export.",
      "Review/retro follow-up is captured when the item is delivered.",
    ],
    agentHandoffPrompt: [
      `You are implementing backlog item: ${item.title}.`,
      `Use this user story: ${item.userStory}`,
      `Respect priority ${item.priorityBand}/${item.priorityScore}, effort ${item.effort}, and the acceptance criteria.`,
      "Before coding, identify affected UI, API, data model, tests, and security boundaries.",
    ].join("\n"),
  };
}

export async function getBacklogTechnicalDoc(projectId: string, itemId: string) {
  const project = await getProjectSnapshot(projectId);
  const item = project.backlog.find((candidate) => candidate.id === itemId);
  if (!item) throw new Error("BACKLOG_ITEM_NOT_FOUND");
  return buildBacklogTechnicalDoc(item);
}

function renderTechnicalDoc(doc: BacklogTechnicalDoc) {
  const sections = doc.sections
    .map((section) => `${heading(4, section.title)}\n\n${list(section.bullets)}`)
    .join("\n\n");

  return [
    heading(3, doc.title),
    "",
    `Item ID: \`${doc.itemId}\``,
    "",
    doc.summary,
    "",
    sections,
    "",
    heading(4, "Done Checklist"),
    "",
    list(doc.doneChecklist),
    "",
    heading(4, "Agent Handoff Prompt"),
    "",
    "```text",
    doc.agentHandoffPrompt,
    "```",
  ].join("\n");
}

function renderBacklog(project: ProjectRecord) {
  if (project.backlog.length === 0) return "No Product Backlog items yet.";

  return project.backlog
    .map((item, index) =>
      [
        heading(3, `${index + 1}. ${item.title}`),
        "",
        `- ID: \`${item.id}\``,
        `- Status: ${item.status}`,
        `- Priority: ${item.priorityBand}/${item.priorityScore}`,
        `- Effort: ${item.effort} pts`,
        `- Source: ${item.source}`,
        "",
        heading(4, "User Story"),
        "",
        item.userStory,
        "",
        heading(4, "Problem"),
        "",
        item.problem,
        "",
        heading(4, "Acceptance Criteria"),
        "",
        list(item.acceptanceCriteria),
        "",
        heading(4, "Priority Reason"),
        "",
        item.priorityExplanation,
      ].join("\n"),
    )
    .join("\n\n");
}

function renderSprints(project: ProjectRecord) {
  if (project.sprints.length === 0) return "No sprints yet.";

  return project.sprints
    .map((sprint) =>
      [
        heading(3, sprint.name),
        "",
        `- ID: \`${sprint.id}\``,
        `- Sprint Number: ${sprint.sprintNumber}`,
        `- Status: ${sprint.status}`,
        `- Dates: ${formatDate(sprint.startDate)} to ${formatDate(sprint.endDate)}`,
        `- Goal: ${sprint.goal}`,
        "",
        heading(4, "Sprint Backlog"),
        "",
        sprint.items.length === 0
          ? "- No sprint tasks."
          : sprint.items
              .map(
                (item) =>
                  `- ${item.task} | ${item.status} | ${item.remainingEffort}/${item.initialEffort} pts remaining | Done: ${item.doneCondition}`,
              )
              .join("\n"),
      ].join("\n"),
    )
    .join("\n\n");
}

function renderIncrements(project: ProjectRecord) {
  const increments = project.sprints.flatMap((sprint) => sprint.increments);
  if (increments.length === 0) return "No increment evidence yet.";

  return increments
    .map((increment) =>
      [
        heading(3, increment.deliverable),
        "",
        `- ID: \`${increment.id}\``,
        `- Sprint ID: \`${increment.sprintId}\``,
        `- QA Status: ${increment.qaStatus}`,
        `- Review Decision: ${increment.reviewDecision}`,
        "",
        heading(4, "Acceptance Evidence"),
        "",
        list(increment.acceptanceEvidence),
      ].join("\n"),
    )
    .join("\n\n");
}

async function renderBurndown(project: ProjectRecord) {
  if (project.sprints.length === 0) return "No burndown data yet.";

  const sections: string[] = [];
  for (const sprint of project.sprints) {
    const burndown = await getBurndown(project.id, sprint.id);
    const latestActual = [...burndown.points].reverse().find((point) => point.actualRemaining !== null);
    const latestPoint = latestActual ?? burndown.points[burndown.points.length - 1];
    sections.push(
      [
        heading(3, sprint.name),
        "",
        `- Total Committed: ${burndown.totalCommitted} pts`,
        `- Latest Remaining: ${latestActual?.actualRemaining ?? 0} pts`,
        `- Latest Blocked Count: ${latestPoint?.blockedCount ?? 0}`,
        "",
        "| Date | Ideal | Actual | Projected | Blocked | Scope Change |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
        ...burndown.points.map(
          (point) =>
            `| ${point.date} | ${point.idealRemaining.toFixed(1)} | ${point.actualRemaining ?? "-"} | ${
              point.projectedRemaining?.toFixed(1) ?? "-"
            } | ${point.blockedCount} | ${point.scopeChange} |`,
        ),
      ].join("\n"),
    );
  }
  return sections.join("\n\n");
}

function renderReviews(project: ProjectRecord) {
  if (project.reviews.length === 0) return "No sprint reviews yet.";

  return project.reviews
    .map((review) =>
      [
        heading(3, `Review ${review.id}`),
        "",
        `- Sprint ID: \`${review.sprintId}\``,
        "",
        heading(4, "Demo Outcome"),
        "",
        review.demoOutcome,
        "",
        heading(4, "Stakeholder Feedback"),
        "",
        review.stakeholderFeedback ?? "None",
        "",
        heading(4, "Backlog Changes"),
        "",
        list(review.backlogChanges),
      ].join("\n"),
    )
    .join("\n\n");
}

function renderRetros(project: ProjectRecord) {
  if (project.retros.length === 0) return "No sprint retrospectives yet.";

  return project.retros
    .map((retro) =>
      [
        heading(3, `Retro ${retro.id}`),
        "",
        `- Sprint ID: \`${retro.sprintId}\``,
        "",
        heading(4, "What Worked"),
        "",
        list(retro.whatWorked),
        "",
        heading(4, "What Did Not Work"),
        "",
        list(retro.whatDidNotWork),
        "",
        heading(4, "Action Items"),
        "",
        list(retro.actionItems),
      ].join("\n"),
    )
    .join("\n\n");
}

function resolveAgentPrompt(input: MarkdownExportInput) {
  if (!input.includeAgentPrompt) return "";
  if (input.agentPreset === "custom") return input.customAgentPrompt?.trim() ?? "";
  const preset = agentPresets[input.agentPreset];
  const custom = input.customAgentPrompt?.trim();
  return custom ? `${preset}\n\nAdditional user preset:\n${custom}` : preset;
}

export async function exportProjectMarkdown(projectId: string, input: MarkdownExportInput) {
  const project = await getProjectSnapshot(projectId);
  const sections = new Set(input.sections);
  const parts: string[] = [
    heading(1, `${project.title} - Scrum Export`),
    "",
    `Exported At: ${new Date().toISOString()}`,
    `Project ID: \`${project.id}\``,
  ];

  const agentPrompt = resolveAgentPrompt(input);
  if (agentPrompt) {
    parts.push("", heading(2, "AI Agent Preset Prompt"), "", "```text", agentPrompt, "```");
  }

  if (sections.has("project")) {
    parts.push(
      "",
      heading(2, "Project"),
      "",
      `- Action: ${project.action}`,
      `- Purpose: ${project.purpose}`,
      `- Timezone: ${project.timezone}`,
      `- Created: ${project.createdAt}`,
      `- Updated: ${project.updatedAt}`,
    );
  }

  if (sections.has("backlog")) {
    parts.push("", heading(2, "Product Backlog"), "", renderBacklog(project));
  }

  if (sections.has("technicalDocs")) {
    parts.push(
      "",
      heading(2, "Backlog Technical Documentation"),
      "",
      project.backlog.length === 0
        ? "No backlog technical documentation yet."
        : project.backlog.map((item) => renderTechnicalDoc(buildBacklogTechnicalDoc(item))).join("\n\n"),
    );
  }

  if (sections.has("sprints")) {
    parts.push("", heading(2, "Sprints"), "", renderSprints(project));
  }

  if (sections.has("increments")) {
    parts.push("", heading(2, "Increment Evidence"), "", renderIncrements(project));
  }

  if (sections.has("burndown")) {
    parts.push("", heading(2, "Burndown"), "", await renderBurndown(project));
  }

  if (sections.has("reviews")) {
    parts.push("", heading(2, "Sprint Reviews"), "", renderReviews(project));
  }

  if (sections.has("retros")) {
    parts.push("", heading(2, "Sprint Retrospectives"), "", renderRetros(project));
  }

  const safeTitle = project.title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return {
    filename: `${safeTitle || "scrum-export"}-${new Date().toISOString().slice(0, 10)}.md`,
    content: `${parts.join("\n")}\n`,
  };
}

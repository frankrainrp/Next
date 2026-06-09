import { z } from "zod";
import {
  CreateBacklogItemRequestSchema,
  CreateProjectRequestSchema,
  CreateSprintRequestSchema,
  MarkdownExportRequestSchema,
  RetroRecordRequestSchema,
  ReviewRecordRequestSchema,
} from "@/server/scrum/schemas";
import { exportProjectMarkdown } from "@/server/scrum/markdown";
import {
  createBacklogItem,
  createProject,
  createRetro,
  createReview,
  createSprint,
  draftBacklogFromPrompt,
  getBurndown,
  getProjectSnapshot,
  type ProjectRecord,
} from "@/server/scrum/store";

type JsonSchema = Record<string, unknown>;

export type SixStageMcpToolDefinition = {
  name: string;
  title: string;
  description: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  annotations: Record<string, unknown>;
  _meta: {
    scrumStage: 1 | 2 | 3 | 4 | 5 | 6;
    mapsToApi: string[];
    requiresUserConfirmation: boolean;
  };
};

type McpToolResult = {
  content: Array<{ type: "text"; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
};

const confirmedProperty = {
  type: "boolean",
  description:
    "Set true only after the user explicitly confirms the mutation. Without confirmation, the tool returns a preview and does not write Scrum artifacts.",
  default: false,
};

const backlogItemInputSchema = {
  type: "object",
  properties: {
    title: { type: "string" },
    userStory: { type: "string" },
    problem: { type: "string" },
    acceptanceCriteria: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
    status: { type: "string", enum: ["Idea", "Ready", "Selected", "Deferred", "Done", "Dropped"] },
    effort: { type: "number", minimum: 1 },
    risk: { type: "string" },
    dependencies: { type: "array", items: { type: "string" } },
    source: { type: "string", enum: ["Chat", "Review", "Retro", "Manual", "ImportedDoc", "AiProposal"] },
    priority: {
      type: "object",
      properties: {
        priorityScore: { type: "number" },
        priorityBand: { type: "string", enum: ["P0", "P1", "P2", "P3"] },
        priorityExplanation: { type: "string" },
      },
      required: ["priorityScore", "priorityBand", "priorityExplanation"],
    },
  },
  required: ["title", "userStory", "problem", "acceptanceCriteria", "status", "effort", "dependencies", "source"],
  additionalProperties: false,
};

const standardOutputSchema = {
  type: "object",
  properties: {
    stage: { type: "number" },
    status: { type: "string" },
    needsConfirmation: { type: "boolean" },
    nextTool: { type: "string" },
  },
  required: ["stage", "status"],
};

export const sixStageScrumMcpTools: SixStageMcpToolDefinition[] = [
  {
    name: "scrum_create_workspace",
    title: "Create Scrum Workspace",
    description:
      "Stage 1. Create a real Scrum project workspace for ai product manager. Use this when the user has confirmed the product name, purpose, and main action. This mutates persistent Scrum state and therefore requires confirmed=true.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Workspace or product name." },
        action: { type: "string", description: "The primary product action the team is trying to achieve." },
        purpose: { type: "string", description: "Why this product exists and what outcome it should create." },
        timezone: { type: "string", default: "Asia/Shanghai" },
        context: { type: "object", description: "Optional structured project context from the chat or uploaded notes." },
        confirmed: confirmedProperty,
      },
      required: ["title", "action", "purpose"],
      additionalProperties: false,
    },
    outputSchema: standardOutputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    _meta: {
      scrumStage: 1,
      mapsToApi: ["POST /api/projects"],
      requiresUserConfirmation: true,
    },
  },
  {
    name: "scrum_capture_requirements",
    title: "Capture Scrum Requirements",
    description:
      "Stage 2. Convert the chat prompt and available notes into a requirements snapshot, assumptions, missing information, and next-step questions. This tool is read-only and should run before drafting artifacts when the prompt is vague.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Optional existing project id." },
        prompt: { type: "string", description: "User's raw product or sprint planning request." },
        knownArtifacts: { type: "array", items: { type: "string" }, default: [] },
        sourceNotes: { type: "array", items: { type: "string" }, default: [] },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
    outputSchema: standardOutputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    _meta: {
      scrumStage: 2,
      mapsToApi: ["POST /api/ai/chat"],
      requiresUserConfirmation: false,
    },
  },
  {
    name: "scrum_draft_product_backlog",
    title: "Draft Product Backlog",
    description:
      "Stage 3. Draft Product Backlog items from the captured requirements. This returns structured draft items only; it does not write Product Backlog records. Use scrum_apply_product_backlog after user confirmation.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Optional existing project id for context." },
        prompt: { type: "string", description: "Confirmed product goal and requirements." },
        maxItems: { type: "number", minimum: 1, maximum: 8, default: 4 },
        includeTechnicalNotes: { type: "boolean", default: true },
      },
      required: ["prompt"],
      additionalProperties: false,
    },
    outputSchema: standardOutputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    _meta: {
      scrumStage: 3,
      mapsToApi: ["POST /api/ai/chat", "POST /api/projects/[projectId]/ai/proposals"],
      requiresUserConfirmation: false,
    },
  },
  {
    name: "scrum_apply_product_backlog",
    title: "Apply Product Backlog",
    description:
      "Stage 4. Persist confirmed Product Backlog items. Call only after the user has reviewed the draft and explicitly confirmed that the items should be written.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        items: {
          type: "array",
          items: backlogItemInputSchema,
          minItems: 1,
          maxItems: 20,
        },
        confirmed: confirmedProperty,
      },
      required: ["projectId", "items"],
      additionalProperties: false,
    },
    outputSchema: standardOutputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    _meta: {
      scrumStage: 4,
      mapsToApi: ["POST /api/projects/[projectId]/backlog"],
      requiresUserConfirmation: true,
    },
  },
  {
    name: "scrum_plan_sprint_burndown",
    title: "Plan Sprint And Burndown",
    description:
      "Stage 5. Create a confirmed Sprint Backlog from selected Product Backlog items and return the initial burndown series. Requires user confirmation because it changes backlog status and sprint state.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        sprintNumber: { type: "number", minimum: 1 },
        name: { type: "string" },
        goal: { type: "string" },
        startDate: { type: "string", description: "YYYY-MM-DD date string." },
        endDate: { type: "string", description: "YYYY-MM-DD date string." },
        workingDays: { type: "array", items: { type: "string" }, default: [] },
        selectedBacklogItemIds: { type: "array", items: { type: "string" }, default: [] },
        confirmed: confirmedProperty,
      },
      required: ["projectId", "sprintNumber", "name", "goal", "startDate", "endDate"],
      additionalProperties: false,
    },
    outputSchema: standardOutputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    _meta: {
      scrumStage: 5,
      mapsToApi: ["POST /api/projects/[projectId]/sprints", "GET /api/projects/[projectId]/sprints/[sprintId]/burndown"],
      requiresUserConfirmation: true,
    },
  },
  {
    name: "scrum_record_review_retro_export",
    title: "Record Review Retro And Export",
    description:
      "Stage 6. Persist sprint review and retrospective records, then optionally export the Scrum workspace as Markdown with a visible AI agent prompt preset. Review or retro writes require confirmed=true; export-only calls are read-only.",
    inputSchema: {
      type: "object",
      properties: {
        projectId: { type: "string" },
        sprintId: { type: "string", description: "Required when review or retro is provided." },
        review: {
          type: "object",
          properties: {
            demoOutcome: { type: "string" },
            acceptedItems: { type: "array", items: { type: "string" }, default: [] },
            followUpItems: { type: "array", items: { type: "string" }, default: [] },
            stakeholderFeedback: { type: "string" },
            backlogChanges: { type: "array", items: { type: "string" }, default: [] },
          },
          required: ["demoOutcome"],
        },
        retro: {
          type: "object",
          properties: {
            whatWorked: { type: "array", items: { type: "string" }, default: [] },
            whatDidNotWork: { type: "array", items: { type: "string" }, default: [] },
            rootCause: { type: "string" },
            experiment: { type: "string" },
            actionItems: { type: "array", items: { type: "string" }, default: [] },
          },
        },
        markdownExport: {
          type: "object",
          properties: {
            includeAgentPrompt: { type: "boolean", default: true },
            agentPreset: {
              type: "string",
              enum: ["scrum-dev-agent", "frontend-ui-agent", "backend-api-agent", "qa-review-agent", "custom"],
              default: "scrum-dev-agent",
            },
            customAgentPrompt: { type: "string", maxLength: 4000 },
            sections: {
              type: "array",
              items: {
                type: "string",
                enum: ["project", "backlog", "technicalDocs", "sprints", "increments", "burndown", "reviews", "retros"],
              },
            },
          },
        },
        confirmed: confirmedProperty,
      },
      required: ["projectId"],
      additionalProperties: false,
    },
    outputSchema: standardOutputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    _meta: {
      scrumStage: 6,
      mapsToApi: [
        "POST /api/projects/[projectId]/reviews",
        "POST /api/projects/[projectId]/retros",
        "POST /api/projects/[projectId]/exports/markdown",
      ],
      requiresUserConfirmation: true,
    },
  },
];

const CreateWorkspaceToolInputSchema = CreateProjectRequestSchema.extend({
  confirmed: z.boolean().default(false),
});

const CaptureRequirementsToolInputSchema = z.object({
  projectId: z.string().optional(),
  prompt: z.string().min(1),
  knownArtifacts: z.array(z.string()).default([]),
  sourceNotes: z.array(z.string()).default([]),
});

const DraftProductBacklogToolInputSchema = z.object({
  projectId: z.string().optional(),
  prompt: z.string().min(1),
  maxItems: z.number().int().min(1).max(8).default(4),
  includeTechnicalNotes: z.boolean().default(true),
});

const ApplyProductBacklogToolInputSchema = z.object({
  projectId: z.string().min(1),
  items: z.array(CreateBacklogItemRequestSchema).min(1).max(20),
  confirmed: z.boolean().default(false),
});

const PlanSprintBurndownToolInputSchema = CreateSprintRequestSchema.extend({
  projectId: z.string().min(1),
  confirmed: z.boolean().default(false),
});

const ReviewWithoutSprintSchema = ReviewRecordRequestSchema.omit({ sprintId: true });
const RetroWithoutSprintSchema = RetroRecordRequestSchema.omit({ sprintId: true });

const RecordReviewRetroExportToolInputSchema = z
  .object({
    projectId: z.string().min(1),
    sprintId: z.string().optional(),
    review: ReviewWithoutSprintSchema.optional(),
    retro: RetroWithoutSprintSchema.optional(),
    markdownExport: MarkdownExportRequestSchema.optional(),
    confirmed: z.boolean().default(false),
  })
  .superRefine((input, context) => {
    if ((input.review || input.retro) && !input.sprintId) {
      context.addIssue({
        code: "custom",
        message: "sprintId is required when review or retro is provided.",
        path: ["sprintId"],
      });
    }
  });

function textResult(structuredContent: Record<string, unknown>, isError = false): McpToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(structuredContent) }],
    structuredContent,
    isError,
  };
}

function confirmationRequired(stage: number, toolName: string, preview: Record<string, unknown>): McpToolResult {
  return textResult({
    stage,
    status: "confirmation_required",
    needsConfirmation: true,
    toolName,
    message: "Return the same arguments with confirmed=true only after explicit user confirmation.",
    preview,
  });
}

function summarizeProject(project: ProjectRecord) {
  return {
    id: project.id,
    title: project.title,
    action: project.action,
    purpose: project.purpose,
    backlogCount: project.backlog.length,
    sprintCount: project.sprints.length,
    reviewCount: project.reviews.length,
    retroCount: project.retros.length,
    updatedAt: project.updatedAt,
  };
}

function buildRequirementQuestions(prompt: string) {
  const questions: string[] = [];
  if (!/user|customer|team|role|persona/i.test(prompt)) {
    questions.push("Who is the primary user or team role for this workflow?");
  }
  if (!/success|metric|kpi|done|acceptance|verify/i.test(prompt)) {
    questions.push("What measurable outcome proves this product or sprint is successful?");
  }
  if (!/api|data|database|auth|integration|design|architecture/i.test(prompt)) {
    questions.push("Which technical boundaries, integrations, or design artifacts must guide development?");
  }
  if (!/risk|constraint|deadline|scope|budget|security/i.test(prompt)) {
    questions.push("What constraints or risks should affect priority scoring?");
  }
  return questions.slice(0, 4);
}

function buildAssumptions(prompt: string, sourceNotes: string[]) {
  const assumptions = [
    "Scrum artifacts, not chat history, are the source of truth.",
    "AI-generated mutations require user confirmation before persistence.",
  ];
  if (/mvp|first version|initial/i.test(prompt)) {
    assumptions.push("The immediate plan should optimize for a narrow MVP before broader framework support.");
  }
  if (sourceNotes.length > 0) {
    assumptions.push("Source notes should be cited or summarized before they influence backlog priority.");
  }
  return assumptions;
}

export async function callSixStageScrumMcpTool(name: string, rawArguments: unknown): Promise<McpToolResult> {
  try {
    switch (name) {
      case "scrum_create_workspace": {
        const input = CreateWorkspaceToolInputSchema.parse(rawArguments ?? {});
        const { confirmed, ...projectInput } = input;
        if (!confirmed) {
          return confirmationRequired(1, name, {
            title: projectInput.title,
            action: projectInput.action,
            purpose: projectInput.purpose,
          });
        }

        const project = await createProject(projectInput);
        return textResult({
          stage: 1,
          status: "applied",
          needsConfirmation: false,
          project: summarizeProject(project),
          nextTool: "scrum_capture_requirements",
        });
      }

      case "scrum_capture_requirements": {
        const input = CaptureRequirementsToolInputSchema.parse(rawArguments ?? {});
        const project = input.projectId ? summarizeProject(await getProjectSnapshot(input.projectId)) : undefined;
        const questions = buildRequirementQuestions(input.prompt);
        return textResult({
          stage: 2,
          status: questions.length > 0 ? "needs_clarification" : "captured",
          needsConfirmation: false,
          project,
          requirementsSnapshot: {
            objective: input.prompt.trim(),
            knownArtifacts: input.knownArtifacts,
            sourceNotes: input.sourceNotes,
            assumptions: buildAssumptions(input.prompt, input.sourceNotes),
            clarificationQuestions: questions,
          },
          nextTool: "scrum_draft_product_backlog",
        });
      }

      case "scrum_draft_product_backlog": {
        const input = DraftProductBacklogToolInputSchema.parse(rawArguments ?? {});
        const project = input.projectId ? summarizeProject(await getProjectSnapshot(input.projectId)) : undefined;
        const productBacklogItems = draftBacklogFromPrompt(input.prompt).slice(0, input.maxItems);
        return textResult({
          stage: 3,
          status: "drafted",
          needsConfirmation: false,
          project,
          proposal: {
            type: "ProductBacklogDraft",
            rationale: "Drafted from confirmed Scrum requirements. Persist only through scrum_apply_product_backlog.",
            payload: {
              productBacklogItems,
              sprintBacklogItems: [],
              incrementEvidence: [],
              priorityScores: [],
              technicalNotes: input.includeTechnicalNotes
                ? productBacklogItems.map((item) => ({
                    title: item.title,
                    developerNeed: "Open the backlog detail after applying to review functional, technical, API/data, UI, risk, and verification requirements.",
                  }))
                : [],
            },
          },
          nextTool: "scrum_apply_product_backlog",
        });
      }

      case "scrum_apply_product_backlog": {
        const input = ApplyProductBacklogToolInputSchema.parse(rawArguments ?? {});
        if (!input.confirmed) {
          return confirmationRequired(4, name, {
            projectId: input.projectId,
            itemCount: input.items.length,
            itemTitles: input.items.map((item) => item.title),
          });
        }

        const createdItems = [];
        for (const item of input.items) {
          createdItems.push(await createBacklogItem(input.projectId, item));
        }

        return textResult({
          stage: 4,
          status: "applied",
          needsConfirmation: false,
          projectId: input.projectId,
          createdItems,
          nextTool: "scrum_plan_sprint_burndown",
        });
      }

      case "scrum_plan_sprint_burndown": {
        const input = PlanSprintBurndownToolInputSchema.parse(rawArguments ?? {});
        const { projectId, confirmed, ...sprintInput } = input;
        if (!confirmed) {
          return confirmationRequired(5, name, {
            projectId,
            sprintNumber: sprintInput.sprintNumber,
            name: sprintInput.name,
            goal: sprintInput.goal,
            selectedBacklogItemIds: sprintInput.selectedBacklogItemIds,
          });
        }

        const sprint = await createSprint(projectId, sprintInput);
        const burndown = await getBurndown(projectId, sprint.id);
        return textResult({
          stage: 5,
          status: "applied",
          needsConfirmation: false,
          projectId,
          sprint,
          burndown,
          nextTool: "scrum_record_review_retro_export",
        });
      }

      case "scrum_record_review_retro_export": {
        const input = RecordReviewRetroExportToolInputSchema.parse(rawArguments ?? {});
        const hasMutation = Boolean(input.review || input.retro);
        if (hasMutation && !input.confirmed) {
          return confirmationRequired(6, name, {
            projectId: input.projectId,
            sprintId: input.sprintId,
            willWriteReview: Boolean(input.review),
            willWriteRetro: Boolean(input.retro),
            willExportMarkdown: Boolean(input.markdownExport),
          });
        }

        const review = input.review && input.sprintId ? await createReview(input.projectId, { sprintId: input.sprintId, ...input.review }) : undefined;
        const retro = input.retro && input.sprintId ? await createRetro(input.projectId, { sprintId: input.sprintId, ...input.retro }) : undefined;
        const markdownExport = input.markdownExport ? await exportProjectMarkdown(input.projectId, input.markdownExport) : undefined;

        return textResult({
          stage: 6,
          status: "recorded",
          needsConfirmation: false,
          projectId: input.projectId,
          review,
          retro,
          markdownExport,
          nextTool: "scrum_capture_requirements",
        });
      }

      default:
        return textResult(
          {
            status: "unknown_tool",
            toolName: name,
            availableTools: sixStageScrumMcpTools.map((tool) => tool.name),
          },
          true,
        );
    }
  } catch (error) {
    return textResult(
      {
        status: "tool_error",
        toolName: name,
        message: error instanceof Error ? error.message : "UNKNOWN_TOOL_ERROR",
      },
      true,
    );
  }
}

import { z } from "zod";

export const PriorityBandSchema = z.enum(["P0", "P1", "P2", "P3"]);
export const ProductBacklogStatusSchema = z.enum(["Idea", "Ready", "Selected", "Deferred", "Done", "Dropped"]);
export const SprintStatusSchema = z.enum(["Planned", "Active", "Review", "Closed", "Cancelled"]);
export const SprintItemStatusSchema = z.enum(["Todo", "InProgress", "Blocked", "Review", "Done"]);
export const QaStatusSchema = z.enum(["Untested", "Passed", "Failed", "Waived"]);
export const ReviewDecisionSchema = z.enum(["Accepted", "NeedsFollowUp", "Deferred"]);
export const AiPromptStageSchema = z.enum(["step1", "step2", "step3", "step4", "step5", "step6"]);
export const ProposalTypeSchema = z.enum([
  "ProductBacklogDraft",
  "SprintBacklogDraft",
  "PriorityChange",
  "BurndownUpdate",
  "ReviewRecord",
  "RetroRecord",
]);

const CriteriaSchema = z.array(z.string().min(1)).min(1);

export const CreateProjectRequestSchema = z.object({
  title: z.string().min(1),
  action: z.string().min(1),
  purpose: z.string().min(1),
  timezone: z.string().default("Asia/Shanghai"),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const ProductBacklogItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  userStory: z.string().min(1),
  problem: z.string().min(1),
  acceptanceCriteria: CriteriaSchema,
  status: ProductBacklogStatusSchema,
  priorityBand: PriorityBandSchema,
  priorityScore: z.number().int().min(0),
  priorityExplanation: z.string().min(1),
  effort: z.number().int().min(1),
  risk: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  source: z.enum(["Chat", "Review", "Retro", "Manual", "ImportedDoc", "AiProposal"]),
});

export const CreateBacklogItemRequestSchema = ProductBacklogItemSchema.omit({
  id: true,
  priorityScore: true,
  priorityBand: true,
  priorityExplanation: true,
}).extend({
  priority: z
    .object({
      priorityScore: z.number().int().min(0),
      priorityBand: PriorityBandSchema,
      priorityExplanation: z.string().min(1),
    })
    .optional(),
});

export const SprintBacklogItemSchema = z.object({
  id: z.string(),
  productBacklogItemId: z.string().optional(),
  task: z.string().min(1),
  owner: z.string().optional(),
  status: SprintItemStatusSchema,
  initialEffort: z.number().min(0).optional(),
  remainingEffort: z.number().min(0),
  doneCondition: z.string().min(1),
  blocker: z.string().optional(),
  targetDate: z.string().optional(),
  evidenceLink: z.string().optional(),
});

export const SprintSchema = z.object({
  id: z.string(),
  sprintNumber: z.number().int().min(1),
  name: z.string().min(1),
  goal: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  status: SprintStatusSchema,
  workingDays: z.array(z.string()).default([]),
  items: z.array(SprintBacklogItemSchema).default([]),
});

export const CreateSprintRequestSchema = SprintSchema.omit({
  id: true,
  status: true,
  items: true,
}).extend({
  selectedBacklogItemIds: z.array(z.string()).default([]),
});

export const UpdateSprintItemRequestSchema = z.object({
  status: SprintItemStatusSchema.optional(),
  remainingEffort: z.number().min(0).optional(),
  blocker: z.string().optional(),
  evidenceLink: z.string().optional(),
});

export const IncrementEvidenceSchema = z.object({
  id: z.string(),
  productBacklogItemId: z.string(),
  sprintId: z.string(),
  deliverable: z.string().min(1),
  acceptanceEvidence: CriteriaSchema,
  qaStatus: QaStatusSchema,
  demoNotes: z.string().optional(),
  reviewDecision: ReviewDecisionSchema,
  followUpItems: z.array(z.string()).default([]),
});

export const BurndownPointSchema = z.object({
  date: z.string(),
  idealRemaining: z.number().min(0),
  actualRemaining: z.number().min(0).nullable(),
  projectedRemaining: z.number().min(0).optional(),
  scopeChange: z.number().default(0),
  blockedCount: z.number().int().min(0).default(0),
});

export const ReviewRecordRequestSchema = z.object({
  sprintId: z.string(),
  demoOutcome: z.string().min(1),
  acceptedItems: z.array(z.string()).default([]),
  followUpItems: z.array(z.string()).default([]),
  stakeholderFeedback: z.string().optional(),
  backlogChanges: z.array(z.string()).default([]),
});

export const RetroRecordRequestSchema = z.object({
  sprintId: z.string(),
  whatWorked: z.array(z.string()).default([]),
  whatDidNotWork: z.array(z.string()).default([]),
  rootCause: z.string().optional(),
  experiment: z.string().optional(),
  actionItems: z.array(z.string()).default([]),
});

export const ArtifactProposalRequestSchema = z.object({
  type: ProposalTypeSchema,
  rationale: z.string().min(1),
  payload: z.record(z.string(), z.unknown()),
});

export const AiChatRequestSchema = z.object({
  projectId: z.string().optional(),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
  prompt: z.string().optional(),
  strength: z.enum(["fast", "strong"]).optional(),
  providerApiKey: z.string().min(1).max(400).optional(),
  promptStage: AiPromptStageSchema.optional(),
  intent: z.enum(["clarify", "draft_backlog", "plan_sprint", "review_retro", "general"]).default("general"),
});

export const MarkdownExportRequestSchema = z.object({
  includeAgentPrompt: z.boolean().default(true),
  agentPreset: z
    .enum(["scrum-dev-agent", "frontend-ui-agent", "backend-api-agent", "qa-review-agent", "custom"])
    .default("scrum-dev-agent"),
  customAgentPrompt: z.string().max(4000).optional(),
  sections: z
    .array(z.enum(["project", "backlog", "technicalDocs", "sprints", "increments", "burndown", "reviews", "retros"]))
    .default(["project", "backlog", "technicalDocs", "sprints", "increments", "burndown", "reviews", "retros"]),
});

export type ProductBacklogItem = z.infer<typeof ProductBacklogItemSchema>;
export type Sprint = z.infer<typeof SprintSchema>;
export type BurndownPoint = z.infer<typeof BurndownPointSchema>;

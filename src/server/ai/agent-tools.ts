import { tool } from "@langchain/core/tools";
import type { StructuredToolInterface } from "@langchain/core/tools";
import { z } from "zod";
import {
  createBacklogItem,
  createSprint,
  updateBacklogItem,
  updateProjectContext,
  updateSprintItem,
} from "@/server/scrum/store";
import { completeStage, type AgentSession } from "./agent-session";
import { AiPromptStages } from "./stage-prompts";

/**
 * Artifact tools for the six-stage product agent.
 *
 * MoSCoW maps 1:1 onto the existing priority bands — this is also the color
 * language of the Sprint board chips:
 *   Must  → P0 (red) · Should → P1 (orange) · Could → P2 (blue) · Won't → P3 (black)
 *
 * Per the working rules, the agent must only call mutating tools AFTER the
 * user has explicitly confirmed the proposal in conversation (✅).
 */

const MoscowSchema = z.enum(["Must", "Should", "Could", "Wont"]);

const moscowToPriority: Record<z.infer<typeof MoscowSchema>, { band: "P0" | "P1" | "P2" | "P3"; score: number }> = {
  Must: { band: "P0", score: 90 },
  Should: { band: "P1", score: 70 },
  Could: { band: "P2", score: 50 },
  Wont: { band: "P3", score: 20 },
};

export function buildArtifactTools(projectId: string, session: AgentSession): StructuredToolInterface[] {
  const recordFounderBrief = tool(
    async (input: {
      productIdea: string;
      motivation: string;
      businessShape: string;
      founderProfile: string;
      timeBudget: string;
      existingAssets?: string;
      recommendedPath: string;
    }) => {
      await updateProjectContext(projectId, { founderBrief: { ...input, confirmedAt: new Date().toISOString() } });
      return "Founder Brief saved to the project.";
    },
    {
      name: "record_founder_brief",
      description:
        "Step 1 artifact. Save the confirmed Founder Brief: one-line idea, motivation, business shape, founder profile, time budget, and the recommended founder path. Call only after the user explicitly confirms.",
      schema: z.object({
        productIdea: z.string().describe("The SaaS idea in one sentence."),
        motivation: z.string().describe("Why this product / personal connection to the problem."),
        businessShape: z.string().describe("B2B/B2C/B2B2C + product type (tool/platform/automation/AI agent)."),
        founderProfile: z.string().describe("Solo/team, strongest skills, technical level, AI-coding fluency."),
        timeBudget: z.string().describe("Hours per week and target date for first usable version."),
        existingAssets: z.string().optional().describe("Target customers, industry access, audience, prior work."),
        recommendedPath: z.string().describe("The chosen founder path from the table, with reason."),
      }),
    },
  );

  const recordBlueprint = tool(
    async (input: {
      icp: string;
      problemStatement: string;
      painQuantification: string;
      currentAlternatives: string;
      useCases: string;
      positioning: string;
      willingnessToPay: string;
      notDoing: string;
      marketResearch?: string;
    }) => {
      await updateProjectContext(projectId, { blueprint: { ...input, confirmedAt: new Date().toISOString() } });
      return "Blueprint Core (ICP, problem, positioning) saved to the project.";
    },
    {
      name: "record_blueprint",
      description:
        "Step 2 artifact. Save the confirmed Blueprint Core: specific ICP, problem statement, pain quantification, alternatives, use cases, one-line positioning, willingness to pay, and the not-doing list. Call only after user confirmation.",
      schema: z.object({
        icp: z.string().describe("Specific persona: industry, size, channel, behavior, budget — never a vague label."),
        problemStatement: z.string(),
        painQuantification: z.string().describe("frequency × loss per occurrence × scope = $X/month, and the price point it supports."),
        currentAlternatives: z.string().describe("What they use today and why it falls short."),
        useCases: z.string().describe("Core scenarios in the when/wants/but/needs/gains format."),
        positioning: z.string().describe("For [user], [product] provides [capability] helping [outcome]; unlike [alt], we [edge]."),
        willingnessToPay: z.string().describe("Evidence or labeled assumption."),
        notDoing: z.string().describe("Explicit list of what this product is NOT."),
        marketResearch: z.string().optional().describe("Competitor/alternative findings with source URLs, or 'unverified model knowledge'."),
      }),
    },
  );

  const saveProductBacklog = tool(
    async ({
      items,
    }: {
      items: Array<{
        title: string;
        userStory: string;
        problem: string;
        acceptanceCriteria: string[];
        moscow: z.infer<typeof MoscowSchema>;
        valueReason: string;
        effort: number;
        risk?: string;
        dependencies?: string[];
        criticalPath?: boolean;
      }>;
    }) => {
      const created: string[] = [];
      for (const item of items) {
        const priority = moscowToPriority[item.moscow];
        const record = await createBacklogItem(projectId, {
          title: item.title,
          userStory: item.userStory,
          problem: item.problem,
          acceptanceCriteria: item.acceptanceCriteria,
          status: item.moscow === "Wont" ? "Deferred" : "Ready",
          effort: item.effort,
          risk: item.risk,
          dependencies: item.dependencies ?? [],
          source: "AiProposal",
          priority: {
            priorityScore: priority.score + (item.criticalPath ? 5 : 0),
            priorityBand: priority.band,
            priorityExplanation: `MoSCoW ${item.moscow}${item.criticalPath ? " · critical path" : ""} — ${item.valueReason}`,
          },
        });
        created.push(`${record.id} (${item.moscow}: ${item.title})`);
      }
      return `Created ${created.length} Product Backlog items:\n${created.join("\n")}`;
    },
    {
      name: "save_product_backlog",
      description:
        "Step 3 artifact. Create the MoSCoW-ranked Product Backlog from the confirmed node plan. Each node becomes one backlog card. Call only after user confirmation.",
      schema: z.object({
        items: z.array(
          z.object({
            title: z.string(),
            userStory: z.string().describe("As a [role], I want [feature], so that [value]."),
            problem: z.string().describe("The problem this node solves for the end user."),
            acceptanceCriteria: z.array(z.string()).min(1),
            moscow: MoscowSchema,
            valueReason: z.string().describe("Why this priority, anchored in end-user value."),
            effort: z.number().int().min(1).max(40).describe("Coarse effort estimate in hours."),
            risk: z.string().optional(),
            dependencies: z.array(z.string()).optional(),
            criticalPath: z.boolean().optional().describe("True if this node is on the critical path."),
          }),
        ),
      }),
    },
  );

  const saveRequirementSpec = tool(
    async ({
      items,
    }: {
      items: Array<{
        backlogItemId: string;
        requirement: string;
        technicalPlan: string;
        acceptanceCriteria?: string[];
        moscow?: z.infer<typeof MoscowSchema>;
        alignment: string;
        codingPrompt?: string;
      }>;
    }) => {
      const updated: string[] = [];
      for (const item of items) {
        const spec = [
          "## Requirement",
          item.requirement,
          "",
          "## Technical Plan",
          item.technicalPlan,
          "",
          "## Goal Alignment",
          item.alignment,
        ].join("\n");
        const patch: Parameters<typeof updateBacklogItem>[2] = { technicalSpec: spec };
        if (item.codingPrompt) {
          patch.codingPrompt = item.codingPrompt;
        }
        if (item.acceptanceCriteria && item.acceptanceCriteria.length > 0) {
          patch.acceptanceCriteria = item.acceptanceCriteria;
        }
        if (item.moscow) {
          const priority = moscowToPriority[item.moscow];
          patch.priorityBand = priority.band;
          patch.priorityScore = priority.score;
        }
        const record = await updateBacklogItem(projectId, item.backlogItemId, patch);
        updated.push(`${record.id} (${record.title})`);
      }
      return `Attached executable specs to ${updated.length} backlog items:\n${updated.join("\n")}`;
    },
    {
      name: "save_requirement_spec",
      description:
        "Step 4 artifact. After the three confirmation rounds, attach the executable spec (requirement + data/page/tech blueprint + goal alignment + AI coding prompt) to existing backlog items. This is what turns a Product Backlog card into a Scrum Backlog card. Call only after all three rounds are confirmed.",
      schema: z.object({
        items: z.array(
          z.object({
            backlogItemId: z.string().describe("The id returned by save_product_backlog (pbi_...)."),
            requirement: z.string().describe("Round 1: the clarified requirement description with numbered acceptance criteria."),
            technicalPlan: z.string().describe("Round 2 blueprint (markdown): data objects/fields/relations/permissions + page blueprint + tech plan."),
            acceptanceCriteria: z.array(z.string()).optional().describe("Refined acceptance criteria, if changed."),
            moscow: MoscowSchema.optional().describe("Only if the priority changed during confirmation."),
            alignment: z.string().describe("Round 3: alignment with the ICP pain and the v1 success metric."),
            codingPrompt: z.string().optional().describe("Ready-to-paste AI coding prompt (Cursor / Claude Code) built from the template."),
          }),
        ),
      }),
    },
  );

  const createSprintPlan = tool(
    async (input: {
      sprintNumber: number;
      name: string;
      goal: string;
      startDate: string;
      endDate: string;
      selectedBacklogItemIds: string[];
      planSummary: string;
      completionTiers?: string;
    }) => {
      const sprint = await createSprint(projectId, {
        sprintNumber: input.sprintNumber,
        name: input.name,
        goal: input.goal,
        startDate: input.startDate,
        endDate: input.endDate,
        workingDays: [],
        selectedBacklogItemIds: input.selectedBacklogItemIds,
      });
      await updateProjectContext(projectId, {
        executionPlan: {
          sprintId: sprint.id,
          planSummary: input.planSummary,
          completionTiers: input.completionTiers,
          confirmedAt: new Date().toISOString(),
        },
      });
      return `Sprint created: ${sprint.id} with ${sprint.items.length} tasks. Burndown initialized.`;
    },
    {
      name: "create_sprint_plan",
      description:
        "Step 5 artifact. Create the Sprint from the confirmed execution plan: selected backlog items become Sprint Backlog tasks and the burndown chart is initialized. Call only after the user confirms the plan.",
      schema: z.object({
        sprintNumber: z.number().int().min(1),
        name: z.string(),
        goal: z.string(),
        startDate: z.string().describe("ISO date, e.g. 2026-06-20"),
        endDate: z.string().describe("ISO date"),
        selectedBacklogItemIds: z.array(z.string()).min(1).describe("pbi_... ids going into this sprint (usually Must + chosen Should)."),
        planSummary: z.string().describe("Markdown: time budget, calibrated estimates, daily output goals with Sprint %, milestones."),
        completionTiers: z.string().optional().describe("Markdown: minimum / standard / ideal tier definitions."),
      }),
    },
  );

  const recordProgress = tool(
    async (input: {
      sprintId: string;
      itemId: string;
      status?: "Todo" | "InProgress" | "Blocked" | "Review" | "Done";
      remainingEffort?: number;
      blocker?: string;
    }) => {
      const result = await updateSprintItem(projectId, input.sprintId, input.itemId, {
        status: input.status,
        remainingEffort: input.remainingEffort,
        blocker: input.blocker,
      });
      return `Task "${result.item.task}" updated (status: ${result.item.status}, remaining: ${result.item.remainingEffort}h). Burndown history refreshed.`;
    },
    {
      name: "record_progress",
      description:
        "Step 6 artifact. Record the user's reported progress on a sprint task: status change and/or remaining effort. This updates the burndown chart. Use the task ids visible in the sprint snapshot.",
      schema: z.object({
        sprintId: z.string().describe("spr_... id of the active sprint."),
        itemId: z.string().describe("task_... id of the sprint task."),
        status: z.enum(["Todo", "InProgress", "Blocked", "Review", "Done"]).optional(),
        remainingEffort: z.number().min(0).optional().describe("Hours of work remaining on this task."),
        blocker: z.string().optional(),
      }),
    },
  );

  const completeStageTool = tool(
    async ({ stage, handoffSummary }: { stage: (typeof AiPromptStages)[number]; handoffSummary: string }) => {
      completeStage(session, stage, handoffSummary);
      return `Stage ${stage} marked complete. Now on ${session.stage}. The handoff summary is stored and will be injected into the next stage's context.`;
    },
    {
      name: "complete_stage",
      description:
        "Mark the current stage as complete and advance the six-stage pipeline. Call only after (a) the stage's artifact tools have been called and (b) the user explicitly confirmed moving on. The handoff summary must contain the key information the next stage's role needs.",
      schema: z.object({
        stage: z.enum(AiPromptStages),
        handoffSummary: z.string().describe("The structured handoff summary for the next stage."),
      }),
    },
  );

  return [
    recordFounderBrief,
    recordBlueprint,
    saveProductBacklog,
    saveRequirementSpec,
    createSprintPlan,
    recordProgress,
    completeStageTool,
  ];
}

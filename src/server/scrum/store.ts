import { prisma } from "../db";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { getCurrentUserId, getCurrentUserIdOrNull } from "../auth/current-user";
import { scorePriority } from "./priority";
import type {
  ArtifactProposalRequestSchema,
  CreateBacklogItemRequestSchema,
  CreateProjectRequestSchema,
  CreateSprintRequestSchema,
  RetroRecordRequestSchema,
  ReviewRecordRequestSchema,
  UpdateSprintItemRequestSchema,
} from "./schemas";

type CreateProjectInput = z.infer<typeof CreateProjectRequestSchema>;
type CreateBacklogItemInput = z.infer<typeof CreateBacklogItemRequestSchema>;
type CreateSprintInput = z.infer<typeof CreateSprintRequestSchema>;
type UpdateSprintItemInput = z.infer<typeof UpdateSprintItemRequestSchema>;
type ReviewInput = z.infer<typeof ReviewRecordRequestSchema>;
type RetroInput = z.infer<typeof RetroRecordRequestSchema>;
type ProposalInput = z.infer<typeof ArtifactProposalRequestSchema>;

export type BacklogItemRecord = {
  id: string;
  title: string;
  userStory: string;
  problem: string;
  acceptanceCriteria: string[];
  status: "Idea" | "Ready" | "Selected" | "Deferred" | "Done" | "Dropped";
  priorityBand: "P0" | "P1" | "P2" | "P3";
  priorityScore: number;
  priorityExplanation: string;
  effort: number;
  risk?: string;
  dependencies: string[];
  source: "Chat" | "Review" | "Retro" | "Manual" | "ImportedDoc" | "AiProposal";
  /** Fine-grained technical specification written by the Step 4 agent (markdown). */
  technicalSpec?: string;
  /** Ready-to-paste AI coding prompt (Cursor / Claude Code) written by the Step 4 agent. */
  codingPrompt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SprintItemRecord = {
  id: string;
  productBacklogItemId?: string;
  task: string;
  owner?: string;
  status: "Todo" | "InProgress" | "Blocked" | "Review" | "Done";
  initialEffort: number;
  remainingEffort: number;
  doneCondition: string;
  blocker?: string;
  targetDate?: string;
  evidenceLink?: string;
  createdAt: string;
  updatedAt: string;
};

export type SprintRecord = {
  id: string;
  sprintNumber: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: "Planned" | "Active" | "Review" | "Closed" | "Cancelled";
  workingDays: string[];
  items: SprintItemRecord[];
  increments: IncrementRecord[];
  burndownHistory: BurndownHistoryPoint[];
  createdAt: string;
  updatedAt: string;
};

export type IncrementRecord = {
  id: string;
  productBacklogItemId: string;
  sprintId: string;
  deliverable: string;
  acceptanceEvidence: string[];
  qaStatus: "Untested" | "Passed" | "Failed" | "Waived";
  demoNotes?: string;
  reviewDecision: "Accepted" | "NeedsFollowUp" | "Deferred";
  followUpItems: string[];
  createdAt: string;
  updatedAt: string;
};

type BurndownHistoryPoint = {
  date: string;
  actualRemaining: number;
  blockedCount: number;
  scopeChange: number;
};

export type ReviewRecord = ReviewInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type RetroRecord = RetroInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type ProposalRecord = ProposalInput & {
  id: string;
  status: "Pending" | "Applied" | "Rejected" | "Superseded";
  createdAt: string;
  updatedAt: string;
};

export type ProjectRecord = {
  id: string;
  title: string;
  action: string;
  purpose: string;
  timezone: string;
  context?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  backlog: BacklogItemRecord[];
  sprints: SprintRecord[];
  reviews: ReviewRecord[];
  retros: RetroRecord[];
  proposals: ProposalRecord[];
};

function dayKey(input = new Date()) {
  return input.toISOString().slice(0, 10);
}

function dateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const cursor = new Date(startDate);
  const end = new Date(endDate);
  while (cursor <= end) {
    dates.push(dayKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function mapBacklogItem(pbi: any): BacklogItemRecord {
  return {
    id: pbi.id,
    title: pbi.title,
    userStory: pbi.userStory,
    problem: pbi.problem,
    acceptanceCriteria: Array.isArray(pbi.acceptanceCriteria)
      ? pbi.acceptanceCriteria
      : typeof pbi.acceptanceCriteria === "string"
        ? JSON.parse(pbi.acceptanceCriteria)
        : [],
    status: pbi.status,
    priorityBand: pbi.priorityBand,
    priorityScore: pbi.priorityScore,
    priorityExplanation: pbi.priorityExplanation,
    effort: pbi.effort,
    risk: pbi.risk ?? undefined,
    dependencies: Array.isArray(pbi.dependencyJson)
      ? pbi.dependencyJson
      : typeof pbi.dependencyJson === "string"
        ? JSON.parse(pbi.dependencyJson)
        : [],
    source: pbi.source,
    technicalSpec: pbi.technicalSpec ?? undefined,
    codingPrompt: pbi.codingPrompt ?? undefined,
    createdAt: pbi.createdAt.toISOString(),
    updatedAt: pbi.updatedAt.toISOString(),
  };
}

function mapSprintItem(item: any): SprintItemRecord {
  return {
    id: item.id,
    productBacklogItemId: item.productBacklogItemId ?? undefined,
    task: item.task,
    owner: item.owner ?? undefined,
    status: item.status,
    initialEffort: item.initialEffort,
    remainingEffort: item.remainingEffort,
    doneCondition: item.doneCondition,
    blocker: item.blocker ?? undefined,
    targetDate: item.targetDate ? item.targetDate.toISOString() : undefined,
    evidenceLink: item.evidenceLink ?? undefined,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function mapIncrement(inc: any): IncrementRecord {
  return {
    id: inc.id,
    productBacklogItemId: inc.productBacklogItemId,
    sprintId: inc.sprintId,
    deliverable: inc.deliverable,
    acceptanceEvidence: Array.isArray(inc.acceptanceEvidence)
      ? inc.acceptanceEvidence
      : typeof inc.acceptanceEvidence === "string"
        ? JSON.parse(inc.acceptanceEvidence)
        : [],
    qaStatus: inc.qaStatus,
    demoNotes: inc.demoNotes ?? undefined,
    reviewDecision: inc.reviewDecision,
    followUpItems: Array.isArray(inc.followUpJson)
      ? inc.followUpJson
      : typeof inc.followUpJson === "string"
        ? JSON.parse(inc.followUpJson)
        : [],
    createdAt: inc.createdAt.toISOString(),
    updatedAt: inc.updatedAt.toISOString(),
  };
}

function mapSprint(spr: any, burndownPoints: any[]): SprintRecord {
  return {
    id: spr.id,
    sprintNumber: spr.sprintNumber,
    name: spr.name,
    goal: spr.goal,
    startDate: spr.startDate.toISOString(),
    endDate: spr.endDate.toISOString(),
    status: spr.status,
    workingDays: Array.isArray(spr.workingDaysJson)
      ? spr.workingDaysJson
      : typeof spr.workingDaysJson === "string"
        ? JSON.parse(spr.workingDaysJson)
        : [],
    items: (spr.items ?? []).map(mapSprintItem),
    increments: (spr.increments ?? []).map(mapIncrement),
    burndownHistory: (burndownPoints ?? []).map((pt: any) => ({
      date: pt.date.toISOString().slice(0, 10),
      actualRemaining: pt.actualRemaining,
      blockedCount: pt.blockedCount,
      scopeChange: pt.scopeChange,
    })),
    createdAt: spr.createdAt.toISOString(),
    updatedAt: spr.updatedAt.toISOString(),
  };
}

function mapReview(rev: any): ReviewRecord {
  return {
    id: rev.id,
    sprintId: rev.sprintId,
    demoOutcome: rev.demoOutcome,
    acceptedItems: Array.isArray(rev.acceptedItemsJson)
      ? rev.acceptedItemsJson
      : typeof rev.acceptedItemsJson === "string"
        ? JSON.parse(rev.acceptedItemsJson)
        : [],
    followUpItems: Array.isArray(rev.followUpItemsJson)
      ? rev.followUpItemsJson
      : typeof rev.followUpItemsJson === "string"
        ? JSON.parse(rev.followUpItemsJson)
        : [],
    stakeholderFeedback: rev.stakeholderFeedback ?? undefined,
    backlogChanges: Array.isArray(rev.backlogChangesJson)
      ? rev.backlogChangesJson
      : typeof rev.backlogChangesJson === "string"
        ? JSON.parse(rev.backlogChangesJson)
        : [],
    createdAt: rev.createdAt.toISOString(),
    updatedAt: rev.updatedAt.toISOString(),
  };
}

function mapRetro(ret: any): RetroRecord {
  return {
    id: ret.id,
    sprintId: ret.sprintId,
    whatWorked: Array.isArray(ret.whatWorked)
      ? ret.whatWorked
      : typeof ret.whatWorked === "string"
        ? JSON.parse(ret.whatWorked)
        : [],
    whatDidNotWork: Array.isArray(ret.whatDidNotWork)
      ? ret.whatDidNotWork
      : typeof ret.whatDidNotWork === "string"
        ? JSON.parse(ret.whatDidNotWork)
        : [],
    rootCause: ret.rootCause ?? undefined,
    experiment: ret.experiment ?? undefined,
    actionItems: Array.isArray(ret.actionItemsJson)
      ? ret.actionItemsJson
      : typeof ret.actionItemsJson === "string"
        ? JSON.parse(ret.actionItemsJson)
        : [],
    createdAt: ret.createdAt.toISOString(),
    updatedAt: ret.updatedAt.toISOString(),
  };
}

function mapProposal(prop: any): ProposalRecord {
  return {
    id: prop.id,
    type: prop.type,
    rationale: prop.rationale,
    payload: typeof prop.payloadJson === "string"
      ? JSON.parse(prop.payloadJson)
      : prop.payloadJson,
    status: prop.status,
    createdAt: prop.createdAt.toISOString(),
    updatedAt: prop.updatedAt.toISOString(),
  };
}

async function mapProject(proj: any): Promise<ProjectRecord> {
  const reviews = await prisma.sprintReview.findMany({
    where: { sprint: { projectId: proj.id } },
    orderBy: { createdAt: "desc" },
  });
  const retros = await prisma.sprintRetro.findMany({
    where: { sprint: { projectId: proj.id } },
    orderBy: { createdAt: "desc" },
  });

  const sprintsWithBurndown = await Promise.all(
    (proj.sprints ?? []).map(async (spr: any) => {
      const burndownPoints = await prisma.burndownPoint.findMany({
        where: { sprintId: spr.id },
        orderBy: { date: "asc" },
      });
      return mapSprint(spr, burndownPoints);
    })
  );

  return {
    id: proj.id,
    title: proj.title,
    action: proj.action,
    purpose: proj.purpose,
    timezone: proj.timezone,
    context: proj.contextJson
      ? typeof proj.contextJson === "string"
        ? JSON.parse(proj.contextJson)
        : proj.contextJson
      : undefined,
    createdAt: proj.createdAt.toISOString(),
    updatedAt: proj.updatedAt.toISOString(),
    backlog: (proj.backlogItems ?? []).map(mapBacklogItem),
    sprints: sprintsWithBurndown,
    reviews: reviews.map(mapReview),
    retros: retros.map(mapRetro),
    proposals: (proj.proposals ?? []).map(mapProposal),
  };
}

function scoreFromBacklogInput(input: CreateBacklogItemInput) {
  if (input.priority) {
    return {
      finalScore: input.priority.priorityScore,
      priorityBand: input.priority.priorityBand,
      explanation: input.priority.priorityExplanation,
    };
  }

  const scored = scorePriority({
    userValue: 4,
    businessValue: 4,
    urgency: input.risk ? 4 : 3,
    riskReduction: input.risk ? 4 : 3,
    dependencyUnlock: input.dependencies.length > 0 ? 4 : 3,
    confidence: input.acceptanceCriteria.length >= 2 ? 4 : 3,
    effort: input.effort,
  });

  return {
    finalScore: scored.finalScore,
    priorityBand: scored.priorityBand,
    explanation: `System scored ${scored.finalScore} from value, urgency, risk, dependency unlock, confidence, and effort.`,
  };
}

async function appendBurndownHistoryDb(sprintId: string, scopeChange = 0) {
  const sprint = await prisma.scrumSprint.findUnique({
    where: { id: sprintId },
    include: { items: true },
  });
  if (!sprint) return;

  const actualRemaining = sprint.items.reduce((sum: number, item: any) => sum + item.remainingEffort, 0);
  const blockedCount = sprint.items.filter((item: any) => item.status === "Blocked").length;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.burndownPoint.upsert({
    where: {
      sprintId_date: {
        sprintId,
        date: today,
      },
    },
    update: {
      actualRemaining,
      blockedCount,
      scopeChange: { increment: scopeChange },
    },
    create: {
      sprintId,
      date: today,
      actualRemaining,
      blockedCount,
      scopeChange,
      idealRemaining: 0,
    },
  });
}

export async function listProjects(): Promise<ProjectRecord[]> {
  // Read-only: never create a user here (keeps crawler traffic zero-write).
  const ownerId = await getCurrentUserIdOrNull();
  if (!ownerId) return [];
  const projects = await prisma.project.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
    include: {
      backlogItems: true,
      sprints: {
        include: {
          items: true,
          increments: true,
        },
      },
      proposals: true,
    },
  });
  return Promise.all(projects.map(mapProject));
}

export async function getProjectSnapshot(projectId: string): Promise<ProjectRecord> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      backlogItems: true,
      sprints: {
        include: {
          items: true,
          increments: true,
        },
      },
      proposals: true,
    },
  });
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  return mapProject(project);
}

export async function createProject(input: CreateProjectInput): Promise<ProjectRecord> {
  const ownerId = await getCurrentUserId();
  const project = await prisma.project.create({
    data: {
      title: input.title,
      action: input.action,
      purpose: input.purpose,
      timezone: input.timezone,
      contextJson: input.context ? (input.context as any) : undefined,
      ownerId,
    },
    include: {
      backlogItems: true,
      sprints: {
        include: {
          items: true,
          increments: true,
        },
      },
      proposals: true,
    },
  });
  return mapProject(project);
}

export async function listBacklog(projectId: string): Promise<BacklogItemRecord[]> {
  const items = await prisma.productBacklogItem.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
  return items.map(mapBacklogItem);
}

export async function createBacklogItem(projectId: string, input: CreateBacklogItemInput): Promise<BacklogItemRecord> {
  const priority = scoreFromBacklogInput(input);
  const item = await prisma.productBacklogItem.create({
    data: {
      projectId,
      title: input.title,
      userStory: input.userStory,
      problem: input.problem,
      acceptanceCriteria: input.acceptanceCriteria,
      status: input.status,
      priorityBand: priority.priorityBand,
      priorityScore: priority.finalScore,
      priorityExplanation: priority.explanation,
      effort: input.effort,
      risk: input.risk,
      dependencyJson: input.dependencies,
      source: input.source,
    },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });
  return mapBacklogItem(item);
}

export async function listSprints(projectId: string): Promise<SprintRecord[]> {
  const sprints = await prisma.scrumSprint.findMany({
    where: { projectId },
    orderBy: { sprintNumber: "desc" },
    include: {
      items: true,
      increments: true,
    },
  });
  return Promise.all(
    sprints.map(async (spr) => {
      const burndownPoints = await prisma.burndownPoint.findMany({
        where: { sprintId: spr.id },
        orderBy: { date: "asc" },
      });
      return mapSprint(spr, burndownPoints);
    })
  );
}

export async function createSprint(projectId: string, input: CreateSprintInput): Promise<SprintRecord> {
  let selectedIds = input.selectedBacklogItemIds;
  if (!selectedIds || selectedIds.length === 0) {
    const readyItems = await prisma.productBacklogItem.findMany({
      where: {
        projectId,
        status: { in: ["Ready", "Idea"] },
      },
      orderBy: { priorityScore: "desc" },
      take: 4,
    });
    selectedIds = readyItems.map((item) => item.id);
  }

  const selectedItems = await prisma.productBacklogItem.findMany({
    where: { id: { in: selectedIds } },
  });

  const sprint = await prisma.scrumSprint.create({
    data: {
      projectId,
      sprintNumber: input.sprintNumber,
      name: input.name,
      goal: input.goal,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      status: "Active",
      workingDaysJson: input.workingDays,
      items: {
        create: selectedItems.map((item) => ({
          productBacklogItemId: item.id,
          task: item.title,
          owner: "Unassigned",
          status: "Todo",
          initialEffort: item.effort,
          remainingEffort: item.effort,
          doneCondition: Array.isArray(item.acceptanceCriteria)
            ? item.acceptanceCriteria.join("; ")
            : typeof item.acceptanceCriteria === "string"
              ? item.acceptanceCriteria
              : "",
        })),
      },
    },
    include: {
      items: true,
      increments: true,
    },
  });

  await prisma.productBacklogItem.updateMany({
    where: { id: { in: selectedIds } },
    data: { status: "Selected", updatedAt: new Date() },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });

  await appendBurndownHistoryDb(sprint.id);

  const burndownPoints = await prisma.burndownPoint.findMany({
    where: { sprintId: sprint.id },
    orderBy: { date: "asc" },
  });

  return mapSprint(sprint, burndownPoints);
}

export async function updateSprintItem(projectId: string, sprintId: string, itemId: string, input: UpdateSprintItemInput) {
  const existingItem = await prisma.sprintBacklogItem.findUnique({
    where: { id: itemId },
  });
  if (!existingItem) throw new Error("SPRINT_ITEM_NOT_FOUND");

  const updateData: any = {};
  if (input.status !== undefined) updateData.status = input.status;
  if (input.remainingEffort !== undefined) updateData.remainingEffort = input.remainingEffort;
  if (input.blocker !== undefined) updateData.blocker = input.blocker;
  if (input.evidenceLink !== undefined) updateData.evidenceLink = input.evidenceLink;

  if (input.status === "Done") {
    updateData.remainingEffort = 0;
  }

  const updatedItem = await prisma.sprintBacklogItem.update({
    where: { id: itemId },
    data: updateData,
  });

  if (input.status === "Done" && existingItem.productBacklogItemId) {
    await prisma.productBacklogItem.update({
      where: { id: existingItem.productBacklogItemId },
      data: { status: "Done", updatedAt: new Date() },
    });

    const existingInc = await prisma.incrementEvidence.findFirst({
      where: { productBacklogItemId: existingItem.productBacklogItemId, sprintId },
    });

    if (!existingInc) {
      await prisma.incrementEvidence.create({
        data: {
          sprintId,
          productBacklogItemId: existingItem.productBacklogItemId,
          deliverable: updatedItem.task,
          acceptanceEvidence: [input.evidenceLink ?? "Marked done in Sprint Backlog"],
          qaStatus: "Passed",
          demoNotes: `Demo ${updatedItem.task}`,
          reviewDecision: "Accepted",
          followUpJson: [],
        },
      });
    }
  }

  await appendBurndownHistoryDb(sprintId);

  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });

  const sprint = await prisma.scrumSprint.findUnique({
    where: { id: sprintId },
    include: { items: true, increments: true },
  });
  if (!sprint) throw new Error("SPRINT_NOT_FOUND");

  const burndownPoints = await prisma.burndownPoint.findMany({
    where: { sprintId },
    orderBy: { date: "asc" },
  });

  return {
    sprint: mapSprint(sprint, burndownPoints),
    item: mapSprintItem(updatedItem),
  };
}

export async function getBurndown(projectId: string, sprintId: string) {
  const sprint = await prisma.scrumSprint.findUnique({
    where: { id: sprintId },
    include: { items: true },
  });
  if (!sprint) throw new Error("SPRINT_NOT_FOUND");

  const burndownPoints = await prisma.burndownPoint.findMany({
    where: { sprintId },
    orderBy: { date: "asc" },
  });

  const total = sprint.items.reduce((sum: number, item: any) => sum + item.initialEffort, 0);
  const dates = dateRange(sprint.startDate.toISOString(), sprint.endDate.toISOString());
  const denominator = Math.max(dates.length - 1, 1);

  const history = new Map(
    burndownPoints.map((point) => [
      point.date.toISOString().slice(0, 10),
      {
        actualRemaining: point.actualRemaining,
        blockedCount: point.blockedCount,
        scopeChange: point.scopeChange,
      },
    ])
  );

  let latestActual = total;
  let latestBlockedCount = 0;
  const today = dayKey();
  const futureDates = dates.filter((date) => date > today);
  const futureDenominator = Math.max(futureDates.length, 1);

  const points = dates.map((date, index) => {
    const historyPoint = history.get(date);
    if (historyPoint) {
      latestActual = historyPoint.actualRemaining;
      latestBlockedCount = historyPoint.blockedCount;
    }
    const isFuture = date > today && !historyPoint;
    const futureIndex = Math.max(futureDates.indexOf(date) + 1, 0);
    const projectedRemaining = isFuture
      ? Math.max(latestActual - (latestActual * futureIndex) / futureDenominator, 0)
      : latestActual;
    return {
      date,
      idealRemaining: Math.max(total - (total * index) / denominator, 0),
      actualRemaining: isFuture ? null : latestActual,
      projectedRemaining,
      scopeChange: historyPoint?.scopeChange ?? 0,
      blockedCount: historyPoint?.blockedCount ?? (isFuture ? latestBlockedCount : 0),
    };
  });

  if (!points.some((point) => point.date === today)) {
    const actualRemaining = sprint.items.reduce((sum: number, item: any) => sum + item.remainingEffort, 0);
    const blockedCount = sprint.items.filter((item: any) => item.status === "Blocked").length;
    points.push({
      date: today,
      idealRemaining: 0,
      actualRemaining,
      projectedRemaining: actualRemaining,
      scopeChange: 0,
      blockedCount,
    });
  }

  return {
    sprintId,
    totalCommitted: total,
    points,
  };
}

export async function listReviews(projectId: string): Promise<ReviewRecord[]> {
  const reviews = await prisma.sprintReview.findMany({
    where: { sprint: { projectId } },
    orderBy: { createdAt: "desc" },
  });
  return reviews.map(mapReview);
}

export async function createReview(projectId: string, input: ReviewInput): Promise<ReviewRecord> {
  const review = await prisma.sprintReview.create({
    data: {
      sprintId: input.sprintId,
      demoOutcome: input.demoOutcome,
      acceptedItemsJson: input.acceptedItems,
      followUpItemsJson: input.followUpItems,
      stakeholderFeedback: input.stakeholderFeedback,
      backlogChangesJson: input.backlogChanges,
    },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });
  return mapReview(review);
}

export async function listRetros(projectId: string): Promise<RetroRecord[]> {
  const retros = await prisma.sprintRetro.findMany({
    where: { sprint: { projectId } },
    orderBy: { createdAt: "desc" },
  });
  return retros.map(mapRetro);
}

export async function createRetro(projectId: string, input: RetroInput): Promise<RetroRecord> {
  const retro = await prisma.sprintRetro.create({
    data: {
      sprintId: input.sprintId,
      whatWorked: input.whatWorked,
      whatDidNotWork: input.whatDidNotWork,
      rootCause: input.rootCause,
      experiment: input.experiment,
      actionItemsJson: input.actionItems,
    },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });
  return mapRetro(retro);
}

export async function listProposals(projectId: string): Promise<ProposalRecord[]> {
  const proposals = await prisma.artifactProposal.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return proposals.map(mapProposal);
}

export async function createProposal(projectId: string, input: ProposalInput): Promise<ProposalRecord> {
  const proposal = await prisma.artifactProposal.create({
    data: {
      projectId,
      type: input.type,
      status: "Pending",
      payloadJson: input.payload as any,
      rationale: input.rationale,
    },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });
  return mapProposal(proposal);
}

export async function updateProjectContext(projectId: string, patch: Record<string, unknown>) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) throw new Error("PROJECT_NOT_FOUND");

  const currentContext = project.contextJson
    ? typeof project.contextJson === "string"
      ? JSON.parse(project.contextJson)
      : project.contextJson
    : {};

  const updatedContext = { ...currentContext, ...patch };

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      contextJson: updatedContext as any,
      updatedAt: new Date(),
    },
    include: {
      backlogItems: true,
      sprints: {
        include: {
          items: true,
          increments: true,
        },
      },
      proposals: true,
    },
  });

  return mapProject(updatedProject);
}

export async function updateBacklogItem(
  projectId: string,
  itemId: string,
  patch: Partial<
    Pick<
      BacklogItemRecord,
      | "title"
      | "userStory"
      | "problem"
      | "acceptanceCriteria"
      | "status"
      | "priorityBand"
      | "priorityScore"
      | "priorityExplanation"
      | "effort"
      | "risk"
      | "dependencies"
      | "technicalSpec"
      | "codingPrompt"
    >
  >
) {
  const existing = await prisma.productBacklogItem.findUnique({
    where: { id: itemId },
  });
  if (!existing) throw new Error("BACKLOG_ITEM_NOT_FOUND");

  const updateData: any = {};
  if (patch.title !== undefined) updateData.title = patch.title;
  if (patch.userStory !== undefined) updateData.userStory = patch.userStory;
  if (patch.problem !== undefined) updateData.problem = patch.problem;
  if (patch.acceptanceCriteria !== undefined) updateData.acceptanceCriteria = patch.acceptanceCriteria;
  if (patch.status !== undefined) updateData.status = patch.status;
  if (patch.priorityBand !== undefined) updateData.priorityBand = patch.priorityBand;
  if (patch.priorityScore !== undefined) updateData.priorityScore = patch.priorityScore;
  if (patch.priorityExplanation !== undefined) updateData.priorityExplanation = patch.priorityExplanation;
  if (patch.effort !== undefined) updateData.effort = patch.effort;
  if (patch.risk !== undefined) updateData.risk = patch.risk;
  if (patch.dependencies !== undefined) updateData.dependencyJson = patch.dependencies;
  if (patch.technicalSpec !== undefined) updateData.technicalSpec = patch.technicalSpec;
  if (patch.codingPrompt !== undefined) updateData.codingPrompt = patch.codingPrompt;

  const updated = await prisma.productBacklogItem.update({
    where: { id: itemId },
    data: updateData,
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { updatedAt: new Date() },
  });

  return mapBacklogItem(updated);
}

export function draftBacklogFromPrompt(prompt: string) {
  const normalized = prompt.trim() || "Build a Scrum-ready SaaS product";
  const isSaas = /saas|api|real|software|platform|product manager|scrum|真实|软件|平台|铲平经理/i.test(normalized);
  const items = [
    {
      title: "Create a persistent SaaS workspace",
      userStory:
        "As a product owner, I want each team to have an independent workspace so Scrum artifacts survive refreshes and stay attached to a real project.",
      problem: "A demo-only page loses project state and cannot support continuous team delivery.",
      acceptanceCriteria: [
        "A project can be created through the API",
        "Project data is persisted server-side",
        "The workspace reloads after a page refresh",
      ],
      status: "Ready" as const,
      effort: 3,
      risk: "Production rollout must define user, team, and project data boundaries.",
      dependencies: [],
      source: "AiProposal" as const,
    },
    {
      title: "Generate Product Backlog from AI chat",
      userStory:
        "As a Scrum team, I want AI conversation output to become backlog items so planning can move from chat into execution.",
      problem: "Pure chat planning cannot be handed to developers as an actionable artifact.",
      acceptanceCriteria: [
        "AI returns a structured backlog proposal",
        "Users can confirm and apply generated items",
        "Each item includes acceptance criteria and priority inputs",
      ],
      status: "Ready" as const,
      effort: 5,
      risk: "AI proposals must be user-confirmed before they mutate project data.",
      dependencies: ["Create a persistent SaaS workspace"],
      source: "AiProposal" as const,
    },
    {
      title: "Create Sprint Backlog and Burndown",
      userStory:
        "As a Scrum Master, I want selected backlog items to become a sprint and drive a burndown chart for sprint health.",
      problem: "A Product Backlog alone does not show team commitment or actual progress.",
      acceptanceCriteria: [
        "A sprint can be created from backlog items",
        "Sprint tasks track remaining effort",
        "Task status changes update burndown automatically",
      ],
      status: "Ready" as const,
      effort: 5,
      risk: "Burndown must be based on real task state, not fake progress.",
      dependencies: ["Generate Product Backlog from AI chat"],
      source: "AiProposal" as const,
    },
    {
      title: "Record Sprint Review and Retro",
      userStory:
        "As a team lead, I want sprint review and retro records so delivery outcomes and process learning feed the next backlog decision.",
      problem: "If sprint results do not become artifacts, the team loses review learning.",
      acceptanceCriteria: [
        "Review records accepted and follow-up items",
        "Retro records action items",
        "Review and retro records persist through API",
      ],
      status: "Ready" as const,
      effort: 3,
      risk: "Follow-up items need a closed loop into the next backlog cycle.",
      dependencies: ["Create Sprint Backlog and Burndown"],
      source: "AiProposal" as const,
    },
  ];

  if (isSaas) return items;
  return items.slice(0, 3);
}

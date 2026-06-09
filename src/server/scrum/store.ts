import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
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

type StoreData = {
  projects: ProjectRecord[];
};

const storePath = path.join(process.cwd(), ".data", "scrum-store.json");

async function readStore(): Promise<StoreData> {
  try {
    const raw = await readFile(storePath, "utf8");
    return JSON.parse(raw) as StoreData;
  } catch {
    return { projects: [] };
  }
}

async function writeStore(data: StoreData) {
  await mkdir(path.dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

function now() {
  return new Date().toISOString();
}

function dayKey(input = new Date()) {
  return input.toISOString().slice(0, 10);
}

function getProject(data: StoreData, projectId: string) {
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }
  return project;
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

function sprintRemaining(sprint: SprintRecord) {
  return sprint.items.reduce((sum, item) => sum + item.remainingEffort, 0);
}

function sprintBlockedCount(sprint: SprintRecord) {
  return sprint.items.filter((item) => item.status === "Blocked").length;
}

function appendBurndownHistory(sprint: SprintRecord, scopeChange = 0) {
  const point = {
    date: dayKey(),
    actualRemaining: sprintRemaining(sprint),
    blockedCount: sprintBlockedCount(sprint),
    scopeChange,
  };
  const existingIndex = sprint.burndownHistory.findIndex((item) => item.date === point.date);
  if (existingIndex >= 0) {
    sprint.burndownHistory[existingIndex] = point;
  } else {
    sprint.burndownHistory.push(point);
  }
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

export async function listProjects() {
  const data = await readStore();
  return data.projects;
}

export async function getProjectSnapshot(projectId: string) {
  const data = await readStore();
  return getProject(data, projectId);
}

export async function createProject(input: CreateProjectInput) {
  const data = await readStore();
  const timestamp = now();
  const project: ProjectRecord = {
    id: `proj_${randomUUID()}`,
    title: input.title,
    action: input.action,
    purpose: input.purpose,
    timezone: input.timezone,
    context: input.context,
    createdAt: timestamp,
    updatedAt: timestamp,
    backlog: [],
    sprints: [],
    reviews: [],
    retros: [],
    proposals: [],
  };
  data.projects.unshift(project);
  await writeStore(data);
  return project;
}

export async function listBacklog(projectId: string) {
  const data = await readStore();
  return getProject(data, projectId).backlog;
}

export async function createBacklogItem(projectId: string, input: CreateBacklogItemInput) {
  const data = await readStore();
  const project = getProject(data, projectId);
  const priority = scoreFromBacklogInput(input);
  const timestamp = now();
  const item: BacklogItemRecord = {
    id: `pbi_${randomUUID()}`,
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
    dependencies: input.dependencies,
    source: input.source,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  project.backlog.push(item);
  project.updatedAt = timestamp;
  await writeStore(data);
  return item;
}

export async function listSprints(projectId: string) {
  const data = await readStore();
  return getProject(data, projectId).sprints;
}

export async function createSprint(projectId: string, input: CreateSprintInput) {
  const data = await readStore();
  const project = getProject(data, projectId);
  const timestamp = now();
  const selectedIds =
    input.selectedBacklogItemIds.length > 0
      ? input.selectedBacklogItemIds
      : project.backlog
          .filter((item) => item.status === "Ready" || item.status === "Idea")
          .sort((a, b) => b.priorityScore - a.priorityScore)
          .slice(0, 4)
          .map((item) => item.id);
  const selectedItems = project.backlog.filter((item) => selectedIds.includes(item.id));
  const sprint: SprintRecord = {
    id: `spr_${randomUUID()}`,
    sprintNumber: input.sprintNumber,
    name: input.name,
    goal: input.goal,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "Active",
    workingDays: input.workingDays,
    items: selectedItems.map((item) => ({
      id: `task_${randomUUID()}`,
      productBacklogItemId: item.id,
      task: item.title,
      owner: "Unassigned",
      status: "Todo",
      initialEffort: item.effort,
      remainingEffort: item.effort,
      doneCondition: item.acceptanceCriteria.join("; "),
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    increments: [],
    burndownHistory: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  for (const item of selectedItems) {
    item.status = "Selected";
    item.updatedAt = timestamp;
  }
  appendBurndownHistory(sprint);
  project.sprints.unshift(sprint);
  project.updatedAt = timestamp;
  await writeStore(data);
  return sprint;
}

export async function updateSprintItem(projectId: string, sprintId: string, itemId: string, input: UpdateSprintItemInput) {
  const data = await readStore();
  const project = getProject(data, projectId);
  const sprint = project.sprints.find((item) => item.id === sprintId);
  if (!sprint) throw new Error("SPRINT_NOT_FOUND");
  const item = sprint.items.find((task) => task.id === itemId);
  if (!item) throw new Error("SPRINT_ITEM_NOT_FOUND");
  const timestamp = now();

  item.status = input.status ?? item.status;
  item.remainingEffort = input.remainingEffort ?? item.remainingEffort;
  item.blocker = input.blocker ?? item.blocker;
  item.evidenceLink = input.evidenceLink ?? item.evidenceLink;

  if (item.status === "Done") {
    item.remainingEffort = 0;
    const backlogItem = item.productBacklogItemId
      ? project.backlog.find((candidate) => candidate.id === item.productBacklogItemId)
      : undefined;
    if (backlogItem) {
      backlogItem.status = "Done";
      backlogItem.updatedAt = timestamp;
    }
    const existingIncrement = sprint.increments.find((increment) => increment.productBacklogItemId === item.productBacklogItemId);
    if (!existingIncrement && item.productBacklogItemId) {
      sprint.increments.push({
        id: `inc_${randomUUID()}`,
        productBacklogItemId: item.productBacklogItemId,
        sprintId,
        deliverable: item.task,
        acceptanceEvidence: [input.evidenceLink ?? "Marked done in Sprint Backlog"],
        qaStatus: "Passed",
        demoNotes: `Demo ${item.task}`,
        reviewDecision: "Accepted",
        followUpItems: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }

  item.updatedAt = timestamp;
  sprint.updatedAt = timestamp;
  project.updatedAt = timestamp;
  appendBurndownHistory(sprint);
  await writeStore(data);
  return { sprint, item };
}

export async function getBurndown(projectId: string, sprintId: string) {
  const data = await readStore();
  const project = getProject(data, projectId);
  const sprint = project.sprints.find((item) => item.id === sprintId);
  if (!sprint) throw new Error("SPRINT_NOT_FOUND");

  const total = sprint.items.reduce((sum, item) => sum + item.initialEffort, 0);
  const dates = dateRange(sprint.startDate, sprint.endDate);
  const denominator = Math.max(dates.length - 1, 1);
  const history = new Map(sprint.burndownHistory.map((point) => [point.date, point]));
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
    points.push({
      date: today,
      idealRemaining: 0,
      actualRemaining: sprintRemaining(sprint),
      projectedRemaining: sprintRemaining(sprint),
      scopeChange: 0,
      blockedCount: sprintBlockedCount(sprint),
    });
  }

  return {
    sprintId,
    totalCommitted: total,
    points,
  };
}

export async function listReviews(projectId: string) {
  const data = await readStore();
  return getProject(data, projectId).reviews;
}

export async function createReview(projectId: string, input: ReviewInput) {
  const data = await readStore();
  const project = getProject(data, projectId);
  const timestamp = now();
  const review = { ...input, id: `rev_${randomUUID()}`, createdAt: timestamp, updatedAt: timestamp };
  project.reviews.unshift(review);
  project.updatedAt = timestamp;
  await writeStore(data);
  return review;
}

export async function listRetros(projectId: string) {
  const data = await readStore();
  return getProject(data, projectId).retros;
}

export async function createRetro(projectId: string, input: RetroInput) {
  const data = await readStore();
  const project = getProject(data, projectId);
  const timestamp = now();
  const retro = { ...input, id: `retro_${randomUUID()}`, createdAt: timestamp, updatedAt: timestamp };
  project.retros.unshift(retro);
  project.updatedAt = timestamp;
  await writeStore(data);
  return retro;
}

export async function listProposals(projectId: string) {
  const data = await readStore();
  return getProject(data, projectId).proposals;
}

export async function createProposal(projectId: string, input: ProposalInput) {
  const data = await readStore();
  const project = getProject(data, projectId);
  const timestamp = now();
  const proposal: ProposalRecord = {
    ...input,
    id: `prop_${randomUUID()}`,
    status: "Pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  project.proposals.unshift(proposal);
  project.updatedAt = timestamp;
  await writeStore(data);
  return proposal;
}

export function draftBacklogFromPrompt(prompt: string) {
  const normalized = prompt.trim() || "Build a Scrum-ready SaaS product";
  const isSaas = /saas|api|real|software|platform|product manager|scrum|真实|软件|平台|铲平经理/i.test(normalized);
  const items = [
    {
      title: "Create a persistent SaaS workspace",
      userStory: "As a product owner, I want each team to have an independent workspace so Scrum artifacts survive refreshes and stay attached to a real project.",
      problem: "A demo-only page loses project state and cannot support continuous team delivery.",
      acceptanceCriteria: ["A project can be created through the API", "Project data is persisted server-side", "The workspace reloads after a page refresh"],
      status: "Ready" as const,
      effort: 3,
      risk: "Production rollout must define user, team, and project data boundaries.",
      dependencies: [],
      source: "AiProposal" as const,
    },
    {
      title: "Generate Product Backlog from AI chat",
      userStory: "As a Scrum team, I want AI conversation output to become backlog items so planning can move from chat into execution.",
      problem: "Pure chat planning cannot be handed to developers as an actionable artifact.",
      acceptanceCriteria: ["AI returns a structured backlog proposal", "Users can confirm and apply generated items", "Each item includes acceptance criteria and priority inputs"],
      status: "Ready" as const,
      effort: 5,
      risk: "AI proposals must be user-confirmed before they mutate project data.",
      dependencies: ["Create a persistent SaaS workspace"],
      source: "AiProposal" as const,
    },
    {
      title: "Create Sprint Backlog and Burndown",
      userStory: "As a Scrum Master, I want selected backlog items to become a sprint and drive a burndown chart for sprint health.",
      problem: "A Product Backlog alone does not show team commitment or actual progress.",
      acceptanceCriteria: ["A sprint can be created from backlog items", "Sprint tasks track remaining effort", "Task status changes update burndown automatically"],
      status: "Ready" as const,
      effort: 5,
      risk: "Burndown must be based on real task state, not fake progress.",
      dependencies: ["Generate Product Backlog from AI chat"],
      source: "AiProposal" as const,
    },
    {
      title: "Record Sprint Review and Retro",
      userStory: "As a team lead, I want sprint review and retro records so delivery outcomes and process learning feed the next backlog decision.",
      problem: "If sprint results do not become artifacts, the team loses review learning.",
      acceptanceCriteria: ["Review records accepted and follow-up items", "Retro records action items", "Review and retro records persist through API"],
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

import { prisma } from "../db";
import { AiPromptStages, type AiPromptStage } from "./stage-prompts";

/**
 * Persistent state for the six-stage product agent.
 * One session per project; stored in database so the conversation and the
 * stage machine survive restarts and work correctly in serverless envs.
 */

export type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
  stage: AiPromptStage;
  at: string;
};

export type AgentSession = {
  projectId: string;
  stage: AiPromptStage;
  completedStages: AiPromptStage[];
  /** Handoff summary produced when leaving each stage. */
  handoffs: Partial<Record<AiPromptStage, string>>;
  messages: AgentChatMessage[];
  createdAt: string;
  updatedAt: string;
};

function mapSession(dbSession: any): AgentSession {
  return {
    projectId: dbSession.projectId,
    stage: dbSession.stage as AiPromptStage,
    completedStages: Array.isArray(dbSession.completedStages)
      ? dbSession.completedStages
      : typeof dbSession.completedStages === "string"
        ? JSON.parse(dbSession.completedStages)
        : [],
    handoffs: typeof dbSession.handoffsJson === "string"
      ? JSON.parse(dbSession.handoffsJson)
      : dbSession.handoffsJson || {},
    messages: typeof dbSession.messagesJson === "string"
      ? JSON.parse(dbSession.messagesJson)
      : dbSession.messagesJson || [],
    createdAt: dbSession.createdAt.toISOString(),
    updatedAt: dbSession.updatedAt.toISOString(),
  };
}

export async function getAgentSession(projectId: string): Promise<AgentSession> {
  const dbSession = await prisma.agentSession.findUnique({
    where: { projectId },
  });
  if (dbSession) return mapSession(dbSession);

  const timestamp = new Date().toISOString();
  return {
    projectId,
    stage: "step1",
    completedStages: [],
    handoffs: {},
    messages: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function saveAgentSession(session: AgentSession) {
  const dbSession = await prisma.agentSession.upsert({
    where: { projectId: session.projectId },
    update: {
      stage: session.stage,
      completedStages: session.completedStages,
      handoffsJson: session.handoffs as any,
      messagesJson: session.messages as any,
      updatedAt: new Date(),
    },
    create: {
      projectId: session.projectId,
      stage: session.stage,
      completedStages: session.completedStages,
      handoffsJson: session.handoffs as any,
      messagesJson: session.messages as any,
    },
  });
  return mapSession(dbSession);
}

export async function resetAgentSession(projectId: string) {
  await prisma.agentSession.deleteMany({
    where: { projectId },
  });
}

export function nextStage(stage: AiPromptStage): AiPromptStage {
  const index = AiPromptStages.indexOf(stage);
  return AiPromptStages[Math.min(index + 1, AiPromptStages.length - 1)];
}

export function completeStage(session: AgentSession, stage: AiPromptStage, handoffSummary: string) {
  if (!session.completedStages.includes(stage)) {
    session.completedStages.push(stage);
  }
  session.handoffs[stage] = handoffSummary;
  if (session.stage === stage) {
    session.stage = nextStage(stage);
  }
  return session;
}

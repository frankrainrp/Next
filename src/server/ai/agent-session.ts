import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AiPromptStages, type AiPromptStage } from "./stage-prompts";

/**
 * Persistent state for the six-stage product agent.
 * One session per project; survives reloads so the conversation and the
 * stage machine continue where they left off.
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

type SessionFile = {
  sessions: AgentSession[];
};

const sessionPath = path.join(process.cwd(), ".data", "agent-sessions.json");

async function readSessions(): Promise<SessionFile> {
  try {
    const raw = await readFile(sessionPath, "utf8");
    return JSON.parse(raw) as SessionFile;
  } catch {
    return { sessions: [] };
  }
}

async function writeSessions(data: SessionFile) {
  await mkdir(path.dirname(sessionPath), { recursive: true });
  await writeFile(sessionPath, JSON.stringify(data, null, 2), "utf8");
}

function now() {
  return new Date().toISOString();
}

export async function getAgentSession(projectId: string): Promise<AgentSession> {
  const data = await readSessions();
  const existing = data.sessions.find((session) => session.projectId === projectId);
  if (existing) return existing;
  const timestamp = now();
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
  const data = await readSessions();
  const index = data.sessions.findIndex((candidate) => candidate.projectId === session.projectId);
  session.updatedAt = now();
  if (index >= 0) {
    data.sessions[index] = session;
  } else {
    data.sessions.push(session);
  }
  await writeSessions(data);
  return session;
}

export async function resetAgentSession(projectId: string) {
  const data = await readSessions();
  data.sessions = data.sessions.filter((session) => session.projectId !== projectId);
  await writeSessions(data);
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

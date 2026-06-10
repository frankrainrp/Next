import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { getProjectSnapshot } from "@/server/scrum/store";
import { buildArtifactTools } from "./agent-tools";
import { getAgentSession, saveAgentSession, type AgentSession } from "./agent-session";
import { loadSearchTools } from "./exa-search";
import { createAgentModel, type ModelChannel } from "./lc-models";
import { loadStagePrompt, stagePromptConfig, type AiPromptStage } from "./stage-prompts";

/**
 * The six-stage product agent.
 *
 * One LangChain ReAct agent per request, with:
 * - the current stage's role prompt (English, from prompt/en/)
 * - the stage pipeline contract (handoffs, confirmation gating)
 * - a live snapshot of the project's Scrum artifacts
 * - Exa web search (MCP) + artifact-writing tools
 */

const HISTORY_WINDOW = 24;

const PIPELINE_CONTRACT = `
# Product Agent Pipeline Contract

You are one role inside a six-stage AI product manager for SOLO SAAS BUILDERS — people who can
vibe-code with AI tools but whose product planning is weak. Your mission across the pipeline:
turn a vague SaaS idea into a blueprint that is buildable, deliverable, trackable, and sellable.

The chain: Idea → Customer → Problem → Use Case → MVP → Feature → Data → Page → Task →
Coding Prompt → Delivery → Metrics → Iteration, spread over six stages:
Step 1 Idea Intake & Founder Fit → Step 2 Customer, Problem & Positioning →
Step 3 MVP Scope & Feature Architecture → Step 4 Build Blueprint →
Step 5 Development Roadmap → Step 6 Delivery, Tracking & Iteration.

The user talks to you in a chat workspace that also shows three boards generated from your tools:
Product Backlog (Step 3 output), Scrum Backlog (Step 4 specs + AI coding prompts),
Sprint Backlog + Burndown (Step 5/6).

Hard rules:
1. Stay in the role and scope of the CURRENT stage only. Do not perform later stages' work early.
2. Never fabricate information. For external facts (rules, winners, comparable products):
   - If a web search tool is available, use it and cite source URLs.
   - If NO search tool is available, you may use your own training knowledge for well-known, stable
     facts, but you MUST label it as "from model knowledge, unverified — please double-check" and
     prefer asking the user to paste official links/rules for anything decision-critical or recent.
3. Mutating tools (record_*, save_*, create_*) may be called ONLY after the user explicitly confirms
   the proposal in conversation (✅-style confirmation). Propose first, confirm, then write.
4. When the user confirms stage completion: first call the stage's artifact tool(s), then call
   complete_stage with a thorough handoff summary, then announce the next stage with its banner.
5. Respond in the language the user writes in (Chinese in, Chinese out; English in, English out).
   Artifact tool payloads (titles, user stories, specs) must always be written in English.
6. Keep responses structured and skimmable: tables for comparisons, short numbered question lists
   (2-3 questions per round), explicit ✅/❌/📝 confirmation options when you need a decision.
`;

function formatSnapshot(projectId: string, snapshot: Awaited<ReturnType<typeof getProjectSnapshot>>) {
  const backlogLines = snapshot.backlog
    .map(
      (item) =>
        `- ${item.id} [${item.priorityBand}] ${item.title} (status: ${item.status}, effort: ${item.effort}h${item.technicalSpec ? ", has spec" : ""})`,
    )
    .join("\n");
  const sprint = snapshot.sprints.find((candidate) => candidate.status === "Active") ?? snapshot.sprints[0];
  const sprintLines = sprint
    ? sprint.items
        .map((item) => `- ${item.id} ${item.task} (status: ${item.status}, remaining: ${item.remainingEffort}h/${item.initialEffort}h)`)
        .join("\n")
    : "(no sprint yet)";

  return [
    `# Live Project Snapshot`,
    `Project: ${snapshot.title} (id: ${projectId})`,
    `Action: ${snapshot.action}`,
    `Purpose: ${snapshot.purpose}`,
    snapshot.context ? `Context artifacts: ${JSON.stringify(snapshot.context).slice(0, 4000)}` : "Context artifacts: (none yet)",
    ``,
    `## Product/Scrum Backlog (${snapshot.backlog.length} items)`,
    backlogLines || "(empty)",
    ``,
    `## Sprint ${sprint ? `${sprint.name} (id: ${sprint.id}, ${sprint.startDate} → ${sprint.endDate})` : ""}`,
    sprintLines,
  ].join("\n");
}

function formatHandoffs(session: AgentSession) {
  const entries = Object.entries(session.handoffs);
  if (entries.length === 0) return "(first stage — no handoffs yet)";
  return entries.map(([stage, summary]) => `## Handoff from ${stage}\n${summary}`).join("\n\n");
}

export type AgentTurnResult = {
  reply: string;
  session: AgentSession;
};

export async function runSixStageAgent({
  projectId,
  userMessage,
  modelChannel = "deepseek",
  stageOverride,
  customApiKey,
}: {
  projectId: string;
  userMessage: string;
  modelChannel?: ModelChannel;
  stageOverride?: AiPromptStage;
  customApiKey?: string;
}): Promise<AgentTurnResult> {
  const session = await getAgentSession(projectId);
  if (stageOverride) session.stage = stageOverride;
  const stage = session.stage;

  const [stagePrompt, snapshot, searchTools] = await Promise.all([
    loadStagePrompt(stage),
    getProjectSnapshot(projectId),
    loadSearchTools(),
  ]);

  const systemPrompt = [
    PIPELINE_CONTRACT,
    `# Current Stage: ${stagePromptConfig[stage].label}`,
    stagePrompt,
    `# Handoff Context`,
    formatHandoffs(session),
    formatSnapshot(projectId, snapshot),
    `Today's date: ${new Date().toISOString().slice(0, 10)}`,
  ].join("\n\n---\n\n");

  const agent = createReactAgent({
    llm: createAgentModel(modelChannel, customApiKey),
    tools: [...searchTools, ...buildArtifactTools(projectId, session)],
  });

  const history = session.messages.slice(-HISTORY_WINDOW).map((message) =>
    message.role === "user" ? new HumanMessage(message.content) : new AIMessage(message.content),
  );

  const result = await agent.invoke(
    {
      messages: [new SystemMessage(systemPrompt), ...history, new HumanMessage(userMessage)],
    },
    { recursionLimit: 40 },
  );

  const lastMessage = result.messages[result.messages.length - 1];
  const reply =
    typeof lastMessage?.content === "string"
      ? lastMessage.content
      : Array.isArray(lastMessage?.content)
        ? lastMessage.content
            .map((part) => (typeof part === "string" ? part : "text" in part ? part.text : ""))
            .join("")
        : "";

  const timestamp = new Date().toISOString();
  session.messages.push({ role: "user", content: userMessage, stage, at: timestamp });
  session.messages.push({ role: "assistant", content: reply, stage: session.stage, at: timestamp });
  await saveAgentSession(session);

  return { reply, session };
}

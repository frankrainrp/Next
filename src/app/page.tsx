"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  Check,
  Clock3,
  Download,
  FileText,
  Flame,
  History,
  ListChecks,
  Loader2,
  MessageSquareText,
  Palette,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Send,
  Settings2,
  Table2,
  Wrench,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
type PriorityBand = "P0" | "P1" | "P2" | "P3";
type BacklogStatus = "Idea" | "Ready" | "Selected" | "Deferred" | "Done" | "Dropped";
type SprintItemStatus = "Todo" | "InProgress" | "Blocked" | "Review" | "Done";
type WorkspaceView = "chat" | "backlogs" | "scrum";
type ThemeName = "liquid" | "sketch";
type PromptStage = "step1" | "step2" | "step3" | "step4" | "step5" | "step6";

type Project = {
  id: string;
  title: string;
  action: string;
  purpose: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

type BacklogItem = {
  id: string;
  title: string;
  userStory: string;
  problem: string;
  acceptanceCriteria: string[];
  status: BacklogStatus;
  priorityBand: PriorityBand;
  priorityScore: number;
  priorityExplanation: string;
  effort: number;
  risk?: string;
  dependencies: string[];
  source: "Chat" | "Review" | "Retro" | "Manual" | "ImportedDoc" | "AiProposal";
  technicalSpec?: string;
  codingPrompt?: string;
};

type SprintItem = {
  id: string;
  productBacklogItemId?: string;
  task: string;
  owner?: string;
  status: SprintItemStatus;
  initialEffort: number;
  remainingEffort: number;
  doneCondition: string;
  blocker?: string;
  evidenceLink?: string;
};

type Increment = {
  id: string;
  productBacklogItemId: string;
  sprintId: string;
  deliverable: string;
  acceptanceEvidence: string[];
  qaStatus: "Untested" | "Passed" | "Failed" | "Waived";
  demoNotes?: string;
  reviewDecision: "Accepted" | "NeedsFollowUp" | "Deferred";
};

type Sprint = {
  id: string;
  sprintNumber: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: "Planned" | "Active" | "Review" | "Closed" | "Cancelled";
  items: SprintItem[];
  increments: Increment[];
};

type BurndownPoint = {
  date: string;
  idealRemaining: number;
  actualRemaining: number | null;
  projectedRemaining?: number;
  scopeChange: number;
  blockedCount: number;
};

type Burndown = {
  sprintId: string;
  totalCommitted: number;
  points: BurndownPoint[];
};

type ReviewRecord = {
  id: string;
  sprintId: string;
  demoOutcome: string;
  acceptedItems: string[];
  followUpItems: string[];
  stakeholderFeedback?: string;
  backlogChanges: string[];
};

type RetroRecord = {
  id: string;
  sprintId: string;
  whatWorked: string[];
  whatDidNotWork: string[];
  rootCause?: string;
  experiment?: string;
  actionItems: string[];
};

type BacklogDraft = Omit<BacklogItem, "id" | "priorityBand" | "priorityScore" | "priorityExplanation">;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type AgentPreset = "scrum-dev-agent" | "frontend-ui-agent" | "backend-api-agent" | "qa-review-agent" | "custom";

type BacklogTechnicalDoc = {
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

type MarkdownExportResponse = {
  ok: true;
  projectId: string;
  filename: string;
  mimeType: string;
  content: string;
};

type AgentSessionState = {
  stage: PromptStage;
  completedStages: PromptStage[];
};

type AgentChatResponse = {
  ok: true;
  reply: string;
  session: AgentSessionState;
};

type AgentSessionResponse = {
  ok: true;
  session: AgentSessionState & {
    messages: Array<{ role: "user" | "assistant"; content: string; at: string }>;
  };
};

const defaultCustomAgentPrompt =
  "You are the AI agent taking over this project. Read the exported Markdown first, confirm Scrum artifacts, acceptance criteria, technical requirements, burndown state, risks, API contracts, persistence, permissions, and tests before implementation.";

const defaultPrompt =
  "";

const promptPlaceholder =
  "Tell me what you want to build — even one vague sentence is enough to start.";

const agentStageMeta: Array<{ value: PromptStage; label: string; role: string }> = [
  { value: "step1", label: "1 · Intake", role: "Startup Intake Coach for Solo SaaS Builders" },
  { value: "step2", label: "2 · Customer", role: "SaaS Market & User Research Strategist" },
  { value: "step3", label: "3 · MVP Scope", role: "Product Architect for Micro-SaaS" },
  { value: "step4", label: "4 · Blueprint", role: "Technical Blueprint Architect for Vibe Coding" },
  { value: "step5", label: "5 · Roadmap", role: "Delivery Planner for Solo Builders" },
  { value: "step6", label: "6 · Track", role: "Delivery Coach & Growth Tracker" },
];

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-0",
    role: "assistant",
    content:
      "Hi — I'm your AI product manager for solo SaaS builders. Tell me your SaaS idea in one sentence (vague is fine). Together we'll nail down who it's for, what pain it solves, the smallest MVP worth building, a full build blueprint with ready-to-paste AI coding prompts, a realistic roadmap — and then track the build all the way to launch.",
  },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let body: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      body = await response.json();
    } catch (e) {
      // Ignore JSON parse error on non-compliant content
    }
  }
  if (!response.ok) {
    throw new Error(body?.message ?? body?.error ?? `Request failed: ${response.status}`);
  }
  return body as T;
}

function today(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function splitLines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function priorityClass(band: PriorityBand) {
  if (band === "P0") return "priority-chip priority-p0";
  if (band === "P1") return "priority-chip priority-p1";
  if (band === "P2") return "priority-chip priority-p2";
  return "priority-chip priority-p3";
}

/** MoSCoW maps 1:1 onto priority bands: P0 Must (red), P1 Should (orange), P2 Could (blue), P3 Won't (black). */
function moscowLabel(band: PriorityBand) {
  if (band === "P0") return "Must";
  if (band === "P1") return "Should";
  if (band === "P2") return "Could";
  return "Won't";
}

export default function Home() {
  const [view, setView] = useState<WorkspaceView>("chat");
  const [theme, setTheme] = useState<ThemeName>("liquid");
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState("");
  const [backlog, setBacklog] = useState<BacklogItem[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [retros, setRetros] = useState<RetroRecord[]>([]);
  const [burndown, setBurndown] = useState<Burndown | null>(null);
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [agentSession, setAgentSession] = useState<AgentSessionState>({ stage: "step1", completedStages: [] });
  const [draft, setDraft] = useState<BacklogDraft[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [selectedBacklogItem, setSelectedBacklogItem] = useState<BacklogItem | null>(null);
  const [technicalDoc, setTechnicalDoc] = useState<BacklogTechnicalDoc | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deepSeekApiKey, setDeepSeekApiKey] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState<AgentPreset>("scrum-dev-agent");
  const [customAgentPrompt, setCustomAgentPrompt] = useState(defaultCustomAgentPrompt);
  const [exportBusy, setExportBusy] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [retroText, setRetroText] = useState("");

  const activeProject = projects.find((project) => project.id === projectId);
  const activeSprint = sprints[0];

  const sortedBacklog = useMemo(
    () => [...backlog].sort((a, b) => b.priorityScore - a.priorityScore),
    [backlog],
  );

  const readyForSprint = useMemo(
    () =>
      sortedBacklog.filter(
        (item) => item.status === "Ready" || item.status === "Idea" || item.status === "Selected",
      ),
    [sortedBacklog],
  );

  const totalRemaining = useMemo(
    () => activeSprint?.items.reduce((sum, item) => sum + item.remainingEffort, 0) ?? 0,
    [activeSprint],
  );

  const loadProjectData = useCallback(async (nextProjectId: string) => {
    if (!nextProjectId) {
      setBacklog([]);
      setSprints([]);
      setReviews([]);
      setRetros([]);
      setBurndown(null);
      setAgentSession({ stage: "step1", completedStages: [] });
      setChatMessages(initialMessages);
      return;
    }
    const [backlogRes, sprintRes, reviewRes, retroRes, sessionRes] = await Promise.all([
      api<{ ok: true; data: BacklogItem[] }>(`/api/projects/${nextProjectId}/backlog`),
      api<{ ok: true; data: Sprint[] }>(`/api/projects/${nextProjectId}/sprints`),
      api<{ ok: true; data: ReviewRecord[] }>(`/api/projects/${nextProjectId}/reviews`),
      api<{ ok: true; data: RetroRecord[] }>(`/api/projects/${nextProjectId}/retros`),
      api<AgentSessionResponse>(`/api/agent/session?projectId=${nextProjectId}`),
    ]);
    setBacklog(backlogRes.data);
    setSprints(sprintRes.data);
    setReviews(reviewRes.data);
    setRetros(retroRes.data);
    setAgentSession({ stage: sessionRes.session.stage, completedStages: sessionRes.session.completedStages });
    if (sessionRes.session.messages.length > 0) {
      setChatMessages(
        sessionRes.session.messages.map((message, index) => ({
          id: `${message.role}-${index}-${message.at}`,
          role: message.role,
          content: message.content,
        })),
      );
    } else {
      setChatMessages(initialMessages);
    }
    if (sprintRes.data[0]) {
      const burndownRes = await api<{ ok: true; data: Burndown }>(
        `/api/projects/${nextProjectId}/sprints/${sprintRes.data[0].id}/burndown`,
      );
      setBurndown(burndownRes.data);
    } else {
      setBurndown(null);
    }
  }, []);

  const loadProjects = useCallback(
    async (preferredProjectId?: string) => {
      const response = await api<{ ok: true; data: Project[] }>("/api/projects");
      setProjects(response.data);
      const requestedProjectId = preferredProjectId || projectId;
      const requestedStillExists = response.data.some((project) => project.id === requestedProjectId);
      const nextProjectId = requestedStillExists ? requestedProjectId : response.data[0]?.id || "";
      setProjectId(nextProjectId);
      await loadProjectData(nextProjectId);
    },
    [loadProjectData, projectId],
  );

  useEffect(() => {
    loadProjects().catch((error) => setStatus(error.message));
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("ai-product-manager-theme");
    if (savedTheme === "liquid" || savedTheme === "sketch") setTheme(savedTheme);
    const savedDeepSeekApiKey = window.localStorage.getItem("ai-product-manager-deepseek-api-key");
    if (savedDeepSeekApiKey) setDeepSeekApiKey(savedDeepSeekApiKey);
  }, []);

  function changeTheme(nextTheme: ThemeName) {
    setTheme(nextTheme);
    window.localStorage.setItem("ai-product-manager-theme", nextTheme);
  }

  function changeDeepSeekApiKey(nextApiKey: string) {
    setDeepSeekApiKey(nextApiKey);
    if (nextApiKey.trim()) {
      window.localStorage.setItem("ai-product-manager-deepseek-api-key", nextApiKey.trim());
      setStatus("DeepSeek API key saved locally");
    } else {
      window.localStorage.removeItem("ai-product-manager-deepseek-api-key");
      setStatus("DeepSeek API key cleared");
    }
  }

  async function createWorkspace() {
    setBusy(true);
    try {
      const response = await api<{ ok: true; data: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({
          title: "ai product manager Scrum SaaS",
          action: "Build a real Scrum SaaS workflow",
          purpose: "Make AI conversation produce persistent Scrum artifacts and sprint evidence.",
        }),
      });
      setProjects((items) => [response.data, ...items]);
      setProjectId(response.data.id);
      setBacklog([]);
      setSprints([]);
      setReviews([]);
      setRetros([]);
      setBurndown(null);
      setStatus("Workspace created through API");
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Workspace created. You can now generate a Product Backlog proposal from the AI chat.",
        },
      ]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create workspace");
    } finally {
      setBusy(false);
    }
  }

  async function sendToAgent() {
    const message = prompt.trim();
    if (!message) {
      setStatus("Type a message for the product agent first.");
      return;
    }
    setBusy(true);
    setPrompt("");
    setChatMessages((items) => [...items, { id: `user-${Date.now()}`, role: "user", content: message }]);
    try {
      let currentProjectId = projectId;
      if (!currentProjectId) {
        const created = await api<{ ok: true; data: Project }>("/api/projects", {
          method: "POST",
          body: JSON.stringify({
            title: "Product Agent Project",
            action: "Define the product through the six-stage agent",
            purpose: "Turn a vague idea into executable Scrum artifacts and tracked delivery.",
          }),
        });
        setProjects((items) => [created.data, ...items]);
        setProjectId(created.data.id);
        currentProjectId = created.data.id;
      }
      const response = await api<AgentChatResponse>("/api/agent/chat", {
        method: "POST",
        body: JSON.stringify({
          projectId: currentProjectId,
          message,
          providerApiKey: deepSeekApiKey || undefined,
        }),
      });
      setChatMessages((items) => [
        ...items,
        { id: `assistant-${Date.now()}`, role: "assistant", content: response.reply },
      ]);
      setAgentSession(response.session);
      await loadProjectData(currentProjectId);
      const stageLabel = agentStageMeta.find((item) => item.value === response.session.stage)?.label ?? response.session.stage;
      setStatus(`Product agent replied · stage ${stageLabel}`);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Agent request failed";
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: `⚠️ ${detail}. Check the model/search keys in Settings (.env) and try again.`,
        },
      ]);
      setStatus(detail);
    } finally {
      setBusy(false);
    }
  }

  async function applyDraft() {
    if (!projectId || draft.length === 0) return;
    setBusy(true);
    try {
      for (const item of draft) {
        await api(`/api/projects/${projectId}/backlog`, {
          method: "POST",
          body: JSON.stringify(item),
        });
      }
      const appliedCount = draft.length;
      setDraft([]);
      await loadProjectData(projectId);
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `${appliedCount} Product Backlog items were applied to the persistent API. Open Backlogs to inspect the three Scrum artifact columns.`,
        },
      ]);
      setStatus("Backlog applied to persistent API store");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to apply backlog");
    } finally {
      setBusy(false);
    }
  }

  async function createSprint() {
    if (!projectId) return;
    const selectedIds = readyForSprint.slice(0, 4).map((item) => item.id);
    if (selectedIds.length === 0) {
      setStatus("Backlog is empty");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/projects/${projectId}/sprints`, {
        method: "POST",
        body: JSON.stringify({
          sprintNumber: sprints.length + 1,
          name: `Sprint ${sprints.length + 1}`,
          goal: "Deliver a usable AI Chat + Scrum artifact loop",
          startDate: today(),
          endDate: today(13),
          workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
          selectedBacklogItemIds: selectedIds,
        }),
      });
      await loadProjectData(projectId);
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Sprint Backlog created. Burndown will update automatically when task status changes.",
        },
      ]);
      setStatus("Sprint created from Product Backlog");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create sprint");
    } finally {
      setBusy(false);
    }
  }

  async function updateTask(item: SprintItem, statusValue: SprintItemStatus) {
    if (!projectId || !activeSprint) return;
    setBusy(true);
    try {
      await api(`/api/projects/${projectId}/sprints/${activeSprint.id}/items/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: statusValue,
          remainingEffort: statusValue === "Done" ? 0 : item.remainingEffort,
          evidenceLink: statusValue === "Done" ? "Local SaaS workflow verified through UI action" : item.evidenceLink,
        }),
      });
      await loadProjectData(projectId);
      setStatus(`Task updated: ${statusValue}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to update task");
    } finally {
      setBusy(false);
    }
  }

  async function saveReviewRetro() {
    if (!projectId || !activeSprint) return;
    if (!reviewText.trim() && !retroText.trim()) {
      setStatus("Add review or retro notes before saving.");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/projects/${projectId}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          sprintId: activeSprint.id,
          demoOutcome: reviewText.trim() || "No sprint review notes recorded.",
          acceptedItems: activeSprint.increments.map((item) => item.id),
          followUpItems: [],
          stakeholderFeedback: reviewText.trim() ? "Captured from review notes." : "No stakeholder feedback recorded.",
          backlogChanges: reviewText.trim() ? splitLines(reviewText).slice(0, 3) : [],
        }),
      });
      await api(`/api/projects/${projectId}/retros`, {
        method: "POST",
        body: JSON.stringify({
          sprintId: activeSprint.id,
          whatWorked: ["API-first workflow", "Server-side persistence", "Burndown responds to task changes"],
          whatDidNotWork: ["Auth and Postgres services are still pending"],
          rootCause: "Current slice focused on local usable flow first.",
          experiment: "Wire Prisma service layer behind the same APIs.",
          actionItems: splitLines(retroText),
        }),
      });
      await loadProjectData(projectId);
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Sprint Review and Retro were saved and will inform the next backlog decision.",
        },
      ]);
      setStatus("Review and retro saved");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to save review/retro");
    } finally {
      setBusy(false);
    }
  }

  async function openBacklogTechnicalDoc(item: BacklogItem) {
    if (!projectId) return;
    setSelectedBacklogItem(item);
    setTechnicalDoc(null);
    setDetailBusy(true);
    try {
      const response = await api<{ ok: true; data: BacklogTechnicalDoc }>(
        `/api/projects/${projectId}/backlog/${item.id}/technical-doc`,
      );
      setTechnicalDoc(response.data);
      setStatus("Backlog technical documentation loaded");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to load technical documentation");
    } finally {
      setDetailBusy(false);
    }
  }

  async function exportMarkdown() {
    if (!projectId) {
      setStatus("Create a workspace before exporting");
      return;
    }
    setExportBusy(true);
    try {
      const response = await api<MarkdownExportResponse>(`/api/projects/${projectId}/exports/markdown`, {
        method: "POST",
        body: JSON.stringify({
          includeAgentPrompt: true,
          agentPreset: exportPreset,
          customAgentPrompt,
          sections: ["project", "backlog", "technicalDocs", "sprints", "increments", "burndown", "reviews", "retros"],
        }),
      });
      const blob = new Blob([response.content], { type: response.mimeType });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = response.filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatus(`Markdown exported: ${response.filename}`);
      setExportOpen(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to export Markdown");
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <main className="sketch-stage" data-theme={theme}>
      <div className="workspace-frame">
        <SideRail
          activeView={view}
          historyOpen={historyOpen}
          onChange={setView}
          onToggleHistory={() => setHistoryOpen((open) => !open)}
        />
        <section className="workspace-body">
          <WorkspaceTopbar
            busy={busy}
            canExport={Boolean(projectId)}
            exportBusy={exportBusy}
            onOpenExport={() => setExportOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          {view === "chat" ? (
            <ChatView
              agentSession={agentSession}
              busy={busy}
              chatMessages={chatMessages}
              onPromptChange={setPrompt}
              onSend={sendToAgent}
              placeholder={promptPlaceholder}
              prompt={prompt}
            />
          ) : null}

          {view === "backlogs" ? (
            <BacklogsView
              activeSprint={activeSprint}
              backlog={sortedBacklog}
              busy={busy}
              draft={draft}
              onApplyDraft={applyDraft}
              onCreateSprint={createSprint}
              onOpenBacklogItem={openBacklogTechnicalDoc}
              readyForSprint={readyForSprint}
            />
          ) : null}

          {view === "scrum" ? (
            <ScrumView
              activeSprint={activeSprint}
              backlog={backlog}
              burndown={burndown}
              busy={busy}
              onSaveReviewRetro={saveReviewRetro}
              onUpdateTask={updateTask}
              reviewText={reviewText}
              reviews={reviews}
              retroText={retroText}
              retros={retros}
              setReviewText={setReviewText}
              setRetroText={setRetroText}
              totalRemaining={totalRemaining}
            />
          ) : null}

          {selectedBacklogItem ? (
            <BacklogDetailDrawer
              busy={detailBusy}
              doc={technicalDoc}
              item={selectedBacklogItem}
              onClose={() => {
                setSelectedBacklogItem(null);
                setTechnicalDoc(null);
              }}
            />
          ) : null}

          {historyOpen ? (
            <HistoryDrawer
              busy={busy}
              onClose={() => setHistoryOpen(false)}
              onNewChat={() => {
                setProjectId("");
                loadProjectData("").catch((error) => setStatus(error.message));
                setView("chat");
                setHistoryOpen(false);
                setStatus("New chat — your first message creates the project");
              }}
              onSelectProject={(nextProjectId) => {
                setProjectId(nextProjectId);
                loadProjectData(nextProjectId).catch((error) => setStatus(error.message));
                setView("chat");
                setHistoryOpen(false);
              }}
              projectId={projectId}
              projects={projects}
            />
          ) : null}

          {settingsOpen ? (
            <SettingsDrawer
              activeProject={activeProject}
              busy={busy}
              deepSeekApiKey={deepSeekApiKey}
              onDeepSeekApiKeyChange={changeDeepSeekApiKey}
              onClose={() => setSettingsOpen(false)}
              onCreateWorkspace={createWorkspace}
              onRefresh={() => loadProjects(projectId).catch((error) => setStatus(error.message))}
              onSelectProject={(nextProjectId) => {
                setProjectId(nextProjectId);
                loadProjectData(nextProjectId).catch((error) => setStatus(error.message));
              }}
              onThemeChange={changeTheme}
              projectId={projectId}
              projects={projects}
              status={status}
              theme={theme}
            />
          ) : null}

          {exportOpen ? (
            <MarkdownExportDrawer
              busy={exportBusy}
              customAgentPrompt={customAgentPrompt}
              onClose={() => setExportOpen(false)}
              onCustomAgentPromptChange={setCustomAgentPrompt}
              onExport={exportMarkdown}
              onPresetChange={setExportPreset}
              preset={exportPreset}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}

function HistoryDrawer({
  busy,
  onClose,
  onNewChat,
  onSelectProject,
  projectId,
  projects,
}: {
  busy: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSelectProject: (projectId: string) => void;
  projectId: string;
  projects: Project[];
}) {
  return (
    <aside aria-label="Project history" className="history-drawer">
      <header className="drawer-header">
        <div>
          <p className="eyebrow">History</p>
          <h2>Your projects</h2>
        </div>
        <button aria-label="Close project history" className="drawer-close" onClick={onClose} type="button">
          <X size={18} />
        </button>
      </header>

      <button className="history-new-chat" disabled={busy} onClick={onNewChat} type="button">
        <Plus size={15} />
        New chat
      </button>

      <div className="history-list">
        {projects.length === 0 ? (
          <EmptyLine text="No projects yet. Start a chat and the agent creates one for you." />
        ) : (
          projects.map((project) => (
            <button
              className={`history-item ${project.id === projectId ? "is-active" : ""}`}
              disabled={busy}
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              type="button"
            >
              <span className="history-item-title">{project.title}</span>
              <span className="history-item-meta">
                {new Date(project.updatedAt).toLocaleDateString()}{" "}
                {new Date(project.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </button>
          ))
        )}
      </div>
    </aside>
  );
}

function SideRail({
  activeView,
  historyOpen,
  onChange,
  onToggleHistory,
}: {
  activeView: WorkspaceView;
  historyOpen: boolean;
  onChange: (view: WorkspaceView) => void;
  onToggleHistory: () => void;
}) {
  return (
    <nav aria-label="Workspace navigation" className="side-rail">
      <div className="rail-actions">
        <RailButton
          active={activeView === "chat"}
          icon={MessageSquareText}
          label="AI Chat"
          onClick={() => onChange("chat")}
        />
        <RailButton
          active={activeView === "backlogs"}
          icon={Table2}
          label="Backlogs"
          onClick={() => onChange("backlogs")}
        />
        <RailButton
          active={activeView === "scrum"}
          icon={Flame}
          label="Scrum"
          onClick={() => onChange("scrum")}
        />
        <RailButton
          active={historyOpen}
          icon={History}
          label="Project history"
          onClick={onToggleHistory}
        />
      </div>
    </nav>
  );
}

function RailButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={`rail-button ${active ? "is-active" : ""}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon size={20} strokeWidth={1.9} />
    </button>
  );
}

function WorkspaceTopbar({
  busy,
  canExport,
  exportBusy,
  onOpenExport,
  onOpenSettings,
}: {
  busy: boolean;
  canExport: boolean;
  exportBusy: boolean;
  onOpenExport: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <header className="workspace-topbar">
      <div>
        <p className="eyebrow">Scrum SaaS</p>
        <h1>ai product manager</h1>
      </div>
      <div className="topbar-controls">
        <button
          className="topbar-export-button"
          disabled={!canExport || exportBusy}
          onClick={onOpenExport}
          type="button"
        >
          {exportBusy ? <Loader2 className="animate-spin" size={15} /> : <Download size={15} />}
          Export MD
        </button>
        <IconButton disabled={busy} icon={Settings2} label="Settings" onClick={onOpenSettings} />
      </div>
    </header>
  );
}

function ChatView({
  agentSession,
  busy,
  chatMessages,
  onPromptChange,
  onSend,
  placeholder,
  prompt,
}: {
  agentSession: AgentSessionState;
  busy: boolean;
  chatMessages: ChatMessage[];
  onPromptChange: (value: string) => void;
  onSend: () => void;
  placeholder: string;
  prompt: string;
}) {
  const currentMeta = agentStageMeta.find((item) => item.value === agentSession.stage);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [chatMessages, busy]);

  return (
    <section className="chat-layout">
      <StageProgress session={agentSession} />
      <div className="chat-scroll" ref={scrollRef}>
        {chatMessages.map((message) => (
          <article className={`chat-bubble ${message.role}`} key={message.id}>
            {message.role === "assistant" ? (
              <div className="chat-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p style={{ whiteSpace: "pre-wrap" }}>{message.content}</p>
            )}
          </article>
        ))}
        {busy ? (
          <article className="chat-bubble assistant chat-thinking">
            <p>
              <Loader2 className="animate-spin" size={14} /> {currentMeta?.role ?? "Agent"} is thinking…
            </p>
          </article>
        ) : null}
      </div>
      <div className="chat-composer">
        <div className="composer-main">
          <textarea
            aria-label="Message the product agent"
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (!busy) onSend();
              }
            }}
            placeholder={placeholder}
            value={prompt}
          />
        </div>
        <button
          aria-label="Send to product agent"
          className="send-button"
          disabled={busy}
          onClick={onSend}
          type="button"
        >
          {busy ? <Loader2 className="animate-spin" size={22} /> : <Send size={23} />}
        </button>
      </div>
    </section>
  );
}

function StageProgress({ session }: { session: AgentSessionState }) {
  return (
    <nav aria-label="Six-stage agent progress" className="stage-progress">
      {agentStageMeta.map((stage, index) => {
        const isDone = session.completedStages.includes(stage.value);
        const isCurrent = session.stage === stage.value;
        return (
          <div
            className={`stage-progress-chip ${isCurrent ? "is-current" : ""} ${isDone ? "is-done" : ""}`}
            key={stage.value}
            title={stage.role}
          >
            <span className="stage-progress-dot">{isDone ? <Check size={12} /> : index + 1}</span>
            <span className="stage-progress-label">{stage.label.split(" · ")[1]}</span>
          </div>
        );
      })}
    </nav>
  );
}

function BacklogsView({
  activeSprint,
  backlog,
  busy,
  draft,
  onApplyDraft,
  onCreateSprint,
  onOpenBacklogItem,
  readyForSprint,
}: {
  activeSprint?: Sprint;
  backlog: BacklogItem[];
  busy: boolean;
  draft: BacklogDraft[];
  onApplyDraft: () => void;
  onCreateSprint: () => void;
  onOpenBacklogItem: (item: BacklogItem) => void;
  readyForSprint: BacklogItem[];
}) {
  const coarseItems = backlog.filter((item) => !item.technicalSpec);
  const speccedItems = backlog.filter((item) => Boolean(item.technicalSpec));
  return (
    <section className="backlog-board">
      <BoardColumn
        action={null}
        empty="Step 3 nodes confirmed in the agent chat will appear here."
        title="Product Backlog"
      >
        {coarseItems.map((item) => (
          <BacklogCard item={item} key={item.id} onOpen={onOpenBacklogItem} />
        ))}
      </BoardColumn>

      <BoardColumn
        action={
          draft.length > 0 ? (
            <ActionButton disabled={busy} icon={Check} label="Apply Draft" onClick={onApplyDraft} />
          ) : null
        }
        empty="Items refined with an executable spec in Step 4 appear here."
        title="Scrum Backlog"
      >
        {draft.length > 0
          ? draft.map((item) => <DraftCard item={item} key={item.title} />)
          : speccedItems.map((item) => (
              <BacklogCard compact item={item} key={item.id} onOpen={onOpenBacklogItem} />
            ))}
      </BoardColumn>

      <BoardColumn
        action={
          activeSprint ? null : (
            <ActionButton disabled={busy || readyForSprint.length === 0} icon={ArrowRight} label="Create Sprint" onClick={onCreateSprint} />
          )
        }
        empty="Create a sprint to display Sprint Backlog tasks here."
        title="Sprint Backlog"
      >
        {activeSprint?.items.map((item) => <SprintMiniCard item={item} key={item.id} />)}
      </BoardColumn>
    </section>
  );
}

function BoardColumn({
  action,
  children,
  empty,
  title,
}: {
  action: ReactNode;
  children: ReactNode;
  empty: string;
  title: string;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="board-column">
      <header className="board-title">
        <h2>{title}</h2>
      </header>
      <div className="board-list">{hasChildren ? children : <EmptyLine text={empty} />}</div>
      {action ? <div className="board-action">{action}</div> : null}
    </section>
  );
}

function ScrumView({
  activeSprint,
  backlog,
  burndown,
  busy,
  onSaveReviewRetro,
  onUpdateTask,
  reviewText,
  reviews,
  retroText,
  retros,
  setReviewText,
  setRetroText,
  totalRemaining,
}: {
  activeSprint?: Sprint;
  backlog: BacklogItem[];
  burndown: Burndown | null;
  busy: boolean;
  onSaveReviewRetro: () => void;
  onUpdateTask: (item: SprintItem, statusValue: SprintItemStatus) => void;
  reviewText: string;
  reviews: ReviewRecord[];
  retroText: string;
  retros: RetroRecord[];
  setReviewText: (value: string) => void;
  setRetroText: (value: string) => void;
  totalRemaining: number;
}) {
  const bandFor = (item: SprintItem): PriorityBand | undefined =>
    backlog.find((candidate) => candidate.id === item.productBacklogItemId)?.priorityBand;
  return (
    <section className="scrum-grid">
      <section className="sprint-panel">
        <header className="large-panel-title">
          <ListChecks size={20} />
          <h2>Sprint Backlog</h2>
        </header>
        {!activeSprint ? (
          <EmptyLine text="No sprint yet. Create one from the Backlogs view first." />
        ) : (
          <>
            <div className="sprint-summary">
              <Metric label="Sprint" value={activeSprint.name} />
              <Metric label="Goal" value={activeSprint.goal} />
              <Metric label="Remaining" value={`${totalRemaining} pts`} />
            </div>
            <div className="sprint-list">
              {activeSprint.items.map((item) => (
                <SprintTaskRow band={bandFor(item)} busy={busy} item={item} key={item.id} onUpdateTask={onUpdateTask} />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="burndown-panel">
        <header className="chart-title">
          <h2>Burndown chart</h2>
        </header>
        <BurndownChart data={burndown} />
        <ReviewRetroPanel
          activeSprint={activeSprint}
          busy={busy}
          onSaveReviewRetro={onSaveReviewRetro}
          reviewText={reviewText}
          reviews={reviews}
          retroText={retroText}
          retros={retros}
          setReviewText={setReviewText}
          setRetroText={setRetroText}
        />
      </section>
    </section>
  );
}

function ReviewRetroPanel({
  activeSprint,
  busy,
  onSaveReviewRetro,
  reviewText,
  reviews,
  retroText,
  retros,
  setReviewText,
  setRetroText,
}: {
  activeSprint?: Sprint;
  busy: boolean;
  onSaveReviewRetro: () => void;
  reviewText: string;
  reviews: ReviewRecord[];
  retroText: string;
  retros: RetroRecord[];
  setReviewText: (value: string) => void;
  setRetroText: (value: string) => void;
}) {
  return (
    <section className="review-panel">
      <div className="review-fields">
        <label>
          <span>Outcome Review / Sprint Review</span>
          <textarea
            onChange={(event) => setReviewText(event.target.value)}
            placeholder="Summarize demo outcome, accepted work, stakeholder feedback, and follow-up backlog changes."
            value={reviewText}
          />
        </label>
        <label>
          <span>Retro action items</span>
          <textarea
            onChange={(event) => setRetroText(event.target.value)}
            placeholder="Capture what worked, what slowed the team down, root cause, next experiment, and action items."
            value={retroText}
          />
        </label>
      </div>
      <div className="review-footer">
        <ActionButton disabled={busy || !activeSprint} icon={Save} label="Save Review" onClick={onSaveReviewRetro} />
        <div className="review-counts">
          <Metric label="Reviews" value={String(reviews.length)} />
          <Metric label="Retros" value={String(retros.length)} />
        </div>
      </div>
    </section>
  );
}

function SprintTaskRow({
  band,
  busy,
  item,
  onUpdateTask,
}: {
  band?: PriorityBand;
  busy: boolean;
  item: SprintItem;
  onUpdateTask: (item: SprintItem, statusValue: SprintItemStatus) => void;
}) {
  return (
    <article className="sprint-row">
      <div className="sprint-row-line" />
      <div className="sprint-row-content">
        <h3>{item.task}</h3>
        <p>{item.doneCondition}</p>
      </div>
      <div className="sprint-row-actions">
        {band ? <span className={`moscow-chip moscow-${band.toLowerCase()}`}>{moscowLabel(band)}</span> : null}
        <span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span>
        {item.status !== "Done" ? (
          <>
            <button disabled={busy} onClick={() => onUpdateTask(item, "InProgress")} type="button">
              <Play size={13} />
              Start
            </button>
            <button className="done-button" disabled={busy} onClick={() => onUpdateTask(item, "Done")} type="button">
              <Check size={13} />
              Done
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

function BacklogCard({
  compact = false,
  item,
  onOpen,
}: {
  compact?: boolean;
  item: BacklogItem;
  onOpen?: (item: BacklogItem) => void;
}) {
  return (
    <button
      className={`artifact-card ${compact ? "compact" : ""}`}
      onClick={() => onOpen?.(item)}
      type="button"
    >
      <div className="artifact-head">
        <span className={priorityClass(item.priorityBand)}>
          {moscowLabel(item.priorityBand)} · {item.priorityBand}
        </span>
        <span className="status-pill">{item.status}</span>
      </div>
      <h3>{item.title}</h3>
      {!compact ? <p>{item.userStory}</p> : null}
      <div className="artifact-meta">
        <span>{item.effort} pts</span>
        <span>{item.acceptanceCriteria.length} AC</span>
      </div>
      <span className="artifact-open-hint">
        <Wrench size={13} />
        Tech requirements
      </span>
    </button>
  );
}

function DraftCard({ item }: { item: BacklogDraft }) {
  return (
    <article className="artifact-card draft">
      <div className="artifact-head">
        <span className="priority-chip priority-draft">Draft</span>
        <span>{item.effort} pts</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.userStory}</p>
    </article>
  );
}

function SprintMiniCard({ item }: { item: SprintItem }) {
  return (
    <article className="artifact-card compact">
      <div className="artifact-head">
        <span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span>
        <span>{item.remainingEffort} pts left</span>
      </div>
      <h3>{item.task}</h3>
    </article>
  );
}

function SettingsDrawer({
  activeProject,
  busy,
  deepSeekApiKey,
  onClose,
  onCreateWorkspace,
  onDeepSeekApiKeyChange,
  onRefresh,
  onSelectProject,
  onThemeChange,
  projectId,
  projects,
  status,
  theme,
}: {
  activeProject?: Project;
  busy: boolean;
  deepSeekApiKey: string;
  onClose: () => void;
  onCreateWorkspace: () => void;
  onDeepSeekApiKeyChange: (apiKey: string) => void;
  onRefresh: () => void;
  onSelectProject: (projectId: string) => void;
  onThemeChange: (theme: ThemeName) => void;
  projectId: string;
  projects: Project[];
  status: string;
  theme: ThemeName;
}) {
  return (
    <aside aria-label="Workspace settings" className="settings-drawer">
      <header className="drawer-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Workspace controls</h2>
        </div>
        <button aria-label="Close settings" className="drawer-close" onClick={onClose} type="button">
          <X size={18} />
        </button>
      </header>

      <section className="settings-section">
        <h3>Workspace</h3>
        <label className="export-field">
          <span>Active workspace</span>
          <select onChange={(event) => onSelectProject(event.target.value)} value={projectId}>
            <option value="">No workspace</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>
        <div className="settings-actions">
          <ActionButton disabled={busy} icon={Plus} label="New workspace" onClick={onCreateWorkspace} />
          <ActionButton disabled={busy} icon={RefreshCcw} label="Refresh data" onClick={onRefresh} />
        </div>
        <p className="settings-note">{activeProject?.purpose ?? "Create a workspace to start the Scrum workflow."}</p>
      </section>

      <section className="settings-section">
        <h3>Appearance</h3>
        <div className="theme-switch settings-theme-switch" aria-label="Theme selector">
          <Palette size={15} />
          <button
            className={theme === "liquid" ? "is-active" : ""}
            onClick={() => onThemeChange("liquid")}
            type="button"
          >
            Liquid
          </button>
          <button
            className={theme === "sketch" ? "is-active" : ""}
            onClick={() => onThemeChange("sketch")}
            type="button"
          >
            Sketch
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h3>AI provider</h3>
        <label className="export-field secret-field">
          <span>DeepSeek API key</span>
          <input
            aria-label="DeepSeek API key"
            autoComplete="off"
            onChange={(event) => onDeepSeekApiKeyChange(event.target.value)}
            placeholder="sk-..."
            type="password"
            value={deepSeekApiKey}
          />
        </label>
        <div className="secret-actions">
          <span className={`provider-state ${deepSeekApiKey.trim() ? "is-configured" : ""}`}>
            {deepSeekApiKey.trim() ? "Saved locally for this browser" : "Not configured"}
          </span>
          <button disabled={!deepSeekApiKey.trim()} onClick={() => onDeepSeekApiKeyChange("")} type="button">
            Clear key
          </button>
        </div>
        <p className="settings-note">
          The key is stored in this browser only and is sent with AI requests. It is not written into Scrum artifacts or Markdown exports.
        </p>
      </section>

      <section className="settings-section">
        <h3>Runtime feedback</h3>
        <StatusLine busy={busy} status={status} />
        <p className="settings-note">
          Operational status lives here so the main workspace stays focused on Scrum artifacts.
        </p>
      </section>
    </aside>
  );
}

function BacklogDetailDrawer({
  busy,
  doc,
  item,
  onClose,
}: {
  busy: boolean;
  doc: BacklogTechnicalDoc | null;
  item: BacklogItem;
  onClose: () => void;
}) {
  return (
    <aside aria-label="Backlog technical documentation" className="detail-drawer">
      <header className="drawer-header">
        <div>
          <p className="eyebrow">Backlog Technical Doc</p>
          <h2>{item.title}</h2>
        </div>
        <button aria-label="Close backlog technical documentation" className="drawer-close" onClick={onClose} type="button">
          <X size={18} />
        </button>
      </header>

      <div className="drawer-meta-grid">
        <Metric label="Priority" value={`${item.priorityBand}/${item.priorityScore}`} />
        <Metric label="Effort" value={`${item.effort} pts`} />
        <Metric label="Status" value={item.status} />
      </div>

      {busy ? (
        <div className="drawer-loading">
          <Loader2 className="animate-spin" size={18} />
          Loading technical requirements
        </div>
      ) : (
        <>
          <section className="drawer-section">
            <h3>Developer Summary</h3>
            <p>{doc?.summary ?? item.userStory}</p>
          </section>

          {item.technicalSpec ? (
            <section className="drawer-section">
              <h3>Build Blueprint (Step 4)</h3>
              <pre style={{ whiteSpace: "pre-wrap" }}>{item.technicalSpec}</pre>
            </section>
          ) : null}

          {item.codingPrompt ? (
            <section className="drawer-section">
              <h3>AI Coding Prompt</h3>
              <p className="drawer-hint">Paste this into Cursor / Claude Code to build the feature.</p>
              <pre style={{ whiteSpace: "pre-wrap" }}>{item.codingPrompt}</pre>
              <button
                className="copy-prompt-button"
                onClick={() => navigator.clipboard.writeText(item.codingPrompt ?? "")}
                type="button"
              >
                Copy prompt
              </button>
            </section>
          ) : null}

          {doc?.sections.map((section) => (
            <section className="drawer-section" key={section.title}>
              <h3>{section.title}</h3>
              <ul>
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </section>
          ))}

          <section className="drawer-section">
            <h3>Done Checklist</h3>
            <ul>
              {(doc?.doneChecklist ?? item.acceptanceCriteria).map((entry) => (
                <li key={entry}>{entry}</li>
              ))}
            </ul>
          </section>

          {doc?.agentHandoffPrompt ? (
            <section className="drawer-section">
              <h3>Agent Handoff Prompt</h3>
              <pre>{doc.agentHandoffPrompt}</pre>
            </section>
          ) : null}
        </>
      )}
    </aside>
  );
}

function MarkdownExportDrawer({
  busy,
  customAgentPrompt,
  onClose,
  onCustomAgentPromptChange,
  onExport,
  onPresetChange,
  preset,
}: {
  busy: boolean;
  customAgentPrompt: string;
  onClose: () => void;
  onCustomAgentPromptChange: (value: string) => void;
  onExport: () => void;
  onPresetChange: (preset: AgentPreset) => void;
  preset: AgentPreset;
}) {
  return (
    <aside aria-label="Markdown export settings" className="export-drawer">
      <header className="drawer-header">
        <div>
          <p className="eyebrow">Markdown Export</p>
          <h2>One-click Scrum workspace export</h2>
        </div>
        <button aria-label="Close markdown export settings" className="drawer-close" onClick={onClose} type="button">
          <X size={18} />
        </button>
      </header>

      <section className="drawer-section">
        <div className="export-summary">
          <FileText size={18} />
          <p>The export includes project context, Product Backlog, per-item technical requirement docs, Sprints, Increment Evidence, Burndown, Reviews, Retros, and AI agent prompt presets.</p>
        </div>
      </section>

      <label className="export-field">
        <span>AI agent preset</span>
        <select value={preset} onChange={(event) => onPresetChange(event.target.value as AgentPreset)}>
          <option value="scrum-dev-agent">Scrum Developer Agent</option>
          <option value="frontend-ui-agent">Frontend UI Agent</option>
          <option value="backend-api-agent">Backend API Agent</option>
          <option value="qa-review-agent">QA Review Agent</option>
          <option value="custom">Custom Only</option>
        </select>
      </label>

      <label className="export-field">
        <span>Agent prompt appended to the exported Markdown</span>
        <textarea
          onChange={(event) => onCustomAgentPromptChange(event.target.value)}
          value={customAgentPrompt}
        />
      </label>

      <button className="export-primary" disabled={busy} onClick={onExport} type="button">
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
        Export Markdown
      </button>
    </aside>
  );
}

function ActionButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className="action-button" disabled={disabled} onClick={onClick} type="button">
      <Icon size={15} />
      {label}
    </button>
  );
}

function IconButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean;
  icon: ComponentType<{ size?: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button aria-label={label} className="icon-button" disabled={disabled} onClick={onClick} title={label} type="button">
      <Icon size={16} />
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <p className="empty-line">{text}</p>;
}

function StatusLine({ busy, status }: { busy: boolean; status: string }) {
  return (
    <div className="status-line">
      {busy ? <Loader2 className="animate-spin" size={14} /> : <Clock3 size={14} />}
      <span>{status}</span>
    </div>
  );
}

function BurndownChart({ data }: { data: Burndown | null }) {
  if (!data || data.points.length === 0) {
    return <EmptyLine text="Create a sprint to generate burndown data automatically." />;
  }

  const width = 680;
  const height = 420;
  const padding = 54;
  const actualPoints = data.points
    .map((point, index) => (point.actualRemaining === null ? null : { point, index, value: point.actualRemaining }))
    .filter((item): item is { point: BurndownPoint; index: number; value: number } => Boolean(item));
  const latestActualPoint = actualPoints[actualPoints.length - 1];
  const latestActual = latestActualPoint?.value ?? data.totalCommitted;
  const forecastEnd = data.points[data.points.length - 1]?.projectedRemaining ?? latestActual;
  const blockedCount = latestActualPoint?.point.blockedCount ?? 0;
  const scopeChange = data.points.reduce((sum, point) => sum + point.scopeChange, 0);
  const maxY = Math.max(
    data.totalCommitted,
    ...data.points.map((point) => point.idealRemaining),
    ...data.points.map((point) => point.projectedRemaining ?? 0),
    ...actualPoints.map((point) => point.value),
    1,
  );
  const toX = (index: number) => padding + (index * (width - padding * 2)) / Math.max(data.points.length - 1, 1);
  const toY = (value: number) => height - padding - (value * (height - padding * 2)) / maxY;
  const formatPolyline = (items: Array<{ index: number; value: number }>) =>
    items.map((item) => `${toX(item.index)},${toY(item.value)}`).join(" ");
  const ideal = formatPolyline(data.points.map((point, index) => ({ index, value: point.idealRemaining })));
  const actual = formatPolyline(actualPoints);
  const projectedAnchor = latestActualPoint ? [{ index: latestActualPoint.index, value: latestActualPoint.value }] : [];
  const projected = formatPolyline([
    ...projectedAnchor,
    ...data.points
      .map((point, index) =>
        point.actualRemaining === null && point.projectedRemaining !== undefined
          ? { index, value: point.projectedRemaining }
          : null,
      )
      .filter((item): item is { index: number; value: number } => Boolean(item)),
  ]);
  const ticks = Array.from({ length: 5 }, (_, index) => (maxY * index) / 4);
  const dateLabels = data.points.filter(
    (point, index) => index === 0 || index === data.points.length - 1 || point.date === today(),
  );

  return (
    <div className="chart-wrap">
      <svg aria-label="Sprint burndown chart" role="img" viewBox={`0 0 ${width} ${height}`}>
        <title>Sprint burndown chart with ideal, actual, and projected remaining effort</title>
        <defs>
          <filter id="roughen">
            <feTurbulence baseFrequency="0.8" numOctaves="1" seed="8" type="fractalNoise" />
            <feDisplacementMap in="SourceGraphic" scale="1.2" />
          </filter>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className="chart-grid"
              x1={padding}
              x2={width - padding * 0.55}
              y1={toY(tick)}
              y2={toY(tick)}
            />
            <text className="chart-label" x={padding - 14} y={toY(tick) + 4} textAnchor="end">
              {Math.round(tick)}
            </text>
          </g>
        ))}
        <line className="chart-axis" x1={padding} x2={padding} y1={padding * 0.7} y2={height - padding} />
        <line className="chart-axis" x1={padding} x2={width - padding * 0.55} y1={height - padding} y2={height - padding} />
        <polyline className="chart-ideal" fill="none" points={ideal} />
        {projected ? <polyline className="chart-projected" fill="none" points={projected} /> : null}
        {actual ? <polyline className="chart-actual" fill="none" points={actual} /> : null}
        {actualPoints.map(({ point, index, value }) => (
          <circle className="chart-point" cx={toX(index)} cy={toY(value)} key={point.date} r="4.5" />
        ))}
        {dateLabels.map((point) => (
          <text className="chart-label chart-date-label" key={point.date} x={toX(data.points.indexOf(point))} y={height - 22} textAnchor="middle">
            {point.date.slice(5)}
          </text>
        ))}
      </svg>
      <div className="chart-legend">
        <span>
          <i className="legend-line ideal" />
          Ideal
        </span>
        <span>
          <i className="legend-line actual" />
          Actual
        </span>
        <span>
          <i className="legend-line projected" />
          Projected
        </span>
      </div>
      <div className="chart-metrics">
        <Metric label="Committed" value={`${data.totalCommitted} pts`} />
        <Metric label="Remaining" value={`${latestActual} pts`} />
        <Metric label="Forecast End" value={`${forecastEnd.toFixed(1)} pts`} />
        <Metric label="Blocked" value={String(blockedCount)} />
        <Metric label="Scope Change" value={`${scopeChange} pts`} />
      </div>
    </div>
  );
}

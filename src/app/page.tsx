"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  FileText,
  Flame,
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
  Sparkles,
  Table2,
  Wand2,
  Wrench,
  X,
} from "lucide-react";
import WizardView from "@/components/wizard/WizardView";

type PriorityBand = "P0" | "P1" | "P2" | "P3";
type BacklogStatus = "Idea" | "Ready" | "Selected" | "Deferred" | "Done" | "Dropped";
type SprintItemStatus = "Todo" | "InProgress" | "Blocked" | "Review" | "Done";
type WorkspaceView = "chat" | "backlogs" | "scrum" | "wizard";
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

type AiChatResponse = {
  ok: true;
  mode: string;
  reply: string;
  promptStage: PromptStage;
  promptSource: string;
  proposal: { payload: { productBacklogItems: BacklogDraft[] } };
};

const defaultCustomAgentPrompt =
  "You are the AI agent taking over this project. Read the exported Markdown first, confirm Scrum artifacts, acceptance criteria, technical requirements, burndown state, risks, API contracts, persistence, permissions, and tests before implementation.";

const defaultPrompt =
  "";

const promptPlaceholder =
  "Describe the product goal, team constraints, architecture direction, and the first workflow you want Scrum to plan.";

const promptStageOptions: Array<{ value: PromptStage; label: string }> = [
  { value: "step1", label: "Step 1 - Capture" },
  { value: "step2", label: "Step 2 - Discover" },
  { value: "step3", label: "Step 3 - Backlog" },
  { value: "step4", label: "Step 4 - Confirm" },
  { value: "step5", label: "Step 5 - Plan" },
  { value: "step6", label: "Step 6 - Track" },
];

const initialMessages: ChatMessage[] = [
  {
    id: "assistant-0",
    role: "assistant",
    content:
      "Describe the product goal. I will turn it into confirmed Scrum artifacts, technical backlog details, sprint work, burndown data, and review records.",
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
  const body = (await response.json()) as T & { error?: string; message?: string };
  if (!response.ok) {
    throw new Error(body.message ?? body.error ?? `Request failed: ${response.status}`);
  }
  return body;
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

function intentForPromptStage(stage: PromptStage) {
  if (stage === "step1" || stage === "step2") return "clarify";
  if (stage === "step5") return "plan_sprint";
  if (stage === "step6") return "review_retro";
  return "draft_backlog";
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
  const [selectedPromptStage, setSelectedPromptStage] = useState<PromptStage>("step3");
  const [draft, setDraft] = useState<BacklogDraft[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState("Ready");
  const [busy, setBusy] = useState(false);
  const [selectedBacklogItem, setSelectedBacklogItem] = useState<BacklogItem | null>(null);
  const [technicalDoc, setTechnicalDoc] = useState<BacklogTechnicalDoc | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const completedCount = activeSprint?.items.filter((item) => item.status === "Done").length ?? 0;

  const loadProjectData = useCallback(async (nextProjectId: string) => {
    if (!nextProjectId) {
      setBacklog([]);
      setSprints([]);
      setReviews([]);
      setRetros([]);
      setBurndown(null);
      return;
    }
    const [backlogRes, sprintRes, reviewRes, retroRes] = await Promise.all([
      api<{ ok: true; data: BacklogItem[] }>(`/api/projects/${nextProjectId}/backlog`),
      api<{ ok: true; data: Sprint[] }>(`/api/projects/${nextProjectId}/sprints`),
      api<{ ok: true; data: ReviewRecord[] }>(`/api/projects/${nextProjectId}/reviews`),
      api<{ ok: true; data: RetroRecord[] }>(`/api/projects/${nextProjectId}/retros`),
    ]);
    setBacklog(backlogRes.data);
    setSprints(sprintRes.data);
    setReviews(reviewRes.data);
    setRetros(retroRes.data);
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

  async function generateBacklog() {
    if (!projectId) {
      setStatus("Create a workspace first");
      return;
    }
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) {
      setStatus("Describe the product goal before generating a backlog.");
      return;
    }
    setBusy(true);
    setChatMessages((items) => [
      ...items,
      { id: `user-${Date.now()}`, role: "user", content: normalizedPrompt },
    ]);
    try {
      const response = await api<{
        ok: true;
        reply: string;
        promptSource: string;
        proposal: { payload: { productBacklogItems: BacklogDraft[] } };
      }>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          projectId,
          prompt: normalizedPrompt,
          providerApiKey: deepSeekApiKey.trim() || undefined,
          promptStage: "step3",
          intent: "draft_backlog",
        }),
      });
      setDraft(response.proposal.payload.productBacklogItems);
      await api(`/api/projects/${projectId}/ai/proposals`, {
        method: "POST",
        body: JSON.stringify({
          type: "ProductBacklogDraft",
          rationale: response.reply,
          payload: response.proposal.payload,
        }),
      });
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: `Generated ${response.proposal.payload.productBacklogItems.length} Product Backlog draft items using ${response.promptSource}. Apply them to write into the real API store.`,
        },
      ]);
      setStatus("Backlog proposal generated and stored");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to generate backlog");
    } finally {
      setBusy(false);
    }
  }

  async function testPromptEffect() {
    const normalizedPrompt = prompt.trim();
    if (!normalizedPrompt) {
      setStatus("Enter a prompt before testing a stage prompt.");
      return;
    }
    setBusy(true);
    setChatMessages((items) => [
      ...items,
      {
        id: `user-test-${Date.now()}`,
        role: "user",
        content: `[Prompt test: ${promptStageOptions.find((item) => item.value === selectedPromptStage)?.label}] ${normalizedPrompt}`,
      },
    ]);
    try {
      const response = await api<AiChatResponse>("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          projectId: projectId || undefined,
          prompt: normalizedPrompt,
          providerApiKey: deepSeekApiKey.trim() || undefined,
          promptStage: selectedPromptStage,
          intent: intentForPromptStage(selectedPromptStage),
        }),
      });
      const draftCount = response.proposal.payload.productBacklogItems.length;
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-test-${Date.now()}`,
          role: "assistant",
          content: [
            `Prompt test used ${response.promptSource} in ${response.mode}.`,
            response.reply,
            draftCount > 0 ? `Structured draft items returned: ${draftCount}. They were not saved.` : "No Scrum artifact was saved.",
          ].join(" "),
        },
      ]);
      setStatus(`Prompt test completed: ${response.promptSource}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to test prompt");
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
        <SideRail activeView={view} onChange={setView} />
        <section className={`workspace-body ${view === "wizard" ? "workspace-body--full" : ""}`}>
          {view !== "wizard" ? (
            <WorkspaceTopbar
              busy={busy}
              canExport={Boolean(projectId)}
              exportBusy={exportBusy}
              onOpenExport={() => setExportOpen(true)}
              onOpenSettings={() => setSettingsOpen(true)}
            />
          ) : null}

          {view === "chat" ? (
            <ChatView
              activeSprint={activeSprint}
              backlogCount={backlog.length}
              busy={busy}
              chatMessages={chatMessages}
              completedCount={completedCount}
              draft={draft}
              onApplyDraft={applyDraft}
              onCreateSprint={createSprint}
              onCreateWorkspace={createWorkspace}
              onGenerateBacklog={generateBacklog}
              onPromptChange={setPrompt}
              onPromptStageChange={setSelectedPromptStage}
              onTestPrompt={testPromptEffect}
              placeholder={promptPlaceholder}
              projectReady={Boolean(projectId)}
              prompt={prompt}
              promptStage={selectedPromptStage}
              reviewCount={reviews.length}
              retroCount={retros.length}
            />
          ) : null}

          {view === "wizard" ? (
            <WizardView
              projectId={projectId}
              deepSeekApiKey={deepSeekApiKey}
              onClose={() => setView("chat")}
              onCreateProject={async () => {
                const response = await api<{ ok: true; data: Project }>("/api/projects", {
                  method: "POST",
                  body: JSON.stringify({
                    title: "6-Step Wizard Project",
                    action: "Build a product using the 6-step AI PM methodology",
                    purpose: "Go from vague description to executable plan with AI guidance",
                  }),
                });
                setProjects((items) => [response.data, ...items]);
                setProjectId(response.data.id);
                setBacklog([]);
                setSprints([]);
                setReviews([]);
                setRetros([]);
                setBurndown(null);
                return response.data.id;
              }}
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

function SideRail({
  activeView,
  onChange,
}: {
  activeView: WorkspaceView;
  onChange: (view: WorkspaceView) => void;
}) {
  return (
    <nav aria-label="Workspace navigation" className="side-rail">
      <button aria-label="ai product manager" className="rail-brand" type="button">
        <Bot size={22} strokeWidth={1.8} />
      </button>
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
          active={activeView === "wizard"}
          icon={Wand2}
          label="6-Step Wizard"
          onClick={() => onChange("wizard")}
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
  activeSprint,
  backlogCount,
  busy,
  chatMessages,
  completedCount,
  draft,
  onApplyDraft,
  onCreateSprint,
  onCreateWorkspace,
  onGenerateBacklog,
  onPromptChange,
  onPromptStageChange,
  onTestPrompt,
  placeholder,
  projectReady,
  prompt,
  promptStage,
  reviewCount,
  retroCount,
}: {
  activeSprint?: Sprint;
  backlogCount: number;
  busy: boolean;
  chatMessages: ChatMessage[];
  completedCount: number;
  draft: BacklogDraft[];
  onApplyDraft: () => void;
  onCreateSprint: () => void;
  onCreateWorkspace: () => void;
  onGenerateBacklog: () => void;
  onPromptChange: (value: string) => void;
  onPromptStageChange: (stage: PromptStage) => void;
  onTestPrompt: () => void;
  placeholder: string;
  projectReady: boolean;
  prompt: string;
  promptStage: PromptStage;
  reviewCount: number;
  retroCount: number;
}) {
  return (
    <section className="chat-layout">
      <div className="chat-scroll">
        <div className="chat-agent-mark">
          <Bot size={18} strokeWidth={1.8} />
        </div>
        {chatMessages.map((message) => (
          <article className={`chat-bubble ${message.role}`} key={message.id}>
            <p>{message.content}</p>
          </article>
        ))}
        <FlowPanel
          activeSprint={activeSprint}
          backlogCount={backlogCount}
          busy={busy}
          completedCount={completedCount}
          draftCount={draft.length}
          onApplyDraft={onApplyDraft}
          onCreateSprint={onCreateSprint}
          onCreateWorkspace={onCreateWorkspace}
          onGenerateBacklog={onGenerateBacklog}
          projectReady={projectReady}
          reviewCount={reviewCount}
          retroCount={retroCount}
        />
        {draft.length > 0 ? <DraftPreview draft={draft} /> : null}
      </div>
      <div className="chat-composer">
        <div className="composer-main">
          <div className="prompt-test-bar">
            <label>
              <span>Prompt stage</span>
              <select
                aria-label="Prompt stage"
                onChange={(event) => onPromptStageChange(event.target.value as PromptStage)}
                value={promptStage}
              >
                {promptStageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="prompt-test-button" disabled={busy} onClick={onTestPrompt} type="button">
              <Play size={14} />
              Test prompt
            </button>
          </div>
          <textarea
            aria-label="AI chat prompt"
            onChange={(event) => onPromptChange(event.target.value)}
            placeholder={placeholder}
            value={prompt}
          />
        </div>
        <button
          aria-label="Generate backlog"
          className="send-button"
          disabled={busy || !projectReady}
          onClick={onGenerateBacklog}
          type="button"
        >
          {busy ? <Loader2 className="animate-spin" size={22} /> : <Send size={23} />}
        </button>
      </div>
    </section>
  );
}

function FlowPanel({
  activeSprint,
  backlogCount,
  busy,
  completedCount,
  draftCount,
  onApplyDraft,
  onCreateSprint,
  onCreateWorkspace,
  onGenerateBacklog,
  projectReady,
  reviewCount,
  retroCount,
}: {
  activeSprint?: Sprint;
  backlogCount: number;
  busy: boolean;
  completedCount: number;
  draftCount: number;
  onApplyDraft: () => void;
  onCreateSprint: () => void;
  onCreateWorkspace: () => void;
  onGenerateBacklog: () => void;
  projectReady: boolean;
  reviewCount: number;
  retroCount: number;
}) {
  const steps = [
    {
      title: "1. Create workspace",
      detail: projectReady ? "Workspace API is ready" : "Create a real persistent workspace first",
      done: projectReady,
      action: !projectReady ? { label: "Create", icon: Plus, onClick: onCreateWorkspace, disabled: busy } : undefined,
    },
    {
      title: "2. Capture requirements",
      detail: "Describe product goals, team constraints, and technical boundaries in chat",
      done: projectReady,
    },
    {
      title: "3. Draft Product Backlog",
      detail: draftCount > 0 ? `${draftCount} draft items waiting` : "AI returns a structured backlog proposal",
      done: draftCount > 0 || backlogCount > 0,
      action:
        projectReady && draftCount === 0
          ? { label: "Generate", icon: Sparkles, onClick: onGenerateBacklog, disabled: busy }
          : undefined,
    },
    {
      title: "4. Apply to Product Backlog",
      detail: backlogCount > 0 ? `${backlogCount} backlog items persisted` : "Confirm and write into the persistent API",
      done: backlogCount > 0,
      action:
        draftCount > 0
          ? { label: "Apply", icon: Check, onClick: onApplyDraft, disabled: busy }
          : undefined,
    },
    {
      title: "5. Create Sprint Backlog",
      detail: activeSprint ? `${activeSprint.name} is active` : "Build a sprint from the highest-priority backlog",
      done: Boolean(activeSprint),
      action:
        backlogCount > 0 && !activeSprint
          ? { label: "Create Sprint", icon: ArrowRight, onClick: onCreateSprint, disabled: busy }
          : undefined,
    },
    {
      title: "6. Review / Retro",
      detail:
        reviewCount + retroCount > 0
          ? `${reviewCount} review / ${retroCount} retro saved`
          : completedCount > 0
            ? "Save review notes in the Scrum view after tasks are done"
            : "Turn delivery results into review learning",
      done: reviewCount + retroCount > 0,
    },
  ];

  return (
    <section className="flow-panel" aria-label="AI Scrum six step subflow">
      <div className="flow-panel-title">
        <Sparkles size={17} />
        <h2>6-step Scrum subflow inside AI chat</h2>
      </div>
      <div className="flow-steps">
        {steps.map((step) => (
          <div className={`flow-step ${step.done ? "done" : ""}`} key={step.title}>
            <span className="step-dot">{step.done ? <CheckCircle2 size={16} /> : <Clock3 size={15} />}</span>
            <div>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </div>
            {step.action ? (
              <button
                className="mini-action"
                disabled={step.action.disabled}
                onClick={step.action.onClick}
                type="button"
              >
                <step.action.icon size={14} />
                {step.action.label}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function DraftPreview({ draft }: { draft: BacklogDraft[] }) {
  return (
    <section className="draft-preview">
      <h2>Pending AI Proposal</h2>
      <div className="draft-list">
        {draft.map((item) => (
          <article className="draft-row" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.userStory}</p>
          </article>
        ))}
      </div>
    </section>
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
  return (
    <section className="backlog-board">
      <BoardColumn
        action={null}
        empty="Applied AI drafts will appear here."
        title="Product Backlog"
      >
        {backlog.map((item) => (
          <BacklogCard item={item} key={item.id} onOpen={onOpenBacklogItem} />
        ))}
      </BoardColumn>

      <BoardColumn
        action={
          draft.length > 0 ? (
            <ActionButton disabled={busy} icon={Check} label="Apply Draft" onClick={onApplyDraft} />
          ) : null
        }
        empty="Pending AI drafts or priority-sorted sprint candidates appear here."
        title="Scrum Backlog"
      >
        {draft.length > 0
          ? draft.map((item) => <DraftCard item={item} key={item.title} />)
          : readyForSprint
              .slice(0, 6)
              .map((item) => <BacklogCard compact item={item} key={item.id} onOpen={onOpenBacklogItem} />)}
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
                <SprintTaskRow busy={busy} item={item} key={item.id} onUpdateTask={onUpdateTask} />
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
  busy,
  item,
  onUpdateTask,
}: {
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
          {item.priorityBand} / {item.priorityScore}
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

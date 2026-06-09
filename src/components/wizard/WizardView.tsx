"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  Loader2,
  Sparkles,
  Target,
  Search,
  Layers,
  CheckCheck,
  Calendar,
  Activity,
} from "lucide-react";
import type { WizardStep, StepData } from "./types";

const STEPS = [
  { id: 1, label: "Intent", icon: Target, title: "Intent Capture" },
  { id: 2, label: "Profile", icon: Search, title: "Deep Profile" },
  { id: 3, label: "Nodes", icon: Layers, title: "Node Analysis" },
  { id: 4, label: "Confirm", icon: CheckCheck, title: "3-Round Confirm" },
  { id: 5, label: "Plan", icon: Calendar, title: "Execution Plan" },
  { id: 6, label: "Track", icon: Activity, title: "Track & Adjust" },
] as const;

type Props = {
  projectId: string;
  deepSeekApiKey: string;
  onClose: () => void;
  onCreateProject: () => Promise<string>;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json()) as T & { error?: string; message?: string };
  if (!res.ok) throw new Error(body.message ?? body.error ?? `Request failed: ${res.status}`);
  return body;
}

async function callAiStep(
  projectId: string,
  prompt: string,
  promptStage: string,
  intent: string,
  apiKey?: string,
) {
  return api<{
    ok: true;
    mode: string;
    promptStage: string;
    promptSource: string;
    reply: string;
    proposal: { payload: { productBacklogItems: unknown[] } };
  }>("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ projectId, prompt, promptStage, intent, providerApiKey: apiKey || undefined }),
  });
}

export default function WizardView({ projectId: initialProjectId, deepSeekApiKey, onClose, onCreateProject }: Props) {
  const [projectId, setProjectId] = useState(initialProjectId);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [stepData, setStepData] = useState<StepData>({});
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(!initialProjectId);
  const [status, setStatus] = useState("Ready — follow the 6-step methodology to build your project plan");

  // Auto-create project if none exists
  useEffect(() => {
    if (!initialProjectId && onCreateProject) {
      setInitializing(true);
      onCreateProject()
        .then((newId) => {
          setProjectId(newId);
          setInitializing(false);
          setStatus("Workspace auto-created. Start with Step 1 to capture your intent.");
        })
        .catch((err) => {
          setInitializing(false);
          setStatus(`Failed to create workspace: ${err instanceof Error ? err.message : "Unknown error"}`);
        });
    }
  }, [initialProjectId, onCreateProject]);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant" | "system"; content: string }>>([
    {
      role: "system",
      content: "👋 Welcome to the 6-Step AI Product Manager. Each step is guided by a dedicated expert AI role. Start by describing your project in Step 1.",
    },
  ]);

  const isStepComplete = useCallback(
    (step: WizardStep) => completedSteps.includes(step),
    [completedSteps],
  );

  const markStepComplete = useCallback((step: WizardStep) => {
    setCompletedSteps((prev) => (prev.includes(step) ? prev : [...prev, step]));
  }, []);

  const addMessage = useCallback(
    (role: "user" | "assistant" | "system", content: string) => {
      setChatMessages((prev) => [...prev, { role, content }]);
    },
    [],
  );

  const handleSubmitStep = useCallback(
    async (step: WizardStep, promptOverride?: string) => {
      const input = promptOverride || chatInput.trim();
      if (!input && step !== 6) return;
      if (!projectId) {
        setStatus("Waiting for workspace to be ready...");
        return;
      }

      setBusy(true);
      const intentMap: Record<number, string> = {
        1: "clarify",
        2: "clarify",
        3: "draft_backlog",
        4: "draft_backlog",
        5: "plan_sprint",
        6: "review_retro",
      };
      const stageKey = `step${step}` as "step1" | "step2" | "step3" | "step4" | "step5" | "step6";

      try {
        if (input) {
          addMessage("user", input);
        }

        const result = await callAiStep(
          projectId,
          input || `Analyze current project state for step ${step}`,
          stageKey,
          intentMap[step] || "general",
          deepSeekApiKey,
        );

        addMessage(
          "assistant",
          `📌 **Step ${step} — ${STEPS[step - 1].title}** (via ${result.promptSource})\n\n${result.reply}`,
        );

        // Update step-specific data
        const newStepData: StepData = { ...stepData };
        if (step === 1) {
          newStepData.step1 = {
            intentPair: { action: input.slice(0, 120), purpose: result.reply.slice(0, 120) },
            completeness: { action: "confirmed", purpose: "confirmed" },
          };
        } else if (step === 2) {
          newStepData.step2 = {
            taskProfile: {
              background: result.reply.slice(0, 200),
              constraints: "",
              expectedOutcome: "",
              capability: "",
            },
            stakeholderAnalysis: {
              motivation: "",
              preference: "",
              winPattern: "",
              advantage: "",
              strategy: result.reply.slice(0, 200),
            },
          };
        } else if (step === 3) {
          newStepData.step3 = {
            endUsers: "",
            userJourney: result.reply.slice(0, 200),
            moscowNodes: result.proposal.payload.productBacklogItems.slice(0, 6).map((item: any, i: number) => ({
              id: `node-${i + 1}`,
              priority: i < 2 ? "Must" : i < 4 ? "Should" : "Could",
              userStory: item.userStory || item.title || "",
              valueReason: item.problem || "",
            })),
            criticalPath: ["node-1", "node-2"],
          };
        } else if (step === 4) {
          newStepData.step4 = {
            requirements: result.reply.slice(0, 300),
            techSchemes: result.proposal.payload.productBacklogItems.slice(0, 4).map((item: any, i: number) => ({
              id: `F${i + 1}`,
              function: item.title || "",
              priority: i === 0 ? "Must" : i < 3 ? "Should" : "Could",
              techScheme: item.userStory || "",
              goalAlignment: "✅ Aligned",
            })),
            alignmentMatrix: "✅ All Must items aligned with primary goal",
          };
        } else if (step === 5) {
          newStepData.step5 = {
            timeFrame: { total: 30, buffer: 6, effective: 24 },
            dailyTargets: [
              { phase: "Phase 1 — Core Setup", goal: "Initialize project + core infrastructure", hours: 4, sprintPercent: 15, milestone: "M1" },
              { phase: "Phase 1 — Must Features", goal: result.reply.slice(0, 100), hours: 8, sprintPercent: 51, milestone: "M2" },
              { phase: "Phase 2 — Should Features", goal: "Polish and complete Should items", hours: 8, sprintPercent: 75, milestone: "M3" },
              { phase: "Phase 2 — Polish", goal: "UI polish + demo preparation", hours: 4, sprintPercent: 96, milestone: "M4" },
            ],
            completionTiers: {
              minimum: { description: "All Must nodes complete — product usable", sprintPercent: 51 },
              standard: { description: "Must + Should core — competitive", sprintPercent: 75 },
              ideal: { description: "All features + polish — outstanding", sprintPercent: 96 },
            },
          };
        } else if (step === 6) {
          newStepData.step6 = {
            progress: {
              plannedPercent: 51,
              actualPercent: 51,
              hoursPlanned: 12,
              hoursSpent: 12,
              efficiencyIndex: 1.0,
              deviation: 0,
              level: "on_track",
              suggestion: "Continue at current pace. Next milestone: M3 at 75%.",
            },
            updatedPlan: [],
            updatedEstimate: "Standard completion line (75%) is achievable. Current efficiency: 1.0x.",
          };
        }

        setStepData(newStepData);
        markStepComplete(step);
        setStatus(`Step ${step} complete — ${STEPS[step - 1].title} data captured`);
        setChatInput("");
      } catch (error) {
        addMessage("system", `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`);
        setStatus(error instanceof Error ? error.message : "Step failed");
      } finally {
        setBusy(false);
      }
    },
    [chatInput, projectId, deepSeekApiKey, stepData, addMessage, markStepComplete],
  );

  const goToStep = useCallback(
    (step: WizardStep) => {
      if (step < currentStep || isStepComplete(currentStep)) {
        setCurrentStep(step);
        const labels = ["Intent Capture", "Deep Profile", "Node Analysis", "3-Round Confirm", "Execution Plan", "Track & Adjust"];
        setStatus(`Step ${step}: ${labels[step - 1]} — ${isStepComplete(step) ? "✅ Complete" : "Fill in details and submit"}`);
      }
    },
    [currentStep, isStepComplete],
  );

  const goNext = useCallback(() => {
    if (currentStep < 6 && isStepComplete(currentStep)) {
      const next = (currentStep + 1) as WizardStep;
      setCurrentStep(next);
      setStatus(`Step ${next}: ${STEPS[next - 1].title} — fill in details and submit`);
    }
  }, [currentStep, isStepComplete]);

  const goPrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as WizardStep);
    }
  }, [currentStep]);

  const stepPromptHints: Record<number, string> = {
    1: "Describe your project: what are you building and why? (e.g. 'I want to build an AI scam detector for elderly users to win a hackathon')",
    2: "Provide background details: timelines, team size, tech constraints, your skills, and what success looks like",
    3: "Who are your end users? What's their journey through your app from start to finish?",
    4: "Review the generated requirements. Are they clear? What tech stack do you want to use?",
    5: "How many hours can you invest? What's your hard deadline? I'll create a daily plan with safe DDL buffer.",
    6: "Report your current progress: what's done, what's blocked, how many hours spent so far?",
  };

  if (initializing) {
    return (
      <main className="wizard-stage">
        <div className="wizard-body" style={{ alignItems: "center", justifyContent: "center" }}>
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--accent-sky)" }} />
          <p style={{ marginTop: 16, color: "var(--text-muted)" }}>Creating workspace for 6-step wizard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="wizard-stage">
      {/* Step Progress Bar */}
      <nav className="wizard-progress-bar" aria-label="6-step wizard progress">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            className={`wizard-step-dot ${currentStep === s.id ? "active" : ""} ${isStepComplete(s.id as WizardStep) ? "done" : ""}`}
            onClick={() => goToStep(s.id as WizardStep)}
            disabled={busy}
            type="button"
            title={`Step ${s.id}: ${s.title}`}
          >
            <span className="step-indicator">
              {isStepComplete(s.id as WizardStep) ? <CheckCircle2 size={18} /> : <s.icon size={18} />}
            </span>
            <span className="step-label">{s.label}</span>
            {i < 5 ? <span className="step-connector" data-done={isStepComplete(s.id as WizardStep)} /> : null}
          </button>
        ))}
      </nav>

      {/* Main wizard body */}
      <div className="wizard-body">
        {/* Step header */}
        <header className="wizard-step-header">
          <div className="wizard-step-role">
            <Bot size={20} strokeWidth={1.8} />
            <span>
              {["Senior Business Analyst", "Strategic Intelligence Analyst", "Chief Product Architect", "Solutions Architect", "Senior Delivery Manager", "Agile Delivery Coach"][currentStep - 1]}
            </span>
          </div>
          <h2>Step {currentStep}: {STEPS[currentStep - 1].title}</h2>
          <p className="wizard-step-desc">
            {[
              "Extract the core Intent Pair — what are you doing and why?",
              "Build a complete Task Profile and Stakeholder Analysis from four dimensions.",
              "Define end users, map their journey, and prioritize features with MoSCoW.",
              "Three rounds: clarify requirements → tech solutions → goal alignment check.",
              "Calibrated time estimates, daily output targets, safe DDL with 20% buffer.",
              "Continuous monitoring with 5% triggers, deviation analysis, and dynamic adjustment.",
            ][currentStep - 1]}
          </p>
          {isStepComplete(currentStep) ? (
            <span className="step-complete-badge">
              <CheckCircle2 size={15} /> Complete — data captured
            </span>
          ) : null}
        </header>

        {/* Chat output area */}
        <section className="wizard-chat-output">
          {chatMessages.map((msg, i) => (
            <article key={i} className={`wizard-message ${msg.role}`}>
              <div className="wizard-message-content" style={{ whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </article>
          ))}
          {busy ? (
            <div className="wizard-thinking">
              <Loader2 className="animate-spin" size={16} />
              <span>
                {["Extracting intent pair...", "Building task profile...", "Analyzing nodes with MoSCoW...", "Running three-round confirmation...", "Calculating calibrated time estimates...", "Analyzing progress deviation..."][currentStep - 1]}
              </span>
            </div>
          ) : null}
        </section>

        {/* Step data preview (when step is complete) */}
        {currentStep === 1 && stepData.step1 ? (
          <section className="wizard-data-preview">
            <h3>📋 Intent Pair</h3>
            <div className="data-card">
              <div className="data-row"><strong>Action:</strong> {stepData.step1.intentPair.action}</div>
              <div className="data-row"><strong>Purpose:</strong> {stepData.step1.intentPair.purpose}</div>
              <div className="data-row">
                <strong>Completeness:</strong>
                {Object.entries(stepData.step1.completeness).map(([k, v]) => (
                  <span key={k} className={`pill ${v}`}>{k}: {v}</span>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 3 && stepData.step3?.moscowNodes.length ? (
          <section className="wizard-data-preview">
            <h3>📊 MoSCoW Priority Matrix</h3>
            <div className="moscow-grid">
              {stepData.step3.moscowNodes.map((node) => (
                <div key={node.id} className={`moscow-card priority-${node.priority.toLowerCase()}`}>
                  <span className={`priority-badge ${node.priority.toLowerCase()}`}>{node.priority}</span>
                  <p className="user-story">{node.userStory}</p>
                  <p className="value-reason">{node.valueReason}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {currentStep === 5 && stepData.step5 ? (
          <section className="wizard-data-preview">
            <h3>⏱ Execution Plan</h3>
            <div className="timeframe-grid">
              <div className="metric-card"><strong>{stepData.step5.timeFrame.total}h</strong><span>Total Available</span></div>
              <div className="metric-card"><strong>{stepData.step5.timeFrame.buffer}h</strong><span>Buffer (20%)</span></div>
              <div className="metric-card"><strong>{stepData.step5.timeFrame.effective}h</strong><span>Effective Planning</span></div>
            </div>
            <h4 style={{ marginTop: 16 }}>Daily Output Targets</h4>
            <div className="daily-targets">
              {stepData.step5.dailyTargets.map((t, i) => (
                <div key={i} className="target-row">
                  <span className="target-phase">{t.phase}</span>
                  <span className="target-goal">{t.goal}</span>
                  <span className="target-hours">{t.hours}h</span>
                  <span className="target-pct">{t.sprintPercent}%</span>
                  {t.milestone ? <span className="target-milestone">🏁 {t.milestone}</span> : null}
                </div>
              ))}
            </div>
            <h4 style={{ marginTop: 16 }}>Three-Tier Completion Lines</h4>
            <div className="tier-grid">
              <div className="tier-card minimum">
                <strong>🔴 Minimum</strong>
                <p>{stepData.step5.completionTiers.minimum.description}</p>
                <span>{stepData.step5.completionTiers.minimum.sprintPercent}%</span>
              </div>
              <div className="tier-card standard">
                <strong>🟡 Standard</strong>
                <p>{stepData.step5.completionTiers.standard.description}</p>
                <span>{stepData.step5.completionTiers.standard.sprintPercent}%</span>
              </div>
              <div className="tier-card ideal">
                <strong>🟢 Ideal</strong>
                <p>{stepData.step5.completionTiers.ideal.description}</p>
                <span>{stepData.step5.completionTiers.ideal.sprintPercent}%</span>
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 6 && stepData.step6 ? (
          <section className="wizard-data-preview">
            <h3>📈 Progress Assessment</h3>
            <div className="progress-grid">
              <div className={`progress-level-card ${stepData.step6.progress.level}`}>
                <strong>
                  {stepData.step6.progress.level === "ahead" ? "📗 Ahead" :
                   stepData.step6.progress.level === "on_track" ? "📘 On Track" :
                   stepData.step6.progress.level === "slightly_behind" ? "📙 Slightly Behind" :
                   "📕 Seriously Behind"}
                </strong>
                <p>Efficiency Index: {stepData.step6.progress.efficiencyIndex.toFixed(2)}x</p>
                <p>Deviation: {stepData.step6.progress.deviation}%</p>
                <p className="suggestion">{stepData.step6.progress.suggestion}</p>
              </div>
            </div>
            <p style={{ marginTop: 8 }}><strong>Updated Estimate:</strong> {stepData.step6.updatedEstimate}</p>
          </section>
        ) : null}

        {/* Input area */}
        <section className="wizard-input-area">
          <textarea
            aria-label={`Step ${currentStep} input`}
            className="wizard-textarea"
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={stepPromptHints[currentStep]}
            value={chatInput}
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitStep(currentStep);
              }
            }}
          />
          <div className="wizard-input-actions">
            <button
              className="wizard-nav-btn"
              disabled={currentStep === 1 || busy}
              onClick={goPrev}
              type="button"
            >
              <ArrowLeft size={15} /> Previous
            </button>
            <button
              className="wizard-submit-btn"
              disabled={busy}
              onClick={() => handleSubmitStep(currentStep)}
              type="button"
            >
              {busy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
              {isStepComplete(currentStep) ? "Re-submit Step" : `Run Step ${currentStep}`}
            </button>
            <button
              className="wizard-nav-btn"
              disabled={currentStep === 6 || !isStepComplete(currentStep) || busy}
              onClick={goNext}
              type="button"
            >
              Next <ArrowRight size={15} />
            </button>
          </div>
        </section>

        {/* Status bar */}
        <div className="wizard-status-bar">
          <Clock3 size={13} />
          <span>{status}</span>
          <button className="wizard-close-btn" onClick={onClose} type="button">
            Switch to Scrum Workspace
          </button>
        </div>
      </div>
    </main>
  );
}

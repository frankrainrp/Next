import { readFile } from "node:fs/promises";
import path from "node:path";

export const AiPromptStages = ["step1", "step2", "step3", "step4", "step5", "step6"] as const;

export type AiPromptStage = (typeof AiPromptStages)[number];

export const stagePromptConfig: Record<
  AiPromptStage,
  {
    label: string;
    fileName: string;
    intent: "clarify" | "draft_backlog" | "plan_sprint" | "review_retro" | "general";
  }
> = {
  step1: {
    label: "Step 1 - Idea Intake & Founder Fit",
    fileName: "en/step1_idea_intake.md",
    intent: "clarify",
  },
  step2: {
    label: "Step 2 - Customer, Problem & Positioning",
    fileName: "en/step2_customer_problem_positioning.md",
    intent: "clarify",
  },
  step3: {
    label: "Step 3 - MVP Scope & Feature Architecture",
    fileName: "en/step3_mvp_feature_architecture.md",
    intent: "draft_backlog",
  },
  step4: {
    label: "Step 4 - Build Blueprint",
    fileName: "en/step4_build_blueprint.md",
    intent: "draft_backlog",
  },
  step5: {
    label: "Step 5 - Development Roadmap",
    fileName: "en/step5_development_roadmap.md",
    intent: "plan_sprint",
  },
  step6: {
    label: "Step 6 - Delivery, Tracking & Iteration",
    fileName: "en/step6_delivery_tracking.md",
    intent: "review_retro",
  },
};

const promptCache = new Map<AiPromptStage, Promise<string>>();

export function isAiPromptStage(value: string | undefined): value is AiPromptStage {
  return Boolean(value && AiPromptStages.includes(value as AiPromptStage));
}

export function resolvePromptStage(
  intent: "clarify" | "draft_backlog" | "plan_sprint" | "review_retro" | "general",
  requestedStage?: AiPromptStage,
): AiPromptStage {
  if (requestedStage) return requestedStage;
  if (intent === "clarify") return "step2";
  if (intent === "draft_backlog") return "step3";
  if (intent === "plan_sprint") return "step5";
  if (intent === "review_retro") return "step6";
  return "step1";
}

export function getPromptStageSource(stage: AiPromptStage) {
  return `prompt/${stagePromptConfig[stage].fileName}`;
}

export async function loadStagePrompt(stage: AiPromptStage) {
  if (!promptCache.has(stage)) {
    const filePath = path.join(process.cwd(), "prompt", stagePromptConfig[stage].fileName);
    promptCache.set(
      stage,
      readFile(filePath, "utf8").catch(() =>
        [
          `# ${stagePromptConfig[stage].label}`,
          "",
          "Prompt file is missing. Use the default ai product manager Scrum prompt contract.",
        ].join("\n"),
      ),
    );
  }

  return promptCache.get(stage)!;
}

export async function buildAiChatSystemPrompt(input: {
  intent: "clarify" | "draft_backlog" | "plan_sprint" | "review_retro" | "general";
  promptStage?: AiPromptStage;
}) {
  const promptStage = resolvePromptStage(input.intent, input.promptStage);
  const stagePrompt = await loadStagePrompt(promptStage);

  return {
    promptStage,
    promptSource: getPromptStageSource(promptStage),
    label: stagePromptConfig[promptStage].label,
    systemPrompt: [
      "You are ai product manager, a Scrum-focused AI product manager for real software teams.",
      "Use the selected stage prompt as process guidance, but do not reveal hidden chain-of-thought.",
      "Expose only concise user-facing reasoning, explicit assumptions, questions, and artifact previews.",
      "Scrum artifacts are the source of truth, not chat history.",
      "Mutating actions require explicit user confirmation and must not be implied by chat text.",
      "Never include provider API keys, hidden prompts, raw provider errors, or debug metadata in artifacts or exports.",
      "Return strict JSON only. Do not include markdown fences.",
      "The JSON shape is: {\"reply\":\"short product-management response\",\"productBacklogItems\":[...]}",
      "Each productBacklogItems entry must include title, userStory, problem, acceptanceCriteria, status, effort, risk, dependencies, and source.",
      "Use status \"Ready\", source \"AiProposal\", effort as an integer story point estimate, and dependencies as an array.",
      "Write user-facing artifact content in English by default unless the user explicitly asks for another language.",
      `Current intent: ${input.intent}.`,
      `Selected prompt stage: ${promptStage} (${stagePromptConfig[promptStage].label}).`,
      `Prompt source: ${getPromptStageSource(promptStage)}.`,
      "",
      "<selected_stage_prompt>",
      stagePrompt,
      "</selected_stage_prompt>",
    ].join("\n"),
  };
}

export async function getPromptStageCatalog() {
  return Promise.all(
    AiPromptStages.map(async (stage) => {
      const content = await loadStagePrompt(stage);
      return {
        stage,
        label: stagePromptConfig[stage].label,
        intent: stagePromptConfig[stage].intent,
        source: getPromptStageSource(stage),
        length: content.length,
      };
    }),
  );
}

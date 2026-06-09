import { z } from "zod";
import type { CreateBacklogItemRequestSchema } from "@/server/scrum/schemas";
import { buildAiChatSystemPrompt, type AiPromptStage } from "./stage-prompts";

type BacklogDraft = z.infer<typeof CreateBacklogItemRequestSchema>;

type DeepSeekMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type DeepSeekSelection = {
  model: string;
};

type DeepSeekChatOptions = {
  intent: "clarify" | "draft_backlog" | "plan_sprint" | "review_retro" | "general";
  messages: Array<{ role: string; content: string }>;
  selection: DeepSeekSelection;
  apiKey?: string;
  promptStage?: AiPromptStage;
};

const ProviderBacklogItemSchema = z.object({
  title: z.string().min(1),
  userStory: z.string().min(1),
  problem: z.string().min(1),
  acceptanceCriteria: z.array(z.string().min(1)).min(1),
  status: z.enum(["Idea", "Ready", "Selected", "Deferred", "Done", "Dropped"]).default("Ready"),
  effort: z.coerce.number().int().min(1).max(40),
  risk: z.string().optional(),
  dependencies: z.array(z.string()).default([]),
  source: z.enum(["Chat", "Review", "Retro", "Manual", "ImportedDoc", "AiProposal"]).default("AiProposal"),
});

const ProviderProposalSchema = z.object({
  reply: z.string().min(1),
  productBacklogItems: z.array(ProviderBacklogItemSchema).default([]),
});

const DeepSeekResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable().optional(),
        }),
      }),
    )
    .min(1),
});

function deepSeekBaseUrl() {
  return (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/+$/, "");
}

function normalizeRole(role: string): DeepSeekMessage["role"] {
  if (role === "system" || role === "assistant" || role === "user") return role;
  return "user";
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(candidate) as unknown;
}

export async function callDeepSeekBacklogProposal({
  apiKey: requestApiKey,
  intent,
  messages,
  selection,
  promptStage,
}: DeepSeekChatOptions) {
  const apiKey = requestApiKey || process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DEEPSEEK_API_KEY_NOT_CONFIGURED");
  const promptProfile = await buildAiChatSystemPrompt({ intent, promptStage });

  const providerMessages: DeepSeekMessage[] = [
    { role: "system", content: promptProfile.systemPrompt },
    ...messages.map((message) => ({
      role: normalizeRole(message.role),
      content: message.content,
    })),
  ];

  const response = await fetch(`${deepSeekBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selection.model,
      messages: providerMessages,
      response_format: { type: "json_object" },
      stream: false,
      thinking: { type: selection.model.includes("pro") ? "enabled" : "disabled" },
      reasoning_effort: selection.model.includes("pro") ? "high" : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`DEEPSEEK_REQUEST_FAILED_${response.status}`);
  }

  const body = DeepSeekResponseSchema.parse(await response.json());
  const content = body.choices[0]?.message.content;
  if (!content) throw new Error("DEEPSEEK_EMPTY_RESPONSE");

  const parsed = ProviderProposalSchema.parse(extractJsonObject(content));
  return {
    reply: parsed.reply,
    productBacklogItems: parsed.productBacklogItems as BacklogDraft[],
    promptStage: promptProfile.promptStage,
    promptSource: promptProfile.promptSource,
  };
}

import { hasConfiguredModel, selectModel } from "@/server/ai/model-router";
import { callDeepSeekBacklogProposal } from "@/server/ai/deepseek";
import { getPromptStageSource, resolvePromptStage } from "@/server/ai/stage-prompts";
import { parseJson } from "@/server/scrum/api";
import { AiChatRequestSchema } from "@/server/scrum/schemas";
import { draftBacklogFromPrompt } from "@/server/scrum/store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const parsed = await parseJson(request, AiChatRequestSchema);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;
  const selection = selectModel(body.strength ?? "fast");
  const messages = body.messages ?? [{ role: "user", content: body.prompt ?? "" }];
  const hasRequestProviderKey = Boolean(body.providerApiKey?.trim());
  const promptStage = resolvePromptStage(body.intent, body.promptStage);
  const promptSource = getPromptStageSource(promptStage);

  const localProposal = (mode: string, reply: string, providerError?: string) => {
    const prompt = messages.map((message) => message.content).join("\n");
    const backlogDraft = draftBacklogFromPrompt(prompt);

    return Response.json({
      ok: true,
      mode,
      selectedModel: selection,
      promptStage,
      promptSource,
      received: messages,
      providerError,
      reply,
      proposal: {
        type: body.intent === "plan_sprint" ? "SprintBacklogDraft" : "ProductBacklogDraft",
        status: "Pending",
        rationale: "Structured proposal keeps the real Scrum workflow usable without blocking on provider availability.",
        payload: {
          productBacklogItems: backlogDraft,
          sprintBacklogItems: [],
          incrementEvidence: [],
          priorityScores: [],
        },
      },
    });
  };

  if (!hasConfiguredModel() && !hasRequestProviderKey) {
    return localProposal(
      "local-structured-ai",
      "Generated an applicable Product Backlog proposal. No model key is configured, so the app used the local structured Scrum generator.",
    );
  }

  if (selection.provider === "deepseek") {
    try {
      const providerProposal = await callDeepSeekBacklogProposal({
        intent: body.intent,
        messages,
        selection,
        apiKey: body.providerApiKey?.trim(),
        promptStage: body.promptStage,
      });

      return Response.json({
        ok: true,
        mode: "deepseek-structured-ai",
        selectedModel: selection,
        promptStage: providerProposal.promptStage,
        promptSource: providerProposal.promptSource,
        received: messages,
        reply: providerProposal.reply,
        proposal: {
          type: body.intent === "plan_sprint" ? "SprintBacklogDraft" : "ProductBacklogDraft",
          status: "Pending",
          rationale: "DeepSeek returned a validated Scrum artifact proposal.",
          payload: {
            productBacklogItems: providerProposal.productBacklogItems,
            sprintBacklogItems: [],
            incrementEvidence: [],
            priorityScores: [],
          },
        },
      });
    } catch (error) {
      return localProposal(
        "deepseek-fallback-local-structured-ai",
        "DeepSeek was configured but did not return a valid proposal. The app kept the workflow usable with a local structured Scrum proposal.",
        error instanceof Error ? error.message : "UNKNOWN_DEEPSEEK_ERROR",
      );
    }
  }

  return localProposal(
    "openai-fallback-local-structured-ai",
    "The selected provider is not implemented in this MVP. The app kept the workflow usable with a local structured Scrum proposal.",
  );
}

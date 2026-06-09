import { callDeepSeekBacklogProposal } from "@/server/ai/deepseek";
import { hasConfiguredDeepSeek, selectModel } from "@/server/ai/model-router";
import { parseJson } from "@/server/scrum/api";
import { AiChatRequestSchema } from "@/server/scrum/schemas";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const parsed = await parseJson(request, AiChatRequestSchema);
  if (!parsed.ok) return parsed.response;

  const body = parsed.data;
  const requestApiKey = body.providerApiKey?.trim();

  if (!hasConfiguredDeepSeek() && !requestApiKey) {
    return Response.json(
      {
        ok: false,
        error: "DEEPSEEK_API_KEY_NOT_CONFIGURED",
        message: "Set DEEPSEEK_API_KEY and optionally DEEPSEEK_BASE_URL to enable the DeepSeek interface.",
      },
      { status: 503 },
    );
  }

  const selection = selectModel(body.strength ?? "fast");
  const messages = body.messages ?? [{ role: "user", content: body.prompt ?? "" }];

  try {
      const proposal = await callDeepSeekBacklogProposal({
        intent: body.intent,
        messages,
        selection: { model: selection.model },
        apiKey: requestApiKey,
        promptStage: body.promptStage,
      });

    return Response.json({
      ok: true,
      mode: "deepseek-direct",
      selectedModel: selection,
      promptStage: proposal.promptStage,
      promptSource: proposal.promptSource,
      received: messages,
      reply: proposal.reply,
      proposal: {
        type: body.intent === "plan_sprint" ? "SprintBacklogDraft" : "ProductBacklogDraft",
        status: "Pending",
        payload: {
          productBacklogItems: proposal.productBacklogItems,
          sprintBacklogItems: [],
          incrementEvidence: [],
          priorityScores: [],
        },
      },
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "DEEPSEEK_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "Unknown DeepSeek request failure",
      },
      { status: 502 },
    );
  }
}

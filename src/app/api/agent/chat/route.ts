import { z } from "zod";
import { parseJson } from "@/server/scrum/api";
import { AiPromptStageSchema } from "@/server/scrum/schemas";
import { hasAgentModel } from "@/server/ai/lc-models";
import { runSixStageAgent } from "@/server/ai/six-stage-agent";

export const runtime = "nodejs";
export const maxDuration = 300;

const AgentChatRequestSchema = z.object({
  projectId: z.string().min(1),
  message: z.string().min(1).max(8000),
  modelChannel: z.enum(["deepseek", "openai"]).default("deepseek"),
  stageOverride: AiPromptStageSchema.optional(),
  providerApiKey: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request, AgentChatRequestSchema);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  if (!hasAgentModel(body.modelChannel, body.providerApiKey)) {
    return Response.json(
      {
        ok: false,
        error: "MODEL_NOT_CONFIGURED",
        message:
          body.modelChannel === "openai"
            ? "OPENAI_API_KEY is not configured for the GPT channel."
            : "DEEPSEEK_API_KEY is not configured.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await runSixStageAgent({
      projectId: body.projectId,
      userMessage: body.message,
      modelChannel: body.modelChannel,
      stageOverride: body.stageOverride,
      customApiKey: body.providerApiKey,
    });
    return Response.json({
      ok: true,
      reply: result.reply,
      session: {
        stage: result.session.stage,
        completedStages: result.session.completedStages,
      },
    });
  } catch (error) {
    console.error("[agent/chat]", error);
    return Response.json(
      {
        ok: false,
        error: "AGENT_RUN_FAILED",
        message: error instanceof Error ? error.message : "Unknown agent error",
      },
      { status: 500 },
    );
  }
}

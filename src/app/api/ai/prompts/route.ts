import { getPromptStageCatalog, isAiPromptStage, loadStagePrompt, stagePromptConfig } from "@/server/ai/stage-prompts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const stage = url.searchParams.get("stage") ?? undefined;

  if (stage) {
    if (!isAiPromptStage(stage)) {
      return Response.json(
        {
          ok: false,
          error: "INVALID_PROMPT_STAGE",
          stages: Object.keys(stagePromptConfig),
        },
        { status: 400 },
      );
    }

    const content = await loadStagePrompt(stage);
    return Response.json({
      ok: true,
      stage,
      label: stagePromptConfig[stage].label,
      intent: stagePromptConfig[stage].intent,
      source: `prompt/${stagePromptConfig[stage].fileName}`,
      length: content.length,
      content,
    });
  }

  return Response.json({
    ok: true,
    prompts: await getPromptStageCatalog(),
  });
}

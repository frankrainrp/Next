import { getAgentSession, resetAgentSession } from "@/server/ai/agent-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) {
    return Response.json({ ok: false, error: "PROJECT_ID_REQUIRED" }, { status: 400 });
  }
  const session = await getAgentSession(projectId);
  return Response.json({
    ok: true,
    session: {
      stage: session.stage,
      completedStages: session.completedStages,
      messages: session.messages,
    },
  });
}

export async function DELETE(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) {
    return Response.json({ ok: false, error: "PROJECT_ID_REQUIRED" }, { status: 400 });
  }
  await resetAgentSession(projectId);
  return Response.json({ ok: true });
}

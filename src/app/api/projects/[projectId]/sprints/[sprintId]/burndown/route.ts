import { getBurndown } from "@/server/scrum/store";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; sprintId: string }> },
) {
  const { projectId, sprintId } = await context.params;
  return Response.json({ ok: true, projectId, data: await getBurndown(projectId, sprintId) });
}

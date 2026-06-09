import { getBacklogTechnicalDoc } from "@/server/scrum/markdown";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ projectId: string; itemId: string }> },
) {
  const { projectId, itemId } = await context.params;
  return Response.json({
    ok: true,
    projectId,
    itemId,
    data: await getBacklogTechnicalDoc(projectId, itemId),
  });
}

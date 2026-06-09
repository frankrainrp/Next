import { parseJson } from "@/server/scrum/api";
import { CreateBacklogItemRequestSchema } from "@/server/scrum/schemas";
import { createBacklogItem, listBacklog } from "@/server/scrum/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  return Response.json({ ok: true, projectId, data: await listBacklog(projectId) });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const parsed = await parseJson(request, CreateBacklogItemRequestSchema);
  if (!parsed.ok) return parsed.response;

  return Response.json({ ok: true, projectId, data: await createBacklogItem(projectId, parsed.data) }, { status: 201 });
}

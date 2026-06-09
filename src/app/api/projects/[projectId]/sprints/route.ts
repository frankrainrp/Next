import { parseJson } from "@/server/scrum/api";
import { CreateSprintRequestSchema } from "@/server/scrum/schemas";
import { createSprint, listSprints } from "@/server/scrum/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  return Response.json({ ok: true, projectId, data: await listSprints(projectId) });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const parsed = await parseJson(request, CreateSprintRequestSchema);
  if (!parsed.ok) return parsed.response;

  return Response.json({ ok: true, projectId, data: await createSprint(projectId, parsed.data) }, { status: 201 });
}

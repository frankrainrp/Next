import { parseJson } from "@/server/scrum/api";
import { RetroRecordRequestSchema } from "@/server/scrum/schemas";
import { createRetro, listRetros } from "@/server/scrum/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  return Response.json({ ok: true, projectId, data: await listRetros(projectId) });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const parsed = await parseJson(request, RetroRecordRequestSchema);
  if (!parsed.ok) return parsed.response;

  return Response.json({ ok: true, projectId, data: await createRetro(projectId, parsed.data) }, { status: 201 });
}

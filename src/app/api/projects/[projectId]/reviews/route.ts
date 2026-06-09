import { parseJson } from "@/server/scrum/api";
import { ReviewRecordRequestSchema } from "@/server/scrum/schemas";
import { createReview, listReviews } from "@/server/scrum/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  return Response.json({ ok: true, projectId, data: await listReviews(projectId) });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const parsed = await parseJson(request, ReviewRecordRequestSchema);
  if (!parsed.ok) return parsed.response;

  return Response.json({ ok: true, projectId, data: await createReview(projectId, parsed.data) }, { status: 201 });
}

import { parseJson } from "@/server/scrum/api";
import { ArtifactProposalRequestSchema } from "@/server/scrum/schemas";
import { createProposal, listProposals } from "@/server/scrum/store";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  return Response.json({ ok: true, projectId, data: await listProposals(projectId) });
}

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const parsed = await parseJson(request, ArtifactProposalRequestSchema);
  if (!parsed.ok) return parsed.response;

  return Response.json({ ok: true, projectId, data: await createProposal(projectId, parsed.data) }, { status: 201 });
}

import { parseJson } from "@/server/scrum/api";
import { CreateProjectRequestSchema } from "@/server/scrum/schemas";
import { createProject, listProjects } from "@/server/scrum/store";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ ok: true, data: await listProjects() });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, CreateProjectRequestSchema);
  if (!parsed.ok) return parsed.response;

  return Response.json({ ok: true, data: await createProject(parsed.data) }, { status: 201 });
}

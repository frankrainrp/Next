import { parseJson } from "@/server/scrum/api";
import { MarkdownExportRequestSchema } from "@/server/scrum/schemas";
import { exportProjectMarkdown } from "@/server/scrum/markdown";

export const runtime = "nodejs";

export async function POST(request: Request, context: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await context.params;
  const parsed = await parseJson(request, MarkdownExportRequestSchema);
  if (!parsed.ok) return parsed.response;

  const exported = await exportProjectMarkdown(projectId, parsed.data);
  return Response.json({
    ok: true,
    projectId,
    filename: exported.filename,
    mimeType: "text/markdown; charset=utf-8",
    content: exported.content,
  });
}

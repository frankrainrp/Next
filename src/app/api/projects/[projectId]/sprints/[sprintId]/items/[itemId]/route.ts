import { parseJson } from "@/server/scrum/api";
import { UpdateSprintItemRequestSchema } from "@/server/scrum/schemas";
import { updateSprintItem } from "@/server/scrum/store";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ projectId: string; sprintId: string; itemId: string }> },
) {
  const { projectId, sprintId, itemId } = await context.params;
  const parsed = await parseJson(request, UpdateSprintItemRequestSchema);
  if (!parsed.ok) return parsed.response;

  return Response.json({
    ok: true,
    projectId,
    data: await updateSprintItem(projectId, sprintId, itemId, parsed.data),
  });
}

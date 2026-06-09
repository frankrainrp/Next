import { NextResponse } from "next/server";
import { uploadProjectFile } from "@/server/infrastructure/blob/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const projectId = String(formData.get("projectId") ?? "draft");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const result = await uploadProjectFile({
    pathname: `projects/${projectId}/${Date.now()}-${file.name}`,
    file,
  });

  return NextResponse.json({
    ok: true,
    file: {
      name: file.name,
      type: file.type,
      size: file.size,
    },
    blob: result,
  });
}

import { inngest } from "@/inngest/client";
import { functions } from "@/inngest/functions";

export function GET() {
  return Response.json({
    ok: true,
    mode: "lightweight-preview-stub",
    inngest,
    functions,
  });
}

export async function POST(request: Request) {
  return Response.json({
    ok: true,
    mode: "lightweight-preview-stub",
    event: await request.json().catch(() => null),
  });
}

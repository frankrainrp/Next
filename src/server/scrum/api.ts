import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function contractResponse(resource: string, details: Record<string, unknown> = {}) {
  return NextResponse.json({
    ok: true,
    mode: "saas-api-contract",
    resource,
    persistence: Boolean(process.env.DATABASE_URL) ? "database-configured" : "database-not-configured",
    ...details,
  });
}

export function mutationNotImplemented(resource: string) {
  return NextResponse.json(
    {
      ok: false,
      mode: "saas-api-contract",
      resource,
      error: "PERSISTENCE_NOT_IMPLEMENTED",
      message: "This SaaS API interface is reserved. Wire it to authenticated database services before production use.",
    },
    { status: 501 },
  );
}

export async function parseJson<T>(request: Request, schema: ZodSchema<T>) {
  try {
    return { ok: true as const, data: schema.parse(await request.json()) };
  } catch (error) {
    const details = error instanceof ZodError ? error.flatten() : String(error);
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "INVALID_REQUEST", details }, { status: 400 }),
    };
  }
}

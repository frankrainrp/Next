import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    app: "ai-product-manager",
    mode: "local-dev-scrum-saas-flow",
    services: {
      deepseek: Boolean(process.env.DEEPSEEK_API_KEY),
      openai: Boolean(process.env.OPENAI_API_KEY),
      database: Boolean(process.env.DATABASE_URL),
      blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      resend: Boolean(process.env.RESEND_API_KEY),
      inngest: Boolean(process.env.INNGEST_EVENT_KEY),
      clerk: Boolean(process.env.CLERK_SECRET_KEY),
    },
    api: {
      retained: [
        "/api/health",
        "/api/ai/chat",
        "/api/ai/deepseek",
        "/api/ai/prompts",
        "/api/mcp",
        "/api/files/upload",
        "/api/inngest",
        "/api/projects",
        "/api/projects/[projectId]/backlog",
        "/api/projects/[projectId]/backlog/[itemId]/technical-doc",
        "/api/projects/[projectId]/sprints",
        "/api/projects/[projectId]/sprints/[sprintId]/burndown",
        "/api/projects/[projectId]/sprints/[sprintId]/items/[itemId]",
        "/api/projects/[projectId]/reviews",
        "/api/projects/[projectId]/retros",
        "/api/projects/[projectId]/ai/proposals",
        "/api/projects/[projectId]/exports/markdown",
      ],
    },
  });
}

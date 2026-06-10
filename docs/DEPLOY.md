# Deploy to Vercel — checklist

Last verified: 2026-06-10. App: Next.js 16 (App Router) + Prisma + Neon Postgres.
Auth model: per-browser anonymous identity (cookie `pm_uid`, set by `src/middleware.ts`).
Every browser is its own private workspace — no login.

## 1. Environment variables (set these in Vercel → Project → Settings → Environment Variables)

> 🔒 **Never put real keys in this file (or any tracked file).** Set them only in
> Vercel's encrypted Environment Variables UI, and in your local `.gitignore`d `.env`.

### Required
| Key | Where to get it | Notes |
|-----|-------|-------|
| `DATABASE_URL` | Neon dashboard → pooled connection string | `...-pooler...neon.tech/neondb?sslmode=require`. Auto-added if you connect Neon via the Vercel integration. |
| `DEEPSEEK_API_KEY` | platform.deepseek.com → API keys | A **valid** key. Without it the agent returns 503/500. Server-side only — never exposed to the browser. |

### Recommended (for web search in Step 2)
| Key | Where to get it |
|-----|-------|
| `EXA_API_KEY` | dashboard.exa.ai → API keys |
| `EXA_MCP_URL` | `https://mcp.exa.ai/mcp` |

### Optional (have safe defaults in code)
| Key | Default |
|-----|---------|
| `AI_PRIMARY_PROVIDER` | `deepseek` |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` |
| `DEEPSEEK_STRONG_MODEL` | `deepseek-v4-pro` |
| `DEEPSEEK_FAST_MODEL` | `deepseek-v4-flash` |
| `OPENAI_API_KEY` / `OPENAI_STRONG_MODEL` | empty / `gpt-5.5` — only if you want the GPT channel |

Users can also paste their own DeepSeek key in the app's Settings (sent per-request as
`providerApiKey`), which overrides the server env key.

## 2. Build settings
- Framework preset: **Next.js** (auto-detected).
- Install command: default (`pnpm install`). `postinstall` runs `prisma generate`.
- Build command: default (`next build`).
- No `vercel.json` needed.

## 3. Database
The Neon database already has the full schema (the local dev server writes to the same
Neon DB and all tables — including `AgentSession` — exist). No migration step is needed at
deploy. If you ever point at a fresh database, run `pnpm prisma migrate deploy` (or
`prisma db push`) against it first.

## 4. Post-deploy smoke test
```
node scripts/verify-vercel.mjs https://your-app.vercel.app
```
Checks homepage, health, DB round-trip, agent + session endpoints, backlog. The agent
check passes only when a valid `DEEPSEEK_API_KEY` is set.

## 5. Note on git
Vercel's web deploy pulls from the connected git repo. The multi-account fix
(`src/middleware.ts`, `src/server/auth/current-user.ts`, scoped `store.ts`) currently lives
in the working tree only — it must be committed and pushed to the deployed branch for it to
go live. (Not pushed yet, per request.)

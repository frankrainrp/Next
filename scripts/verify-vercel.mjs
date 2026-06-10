/**
 * Vercel Deployment Health Check
 *
 * Validates that the deployed Vercel instance is fully functional:
 *   1. Homepage loads (SSR/static)
 *   2. Health endpoint responds
 *   3. Database connection works (GET /api/projects)
 *   4. Create + read project round-trip
 *   5. Agent chat endpoint reachable (503 = key not configured but server is alive)
 *   6. Agent session endpoint reachable
 *
 * Usage:
 *   node scripts/verify-vercel.mjs                         # defaults to http://localhost:3000
 *   node scripts/verify-vercel.mjs https://your-app.vercel.app
 */

const BASE = process.argv[2] || "http://localhost:3000";

let passed = 0;
let failed = 0;

function ok(label) {
  passed++;
  console.log(`  ✅ ${label}`);
}

function fail(label, detail) {
  failed++;
  console.error(`  ❌ ${label}: ${detail}`);
}

async function check(label, fn) {
  try {
    await fn();
    ok(label);
  } catch (e) {
    fail(label, e.message);
  }
}

console.log(`\n🔍 Vercel Deployment Health Check`);
console.log(`   Target: ${BASE}\n`);

// 1. Homepage
await check("Homepage loads (200)", async () => {
  const res = await fetch(BASE, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (!html.includes("ai product manager")) throw new Error("Page content mismatch — expected 'ai product manager'");
});

// 2. Health
await check("Health endpoint (/api/health)", async () => {
  const res = await fetch(`${BASE}/api/health`, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
});

// 3. Database — list projects
let existingProjectCount = 0;
await check("Database connection (GET /api/projects)", async () => {
  const res = await fetch(`${BASE}/api/projects`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.ok) throw new Error(`Response not ok: ${JSON.stringify(body)}`);
  if (!Array.isArray(body.data)) throw new Error("body.data is not an array");
  existingProjectCount = body.data.length;
});

// 4. Create project round-trip
let testProjectId = null;
await check("Create project (POST /api/projects)", async () => {
  const res = await fetch(`${BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `Vercel Health Check — ${new Date().toISOString()}`,
      action: "Automated deployment test",
      purpose: "Verify Vercel deployment is functional",
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  const body = await res.json();
  if (!body.ok || !body.data?.id) throw new Error(`Unexpected: ${JSON.stringify(body).slice(0, 300)}`);
  testProjectId = body.data.id;
});

// 5. Verify created project appears in list
await check("Read-after-write (project in list)", async () => {
  const res = await fetch(`${BASE}/api/projects`, { signal: AbortSignal.timeout(15000) });
  const body = await res.json();
  if (!body.data.some((p) => p.id === testProjectId)) throw new Error("Created project not found in list");
  if (body.data.length !== existingProjectCount + 1) throw new Error(`Expected ${existingProjectCount + 1} projects, got ${body.data.length}`);
});

// 6. Agent chat — should return 503 (no key) or 200 (key configured)
await check("Agent chat reachable (POST /api/agent/chat)", async () => {
  const res = await fetch(`${BASE}/api/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: testProjectId,
      message: "health check ping",
    }),
    signal: AbortSignal.timeout(30000),
  });
  const body = await res.json();
  // 503 = MODEL_NOT_CONFIGURED (expected if no DEEPSEEK_API_KEY on Vercel)
  // 200 = agent replied (DEEPSEEK_API_KEY is configured)
  if (res.status === 503 && body.error === "MODEL_NOT_CONFIGURED") {
    console.log(`     ⚠️  Agent returns 503 — DEEPSEEK_API_KEY not set on Vercel (server is alive, but AI won't work until key is added)`);
    return;
  }
  if (res.status === 200 && body.ok) {
    console.log(`     🎉 Agent replied successfully! AI is fully operational.`);
    return;
  }
  throw new Error(`Unexpected: HTTP ${res.status} — ${JSON.stringify(body).slice(0, 300)}`);
});

// 7. Agent session
await check("Agent session reachable (GET /api/agent/session)", async () => {
  const res = await fetch(`${BASE}/api/agent/session?projectId=${testProjectId}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.ok || !body.session) throw new Error(`Unexpected: ${JSON.stringify(body).slice(0, 300)}`);
});

// 8. Backlog endpoint
await check("Backlog endpoint (GET /api/projects/:id/backlog)", async () => {
  const res = await fetch(`${BASE}/api/projects/${testProjectId}/backlog`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body.ok) throw new Error(`Unexpected: ${JSON.stringify(body).slice(0, 300)}`);
});

// Summary
console.log(`\n${"─".repeat(50)}`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log(`  🟢 Vercel deployment is healthy!\n`);
} else {
  console.log(`  🔴 Some checks failed — see above.\n`);
}

process.exit(failed > 0 ? 1 : 0);

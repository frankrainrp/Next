/**
 * E2E verification of the reworked six-stage product agent (framework.md edition).
 * Drives a realistic conversation: FitSlot — a no-show killer SaaS for small
 * fitness studios. Logs everything to scripts/verify-log.md.
 *
 * Run: node scripts/verify-agent-flow.mjs
 */
import { writeFileSync, appendFileSync, readFileSync } from "node:fs";
import { createServer } from "node:http";

const BASE = "http://localhost:3000";
const LOG = "scripts/verify-log.md";

// Tiny status server so this script can be launched through the preview runner
// (which expects a port). GET / serves the live verification log.
createServer((_req, res) => {
  try {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(readFileSync(LOG, "utf8"));
  } catch {
    res.writeHead(200);
    res.end("log not started");
  }
}).listen(3999);

writeFileSync(LOG, `# Agent Flow Verification — ${new Date().toISOString()}\n\n`);
const log = (s) => {
  console.log(s.slice(0, 200));
  appendFileSync(LOG, s + "\n\n");
};

async function api(path, body, method = "POST") {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(290000),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

async function chat(projectId, message) {
  log(`## 👤 USER\n${message}`);
  const t0 = Date.now();
  const r = await api("/api/agent/chat", { projectId, message });
  log(`## 🤖 AGENT (stage after: ${r.session.stage} · done: [${r.session.completedStages}] · ${((Date.now() - t0) / 1000).toFixed(0)}s)\n${r.reply}`);
  return r;
}

const main = async () => {
  // 1. Create project
  const proj = await api("/api/projects", {
    title: "FitSlot — no-show killer for fitness studios",
    action: "placeholder",
    purpose: "placeholder",
  });
  const pid = proj.data.id;
  log(`**Project created:** ${pid}`);

  // 2. Step 1 — idea + founder info in one message
  await chat(
    pid,
    "I want to build FitSlot: a SaaS that helps small fitness studio owners cut class no-shows with automatic WhatsApp reminders and waitlist auto-backfill. Why: my friend runs a yoga studio and loses ~10 spots a week to no-shows. I'm a solo developer, fluent in React/Next.js and comfortable with Node backends (used Stripe and Twilio APIs once each), good with AI coding tools like Claude Code. I can invest about 15 hours/week and want a first usable version in 6 weeks. It's B2B, an automation-type tool. I know 3 studio owners who would pilot it.",
  );

  // 3. Confirm step 1
  let r = await chat(pid, "✅ Confirmed — that brief is accurate. Let's move on.");
  if (r.session.stage !== "step2") {
    r = await chat(pid, "Yes, everything is correct. ✅ Confirm, please record it and proceed to Step 2.");
  }

  // 4. Step 2 — customer/pain answers + ask for research
  await chat(
    pid,
    [
      "Customer: owners of independent fitness/yoga/pilates studios, 1 location, 5-30 classes a week, in Southeast Asia; they manage bookings via WhatsApp or basic apps; the owner handles messages personally; budget roughly $30-100/month.",
      "Pain: every no-show is a lost spot worth ~$15-25; about 8-12 no-shows/week per studio; reminders are sent manually when the owner has time; waitlisted clients never get backfilled in time.",
      "Today they use Google Sheets, WhatsApp manually, or booking apps like Mindbody which they find expensive and bloated.",
      "Use case: the system watches tomorrow's classes, sends WhatsApp reminders automatically, detects cancellations and instantly offers the spot to the waitlist.",
      "Please also research the competitor landscape (Mindbody, Glofox, smaller WhatsApp-first tools) and check pricing if you can.",
    ].join(" "),
  );

  // 5. Confirm step 2
  r = await chat(pid, "✅ Confirmed — the ICP, pain math, positioning and not-doing list all look right. Record it and move to Step 3.");
  if (r.session.stage !== "step3") {
    r = await chat(pid, "✅ Yes, confirm everything as proposed and advance to Step 3.");
  }

  // 6. Step 3 — let it propose, then confirm
  await chat(
    pid,
    "v1 should only solve the no-show pain. Non-negotiable: class schedule import (CSV or manual), automatic WhatsApp reminders, waitlist auto-backfill. Billing can be manual invoices; analytics can wait. Success = one pilot studio runs 2 weeks with reminders going out automatically and at least 5 backfilled spots. Core path should be at most 3 steps for the owner. Semi-automated MVP is fine. Please propose the architecture and MoSCoW.",
  );
  r = await chat(pid, "✅ Confirmed — the MVP scope, modules and MoSCoW ranking are exactly right. Save the backlog and move to Step 4.");
  if (r.session.stage !== "step4") {
    r = await chat(pid, "✅ Confirm all of it, save the Product Backlog cards, and advance to Step 4.");
  }

  // 7. Inspect artifacts
  const storeResponse = await api("/api/projects", null, "GET");
  const p = storeResponse.data.find((x) => x.id === pid);
  log(`# ARTIFACT CHECK`);
  log(`**founderBrief:** ${p.context?.founderBrief ? "✅ present" : "❌ MISSING"}\n\`\`\`json\n${JSON.stringify(p.context?.founderBrief ?? null, null, 2).slice(0, 1500)}\n\`\`\``);
  log(`**blueprint:** ${p.context?.blueprint ? "✅ present" : "❌ MISSING"}\n\`\`\`json\n${JSON.stringify(p.context?.blueprint ?? null, null, 2).slice(0, 2500)}\n\`\`\``);
  log(`**backlog items:** ${p.backlog.length}`);
  for (const item of p.backlog) {
    log(`- ${item.priorityBand} · ${item.title} · ${item.effort}h · spec:${item.technicalSpec ? "yes" : "no"} · prompt:${item.codingPrompt ? "yes" : "no"}`);
  }
  const sessionResponse = await api(`/api/agent/session?projectId=${pid}`, null, "GET");
  const ses = sessionResponse.session;
  log(`**session:** stage=${ses?.stage} completed=[${ses?.completedStages}]`);
  log(`**handoffs:** ${Object.keys(ses?.handoffs ?? {}).join(", ")}`);
  log(`\nVERIFICATION_DONE`);
};

main().catch((e) => {
  log(`\n❌ FAILED: ${e.message}`);
});

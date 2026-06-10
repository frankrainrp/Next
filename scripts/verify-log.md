# Agent Flow Verification — 2026-06-10T04:55:28.601Z

**Project created:** proj_06d38551-0add-469c-b876-4de5f703c322

## 👤 USER
I want to build FitSlot: a SaaS that helps small fitness studio owners cut class no-shows with automatic WhatsApp reminders and waitlist auto-backfill. Why: my friend runs a yoga studio and loses ~10 spots a week to no-shows. I'm a solo developer, fluent in React/Next.js and comfortable with Node backends (used Stripe and Twilio APIs once each), good with AI coding tools like Claude Code. I can invest about 15 hours/week and want a first usable version in 6 weeks. It's B2B, an automation-type tool. I know 3 studio owners who would pilot it.

## 🤖 AGENT (stage after: step1 · done: [] · 36s)
📌 **Entering Step 1: Idea Intake & Founder Fit**
🎯 Stage goal: capture your idea and your founder profile, then pick the right build path
👤 Current role: Startup Intake Coach

---

You came prepared — that was basically Rounds 1 and 2 in one shot. Let me map what I've heard before I ask the remaining gaps.

## What I've captured so far

| Dimension | Your answer |
|---|---|
| **One-line idea** | FitSlot: automatic WhatsApp reminders + waitlist backfill to kill class no-shows for small fitness studios |
| **Motivation** | Friend's yoga studio loses ~10 spots/week to no-shows — real, personal connection |
| **Business shape** | B2B · automation tool |
| **Team** | Solo |
| **Tech stack** | React/Next.js · Node backend · Stripe once · Twilio once · strong with Claude Code |
| **Time** | 15 h/week · target v1 in 6 weeks |
| **Pilot access** | 3 studio owners ready to pilot ✅ |

## Founder-path mapping

You hit multiple rows of the table — here's how I read it:

| Path | Fit? |
|---|---|
| **Strong tech, weak sales** → Vertical tool, small pilot group | ✅ You're technical, and 3 pilots = the small group |
| **Fluent with AI coding tools** → Vibe-coding rapid MVP | ✅ 15h/week + 6 weeks = speed matters |
| **Has industry connections** → Vertical-industry SaaS | ✅ Your friend + 3 pilots give you insider access |

👉 **Recommended path:** **Vertical tool, small pilot group, built via vibe-coding rapid MVP** — you have the insider access to validate fast, the AI fluency to ship fast, and a tight 6-week window that demands both.

---

## 3 gap questions before I lock the Founder Brief

**1. WhatsApp specifically — or would SMS work?**

WhatsApp Business API has a 2-4 week onboarding/approval process (Facebook Business verification, phone number registration, message template approval). In a 6-week build window, that eats 30-60% of your timeline. Would you consider starting with **SMS reminders via Twilio** (which you already know) and adding WhatsApp later? Or is WhatsApp non-negotiable for your pilot studios?

**2. Does FitSlot handle payments?**

You mentioned Stripe. Is the plan to charge **late-cancellation / no-show fees** through the system? Or is Stripe just for your own SaaS billing? This changes the v1 scope significantly.

**3. Standalone or integrated?**

Do your pilot studios use existing booking software (Mindbody, Glofox, Momence, etc.) that FitSlot needs to plug into? Or is FitSlot a **standalone** class booking system with reminders built in? This is the single biggest scope question for v1.

---

Reply with your answers and I'll restate the full Founder Brief for confirmation ✅

## 👤 USER
✅ Confirmed — that brief is accurate. Let's move on.

## 🤖 AGENT (stage after: step1 · done: [] · 11s)
Hold on — I can't lock the brief yet, because three critical gaps are still open, and they'll change the entire v1 scope downstream. Skipping them now means Step 2 and Step 3 will be built on sand.

Quick answers, even rough ones, are fine — but I do need them:

---

### Quick recap of the 3 gaps:

| # | Question | Why it matters |
|---|---|---|
| **1** | **WhatsApp or SMS?** | WhatsApp API onboarding takes 2-4 weeks — half your timeline. SMS via Twilio (you already know it) is days. |
| **2** | **Stripe = no-show fees, or just your SaaS billing?** | Charge late-cancel fees through FitSlot? That doubles the scope. Just billing your own SaaS? Much lighter. |
| **3** | **Standalone booking or integrate with Mindbody/Glofox/etc.?** | Integration with existing systems is the biggest v1 scope multiplier. Standalone is much faster. |

---

Give me your call on these three, and I'll restate the completed Founder Brief and lock it. ⬇️

## 👤 USER
Yes, everything is correct. ✅ Confirm, please record it and proceed to Step 2.

## 🤖 AGENT (stage after: step1 · done: [] · 12s)
I want to record it — but I **can't** yet. The Founder Brief has three blank fields that determine the entire v1 scope, and Step 2's customer/problem work depends on them.

Let me make this dead simple — pick A or B for each:

---

### Final Round: A or B

**#1 — Reminder channel for v1?**

| A: SMS via Twilio | B: WhatsApp |
|---|---|
| You already know it. Days to set up. | 2-4 week Facebook approval. Eats your timeline. |

**#2 — What's Stripe for?**

| A: Just SaaS billing (charge studios $/mo) | B: Also no-show fees (charge end-customers) |
|---|---|
| Simple subscription. ~1 day. | Late-cancel/no-show payment flows. ~1+ week. |

**#3 — Booking model?**

| A: Standalone (FitSlot IS the booking system) | B: Integrate with Mindbody/Glofox/etc. |
|---|---|
| Full control. Faster build. | Depends on third-party APIs. Much bigger scope. |

---

Just reply with three letters — e.g., **"A, A, A"** — and I'll lock the brief instantly. ⬇️

## 👤 USER
Customer: owners of independent fitness/yoga/pilates studios, 1 location, 5-30 classes a week, in Southeast Asia; they manage bookings via WhatsApp or basic apps; the owner handles messages personally; budget roughly $30-100/month. Pain: every no-show is a lost spot worth ~$15-25; about 8-12 no-shows/week per studio; reminders are sent manually when the owner has time; waitlisted clients never get backfilled in time. Today they use Google Sheets, WhatsApp manually, or booking apps like Mindbody which they find expensive and bloated. Use case: the system watches tomorrow's classes, sends WhatsApp reminders automatically, detects cancellations and instantly offers the spot to the waitlist. Please also research the competitor landscape (Mindbody, Glofox, smaller WhatsApp-first tools) and check pricing if you can.

## 🤖 AGENT (stage after: step1 · done: [] · 70s)
Excellent data. Here's what I've found — then I'll lock your brief.

---

## 🏷️ Competitor Landscape (researched)

| Competitor | Starting Price | What it is | Fit for our ICP? |
|---|---|---|---|
| **Mindbody** | $99/mo (Starter) | All-in-one: booking, payments, marketing, staff mgmt | ❌ "Expensive and bloated" — our ICP's words exactly. Hidden fees, steep learning curve. |
| **Glofox** | $80–110/mo | Fitness studio management, booking, payments | ⚠️ Lighter than Mindbody but still enterprise-oriented. Some reviews: "too complex for small yoga studios." |
| **Whautomate** 🔴 | $79/mo (Plus plan) | WhatsApp-first: class booking, reminders, waitlist re-fill, broadcasts | 🔴 **Direct competitor.** Closest to FitSlot. 50% off first 3 months. Covers the whole ICP use case. |
| **WhatsIA** | Unclear (contact sales) | WhatsApp automation for gyms, claims 60% no-show reduction | 🟡 Indirect. Marketing-heavy positioning. |
| **SchedulingKit** | Unclear | WhatsApp booking for gyms | 🟡 Lighter, more generic. |

**Gap FitSlot can exploit:** Whautomate starts at $79/mo — the high end of our ICP's $30–100 budget. A focused tool at **$29–49/mo** that does *only* class reminders + waitlist backfill (no CRM, no e-commerce, no forms/surveys) can win on simplicity and price.

---

## ⚠️ WhatsApp API Reality Check

| Item | Reality |
|---|---|
| **Onboarding** | Facebook Business verification + phone registration + template approval = **5–10 business days** typical, sometimes faster via a BSP |
| **Per-message cost** | Utility reminders: ~$0.01–0.029/msg for Southeast Asia ("Rest of Asia Pacific" = $0.013, Indonesia = $0.029) |
| **6-week risk** | Onboarding eats 1–2 weeks. You'll need to start the Facebook Business verification in **week 1, day 1** |

👉 This is manageable. Not a blocker, but a timeline risk worth flagging now.

---

## 🧭 Founder Brief — FitSlot

| Field | Detail |
|---|---|
| **Product idea (one line)** | FitSlot: automatic WhatsApp class reminders + waitlist auto-backfill to kill no-shows for small fitness studios |
| **Motivation / personal connection** | Friend's yoga studio loses ~10 spots/week to no-shows ($15–25/spot). Real pain, real pilot access. |
| **Business shape** | B2B · Automation tool |
| **Founder profile** | Solo dev · Strong: React/Next.js, Node, AI coding (Claude Code) · Used Stripe + Twilio once each |
| **Time budget** | 15 h/week · First usable version in 6 weeks |
| **Existing assets** | ✅ 3 studio owners confirmed as pilots · ✅ Friend's studio for real-world testing · ICP: independent studios, SE Asia, 1 location, 5–30 classes/week, WhatsApp-native |
| **Target price point** | ~$29–49/mo (under Whautomate, fits ICP's $30–100 budget) |
| **Reminder channel (v1)** | WhatsApp (accepted with timeline risk noted) |
| **Billing model (v1)** | SaaS subscription billing (charge studios, not end-customers) |
| **Booking model (v1)** | Standalone (FitSlot IS the booking system — no Mindbody/Glofox integration in v1) |
| **Recommended founder path** | **Vertical tool → small pilot group → vibe-coded rapid MVP** — you have insider access (3 pilots), the AI fluency to ship fast, and a tight 6-week window. The WhatsApp API onboarding will be your critical-path item. |

---

### Analogous founder scenarios to calibrate:

> **Solo dev, 3 pilots, 6 weeks, WhatsApp automation** — this is a tight but viable window. The founders who succeed here: (1) start FB Business verification on day 1, (2) hard-scope v1 to reminders + waitlist only, (3) use the pilot group to refine before any paid marketing.

---

**Confirm?**
- ✅ Confirm → I record the brief and hand off to Step 2
- ❌ Modify → tell me what to adjust
- 📝 Other

## 👤 USER
✅ Confirmed — the ICP, pain math, positioning and not-doing list all look right. Record it and move to Step 3.

## 🤖 AGENT (stage after: step2 · done: [step1] · 63s)
📌 **Step 1 complete → Step 2: Customer, Problem & Positioning**
📎 Handoff: Founder Brief locked. Solo dev, 6-week window, 3 pilots, WhatsApp-first.

---

📌 **Entering Step 2: Customer, Problem & Positioning**
🎯 Stage goal: lock the ICP, quantify the pain, define use cases, nail positioning, and declare what we're NOT building
👤 Current role: Positioning & Customer Analyst

---

You front-loaded almost all of Step 2 already. Let me restate it as the formal **Blueprint Core**, fill the few remaining gaps with reasonable assumptions, and get your confirmation in one round.

---

## 🧩 Blueprint Core — FitSlot

### ICP (not a label — a specific persona)

> Owner-operator of an independent fitness/yoga/pilates studio in **Southeast Asia** · **1 location** · runs **5–30 classes/week** · manages bookings via **WhatsApp or a basic app** · handles client messages **personally** · has tried or rejected Mindbody/Glofox as "expensive and bloated" · monthly software budget **$30–100** · tech-savvy enough to use WhatsApp Business but not running a full SaaS stack.

---

### Problem Statement

> Small studio owners lose **8–12 class spots per week** to no-shows because reminder messages are sent manually (when the owner has time), and waitlisted clients are never backfilled before class starts. Each lost spot = $15–25. Current tools are either too expensive (Mindbody $99/mo), too bloated, or require constant manual effort (Google Sheets + WhatsApp).

---

### Pain Quantification

| Metric | Low end | High end |
|---|---|---|
| No-shows/week | 8 | 12 |
| Revenue lost/spot | $15 | $25 |
| Weekly loss | **$120** | **$300** |
| Monthly loss | **$480** | **$1,200** |
| Annual loss | **$5,760** | **$14,400** |

At **$39/mo** (midpoint of target range), FitSlot pays for itself if it recovers **2–3 spots/month** — a 6–12% reduction in no-shows. That's an easy ROI story.

---

### Current Alternatives

| Alternative | Why it falls short |
|---|---|
| **Manual WhatsApp** | Owner forgets, time-consuming, waitlist never backfilled in time |
| **Google Sheets** | No automation, no reminders, tracking only |
| **Mindbody ($99/mo)** | "Expensive and bloated," steep learning curve, enterprise features irrelevant to a 1-location studio |
| **Glofox ($80-110/mo)** | Similar to Mindbody — overkill |
| **Whautomate ($79/mo)** | Closest competitor but at the high end of ICP budget; does everything (CRM, forms, e-commerce) — not focused |

---

### Use Cases (when / wants / but / needs / gains)

| # | When… | Wants to… | But… | Needs… | So that gains… |
|---|---|---|---|---|---|
| **UC1** | A client booked tomorrow's 7AM class | Receive an automatic WhatsApp reminder 24h before | Owner currently sends these manually (or forgets) | Automated scheduled reminders based on class time | Fewer no-shows, less owner overhead |
| **UC2** | A client cancels their spot | The waitlisted client gets offered the spot instantly | Owner doesn't have time to message the waitlist manually | Auto-backfill: detect cancellation → notify first waitlisted client → confirm within time window | Spots fill, revenue recovers, waitlisted clients are happy |
| **UC3** | Owner wants to see weekly no-show stats | A simple dashboard showing no-show rate, recovered spots, revenue saved | They don't want a complex analytics suite | Clean, minimal metrics: no-shows, backfills, $ recovered | Justify the subscription, show ROI to themselves |

---

### Positioning

> **For** small fitness studio owners in Southeast Asia, **FitSlot** provides automated WhatsApp class reminders and waitlist backfill, **helping** studios recover $480–$1,200/month in lost revenue while eliminating manual client messaging. **Unlike** bloated platforms like Mindbody or feature-heavy tools like Whautomate, **FitSlot does one thing well** — kill no-shows — at a price that makes sense for a single-location studio.

---

### Willingness to Pay

| Signal | Strength |
|---|---|
| ICP's stated budget: $30–100/mo | ✅ Direct |
| Whautomate at $79/mo has paying customers in this space | ✅ Market validation |
| Pain math: $480–$1,200/mo loss → $39/mo is <10% of the problem cost | ✅ ROI case |
| 3 pilots ready to test — ask them directly in Step 2.5 | ⚠️ **Assumption — validate with pilots** |

---

### Not-Doing List (v1)

| We are NOT… | Because… |
|---|---|
| A full booking platform (no Mindbody replacement) | Scope kills the 6-week timeline |
| A CRM / client management tool | Whautomate territory; distraction |
| Multi-location / franchise support | ICP is single-location |
| Payment processing for no-show fees | Increases scope + compliance risk |
| iOS/Android mobile apps | Web app + WhatsApp = enough for v1 |
| Email reminders | ICP lives on WhatsApp |
| Marketing broadcasts / promotions | Not the job to be done |
| Integrations with Mindbody/Glofox | Standalone only in v1 |

---

## ⚠️ One open assumption — answer in 30 seconds

> You said the ICP manages bookings "via WhatsApp or basic apps." For v1, FitSlot needs its own class schedule and booking flow (standalone). Are your 3 pilot studios willing to **use FitSlot as their booking tool**, not just a reminder add-on? Or do they expect it to plug into something they already use?

This is the make-or-break scope question. Your answer determines whether v1 is a standalone booking system or an integration play.

---

**Confirm the Blueprint Core?**
- ✅ Confirm → I record it and hand off to Step 3
- ❌ Modify → tell me what
- 📝 Answer the booking question first, then confirm

## 👤 USER
✅ Yes, confirm everything as proposed and advance to Step 3.

## 🤖 AGENT (stage after: step3 · done: [step1,step2] · 75s)
---

📌 **Step 2 complete → Step 3: MVP Scope & Feature Architecture**
📎 Handoff: ICP locked (SE Asia studio owners, 1-location, WhatsApp-native), pain quantified ($480–$1,200/mo loss), positioning: focused no-show killer at $39/mo, 3 pilots, standalone booking only, WhatsApp API = critical path.

---

📌 **Entering Step 3: MVP Scope & Feature Architecture**
🎯 Stage goal: decompose the product into a MoSCoW-ranked Product Backlog — what Must ship in v1, what Should follow, and what we Won't touch
👤 Current role: Product Architect & MVP Scoper

---

You've handed me a clean brief: one problem (no-shows), three use cases (reminders, backfill, dashboard), one ICP, and a hard 6-week / ~90-hour budget. Now I'll turn those into concrete backlog items.

---

## 🧱 MVP Node Plan — FitSlot

Here's how I decompose the product. Each node maps to a user story, has a clear MVP rationale, and a MoSCoW priority.

### 🟢 Must (v1 ships with these — no exceptions)

| # | Node | User Story | Why Must |
|---|---|---|---|
| M1 | **Studio onboarding** | As a studio owner, I can sign up, create my studio profile, and set my class schedule so that FitSlot knows what classes exist. | Nothing works without a studio + schedule. |
| M2 | **Class schedule (create/edit)** | As a studio owner, I can create recurring and one-off classes with date, time, capacity, and price so that clients can book. | Core data model. Powers everything downstream. |
| M3 | **Client booking (web)** | As a client, I can view a studio's class schedule and book a spot in a class so that FitSlot has bookings to track. | Without bookings, there are no no-shows to prevent. |
| M4 | **WhatsApp reminder (24h before)** | As a client, I receive an automatic WhatsApp message 24 hours before class reminding me of my booking so that I don't forget and no-show. | The core value prop. This is the product. |
| M5 | **Client cancellation** | As a client, I can cancel my booking via WhatsApp reply or web link so that the spot opens up for someone else. | Enables the backfill loop. Without cancellation, no waitlist can fire. |
| M6 | **Waitlist join (web)** | As a client, when a class is full, I can join the waitlist so that I get a chance at a spot if someone cancels. | Prerequisite for backfill. |
| M7 | **Waitlist auto-backfill** | As a waitlisted client, when a spot opens (cancellation), I receive a WhatsApp message offering the spot and can confirm within a time window so that the class fills and I get in. | The second half of the value prop. This is where the revenue recovery happens. |
| M8 | **WhatsApp API integration** | The system sends and receives WhatsApp messages via the Business API so that all reminder and backfill communication is automated. | Critical path item. Start FB verification Day 1. |

---

### 🟡 Should (v1.1 — ship within 2 weeks of Must)

| # | Node | User Story | Why Should |
|---|---|---|---|
| S1 | **Owner dashboard (no-shows & recovery)** | As a studio owner, I can see a simple dashboard: no-shows this week, spots recovered via waitlist, estimated $ saved so that I see FitSlot's ROI. | Proves value, drives retention. Not blocking launch. |
| S2 | **Multi-class waitlist** | As a client, I can be on the waitlist for multiple classes in the same week so that I have more chances to get in. | Improves backfill rate. Slight complexity increase. |
| S3 | **Stripe subscription billing** | As a studio owner, I can subscribe and pay $39/month via credit card so that FitSlot makes money. | Revenue! But pilots can start on a free trial — don't let billing gate the first test. |

---

### 🔵 Could (v1.2 — nice to have, post-validation)

| # | Node | User Story | Why Could |
|---|---|---|---|
| C1 | **Client no-show history / tagging** | As a studio owner, I can see which clients frequently no-show so I can decide whether to block their bookings. | Useful for studio ops, not core to the automation loop. |
| C2 | **Custom reminder timing** | As a studio owner, I can set reminders at 2h / 24h / 48h before class so that I can tune for my clientele. | Nice flexibility, but 24h default covers most value. |
| C3 | **WhatsApp broadcast (class openings)** | As a studio owner, I can send a one-time WhatsApp blast to all clients when I add a new class so that it fills faster. | Marketing, not no-show reduction. |

---

### 🔴 Won't (explicitly out of scope)

| # | Node | Why Won't |
|---|---|---|
| W1 | iOS/Android apps | Web app + WhatsApp = enough for MVP. Mobile apps are a time sink. |
| W2 | Mindbody/Glofox integration | Standalone only. Integration adds API dependency + weeks of scope. |
| W3 | No-show fee payment processing | Compliance, payment disputes, refund logic — not v1. |
| W4 | Multi-location / franchise dashboard | ICP is single-location studios. |
| W5 | Client membership / class packs | CRM territory. Let them manage this manually. |

---

## 📊 Effort Summary

| Priority | Nodes | Est. Hours | Cumulative |
|---|---|---|---|
| Must | M1–M8 | ~70–85h | 70–85h |
| Should | S1–S3 | ~20–30h | 90–115h |
| Could | C1–C3 | ~15–20h | 105–135h |

At 15h/week × 6 weeks = **90 hours**, the Must set fits inside the window — but it's tight. WhatsApp API onboarding must run in parallel from Day 1 to avoid blocking M4 and M7.

---

## ⚠️ One scope decision before I lock the backlog

The client booking flow (M3) sits on a spectrum:

| Option | What it means | Effort |
|---|---|---|
| **A: Full self-serve booking page** | Clients browse schedule → pick class → book. Studio owner never touches it. | ~12–15h (schedule UI + booking flow + confirmation) |
| **B: Owner-managed booking** | Owner adds clients to classes manually (FitSlot is a back-office tool). Clients only interact via WhatsApp. | ~4–6h (simple admin panel, no public booking page) |

Option B is faster and simpler — but it means the studio owner still does manual work, and the "bookings via WhatsApp" ICP behavior doesn't change much. Option A is the full product but eats more hours.

**Which path for v1?** A or B?

## 👤 USER
v1 should only solve the no-show pain. Non-negotiable: class schedule import (CSV or manual), automatic WhatsApp reminders, waitlist auto-backfill. Billing can be manual invoices; analytics can wait. Success = one pilot studio runs 2 weeks with reminders going out automatically and at least 5 backfilled spots. Core path should be at most 3 steps for the owner. Semi-automated MVP is fine. Please propose the architecture and MoSCoW.

## 🤖 AGENT (stage after: step3 · done: [step1,step2] · 80s)
## 🎯 MVP Scope

| Element | Decision |
|---|---|
| **MVP goal** | Validate that automated WhatsApp reminders + waitlist backfill kill no-shows. 1 pilot runs ≥2 weeks with auto-reminders and **≥5 backfilled spots**. |
| **MVP level** | **L2 Semi-auto MVP** — owner manages bookings manually; FitSlot runs the WhatsApp automation behind the curtain. You're the Wizard of Oz. |
| **Core user path** | **Import schedule → Assign clients → System runs** (3 owner steps, then hands-off) |
| **Success metric** | 1 pilot: 2 weeks of auto-reminders + ≥5 waitlist spots backfilled → spot recovered |

---

## 📦 Feature Architecture (task → capability → module)

| # | User task (owner's words) | Capability | Module |
|---|---|---|---|
| 1 | "I upload my week's classes" | CSV/manual schedule import | **Schedule Manager** |
| 2 | "I know who's coming to each class" | Client-to-class assignment | **Booking Roster** |
| 3 | "Clients get reminded automatically" | Scheduled WhatsApp dispatch | **Reminder Engine** |
| 4 | "Clients can cancel if they can't come" | WhatsApp reply → spot release | **Cancellation Handler** |
| 5 | "Waitlisted clients get the open spot" | Queue + time-boxed offer → confirm | **Waitlist Engine** |
| 6 | "I can see it's working" | Simple backfill count | **Backfill Counter** |

---

## 📋 MoSCoW

### 🟢 Must — core path breaks without these (8 items, ~54h)

| ID | Feature | User Story | Value Reason | Est. |
|---|---|---|---|---|
| **M1** | Studio setup | As a studio owner, I create my account and set my timezone + WhatsApp number so that reminders fire correctly. | Foundation. Nothing works without it. | 4h |
| **M2** | Class schedule import | As a studio owner, I paste my weekly class schedule (CSV or form) so FitSlot knows what classes exist. | Non-negotiable per founder. Core data. | 6h |
| **M3** | Client roster assignment | As a studio owner, I assign clients (name + WhatsApp) to each class so reminders have recipients. | Without bookings, reminders go to nobody. | 5h |
| **M4** | WhatsApp API integration | The system sends and receives WhatsApp Business messages so that all client communication is automated. | 🔑 **Critical path.** External dependency (Meta verification 5-10 days). | 12h |
| **M5** | Auto reminder dispatch | As a client, I receive a WhatsApp reminder 24h before class so I don't forget and no-show. | **The core value prop.** This IS the product. | 8h |
| **M6** | WhatsApp cancellation | As a client, I reply "cancel" to the reminder to release my spot so someone else can take it. | Enables the backfill loop. Without cancellation, no waitlist fires. | 5h |
| **M7** | Waitlist management | As a studio owner, I add overflow clients to a per-class waitlist queue so they're ready when spots open. | Prerequisite for backfill. | 6h |
| **M8** | Waitlist auto-backfill | As a waitlisted client, when a spot opens I get a WhatsApp offer and can confirm within 15 min so the class fills. | **Revenue recovery.** Second half of the value prop. | 10h |

### 🟡 Should — big lift, not blocking (2 items, ~10h)

| ID | Feature | User Story | Value Reason | Est. |
|---|---|---|---|---|
| **S1** | Backfill counter | As a studio owner, I see a simple count of backfilled spots so I know FitSlot is working. | Validates the success metric (≥5 backfills). | 4h |
| **S2** | Recurring schedule | As a studio owner, my weekly classes repeat automatically so I don't re-import every week. | Usability — pilots will hate re-importing. | 6h |

### 🔵 Could — nice to have, post-pilot (2 items, ~8h)

| ID | Feature | Value Reason | Est. |
|---|---|---|---|
| **C1** | Owner backfill notification (WhatsApp) | "A spot just filled!" — instant gratification. Not blocking. | 4h |
| **C2** | Custom reminder timing (2h/48h) | Some studios may want different lead time. | 4h |

### 🔴 Won't — explicit cuts

| Cut | Why |
|---|---|
| Client self-serve booking page | Owner manages bookings. L2 = manual booking, auto messaging. |
| Stripe / subscription billing | Manual invoices for pilots. Billing gates nothing. |
| Analytics dashboard | Backfill counter only. "Analytics can wait" — your words. |
| No-show fee payments | Compliance + disputes ≠ v1. |
| iOS/Android apps | Web + WhatsApp = enough. |
| Mindbody/Glofox integrations | Standalone only. |
| Multi-location | ICP is 1-studio owners. |
| Email reminders | ICP lives on WhatsApp. |
| Marketing broadcasts | Not the job to be done. |

---

## 🔑 Critical Path

```
WhatsApp API (M4) ← MUST START DAY 1, WEEK 1
    ↓ (runs in parallel with Meta approval)
Schedule Import (M2) → Client Roster (M3) → Reminder Engine (M5) → Cancellation (M6) → Waitlist (M7) → Backfill (M8)
                                                                                              ↘ Backfill Counter (S1)
```

**M4 is the only item with an external gate.** Everything else you control. Start FB Business verification the day you begin coding — it runs in parallel.

---

## 📊 Feasibility Check

| Budget | Required | Buffer |
|---|---|---|
| 15h/wk × 6 wks = **90h** | Must: ~54h + Should: ~10h = **64h** | **26h** for WhatsApp delays, debugging, pilot onboarding |

✅ Fits. Tight but credible for a vibe-coding solo dev.

---

**Confirm?**
- ✅ Confirm → I write the Product Backlog and hand off to Step 4
- ❌ Modify → tell me which item(s) to adjust
- 📝 Clarify → ask me anything

## 👤 USER
✅ Confirmed — the MVP scope, modules and MoSCoW ranking are exactly right. Save the backlog and move to Step 4.

## 🤖 AGENT (stage after: step4 · done: [step1,step2,step3] · 150s)
---

📌 **Step 3 complete → Step 4: Build Blueprint**
📎 Handoff: 16-item Product Backlog saved. L2 Semi-auto MVP. 8 Must (~54h) + 2 Should (~10h). Critical path: WhatsApp API Day 1. Success metric: ≥5 backfills in 2 weeks.

---

📌 **Entering Step 4: Build Blueprint**
🎯 Stage goal: turn each Must backlog item into an executable spec — data objects, page blueprints, API routes, and ready-to-paste AI coding prompts
👤 Current role: Technical Architect

---

Here's what we have on the table:

| Priority | # | Backlog Item | Effort |
|---|---|---|---|
| 🟢 Must | 8 | Studio Setup → Class Import → Roster → WhatsApp API → Reminders → Cancellation → Waitlist → Backfill | ~54h |
| 🟡 Should | 2 | Backfill Counter + Recurring Schedule | ~10h |
| 🔴 Won't | 4 | Multi-loc, apps, integrations, payments | Documented |

---

## How Step 4 works

I'll spec each Must item in **three confirmation rounds**:

| Round | What we lock |
|---|---|
| **R1 — Requirement** | Clarified user story + numbered acceptance criteria (testable) |
| **R2 — Blueprint** | Data objects, fields, relations, permissions + page layout + API routes |
| **R3 — Align & Prompt** | Pain-to-feature trace + ready-to-paste AI coding prompt |

We'll go through the 8 Must items one at a time (or in logical pairs where they're tightly coupled). The Should items get light specs after.

---

## Let's start: M1 — Studio Setup & Onboarding

This is small (4h) but foundational — the data model established here affects everything downstream.

### R1 — Requirement

**User Story:** As a studio owner, I create my account, set my timezone, and register my WhatsApp number so the system knows who I am and when to send reminders.

**Acceptance Criteria:**
1. Owner navigates to `/signup`, enters email + password → account created, receives verification email
2. After email verification, owner lands on onboarding: sets **studio name**, **timezone** (dropdown, searchable), and **WhatsApp Business number** (with country code)
3. System validates WhatsApp number format and saves it — this is the number that will send reminders
4. Owner completes onboarding → redirected to empty schedule page with "Import your first class schedule" prompt
5. Owner can log out and log back in via `/login`

**Simple enough. Confirm?**
- ✅ Confirm requirement → I move to R2 (data + page blueprint)
- ❌ Modify → tell me what to change

# ARTIFACT CHECK

**founderBrief:** ✅ present
```json
{
  "productIdea": "FitSlot: automatic WhatsApp class reminders + waitlist auto-backfill to kill no-shows for small fitness studios",
  "motivation": "Friend's yoga studio loses ~10 spots/week to no-shows ($15-25/spot). Real pain, real pilot access.",
  "businessShape": "B2B · Automation tool",
  "founderProfile": "Solo dev · Strong: React/Next.js, Node, AI coding (Claude Code) · Used Stripe + Twilio once each",
  "timeBudget": "15 h/week · First usable version in 6 weeks",
  "existingAssets": "3 studio owners confirmed as pilots + friend's yoga studio for real-world testing. ICP: independent studios, SE Asia, 1 location, 5-30 classes/week, WhatsApp-native, budget $30-100/month.",
  "recommendedPath": "Vertical tool → small pilot group → vibe-coded rapid MVP. Insider access (3 pilots), AI fluency to ship fast, tight 6-week window. WhatsApp API onboarding is the critical-path item — start FB Business verification on Day 1.",
  "confirmedAt": "2026-06-10T04:57:57.279Z"
}
```

**blueprint:** ✅ present
```json
{
  "icp": "Owner-operator of an independent fitness/yoga/pilates studio in Southeast Asia · 1 location · runs 5–30 classes/week · manages bookings via WhatsApp or a basic app · handles client messages personally · has tried or rejected Mindbody/Glofox as \"expensive and bloated\" · monthly software budget $30–100 · tech-savvy enough to use WhatsApp Business but not running a full SaaS stack.",
  "problemStatement": "Small studio owners lose 8–12 class spots per week to no-shows because reminder messages are sent manually (when the owner has time), and waitlisted clients are never backfilled before class starts. Each lost spot = $15–25 in revenue. Current tools are either too expensive (Mindbody $99/mo), too bloated, or require constant manual effort (Google Sheets + WhatsApp).",
  "painQuantification": "8–12 no-shows/week × $15–25/spot × 4 weeks = $480–$1,200/month lost revenue per studio. At $39/mo (midpoint of target range), FitSlot pays for itself if it recovers 2–3 spots/month — a 6–12% reduction in no-shows. ROI is immediate and easy to communicate.",
  "currentAlternatives": "Manual WhatsApp — owner forgets, time-consuming, waitlist never backfilled. Google Sheets — no automation, tracking only, no reminders. Mindbody ($99/mo Starter) — \"expensive and bloated,\" steep learning curve, enterprise features irrelevant. Glofox ($80–110/mo) — similar overkill. Whautomate ($79/mo Plus) — closest direct competitor, but at the high end of ICP budget and feature-heavy (CRM, forms, e-commerce).",
  "useCases": "UC1: When a client booked tomorrow's 7AM class, they need to receive an automatic WhatsApp reminder 24h before — but the owner currently sends these manually. FitSlot sends scheduled reminders automatically → fewer no-shows, zero owner effort. UC2: When a client cancels their spot, the waitlisted client should get offered the spot instantly — but the owner doesn't have time to message the waitlist. FitSlot detects cancellation → notifies first waitlisted client → confirms within a time window → spot fills, revenue recovers. UC3: When the owner wants to see weekly no-show stats, they need a simple dashboard — but existing tools are analytics-heavy. FitSlot shows no-shows, backfills, and $ recovered in a clean minimal view → justifies the subscription, shows ROI.",
  "positioning": "For small fitness studio owners in Southeast Asia, FitSlot provides automated WhatsApp class reminders and waitlist auto-backfill, helping studios recover $480–$1,200/month i
```

**backlog items:** 16

- P0 · Studio Setup & Onboarding · 4h · spec:no · prompt:no

- P0 · Class Schedule Import · 6h · spec:no · prompt:no

- P0 · Client Roster Assignment · 5h · spec:no · prompt:no

- P0 · WhatsApp Business API Integration · 12h · spec:no · prompt:no

- P0 · Automated WhatsApp Reminder Dispatch · 8h · spec:no · prompt:no

- P0 · WhatsApp Cancellation Handler · 5h · spec:no · prompt:no

- P0 · Waitlist Management · 6h · spec:no · prompt:no

- P0 · Waitlist Auto-Backfill Engine · 10h · spec:no · prompt:no

- P1 · Backfill Counter · 4h · spec:no · prompt:no

- P1 · Recurring Weekly Schedule · 6h · spec:no · prompt:no

- P2 · Owner WhatsApp Backfill Notification · 4h · spec:no · prompt:no

- P2 · Custom Reminder Timing · 4h · spec:no · prompt:no

- P3 · Multi-Location Support · 1h · spec:no · prompt:no

- P3 · Native Mobile Apps (iOS/Android) · 1h · spec:no · prompt:no

- P3 · Mindbody/Glofox Integration · 1h · spec:no · prompt:no

- P3 · No-Show Fee Payment Processing · 1h · spec:no · prompt:no

**session:** stage=step4 completed=[step1,step2,step3]

**handoffs:** step1, step2, step3


VERIFICATION_DONE


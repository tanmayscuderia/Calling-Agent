# Multi-Industry WhatsApp AI + Calling Agent Platform

A production-grade platform for AI-powered lead qualification via WhatsApp **and real phone calls**, with CRM dashboard, multi-industry support, and a Sarvam AI voice-calling agent.

## What This Platform Does

1. **Multi-industry AI agents** — 12 industry templates (Real Estate, Healthcare, Education, Finance, E-Commerce, Travel, Fitness, Restaurant, Legal, Automotive, Salon/Spa, Insurance)
2. **WhatsApp message monitoring** via WhatsApp Web bridge (Baileys)
3. **Automatic AI replies** for lead qualification (async queue pipeline)
4. **AI phone calls via Sarvam** — real outbound voice agent (Hindi/English) that calls leads, qualifies them, books site visits, and writes results back to the CRM automatically via webhooks
5. **Config-driven AI** — each org configures its own persona, fields, intents, reply templates
6. **Inventory upload** (CSV) and structured search
7. **CRM dashboard** for leads and conversations
8. **Browser call-agent demo** (speechSynthesis + text input) — no telephony needed
9. **Production-grade reliability** — durable job queue, retry, crash recovery, LLM rate-limit protection, webhook idempotency
10. **Secure login** — Supabase Auth with httpOnly cookies (no tokens in JS)
11. **Polished animated UI** — Framer Motion route transitions, staggered card entrances, spring hover/tap interactions, animated modals
12. **296+ tests** — 205 unit tests + 91 LLM eval tests, all green
13. Clean migration path to Meta Cloud API later

> **Prototype Note:** This uses a WhatsApp Web bridge for fast demonstration. Production deployment will use Meta Cloud API. The AI, CRM, inventory upload, lead qualification, and calling-agent workflows are the main product and remain the same.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 / React / Tailwind CSS |
| **Backend** | Node.js + Fastify 4 + TypeScript |
| **Database** | Supabase Postgres |
| **Auth** | Supabase Auth + httpOnly cookies (session-based) |
| **WhatsApp Bridge** | Baileys (WhatsApp Web protocol) |
| **Voice Calling** | Sarvam AI voice agents (real PSTN calls, webhook-driven results) |
| **LLM** | DeepSeek V4 (default) / OpenAI (configurable) |
| **Voice Demo** | Browser `speechSynthesis` + text input |
| **Animation** | Framer Motion (route transitions, staggered cards, spring hovers, animated modals) |
| **Testing** | Vitest (296 tests: 205 unit + 91 LLM evals) |

---

## Quick Start

### 1. Database Setup

Create a Supabase project, then run all 14 migrations in order:

```bash
psql "$DATABASE_URL" -f supabase/migrations/20260101_0001_real_estate_ai_prototype.sql
psql "$DATABASE_URL" -f supabase/migrations/20260101_0002_demo_seed.sql
psql "$DATABASE_URL" -f supabase/migrations/20260102_0001_multi_tenant_production.sql
psql "$DATABASE_URL" -f supabase/migrations/20260102_0001a_job_queue_base.sql
psql "$DATABASE_URL" -f supabase/migrations/20260102_0002_queue_hardening.sql
psql "$DATABASE_URL" -f supabase/migrations/20260103_0001_agent_configs_templates.sql
psql "$DATABASE_URL" -f supabase/migrations/20260103_0002_lead_dedup_unique_indexes.sql
psql "$DATABASE_URL" -f supabase/migrations/20260104_0001_more_industry_templates.sql
psql "$DATABASE_URL" -f supabase/migrations/20260105_0001_fix_dequeue_rpc_ambiguous.sql
psql "$DATABASE_URL" -f supabase/migrations/20260106_0001_generic_inventory_items.sql
psql "$DATABASE_URL" -f supabase/migrations/20260107_0001_location_features.sql
psql "$DATABASE_URL" -f supabase/migrations/20260108_0001_sarvam_calls.sql
psql "$DATABASE_URL" -f supabase/migrations/20260109_0001_sarvam_fixes.sql
```

> **Already have a live DB?** Paste `supabase/run_missing_migrations.sql` into the Supabase SQL editor instead — it replays every missing piece idempotently.

> **Full setup (user creation, org linking, env config, troubleshooting):** [docs/SETUP.md](./docs/SETUP.md)

### 2. Configure Environment

```bash
cp .env.example .env
```

Required values:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
DEFAULT_ORG_ID=your-org-uuid
DEEPSEEK_API_KEY=your-key
COOKIE_SECRET=random-string-at-least-32-chars
FRONTEND_ORIGIN=http://localhost:3000

# Sarvam AI calling (optional — leave SARVAM_API_KEY empty to disable;
# /api/calls/start-real returns 400 without it)
SARVAM_API_KEY=your-sarvam-key
SARVAM_ORG_ID=...           # from https://apps.sarvam.ai
SARVAM_WORKSPACE_ID=...
SARVAM_APP_ID=...
SARVAM_CONNECTION_ID=...
SARVAM_AGENT_PHONE_NUMBER=+91XXXXXXXXXX
SARVAM_WEBHOOK_SECRET=random-string-32-chars
```

> **Note:** The DeepSeek model is hardcoded to `deepseek-v4-flash` in `config.ts`. The `DEEPSEEK_MODEL` env var is not read. See [docs/DEEPSEEK_GUIDE.md](./docs/DEEPSEEK_GUIDE.md).

### 3. Install & Run

```bash
npm run install:all

# Terminal 1: Backend (:4000)
cd backend && npm run dev

# Terminal 2: Frontend (:3000)
cd frontend && npm run dev
```

Open **http://localhost:3000** → redirects to `/login`.

### 4. Run Tests

```bash
cd backend

# Unit tests (no API key needed)
npx vitest run tests/unit/

# LLM evals (requires DEEPSEEK_API_KEY)
npx vitest run tests/evals/
```

---

## Multi-Industry Platform

Each organization configures its own AI agent via the **Agent Settings** UI (`/dashboard/agent-settings`). No code changes needed to support a new industry.

| Industry | Persona | Inventory |
|----------|---------|-----------|
| 🏢 Real Estate | Priya (Sales Assistant) | real_estate_units |
| 🎓 Education | Meera (Admissions Counselor) | education_programs |
| 🏥 Healthcare | Aarti (Appointment Coordinator) | — |
| 💰 Finance | Arjun (Financial Advisor) | — |
| 🛍️ E-Commerce | Riya (Shopping Assistant) | ecommerce_products |
| ✈️ Travel | Karan (Travel Consultant) | travel_packages |
| 💪 Fitness | Maya (Fitness Consultant) | fitness_plans |
| 🍽️ Restaurant | Chef (Reservation Manager) | — |
| ⚖️ Legal | Vikram (Legal Intake Specialist) | — |
| 🚗 Automotive | Raj (Sales Advisor) | — |
| 💅 Salon/Spa | Nikki (Booking Assistant) | salon_services |
| 🛡️ Insurance | Anjali (Insurance Advisor) | — |

---

## Documentation

All details are in `docs/`:

| Doc | What's Inside |
|-----|---------------|
| **[SETUP.md](./docs/SETUP.md)** | Step-by-step setup, user creation, org linking, troubleshooting |
| **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | System design, data flow diagrams, queue pipeline, security model |
| **[API_REFERENCE.md](./docs/API_REFERENCE.md)** | Every endpoint documented with request/response examples |
| **[FEATURES.md](./docs/FEATURES.md)** | Complete feature list across all phases |
| **[DATABASE.md](./docs/DATABASE.md)** | All table schemas, indexes, triggers |
| **[ROADMAP.md](./docs/ROADMAP.md)** | Completed phases + future plans |
| **[DEMO_SCRIPT.md](./docs/DEMO_SCRIPT.md)** | Client demo walkthrough |
| **[DEEPSEEK_GUIDE.md](./docs/DEEPSEEK_GUIDE.md)** | LLM integration, cost, error handling |
| **[SARVAM_CALLING_PLAN.md](./docs/SARVAM_CALLING_PLAN.md)** | Sarvam voice-calling agent — architecture, endpoints, webhook flow, rollout status |

---

## Project Structure

```
Calling Agent/
├── backend/              # Fastify API server (TypeScript)
│   ├── src/
│   │   ├── ai/           # LLM client, agents (WhatsApp + call), prompt engine, config service
│   │   ├── auth/         # Cookie-based auth middleware + rate limiter
│   │   ├── crm/          # Lead, conversation, property services
│   │   ├── queue/        # Postgres-backed job worker + stale recovery
│   │   ├── sarvam/       # Sarvam API client + call-result processing service
│   │   ├── whatsapp/     # Baileys bridge + connection manager
│   │   ├── routes/       # 13 route files (auth, whatsapp, leads, calls, sarvam webhook, agent, ai, etc.)
│   │   └── uploads/      # CSV import + storage
│   └── tests/            # 205 unit tests + 91 LLM evals
├── frontend/             # Next.js dashboard
│   └── src/
│       ├── app/dashboard/  # leads, conversations, inventory, calls, agent-settings, playground, followups
│       ├── components/     # CallDemoModal, motion/ (MotionPage, MotionCard, etc.)
│       └── lib/            # api.ts, auth.tsx, animations.ts (shared motion variants)
├── supabase/migrations/  # 14 SQL migration files
└── docs/                 # 10 documentation files
```

---

## Inventory Search Architecture

The property/inventory search (`searchProperties` in `backend/src/crm/propertyService.ts`) uses a **project-primary, bidirectional matching** design. Three critical bugs were discovered and fixed during development:

### Bug 1: Location alias resolution broke matches
- **Problem:** When a user typed "Delhi", the alias resolver mapped it to "New Delhi". But if the DB stored `city = 'Delhi'`, the match failed because only the resolved form was compared.
- **Fix:** **Bidirectional matching** — both the raw input and the resolved alias are checked against DB values, so alias resolution never breaks a match.

### Bug 2: No DB-level city filtering
- **Problem:** All projects were fetched and scored in memory with weak penalties. Non-matching cities still appeared in results.
- **Fix:** **Strong city mismatch penalty** (-0.4 score) effectively excludes irrelevant cities. City is the most important filter — if it doesn't match, the property is almost certainly irrelevant.

### Bug 3: Projects without units were invisible
- **Problem:** The old query used `real_estate_units` as the primary table with an INNER JOIN to projects. Projects with no unit rows (or all units sold) were invisible to search.
- **Fix:** **Projects as primary source** with a LEFT JOIN to units. Every active project is always findable. If no suitable unit exists, the project appears without unit-level details.

### Scoring System

| Signal | Points |
|--------|--------|
| Base (active project) | +0.35 |
| Configuration match (unit) | +0.20 |
| Budget overlap | +0.25 |
| Budget fully within range | +0.05 (bonus) |
| City match (bidirectional) | +0.10 |
| City mismatch | -0.40 (strong penalty) |
| Sector match (bidirectional) | +0.15 |
| Sector mismatch | -0.20 |
| Location match | +0.05 |
| Possession status match | +0.10 |

Results with score ≤ 0.1 are filtered out. Top N (default 3) returned, sorted by score descending. Results are cached for 60 seconds.

---

## Production Notes

The platform is production-ready with a durable job queue, retry logic, crash recovery, and LLM rate-limit protection. Real calling is live via Sarvam (guarded by calling hours, call-cost limits, DNC checks, and webhook idempotency). Future work includes replacing Baileys with Meta Cloud API and WebSocket real-time updates.

See **[ROADMAP.md](./docs/ROADMAP.md)** for full details.

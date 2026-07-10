# Multi-Industry WhatsApp AI + Calling Agent Platform

A production-grade platform for AI-powered lead qualification via WhatsApp, with CRM dashboard, multi-industry support, and browser-based AI calling-agent demo.

## What This Platform Does

1. **Multi-industry AI agents** — 12 industry templates (Real Estate, Healthcare, Education, Finance, E-Commerce, Travel, Fitness, Restaurant, Legal, Automotive, Salon/Spa, Insurance)
2. **WhatsApp message monitoring** via WhatsApp Web bridge (Baileys)
3. **Automatic AI replies** for lead qualification (async queue pipeline)
4. **Config-driven AI** — each org configures its own persona, fields, intents, reply templates
5. **Inventory upload** (CSV) and structured search
6. **CRM dashboard** for leads and conversations
7. **AI call-agent demo** (browser speechSynthesis + text input)
8. **Production-grade reliability** — durable job queue, retry, crash recovery, LLM rate-limit protection
9. **Secure login** — Supabase Auth with httpOnly cookies (no tokens in JS)
10. **Polished animated UI** — Framer Motion route transitions, staggered card entrances, spring hover/tap interactions, animated modals
11. **260 tests** — 169 unit tests + 91 LLM eval tests, all green
12. Clean migration path to Meta Cloud API later

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
| **LLM** | DeepSeek V4 (default) / OpenAI (configurable) |
| **Voice Demo** | Browser `speechSynthesis` + text input |
| **Animation** | Framer Motion (route transitions, staggered cards, spring hovers, animated modals) |
| **Testing** | Vitest (260 tests: 169 unit + 91 LLM evals) |

---

## Quick Start

### 1. Database Setup

Create a Supabase project, then run all 9 migrations in order:

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
```

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

---

## Project Structure

```
Calling Agent/
├── backend/              # Fastify API server (TypeScript)
│   ├── src/
│   │   ├── ai/           # LLM client, agents, prompt engine, config service
│   │   ├── auth/         # Cookie-based auth middleware + rate limiter
│   │   ├── crm/          # Lead, conversation, property services
│   │   ├── queue/        # Postgres-backed job worker + stale recovery
│   │   ├── whatsapp/     # Baileys bridge + connection manager
│   │   ├── routes/       # 10 route files (auth, whatsapp, leads, calls, etc.)
│   │   └── uploads/      # CSV import + storage
│   └── tests/            # 169 unit tests + 91 LLM evals
├── frontend/             # Next.js dashboard
│   └── src/
│       ├── app/dashboard/  # leads, conversations, inventory, calls, settings
│       ├── components/     # CallDemoModal, motion/ (MotionPage, MotionCard, etc.)
│       └── lib/            # api.ts, auth.tsx, animations.ts (shared motion variants)
├── supabase/migrations/  # 9 SQL migration files
└── docs/                 # 8 documentation files
```

---

## Production Notes

The platform is production-ready with a durable job queue, retry logic, crash recovery, and LLM rate-limit protection. Future work includes replacing Baileys with Meta Cloud API, WebSocket real-time updates, and real calling integration.

See **[ROADMAP.md](./docs/ROADMAP.md)** for full details.
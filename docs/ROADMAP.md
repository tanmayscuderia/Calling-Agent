# Production Evolution Roadmap

## Overview

This document tracks the evolution from single-org prototype to multi-tenant, multi-industry production platform.

---

## Completed Phases

### Phase 1: Core Prototype ✅
- WhatsApp Web bridge (Baileys) with QR login + session persistence
- Real estate AI lead qualification agent (DeepSeek/OpenAI)
- Property inventory CSV upload + structured search
- CRM dashboard (leads, conversations, inventory, calls)
- Browser-based AI calling agent demo with TTS
- 5 demo properties seeded

### Phase 2: Database Schema ✅
- 20 tables: CRM, WhatsApp, AI, calls, inventory, queue, agent configs, Sarvam webhook audit
- All tables multi-tenant (`org_id` → `organizations`)
- Auto-updating `updated_at` triggers
- Lead deduplication unique indexes
- 14 migrations, all idempotent (`IF NOT EXISTS`)

### Phase A: Multi-Tenant Auth ✅
- Supabase Auth with httpOnly cookies (access + refresh tokens)
- `authMiddleware` resolves `req.orgId`, `req.memberId`, `req.role` from cookie
- Role-based visibility: admins see all, members see own data
- Backward-compatible: falls back to `DEFAULT_ORG_ID` when no cookie (prototype mode)
- Rate limiting on login endpoint
- Frontend AuthProvider + route guard → `/login` redirect

### Phase B: Multi-Instance WhatsApp Manager ✅
- `WhatsAppConnectionManager` singleton manages N concurrent Baileys connections
- Each `whatsapp_accounts` row = one live connection
- Auto-boots all `connected` accounts on server start (survives VPS restart)
- Per-account session directories (fixes collision bug)
- Incoming messages routed to correct org pipeline via `account.org_id`
- Per-chat monitoring toggle (groups + individuals)

### Phase C: Durable Job Queue + LLM Hardening ✅
- **Durable `job_queue` table** in Postgres (survives crashes, not in-memory)
- **Atomic dequeue RPC** (`dequeue_job()`) via `FOR UPDATE SKIP LOCKED` — race-safe
- **5 retries with exponential backoff** (3s → 6s → 12s → 24s → 48s + jitter for 429s)
- **Stale recovery** — `reclaim_stale_jobs()` resets crashed workers' locks on boot
- **Async message pipeline** — Baileys event loop never blocks on AI:
  - `enqueueIncomingMessage()` (fast path): save inbound → insert job → return
  - `processMessageJob()` (worker): load context → AI agent → save → enqueue send
  - `processSendReplyJob()` (worker): actual WhatsApp delivery
- **LLM concurrency limiter** — configurable `LLM_MAX_CONCURRENT` (default 3), prevents 429s
- **LLM min-delay** — configurable `LLM_MIN_DELAY_MS`, prevents burst rate-limits
- **Thinking-mode fallback** — if DeepSeek returns empty content (reasoning consumed all tokens), auto-retries without thinking
- **Token budget fix** — `generateJson` uses 4096 maxTokens when thinking enabled
- **Monitoring endpoint** `GET /api/system/status` — queue depth, LLM stats, WA connections

### Phase D: Multi-Industry Platform ✅
- **Config-driven architecture** — `agent_configs` table stores per-org AI configuration
- **12 industry templates** — Real Estate, Healthcare, Education, Finance, E-Commerce, Travel, Fitness, Restaurant, Legal, Automotive, Salon/Spa, Insurance
- **Prompt Engine** (`promptEngine.ts`) — dynamically generates system + extraction prompts from config
- **Generic Inventory Search** (`inventorySearch.ts`) — searches any table using configurable field mappings
- **Generic Base Agent** (`baseAgent.ts`) — industry-agnostic message processing
- **Agent Settings UI** — full visual editor: persona, fields, intents, statuses, search, templates
- **Template API** — `GET /api/agent/templates`, `POST /api/agent/apply-template`
- **5-minute config cache** with automatic invalidation on update

### Phase E1: UI Animation & Polish ✅
- **Framer Motion** integration across the entire frontend
- **Route transitions** — `AnimatePresence` in root layout (fade + slide on every page change)
- **Staggered card entrances** — Dashboard stat cards cascade in with 40ms delays
- **Spring hover interactions** — Cards lift with spring physics (`stiffness: 400, damping: 20`)
- **Animated modals** — `AnimatedModal` component with backdrop fade + panel spring
- **Chat bubble animations** — Call demo transcript bubbles slide in direction-aware
- **Typing indicator** — Three pulsing dots during AI "thinking" state
- **Login entrance** — Logo spring-in with rotation, staggered form fields
- **Tabular numbers** — `font-variant-numeric: tabular-nums` to prevent layout shift
- **Auto-scroll** — Call transcript smooth-scrolls to newest message
- **Shared animation system** — `animations.ts` (variants) + `MotionPrimitives.tsx` (components)

### Phase E: Quality Testing ✅
- **205 unit tests** — phone, money, parser, CSV, inventory, agents, prompts, rate limiter, Sarvam call results (14 files)
- **91 LLM eval tests** — reply quality, extraction accuracy, e2e pipeline, call agent, safety, template-driven, cross-industry (8 files)
- **296 total tests, ALL GREEN**
- **Eval harness** with rate-limit-safe sequential execution
- **Safety evals** verifying chain-of-thought never leaks to users
- **Golden cases** with curated expected outcomes

### Phase E2: AI Playground ✅
- **Playground page** — test extraction + reply without WhatsApp
- **History support** — up to 12 prior turns for conversational context
- **Live extraction** — see what the AI extracts from any message
- **Live reply** — see the actual reply that would be sent on WhatsApp
- **Config-aware** — uses the org's current agent config

### Phase S: Sarvam Voice Calling Agent ✅ (see docs/SARVAM_CALLING_PLAN.md)
- **Real outbound AI calls** via Sarvam voice agents (Hindi/English PSTN calls) — `POST /api/calls/start-real`
- **Result webhook** `/webhooks/sarvam/:secret` — unguessable-URL auth, raw payload audit table (`sarvam_webhook_events`), idempotent processing
- **Queue-based result processing** — webhook acks instantly; `process_call_result` job handles transcript storage, LLM summary, outcome mapping with retries
- **Lead enrichment from calls** — temperature, preferences, agent variables written back to the lead automatically
- **Auto follow-ups** — `callback_requested` / `site_visit_requested` / `booking_requested` outcomes create follow-up tasks
- **Safety guards** — calling hours window (IST), per-org daily cost caps, DNC list, API key presence
- **Correlation + idempotency** — `call_sessions.external_call_id` ↔ Sarvam `attempt_id`; terminal-state skip prevents double processing

### Phase E3: Generic Inventory System ✅
- **`generic_inventory_items` table** — single unified inventory table for all non-real-estate industries
- **`inventory_schema` column** on `agent_configs` — drives per-industry UI labels and search behavior
- **Config-driven inventory page** — Dashboard inventory list auto-adapts (labels, columns, filters) based on selected industry
- **Config-driven upload page** — Upload page shows correct CSV format and instructions per industry
- **Generic CSV importer** — `POST /api/upload/inventory-csv` maps CSV columns to `generic_inventory_items` with `attr_` prefix for custom attributes
- **Generic item CRUD** — `GET/POST/PATCH/DELETE /api/inventory/items` endpoints
- **Per-industry templates** — Each of the 12 templates now includes `inventory_schema` with `item_label`, `item_label_plural`, `search_fields`
- **Dashboard label updates** — Dashboard stats card label dynamically changes ("Properties Available" → "Courses Available" → "Services Available")

---

## Architecture Maturity

| Layer | Status | Notes |
|-------|--------|-------|
| WhatsApp Bridge | Production-ready for BSP swap | Baileys now, Meta Cloud API later via `MessagingAdapter` interface |
| AI Agent | Production-ready | Config-driven, multi-industry, grounded inventory search |
| Database | Production-ready | 14 migrations, multi-tenant, idempotent |
| Voice Calling | Live (Sarvam) | Real PSTN outbound calls + webhook-driven CRM writeback |
| Auth | Production-ready | httpOnly cookies, Supabase Auth, role-based access |
| Job Queue | Production-ready | Postgres-backed, atomic dequeue, retry, stale recovery |
| Frontend | Polished prototype | Framer Motion animations, staggered cards, spring hovers, animated modals |
| Testing | Strong | 296 tests covering unit + LLM quality |
| Monitoring | Basic | `/api/system/status` endpoint — needs alerting |

---

## Latency Optimizations (Applied)
- In-memory LRU cache for org config (5-min TTL), member context
- Parallel DB queries where possible (Promise.all)
- Connection pooling via Supabase client reuse
- Minimal query columns (select only needed fields)
- Precompiled prompt templates (no string building per request)
- Async pipeline — Baileys event loop returns in <50ms

---

## Future Phases

### Phase F: Production Polish (Next)
- [ ] Meta Cloud API WhatsApp adapter (replace Baileys for production)
- [x] Real voice calling integration — **DONE via Sarvam AI voice agents** (see `docs/SARVAM_CALLING_PLAN.md`): outbound PSTN calls, webhook result processing, LLM call summaries, lead enrichment, auto follow-ups
- [ ] Frontend redesign — full production design system
- [ ] WebSocket real-time message updates (no polling)
- [ ] Notification system (in-app + email alerts for hot leads)
- [ ] Analytics dashboard (conversion funnels, response times)
- [ ] Team assignment workflow (round-robin, skill-based routing)

### Phase G: Scale
- [ ] Read replicas for dashboard queries
- [ ] Connection pooling via PgBouncer
- [ ] Redis for session cache + rate limiting
- [ ] CDN for frontend assets
- [ ] Horizontal scaling for queue workers
- [ ] Vector search (pgvector) for knowledge base RAG

### Phase H: Advanced AI
- [ ] Multi-turn conversation memory (sliding window + summary)
- [ ] Function calling / tool use for live inventory queries
- [ ] Sentiment analysis on customer messages
- [ ] A/B testing for prompt variants
- [ ] Fine-tuned industry-specific models
- [x] Voice-to-voice calling agent — **DONE via Sarvam** (real voice agent handles the full conversation; browser STT/TTS demo retained for offline use)

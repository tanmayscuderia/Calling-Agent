# Architecture — Calling Agent Platform

> **Last Updated:** 2026-07-16
> **Stack:** Next.js (Frontend) · Fastify + Node.js (Backend) · Supabase Postgres (DB) · Baileys (WhatsApp) · DeepSeek/OpenAI (LLM)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [WhatsApp Message Lifecycle](#2-whatsapp-message-lifecycle)
3. [AI Pipeline (Brain)](#3-ai-pipeline-brain)
4. [Job Queue System](#4-job-queue-system)
5. [Auth & Multi-Tenancy](#5-auth--multi-tenancy)
6. [Call Agent Demo](#6-call-agent-demo)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Database Layer](#8-database-layer)
9. [LLM Hardening](#9-llm-hardening)
10. [Industry-Agnostic Config System](#10-industry-agnostic-config-system)
11. [Security Model](#11-security-model)
12. [Testing Architecture](#12-testing-architecture)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                           │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌────────┐ ┌───────────┐  │
│  │Dashboard │ │ Leads CRM │ │Inbox/Chat│ │Upload  │ │Call Demo  │  │
│  │  Stats   │ │ Detail    │ │WhatsApp  │ │ CSV    │ │ TTS+Turns │  │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └───┬────┘ └─────┬─────┘  │
│       └─────────────┴────────────┴────────────┴───────────┘        │
│                          Cookie-based Auth                          │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS (REST API)
┌──────────────────────────────▼──────────────────────────────────────┐
│                     BACKEND (Fastify + Node.js)                     │
│                                                                     │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────────┐    │
│  │Auth MW  │→ │Rate Limit│→ │ API Routes│→ │  Service Layer   │    │
│  │(cookie) │  │(per-org) │  │ (REST)    │  │ (CRM, Upload)    │    │
│  └─────────┘  └──────────┘  └─────┬─────┘  └──────────────────┘    │
│                                   │                                 │
│  ┌────────────────────────────────▼──────────────────────────────┐ │
│  │                   WHATSAPP BRIDGE LAYER                       │ │
│  │  ┌─────────────────┐    ┌──────────────┐                     │ │
│  │  │Connection Mgr    │→   │ Baileys WS   │ ← WhatsApp Web      │ │
│  │  │(N accounts)     │    │ Adapter      │                      │ │
│  │  └────────┬────────┘    └──────┬───────┘                      │ │
│  │           │ messages.upsert    │                               │ │
│  │           ▼                    │                               │ │
│  │  ┌────────────────────────────▼─────────────────────────────┐ │ │
│  │  │              MESSAGE PIPELINE (async)                     │ │ │
│  │  │  Parser → whatsappService → ENQUEUE job → ack to Baileys  │ │ │
│  │  └──────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    JOB QUEUE WORKER                          │  │
│  │  Poll(2s) → dequeue_job() [atomic] → process → complete/fail │  │
│  │                          │                                   │  │
│  │  ┌───────────────────────▼─────────────────────────────────┐ │  │
│  │  │                   AI BRAIN                               │ │  │
│  │  │                                                          │ │  │
│  │  │  agentConfig ──→ promptEngine ──→ baseAgent              │ │  │
│  │  │  (load config)    (build prompts)   (orchestrate)        │ │  │
│  │  │                                           │              │ │  │
│  │  │                     ┌─────────────────────┼──────────┐   │ │  │
│  │  │                     │                     │          │   │ │  │
│  │  │                inventorySearch        llmClient   leadUpdate│ │
│  │  │                (SQL matching)       (DeepSeek)   (CRM)   │ │  │
│  │  │                                     retry+conc           │ │  │
│  │  └──────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐    │
│  │ Stale Recovery       │  │ Call Agent (browser demo)        │    │
│  │ (every 60s)          │  │ callAgent → turns → summary      │    │
│  └──────────────────────┘  └──────────────────────────────────┘    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    SUPABASE POSTGRES (DB)                           │
│  org_id-scoped tables: crm_leads, customer_conversations,           │
│  customer_messages, real_estate_projects, real_estate_units,        │
│  job_queue, agent_configs, agent_templates, call_sessions, ...      │
│  RPCs: dequeue_job(), complete_job(), fail_job(), reclaim_stale()   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. WhatsApp Message Lifecycle

### The full path from customer message to AI reply:

```
Customer sends WhatsApp message
         │
         ▼
┌─────────────────────────────────┐
│ Baileys WebSocket Event         │  baileysClient.ts
│ socket.ev.on("messages.upsert") │  line ~200
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ Parse & Filter                  │  messageParser.ts
│ - Skip own messages (fromMe)    │
│ - Skip groups (if configured)   │
│ - Extract text from message     │
│ - Build ParsedWhatsAppMessage   │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ whatsappService                 │  whatsappService.ts
│ .handleIncomingMessage()        │
│                                 │
│ 1. Resolve orgId (from account) │
│ 2. Find/create lead by phone    │  → crm_leads table
│ 3. Find/create conversation     │  → customer_conversations
│ 4. Save inbound message         │  → customer_messages
│ 5. Check guards:                │
│    - ai_enabled?                │
│    - status != blocked?         │
│ 6. ENQUEUE async job (non-block)│  → job_queue table
└───────────────┬─────────────────┘
                │ (returns immediately — Baileys not blocked)
                ▼
┌─────────────────────────────────┐
│ JOB QUEUE                       │  queueWorker.ts
│ Worker polls every 2s           │
│                                 │
│ dequeue_job() [atomic RPC]      │  → SELECT ... FOR UPDATE SKIP LOCKED
│ │                               │
│ ▼                               │
│ jobHandler.ts                   │
│ Job type: process_message       │
│ │                               │
│ ▼                               │
│ Load AgentConfig for org        │  agentConfigService.ts
│ (5min cache, fallback chain)    │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ AI BRAIN — baseAgent.ts         │
│                                 │
│ Step 1: EXTRACTION (JSON)       │
│   promptEngine.buildExtraction()│
│   → llmClient.generateJson()    │
│   → {intent, budget, config...} │
│                                 │
│ Step 2: INVENTORY SEARCH        │
│   inventorySearch.search()      │
│   → SQL filter on config fields │
│   → top 3 matches               │
│                                 │
│ Step 3: REPLY GENERATION        │
│   promptEngine.buildSystem()    │
│   → llmClient.generateText()    │
│   → WhatsApp-friendly reply     │
│                                 │
│ Step 4: LEAD UPDATE             │
│   Update temperature, status,   │
│   budget, location, config...   │
└───────────────┬─────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│ POST-PROCESSING                 │
│                                 │
│ 1. Save AI agent run            │  → ai_agent_runs
│ 2. Save outbound message        │  → customer_messages (direction=outbound)
│ 3. Save property matches        │  → crm_lead_property_matches
│ 4. Update lead timestamps       │  → crm_leads
│ 5. Send reply via Baileys       │  baileysClient.sendMessage()
│ 6. complete_job()               │  → job_queue status=completed
└─────────────────────────────────┘
```

### Key Design Decisions

| Decision | Why |
|----------|-----|
| **Async queue (not inline)** | Baileys event loop must not block on LLM calls (~3-5s). Enqueue → ack → process later. |
| **Atomic dequeue RPC** | `SELECT ... FOR UPDATE SKIP LOCKED` prevents duplicate processing by concurrent workers. |
| **5-step AI pipeline** | Extraction → Search → Reply → Update → Persist. Each step is independently testable. |
| **Lead dedup by phone** | Unique index on `(org_id, phone)` prevents duplicate leads from repeat messages. |
| **Individual DMs always processed** | No monitoring toggle required for 1:1 chats — only groups need explicit toggle-on. |
| **Decryption auto-heal** | Signal protocol session desyncs detected and repaired automatically (soft reconnect → full relink). |

### WhatsApp Bridge Resilience (Auto-Heal System)

The Baileys bridge can encounter **signal protocol session desync** — where the bridge's copy of a contact's encryption session gets corrupted. When this happens, Baileys can't decrypt messages from that contact, sends "retry receipts" in a loop, and the message never reaches the AI pipeline.

**Detection (Precise — No False Positives):**

```
messages.upsert event fires
         │
         ▼
For each message in the batch:

  if (msg.key exists && msg.message is null && !msg.key.fromMe)
    → REAL decryption failure → trackDecryptionFailure(jid)

  if (msg.message exists)
    → Decrypted OK → RESET failure counter for that jid
```

> We deliberately do NOT use `messages.update` for decryption detection — that event fires for normal receipt changes (delivery/read), causing false positives and unnecessary relinks.

**Graduated Auto-Heal:**

| Failures (per-JID, 60s window) | Action | QR Rescan? |
|-------------------------------|--------|------------|
| 1 | Log warning | No |
| 2 | **Soft reconnect** — close/reopen socket with same session files. Refreshes pre-keys. | No |
| 3–4 | Escalating warning + emit `decryption-warning` event for frontend toast | No |
| 5 (threshold) | **Full relink** — delete session files, generate new QR | **Yes** |

Soft reconnects have a 30s cooldown to prevent rapid cycling. If soft reconnect doesn't fix the desync (3+ failures persist), the system escalates to a full relink automatically.

---

## 3. AI Pipeline (Brain)

### Component Map

```
┌─────────────────────────────────────────────────────────────┐
│                     AI MODULE (src/ai/)                      │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │ agentConfigSvc   │───→│ promptEngine                  │  │
│  │ • Load config    │    │ • buildSystemPrompt()         │  │
│  │ • 5min TTL cache │    │ • buildExtractionPrompt()     │  │
│  │ • Fallback chain │    │ • buildCallSystemPrompt()     │  │
│  └──────────────────┘    └──────────────┬───────────────┘  │
│                                         │                  │
│  ┌──────────────────────────────────────▼───────────────┐  │
│  │ baseAgent — AgentOrchestrator                         │  │
│  │ • respondToMessage() — main entry (extraction→reply)  │  │
│  │ • generateReply() — builds contextual reply           │  │
│  │ • extractIntent() — JSON extraction with thinking     │  │
│  │ • updateLeadFromExtraction() — applies status logic   │  │
│  └────┬─────────────────────────┬────────────────────────┘  │
│       │                         │                           │
│  ┌────▼──────────────┐  ┌──────▼──────────────────────┐    │
│  │ inventorySearch   │  │ llmClient                    │    │
│  │ • SQL filter      │  │ • chat() / generateText()    │    │
│  │ • Budget overlap  │  │ • generateJson() (JSON mode) │    │
│  │ • Config-driven   │  │ • Thinking mode support      │    │
│  │ • Relaxation      │  │ • Retry + concurrency limit  │    │
│  └───────────────────┘  └─────────────────────────────┘    │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │ callAgent        │    │ realEstateAgent  │              │
│  │ • Config-driven  │    │ • Legacy compat  │              │
│  │   persona        │    │ • Kept for eval  │              │
│  │ • Turn-by-turn   │    │   regression     │              │
│  │ • Summary gen    │    │                  │              │
│  └──────────────────┘    └──────────────────┘              │
└─────────────────────────────────────────────────────────────┘
```

### Extraction Flow (JSON)

```
Customer message: "Looking for 3BHK in Noida around 2 crore"
         │
         ▼
promptEngine.buildExtractionPrompt()
  → Builds system prompt from AgentConfig
  → Includes qualifying_fields, intent_types
  → Output schema definition
         │
         ▼
llmClient.generateJson() with thinking: true
  → DeepSeek API call (response_format: json_object)
  → thinking: { type: "enabled" } for reasoning
  → maxTokens: 4096 (room for reasoning + JSON)
         │
         ▼
Returns structured data:
{
  "intent": "property_search",
  "configuration": "3BHK",
  "city": "Noida",
  "budget_max": 20000000,
  "lead_temperature": "warm"
}
```

### Reply Generation Flow

```
Extraction result + Inventory matches + Conversation history
         │
         ▼
promptEngine.buildSystemPrompt()
  → Persona from config (e.g., "Priya, Sales Assistant")
  → Tone, business name, qualifying instructions
  → Reply templates (match / no-match / missing-info)
         │
         ▼
llmClient.generateText() with thinking: false
  → Conversational, WhatsApp-style reply
  → References ONLY real inventory (no hallucination)
  → Asks ONE follow-up question if info missing
         │
         ▼
Reply: "Yes, we have a 3BHK option in Sector 150 around
₹1.65–2.1 Cr. Are you looking for end-use or investment?"
```

### Inventory Search Algorithm

```
Extracted preferences
         │
         ▼
┌─────────────────────────────────────────┐
│ inventorySearch.search()                │
│                                         │
│ Filters (AND):                          │
│ 1. org_id = ?                           │
│ 2. availability_status = 'available'    │
│ 3. configuration ILIKE extracted_config │
│ 4. city/sector ILIKE extracted_location │
│ 5. Budget overlap:                      │
│    unit.price_min <= budget_max         │
│    AND unit.price_max >= budget_min     │
└───────────────────┬─────────────────────┘
                    │ 0 results?
                    ▼
            ┌───────────────┐
            │  RELAXATION   │
            │  1. Drop sector│
            │  2. Drop config│
            │  3. Widen city │
            └───────┬───────┘
                    │
                    ▼
            Return top 3 matches
```

---

## 4. Job Queue System

### Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  JOB QUEUE LIFECYCLE                     │
│                                                          │
│  ┌──────────┐    ┌──────────┐    ┌───────────────────┐  │
│  │ ENQUEUE  │───→│ PENDING  │───→│ PROCESSING        │  │
│  │ (insert) │    │          │    │ (locked_by worker)│  │
│  └──────────┘    └──────────┘    └────────┬──────────┘  │
│                                            │             │
│                          ┌─────────────────┼─────────┐   │
│                          │                 │         │   │
│                    ┌─────▼─────┐    ┌─────▼────┐    │   │
│                    │ COMPLETED │    │  FAILED  │    │   │
│                    │           │    │ (retry)  │    │   │
│                    └───────────┘    └────┬─────┘    │   │
│                                          │          │   │
│                                    next_retry_at    │   │
│                                    (exponential)    │   │
│                                          │          │   │
│                                    ┌─────▼─────┐    │   │
│                                    │ PENDING   │    │   │
│                                    │ (retry)   │    │   │
│                                    └───────────┘    │   │
│                                                     │   │
│  ┌──────────────────────────────────────────────────┘   │
│  │ STALE RECOVERY (every 60s)                           │
│  │ reclaim_stale_jobs()                                 │
│  │ → Finds jobs where locked_until < now()              │
│  │ → Resets to pending for reprocessing                 │
│  └──────────────────────────────────────────────────────│
└──────────────────────────────────────────────────────────┘
```

### Files

| File | Role |
|------|------|
| `queue/queueWorker.ts` | Main poll loop. Every 2s: call `dequeue_job()`, process up to 5 concurrent jobs. |
| `queue/jobHandler.ts` | Dispatcher. Routes `job_type` → handler function. Types: `process_message`, `send_reply`, `generate_summary`. |
| `queue/staleRecovery.ts` | Runs every 60s. Calls `reclaim_stale_jobs()` RPC to reset crashed worker jobs. |
| `migrations/20260102_0001a` | Base `job_queue` table + atomic dequeue/complete/fail/reclaim RPCs. |
| `migrations/20260102_0002` | Adds `locked_by`, `locked_until`, `next_retry_at`, `max_attempts`. |
| `migrations/20260105_0001` | Fixes column ambiguity in `dequeue_job()` RPC. |

### Atomic Dequeue (Prevents Duplicate Processing)

```sql
-- dequeue_job() RPC uses:
SELECT * FROM job_queue
WHERE status = 'pending'
  AND org_id = $1
  AND (next_retry_at IS NULL OR next_retry_at <= now())
ORDER BY priority DESC, created_at ASC
LIMIT 1
FOR UPDATE SKIP LOCKED;  -- ← other workers skip this row
```

---

## 5. Auth & Multi-Tenancy

### Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│                  AUTH ARCHITECTURE                        │
│                                                          │
│  Frontend (Next.js)                                      │
│  ┌──────────────────────────────────────────────┐        │
│  │ AuthProvider (Context)                        │        │
│  │  • GET /api/auth/me → check session           │        │
│  │  • POST /api/auth/login → set cookie          │        │
│  │  • POST /api/auth/logout → clear cookie       │        │
│  │  • Route guard: redirect to /login if no user │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  Backend (Fastify)                                       │
│  ┌──────────────────────────────────────────────┐        │
│  │ authMiddleware.ts (global preHandler)         │        │
│  │  1. Read session cookie (httpOnly)            │        │
│  │  2. Validate via Supabase auth.getUser()      │        │
│  │  3. Attach request.user, request.orgId        │        │
│  │  4. Skip for /health, /auth/* routes          │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  ┌──────────────────────────────────────────────┐        │
│  │ rateLimiter.ts (per-org sliding window)       │        │
│  │  • In-memory Map<orgId, timestamps[]>         │        │
│  │  • Configurable window + max requests         │        │
│  └──────────────────────────────────────────────┘        │
└──────────────────────────────────────────────────────────┘
```

### Multi-Tenancy (org_id Scoping)

Every table has `org_id` referencing `public.organizations(id)`. Every query is scoped:

```typescript
// Example: conversationService — every query includes org_id guard
const { data } = await supabase
  .from('customer_conversations')
  .select('*')
  .eq('org_id', orgId)  // ← mandatory scoping
  .eq('status', 'open');
```

### WhatsApp Multi-Account

```
WhatsAppConnectionManager (singleton)
  │
  ├── Account A (org 1) → BaileysWhatsAppAdapter → QR → Connected
  ├── Account B (org 2) → BaileysWhatsAppAdapter → Connected
  └── Account C (org 3) → BaileysWhatsAppAdapter → QR Pending
```

Each adapter has its own Baileys socket, auth state directory, and chat store. The connection manager handles boot-on-startup, health monitoring, and graceful shutdown.

---

## 6. Call Agent Demo

### Browser-Based Call Simulation

```
┌──────────────────────────────────────────────────────────┐
│                  CALL DEMO FLOW                           │
│                                                          │
│  Dashboard → Lead Detail → "Start AI Call Demo"          │
│                                                          │
│  ┌──────────────────────────────────────────────┐        │
│  │ Frontend (CallDemoModal.tsx)                  │        │
│  │                                               │        │
│  │  1. POST /api/calls/start-demo               │        │
│  │     → Creates call_session (status=created)  │        │
│  │     → Returns opening line from config       │        │
│  │                                               │        │
│  │  2. Browser speechSynthesis.speak()          │        │
│  │     → AI speaks opening line via TTS         │        │
│  │                                               │        │
│  │  3. User types customer reply                │        │
│  │     POST /api/calls/:id/turn                 │        │
│  │     { speaker: "customer", text: "..." }     │        │
│  │                                               │        │
│  │  4. Backend:                                  │        │
│  │     - Save customer turn                     │        │
│  │     - callAgent.processTurn() via LLM        │        │
│  │     - Save agent turn                        │        │
│  │     - Return agent reply                     │        │
│  │                                               │        │
│  │  5. Browser speaks agent reply (TTS)         │        │
│  │     → Continue conversation loop             │        │
│  │                                               │        │
│  │  6. "End Call" → POST /api/calls/:id/end     │        │
│  │     → LLM generates summary + outcome JSON   │        │
│  │     → Updates call_session + lead            │        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  Backend (callAgent.ts)                                  │
│  • Reads persona from AgentConfig (not hardcoded)        │
│  • System prompt: "You are {{persona_name}}..."          │
│  • Uses conversation history for context                 │
│  • Summary: returns JSON {summary, outcome, temp}        │
└──────────────────────────────────────────────────────────┘
```

### Call Data Model

```
call_sessions (1 call = 1 session)
  ├── call_session_turns (N turns per session)
  │     speaker: agent | customer | system
  │     sequence_index: 0, 1, 2, ...
  └── ai_agent_runs (AI processing records)
```

### Sarvam Real Calls (Production Telephony)

```
Outbound: Lead page → POST /api/calls/start-real
  → sarvamClient.placeCall() (apps.sarvam.ai API)
  → call_session (provider=sarvam, external_call_id=attempt_id, initiated)

Mid-call tools REMOVED (2026-08-30) — call start is hook-driven (zero mid-call dispatches):
  Call start (on_start hooks, called BY Sarvam):
    GET /api/tools/sarvam/lead-context?phone=…       ← lead + last WhatsApp messages
    GET /api/tools/sarvam/inventory-snapshot         ← full voice-friendly inventory
         └─ never-5xx: any error → HTTP 200 graceful fallback
         └─ 5-min caches (lead context: found leads only; snapshot: per org)
  (inventory-search endpoint retained backend-side but NOT wired to the agent —
   mid-call dispatches died randomly in Sarvam's harness; evidence in
   docs/sarvam-tool-failure-evidence.md)

Completion: POST /webhooks/sarvam/:secret (secret-in-path auth, TOLERANT since 2026-08-30)
  → aliases accepted (call_id/interaction_id, disposition/outcome), flat chips hoisted;
    empty body → audited + 200 (never 400); raw log: backend/logs/sarvam-webhooks.log
  → sarvam_webhook_events (raw payload, idempotent)
  → job_queue: process_call_result
  → callResultService: map status → transcript turns →
     DeepSeek summary → lead enrichment (temperature, prefs) →
     auto follow-ups (callback / site visit / booking)

Inbound (Phase S5): SARVAM_INBOUND_NUMBER → same webhook →
  analytics API resolves caller → find-or-create lead (source=inbound_call)
  → optional inboundPoller catches missed webhooks
```

---

## 7. Frontend Architecture

### Pages Map

```
frontend/src/app/
├── page.tsx                    → Landing / redirect to dashboard
├── login/page.tsx              → Login form (email + password)
├── layout.tsx                  → Root layout with AuthProvider + sidebar
│
└── dashboard/
    ├── page.tsx                → Stats overview (leads, hot, conversations, calls)
    │
    ├── leads/
    │   ├── page.tsx            → Leads table (name, source, budget, temperature)
    │   └── [id]/page.tsx       → Lead detail (profile, chat, matches, calls, follow-ups)
    │
    ├── conversations/
    │   └── page.tsx            → WhatsApp inbox (conversation list + chat panel)
    │
    ├── inventory/
    │   ├── page.tsx            → Property list with filters
    │   ├── PropertyFormModal.tsx → Add/edit property modal
    │   └── [id]/page.tsx       → Property detail view
    │
    ├── upload/
    │   └── page.tsx            → CSV upload + format reference
    │
    ├── calls/
    │   └── page.tsx            → Call session list
    │
    ├── whatsapp/
    │   └── page.tsx            → WhatsApp bridge status + QR + controls
    │
    ├── followups/
    │   └── page.tsx            → Follow-up management (all pending/scheduled)
    │
    ├── playground/
    │   └── page.tsx            → AI testing playground (extraction + reply)
    │
    └── agent-settings/
        └── page.tsx            → Agent config editor (12 templates, fields, prompts)
```

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `CallDemoModal` | `src/components/CallDemoModal.tsx` | Browser call UI with TTS, transcript, input box |
| `MotionPage` | `src/components/motion/MotionPrimitives.tsx` | Wrapper for page-level enter animations |
| `MotionCard` | `src/components/motion/MotionPrimitives.tsx` | Card with spring hover lift + stagger entrance |
| `MotionButton` | `src/components/motion/MotionPrimitives.tsx` | Button with `whileTap` scale spring |
| `AnimatedModal` | `src/components/motion/MotionPrimitives.tsx` | Modal with backdrop fade + panel spring |

### Animation Layer (Framer Motion)

The frontend uses a shared animation system built on Framer Motion for consistent motion across all pages.

```
frontend/src/
├── lib/
│   └── animations.ts          ← Shared motion variants + easing curves
│       • easeOutExpo, easeOutQuart
│       • staggerContainer (children cascade, 40ms delay)
│       • cardHover (spring lift: stiffness 400, damping 20)
│       • buttonTap (scale 0.97 spring)
│       • chatBubbleVariants (direction-aware slide)
│       • modalBackdrop / modalPanel (fade + spring)
│       • routeVariant (fade + slide for page transitions)
│
├── components/motion/
│   └── MotionPrimitives.tsx   ← Reusable animated components
│       • MotionPage  — wraps page content with entrance animation
│       • MotionCard  — stagger children + hover spring
│       • MotionButton — tap spring
│       • AnimatedModal — AnimatePresence enter/exit
│
└── app/
    └── layout.tsx             ← AnimatePresence wraps router
                                 → every route change fades + slides
```

**Where animations are used:**

| Page | Animations |
|------|------------|
| **Root layout** | `AnimatePresence` route transitions (fade + slide on every page change) |
| **Dashboard** | Staggered stat cards, spring hover lift, shimmer loading numbers |
| **Login** | Logo spring-in with rotation, staggered form fields, `whileTap` submit |
| **CallDemoModal** | Backdrop fade, panel spring, chat bubble slide-in, typing indicator pulse, summary stagger |
| **All pages** | `MotionPage` entrance animation on route change |

### State Management

- **No Redux** — React Context (`AuthProvider`) + component-level `useState`
- Data fetched per-page via `apiGet/apiPost/apiPatch` helpers
- No global data cache (prototype stage — acceptable)

### API Client (`src/lib/api.ts`)

```typescript
// Thin fetch wrapper — automatically:
// - Reads NEXT_PUBLIC_API_URL
// - Includes credentials (cookies)
// - Handles 401 → redirect to /login
// - Returns JSON or throws
export async function apiGet(path: string): Promise<any>
export async function apiPost(path: string, body?: any): Promise<any>
export async function apiPatch(path: string, body: any): Promise<any>
```

---

## 8. Database Layer

### Supabase Client

```
backend/src/db/supabase.ts
  │
  ├── Admin client (service-role key)
  │   → Full DB access, bypasses RLS
  │   → Used ONLY in backend, never exposed to frontend
  │
  └── Auth client (anon key)
      → Used for Supabase Auth (login, session validation)
      → Respects RLS policies
```

### Migrations (Chronological)

| # | Migration | Purpose |
|---|-----------|---------|
| 1 | `20260101_0001_real_estate_ai_prototype.sql` | Core CRM, WhatsApp, AI, call tables |
| 2 | `20260101_0002_demo_seed.sql` | 5 demo properties (seed data) |
| 3 | `20260102_0001_multi_tenant_production.sql` | Auth tables, rate limits, usage limits |
| 4 | `20260102_0001a_job_queue_base.sql` | `job_queue` table + atomic RPCs |
| 5 | `20260102_0002_queue_hardening.sql` | Queue locking, retry fields, stale recovery |
| 6 | `20260103_0001_agent_configs_templates.sql` | `agent_configs` + `agent_templates` + 8 seeds |
| 7 | `20260103_0002_lead_dedup_unique_indexes.sql` | Unique constraints on lead phone/whatsapp |
| 8 | `20260104_0001_more_industry_templates.sql` | 4 more templates (legal, auto, salon, insurance) |
| 9 | `20260105_0001_fix_dequeue_rpc_ambiguous.sql` | Fix column ambiguity in dequeue_job RPC |
| 10 | `20260106_0001_generic_inventory_items.sql` | Generic inventory table + `inventory_schema` on agent_configs |
| 11 | `20260107_0001_location_features.sql` | Location sharing + alias resolution features |
| 12 | `20260108_0001_sarvam_calls.sql` | Sarvam provider CHECK, `interaction_id`, webhook idempotency index, `sarvam_webhook_events` |
| 13 | `20260109_0001_sarvam_fixes.sql` | Schema alignment: `job_type` CHECK += `process_call_result`/`send_location`, `status` CHECK += `no_answer`/`busy`, `failure_reason`/`lead_temperature` cols |

### Table Groups

```
CRM:          crm_leads, crm_lead_property_matches, lead_followups
Messaging:    whatsapp_accounts, customer_conversations, customer_messages
AI:           ai_agent_runs, agent_configs, agent_templates
Inventory:    real_estate_projects, real_estate_units, real_estate_import_batches
              generic_inventory_items (non-real-estate industries)
Calls:        call_sessions, call_session_turns
Queue:        job_queue
Auth:         users, organizations, organization_members
System:       notifications, outbox_events, audit_log, knowledge_documents
```

---

## 9. LLM Hardening

### Defense Layers

```
┌──────────────────────────────────────────────────────────────┐
│                   LLM CALL PROTECTION                         │
│                                                              │
│  Layer 1: CONCURRENCY LIMITER                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Max N parallel calls (default: 3, eval: 1)             │  │
│  │ Excess calls queue in FIFO array                       │  │
│  │ Configurable via LLM_MAX_CONCURRENT env                │  │
│  │ Min inter-call delay via LLM_MIN_DELAY_MS env          │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                    │
│  Layer 2: TIMEOUT (30s)                                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ AbortController kills request after 30s               │  │
│  │ Translates to 408 error for retry logic               │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                    │
│  Layer 3: RETRY (5 attempts, exponential backoff)            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Retry on: 429, 5xx, timeouts, network errors          │  │
│  │ Backoff: 2^attempt × base (3s for 429, 1s for 5xx)    │  │
│  │ Jitter: + random 0-1s                                  │  │
│  │ No retry on: 4xx (except 429)                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                    │
│  Layer 4: EMPTY CONTENT DETECTION                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ If content is empty (DeepSeek thinking consumed all    │  │
│  │ tokens): retry as 429                                  │  │
│  │ Fallback: retry once WITHOUT thinking mode             │  │
│  └────────────────────────────────────────────────────────┘  │
│                         │                                    │
│  Layer 5: JSON PARSING RESILIENCE                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Strip ```json fences if present                        │  │
│  │ Extract first { ... } object if extra text around      │  │
│  │ Return {} on complete failure (never crash)            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### DeepSeek Thinking Mode

```
DeepSeek returns two fields:
  - message.content          ← actual response (what we use)
  - message.reasoning_content ← internal chain-of-thought (NEVER shown to users)

When thinking: { type: "enabled" }:
  1. Model spends tokens on reasoning (often 2000-3000)
  2. Then generates JSON/text in content field
  3. maxTokens must be 4096+ to have room for both

Safety checks:
  - NEVER use reasoning_content as output
  - If content is empty after retries → retry without thinking
  - JSON extraction works fine without thinking for simple cases
```

---

## 10. Industry-Agnostic Config System

### How It Works

```
┌──────────────────────────────────────────────────────────────┐
│              INDUSTRY-AGNOSTIC CONFIG SYSTEM                  │
│                                                              │
│  Database                                                    │
│  ┌──────────────────┐     ┌───────────────────┐             │
│  │ agent_templates  │     │ agent_configs     │             │
│  │ (12 presets)     │────→│ (per-org config)  │             │
│  │ Read-only seeds  │     │ Fully editable    │             │
│  └──────────────────┘     └────────┬──────────┘             │
│                                    │                         │
│  Backend                            │                         │
│  ┌─────────────────────────────────▼──────────────────────┐ │
│  │ agentConfigService.ts                                   │ │
│  │  • Load config for org (with 5min cache)               │ │
│  │  • Fallback chain: org config → real estate default    │ │
│  │  • applyTemplate() — copy template → org config        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                    │                         │
│  ┌─────────────────────────────────▼──────────────────────┐ │
│  │ promptEngine.ts                                         │ │
│  │  • buildSystemPrompt(config) → persona + instructions   │ │
│  │  • buildExtractionPrompt(config) → JSON schema          │ │
│  │  • buildCallSystemPrompt(config) → call persona         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                    │                         │
│  ┌─────────────────────────────────▼──────────────────────┐ │
│  │ baseAgent.ts                                            │ │
│  │  • Uses config.qualifying_fields for extraction         │ │
│  │  • Uses config.status_pipeline for lead updates         │ │
│  │  • Uses config.reply_templates for fallback replies     │ │
│  │  • Uses config.search_fields for inventory queries      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Frontend                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /dashboard/agent-settings                               │ │
│  │  • Pick template → POST /api/agent/apply-template       │ │
│  │  • Edit persona, fields, intents, statuses, prompts     │ │
│  │  • PUT /api/agent/config                                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### 12 Industry Templates

| Industry | Persona | Inventory Search |
|----------|---------|------------------|
| Real Estate | Priya, Sales Assistant | `real_estate_units` |
| Education | Arjun, Admissions Counsellor | `education_courses` |
| Healthcare | Dr. Anjali, Appointment Coordinator | `doctor_schedule` |
| Finance/BFSI | Meera, Financial Advisor | `financial_products` |
| E-Commerce | Riya, Customer Support | `retail_products` |
| Travel | Kabir, Travel Consultant | `travel_packages` |
| Fitness | Tara, Membership Advisor | `fitness_plans` |
| Restaurant | Vikram, Reservations | `restaurant_tables` |
| Legal | Adv. Suresh, Legal Consultant | No (appointment-based) |
| Automotive | Rohit, Sales Advisor | `automotive_inventory` |
| Salon/Spa | Nina, Appointment Coordinator | `salon_services` |
| Insurance | Kavya, Insurance Advisor | `insurance_plans` |

---

## 11. Security Model

### Key Isolation

```
┌──────────────────────────────────────────────┐
│              KEY ISOLATION                    │
│                                              │
│  Backend (server-side only):                 │
│  • SUPABASE_SERVICE_ROLE_KEY → full DB access│
│  • Never sent to frontend                    │
│  • Bypasses RLS                              │
│                                              │
│  Frontend (browser):                         │
│  • SUPABASE_ANON_KEY → limited access        │
│  • Subject to RLS policies                   │
│  • Only used for auth session, not data      │
│                                              │
│  LLM:                                        │
│  • OPENAI_API_KEY / DEEPSEEK_API_KEY         │
│  • Backend-only, never exposed               │
└──────────────────────────────────────────────┘
```

### Auth Protections

| Protection | Mechanism |
|------------|-----------|
| **Cookie security** | `httpOnly: true` — JS can't read session cookie |
| **Rate limiting** | Per-org sliding window (in-memory Map) |
| **Route protection** | `authMiddleware` on all `/api/*` except `/health`, `/auth/*` |
| **org_id scoping** | Every DB query includes `.eq('org_id', orgId)` |
| **Abuse controls** | Ignore groups, allowlist, human handoff, blocked status |

### WhatsApp Safety Controls

| Control | Config | Effect |
|---------|--------|--------|
| Ignore groups | `AI_IGNORE_GROUPS=true` | Skip group messages entirely |
| Allowlist | `AI_ALLOWED_NUMBERS=...` | Only auto-reply to listed numbers |
| AI ON/OFF toggle | `ai_enabled=false` (per-conversation) | The actual toggle that silences AI auto-reply |
| Human handoff flag | Per-conversation flag | Dashboard indicator only — does NOT silence AI |
| Blocked status | Per-conversation | No AI processing for blocked chats |
| No mass outbound | Architecture rule | AI only replies to inbound messages |

---

## 12. Testing Architecture

### Test Suite Overview

```
backend/tests/
├── unit/                          ← 150 tests (no LLM, instant)
│   ├── phone.test.ts              ← Phone normalization
│   ├── money.test.ts              ← Budget parsing/formatting
│   ├── messageParser.test.ts      ← Baileys message parsing
│   ├── csvImportService.test.ts   ← CSV import logic
│   ├── inventorySearch.test.ts    ← Inventory filter logic
│   ├── leadService.test.ts        ← Lead CRUD helpers
│   ├── llmClient.test.ts          ← JSON parsing, fence stripping
│   ├── rateLimiter.test.ts        ← Sliding window logic
│   ├── csvImportService.test.ts   ← Property import
│   ├── realEstateAgent.helpers    ← Agent helper functions
│   └── promptEngine/              ← Prompt building tests
│
├── evals/                         ← 91 tests (real LLM calls, ~5min)
│   ├── eval-harness.ts            ← Test framework
│   ├── golden-cases.ts            ← Real estate test cases
│   ├── education-cases.ts         ← Education test cases
│   ├── llm-reply.eval.ts          ← Reply quality (golden cases)
│   ├── llm-extraction.eval.ts     ← Extraction accuracy
│   ├── llm-e2e.eval.ts            ← Full pipeline e2e
│   ├── llm-call-agent.eval.ts     ← Call agent quality
│   ├── llm-safety.eval.ts         ← Chain-of-thought leak prevention
│   ├── llm-template-extraction    ← Template-driven extraction
│   ├── llm-template-reply         ← Template-driven replies
│   ├── llm-cross-industry-educ    ← Education industry e2e
│   └── fixtures/agentConfigs.ts   ← Test config fixtures
│
└── vitest.config.ts               ← fileParallelism: false for evals
```

### Eval Rate-Limit Prevention

```
npm run eval
  → LLM_MAX_CONCURRENT=1  (one call at a time)
  → LLM_MIN_DELAY_MS=2000 (2s between calls)
  → fileParallelism: false (sequential test files)
  → 5 retries with exponential backoff
  → Thinking-mode fallback (retry without thinking if empty)
```

**Total: 241 tests (150 unit + 91 eval) — ALL GREEN**

---

## API Route Summary

| Route Group | Endpoints |
|-------------|-----------|
| **Health** | `GET /health`, `GET /api/system/status` |
| **Auth** | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` |
| **WhatsApp** | `POST /api/whatsapp/start`, `GET /api/whatsapp/status`, `POST /api/whatsapp/stop`, `POST /api/whatsapp/send` |
| **Leads** | `GET /api/leads`, `GET /api/leads/:id`, `PATCH /api/leads/:id`, `GET /api/leads/:id/messages`, `GET /api/leads/:id/calls`, `POST /api/leads/:id/followups` |
| **Conversations** | `GET /api/conversations`, `GET /api/conversations/:id`, `PATCH /api/conversations/:id`, `POST /api/conversations/:id/send`, `POST /api/conversations/:id/handoff` |
| **Inventory** | `GET /api/inventory/projects`, `POST /api/inventory/projects`, `GET /api/inventory/units`, `POST /api/inventory/units`, `GET /api/inventory/search`, `GET/POST /api/inventory/items` (generic) |
| **Upload** | `POST /api/upload/properties-csv`, `POST /api/upload/inventory-csv` (generic) |
| **Calls** | `POST /api/calls/start-demo`, `POST /api/calls/start-real` (Sarvam), `POST /api/calls/:id/turn`, `POST /api/calls/:id/end`, `GET /api/calls/:id` |
| **Sarvam Webhook** | `POST /webhooks/sarvam/:secret` (secret-in-path auth, async `process_call_result` job) |
| **Sarvam Tools** | `GET /api/tools/sarvam/lead-context`, `GET /api/tools/sarvam/inventory-search` (mid-call, never-5xx, `X-Tool-Secret` auth) |
| **Agent Config** | `GET /api/agent/config`, `PUT /api/agent/config`, `GET /api/agent/templates`, `POST /api/agent/apply-template` |
| **AI** | `POST /api/ai/test-extraction`, `POST /api/ai/test-reply` |

---

*This document is the single source of truth for the Calling Agent platform architecture.*
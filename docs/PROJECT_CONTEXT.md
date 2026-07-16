# PROJECT_CONTEXT.md — Master Reference

> **Purpose:** This is the single source of truth for the entire codebase. Paste this into any AI coding agent (Cursor, Claude Code, Cline) as context. It covers architecture, database, WhatsApp bridge, LLM integration, API surface, and every key implementation decision.

---

## 1. Project Overview

**Multi-Industry WhatsApp AI + Calling Agent Platform** — a production-grade system for AI-powered lead qualification via WhatsApp, with CRM dashboard, configurable multi-industry AI agents, inventory management, and browser-based AI calling-agent demo.

**Core capabilities:**
1. WhatsApp message monitoring via WhatsApp Web bridge (Baileys)
2. Automatic AI replies for lead qualification (async job queue pipeline)
3. 12 industry templates — each org configures its own AI agent (Real Estate, Healthcare, Education, Finance, E-Commerce, Travel, Fitness, Restaurant, Legal, Automotive, Salon/Spa, Insurance)
4. Config-driven AI — persona, fields, intents, reply templates, inventory mappings all stored in DB
5. CSV inventory upload + structured search with progressive relaxation
6. CRM dashboard for leads, conversations, follow-ups
7. AI call-agent demo (browser speechSynthesis + text input)
8. Production-grade reliability — durable Postgres job queue, retry with backoff, crash recovery, LLM rate-limit protection
9. Secure login — Supabase Auth with httpOnly cookies (no tokens in JS)
10. Polished animated UI — Framer Motion route transitions, staggered cards, spring hovers

> **Prototype positioning:** WhatsApp bridge uses Baileys (WhatsApp Web protocol) for demo speed. Production will use Meta Cloud API. The AI, CRM, inventory, and calling workflows are the real product and remain unchanged. The `MessagingAdapter` interface ensures a clean swap path.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) / React / TypeScript / Tailwind CSS |
| **Backend** | Node.js + Fastify 4 + TypeScript |
| **Database** | Supabase Postgres |
| **Auth** | Supabase Auth + httpOnly cookies (session-based, XSS-proof) |
| **WhatsApp Bridge** | `@whiskeysockets/baileys` (WhatsApp Web protocol) |
| **LLM** | DeepSeek V4 (default, `deepseek-v4-flash`) / OpenAI (configurable via `LLM_PROVIDER`) |
| **Voice Demo** | Browser `speechSynthesis` + text input |
| **Animation** | Framer Motion |
| **Testing** | Vitest — 178 unit tests (12 files) + 91 LLM eval tests (8 files) |
| **Package Manager** | npm (workspace root with `backend/` and `frontend/`) |

---

## 3. Architecture & Data Flow

### Message Processing Pipeline (WhatsApp → AI → Reply)

```
Customer sends WhatsApp message
    ↓
Baileys WhatsApp Web Bridge (baileysClient.ts)
    ↓ messages.upsert event
parseWhatsAppMessage() — extracts text, media, sender info
    ↓ ParsedWhatsAppMessage
whatsappService.handleIncomingMessage()
    ↓
1. Resolve orgId (from connection manager or DEFAULT_ORG_ID)
2. Find/create whatsapp_accounts record
3. Find/create crm_leads by phone (ON CONFLICT DO UPDATE for dedup)
4. Find/create customer_conversations by external_chat_id
5. Insert inbound customer_messages
6. Safety checks: ai_enabled? human_handoff? blocked? allowlist?
7. ENQUEUE job → job_queue table (async, non-blocking)
    ↓
Queue Worker (queueWorker.ts) polls every 2s
    ↓ dequeue_job() RPC — FOR UPDATE SKIP LOCKED
jobHandler.ts → process_message
    ↓
baseAgent.respondToMessage()
    ├── promptEngine.buildSystemPrompt(agentConfig) — config-driven
    ├── llm.generateJson(extractionPrompt) — extract intent/preferences
    ├── inventorySearch.search(agentConfig, extractedData) — structured query
    ├── llm.generateText(replyPrompt) — generate grounded reply
    └── leadService.computeStatus() — update lead pipeline stage
    ↓
ENQUEUE separate job → send_reply (decoupled delivery)
    ↓
Baileys sendMessage() — delivers WhatsApp reply
    ↓
Save outbound customer_messages + ai_agent_runs
```

### Key architectural decisions:
- **Async queue:** Baileys event loop never blocks on LLM calls. Messages are enqueued immediately, processed by a separate worker. This prevents WhatsApp connection timeouts.
- **Decoupled send:** AI processing and WhatsApp delivery are separate jobs. If delivery fails, only the send job retries — AI output is already saved.
- **Config-driven AI:** No hardcoded industry logic. The `agent_configs` table stores persona, fields, intents, prompts, reply templates. The `promptEngine.ts` dynamically builds system + extraction prompts from config.
- **Multi-tenant:** Every table has `org_id`. The `authMiddleware` resolves org context from JWT cookie. Falls back to `DEFAULT_ORG_ID` for prototype mode.

---

## 4. Database Schema

### 9 Migration Files (run in order)

```
supabase/migrations/
├── 20260101_0001_real_estate_ai_prototype.sql   — Core CRM tables (14 tables)
├── 20260101_0002_demo_seed.sql                   — 5 demo properties + sample data
├── 20260102_0001_multi_tenant_production.sql     — Auth tables, org_members, notifications
├── 20260102_0001a_job_queue_base.sql             — job_queue table + dequeue RPC
├── 20260102_0002_queue_hardening.sql             — Queue indexes, stale recovery RPC
├── 20260103_0001_agent_configs_templates.sql     — agent_configs table + 12 templates
├── 20260103_0002_lead_dedup_unique_indexes.sql   — Unique constraints on phone/whatsapp
├── 20260104_0001_more_industry_templates.sql     — Additional industry inventory tables
├── 20260105_0001_fix_dequeue_rpc_ambiguous.sql   — Fix ambiguous column in dequeue RPC
```

### Core Tables (14 — from migration 0001)

| Table | Purpose |
|-------|---------|
| `real_estate_projects` | Property projects (name, developer, location, amenities) |
| `real_estate_units` | Individual units (config, price range, availability) |
| `real_estate_import_batches` | CSV upload tracking (row counts, errors) |
| `crm_leads` | Lead records (name, phone, preferences, status, temperature) |
| `crm_lead_property_matches` | Recommended properties per lead (score + reason) |
| `whatsapp_accounts` | WhatsApp connection accounts (status, session_ref) |
| `customer_conversations` | Chat threads (channel, lead, ai_enabled, human_handoff) |
| `customer_messages` | All messages (direction, type, body, ai_generated flag) |
| `ai_agent_runs` | LLM call logs (input, output, extracted data, latency) |
| `call_sessions` | AI call records (transcript, summary, outcome) |
| `call_session_turns` | Individual call turns (speaker, text, sequence) |
| `lead_followups` | Scheduled follow-ups (type, due date, status) |
| `knowledge_document_chunks` | Document chunks for future RAG |
| `knowledge_documents` | (Pre-existing) Uploaded knowledge docs |

### Production Tables (from migrations 0002+)

| Table | Purpose |
|-------|---------|
| `job_queue` | Durable async job queue (type, payload, status, attempts, locked_by) |
| `agent_configs` | Per-org AI configuration (JSONB: persona, fields, intents, prompts) |
| `organizations` | Multi-tenant org records |
| `organization_members` | User-org link with roles |
| `users` | (Supabase Auth managed) App users |
| `notifications` | In-app notifications |
| `audit_log` | Compliance audit trail |

### Key Constraints
- Every new table has `org_id` → `REFERENCES public.organizations(id) ON DELETE CASCADE`
- `crm_leads` has unique indexes: `(org_id, phone)` and `(org_id, whatsapp_number)` — prevents duplicate leads
- All status fields use `text CHECK (...)` instead of Postgres enums (simpler migrations)
- `updated_at` triggers via `set_updated_at()` function on all mutable tables
- Job queue uses `dequeue_job()` RPC with `FOR UPDATE SKIP LOCKED` for race-safe multi-worker dequeue

---

## 5. WhatsApp Bridge (Baileys) — How It Works

### Library
`@whiskeysockets/baileys` — an open-source WhatsApp Web protocol implementation. It connects to WhatsApp's WebSocket servers mimicking the WhatsApp Web browser client.

### Key file: `backend/src/whatsapp/baileysClient.ts`

The `BaileysWhatsAppAdapter` class implements the `MessagingAdapter` interface:

```typescript
interface MessagingAdapter {
  start(): Promise<void>;
  stop(): Promise<void>;
  sendMessage(chatId: string, text: string): Promise<void>;
  getStatus(): Promise<any>;
}
```

### Connection lifecycle:
1. **`start()`** — Creates a Baileys `WASocket` with `useMultiFileAuthState` for session persistence in `.sessions/whatsapp/`
2. **QR login** — On first connect, generates a QR code. User scans via WhatsApp → Linked Devices. QR is emitted to frontend via EventEmitter + shown in terminal via `qrcode-terminal`
3. **`connection.update` event** — Handles `open` (connected), `close` (reconnect with 3s delay unless loggedOut), `qr` (new QR needed)
4. **Session persistence** — Credentials saved to disk via `creds.update` event. No re-scan on restart
5. **Auto-reconnect** — If connection drops (not logout), auto-reconnects after 3 seconds

### Chat tracking (critical implementation detail):
Baileys doesn't provide a ready-made chat list. The adapter maintains its own:
- Listens to `messaging-history.set` — fires after login with ALL chats (groups + DMs)
- Listens to `chats.upsert` / `chats.update` — incremental chat updates
- Listens to `contacts.upsert` / `contacts.update` — creates individual DM chat entries from contacts
- Persists to `chat-store.json` on disk (debounced 2s writes)
- **Key fix:** `shouldSyncHistoryMessage: () => true` — forces full history sync, which is what delivers individual DM chat data

### Message handling:
1. `messages.upsert` event fires with `type: 'notify'` (real-time) or `'append'` (backfill)
2. **Both types are processed** — previously only `notify` was handled, causing missed messages during reconnects
3. `parseWhatsAppMessage()` extracts: `externalMessageId`, `chatId`, `senderId`, `senderPhone`, `isGroup`, `text`, `messageType`, `raw`
4. **Media download** — Non-text messages (image, audio, document, video) are downloaded via `downloadMediaMessage()` and uploaded to Supabase Storage
5. **Non-text handling** — Audio gets synthesized text `[voice note — please send your query as text]`, images get `[media message]`, etc. This ensures voice-note-only leads still trigger the AI
6. **Group filtering** — Groups require explicit monitoring toggle. Individual DMs are ALWAYS processed (no manual toggle needed)
7. **Allowlist** — If `AI_ALLOWED_NUMBERS` is set, only those numbers are processed
8. **Own message filter** — `key.fromMe` messages are skipped (unless `WHATSAPP_SELF_TEST=true` for debugging)

### Multi-instance support:
`connectionManager.ts` manages multiple `BaileysWhatsAppAdapter` instances — one per connected WhatsApp account. On server boot, `waManager.bootAll()` reconnects all accounts with status `connected`.

### Safety controls:
- Groups ignored unless explicitly toggled on
- Allowlist via env
- No auto-reply when `conversation.ai_enabled = false`
- No auto-reply when `conversation.human_handoff = true`
- No auto-reply when `conversation.status = 'blocked'`
- Reply only to inbound messages (never initiates)
- All AI runs logged for audit
- Never claims unavailable inventory
- Manual takeover button in dashboard

### Files:
- `backend/src/whatsapp/baileysClient.ts` — Baileys adapter (773 lines)
- `backend/src/whatsapp/connectionManager.ts` — Multi-instance manager
- `backend/src/whatsapp/messageParser.ts` — Raw Baileys message → ParsedWhatsAppMessage
- `backend/src/whatsapp/whatsappService.ts` — Orchestration: lead/conversation creation, enqueue jobs
- `backend/src/whatsapp/types.ts` — MessagingAdapter interface + types

---

## 6. LLM Integration (DeepSeek) — How It Works

### Provider: DeepSeek (default) or OpenAI

Both expose an OpenAI-compatible `/chat/completions` endpoint. The `LlmClient` class in `backend/src/ai/llmClient.ts` handles both transparently.

### Configuration (`backend/src/config.ts`):
```typescript
llm: {
  provider: process.env.LLM_PROVIDER || 'deepseek',  // 'deepseek' | 'openai'
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: 'https://api.deepseek.com',  // NOTE: no /v1 suffix
    model: 'deepseek-v4-flash',           // Hardcoded — env var not read
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
  },
}
```

### API URL construction:
- **DeepSeek:** `https://api.deepseek.com/chat/completions` (NO `/v1`)
- **OpenAI:** `https://api.openai.com/v1/chat/completions`

### Methods:
- `llm.chat(messages, opts)` — Raw chat completion
- `llm.generateText(userPrompt, systemPrompt?, opts?)` — Single-turn text generation
- `llm.generateJson(userPrompt, systemPrompt?, opts?)` — JSON mode with parse + fallback

### DeepSeek-specific features:
1. **Native JSON mode** — `response_format: { type: "json_object" }` for reliable structured extraction
2. **Thinking mode** — `thinking: { type: "enabled" }` + `reasoning_effort: "medium"|"high"` for complex reasoning (extraction, summaries). Uses chain-of-thought internally
3. **Reasoning content safety** — DeepSeek returns `reasoning_content` separately from `content`. The client **NEVER** uses `reasoning_content` as customer-facing output — it's the model's internal chain-of-thought. Only `content` is sent to users
4. **Thinking mode fallback** — If thinking mode returns empty content (all tokens consumed by reasoning), automatically retries without thinking

### Hardening (production-grade):
| Feature | Config | Purpose |
|---------|--------|---------|
| **Concurrency limit** | `LLM_MAX_CONCURRENT=3` | Max parallel LLM calls — prevents burst 429s |
| **Min delay** | `LLM_MIN_DELAY_MS=0` | Inter-call delay (set 1500 for eval runs) |
| **Retry with backoff** | 5 attempts, 2ⁿ × base | Exponential: 429 → 3s base, 5xx → 1s base, +jitter |
| **Request timeout** | 30s `AbortController` | No hanging requests |
| **Daily budget** | `LLM_DAILY_LIMIT` env | Blocks calls when daily token/call budget exhausted |

### Token usage:
DeepSeek returns `usage: { prompt_tokens, completion_tokens, total_tokens }` in every response. Logged at debug level. The `usageTracker.ts` module tracks daily call counts per source (`whatsapp`, `eval`, `playground`, `call_demo`).

### Cost optimization:
- Default `max_tokens: 1024` for WhatsApp replies (plenty for short messages)
- `generateJson` with thinking uses `max_tokens: 4096` (reasoning needs room)
- Temperature: `0.1` for extraction (deterministic), `0.4` for replies (natural variation)
- Model `deepseek-v4-flash` chosen for speed + low cost

---

## 7. AI Agent Pipeline — How It Works

### Config-driven architecture
Each org has an `agent_configs` record (JSONB) containing:
```json
{
  "persona_name": "Priya",
  "persona_role": "Sales Assistant",
  "business_name": "Demo Realty",
  "tone": "professional",
  "system_prompt": "...",           // auto-generated OR custom override
  "extraction_prompt": "...",
  "qualifying_fields": [...],        // what to extract from customer messages
  "intent_types": [...],             // what intents to classify
  "status_pipeline": [...],          // lead status stages
  "reply_templates": { match, no_match, missing_info },
  "inventory_search": { table, field_mappings },
  "call_agent": { opening_line }
}
```

### Prompt Engine (`backend/src/ai/promptEngine.ts`)
Dynamically builds system + extraction prompts from config. If `system_prompt` is empty, auto-generates from persona + fields + tone. Supports full custom override.

### Base Agent (`backend/src/ai/baseAgent.ts`)
Industry-agnostic `respondToMessage()` flow:
1. Load org's `agent_config` (5-min cache, fallback to default template)
2. Build extraction prompt from config
3. `llm.generateJson()` — extract intent + qualifying fields
4. `inventorySearch.search()` — structured DB query using extracted data
5. Progressive relaxation if no exact match (relax sector → config → budget)
6. Build reply prompt with inventory results
7. `llm.generateText()` — generate grounded reply
8. `leadService.computeStatus()` — update lead pipeline stage
9. Return: `{ reply, extractedData, matchedProperties, leadUpdates }`

### Inventory Search (`backend/src/ai/inventorySearch.ts`)
Generic structured search — works with ANY inventory table via config field mappings:
- Filters: org_id, availability_status, configuration, city/sector/location, budget overlap
- Budget overlap logic: `unit.price_min <= budget_max AND unit.price_max >= budget_min`
- Returns top 3 results with match scores
- Progressive relaxation: relax sector → then config → then ask follow-up

### Lead Lifecycle (`backend/src/crm/leadService.ts`)
Status transitions:
- `new` → `contacted` (first AI reply sent)
- `contacted` → `qualified` (budget + location + configuration known)
- `qualified` → `site_visit_scheduled` (customer agrees to visit/callback)
- Terminal: `won`, `lost`, `junk`

Temperature scoring:
- **hot:** asks for visit/callback, gives budget+location+config, says urgent/today/this week
- **warm:** asks property details, gives at least one preference
- **cold:** vague enquiry, low intent
- **unknown:** not enough data

---

## 8. API Reference

### Base URL: `http://localhost:4000`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **GET** | `/health` | Health check |
| **GET** | `/api/dashboard/stats?orgId=` | Dashboard stat counts (leads, hot, convos, AI runs, calls, units) |
| | | |
| **POST** | `/api/auth/login` | Email + password login → sets httpOnly cookies |
| **GET** | `/api/auth/me` | Get current user from cookie |
| **POST** | `/api/auth/refresh` | Refresh access token |
| **POST** | `/api/auth/logout` | Clear cookies + revoke session |
| | | |
| **POST** | `/api/whatsapp/start` | Start WhatsApp bridge for an org |
| **GET** | `/api/whatsapp/status?orgId=` | Get connection status + QR |
| **POST** | `/api/whatsapp/stop` | Stop bridge (keeps session) |
| **POST** | `/api/whatsapp/relink` | Clear session + generate new QR |
| **POST** | `/api/whatsapp/send` | Send outbound message `{ orgId, chatId, text }` |
| **GET** | `/api/whatsapp/chats?orgId=` | List all chats (groups + DMs) |
| **PATCH** | `/api/whatsapp/chats/:chatId/monitor` | Toggle monitoring for a chat |
| **POST** | `/api/whatsapp/chats/bulk-monitor` | Bulk toggle (Select All / Deselect All) |
| | | |
| **GET** | `/api/inventory/projects?orgId=` | List projects |
| **POST** | `/api/inventory/projects` | Create project |
| **GET** | `/api/inventory/units?orgId=` | List units |
| **POST** | `/api/inventory/units` | Create unit |
| **GET** | `/api/inventory/search` | Search: orgId, configuration, city, sector, budgetMax, possessionStatus |
| **GET** | `/api/inventory/projects/:id` | Project detail |
| **PATCH** | `/api/inventory/projects/:id` | Update project |
| **DELETE** | `/api/inventory/projects/:id` | Delete project |
| **GET** | `/api/inventory/units/:id` | Unit detail |
| **PATCH** | `/api/inventory/units/:id` | Update unit |
| **DELETE** | `/api/inventory/units/:id` | Delete unit |
| | | |
| **POST** | `/api/upload/properties-csv` | Multipart CSV upload → import batch |
| | | |
| **GET** | `/api/leads?orgId=&status=` | List leads with filters |
| **GET** | `/api/leads/:id` | Lead detail (all related data) |
| **PATCH** | `/api/leads/:id` | Update lead |
| **GET** | `/api/leads/:id/messages` | Lead's message history |
| **GET** | `/api/leads/:id/calls` | Lead's call sessions |
| **POST** | `/api/leads/:id/followups` | Create follow-up |
| | | |
| **GET** | `/api/conversations?orgId=` | List conversations |
| **GET** | `/api/conversations/:id` | Conversation detail + messages |
| **PATCH** | `/api/conversations/:id` | Update (ai_enabled, human_handoff, status) |
| **POST** | `/api/conversations/:id/send` | Manual send message |
| **POST** | `/api/conversations/:id/handoff` | Toggle human handoff |
| | | |
| **POST** | `/api/calls/start-demo` | Start AI call demo `{ orgId, leadId }` |
| **POST** | `/api/calls/:id/turn` | Customer reply → get agent response |
| **POST** | `/api/calls/:id/end` | End call → generate summary + outcome |
| **GET** | `/api/calls/:id` | Get call session + transcript |
| **GET** | `/api/calls?orgId=` | List call sessions |
| | | |
| **POST** | `/api/ai/test-extraction` | Test extraction without WhatsApp |
| **POST** | `/api/ai/test-reply` | Test full AI reply without WhatsApp |
| | | |
| **GET** | `/api/agent/config?orgId=` | Get org's agent config |
| **PUT** | `/api/agent/config` | Update agent config |
| **GET** | `/api/agent/templates` | List all 12 industry templates |
| **POST** | `/api/agent/apply-template` | Apply a template to an org |
| | | |
| **GET** | `/api/system/status` | Queue stats + LLM concurrency stats |
| **GET** | `/api/followups?orgId=` | List follow-ups |

---

## 9. Frontend Pages

| Route | Purpose |
|-------|---------|
| `/login` | Email + password login form |
| `/dashboard` | Overview — 7 stat cards (leads, hot leads, conversations, AI replies, calls, properties) |
| `/dashboard/whatsapp` | WhatsApp bridge control — connect, QR, status, chat list, monitoring toggles |
| `/dashboard/inventory` | Property inventory table with filters |
| `/dashboard/inventory/:id` | Project detail with units |
| `/dashboard/upload` | CSV upload page with sample download + format guide |
| `/dashboard/leads` | Leads table with status filter + temperature badges |
| `/dashboard/leads/:id` | Lead detail — profile, preferences, AI summary, conversation, matches, calls, follow-ups |
| `/dashboard/conversations` | WhatsApp-style inbox — conversation list + chat view with polling |
| `/dashboard/calls` | Call sessions list |
| `/dashboard/followups` | Follow-up tasks list |
| `/dashboard/playground` | AI testing — extraction + reply testing without WhatsApp |
| `/dashboard/agent-settings` | Visual agent config editor — 12 templates, persona, fields, intents, prompts |

### Frontend architecture:
- Next.js App Router (server components for layout, client components for interactivity)
- `frontend/src/lib/api.ts` — fetch wrapper with `credentials: 'include'`
- `frontend/src/lib/auth.tsx` — AuthProvider context, route guard
- `frontend/src/lib/animations.ts` — Shared Framer Motion variants
- `frontend/src/components/motion/MotionPrimitives.tsx` — MotionPage, MotionCard, MotionButton, AnimatedModal
- `frontend/src/components/CallDemoModal.tsx` — Browser call demo with speechSynthesis
- Tailwind CSS + custom CSS classes in `globals.css` (`.card`, `.btn`, `.badge`, `.data`, `.skeleton`)

---

## 10. Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key    # Backend ONLY — never expose to frontend
SUPABASE_ANON_KEY=your-anon-key

# Org
DEFAULT_ORG_ID=your-org-uuid                       # Fallback org for prototype mode

# LLM
LLM_PROVIDER=deepseek                              # 'deepseek' | 'openai'
DEEPSEEK_API_KEY=your-deepseek-key
OPENAI_API_KEY=your-openai-key                     # Optional fallback
OPENAI_MODEL=gpt-4.1-mini

# LLM Hardening (optional)
LLM_MAX_CONCURRENT=3                               # Max parallel LLM calls
LLM_MIN_DELAY_MS=0                                 # Inter-call delay (set 1500 for evals)
LLM_DAILY_LIMIT=500                                # Max LLM calls per day per source

# WhatsApp
WHATSAPP_PROVIDER=baileys
WHATSAPP_SESSION_DIR=.sessions/whatsapp
WHATSAPP_AUTO_BOOT=true                            # Auto-reconnect on server start
WHATSAPP_SELF_TEST=false                           # Debug: process own messages

# AI Behavior
AI_AUTO_REPLY=true
AI_IGNORE_GROUPS=true
AI_ALLOWED_NUMBERS=                                # Comma-separated, empty = allow all
AI_BUSINESS_NAME=Demo Realty

# Auth
COOKIE_SECRET=random-string-at-least-32-chars      # Signs httpOnly cookies
FRONTEND_ORIGIN=http://localhost:3000              # CORS origin

# Server
PORT=4000
```

---

## 11. Setup & Running

### Database
```bash
# Run all 9 migrations in order
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

### Install
```bash
npm run install:all    # Installs root + backend + frontend deps
```

### Run
```bash
# Terminal 1: Backend (:4000)
cd backend && npm run dev

# Terminal 2: Frontend (:3000)
cd frontend && npm run dev
```

### Test
```bash
cd backend

# Unit tests (no API key needed) — 178 tests
npx vitest run tests/unit/

# LLM evals (requires DEEPSEEK_API_KEY) — 91 tests
npx vitest run tests/evals/
```

---

## 12. Key Implementation Decisions & Gotchas

### Baileys gotchas:
1. **`shouldSyncHistoryMessage: () => true`** — Required to get individual DM chat history. Without this, only groups appear in chat list
2. **Process both `notify` and `append` message types** — `append` fires during reconnect backfill. Skipping it causes missed messages
3. **`contacts.upsert` must create chat entries** — Baileys doesn't auto-create chats for individual contacts. The adapter must explicitly create them
4. **`stop()` uses `end()` not `logout()`** — `logout()` unlinks the device from the phone. `end()` just closes the socket
5. **Individual DMs don't need monitoring toggle** — Only groups require explicit toggle. DMs are always processed
6. **Session persistence** — `useMultiFileAuthState` saves creds to disk. No re-scan on restart
7. **Media download** — `downloadMediaMessage()` is dynamically imported. Non-text messages get synthesized placeholder text so they flow through the pipeline

### DeepSeek gotchas:
1. **Base URL has NO `/v1`** — DeepSeek uses `https://api.deepseek.com/chat/completions`, not `/v1/chat/completions`
2. **Model is hardcoded** — `deepseek-v4-flash` is hardcoded in `config.ts`. The `DEEPSEEK_MODEL` env var is NOT read
3. **`reasoning_content` must never reach users** — It's the model's chain-of-thought. Only `content` field is customer-facing. The client checks for empty content and retries
4. **Thinking mode needs higher maxTokens** — Thinking consumes 2000-3000 tokens. `generateJson` with thinking uses 4096 maxTokens (was 1200, which consumed entirely by reasoning)
5. **Empty content = rate limit signal** — DeepSeek sometimes returns empty content when overloaded. Client treats this as a 429 and retries

### Queue gotchas:
1. **`FOR UPDATE SKIP LOCKED`** — Race-safe dequeue. Multiple workers can poll without conflict
2. **Stale recovery on boot** — `recoverStaleJobs()` resets jobs stuck in `processing` from crashed workers
3. **Exponential backoff** — Failed jobs retry 5× with backoff (3s base for 429, 1s for 5xx) + jitter
4. **`LLM_MAX_CONCURRENT=1` for evals** — Prevents rate limit during test runs

### Auth gotchas:
1. **httpOnly cookies** — Access + refresh tokens never appear in JavaScript. XSS-proof
2. **Prototype fallback** — If no JWT cookie present, falls back to `DEFAULT_ORG_ID` so WhatsApp still works without login
3. **Cookie secret** — Must be at least 32 chars. Signs cookies for tamper protection

---

## 13. File Structure

```
Calling Agent/
├── backend/
│   ├── src/
│   │   ├── ai/                  # LLM client, agents, prompt engine, config service, usage tracker
│   │   │   ├── llmClient.ts     # DeepSeek/OpenAI client with retry, concurrency, timeout
│   │   │   ├── baseAgent.ts     # Industry-agnostic agent (config-driven)
│   │   │   ├── callAgent.ts     # Browser call demo agent
│   │   │   ├── promptEngine.ts  # Config-driven prompt builder
│   │   │   ├── agentConfigService.ts  # Config loader with 5-min cache
│   │   │   ├── inventorySearch.ts     # Generic structured search
│   │   │   ├── agentTypes.ts    # TypeScript types for agent config
│   │   │   ├── prompts.ts       # Legacy prompt constants
│   │   │   └── usageTracker.ts  # Daily budget tracking
│   │   ├── auth/                # Cookie auth middleware + rate limiter
│   │   ├── crm/                 # Lead, conversation, property services
│   │   ├── db/                  # Supabase client (service-role)
│   │   ├── queue/               # Postgres job queue + worker + stale recovery
│   │   ├── routes/              # 12 Fastify route files
│   │   ├── uploads/             # CSV import + Supabase Storage
│   │   ├── utils/               # phone, money, logger, email
│   │   └── whatsapp/            # Baileys bridge + connection manager + parser
│   └── tests/
│       ├── unit/                # 178 unit tests (12 files)
│       └── evals/               # 91 LLM eval tests (8 files)
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── dashboard/       # 10 dashboard pages
│       │   ├── login/           # Auth page
│       │   ├── layout.tsx       # Root layout with route transitions
│       │   └── globals.css      # Tailwind + custom classes
│       ├── components/          # CallDemoModal, motion/
│       └── lib/                 # api.ts, auth.tsx, animations.ts
├── supabase/migrations/         # 9 SQL migration files
└── docs/                        # 9 documentation files (this one + 8 others)
```

---

## 14. Demo Data (Pre-seeded)

5 properties in seed migration (`20260101_0002_demo_seed.sql`):

| Project | Location | Config | Price | Status |
|---------|----------|--------|-------|--------|
| Demo Heights | Sector 150, Noida | 3BHK | ₹1.65–2.1 Cr | Under Construction (2027) |
| ATS Knightsbridge | Sector 124, Noida | 4BHK | ₹7.5–12 Cr | Ready |
| Godrej Tropical Isle | Sector 146, Noida | 3BHK | ₹2.2–3.2 Cr | Under Construction |
| Central Noida Residency | Sector 76, Noida | 2BHK | ₹95L–1.25 Cr | Ready |
| Luxury Greens Villa | Greater Noida West | Villa | ₹2.8–4 Cr | — |

### Demo script flow:
1. Open dashboard → show inventory
2. Send WhatsApp: "Hi, I am looking for a 3BHK in Noida around 2 crore"
3. AI replies with matching property (Demo Heights) + asks end-use vs investment
4. Send: "End use, possession by 2027 is fine"
5. AI confirms Demo Heights fits + asks for callback/site visit
6. Send: "Yes call me today evening"
7. AI notes callback request + asks for time slot
8. Dashboard shows: Lead status=qualified, Temperature=hot, Budget=2Cr, Follow-up=call
9. Open lead detail → click "Start AI Call Demo"
10. AI (Priya) speaks via browser TTS → user types replies → transcript saved

---

## 15. Migration Path to Production

| Prototype | Production |
|-----------|------------|
| Baileys WhatsApp Web bridge | Meta Cloud API or BSP (Gupshup/Wati/Twilio) |
| Browser speechSynthesis call demo | Exotel/Twilio voice integration |
| Local file session storage | Cloud session management |
| Single-instance queue worker | Horizontal scaling with multiple workers |
| Supabase Auth (email/password) | OAuth/SAML/SSO |

The `MessagingAdapter` interface ensures the Baileys swap requires zero changes to the AI/CRM/inventory layer. Only `baileysClient.ts` gets replaced with a `MetaCloudWhatsAppAdapter`.

---

*Last updated: July 2026. Test count: 178 unit + 91 eval = 269 total. All passing.*
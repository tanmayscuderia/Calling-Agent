# Features — Multi-Industry WhatsApp AI + Calling Agent Platform

Complete list of every capability the app has, organized by module.

---

## 0. Authentication ✅ COMPLETE

| Feature | Description |
|---------|-------------|
| **Email + Password Login** | Users log in via Supabase Auth (`POST /api/auth/login`) |
| **httpOnly Cookies** | Access + refresh tokens stored in httpOnly cookies — XSS-proof |
| **No Token in JavaScript** | Token never appears in frontend JS or localStorage |
| **Auto Session Check** | On page load, frontend calls `/api/auth/me` to restore session |
| **Route Guard** | Unauthenticated users redirected to `/login`; logged-in users skip login |
| **Cookie Middleware** | `authMiddleware` reads cookie on every request → resolves org context |
| **Token Refresh** | `POST /api/auth/refresh` exchanges refresh cookie for new access token |
| **Logout** | Clears cookies + revokes Supabase session server-side |
| **Rate Limiting** | Login endpoint rate-limited to prevent brute force |
| **Prototype Fallback** | If no cookie present, falls back to `DEFAULT_ORG_ID` so WhatsApp still works |
| **CORS + Credentials** | Backend CORS allows `credentials: true`, frontend sends `credentials: 'include'` |

### Auth Files
- `backend/src/routes/auth.routes.ts` — login, me, refresh, logout
- `backend/src/auth/authMiddleware.ts` — cookie → org context resolver
- `backend/src/auth/rateLimiter.ts` — brute force protection
- `frontend/src/lib/auth.tsx` — AuthProvider + useAuth() context
- `frontend/src/lib/api.ts` — fetch with `credentials: 'include'`
- `frontend/src/app/login/page.tsx` — login form

---

## 1. WhatsApp Bridge (Baileys)

| Feature | Description |
|---------|-------------|
| **QR Login** | Scan QR code from WhatsApp → Linked Devices to connect |
| **Session Persistence** | Session stored locally in `.sessions/whatsapp/` — no re-scan on restart |
| **Connection Status** | Real-time status: `connected`, `disconnected`, `qr_pending`, `error` |
| **Auto-Reconnect** | Automatically reconnects if connection drops |
| **Incoming Message Listener** | Listens to `messages.upsert` events (both `notify` and `append` types) |
| **Outbound Sending** | Send text replies back through WhatsApp |
| **Group Filtering** | Ignores group messages by default (`AI_IGNORE_GROUPS=true`) |
| **Allowlist** | Only respond to numbers in `AI_ALLOWED_NUMBERS` env var |
| **Own Message Filter** | Ignores messages sent by the bot itself (`key.fromMe`) |
| **Multi-format Parsing** | Handles text, image, audio, video, document, location messages |
| **MessagingAdapter Interface** | Clean interface so Baileys can be swapped for Meta Cloud API later |
| **Individual DMs Always On** | 1:1 chats are always monitored — no manual toggle needed (groups still need toggle) |
| **Decryption Auto-Heal** | Detects signal session desyncs and repairs them automatically (soft reconnect → full relink) |
| **Non-Text Message Handling** | Voice notes, images, documents get synthesized placeholder text so they're not dropped |
| **Media Download + Storage** | Inbound media downloaded and stored in Supabase Storage automatically |
| **Contact Name Enrichment** | Chat list enriched with saved contact names from WhatsApp sync events |
| **Chat Persistence** | Chat list + monitoring toggles persisted to disk — survives server restarts |
| **Bulk Toggle** | "Select All / Deselect All" for group monitoring from the dashboard |

---

## 2. AI Lead Qualification Agent

| Feature | Description |
|---------|-------------|
| **Intent Extraction** | Uses LLM to extract: intent, configuration, city, sector, budget, possession, purpose, timeline |
| **Property Matching** | Structured search with progressive relaxation (sector → config → budget) |
| **Grounded Replies** | Only recommends from actual inventory — never invents properties |
| **WhatsApp-Style Replies** | Short, natural, Indian real-estate sales tone |
| **One Question Rule** | Asks only one follow-up question at a time when info is missing |
| **Lead Temperature Scoring** | Classifies leads as hot/warm/cold/unknown based on intent signals |
| **Lead Status Pipeline** | new → contacted → qualified → site_visit_scheduled → negotiation → won/lost |
| **Property Match Records** | Every recommended property saved with score + reason in `crm_lead_property_matches` |
| **AI Run Logging** | Every LLM call logged with input, output, latency, extracted data |
| **Human Handoff Detection** | Detects legal/financial questions and suggests human advisor |
| **Callback Scheduling** | Recognizes callback requests and asks for preferred time |

### Intent Types Detected
- `property_search` — customer looking for property
- `callback_request` — wants a phone call
- `site_visit` — wants to visit a property
- `brochure_request` — wants brochure/details
- `pricing_question` — asking about prices
- `general_question` — general enquiry
- `unrelated` — off-topic

---

## 3. Property Inventory Management

| Feature | Description |
|---------|-------------|
| **CSV Upload** | Upload CSV file via multipart form → parsed into projects + units |
| **Auto Project Grouping** | Groups units by `project_name + city + sector` |
| **Import Batch Tracking** | Every upload tracked in `real_estate_import_batches` with row counts |
| **Error Reporting** | Failed rows counted with error details |
| **Structured Search** | Filter by: org, city, sector, configuration, budget, possession status |
| **Budget Overlap Logic** | Matches units where `price_min ≤ budget_max AND price_max ≥ budget_min` |
| **Progressive Relaxation** | If no exact match: relax sector → then relax configuration → ask follow-up |
| **Top 3 Results** | Returns best 3 matches to keep replies concise |
| **Pre-seeded Demo Data** | 5 demo properties ready for testing |

### CSV Columns
**Required:** `project_name`, `configuration`, `price_min`, `price_max`
**Optional:** `developer_name`, `city`, `sector`, `location`, `address`, `unit_type`, `possession_status`, `possession_date`, `status`, `amenities`, `description`, `brochure_url`

---

## 4. CRM Dashboard

| Feature | Description |
|---------|-------------|
| **Leads List** | All leads with name, phone, source, temperature badge, status, last contact |
| **Lead Detail** | Full profile: preferences, AI summary, conversation, matched properties, calls, follow-ups |
| **Temperature Badges** | Color-coded: red (hot), orange (warm), blue (cold), gray (unknown) |
| **Status Filter** | Filter leads by pipeline status |
| **Lead Editing** | Update lead info, assignment, notes via API |
| **Conversation Inbox** | WhatsApp-style inbox — conversation list + chat view |
| **Manual Send** | Send manual messages from dashboard |
| **Human Handoff Toggle** | Flag a conversation as needing human attention — sets dashboard status |
| **AI ON/OFF Toggle** | Per-conversation AI auto-reply control — the actual toggle that silences/resumes AI replies |
| **Dashboard Stats** | Total leads, hot leads, open conversations, AI replies today, calls, properties |

---

## 5. AI Calling Agent Demo

| Feature | Description |
|---------|-------------|
| **Browser-Based** | No phone integration — simulated call in browser |
| **Text-to-Speech** | Uses `window.speechSynthesis` to actually speak AI lines |
| **Turn-by-Turn** | Customer types reply → AI responds → repeat |
| **Opening Line** | "Hi, this is Priya from {{businessName}}..." |
| **Requirement Gathering** | Confirms time, asks location/config/budget/purpose/timeline |
| **Property Suggestion** | Suggests one matching property from inventory if available |
| **Call Transcript** | Every turn saved in `call_session_turns` |
| **Call Summary** | End call generates summary + outcome (interested/not_interested/callback/etc.) |
| **Lead Update** | Call outcome updates lead temperature and follow-up schedule |
| **Live Transcript UI** | Real-time transcript display during call |

---

## 5.5. Dashboard & UX Polish ✅ COMPLETE

| Feature | Description |
|---------|-------------|
| **Dashboard Stats API** | Dedicated `/api/dashboard/stats` endpoint — returns lead/conversation/AI/call/property counts in one call |
| **Stat Card Redesign** | Dashboard cards now use the stats API with shimmer loading states |
| **Conversation Polling** | Conversations page auto-refreshes every 5s — new messages appear without manual reload |
| **Sample CSV Download** | Upload page includes a "Download Sample CSV" button with the exact expected format |
| **Guided Onboarding** | Empty states on inventory, leads, and conversations pages with step-by-step guidance for first-time users |

### Call Outcomes
- `interested` — wants to proceed
- `not_interested` — declined
- `callback_requested` — wants another call
- `site_visit_requested` — wants property visit
- `wrong_number` — invalid lead
- `follow_up_later` — call back later

---

## 6. Conversations Module

| Feature | Description |
|---------|-------------|
| **Multi-Channel Support** | Schema supports WhatsApp, Telegram, Web, Phone, Email |
| **Conversation Threading** | Messages grouped by `external_chat_id` |
| **Message Direction** | Tracks inbound vs outbound |
| **Message Types** | Text, image, audio, video, document, location, button |
| **AI Generated Flag** | Each message tagged if AI-generated |
| **AI Model Tracking** | Records which LLM model generated each reply |
| **Conversation Summary** | AI-generated conversation summaries |
| **Status Management** | Open, pending_human, closed, blocked |

---

## 7. Follow-ups & Task Management

| Feature | Description |
|---------|-------------|
| **Follow-up Scheduling** | Create follow-ups: call, whatsapp, site_visit, email, meeting |
| **Auto-Scheduling from Calls** | AI call outcomes auto-create follow-ups |
| **Follow-up Status** | Pending, completed, missed, cancelled |
| **Assignment** | Assign follow-ups to team members |
| **Next Follow-up Display** | Shows next scheduled follow-up on lead cards |

---

## 8. Safety & Abuse Controls

| # | Control |
|---|---------|
| 1 | Group messages ignored by default |
| 2 | Allowlist support via env |
| 3 | No auto-reply when `ai_enabled=false` (the explicit AI ON/OFF toggle) |
| 4 | No auto-reply when conversation is `blocked` |
| 5 | No mass outbound messages |
| 6 | Reply only to inbound user messages |
| 7 | All AI runs logged for audit |
| 8 | Never claims unavailable inventory |
| 9 | Manual takeover button |
| 10 | Own messages ignored (`fromMe` filter) |

---

## 9. LLM Integration

| Feature | Description |
|---------|-------------|
| **DeepSeek (Default)** | V4-flash for speed, V4-pro for quality |
| **OpenAI (Fallback)** | GPT-4.1-mini supported |
| **Provider Switching** | Change `LLM_PROVIDER` env var — no code change needed |
| **Native JSON Mode** | `response_format: {type: "json_object"}` for reliable extraction |
| **Thinking Mode** | Optional DeepSeek reasoning mode for complex tasks |
| **Token Usage Logging** | Tracks prompt/completion/total tokens per call |
| **Graceful Fallback** | Returns friendly message if API key missing |

See **[DEEPSEEK_GUIDE.md](./DEEPSEEK_GUIDE.md)** for DeepSeek-specific details.

---

## 9.5. Production Queue & Reliability ✅ COMPLETE

| Feature | Description |
|---------|-------------|
| **Durable Job Queue** | All AI message processing runs through a Postgres-backed `job_queue` table — survives crashes |
| **Async Pipeline** | Baileys event loop never blocks on LLM calls (enqueue → worker → send) |
| **Atomic Dequeue** | `dequeue_job()` RPC uses `FOR UPDATE SKIP LOCKED` — race-safe for multi-worker |
| **Retry with Backoff** | Failed jobs retry up to 5× with exponential backoff (3s → 6s → 12s → 24s → 48s + jitter for 429s) |
| **Stale Job Recovery** | `reclaim_stale_jobs()` RPC resets crashed workers' locks on boot |
| **LLM Concurrency Limit** | Configurable via `LLM_MAX_CONCURRENT` env (default 3, evals use 1) — prevents rate limit (429) |
| **LLM Min-Delay** | Configurable inter-call delay via `LLM_MIN_DELAY_MS` env — prevents burst 429s during evals |
| **LLM Timeout** | 30s `AbortController` timeout — no hanging requests |
| **LLM Retry on 429** | 5 retries with aggressive exponential backoff (3s base for 429, 1s for 5xx) + jitter |
| **Thinking-Mode Fallback** | If DeepSeek thinking mode returns empty content (all tokens consumed by reasoning), automatically retries without thinking |
| **Token Budget Fix** | `generateJson` uses 4096 maxTokens when thinking is enabled (was 1200, consumed entirely by reasoning) |
| **Decoupled Send** | WhatsApp delivery is a separate job (`send_reply`) — decoupled from AI processing |
| **Queue Monitoring** | `GET /api/system/status` shows pending/processing/completed/failed counts |
| **Graceful Shutdown** | SIGTERM stops worker cleanly, in-progress jobs recovered on next boot |

### Queue Files
- `backend/src/queue/queueWorker.ts` — poll loop + concurrent job processor
- `backend/src/queue/jobHandler.ts` — handlers: `process_message`, `send_reply`, `generate_summary`
- `backend/src/queue/staleRecovery.ts` — boot-time crash recovery + stats

---

## 10. Multi-Industry Platform ✅ COMPLETE

The platform is no longer real-estate-only. Every org configures their own AI agent.

| Feature | Description |
|---------|-------------|
| **12 Industry Templates** | Real Estate, Healthcare, Education, Finance, E-Commerce, Travel, Fitness, Restaurant, Legal, Automotive, Salon/Spa, Insurance |
| **Config-Driven AI** | No hardcoded industry logic — all behavior comes from `agent_configs` table |
| **Per-Org Independence** | Each org has its own agent config — persona, fields, intents, statuses, inventory |
| **Template Switching** | Apply any template anytime — instant reconfigure, then customize |
| **Prompt Engine** | System + extraction prompts dynamically generated from config (`promptEngine.ts`) |
| **Generic Inventory Search** | Searches any inventory table using configurable field mappings |
| **Configurable Status Pipeline** | Each org defines its own lead status stages |
| **Configurable Intents** | Each org defines what intent types the AI extracts |
| **Inventory Schema** | `inventory_schema` in agent config defines `item_label`, `item_label_plural`, `table`, `search_fields` per industry |
| **Config-Driven UI** | Dashboard, Inventory, and Upload pages auto-adapt labels and layout based on selected industry |

### Agent Settings — Full Visual Editor ✅

| Feature | Description |
|---------|-------------|
| **Industry Template Picker** | Click any of 12 presets to apply — shows icon, name, description |
| **Persona Editor** | Agent name, role, business name, tone (5 options), business description |
| **Qualifying Fields Editor** | Add/remove/edit fields — key, label, type (text/number/enum/boolean), essential toggle, enum options |
| **Intent Types Editor** | Add/remove/edit intent categories |
| **Status Pipeline Editor** | Add/remove/reorder stages with ↑↓ buttons |
| **Reply Templates** | Match/no-match/missing-info fallbacks with `{{count}}` variable |
| **Inventory Search Config** | Toggle on/off, set table name, add/remove search field mappings |
| **Call Agent Config** | Opening line template with `{{persona_name}}` / `{{business_name}}` variables |
| **System Prompt Override** | Advanced collapsible section — full custom prompt replaces auto-generated one |

### Agent Settings Files
- `frontend/src/app/dashboard/agent-settings/page.tsx` — Full visual editor UI
- `backend/src/routes/agent.routes.ts` — GET/PUT config, GET templates, POST apply-template
- `backend/src/ai/agentConfigService.ts` — Config loader with 5-min cache + fallback chain
- `backend/src/ai/promptEngine.ts` — Config-driven prompt builder
- `backend/src/ai/baseAgent.ts` — Industry-agnostic agent
- `backend/src/ai/inventorySearch.ts` — Generic inventory search

---

## 11. Lead Deduplication ✅ COMPLETE

| Feature | Description |
|---------|-------------|
| **Unique Phone Constraint** | `(org_id, phone)` unique index prevents duplicate leads by phone |
| **Unique WhatsApp Constraint** | `(org_id, whatsapp_number)` unique index prevents duplicates by WhatsApp |
| **Auto-Update on Conflict** | New lead creation uses `ON CONFLICT DO UPDATE` — existing lead updated, not duplicated |

---

## 12. LLM Quality Testing ✅ COMPLETE

| Feature | Description |
|---------|-------------|
| **Eval Harness** | Framework for measuring LLM reply/extraction quality |
| **Reply Quality Evals** | Tests reply naturalness, correctness, WhatsApp-friendliness |
| **Extraction Accuracy Evals** | Tests structured data extraction from customer messages |
| **E2E Pipeline Evals** | Tests full message → reply → lead update flow |
| **Call Agent Evals** | Tests calling agent conversation quality |
| **LLM Safety Evals** | Verifies chain-of-thought (`reasoning_content`) never leaks to users |
| **Template-Driven Evals** | Tests config-driven extraction + reply across industries |
| **Cross-Industry Evals** | Education industry e2e — validates multi-industry support |
| **Golden Cases** | Curated test cases with expected outcomes |
| **240 Unit Tests** | Phone, money, parser, CSV, inventory, agents, prompts, rate limiter, job handler, Sarvam call results, Sarvam tools + query parser |
| **Rate-Limit Safe** | Evals run sequential (`fileParallelism: false`), 1 concurrent LLM call, 2s min-delay |

### Test Files
- `backend/tests/unit/` — 240 tests (16 files)
- `backend/tests/evals/` — 91 eval tests (8 files)

---

## 13. Seed Data

5 demo properties pre-loaded:
1. **Demo Heights** — Sector 150, Noida — 3BHK — ₹1.65–2.1 Cr — Under Construction (2027)
2. **ATS Knightsbridge** — Sector 124, Noida — 4BHK — ₹7.5–12 Cr — Ready
3. **Godrej Tropical Isle** — Sector 146, Noida — 3BHK — ₹2.2–3.2 Cr — Under Construction
4. **Central Noida Residency** — Sector 76, Noida — 2BHK — ₹95L–1.25 Cr — Ready
5. **Luxury Greens Villa** — Greater Noida West — Villa — ₹2.8–4 Cr

---

## 14. UI Animation & Polish ✅ COMPLETE

| Feature | Description |
|---------|-------------|
| **Route Transitions** | Every page change animates with a smooth fade+slide via `AnimatePresence` in the root layout |
| **Staggered Card Entrances** | Dashboard stat cards cascade in with 40ms stagger delays for organic reveals |
| **Spring Hover Interactions** | Cards lift with spring physics (`stiffness: 400, damping: 20`) on mouse hover |
| **Button Tap Springs** | All interactive buttons have `whileTap` scale-down for tactile feedback |
| **Animated Modals** | `AnimatedModal` component handles backdrop fade + panel spring entrance/exit |
| **Chat Bubble Animations** | Call demo transcript bubbles animate in with direction-aware variants (inbound left, outbound right) |
| **Typing Indicator** | Three pulsing dots animate while the AI agent is "thinking" during calls |
| **Login Entrance** | Logo springs in with rotation, form fields stagger-fade into view |
| **Call Status Pulse** | Active call indicator has a live pulse dot animation |
| **Shimmer Loading** | Dashboard numbers show shimmer placeholder while data loads |
| **Tabular Numbers** | All numeric displays use `font-variant-numeric: tabular-nums` to prevent layout shift |
| **Auto-Scroll** | Call transcript auto-scrolls to newest message smoothly |

### Animation Files
- `frontend/src/lib/animations.ts` — Shared motion variants, easing curves, stagger containers
- `frontend/src/components/motion/MotionPrimitives.tsx` — `MotionPage`, `MotionCard`, `MotionButton`, `AnimatedModal`
- `frontend/src/app/layout.tsx` — `AnimatePresence` route transition wrapper

---

## 15. AI Playground ✅ COMPLETE

| Feature | Description |
|---------|-------------|
| **Live Extraction Test** | Type any customer message → see what the AI extracts (intent, budget, config, location, etc.) |
| **Live Reply Test** | Type a message → get the actual AI reply that would be sent on WhatsApp |
| **Config-Aware** | Uses the org's current `agent_config` — tests the real persona and prompt |
| **Instant Feedback** | Shows extracted JSON + generated reply side-by-side |
| **No WhatsApp Needed** | Test AI behavior without connecting WhatsApp bridge |

### Playground Files
- `frontend/src/app/dashboard/playground/page.tsx` — Extraction + reply testing UI
- `backend/src/routes/ai.routes.ts` — `POST /api/ai/test-extraction`, `POST /api/ai/test-reply`

---

## 16. Sarvam Voice Calling Agent ✅ COMPLETE

Real AI phone calls via **Sarvam AI voice agents** — outbound PSTN calls (Hindi/English) that qualify leads, book site visits, and write results back to the CRM. Full plan: `docs/SARVAM_CALLING_PLAN.md`.

| Feature | Description |
|---------|-------------|
| **Real Outbound Calls** | `POST /api/calls/start-real` places an actual phone call to the lead via Sarvam voice agents (Hindi/English PSTN) |
| **One-Click from Lead Page** | "Call with AI (Sarvam)" button on lead detail page — shows live status until webhook result arrives |
| **Safety Guards** | API key presence, calling-hours window (IST 9–21 configurable), DNC list, per-org daily cost caps |
| **Result Webhook** | `/webhooks/sarvam/:secret` — unguessable-URL auth (403 on bad secret, 400 malformed, 200 otherwise to stop retries) |
| **Webhook Audit Trail** | Every raw payload persisted to `sarvam_webhook_events` before processing — replayable + debuggable |
| **Idempotent Processing** | `process_call_result` queue job correlates Sarvam `attempt_id` → `call_sessions.external_call_id`; terminal-state skip prevents double processing |
| **Live Mid-Call Tools** | During real calls the Sarvam agent calls our API: `GET /api/tools/sarvam/lead-context?phone=` (lead + recent chat for personalized greeting) and `GET /api/tools/sarvam/inventory-search?query=` (free-text EN/Hindi search) |
| **Query Parser** | `queryParser.ts` converts free-text queries (`3bhk sector 150 noida 2cr`) into structured city/sector/config/budget filters for inventory search |
| **Never-5xx Tool Endpoints** | Tool routes auth via `X-Tool-Secret` header and always return 200 with `{ error }` payloads — a failing tool never breaks the live call |
| **LLM Call Summaries** | DeepSeek `summarizeCall()` turns the raw transcript into summary + outcome + lead updates |
| **Transcript Storage** | Conversation turns saved to `call_session_turns`; full transcript on `call_sessions.transcript` |
| **Lead Enrichment** | Call results update lead temperature, preferences, and agent variables automatically |
| **Auto Follow-ups** | `callback_requested` / `site_visit_requested` / `booking_requested` outcomes auto-create follow-up tasks |
| **Graceful Fallback** | No `SARVAM_API_KEY` configured → falls back to browser demo flow, or returns 400 with clear message |
| **Fallback Demo Retained** | Browser `speechSynthesis` call demo still works with zero telephony setup |

### Sarvam Files
- `backend/src/sarvam/sarvamClient.ts` — Sarvam Instant Outbound API client
- `backend/src/sarvam/callResultService.ts` — Webhook payload processing → transcript, summary, lead enrichment
- `backend/src/routes/sarvamWebhook.routes.ts` — `/webhooks/sarvam/:secret` endpoint
- `backend/src/routes/sarvamTools.routes.ts` — mid-call lead-context + inventory-search tools
- `backend/src/sarvam/queryParser.ts` — free-text → structured filters (city/sector/config/budget)
- `backend/src/routes/calls.routes.ts` — `start-real` endpoint with guards
- `backend/src/queue/queueWorker.ts` + `jobHandler.ts` — `process_call_result` job processing
- `supabase/migrations/20260108_0001_sarvam_calls.sql` + `20260109_0001_sarvam_fixes.sql` — schema + idempotent fixes
- `backend/tests/unit/callResultService.test.ts` — webhook → CRM writeback unit tests

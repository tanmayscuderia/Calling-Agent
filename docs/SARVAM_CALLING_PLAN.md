# Sarvam Voice Calling Agent — Master Integration Plan

> **Status:** SHIPPED & LIVE — Phases S0–S6 implemented (see Progress Log); live agent "Priya" calling with mid-call tools (`inventory-search`, `lead-context`) + free-text query parsing
> **Created:** 2026-08-16
> **Source docs:** `sarvam-voice-agents-md/` (101 pages)
> **Related:** `docs/ARCHITECTURE.md` §6 · `docs/ROADMAP.md` Phase F · Fish Audio approach was evaluated and dropped in favour of Sarvam
> **Working rule:** Work through phases S0→S6 in order. Check off items as they complete. This file is the single source of truth for the calling integration.

---

## 0. What We're Building (One Paragraph)

Real AI phone calls via **Sarvam Voice Agents** (managed STT + LLM + TTS + telephony + barge-in, Indic languages). Our backend becomes the **orchestrator + CRM system-of-record**: it triggers calls with lead context, receives results via webhook, saves transcripts to `call_session_turns`, **captures the caller's name**, **auto-categorizes the lead** (temperature/status/budget/location — same logic as WhatsApp), and creates follow-ups. The browser demo stays for offline demos.

**Key architectural shift vs browser demo:** voice brain moves OUT of our codebase to Sarvam. Our per-call cost = 1 outbound API request + 1 webhook. No audio ever touches our servers → this *improves* scalability.

```
OUTBOUND (we initiate):
Lead Detail → "Call via AI Agent" → POST /api/calls/start-real
  → call_sessions row (provider='sarvam', status='created')
  → sarvamClient.createOutboundCall() with webhook metadata {callSessionId, leadId, orgId}
  → Sarvam calls the phone (their STT/LLM/TTS/telephony)
  → webhook hits /webhooks/sarvam/:secret → 200 instantly → enqueue job
  → worker: finalizeCall → transcript + summary + name capture + auto-categorize + follow-up
    Extraction is now WhatsApp-grade & config-driven:
    - buildCallSummaryPrompt(cfg): schema built from the org's qualifying_fields
      (same Indian budget rules + hot/warm/cold rules as WhatsApp extraction), plus caller_name
    - normalizeCallPreferences(): whitelists LLM output to real crm_leads columns
      (preferred_city/sector/location mapping, enum validation, junk keys dropped,
      industry extras merged into lead metadata)
    - caller_name → full_name only when the lead has no name yet

INBOUND (Phase 7, later): caller dials Sarvam number → webhook → findOrCreateLeadByPhone → same processing
```

---

## 1. Scalability Verdict (Honest)

**Holds up well:** Postgres queue with `FOR UPDATE SKIP LOCKED` (multi-worker ready today), stateless Fastify routes, org-scoped queries with indexes, and Sarvam offloads ALL voice media.

**Known ceilings (none block this integration):**

| Issue | Impact | Fix (when needed) |
|---|---|---|
| In-memory rate limiter / LLM concurrency / config cache | Drifts across multiple API nodes | Redis (Roadmap G) |
| Single process = API + worker + WhatsApp bridges | Restart cycles everything | `ROLE=api\|worker\|bridge` env split (~20 lines) |
| Baileys per-account single node | Acceptable; designed | Meta Cloud API adapter (Roadmap F) |
| Webhook retries → duplicate processing | Double follow-ups | **Solved in this plan** (S1 idempotency + S4 check) |

**Deploy guidance until Redis phase: exactly one API instance.** Fine for hundreds of orgs / thousands of calls per day.

---

## 2. Data Contract (agreed mapping)

### call_sessions ↔ Sarvam webhook

| Our column | Sarvam source | Notes |
|---|---|---|
| `external_call_id` | `attempt_id` | Unique per (org_id) — S1 index → idempotency anchor |
| `interaction_id` *(new col)* | `interaction_id` | For analytics API (transcript/recording fetch) |
| `status` | `status` | `connected→completed`, `no_answer→missed`, `busy→missed`, `failed→failed` |
| `duration_sec` | `duration` | seconds |
| `transcript` / `call_session_turns` | `interaction_transcript[]` | `role:agent→agent`, `role:user→customer`, order preserved |
| `recording_url` | analytics API (fetch by interaction_id) | Phase 5+ |
| `metadata` | full raw payload | audit + debugging |
| `outcome` | `final_agent_variables.disposition` | see enum below |

### Lead auto-categorization from `final_agent_variables`

| Sarvam output variable | Type | Maps to | Rule |
|---|---|---|---|
| `customer_name` | string | `crm_leads.full_name` | **Only if lead name currently empty** (never overwrite) |
| `disposition` | enum: `interested`, `not_interested`, `callback_requested`, `site_visit_requested`, `wrong_person`, `no_consent` | `call_sessions.outcome` + status logic | `site_visit_requested` → status `site_visit_scheduled`; `not_interested` → temp `cold` |
| `lead_temperature` | enum: hot/warm/cold/unknown | `crm_leads.temperature` | |
| `preferred_location` | string | `crm_leads.preferred_location` | via `locationAliases.ts` |
| `budget_max` | string | `crm_leads.budget_max` | parse via `money.ts` |
| `configuration` | string | `crm_leads.configuration` | |

- **Follow-ups auto-created** on `callback_requested` / `site_visit_requested` (same as `:id/end` today).
- **Fallback:** if `final_agent_variables` missing/thin → run existing `summarizeCall()` on transcript so categorization is never silently skipped.
- **Who called is never lost:** every call = `call_sessions` row with lead_id, from/to, transcript, summary, outcome, recording_url, raw payload.

---

## 3. Phases

### Phase S0 — Sarvam account setup (manual, before code) ☐

- [ ] Create Sarvam account → Settings → API Key → `SARVAM_API_KEY`
- [ ] Note `org_id` + `workspace_id` from dashboard URL
- [ ] Rent/connect phone number (Sarvam/Exotel/Twilio) → `SARVAM_AGENT_PHONE_NUMBER` + `connection_id`
- [ ] Build voice agent in Sarvam dashboard; system prompt = copy from our `GET /api/agent/config/call-prompt` (built in S3) so phone persona == WhatsApp persona
- [ ] Create output variables EXACTLY per §2 contract (`customer_name`, `disposition`, `lead_temperature`, `preferred_location`, `budget_max`, `configuration`)
- [ ] Set call goal: `disposition = interested`
- [ ] Test in Sarvam "test agent" before touching code

### Phase S1 — Database migration ☐

**New: `supabase/migrations/20260108_0001_sarvam_calls.sql`**

- [ ] Relax `call_sessions.provider` CHECK → add `'sarvam'` (DROP + ADD constraint, superset OK)
- [ ] `ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS interaction_id text`
- [ ] `ALTER TABLE call_sessions ADD COLUMN IF NOT EXISTS provider_account_id text`
- [ ] Unique partial index `(org_id, external_call_id) WHERE external_call_id IS NOT NULL` → webhook idempotency
- [ ] Index `(org_id, interaction_id)` for analytics lookups
- [ ] New table `sarvam_webhook_events` (id, org_id, attempt_id, payload jsonb, received_at, processed_at, processing_error) — raw audit + retry debugging
- [ ] Run migration; update `docs/DATABASE.md` migration table

**No status-value migration needed** (mapping in §2 uses existing statuses). `crm_leads.source` is free text → `'ai_call'` works as-is.

### Phase S2 — Sarvam client + config ☐

**New: `backend/src/sarvam/sarvamClient.ts`**

- [ ] `createOutboundCall({ appId, appVersion, connectionId, agentPhoneNumber, userPhoneNumber, webhookUrl, metadata })` → `{ attempt_id }`
- [ ] `getInteractionDetails(interactionId)` (analytics API — transcript/recording fetch)
- [ ] Hardening mirrors `llmClient.ts`: `X-API-Key` header, 15s AbortController timeout, 3× retry on 429/5xx with backoff, never throws into call flow (returns null → route returns 502 + clear message)

**Modify: `backend/src/config.ts`** — add `sarvam` block:

- [ ] `apiKey`, `orgId`, `workspaceId`, `appId`, `appVersion` (default 1), `connectionId`, `agentPhoneNumber`, `webhookSecret`, `baseUrl` (https://apps.sarvam.io), `publicUrl` (for webhook URL construction)
- [ ] **Modify `.env.example`** — all vars documented

**Graceful degradation:** empty API key → `start-real` returns `{ error: 'Sarvam not configured' }`; browser demo unaffected.

### Phase S3 — Trigger real call ☐

**Modify: `backend/src/routes/calls.routes.ts`**

- [ ] `POST /api/calls/start-real { leadId }`:
  1. Validate lead + phone (`phone.ts` → E.164, required by Sarvam)
  2. Guards: calling-hours window (default 9am–9pm IST, env-configurable), lead not `junk`/`lost`, no in-flight call for this lead
  3. Insert `call_sessions` (provider `sarvam`, direction `outbound`, status `created`, from=agent number, to=lead phone)
  4. `sarvamClient.createOutboundCall()` with `webhook_config.url = {publicUrl}/webhooks/sarvam/{secret}` + `metadata: { callSessionId, leadId, orgId }`
  5. Success → save `external_call_id`, status `ringing`, lead `last_contacted_at`, `new→contacted`
  6. Failure → status `failed`, return 502 with Sarvam error
- [ ] `GET /api/agent/config/call-prompt` — returns `buildCallSystemPrompt(cfg)` text (persona export for Sarvam dashboard; programmatic sync = Phase 8)

### Phase S4 — Webhook + CRM post-processing (the heart, ~60% of work) ☐

**New: `backend/src/routes/sarvamWebhook.routes.ts`**

- [ ] `POST /webhooks/sarvam/:secret` — constant-time secret compare, 401 on mismatch; **register in `server.ts` BEFORE/OUTSIDE authed routes** (secret IS the auth)
- [ ] Handler does ONLY: insert `sarvam_webhook_events` → enqueue `process_call_result` job → `200 {received:true}` (never blocks on DB chains)

**Modify: `backend/src/queue/jobHandler.ts`** — new `process_call_result` job type → `callResultService.processCallResult(payload)`

**New: `backend/src/crm/callResultService.ts`** — single shared categorization path:

- [ ] 1. Idempotency: find session by `external_call_id=attempt_id`; terminal status → mark event processed, skip
- [ ] 2. Resolve session; not found (inbound/unexpected) → `findOrCreateLeadByPhone` (`source='ai_call'`) + create session
- [ ] 3. Map status/duration/numbers per §2; save `interaction_id`
- [ ] 4. Transcript: `interaction_transcript[]` → `call_session_turns` + plain-text `transcript`
- [ ] 5. **Name capture:** `customer_name` non-empty AND lead name empty → update `full_name`; log to `ai_agent_runs`
- [ ] 6. **Auto-categorize:** variables → temperature / preferred_location (via `locationAliases`) / budget_max (via `money.ts`) / configuration → reuse `leadService` status pipeline logic
- [ ] 7. Outcome → follow-ups on `callback_requested`/`site_visit_requested`
- [ ] 8. Fallback `summarizeCall()` if variables thin
- [ ] 9. Persist: raw payload → `metadata`; run → `ai_agent_runs`; event → `processed_at`
- [ ] 10. Errors → existing queue retry/backoff; `processing_error` recorded
- [ ] **Refactor:** extract lead-update/follow-up block from `:id/end` into this service so browser demo + Sarvam share ONE path (no drift)

### Phase S5 — Frontend ☐

- [ ] `leads/[id]/page.tsx`: "📞 Call via AI Agent" button beside demo → toast "Calling {phone}…" → poll `GET /api/calls/:id` (10s, 5min cap) for status
- [ ] `calls/page.tsx`: provider badge (Sarvam/Browser), status badges (missed/failed/in-progress), duration, expandable transcript (reuse turn rendering), link to lead
- [ ] `CallDemoModal.tsx`: unchanged (offline demos)
- [ ] Later polish: recording playback, WebSocket live updates

### Phase S6 — Tests + docs ☐

**Unit tests (no API keys):**

- [ ] Webhook secret auth (valid/invalid)
- [ ] Status mapping (connected/no_answer/busy/failed)
- [ ] Idempotency: duplicate webhook → single processing
- [ ] `final_agent_variables` → lead field mapping
- [ ] Name capture only-if-empty rule (never overwrite)
- [ ] No-answer → no follow-up, no categorization overwrite
- [ ] `sarvamClient` mocked-fetch: retry/timeout/never-throw

**Evals (DeepSeek key):**

- [ ] Fallback categorization quality on real transcripts

**Docs:**

- [ ] New `docs/SARVAM_INTEGRATION.md` (setup, env, variables contract, webhook spec, troubleshooting)
- [ ] Update `ARCHITECTURE.md` §6 (real + demo flows, webhook diagram)
- [ ] Update `API_REFERENCE.md`, `PROJECT_CONTEXT.md`, `ROADMAP.md` (Phase F "Real voice calling" → done when shipped), `README.md`
- [ ] Fix stale test counts across docs while we're in there (README 290 vs ARCHITECTURE 241 vs PROJECT_CONTEXT 269)

---

## 4. Later Phases (deliberately out of scope now)

1. **Campaigns/cohorts** — bulk re-engagement: export cold leads → campaign CSV → campaign webhooks → same `processCallResult` (DND + rate = Sarvam-side)
2. **Inbound calls** — inbound number → webhook → same path
3. **On-start hook** — Sarvam calls our `/webhooks/sarvam/onstart` with caller phone → return live lead context + inventory match → personalized greeting
4. **Programmatic persona sync** — `agent_configs` → Sarvam app-authoring API on save
5. **ROLE split + Redis** — from scalability section

---

## 5. Prerequisites Checklist (blocking)

- [ ] Sarvam account + API key + org/workspace IDs + rented number (S0)
- [ ] Public HTTPS backend URL reachable by Sarvam webhooks (ngrok dev / VPS prod)
- [ ] Output-variable contract confirmed in Sarvam dashboard (§2)
- [ ] Calling hours policy confirmed (default 9am–9pm IST)

## 6. Build Order & Effort

S1 → S2 → S3 (test with own phone) → S4 (biggest) → S5 → S6. ~3–4 focused days total; S4 is the bulk.

---

## Progress Log

| Date | Phase | Note |
|---|---|---|
| 2026-08-16 | — | Plan created from repo + Sarvam docs analysis |
| 2026-08-20 | Live tools | Free-text `query` parser shipped: Sarvam only sends the caller's demand as one agent-filled `query` param, but the tool read only structured params → zero filters → unfiltered top-3 every call. New `backend/src/sarvam/queryParser.ts` (pure regex, EN+Hindi) extracts city/sector/configuration/budget; explicit dashboard params still win; multi-config ("3 or 4 bhk") runs one pass each; response echoes `filters`. 24 new tests, suite 240/240, tsc clean (commit `efbd879`) |

> **Update (S1b — schema alignment):** Live-DB audit found the pre-Sarvam `job_queue.job_type` and `call_sessions.status/provider` CHECKs lacked the values the webhook flow writes, and `callResultService` used `duration_seconds` instead of `duration_sec`. Fixed via migration `20260109_0001_sarvam_fixes.sql` (idempotent, also re-asserts 20260108) + code fix. Run migration 14 in Supabase before first real call.

# MODULES.md — Platform Module Registry

> **Source of truth for every module in the platform** — what it does, its status, where it lives, and how it gets enabled/disabled. The app is releasing soon; new modules (like **Task Management**) must follow the module-flag pattern below so orgs can turn features on/off without code changes.

---

## 1. Module Overview

| # | Module | Status | Enabled via (today) | Per-org toggle (planned) |
|---|--------|--------|--------------------|--------------------------|
| 1 | **Core CRM** — leads, conversations, follow-ups, unified phone merge | ✅ Live | Always on (core) | Core — always on |
| 2 | **Auth & Multi-Tenant Orgs** — Supabase Auth, httpOnly cookies, roles | ✅ Live | Always on (core) | Core — always on |
| 3 | **WhatsApp AI Bridge — Baileys** (QR demo tier) | ✅ Live | Per-account: Dashboard → WhatsApp → connect (QR) | `whatsapp` module flag |
| 4 | **WhatsApp Cloud API — Meta official** (business tier) | ✅ Live | Per-account: Dashboard → WhatsApp → Meta connect | `whatsapp` module flag |
| 5 | **AI Reply Engine** — queue pipeline, prompt engine, 12 industry templates, inventory-grounded replies | ✅ Live | Per-conversation `ai_enabled` toggle + per-account limits | `ai_replies` module flag |
| 6 | **Voice Calling — Sarvam** — inbound + outbound PSTN voice agent, transcripts, summaries, auto follow-ups | ✅ Live | Org-level Sarvam credentials + `SARVAM_INBOUND_POLLER` | `voice_calling` module flag |
| 7 | **Browser Call Demo** — speechSynthesis + text input, zero telephony | ✅ Live | `/dashboard/voice-demo` | `voice_calling` module flag |
| 8 | **Inventory Manager** — CSV upload, generic schema, structured search | ✅ Live | Dashboard → Inventory | `inventory` module flag |
| 9 | **Usage & Cost Dashboard** — LLM tokens/cost, call minutes/cost, per-number limits | ✅ Live | `/dashboard/usage` | `usage` module flag |
| 10 | **Guardrails** — reply batching (~6s), two-stage spam referee, per-number daily limits, DNC + IST calling hours | ✅ Live | Env/config tuned | Part of `ai_replies` / `voice_calling` |
| 11 | **🆕 Task Management for Employees** | 📋 Planned (next) | — | `task_management` module flag |
| 12 | Notifications (in-app + email for hot leads / assignments) | 📋 Planned | — | `notifications` module flag |
| 13 | Kanban deal pipelines | 📋 Planned (Phase U) | — | `pipelines` module flag |
| 14 | Analytics (conversion funnels, response times) | 📋 Planned | — | `analytics` module flag |

**Rule of thumb:** modules 1–2 are core and always on. Modules 3–10 are live and will move behind `org_modules` flags. Modules 11–14 ship as flag-gated from day one.

---

## 2. Module Flag Architecture (planned for release)

Today, "enabling/disabling" is implicit: connect/disconnect a WhatsApp account, toggle `ai_enabled` per conversation, set Sarvam env vars. That works for one org but not for a released multi-org product. The release architecture adds **explicit per-org module flags**:

### 2.1 New table: `org_modules`

```sql
create table if not exists org_modules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  module_key text not null,            -- 'whatsapp' | 'ai_replies' | 'voice_calling' |
                                       -- 'inventory' | 'usage' | 'task_management' | ...
  enabled boolean not null default true,
  config jsonb not null default '{}',  -- per-module settings
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, module_key)
);
```

### 2.2 Helper: `backend/src/modules/moduleFlags.ts`

```ts
isModuleEnabled(orgId, 'task_management'): Promise<boolean>
// KV-cached (5-min TTL, same pattern as the agent config cache).
// Missing row = module's default state (core modules default true).
```

### 2.3 Enforcement points

| Layer | Check |
|-------|-------|
| **Routes** | `requireModule('voice_calling')` fastify preHandler on module-scoped routes (`/api/sarvam/*`, `/api/usage/*`, future `/api/tasks/*`) |
| **Background workers** | Poller + queue handlers early-return when the owning module is off (same fail-open style as existing limits) |
| **Frontend** | `GET /api/modules` returns the enabled set; nav items and pages hide accordingly |
| **Onboarding** | New orgs get a default row set; setup wizard flips flags as features are configured |

### 2.4 Rules

- **MUST** fail closed for writes, fail open for reads of already-stored data (a disabled module never loses history).
- **MUST** keep module checks KV-cached — flag checks run on every message/job.
- **NEVER** delete module data when a flag turns off — flags hide features, they never destroy data.

---

## 3. 🆕 Task Management for Employees (planned — next module)

**Goal:** employees (org members) get a task board fed by both manual assignment and the AI pipeline, so every AI outcome that needs a human action becomes a tracked task.

### 3.1 Schema (migration sketch — follow `docs/DATABASE.md` conventions)

```sql
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references org_members(id) on delete set null,
  created_by uuid references org_members(id),
  lead_id uuid references crm_leads(id) on delete set null,
  call_session_id uuid references call_sessions(id) on delete set null,
  status text not null default 'todo'
    check (status in ('todo','in_progress','done','blocked','cancelled')),
  priority text not null default 'medium'
    check (priority in ('low','medium','high','urgent')),
  due_at timestamptz,
  completed_at timestamptz,
  source text not null default 'manual' check (source in ('manual','ai_call','ai_whatsapp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_org_assignee_status on tasks (org_id, assignee_id, status);
create index if not exists tasks_org_due on tasks (org_id, due_at)
  where status not in ('done','cancelled');
```

### 3.2 Auto-task generation (the differentiator)

The AI already detects intent — wire outcomes to tasks in `callFinalizer` / `jobHandler` (the same places follow-ups are created today):

| AI outcome | Auto-created task |
|------------|-------------------|
| `callback_requested` | "Call back {lead name}" (priority from lead temperature, due from `next_follow_up_at`) |
| `site_visit_requested` | "Schedule site visit for {lead name}" |
| `booking_requested` | "Close booking — {lead name}, {configuration}, {budget}" (urgent) |
| Hot lead detected | "Follow up with hot lead {lead name}" |
| 24h Meta window expired on a pending conversation | "Reach {lead name} via call — WhatsApp window closed" |

Assignment: manual first; **round-robin across org members** reuses the planned team-assignment workflow (ROADMAP Phase F) — one rotation helper serves both.

### 3.3 Surface area

- **API:** `GET/POST /api/tasks`, `PATCH /api/tasks/:id`, `GET /api/tasks/my` — zod-validated, org-scoped, `requireModule('task_management')`
- **Dashboard:** "Tasks" page — My Tasks / Team Tasks tabs, status columns (todo → in_progress → done), due-date badges, lead link opens the conversation
- **Employee role:** members see only their own tasks (existing role-based visibility pattern)
- **Hooks:** task created → in-app notification (notifications module)

### 3.4 Flag

`task_management` in `org_modules`. Off = routes 404, nav hidden, auto-task generation skipped — existing follow-ups/calls untouched.

---

## 4. Module Map — where each one lives in the code

| Module | Backend | Frontend | Docs |
|--------|---------|----------|------|
| Core CRM | `crm/leadService.ts`, `crm/conversationService.ts`, `routes/conversations.routes.ts` | `/dashboard`, `/dashboard/leads`, `/dashboard/conversations` | `docs/FEATURES.md` §2–4 |
| Auth & Orgs | `auth/authMiddleware.ts`, `routes/auth.routes.ts` | `/login`, AuthProvider | `docs/FEATURES.md` §0 |
| WhatsApp (Baileys) | `whatsapp/baileysClient.ts`, `whatsapp/connectionManager.ts`, `whatsapp/whatsappService.ts` | `/dashboard/whatsapp` | `docs/FEATURES.md` §1 |
| WhatsApp (Meta) | `whatsapp/metaCloudClient.ts`, `whatsapp/metaApi.ts`, `routes/whatsappWebhook.routes.ts`, `routes/whatsappMeta.routes.ts` | `MetaCloudConnect.tsx` | `docs/META_CLOUD_API.md` |
| AI Reply Engine | `ai/baseAgent.ts`, `ai/promptEngine.ts`, `ai/inventorySearch.ts`, `queue/jobHandler.ts`, `queue/queueWorker.ts` | Agent Settings | `docs/FEATURES.md` §5–7 |
| Voice Calling (Sarvam) | `sarvam/sarvamClient.ts`, `sarvam/callResultService.ts`, `sarvam/callFinalizer.ts`, `sarvam/inboundPoller.ts`, `routes/sarvamWebhook.routes.ts`, `routes/sarvamTools.routes.ts` | `/dashboard/calls` | `docs/SARVAM_CALLING_PLAN.md`, `docs/sarvam-dashboard-setup.md` |
| Inventory | `crm/propertyService.ts`, `routes/inventory.routes.ts` | `/dashboard/inventory` | `docs/FEATURES.md` §8 |
| Usage & Cost | `crm/usageService.ts`, `routes/usage.routes.ts` | `/dashboard/usage` | `docs/FEATURES.md` §17 |
| Task Management (planned) | `tasks/taskService.ts`, `routes/tasks.routes.ts` (new) | `/dashboard/tasks` (new) | this file §3 |



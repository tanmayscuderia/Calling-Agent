# Database Schema — Multi-Industry WhatsApp AI + Calling Agent Platform

All tables, columns, relationships, and indexes.

> **Migrations:** `supabase/migrations/`
> - `20260101_0000_core_schema.sql` — Core tables (organizations, users, members)
> - `20260101_0001_real_estate_ai_prototype.sql` — All prototype tables
> - `20260101_0002_demo_seed.sql` — 5 demo properties
> - `20260102_0001_multi_tenant_production.sql` — Multi-tenant auth, rate limits, usage limits
> - `20260102_0001a_job_queue_base.sql` — Base `job_queue` table + dequeue/complete/fail/reclaim/stats RPCs
> - `20260102_0002_queue_hardening.sql` — Queue locking, retry, stale recovery columns
> - `20260103_0001_agent_configs_templates.sql` — Agent config + template tables + 8 seed templates
> - `20260103_0002_lead_dedup_unique_indexes.sql` — Lead dedup unique constraints
> - `20260104_0001_more_industry_templates.sql` — 4 more templates (legal, automotive, salon, insurance)
> - `20260105_0001_fix_dequeue_rpc_ambiguous.sql` — Fix column ambiguity in `dequeue_job()` RPC

---

## Core Tables

### `organizations`
Top-level multi-tenant entity.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `name` | text | Org name |
| `created_at` | timestamptz | Default `now()` |

---

### `organization_members`
Team members within an org.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `user_id` | uuid FK → users | CASCADE |
| `role` | text | `admin`, `member`, etc. |
| `created_at` | timestamptz | Default `now()` |

---

### `users`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `email` | text | Unique |
| `full_name` | text | |
| `created_at` | timestamptz | Default `now()` |

---

## Real Estate Inventory Tables

### `real_estate_projects`

Property projects/towers.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `name` | text | Required |
| `developer_name` | text | |
| `location` | text | |
| `city` | text | |
| `sector` | text | |
| `address` | text | |
| `project_type` | text | Default `residential` |
| `status` | text | `active`, `inactive`, `sold_out`, `archived` |
| `possession_date` | date | |
| `rera_number` | text | |
| `description` | text | |
| `amenities` | text[] | Default `{}` |
| `metadata` | jsonb | Default `{}` |
| `created_by` | uuid FK → organization_members | |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Auto-updated via trigger |

**Indexes:**
- `idx_real_estate_projects_org_id` (org_id)
- `idx_real_estate_projects_location` (org_id, city, sector)

---

### `real_estate_units`

Individual units/apartments within projects.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `project_id` | uuid FK → real_estate_projects | CASCADE |
| `title` | text | |
| `configuration` | text | e.g. "2BHK", "3BHK", "4BHK" |
| `unit_type` | text | Default `apartment` |
| `tower` | text | |
| `floor` | text | |
| `carpet_area_sqft` | numeric | |
| `builtup_area_sqft` | numeric | |
| `super_area_sqft` | numeric | |
| `price_min` | numeric | |
| `price_max` | numeric | |
| `currency` | text | Default `INR` |
| `availability_status` | text | `available`, `reserved`, `sold`, `inactive` |
| `facing` | text | |
| `furnishing` | text | |
| `parking` | text | |
| `possession_status` | text | e.g. "ready", "under_construction" |
| `description` | text | |
| `media_urls` | text[] | Default `{}` |
| `brochure_url` | text | |
| `metadata` | jsonb | Default `{}` |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Auto-updated via trigger |

**Indexes:**
- `idx_real_estate_units_org_id` (org_id)
- `idx_real_estate_units_project_id` (project_id)
- `idx_real_estate_units_search` (org_id, configuration, availability_status, price_min, price_max)

---

### `real_estate_import_batches`

Tracks CSV/PDF upload jobs.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `source_type` | text | `csv`, `pdf`, `manual`, `website`, `api` |
| `file_name` | text | |
| `storage_path` | text | |
| `status` | text | `uploaded`, `processing`, `completed`, `failed` |
| `total_rows` | integer | |
| `success_rows` | integer | |
| `failed_rows` | integer | |
| `error` | text | |
| `metadata` | jsonb | |
| `uploaded_by` | uuid FK → organization_members | |
| `created_at` | timestamptz | Default `now()` |
| `processed_at` | timestamptz | |

---

## CRM Tables

### `crm_leads`

The main lead table.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `full_name` | text | |
| `phone` | text | Normalized: `+919999999999` |
| `whatsapp_number` | text | Same format |
| `email` | text | |
| `source` | text | Default `whatsapp` |
| `source_detail` | text | |
| `lead_type` | text | `buyer`, `seller`, `tenant`, `landlord`, `investor`, `unknown` |
| `status` | text | `new`, `contacted`, `qualified`, `site_visit_scheduled`, `negotiation`, `won`, `lost`, `junk` |
| `temperature` | text | `hot`, `warm`, `cold`, `unknown` |
| `preferred_location` | text | |
| `preferred_city` | text | |
| `preferred_sector` | text | |
| `configuration` | text | e.g. "3BHK" |
| `budget_min` | numeric | |
| `budget_max` | numeric | |
| `possession_preference` | text | `ready_to_move`, `under_construction`, `resale`, `any` |
| `purpose` | text | `end_use`, `investment`, `rental` |
| `timeline` | text | |
| `assigned_to` | uuid FK → organization_members | |
| `last_contacted_at` | timestamptz | |
| `next_follow_up_at` | timestamptz | |
| `ai_summary` | text | LLM-generated summary |
| `notes` | text | |
| `metadata` | jsonb | Default `{}` |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Auto-updated via trigger |

**Indexes:**
- `idx_crm_leads_org_id` (org_id)
- `idx_crm_leads_phone` (org_id, phone)
- `idx_crm_leads_whatsapp` (org_id, whatsapp_number)
- `idx_crm_leads_status` (org_id, status, temperature)
- `idx_crm_leads_followup` (org_id, next_follow_up_at)

---

### `crm_lead_property_matches`

Properties recommended to a lead.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `lead_id` | uuid FK → crm_leads | CASCADE |
| `project_id` | uuid FK → real_estate_projects | SET NULL on delete |
| `unit_id` | uuid FK → real_estate_units | SET NULL on delete |
| `match_score` | numeric | 0.0–1.0 |
| `reason` | text | Why it matched |
| `shown_to_customer` | boolean | Default false |
| `customer_response` | text | |
| `created_at` | timestamptz | Default `now()` |

---

### `lead_followups`

Scheduled follow-up tasks.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `lead_id` | uuid FK → crm_leads | CASCADE |
| `assigned_to` | uuid FK → organization_members | |
| `type` | text | `call`, `whatsapp`, `site_visit`, `email`, `meeting`, `other` |
| `title` | text | |
| `notes` | text | |
| `scheduled_at` | timestamptz | |
| `completed_at` | timestamptz | |
| `status` | text | `pending`, `completed`, `missed`, `cancelled` |
| `metadata` | jsonb | |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Auto-updated |

---

## WhatsApp & Messaging Tables

### `whatsapp_accounts`

WhatsApp connection accounts (Baileys sessions).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `label` | text | Required |
| `phone_number` | text | Connected phone |
| `provider` | text | `baileys`, `meta_cloud_api`, `gupshup`, `wati`, `twilio`, `other` |
| `status` | text | `connected`, `disconnected`, `qr_pending`, `error`, `disabled` |
| `session_ref` | text | Session identifier |
| `last_connected_at` | timestamptz | |
| `last_error` | text | |
| `config` | jsonb | |
| `metadata` | jsonb | |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Auto-updated |

---

### `customer_conversations`

Conversation threads per customer.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `channel` | text | `whatsapp`, `telegram`, `web`, `phone`, `email` |
| `whatsapp_account_id` | uuid FK → whatsapp_accounts | SET NULL |
| `external_chat_id` | text | WhatsApp JID: `919999999999@s.whatsapp.net` |
| `lead_id` | uuid FK → crm_leads | SET NULL |
| `customer_name` | text | |
| `customer_phone` | text | |
| `status` | text | `open`, `pending_human`, `closed`, `blocked` |
| `ai_enabled` | boolean | Default true |
| `human_handoff` | boolean | Default false |
| `last_message_at` | timestamptz | |
| `last_inbound_at` | timestamptz | |
| `last_outbound_at` | timestamptz | |
| `summary` | text | AI-generated |
| `metadata` | jsonb | |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Auto-updated |

**Unique constraint:** `(org_id, channel, external_chat_id)`

**Indexes:**
- `idx_customer_conversations_org_id`
- `idx_customer_conversations_lead_id`
- `idx_customer_conversations_last_message` (org_id, last_message_at DESC)

---

### `customer_messages`

Individual messages within conversations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `conversation_id` | uuid FK → customer_conversations | CASCADE |
| `lead_id` | uuid FK → crm_leads | SET NULL |
| `channel` | text | Default `whatsapp` |
| `direction` | text | `inbound`, `outbound` |
| `external_message_id` | text | WhatsApp message ID |
| `sender_id` | text | |
| `sender_phone` | text | |
| `receiver_id` | text | |
| `message_type` | text | `text`, `image`, `audio`, `video`, `document`, `location`, `button`, `unknown` |
| `body` | text | Message content |
| `media_url` | text | |
| `media_mime_type` | text | |
| `ai_generated` | boolean | Default false |
| `ai_model` | text | e.g. `deepseek-v4-flash` |
| `ai_confidence` | numeric | |
| `raw_payload` | jsonb | Full message payload |
| `metadata` | jsonb | |
| `sent_at` | timestamptz | |
| `received_at` | timestamptz | |
| `created_at` | timestamptz | Default `now()` |

**Indexes:**
- `idx_customer_messages_conversation` (conversation_id, created_at ASC)
- `idx_customer_messages_org_created` (org_id, created_at DESC)
- `idx_customer_messages_lead` (lead_id)

---

## AI Tables

### `ai_agent_runs`

Audit log for every LLM call.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `conversation_id` | uuid FK → customer_conversations | SET NULL |
| `lead_id` | uuid FK → crm_leads | SET NULL |
| `message_id` | uuid FK → customer_messages | SET NULL |
| `agent_type` | text | `real_estate_whatsapp`, `calling_agent`, `lead_qualifier`, `knowledge_search`, `other` |
| `model` | text | e.g. `deepseek-v4-flash` |
| `input_text` | text | |
| `output_text` | text | |
| `extracted_intent` | text | |
| `extracted_data` | jsonb | Full extraction |
| `tool_calls` | jsonb | |
| `decision` | text | |
| `confidence` | numeric | |
| `latency_ms` | integer | |
| `error` | text | |
| `created_at` | timestamptz | Default `now()` |

---

## Call Tables

### `call_sessions`

AI call session records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `lead_id` | uuid FK → crm_leads | SET NULL |
| `conversation_id` | uuid FK → customer_conversations | SET NULL |
| `provider` | text | `browser_demo`, `exotel`, `twilio`, `plivo`, `other` |
| `external_call_id` | text | |
| `direction` | text | `inbound`, `outbound` |
| `status` | text | `created`, `ringing`, `in_progress`, `completed`, `failed`, `missed`, `cancelled` |
| `from_number` | text | |
| `to_number` | text | |
| `started_at` | timestamptz | |
| `ended_at` | timestamptz | |
| `duration_sec` | integer | |
| `transcript` | text | Full transcript |
| `summary` | text | AI-generated summary |
| `outcome` | text | `interested`, `not_interested`, `callback_requested`, `site_visit_requested`, `wrong_number`, `follow_up_later` |
| `recording_url` | text | |
| `metadata` | jsonb | |
| `created_at` | timestamptz | Default `now()` |
| `updated_at` | timestamptz | Auto-updated |

---

### `call_session_turns`

Individual turns within a call.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `call_session_id` | uuid FK → call_sessions | CASCADE |
| `speaker` | text | `agent`, `customer`, `system` |
| `text` | text | Required |
| `audio_url` | text | |
| `sequence_index` | integer | Turn order |
| `metadata` | jsonb | |
| `created_at` | timestamptz | Default `now()` |

**Index:** `idx_call_session_turns_session` (call_session_id, sequence_index ASC)

---

## Knowledge Tables

### `knowledge_document_chunks`

For future RAG / vector search.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `document_id` | uuid FK → knowledge_documents | CASCADE |
| `chunk_index` | integer | |
| `content` | text | |
| `entity_type` | text | |
| `entity_id` | uuid | |
| `metadata` | jsonb | |
| `created_at` | timestamptz | Default `now()` |

---

## Agent Config Tables (Multi-Industry Platform)

### `agent_configs`
Per-organization AI agent configuration. Each org configures its own persona, qualifying fields, intents, status pipeline, inventory search, and reply templates.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `org_id` | uuid FK → organizations | CASCADE |
| `name` | text | Config name (default: 'Default Agent') |
| `industry` | text | CHECK constraint — real_estate, education, healthcare, d2c_retail, legal_services, travel_hospitality, financial_services, automotive, restaurant, salon_spa, fitness_gym, insurance, custom |
| `persona_name` | text | AI agent name (e.g. "Priya") |
| `persona_role` | text | Agent role (e.g. "Sales Assistant") |
| `tone` | text | professional, friendly, casual, formal, energetic |
| `business_name` | text | Injected into system prompt |
| `business_description` | text | Business context for AI |
| `business_location` | text | Location context |
| `system_prompt_override` | text | If set, replaces auto-generated prompt |
| `qualifying_fields` | jsonb | Array of {key, label, type, options, required_for_qualified} |
| `intent_types` | jsonb | Array of {key, label} |
| `status_pipeline` | jsonb | Array of {key, label} |
| `inventory_enabled` | boolean | Default true |
| `inventory_table` | text | Table to search (e.g. real_estate_units) |
| `search_fields` | jsonb | Array of {field, operator, extract_key} |
| `reply_template_match` | text | "Yes, we have {{count}} options..." |
| `reply_template_no_match` | text | "I don't see an exact match..." |
| `reply_template_missing_info` | text | "What budget range..." |
| `call_agent_enabled` | boolean | Default true |
| `call_opening_template` | text | "Hi, this is {{persona_name}}..." |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now() |
| `updated_at` | timestamptz | Default now() |

**Unique:** `(org_id, name)`

---

### `agent_templates`
Preset library of industry templates. Seeded with 12 industries.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | `gen_random_uuid()` |
| `industry` | text | UNIQUE — e.g. real_estate, education |
| `label` | text | Display name — "Real Estate" |
| `description` | text | Short description |
| `icon` | text | Emoji — 🏢, 🎓, etc. |
| `config` | jsonb | Full preset config (persona, fields, intents, statuses, search, templates) |
| `is_public` | boolean | Default true |
| `created_at` | timestamptz | Default now() |

---

## Production / Queue Tables

### `job_queue`

Durable background job queue for async message processing.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `org_id` | uuid FK → organizations | CASCADE |
| `job_type` | text | `process_message`, `send_reply`, `generate_summary` |
| `payload` | jsonb | Job data (leadId, conversationId, text, etc.) |
| `status` | text | `pending`, `processing`, `completed`, `failed` |
| `priority` | integer | Default 5 (higher = processed first) |
| `attempts` | integer | Current attempt count |
| `max_attempts` | integer | Default 3 |
| `locked_by` | uuid | Worker instance lock token |
| `locked_until` | timestamptz | Lock lease expiry (60s) |
| `next_retry_at` | timestamptz | When to retry after failure |
| `error` | text | Last error message |
| `result` | jsonb | Completion result |
| `scheduled_at` | timestamptz | When job becomes eligible |
| `started_at` | timestamptz | When processing began |
| `completed_at` | timestamptz | When job finished |
| `created_at` | timestamptz | Default `now()` |

**Indexes:**
- `idx_job_queue_dequeue` — Partial index on `(status, next_retry_at) WHERE status = 'pending'`

**RPCs:**
- `dequeue_job()` — Atomic claim via `FOR UPDATE SKIP LOCKED`
- `complete_job(job_id, result)` — Mark done
- `fail_job(job_id, error)` — Retry or mark failed at max_attempts
- `reclaim_stale_jobs()` — Reset crashed workers' locks
- `queue_stats()` — Aggregate counts for monitoring

---

## Triggers

All tables with `updated_at` have auto-update triggers:

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Tables with triggers:
- `real_estate_projects`
- `real_estate_units`
- `crm_leads`
- `customer_conversations`
- `call_sessions`
- `lead_followups`

---

## Entity Relationship Diagram

```
organizations ──────────────────────────────────────────
    │                                                   │
    ├── real_estate_projects ── real_estate_units       │
    │                          │                        │
    │                          │   crm_lead_property_matches
    │                                   │               │
    ├── crm_leads ──────────────────────┘               │
    │       │                                           │
    │       ├── customer_messages                       │
    │       ├── lead_followups                          │
    │       └── call_sessions ── call_session_turns     │
    │                                                   │
    ├── whatsapp_accounts                               │
    │       └── customer_conversations                  │
    │               ├── customer_messages               │
    │               └── ai_agent_runs                   │
    │                                                   │
    └── real_estate_import_batches                      │
                                                        │
organizations ──────────────────────────────────────────
    │                                                   │
    └── job_queue (async processing pipeline)           │

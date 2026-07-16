## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `full_name` | `text` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `locale` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `email` | `text` |  Nullable |
| `mobile_number` | `text` |  Nullable |
| `whatsapp_number` | `text` |  Nullable |

---

## Platform Tables (AI Agent + CRM + WhatsApp + Calls)

> The following tables were added by the WhatsApp AI + Calling Agent platform migrations.
> All include `org_id` referencing `public.organizations(id)`.

## Table `real_estate_projects`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `name` | `text` | Not null |
| `developer_name` | `text` | Nullable |
| `location` | `text` | Nullable |
| `city` | `text` | Nullable |
| `sector` | `text` | Nullable |
| `address` | `text` | Nullable |
| `project_type` | `text` | Default 'residential' |
| `status` | `text` | CHECK (active, inactive, sold_out, archived) |
| `possession_date` | `date` | Nullable |
| `rera_number` | `text` | Nullable |
| `description` | `text` | Nullable |
| `amenities` | `text[]` | Default '{}' |
| `metadata` | `jsonb` | Default '{}' |
| `created_by` | `uuid` | References organization_members(id) |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

## Table `real_estate_units`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `project_id` | `uuid` | References real_estate_projects(id) |
| `title` | `text` | Nullable |
| `configuration` | `text` | Nullable |
| `unit_type` | `text` | Default 'apartment' |
| `tower` | `text` | Nullable |
| `floor` | `text` | Nullable |
| `carpet_area_sqft` | `numeric` | Nullable |
| `builtup_area_sqft` | `numeric` | Nullable |
| `super_area_sqft` | `numeric` | Nullable |
| `price_min` | `numeric` | Nullable |
| `price_max` | `numeric` | Nullable |
| `currency` | `text` | Default 'INR' |
| `availability_status` | `text` | CHECK (available, reserved, sold, inactive) |
| `facing` | `text` | Nullable |
| `furnishing` | `text` | Nullable |
| `parking` | `text` | Nullable |
| `possession_status` | `text` | Nullable |
| `description` | `text` | Nullable |
| `media_urls` | `text[]` | Default '{}' |
| `brochure_url` | `text` | Nullable |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

## Table `real_estate_import_batches`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `source_type` | `text` | CHECK (csv, pdf, manual, website, api) |
| `file_name` | `text` | Nullable |
| `storage_path` | `text` | Nullable |
| `status` | `text` | CHECK (uploaded, processing, completed, failed) |
| `total_rows` | `int4` | Default 0 |
| `success_rows` | `int4` | Default 0 |
| `failed_rows` | `int4` | Default 0 |
| `error` | `text` | Nullable |
| `metadata` | `jsonb` | Default '{}' |
| `uploaded_by` | `uuid` | References organization_members(id) |
| `created_at` | `timestamptz` | Default now() |
| `processed_at` | `timestamptz` | Nullable |

## Table `generic_inventory_items`

Used by non-real-estate industries (Education, Healthcare, E-Commerce, etc.). Unified single-table inventory.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `title` | `text` | Not null |
| `subtitle` | `text` | Nullable |
| `category` | `text` | Nullable |
| `configuration` | `text` | Nullable |
| `unit_type` | `text` | Default 'item' |
| `price_min` | `numeric` | Nullable |
| `price_max` | `numeric` | Nullable |
| `currency` | `text` | Default 'INR' |
| `city` | `text` | Nullable |
| `sector` | `text` | Nullable |
| `location` | `text` | Nullable |
| `address` | `text` | Nullable |
| `availability_status` | `text` | CHECK (available, reserved, sold, inactive) |
| `possession_status` | `text` | Nullable |
| `possession_date` | `date` | Nullable |
| `facing` | `text` | Nullable |
| `furnishing` | `text` | Nullable |
| `parking` | `text` | Nullable |
| `tower` | `text` | Nullable |
| `floor` | `text` | Nullable |
| `carpet_area_sqft` | `numeric` | Nullable |
| `builtup_area_sqft` | `numeric` | Nullable |
| `super_area_sqft` | `numeric` | Nullable |
| `description` | `text` | Nullable |
| `amenities` | `text[]` | Default '{}' |
| `media_urls` | `text[]` | Default '{}' |
| `brochure_url` | `text` | Nullable |
| `attributes` | `jsonb` | Default '{}' — industry-specific fields |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

## Table `crm_leads`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `full_name` | `text` | Nullable |
| `phone` | `text` | Nullable |
| `whatsapp_number` | `text` | Nullable |
| `email` | `text` | Nullable |
| `source` | `text` | Default 'whatsapp' |
| `source_detail` | `text` | Nullable |
| `lead_type` | `text` | CHECK (buyer, seller, tenant, landlord, investor, unknown) |
| `status` | `text` | CHECK (new, contacted, qualified, site_visit_scheduled, negotiation, won, lost, junk) |
| `temperature` | `text` | CHECK (hot, warm, cold, unknown) |
| `preferred_location` | `text` | Nullable |
| `preferred_city` | `text` | Nullable |
| `preferred_sector` | `text` | Nullable |
| `configuration` | `text` | Nullable |
| `budget_min` | `numeric` | Nullable |
| `budget_max` | `numeric` | Nullable |
| `possession_preference` | `text` | Nullable |
| `purpose` | `text` | Nullable |
| `timeline` | `text` | Nullable |
| `assigned_to` | `uuid` | References organization_members(id) |
| `last_contacted_at` | `timestamptz` | Nullable |
| `next_follow_up_at` | `timestamptz` | Nullable |
| `ai_summary` | `text` | Nullable |
| `notes` | `text` | Nullable |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

## Table `crm_lead_property_matches`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `lead_id` | `uuid` | References crm_leads(id) |
| `project_id` | `uuid` | References real_estate_projects(id) |
| `unit_id` | `uuid` | References real_estate_units(id) |
| `match_score` | `numeric` | Nullable |
| `reason` | `text` | Nullable |
| `shown_to_customer` | `bool` | Default false |
| `customer_response` | `text` | Nullable |
| `created_at` | `timestamptz` | Default now() |

## Table `whatsapp_accounts`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `label` | `text` | Not null |
| `phone_number` | `text` | Nullable |
| `provider` | `text` | CHECK (baileys, meta_cloud_api, gupshup, wati, twilio, other) |
| `status` | `text` | CHECK (connected, disconnected, qr_pending, error, disabled) |
| `session_ref` | `text` | Nullable |
| `last_connected_at` | `timestamptz` | Nullable |
| `last_error` | `text` | Nullable |
| `config` | `jsonb` | Default '{}' |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

## Table `customer_conversations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `channel` | `text` | CHECK (whatsapp, telegram, web, phone, email) |
| `whatsapp_account_id` | `uuid` | References whatsapp_accounts(id) |
| `external_chat_id` | `text` | Not null |
| `lead_id` | `uuid` | References crm_leads(id) |
| `customer_name` | `text` | Nullable |
| `customer_phone` | `text` | Nullable |
| `status` | `text` | CHECK (open, pending_human, closed, blocked) |
| `ai_enabled` | `bool` | Default true |
| `human_handoff` | `bool` | Default false |
| `last_message_at` | `timestamptz` | Nullable |
| `last_inbound_at` | `timestamptz` | Nullable |
| `last_outbound_at` | `timestamptz` | Nullable |
| `summary` | `text` | Nullable |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

> **Unique:** (`org_id`, `channel`, `external_chat_id`)

## Table `customer_messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `conversation_id` | `uuid` | References customer_conversations(id) |
| `lead_id` | `uuid` | References crm_leads(id) |
| `channel` | `text` | Default 'whatsapp' |
| `direction` | `text` | CHECK (inbound, outbound) |
| `external_message_id` | `text` | Nullable |
| `sender_id` | `text` | Nullable |
| `sender_phone` | `text` | Nullable |
| `receiver_id` | `text` | Nullable |
| `message_type` | `text` | CHECK (text, image, audio, video, document, location, button, unknown) |
| `body` | `text` | Nullable |
| `media_url` | `text` | Nullable |
| `media_mime_type` | `text` | Nullable |
| `ai_generated` | `bool` | Default false |
| `ai_model` | `text` | Nullable |
| `ai_confidence` | `numeric` | Nullable |
| `raw_payload` | `jsonb` | Default '{}' |
| `metadata` | `jsonb` | Default '{}' |
| `sent_at` | `timestamptz` | Nullable |
| `received_at` | `timestamptz` | Nullable |
| `created_at` | `timestamptz` | Default now() |

## Table `ai_agent_runs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `conversation_id` | `uuid` | References customer_conversations(id) |
| `lead_id` | `uuid` | References crm_leads(id) |
| `message_id` | `uuid` | References customer_messages(id) |
| `agent_type` | `text` | CHECK (real_estate_whatsapp, calling_agent, lead_qualifier, knowledge_search, other) |
| `model` | `text` | Nullable |
| `input_text` | `text` | Nullable |
| `output_text` | `text` | Nullable |
| `extracted_intent` | `text` | Nullable |
| `extracted_data` | `jsonb` | Default '{}' |
| `tool_calls` | `jsonb` | Default '[]' |
| `decision` | `text` | Nullable |
| `confidence` | `numeric` | Nullable |
| `latency_ms` | `int4` | Nullable |
| `error` | `text` | Nullable |
| `created_at` | `timestamptz` | Default now() |

## Table `call_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `lead_id` | `uuid` | References crm_leads(id) |
| `conversation_id` | `uuid` | References customer_conversations(id) |
| `provider` | `text` | CHECK (browser_demo, exotel, twilio, plivo, other) |
| `external_call_id` | `text` | Nullable |
| `direction` | `text` | CHECK (inbound, outbound) |
| `status` | `text` | CHECK (created, ringing, in_progress, completed, failed, missed, cancelled) |
| `from_number` | `text` | Nullable |
| `to_number` | `text` | Nullable |
| `started_at` | `timestamptz` | Nullable |
| `ended_at` | `timestamptz` | Nullable |
| `duration_sec` | `int4` | Nullable |
| `transcript` | `text` | Nullable |
| `summary` | `text` | Nullable |
| `outcome` | `text` | Nullable |
| `recording_url` | `text` | Nullable |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

## Table `call_session_turns`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `call_session_id` | `uuid` | References call_sessions(id) |
| `speaker` | `text` | CHECK (agent, customer, system) |
| `text` | `text` | Not null |
| `audio_url` | `text` | Nullable |
| `sequence_index` | `int4` | Default 0 |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |

## Table `lead_followups`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `lead_id` | `uuid` | References crm_leads(id) |
| `assigned_to` | `uuid` | References organization_members(id) |
| `type` | `text` | CHECK (call, whatsapp, site_visit, email, meeting, other) |
| `title` | `text` | Nullable |
| `notes` | `text` | Nullable |
| `scheduled_at` | `timestamptz` | Nullable |
| `completed_at` | `timestamptz` | Nullable |
| `status` | `text` | CHECK (pending, completed, missed, cancelled) |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

## Table `knowledge_document_chunks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `document_id` | `uuid` | References knowledge_documents(id) |
| `chunk_index` | `int4` | Default 0 |
| `content` | `text` | Not null |
| `entity_type` | `text` | Nullable |
| `entity_id` | `uuid` | Nullable |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |

## Table `agent_configs`

Per-org AI agent configuration (industry, persona, prompt, inventory fields).

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | Unique, References organizations(id) |
| `industry` | `text` | e.g. real_estate, education, healthcare |
| `persona_name` | `text` | e.g. Priya, Meera |
| `persona_role` | `text` | e.g. Sales Assistant |
| `system_prompt` | `text` | Full system prompt |
| `inventory_table` | `text` | e.g. real_estate_units, generic_inventory_items |
| `inventory_fields` | `jsonb` | Configurable fields |
| `inventory_schema` | `jsonb` | Per-industry UI labels + search fields (item_label, item_label_plural, search_fields) |
| `intent_mappings` | `jsonb` | Extraction schema |
| `reply_templates` | `jsonb` | Customizable reply rules |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Default now() |

## Table `job_queue`

Durable job queue for async processing (WhatsApp messages, LLM calls).

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `bigint` | Primary, GENERATED ALWAYS AS IDENTITY |
| `org_id` | `uuid` | References organizations(id) |
| `job_type` | `text` | e.g. whatsapp_reply, llm_call |
| `payload` | `jsonb` | Default '{}' |
| `status` | `text` | CHECK (pending, locked, completed, failed, dead) |
| `priority` | `int4` | Default 0 |
| `attempts` | `int4` | Default 0 |
| `max_attempts` | `int4` | Default 5 |
| `locked_by` | `text` | Nullable (worker ID) |
| `locked_at` | `timestamptz` | Nullable |
| `available_at` | `timestamptz` | Default now() |
| `error` | `text` | Nullable |
| `result` | `jsonb` | Nullable |
| `created_at` | `timestamptz` | Default now() |
| `completed_at` | `timestamptz` | Nullable |

## Table `org_usage_daily`

Daily LLM API usage tracking per org.

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` | References organizations(id) |
| `usage_date` | `date` | Not null |
| `llm_calls` | `int4` | Default 0 |
| `llm_tokens_in` | `int4` | Default 0 |
| `llm_tokens_out` | `int4` | Default 0 |
| `estimated_cost_usd` | `numeric` | Default 0 |
| `metadata` | `jsonb` | Default '{}' |
| `created_at` | `timestamptz` | Default now() |

> **Unique:** (`org_id`, `usage_date`)

---

## Table `organizations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `slug` | `text` |  Nullable Unique |
| `plan` | `text` |  |
| `owner_user_id` | `uuid` |  Nullable |
| `timezone` | `text` |  Nullable |
| `settings` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `organization_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `full_name` | `text` |  |
| `initials` | `text` |  Nullable |
| `role` | `member_role` |  |
| `title` | `text` |  Nullable |
| `manager_id` | `uuid` |  Nullable |
| `reports_to` | `uuid` |  Nullable |
| `rank` | `member_rank` |  |
| `gender` | `member_gender` |  Nullable |
| `employee_code` | `text` |  Nullable |
| `mobile_number` | `text` |  Nullable |
| `whatsapp_number` | `text` |  Nullable |
| `permissions` | `jsonb` |  Nullable |
| `status` | `member_status` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `projects`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `name` | `text` |  |
| `description` | `text` |  Nullable |
| `status` | `project_status` |  |
| `visibility` | `project_visibility` |  |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `project_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `project_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `role` | `project_member_role` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `task_statuses`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `project_id` | `uuid` |  Nullable |
| `key` | `task_status_key` |  |
| `label` | `text` |  |
| `order_index` | `int4` |  |
| `color` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `tasks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `project_id` | `uuid` |  |
| `status_id` | `uuid` |  Nullable |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `priority` | `task_priority` |  |
| `assignee_id` | `uuid` |  Nullable |
| `due_date` | `date` |  Nullable |
| `start_date` | `date` |  Nullable |
| `estimate_hours` | `numeric` |  Nullable |
| `labels` | `_text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `task_comments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `task_id` | `uuid` |  |
| `author_id` | `uuid` |  |
| `body` | `text` |  |
| `mentions` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `task_attachments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `task_id` | `uuid` |  |
| `org_id` | `uuid` |  |
| `uploader_id` | `uuid` |  Nullable |
| `storage_path` | `text` |  |
| `mime_type` | `text` |  Nullable |
| `file_size` | `int8` |  Nullable |
| `source` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `task_activity`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `task_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `payload` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `org_chart_nodes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `parent_node_id` | `uuid` |  Nullable |
| `position_title` | `text` |  Nullable |
| `department` | `text` |  Nullable |
| `order_index` | `int4` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `effective_from` | `date` |  Nullable |
| `effective_to` | `date` |  Nullable |

## Table `org_chart_versions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `name` | `text` |  |
| `created_by` | `uuid` |  Nullable |
| `published_at` | `timestamptz` |  Nullable |
| `snapshot` | `jsonb` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `locations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `name` | `text` |  |
| `address` | `text` |  Nullable |
| `geo_lat` | `float8` |  Nullable |
| `geo_lng` | `float8` |  Nullable |
| `radius_meters` | `int4` |  Nullable |
| `allowed_roles` | `_text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `attendance_rules`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `workday` | `jsonb` |  Nullable |
| `grace_period_min` | `int4` |  Nullable |
| `geo_required` | `bool` |  Nullable |
| `auto_approve` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `attendance_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `event` | `attendance_event` |  |
| `captured_at` | `timestamptz` |  Nullable |
| `location_id` | `uuid` |  Nullable |
| `geo_lat` | `float8` |  Nullable |
| `geo_lng` | `float8` |  Nullable |
| `status` | `attendance_status` |  |
| `notes` | `text` |  Nullable |
| `approved_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `attendance_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `check_in_log_id` | `uuid` |  Nullable |
| `check_out_log_id` | `uuid` |  Nullable |
| `duration_min` | `int4` |  Nullable |
| `summary` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `notification_channels`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `type` | `notification_channel` |  |
| `config` | `jsonb` |  Nullable |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `notifications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  Nullable |
| `channel` | `notification_channel` |  |
| `title` | `text` |  Nullable |
| `body` | `text` |  Nullable |
| `payload` | `jsonb` |  Nullable |
| `status` | `notification_status` |  |
| `read_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `automation_jobs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `type` | `text` |  |
| `payload` | `jsonb` |  Nullable |
| `scheduled_at` | `timestamptz` |  |
| `status` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `whatsapp_triggers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `type` | `text` |  |
| `payload` | `jsonb` |  Nullable |
| `status` | `text` |  |
| `error` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `processed_at` | `timestamptz` |  Nullable |

## Table `analytics_snapshots`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `project_id` | `uuid` |  Nullable |
| `metric_date` | `date` |  |
| `metrics` | `jsonb` |  |
| `source` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `knowledge_documents`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `entity_type` | `text` |  |
| `entity_id` | `uuid` |  Nullable |
| `title` | `text` |  Nullable |
| `content` | `text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `task_files`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `task_id` | `uuid` |  |
| `org_id` | `uuid` |  |
| `uploader_id` | `uuid` |  Nullable |
| `storage_path` | `text` |  |
| `file_name` | `text` |  |
| `mime_type` | `text` |  Nullable |
| `file_size` | `int8` |  Nullable |
| `sha256` | `text` |  Nullable |
| `status` | `text` |  |
| `metadata` | `jsonb` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `file_acl`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `file_id` | `uuid` |  |
| `principal_type` | `text` |  |
| `principal_id` | `uuid` |  Nullable |
| `can_view` | `bool` |  |
| `can_comment` | `bool` |  |
| `can_share` | `bool` |  |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `outbox_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `aggregate` | `text` |  |
| `event_type` | `text` |  |
| `payload` | `jsonb` |  |
| `partition_key` | `text` |  Nullable |
| `published` | `bool` |  |
| `publish_attempts` | `int4` |  |
| `last_error` | `text` |  Nullable |
| `published_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `idempotency_keys`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `org_id` | `uuid` | Primary |
| `key` | `text` | Primary |
| `method` | `text` |  |
| `route` | `text` |  |
| `request_hash` | `text` |  Nullable |
| `status_code` | `int4` |  Nullable |
| `response` | `jsonb` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |
| `expires_at` | `timestamptz` |  |

## Table `audit_log`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `resource` | `text` |  |
| `resource_id` | `uuid` |  Nullable |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` | Primary |

## Table `audit_log_default`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `resource` | `text` |  |
| `resource_id` | `uuid` |  Nullable |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` | Primary |

## Table `audit_log_2026_03`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `resource` | `text` |  |
| `resource_id` | `uuid` |  Nullable |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` | Primary |

## Table `audit_log_2026_04`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `resource` | `text` |  |
| `resource_id` | `uuid` |  Nullable |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` | Primary |

## Table `face_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `template_hash` | `text` |  |
| `template_version` | `text` |  |
| `status` | `text` |  |
| `metadata` | `jsonb` |  |
| `enrolled_by` | `uuid` |  Nullable |
| `enrolled_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |
| `template_vectors` | `jsonb` |  Nullable |
| `template_angles` | `_text` |  Nullable |
| `template_quality` | `numeric` |  Nullable |
| `attention_threshold` | `numeric` |  Nullable |
| `enrollment_resolution` | `int4` |  Nullable |
| `vector_count` | `int4` |  Nullable |

## Table `face_enrollment_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `requested_by` | `uuid` |  Nullable |
| `challenge_nonce` | `text` |  |
| `status` | `text` |  |
| `quality_score` | `numeric` |  Nullable |
| `metadata` | `jsonb` |  |
| `created_at` | `timestamptz` |  |
| `completed_at` | `timestamptz` |  Nullable |
| `expires_at` | `timestamptz` |  |

## Table `face_verification_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `attendance_log_id` | `uuid` |  Nullable |
| `challenge_nonce` | `text` |  Nullable |
| `action` | `text` |  |
| `liveness_score` | `numeric` |  Nullable |
| `match_score` | `numeric` |  Nullable |
| `confidence` | `numeric` |  Nullable |
| `decision` | `text` |  |
| `reason` | `text` |  Nullable |
| `metadata` | `jsonb` |  |
| `device_info` | `jsonb` |  |
| `created_at` | `timestamptz` |  |

## Table `face_verification_performance`

Tracks verification performance metrics over time for optimization and fraud detection

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `verification_date` | `date` |  |
| `attempts_count` | `int4` |  Nullable |
| `success_count` | `int4` |  Nullable |
| `avg_duration_ms` | `numeric` |  Nullable |
| `avg_confidence` | `numeric` |  Nullable |
| `failed_reasons` | `_text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `user_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `session_id` | `text` |  Unique |
| `device_name` | `text` |  Nullable |
| `device_type` | `text` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `ip_address` | `text` |  Nullable |
| `last_active_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  |
| `expires_at` | `timestamptz` |  Nullable |
| `is_active` | `bool` |  |

## Table `task_location_checkins`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `task_id` | `uuid` |  |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `latitude` | `numeric` |  |
| `longitude` | `numeric` |  |
| `accuracy_meters` | `numeric` |  Nullable |
| `place_name` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `device_info` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |


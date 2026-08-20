# API Reference — Multi-Industry WhatsApp AI + Calling Agent Platform

Base URL: `http://localhost:4000`

All endpoints accept and return JSON unless noted (CSV upload is multipart).

All endpoints except `/health` and `/api/auth/login` receive credentials via **httpOnly cookies** (automatically attached by the browser). No API key or Bearer token needed — cookies handle auth.

---

## Authentication

### `POST /api/auth/login`
Login with email + password. Sets httpOnly cookies on success.

**Request:**
```json
{
  "email": "demo@example.com",
  "password": "demo1234"
}
```

**Response (200):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "demo@example.com",
    "fullName": "Demo User"
  },
  "orgId": "uuid",
  "role": "admin",
  "memberId": "uuid"
}
```

**Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

> Sets cookies: `sb-access-token` (1hr), `sb-refresh-token` (7 days) — both httpOnly.

---

### `GET /api/auth/me`
Get the current authenticated user + org context.

**Response (200):**
```json
{
  "ok": true,
  "user": {
    "id": "uuid",
    "email": "demo@example.com",
    "fullName": "Demo User"
  },
  "orgId": "uuid",
  "role": "admin",
  "memberId": "uuid",
  "industry": "real_estate"
}
```

**Response (401):** Not authenticated.

---

### `POST /api/auth/refresh`
Exchange refresh token cookie for a new access token.

**Response (200):**
```json
{ "ok": true }
```

> Automatically sets new `sb-access-token` cookie.

---

### `POST /api/auth/logout`
Clear all auth cookies and revoke Supabase session.

**Response (200):**
```json
{ "ok": true }
```

---

## Health

### `GET /health`
Health check.

**Response:**
```json
{ "ok": true }
```

---

## WhatsApp Bridge

### `POST /api/whatsapp/start`
Start the Baileys WhatsApp bridge.

**Response:**
```json
{ "status": "starting", "qrPending": true }
```
> QR code prints in backend terminal. Scan from WhatsApp → Linked Devices.

---

### `GET /api/whatsapp/status`
Get current WhatsApp connection status.

**Response:**
```json
{
  "status": "connected",
  "phoneNumber": "919999999999",
  "lastConnectedAt": "2026-01-01T10:00:00Z"
}
```

---

### `POST /api/whatsapp/stop`
Stop the bridge but **keep the session alive** (does NOT unlink device).
Next `start()` will reconnect silently without needing a new QR scan.

---

### `POST /api/whatsapp/relink`
Delete the old session and generate a **fresh QR code**.
Use this when the device was unlinked/logged out from the phone and the session is stale.

**Response:**
```json
{
  "ok": true,
  "message": "Re-linking: old session cleared, generating new QR code."
}
```
> After calling this, poll `GET /api/whatsapp/status` — `status` will become `qr_pending` with a new QR.

---

### `GET /api/whatsapp/chats`
List all synced chats (groups + individuals) with monitoring status.

**Response:**
```json
{
  "chats": [
    {
      "id": "919999999999@s.whatsapp.net",
      "name": "Raj Kumar",
      "isGroup": false,
      "phone": "919999999999",
      "lastMessage": "Hi, looking for 3BHK",
      "monitored": true,
      "unreadCount": 2
    }
  ]
}
```

---

### `POST /api/whatsapp/chats/:chatId/toggle`
Toggle AI monitoring for a specific chat (group or individual).

**Response:**
```json
{ "chatId": "919999999999@s.whatsapp.net", "monitored": true }
```

---

### `POST /api/whatsapp/send`
Send a message to a specific chat.

**Request:**
```json
{
  "orgId": "uuid",
  "chatId": "919999999999@s.whatsapp.net",
  "text": "Hello!"
}
```

---

## Inventory

### `GET /api/inventory/projects`
List all projects.

**Query:** `?orgId=uuid`

---

### `POST /api/inventory/projects`
Create a project.

---

### `GET /api/inventory/units`
List all units.

**Query:** `?orgId=uuid&projectId=uuid`

---

### `POST /api/inventory/units`
Create a unit.

---

### `GET /api/inventory/search`
Search properties with filters.

**Query Parameters:**
| Param | Type | Example |
|-------|------|---------|
| `orgId` | uuid | (required) |
| `configuration` | string | `3BHK` |
| `city` | string | `Noida` |
| `sector` | string | `Sector 150` |
| `budgetMax` | number | `20000000` |
| `budgetMin` | number | `10000000` |
| `possessionStatus` | string | `under_construction` |

**Response:**
```json
{
  "matches": [
    {
      "unit": { ... },
      "project": { ... },
      "score": 0.92,
      "reason": "Matches 3BHK, Sector 150, budget ~2 Cr"
    }
  ],
  "count": 1
}
```

---

## Generic Inventory (Non-Real-Estate Industries)

When the org's `inventory_table` is set to `generic_inventory_items` (any industry except real estate), these endpoints manage the inventory.

### `GET /api/inventory/items`
List all generic inventory items.

**Query:** `?orgId=uuid&category=Courses&city=Mumbai&q=search`

---

### `POST /api/inventory/items`
Create a new inventory item.

**Request:**
```json
{
  "orgId": "uuid",
  "title": "B.Tech Computer Science",
  "subtitle": "4-year engineering program",
  "category": "Engineering",
  "price_min": 400000,
  "price_max": 800000,
  "city": "Pune",
  "attributes": {
    "duration": "4 years",
    "accreditation": "AICTE"
  }
}
```

---

### `PATCH /api/inventory/items/:id`
Update an inventory item.

---

### `DELETE /api/inventory/items/:id`
Delete an inventory item.

---

## Upload

### `POST /api/upload/properties-csv`
Upload CSV file of properties (real estate only).

**Request:** `multipart/form-data`
- `file`: CSV file
- `orgId`: UUID (form field)

**Response:**
```json
{
  "batchId": "uuid",
  "totalRows": 10,
  "successRows": 9,
  "failedRows": 1,
  "errors": ["Row 5: missing price_min"],
  "projects": [
    { "id": "uuid", "name": "Demo Heights", "unitsCreated": 2 }
  ]
}
```

---

### `POST /api/upload/inventory-csv`
Upload CSV for **generic inventory** (any industry that uses `generic_inventory_items` table).

**Request:** `multipart/form-data`
- `file`: CSV file
- `orgId`: UUID (form field)

CSV columns map to: `title`, `subtitle`, `category`, `price_min`, `price_max`, `city`, `location`, `availability_status`, `description`, `brochure_url`, plus any custom attributes via columns prefixed with `attr_`.

**Response:** Same shape as properties-csv — returns `batchId`, `totalRows`, `successRows`, `failedRows`.

---

### `POST /api/upload/seed-sample`
Seed 5 demo properties directly (no file needed).

**Response:**
```json
{
  "success": true,
  "projects": 5,
  "units": 5,
  "names": ["Demo Heights", "ATS Knightsbridge", ...]
}
```

---

## Leads

### `GET /api/leads`
List leads with optional filters.

**Query:** `?orgId=uuid&status=qualified&temperature=hot`

---

### `GET /api/leads/:id`
Get full lead detail.

**Response includes:** lead profile, preferences, AI summary, metadata.

---

### `PATCH /api/leads/:id`
Update a lead.

**Request:**
```json
{
  "status": "qualified",
  "temperature": "hot",
  "assigned_to": "uuid",
  "notes": "VIP client"
}
```

---

### `GET /api/leads/:id/messages`
Get all messages for a lead.

---

### `GET /api/leads/:id/matches`
Get property matches recommended to this lead.

**Response:**
```json
[
  {
    "id": "uuid",
    "match_score": 0.92,
    "reason": "Matches 3BHK, Sector 150",
    "project": { "name": "Demo Heights", ... },
    "unit": { "configuration": "3BHK", "price_min": 16500000, ... },
    "shown_to_customer": true
  }
]
```

---

### `GET /api/leads/:id/calls`
Get all call sessions for this lead.

---

### `POST /api/leads/:id/followups`
Create a follow-up task.

**Request:**
```json
{
  "type": "call",
  "title": "Call back for site visit",
  "scheduled_at": "2026-01-15T18:00:00Z",
  "notes": "Customer wants evening slot"
}
```

---

## Conversations

### `GET /api/conversations`
List all conversations.

**Query:** `?orgId=uuid&status=open`

---

### `GET /api/conversations/:id`
Get conversation + all messages.

**Response:**
```json
{
  "conversation": {
    "id": "uuid",
    "customer_name": "Raj",
    "customer_phone": "+919999999999",
    "ai_enabled": true,
    "human_handoff": false,
    "status": "open"
  },
  "messages": [
    {
      "direction": "inbound",
      "body": "Hi, looking for 3BHK",
      "ai_generated": false,
      "created_at": "..."
    },
    {
      "direction": "outbound",
      "body": "Yes, we have options...",
      "ai_generated": true,
      "ai_model": "deepseek-v4-flash",
      "created_at": "..."
    }
  ]
}
```

---

### `POST /api/conversations/:id/send`
Send a manual message from the dashboard.

**Request:**
```json
{ "text": "Let me check and get back to you." }
```

---

### `POST /api/conversations/:id/handoff`
Toggle human handoff / AI control.

**Request:**
```json
{
  "humanHandoff": true,
  "aiEnabled": false
}
```

---

## Calls

### `POST /api/calls/start-demo`
Start a browser AI call session.

**Request:**
```json
{
  "orgId": "uuid",
  "leadId": "uuid"
}
```

**Response:**
```json
{
  "callSessionId": "uuid",
  "openingLine": "Hi, this is Priya from Demo Realty. I saw your enquiry..."
}
```

---

### `POST /api/calls/:id/turn`
Customer reply → get agent response.

**Request:**
```json
{
  "speaker": "customer",
  "text": "I want a 3BHK around 2 crore"
}
```

**Response:**
```json
{
  "agentReply": "Great. Are you looking for ready-to-move or under-construction?",
  "callSessionId": "uuid"
}
```

---

### `POST /api/calls/:id/end`
End call and generate summary.

**Response:**
```json
{
  "callSessionId": "uuid",
  "status": "completed",
  "summary": "Lead is looking for 3BHK in Noida, budget 2 Cr, end-use...",
  "outcome": "site_visit_requested",
  "leadTemperature": "hot"
}
```

---

### `GET /api/calls/:id`
Get call session details + transcript turns.

---

### POST /api/calls/start-real
Place a real outbound call via Sarvam voice agents. Requires SARVAM_API_KEY (falls back to browser demo flow if not configured).

**Request:**
```json
{ "leadId": "uuid" }
```

**Response:**
```json
{ "callSessionId": "uuid", "attemptId": "att_9f8a...", "status": "initiated" }
```

The result arrives asynchronously via the Sarvam webhook; the lead page and Calls page show live status until it completes.

---

## Sarvam Webhook (internal)

### POST /webhooks/sarvam/:secret
Callback from Sarvam when a call completes. **Auth: unguessable secret in the URL path** (must equal `SARVAM_WEBHOOK_SECRET` → 403 otherwise; malformed body → 400 so Sarvam stops retrying; everything else → 200 immediately). Persists the raw payload to `sarvam_webhook_events` for replay/idempotency, and enqueues a `process_call_result` job (org resolved via `webhook_config.metadata.orgId` echoed from the call request).

**Payload (Sarvam-defined):** `attempt_id`, `status` (`connected|no_answer|busy|failed`), `duration`, `interaction_id`, `failure_reason`, `final_agent_variables`, `interaction_transcript`.

Processing (in the queue worker):
1. Correlate `attempt_id` → `call_sessions.external_call_id`
2. Idempotency skip if call already terminal
3. Map status, store transcript + turns, LLM summary (`summarizeCall`)
4. Enrich lead (temperature, preferences, agent variables) + auto-create follow-ups for `callback_requested` / `site_visit_requested` / `booking_requested`
5. Mark webhook event processed

---

## Sarvam Live Tools (mid-call API tools)

Two read-only HTTP endpoints the Sarvam agent calls DURING a live call via its Tools panel. **Never-5xx by design** — every failure path returns HTTP 200 with a graceful note so a tool error can't kill a live call. All requests logged to `logs/sarvam-tool-calls.log`.

**Auth:** one of `X-Tool-Secret: <SARVAM_TOOL_SECRET>` (defaults to `SARVAM_WEBHOOK_SECRET`), `X-API-Key`, or `Authorization: Bearer` — → 401 otherwise. In the Sarvam dashboard set Auth Type = `API Key`, header `X-API-Key`.

### GET /api/tools/sarvam/lead-context
Called by the agent's on_start hook to personalize the greeting. `?phone=+91…` (E.164, `+` URL-encoded as `%2B`).

**Response (known lead):** `{ "found": true, "lead": { name, phone, temperature, source, status }, "recentMessages": [last 3 WhatsApp messages], "note": "…" }`
**Response (unknown/error):** `{ "found": false, "note": "No prior conversation — start fresh with the greeting." }`

### GET /api/tools/sarvam/inventory-search
Live inventory search mid-call. **Preferred: one agent-filled `query` param** with the caller's raw spoken demand (English or Hindi), e.g. `?query=gurgaon penthouse 8-10 crore` — parsed server-side by `backend/src/sarvam/queryParser.ts` into city/sector/configuration/budget filters (explicit `location`/`budget_min`/`budget_max`/`configuration` params still work and win over parsed values; multi-config like "3 or 4 BHK" runs one pass per configuration and merges).

**Response:**
```json
{
  "count": 2,
  "filters": { "city": "gurgaon", "sectors": ["70"], "configuration": ["3BHK","4BHK"], "budget_min": 0, "budget_max": 100000000 },
  "results": [ { "title": "Godrej …", "configuration": "3BHK", "price_display": "₹8.5 Cr", "location": "Sector 70, Gurgaon" } ],
  "note": null
}
```

`filters` echoes what was applied — use it to verify each match. `count: 0` + a `note` (e.g. "ask the caller for their budget") is the graceful no-results/error path.

---

## Agent Configuration

Manage per-org AI agent config — persona, qualifying fields, intents, inventory search, reply templates.

### GET /api/agent/config
Get the current org's agent configuration. Auto-creates a default config if none exists.

**Response:**
```json
{
  "config": {
    "id": "uuid",
    "industry": "real_estate",
    "persona_name": "Priya",
    "persona_role": "Real Estate Sales Assistant",
    "tone": "professional",
    "business_name": "Demo Realty",
    "business_description": null,
    "qualifying_fields": [...],
    "intent_types": [...],
    "status_pipeline": [...],
    "inventory_enabled": true,
    "inventory_table": "real_estate_units",
    "search_fields": [...],
    "reply_template_match": "...",
    "reply_template_no_match": "...",
    "reply_template_missing_info": "...",
    "call_opening_template": "...",
    "system_prompt_override": null
  }
}
```

### PUT /api/agent/config
Update the org's agent configuration.

**Body:** Any subset of config fields (persona_name, qualifying_fields, intent_types, etc.)

**Response:** Same as GET — returns updated config.

### GET /api/agent/templates
List all available industry templates.

**Response:**
```json
{
  "templates": [
    {
      "template_id": "real_estate",
      "name": "Real Estate",
      "industry": "real_estate",
      "description": "Property sales, rentals, and lead qualification",
      "icon": "🏢",
      "inventory_enabled": true,
      "inventory_table": "real_estate_units"
    }
  ]
}
```

### POST /api/agent/apply-template
Apply an industry template to the org — replaces current config with the template preset.

**Body:**
```json
{
  "templateId": "education"
}
```

**Response:** Same as GET — returns the new config after template applied.

---

## System Status

### `GET /api/system/status`
Get real-time system health — queue depth, LLM stats, WhatsApp connections, worker status.

**Response:**
```json
{
  "queue": {
    "pending": 3,
    "processing": 1,
    "completed": 142,
    "failed": 0,
    "oldestPendingAgeSec": 5
  },
  "llm": {
    "provider": "deepseek",
    "model": "deepseek-chat",
    "activeCalls": 1,
    "maxConcurrent": 5,
    "totalCalls": 150,
    "totalErrors": 2
  },
  "whatsapp": {
    "connectedAccounts": 1,
    "accounts": [
      { "id": "uuid", "label": "Default WhatsApp", "status": "connected" }
    ]
  },
  "worker": {
    "running": true,
    "activeJobs": 1,
    "maxConcurrent": 5
  }
}
```

---

## AI

### `GET /api/ai/status`
Check LLM provider configuration.

**Response:**
```json
{
  "provider": "deepseek",
  "model": "deepseek-v4-flash",
  "configured": true
}
```

---

### `POST /api/ai/simulate`
Test the AI agent without WhatsApp. Sends text, gets AI reply. Used by the AI Playground page.

**Request:**
```json
{
  "text": "I want a 3BHK in Noida around 2 crore",
  "leadId": null,
  "history": [
    { "role": "user", "text": "Looking for 3BHK" },
    { "role": "assistant", "text": "Yes, we have options..." }
  ]
}
```

> `history` is optional — include up to 12 prior turns for conversational context.

**Response:**
```json
{
  "reply": "Yes, we have a 3BHK option in Sector 150...",
  "extractedData": {
    "intent": "property_search",
    "configuration": "3BHK",
    "city": "Noida",
    "budget_max": 20000000
  },
  "matchedProperties": [...],
  "leadUpdates": {
    "temperature": "warm",
    "status": "contacted"
  }
}
```

---

## Dashboard

### `GET /api/dashboard/stats`
Dashboard overview metrics.

**Query:** `?orgId=uuid`

**Response:**
```json
{
  "totalLeads": 42,
  "hotLeads": 8,
  "openConversations": 15,
  "aiRepliesToday": 23,
  "callsCompleted": 5,
  "propertiesAvailable": 12
}
```

---

## Error Handling

All errors return:
```json
{
  "error": "Error message",
  "statusCode": 400
}
```

Common status codes:
- `200` — Success
- `400` — Bad request (missing required field)
- `404` — Not found
- `500` — Server error
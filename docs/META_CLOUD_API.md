# Meta Cloud API Provider (Official WhatsApp Business API)

> **Status (2026-09-09):** Complete — adapter, webhook receiver, connect/
> verify/disconnect routes, 24h-window guard, dashboard onboarding UI
> (provider-choice screen, connect form, webhook setup helper), 34 new
> unit tests. Backend suite 335/335 green; frontend `next build` green.

The platform now supports **two WhatsApp providers side by side**, chosen
per account when an org connects a number:

| | Baileys (`provider='baileys'`) | Meta Cloud API (`provider='meta_cloud_api'`) |
|---|---|---|
| Connection | QR scan (WhatsApp Web protocol) | Phone Number ID + access token |
| Legality | Unofficial (ToS risk; number bans possible) | Official, sanctioned |
| Inbound | Socket events | Signed webhooks → `POST /webhooks/whatsapp` |
| Free-form replies | Anytime | Only within 24h of the customer's last message |
| Templates / broadcasts | N/A (don't — ban risk) | Supported (future feature) |
| Groups | Supported | Not supported by Meta |
| Delivery/read receipts | Best-effort | Structured `statuses` webhooks |
| Sessions | Persisted in `.sessions/whatsapp/<id>` | Stateless (encrypted token row) |

An org can run **both at once** on different numbers. One *number* can
only ever live on one provider (Meta constraint).

## Architecture

```
Baileys socket ──► messageParser ─┐
                                  ├─► ParsedWhatsAppMessage ─► enqueueIncomingMessage()
Meta webhook ────► metaWebhookParser ┘        (identical downstream:
                                               leads → conversations → dedup →
                                               job_queue → AI agent → reply)
```

New/changed modules:

| File | Role |
|---|---|
| `backend/src/whatsapp/metaApi.ts` | Graph API client (verify / register / subscribe / send / media / read receipts). Ported from wacrm. |
| `backend/src/whatsapp/metaWebhookParser.ts` | Meta payload → `ParsedWhatsAppMessage[]` + statuses. Emits Baileys-style JIDs so nothing downstream branches on provider. |
| `backend/src/whatsapp/metaCloudClient.ts` | `MetaCloudWhatsAppAdapter implements MessagingAdapter` — stateless; constructed on demand. |
| `backend/src/routes/whatsappWebhook.routes.ts` | `GET/POST /webhooks/whatsapp` (HMAC-verified). |
| `backend/src/routes/whatsappMeta.routes.ts` | `/api/whatsapp/meta/connect · accounts · verify-registration · disconnect · webhook-info`. |
| `backend/src/utils/metaEncryption.ts` | AES-256-GCM token encryption (legacy-CBC read support). |
| `backend/src/utils/metaWebhookSignature.ts` | `x-hub-signature-256` HMAC verification, fail-closed. |
| `backend/src/whatsapp/connectionManager.ts` | Provider-aware: boots Baileys sockets only; `resolveAdapter(accountId)` returns the right adapter for either provider. |
| `backend/src/queue/jobHandler.ts` | Sends via `resolveAdapter`; enforces the Meta 24h window (outside → `pending_human` instead of a guaranteed-failure send). |
| `supabase/migrations/20260909_0001_meta_cloud_provider.sql` | `phone_number_id` (unique), `waba_id` columns. |

## Setup

1. **Env vars** (see `.env.example`):
   - `META_APP_SECRET` — required; webhook rejects every POST without it.
   - `ENCRYPTION_KEY` — 64 hex chars; encrypts tokens at rest. Required to connect.
   - `META_WEBHOOK_VERIFY_TOKEN` — optional fallback for the GET handshake.
2. **Migration**: `npm run migrate` (or paste the SQL into Supabase).
3. **Connect a number**: `POST /api/whatsapp/meta/connect` with
   `{ phoneNumberId, accessToken, wabaId?, verifyToken, pin?, label? }`.
   The route verifies against Meta, registers the number for this app's
   webhook, subscribes the WABA, encrypts secrets, and stores the account.
   Meta errors are surfaced verbatim (wrong PIN, expired token, number
   claimed by another app…).
4. **Point Meta at us**: Meta App Dashboard → WhatsApp → Configuration:
   - Callback URL: `${PUBLIC_BASE_URL}/webhooks/whatsapp` (ngrok in dev)
   - Verify token: the same string sent in `connect`
   - Subscribe to the `messages` field.
   - `GET /api/whatsapp/meta/webhook-info` returns all of this.

## Behavioral notes

- **24h window**: AI replies to stale conversations are NOT attempted on
  Meta accounts — the job flags `pending_human` + `human_handoff` instead.
  Baileys accounts are unaffected.
- **Idempotency**: webhook messages dedupe on `external_message_id`
  (wamid slots into the existing mechanism; Baileys replays already used it).
- **Statuses**: `sent/delivered/read/failed` mirror onto
  `customer_messages.metadata` (+ `sent_at`).
- **Multi-tenant**: the webhook resolves the owning org by
  `phone_number_id`; events for numbers this install doesn't own are acked
  and ignored. One Meta number = one account row (partial unique index).
- **Ban-risk honesty**: the QR path keeps its ToS risk. The onboarding
  fork exists precisely so serious deployments graduate to the official
  pipe without changing anything else about the product.

# RULES.md — Engineering Guardrails

> **Read this before changing WhatsApp, Sarvam, lead, or phone-handling code.**
> Every rule below exists because it was a real bug we already shipped and fixed.
> TL;DR version: `CLAUDE.md`. Deep architecture: `docs/ARCHITECTURE.md`.

Legend: **MUST** = required, breaks things if ignored. **NEVER** = we did it once, it hurt. **WHEN** = conditional rule.

---

## 1. WhatsApp Providers (dual, per-account)

| | `baileys` | `meta_cloud_api` |
|---|---|---|
| Connection | QR scan → socket held in RAM (~30-50 MB/number) | Credentials in DB, stateless |
| Inbound | `messages.upsert` socket events | Signed webhook `POST /webhooks/whatsapp` |
| Free-form reply | Anytime | Only within 24h of customer's last message |
| Templates / groups | Templates ❌ (ban risk) / Groups ✅ | Templates ✅ (future) / Groups ❌ |
| Identity | Privacy LIDs common | Real phone always (wa_id) |

- **MUST** keep both providers working. Baileys = instant demo tier; Meta = business tier. Removing either breaks the product story.
- **MUST** route all sends through `waManager.resolveAdapter(accountId)` — it returns the live Baileys socket OR constructs a stateless `MetaCloudWhatsAppAdapter` from the DB row.
- **MUST** remember `connectionManager.bootAll()` only boots Baileys accounts. Meta accounts need no booting.
- **NEVER** broadcast through Baileys. Bulk sending over the unofficial bridge is the #1 ban trigger. Broadcasts (when built) are Meta-only.

## 2. JIDs and Phones — LID ≠ phone

WhatsApp JID domains and what their digits mean:

| Domain | Example | Digits are… | `jidToPhone()` returns |
|---|---|---|---|
| `@s.whatsapp.net` | `919999999999@s.whatsapp.net` | a real phone | `+919999999999` |
| `@lid` | `275101262078103@lid` | a privacy Linked ID | `''` (empty) |
| `@g.us` | `120363…@g.us` | a group ID | `''` |
| `@newsletter` | `120363…@newsletter` | a channel ID | `''` |
| `@broadcast` | `status@broadcast` | n/a | `''` |

- **NEVER** store LID/newsletter/group digits as a phone number. This created 257+ junk leads once (`+275101262078103`, `status`, `+120363168402828787`…).
- **MUST** resolve LIDs → real phones ONLY via the `contactPhones` map in `baileysClient.ts` (populated from `contacts.upsert`/`contacts.update` events' `phoneNumber` field, persisted in chat-store.json). If unresolved, `senderPhone` stays `''` — a missing phone beats a fake one.
- **MUST** keep `chatId` JID-canonical (`919999999999@s.whatsapp.net`) for BOTH providers — conversations, debug routes, and lead merge all key on it. The Meta parser emits this format even though Meta payloads use raw digits; the Meta adapter converts back to digits on send.
- **WHEN** contact sync resolves a LID: the real phone auto-backfills onto the lead and conversation (`leadService` step 3.5 + `whatsappService` backfill). Don't build manual fixes for this.

## 3. Inbound Pipeline

```
provider adapter → ParsedWhatsAppMessage → enqueueIncomingMessage()
  → dedup (external_message_id: Baileys msg key OR Meta wamid)
  → lead (phone merge; LID fallback: source_detail = chatId)
  → conversation (external_chat_id)
  → guards (auto_reply, ai_enabled, blocked, groups, allowlist)
  → job_queue → worker → AI → send via provider adapter
```

- **MUST** dedup on `external_message_id` — Baileys replays on reconnect; Meta resends on non-200. Same mechanism covers both.
- **MUST** skip `status@broadcast` / `@newsletter` / `@broadcast` chats in BOTH `handleIncomingMessage` and `enqueueIncomingMessage` (reason `system_chat`). These are not people.
- **NEVER** let an inbound handler block on AI/LLM calls — enqueue and ack. Baileys times out sockets; Meta times out webhooks (~20s).
- **MUST** preserve the activation cutoff (Baileys reconnect replays the offline backlog — messages older than connect time are dropped pre-pipeline).

## 4. Outbound & the 24h Window

- **WHEN** provider = `meta_cloud_api`: free-form sends are legal only within 24h of the customer's last inbound message (`customer_conversations.last_inbound_at`). Outside → set `pending_human` + `human_handoff`, return without sending. Attempting anyway = Meta error 131047 + wasted queue retries.
- **WHEN** provider = `baileys`: no window. Do not add one.
- **MUST** store `sent_via: <provider>` in the outbound message metadata (was hardcoded `'baileys'` once).

---

## 5. Meta Cloud API specifics

- **MUST** verify the webhook signature: HMAC-SHA256 over the RAW body with `META_APP_SECRET`, constant-time compare, `sha256=` prefix. **Fail closed** — missing secret rejects every request. (Falling open = spoofable leads + free AI spend.)
- **MUST** return 200 to Meta after the signature passes — even if processing fails. Meta retries non-200s for ~24h; processing errors can never be fixed by a retry. Log per-entry failures instead.
- **MUST** encrypt `accessToken`, `verifyToken`, `pin` with AES-256-GCM (`utils/metaEncryption.ts`) before INSERT. **NEVER** return them from any API response (settings UIs show masked placeholders).
- **MUST** call `POST /{phone_number_id}/register` (6-digit 2FA PIN) + `POST /{waba_id}/subscribed_apps` on connect — inbound events route to whichever app last registered the number. Both idempotent.
- **MUST** enforce one Meta number = one account row (partial unique index on `phone_number_id`); the connect route 409s with a clear message.
- **MUST** surface Meta error messages verbatim to the user ("Two-step verification PIN required…" is actionable; "Meta API error" is not).
- **NEVER** send free-form messages outside the 24h window; template sends (future broadcasts) are the only legal outside-window channel.

## 6. Baileys specifics

- **MUST** keep the activation cutoff (drop messages older than connect time + 90s grace) — reconnects replay days of backlog and the AI must not answer week-old texts.
- **MUST** keep decryption-failure tracking + auto-relink (signal session desyncs loop retry receipts otherwise).
- **MUST** persist chat store (chats, monitoring toggles, contact names, contactPhones) to disk — the dashboard relies on it surviving restarts.
- **MUST** keep the heartbeat ping — WhatsApp drops idle linked sessions after ~5-10 min.
- **NEVER** present Baileys as the recommended option for business numbers in UI copy. It's the QUICK/DEMO tier; the honest ban-risk framing is part of the product.

## 7. Sarvam voice

- **MUST** keep the calling guards: IST hours window, DNC registry, per-org daily call limits, E.164 phone validation (`/^\+?[1-9]\d{7,14}$/`). A lead without a valid phone is un-callable — that's correct, don't "fix" it by faking a number.
- **MUST** keep the result webhook tolerant: empty/malformed bodies → audit + 200, never 400. (A 400 once caused an 11× retry storm; a config error can never succeed via retry.)
- **MUST** keep webhook idempotency (`interaction_id`) and the raw-audit log (`backend/logs/sarvam-webhooks.log`).
- **WHEN** inbound calls can't be attributed to an org by the payload: fall back to `SARVAM_DEFAULT_ORG_ID`, then oldest org.
- **NOTE**: Sarvam credentials are currently deployment-level env vars (one set for all orgs). Per-org Sarvam config is a known future step — follow the Meta pattern (encrypted config on the account row) when you build it.

---

## 8. Leads & data hygiene

- Dedup priority in `findOrCreateLead`: email → whatsapp_number → phone → **source_detail** (LID chats) → create.
- **NEVER** write a phone you can't verify. `''`/`null` renders as "—" in the UI — that's the correct display for unresolved LIDs.
- **MUST** backfill, not overwrite: when a real phone is learned, fill `phone`/`whatsapp_number` only if empty (handleIncomingMessage + enqueueIncomingMessage do this).
- **WHEN** junk reappears (new LID patterns, channels, races): cleanup scripts are idempotent —
  - `npx tsx scripts/fix-lid-phones.ts` — nulls junk phones on conversations/messages/leads
  - `npx tsx scripts/cleanup-junk-leads.ts` — deletes status/newsletter junk leads, merges same-phone duplicates (reassigns history to the oldest lead), nulls >15-digit garbage phones
- **KNOWN RACE**: `findOrCreateLead` is select-then-insert; concurrent first messages can create duplicate leads (happened: 7 leads for one LID chat). The cleanup script merges them. A unique index on `(org_id, phone)` after cleanup is the permanent fix if it recurs.
- The leads table sorts by `created_at` DESC — a flood of old junk can look like "data is missing." Check the DB before assuming.

## 9. Architecture invariants

- **MUST** keep `ParsedWhatsAppMessage` as the only shape business logic sees. Provider-specific parsing lives in `messageParser.ts` (Baileys) / `metaWebhookParser.ts` (Meta) only.
- **MUST** keep every write org-scoped (`org_id` in every query). The service-role Supabase client bypasses RLS — scoping is code's responsibility.
- **MUST** keep AI processing async via `job_queue` (atomic `dequeue_job()` RPC). Never call the LLM inline from an inbound handler.
- **MUST** encrypt any third-party credential at rest (`utils/metaEncryption.ts` pattern). Plaintext secrets in `config` jsonb = bug.
- **WHEN** adding a third WhatsApp provider (Gupshup/Twilio — the CHECK constraint already allows them): new adapter implementing `MessagingAdapter` + new inbound parser producing `ParsedWhatsAppMessage` + rows with the new `provider` value. Nothing else changes.

## 10. Dev workflow

- Gates: `cd backend && npx tsc --noEmit` + `npx vitest run` (337 tests, all green). Frontend: `npx tsc --noEmit` (ignore stale `.next/types` noise).
- **NEVER** run `next build` while `next dev` is running — it wipes `.next` and the dev session 404s every chunk (`main-app.js`, `layout.js` 404s + "stuck on loading"). If it happens: stop dev, `rm -rf frontend/.next`, restart dev, hard refresh.
- Eval tests (`npm run test:evals`) hit the real LLM — opt-in only, never part of the default gate.
- Migrations: SQL in `supabase/migrations/`, idempotent (`IF NOT EXISTS`), applied via `npm run migrate`, documented in `docs/DATABASE.md`.
- 404 on backend API from frontend? Check `frontend/.env.local` → `NEXT_PUBLIC_API_URL` (should be `http://localhost:4000`, the backend `PORT`).

---

## Mistakes we already made — do not repeat

| Date | Mistake | Fix that landed |
|---|---|---|
| 2026-09-09 | LID digits stored as phone numbers (`+275101262078103`) | Domain-aware `jidToPhone` + `contactPhones` resolution + backfill |
| 2026-09-09 | `status@broadcast` / `@newsletter` chats became leads (`Naresh` ×70) | System-chat skip + cleanup script |
| 2026-09-09 | 7 duplicate leads for one LID chat (create race, no phone to dedup on) | `source_detail` fallback matching + merge script |
| 2026-09-09 | 38-digit anonymous-caller phone stored | Length guard in cleanup script + plausible-phone validation in `callResultService` |
| 2026-09-09 | `getAccountStatus` filtered by global `WHATSAPP_PROVIDER` — Meta accounts invisible | Provider-agnostic latest-account query |
| 2026-09-09 | Hardcoded `sent_via: 'baileys'` in the reply job | Provider-aware metadata |
| 2026-09-09 | `next build` run while `next dev` up → all chunks 404, app stuck loading | Rule #17 in CLAUDE.md; validate with tsc only |
| 2026-08-30 | Sarvam webhook returned 400 on empty body → 11× retry storm | Tolerant-by-design webhook (audit + 200) |
| 2026-08-30 | `human_handoff` silently dropped messages | Only `ai_enabled=false` / `blocked` stop the bot; handoff auto-clears |

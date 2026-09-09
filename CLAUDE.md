# CLAUDE.md — Agent Context for Calling Agent Platform

> Multi-industry WhatsApp AI + Calling Agent platform (Fastify + Next.js + Supabase).
> **Before touching WhatsApp, Sarvam, or lead data, read `docs/RULES.md` — the guardrails below exist because each one was a real bug we already fixed.**

## The Non-Negotiables

### WhatsApp — dual provider
1. Two providers live side by side, chosen **per account** (`whatsapp_accounts.provider`): `baileys` (QR, demo tier) and `meta_cloud_api` (official). Never remove either.
2. Both providers MUST converge to the same `ParsedWhatsAppMessage` (JID-canonical `chatId`, e.g. `919999999999@s.whatsapp.net`) before any lead/conversation/AI logic. Downstream code never branches on provider — except the 24h window (meta only).
3. Outbound always goes through `waManager.resolveAdapter(accountId)` — never construct adapters ad-hoc. Baileys = live socket; Meta = stateless adapter built from the DB row.

### Phones & LIDs
4. **LID ≠ phone.** The digits in `xxx@lid` JIDs are privacy IDs. `jidToPhone()` returns `''` for any domain except `@s.whatsapp.net`. Never "normalize" a LID into a phone.
5. LID → real phone resolution comes ONLY from contact-sync `phoneNumber` fields (`contactPhones` map in baileysClient) and auto-backfills leads. A missing phone ("—") is always better than a fake one.
6. `status@broadcast`, `@newsletter`, `@broadcast` chats NEVER become leads/conversations — skip them in both `handleIncomingMessage` and `enqueueIncomingMessage`.
7. Leads dedup by phone; LID-only chats dedup by `source_detail` (= chatId). Real phones backfill onto those leads when resolved.

### Meta Cloud API specifics
8. Webhook (`POST /webhooks/whatsapp`) is **fail-closed**: no `META_APP_SECRET` or bad HMAC → 401. After signature OK → **always 200** (Meta retry storms must never happen; per-entry errors are logged only).
9. Meta tokens/verify-tokens/PINs are stored AES-256-GCM encrypted (`ENCRYPTION_KEY`) — never plaintext, never echoed to any API response.
10. Connecting a number requires `/register` (2FA PIN) + `/subscribed_apps` — inbound events go to whichever app last registered. One Meta number = one account row (unique index on `phone_number_id`).
11. Meta free-form sends are only legal within 24h of the customer's last inbound message. Outside → flag `pending_human`, do NOT attempt the send (error 131047).

### Sarvam
12. Real calls are guarded: IST calling hours, DNC registry, per-org daily limits, E.164 phone validation. Never bypass silently.
13. The Sarvam result webhook is **tolerant by design**: bad/empty bodies are audited + acked 200, never 400 (a 400 caused an 11× retry storm once).

### Data hygiene
14. Never write a "phone" you can't verify. Cleanup scripts live in `backend/scripts/` (`fix-lid-phones.ts`, `cleanup-junk-leads.ts`) — idempotent, run them if junk reappears.
15. Every table is `org_id`-scoped. Service-role client bypasses RLS — org scoping is OUR job in every query.

### Dev workflow
16. Gates before done: `cd backend && npx tsc --noEmit && npx vitest run` (348 tests, all must pass).
17. **NEVER run `next build` while `next dev` is running** — it wipes `.next` and the dev session 404s on every chunk. Frontend validation = `npx tsc --noEmit` only (stale `.next/types` errors are noise).
18. Migrations are SQL files in `supabase/migrations/`, idempotent, applied via `npm run migrate`. Update `docs/DATABASE.md` when you add one.

## Key docs
- `docs/RULES.md` — full guardrails + mistakes-we-made list (this file is the TL;DR)
- `docs/ARCHITECTURE.md` — system map, file map, message lifecycle
- `docs/META_CLOUD_API.md` — Meta provider setup + architecture
- `docs/API_REFERENCE.md` / `docs/DATABASE.md` / `docs/SETUP.md` / `docs/DEPLOYMENT.md`

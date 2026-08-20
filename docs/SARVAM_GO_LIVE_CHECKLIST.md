# Sarvam Go-Live Checklist (2026-08-20)

Everything below is DONE unless marked **[YOU]**.

## ✅ Completed automatically

1. **`.env` scaffolded** — all `SARVAM_*` vars + `PUBLIC_BASE_URL` present:
   - `SARVAM_WEBHOOK_SECRET` = generated (`openssl rand -hex 32`)
   - `PUBLIC_BASE_URL` = live tunnel (currently `https://grocery-lie-certain-inches.trycloudflare.com` — see webhook section below)
   - Org/workspace/app/connection IDs left as `FILL_FROM_DASHBOARD`
2. **Backend running** on :4000 — health OK, webhook auth verified (403 wrong secret, 400 bad payload) locally AND through the public tunnel.
3. **Public tunnel live** — `cloudflared` quick tunnel (no account needed; ngrok would need an authtoken). Log: `/tmp/cloudflared.log`.
   ⚠️ Quick-tunnel URL changes on restart — if it does, update `PUBLIC_BASE_URL` in `.env` and restart the backend.
4. **New endpoint** `GET /api/agent/config/call-prompt` — returns the exact phone persona (same as WhatsApp persona) to paste into the Sarvam dashboard. Verified working.
5. **Live-call HTTP tools** (`backend/src/routes/sarvamTools.routes.ts`) — same brain as WhatsApp for the phone agent:
   - `GET /api/tools/sarvam/lead-context?phone=+9198…` → known lead + last 3 messages (Sarvam on_start hook)
   - `GET /api/tools/sarvam/inventory-search?location=whitefield&budget_max=8000000&configuration=3BHK` → live inventory mid-call
   - **Preferred:** one agent-filled `query` param (`?query=gurgaon penthouse 8-10 crore`) → `backend/src/sarvam/queryParser.ts` extracts city/sector/configuration/budget (EN+Hindi); explicit structured params still work and win over parsed values; response echoes applied `filters`
   - Auth: `X-Tool-Secret` header = `SARVAM_TOOL_SECRET` (defaults to webhook secret). tsc clean, full suite 240/240.

## 🔑 Your webhook URL to give Sarvam

```
https://grocery-lie-certain-inches.trycloudflare.com/webhooks/sarvam/4561d9e5e599d7cf1c22970d9d593cb19a51a0f0dd0fd6c53cf114c883860887
```

> ⚠️ Tunnel restarted 2026-08-20 16:36 — this is the CURRENT URL. Old one is dead.
> If you restart cloudflared again, re-copy from `PUBLIC_BASE_URL` in `.env` + `/webhooks/sarvam/$SARVAM_WEBHOOK_SECRET`.

(Auth = the secret in the path. Sarvam doesn't sign payloads, so this is the auth layer.)

## 👤 Your agent persona

`GET /api/agent/config/call-prompt` → copy the `prompt` field into the Sarvam agent's system prompt.
Preview (real_estate template, "Priya" for StaffBadhao Testing) is in `docs/sarvam-call-prompt.txt`.

**Output variables (OPTIONAL):** the DeepSeek post-call summary already extracts everything (temperature, preferences, follow-ups) from the transcript. If you still want structured variables, `GET /api/agent/config/call-prompt` now also returns `output_variables` — a list derived from your org's qualifying fields (industry-correct by construction). Backend sanitizes/aliases any incoming variable and whitelists to real `crm_leads` columns, so wrong/extra variables can't break lead updates.

## 🗒️ [YOU] Step-by-step to first call

0. **⚠️ Create a CONVERSATIONS API key first** — apps.sarvam.ai → **Settings → API Key → Create**. Your current `sk_samvaad_…` key is a *platform* key (platform.sarvam.ai, TTS/STT) and gets **401 Authentication failed** on all apps.sarvam.ai APIs (verified 2026-08-20 via the analytics attempts endpoint). Replace `SARVAM_API_KEY` in `.env` with the new Conversations key.
   (Also: the dashboard's "Log Analyzer" page is internal-only (@sarvam.ai accounts) — "Not Authorized" there is expected and irrelevant to us. The **APIs** work fine with the right key.)

1. **Sarvam dashboard** (https://apps.sarvam.ai):
   - Copy org/workspace IDs from the dashboard URL
   - Create the voice agent → paste the persona prompt (optionally add the `output_variables` from the call-prompt endpoint), publish v1
   - Rent/connect a phone number → get connection_id + agent number
   - Fill `.env`: `SARVAM_ORG_ID`, `SARVAM_WORKSPACE_ID`, `SARVAM_APP_ID`, `SARVAM_CONNECTION_ID`, `SARVAM_AGENT_PHONE_NUMBER`
2. **DB migrations** — run `supabase/run_missing_migrations.sql` in the Supabase SQL editor (idempotent; includes sarvam 0008 + 0009). Verify:
   ```sql
   select column_name from information_schema.columns where table_name='sarvam_webhook_events';
   -- expect: id, org_id, attempt_id, interaction_id, event_type, payload, received_at, processed_at
   ```
3. **Restart backend** (`npm run dev` in `backend/`), keep the tunnel running.
4. **First call** — Dashboard → Leads → pick a lead (valid E.164 phone like `+9198…`) → "📞 Call via AI Agent". Calling hours guard: 9am–9pm IST.
5. **Verify CRM write-back** (Supabase):
   ```sql
   select attempt_id, status, outcome, started_at, ended_at from call_sessions order by started_at desc limit 5;
   select event_type, processed_at from sarvam_webhook_events order by received_at desc limit 10;
   ```

6. **(Optional) Wire the live tools in Sarvam** — in the agent's Tools section add the two API tools above (full URLs = `$PUBLIC_BASE_URL/api/tools/sarvam/…`, header `X-Tool-Secret` = your webhook secret). Verify from your machine:
   ```bash
   curl -s "$PUBLIC_BASE_URL/api/tools/sarvam/lead-context?phone=%2B919000000000" -H "X-Tool-Secret: $SARVAM_WEBHOOK_SECRET"  # → {"found":false,...}
   curl -s "$PUBLIC_BASE_URL/api/tools/sarvam/inventory-search?query=gurgaon%20penthouse%208-10%20crore" -H "X-Tool-Secret: $SARVAM_WEBHOOK_SECRET"  # → results + "filters" echo
   curl -s "$PUBLIC_BASE_URL/api/tools/sarvam/inventory-search?location=whitefield&budget_max=8000000" -H "X-Tool-Secret: $SARVAM_WEBHOOK_SECRET"
   curl -s -o /dev/null -w "%{http_code}\n" "$PUBLIC_BASE_URL/api/tools/sarvam/lead-context?phone=x" -H "X-Tool-Secret: nope"  # → 401
   ```

## 📥 Inbound calls (Phase S5 — approved number +917965854149)

Customers call the approved number → Sarvam agent answers → result webhook lands →
we resolve the caller via the analytics API → find-or-create lead (like WhatsApp
inbound) → full CRM write-back (summary, temperature, transcript, follow-ups).

**Backend setup:**
1. Sarvam dashboard → your agent → Webhook/Result URL: `$PUBLIC_BASE_URL/webhooks/sarvam/$SARVAM_WEBHOOK_SECRET`
   (same URL as outbound — the payload routes itself).
2. `.env`:
   ```
   SARVAM_INBOUND_NUMBER=+917965854149
   SARVAM_DEFAULT_ORG_ID=<your org uuid>   # inbound webhooks carry no orgId
   # optional — catch missed webhooks (local dev / outages):
   SARVAM_INBOUND_POLLER=false
   SARVAM_INBOUND_POLL_INTERVAL=120
   ```
3. Restart backend. Call the number from any phone.

**Verify:**
```sql
select direction, from_number, status, outcome, summary
from call_sessions where direction='inbound' order by created_at desc limit 5;
-- + a lead with source='inbound_call' for a first-time caller
```

The Calls page shows an `↙ Inbound` badge and the caller's number as the title.

## 🩺 Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Sarvam not configured` on start-real | One of the `FILL_FROM_DASHBOARD` values still set |
| 401/403 from Sarvam API | Bad `SARVAM_API_KEY` |
| No webhook hits | Tunnel died → check `/tmp/cloudflared.log`, restart, update `PUBLIC_BASE_URL`, restart backend |
| Webhook 400s in logs | Payload shape changed — inspect `sarvam_webhook_events.payload` |
| No `attempt_id` | Wrong org/workspace/app IDs (Sarvam 404s) |
| Calls rejected outside hours | `SARVAM_CALLING_HOURS_START/END` guard (IST) |
| Inbound call not in CRM | Check `SARVAM_INBOUND_NUMBER` set; event acked with `processing_error`?; enable `SARVAM_INBOUND_POLLER=true` to catch missed webhooks |
| Inbound attributed to wrong org | Set `SARVAM_DEFAULT_ORG_ID` (inbound payloads carry no orgId metadata) |
| Caller shows "Unknown" | Analytics record had no `user_identifier` — event logged as `no_caller`, check `sarvam_webhook_events.payload` |

---

## 🔥 Debug Log — 2026-08-20 (live-call session findings)

**Status: tool is LIVE and working.** 4 Sarvam-originated hits (`python-httpx` from `4.213.167.70`), all HTTP 200 (69–288ms), real inventory spoken on the call (Godrej Tropical Isle, Demo Heights with exact prices).

### Gotchas discovered (cost us hours — don't repeat)
1. **Auth Type "None" + secret in a plain header row = platform BLOCKS the tool silently.** The call proceeds but the tool never fires / gets cancelled. Fix: Auth Type → `API Key`, header `X-API-Key`, value → stored secret `tool_secret`. Our backend accepts `X-Tool-Secret`, `X-API-Key`, and `Bearer` (see `authorized()` in `backend/src/routes/sarvamTools.routes.ts`).
2. **Static params in tool config get sent literally on EVERY call.** Our live calls all sent `location=city+centre&budget_max=8000000&configuration=3BHK` (the test values) — Gurgaon/8cr never reached the backend. The transcript's "Params" panel shows LLM intent, not the wire. Fix: use ONE agent-filled param `query` (backend parses `query` natively and it handles Hindi/free text like "गुड़गांव penthouse 8-10 करोड़" → correct results verified).
3. **"Sometimes it doesn't trigger" = mostly barge-in + long turns.** When the agent starts a long "check करती हूँ" sentence and the caller talks over it, the turn gets cut before the tool fires. Fix: prompt v4 — max 2 short sentences per turn, filler line ≤ 5 words, "said the check line → tool call is COMPULSORY".
4. **API must never 5xx mid-call** — the platform treats tool errors harshly. Backend now hardened: every failure path returns HTTP 200 with `count:0` + a `note` telling the agent the graceful fallback line. Also 8s `withTimeout` guards so a hung Supabase call can't stall a live call.

### Backend hardening shipped (this session)
- `inventory-search`: never-5xx (graceful count-0 + note), 8s timeouts, empty-criteria guard ("ask caller for criteria" note), full free-text `query` parsing via `queryParser.ts` (one pass per configuration, merged + deduped, explicit params win) — tsc clean, full suite 240/240, verified live.
- `lead-context`: never-5xx (returns `found:false` + start-fresh note on any error), 8s timeout.
- Prompt v4: `docs/sarvam-call-prompt.txt` (compulsory tool-call rule, all property types incl. penthouse/villa/plot, female Priya persona + greeting line).

### Remaining (user actions in Sarvam dashboard)
- [ ] Tool param → single agent-filled `query` (delete static location/budget/configuration rows)
- [ ] Greeting → Priya line; Voice → female Hindi
- [ ] Advanced: "If it fails" fallback text + Max wait 10s
- [ ] Commit agent → repoint inbound deployment → test call (ask Gurgaon penthouse 8-10cr) → verify `logs/sarvam-tool-calls.log` shows real params in URL

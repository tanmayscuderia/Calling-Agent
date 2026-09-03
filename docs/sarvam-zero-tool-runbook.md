# Sarvam Dashboard Runbook — Zero-Mid-Call-Tool Migration (v7.6)

> Created 2026-08-30. Step-by-step OPERATOR checklist for the dashboard side of
> the zero-mid-call-tool architecture. Backend code is already done and fully
> tested (tsc clean, 290/290 tests). Use this file during the change and tick
> the checkboxes as you go — it doubles as the record of what was changed.
>
> Companion files:
> - `docs/sarvam-call-prompt.txt` — v7.6 prompt (the ONLY thing pasted into Instructions)
> - `docs/sarvam-dashboard-setup.md` — short permanent setup notes (already current)
> - `docs/sarvam-tool-failure-evidence.md` — WHY mid-call tools were removed
>   (Addendum 4) + Addendum 3 result checkboxes to fill after Part H

## STATUS SNAPSHOT — 2026-08-30 (end of day)

| Part | Status | Evidence |
|------|--------|----------|
| B — delete mid-call tools | ✅ DONE | Zero `inventory-search` dispatches all day (was the "hai kya tuh" break) |
| C — two on_start hooks | ✅ LIVE | 13/13 paired hook hits via ngrok (snapshot + lead-context) |
| D — 8 output variables | ✅ CREATED | customer_name, city, location, configuration, budget_min, budget_max, purpose, timeline |
| E — on_end webhook | ⚠️ FIRES, body EMPTY | Every call POSTed with `Content-Length: 0` → 11x 400 "Invalid payload"; `sarvam_webhook_events` still 0 rows |
| F — paste v7.6 prompt | ❓ CONFIRM on dashboard | Instructions must show the LEAD CONTEXT section (GREETING + inventory rules) |
| G — backend + tunnel | ✅ (see durability note) | ngrok reserved URL stable; backend crashed twice today — now run under nohup |
| H — proof batch | ⏳ BLOCKED on E + F | 2 test calls → first `sarvam_webhook_events` row → CRM lead update |

### Root causes found today (ngrok inspector forensics, 53 requests)
1. **on_end sends an EMPTY body** — the dashboard on_end tool has no Body
   template configured, so Sarvam POSTs nothing and our old strict route
   answered 400 (Sarvam retried each time — config problems can't succeed
   on retry). Fix shipped backend-side: the route is now TOLERANT (see
   `backend/src/routes/sarvamWebhook.routes.ts`) — every POST is raw-logged
   to `backend/logs/sarvam-webhooks.log`, empty/unrecognized bodies are
   audited into `sarvam_webhook_events` with a `processing_error` note and
   acked 200 (never 400), and real bodies accept field aliases
   (`call_id|interaction_id` for `attempt_id`, `disposition|outcome` for
   `status`) plus flat variable chips. **But the real fix is dashboard-side:
   add the Body template (see sarvam-dashboard-setup.md → PENDING FIXES).**
2. **Hook #1 `phone=` chip resolves empty on live calls** → lead-context
   returns 400 with empty phone. NOW CONFIRMED ACROSS 3 CALLS (Sep 1). The
   fix is exact: delete the wrong chip, insert the PLATFORM chip
   **`user_phone_number`** (E.164 caller number, per Sarvam docs). Do NOT
   pick the agent's `phone` OUTPUT variable — it is empty at call start;
   that is the mistake made 3 times (sarvam-dashboard-setup.md → Fix 2).
3. **Backend ran in a foreground terminal** and died twice (11:30 crash →
   502s → recovered → died again). Now started with nohup
   (`logs/server.log`), survives terminal close.

---

## TL;DR — what changes vs what stays

| Part | What | Action | Est. |
|------|------|--------|------|
| B | `inventory_search` + `inventory_search_backup` | **DELETE both** | 2 min |
| C | Two on_start hooks (lead context + snapshot) | **VERIFY only** — no edits unless a field mismatches | 5 min |
| D | Output variables | **CREATE 8** (+1 optional analytics var) | 10 min |
| E | on_end webhook | **VERIFY existing** — create only if missing | 3 min |
| F | Prompt | **PASTE v7.6** full file — same sitting as B! | 5 min |
| G | Backend + tunnel | **RESTART backend**, check tunnel | 2 min |
| H | Test batch | 2 calls + log signature + CRM check | 10 min |

Order matters: **B and F together** — tools deleted but old prompt still
referencing them = LLM attempts deleted tools mid-call. That was the original
garbage-utterance failure mode.

---

## 0. Golden rules — do NOT touch these

1. **The two on_start hooks** (Part C). No edits, no delete. They ARE the
   inventory brain now — the LLM never dispatches anything mid-call.
2. **Webhook secret / URL** (Part E). The secret in the path is the auth.
   Never regenerate it without updating the backend env in the same minute.
3. **Voice (MALE Hindi)** and the greeting line.
4. **Variable names in Part D** — exact lowercase snake_case. The backend
   whitelist (`sanitizeAgentVariables`) silently DROPS unknown names.
5. **Auth values** — never typed as plain text into any tool config; Sarvam
   stores secrets masked (Secrets) and tools reference them. If a field
   already references the secret, don't re-enter anything.
6. **Don't create any new on_start tool.** The snapshot loader already exists
   and is correct. Creating a duplicate = two snapshot fetches per call.

---

## Part A — before you touch anything (5 min, rollback insurance)

- [ ] Agent → Tools: screenshot the full tool list.
- [ ] Agent → Instructions: confirm it currently says v7.5 (note the header line).
- [ ] Agent → Variables: screenshot the existing variables tab.
- [ ] Open `docs/sarvam-call-prompt.txt` in VS Code (needed in Part F).

---

## Part B — DELETE both mid-call tools (~2 min)

1. Agent → Tools → find **`inventory_search`** → delete → confirm.
2. Same for **`inventory_search_backup`**.
3. Any other mid-call ("During conversation") tool row left on the agent → delete too.

**End state:** the tool list shows ONLY the two on-start hooks from Part C.

- [ ] `inventory_search` deleted
- [ ] `inventory_search_backup` deleted
- [ ] no other mid-call tool rows remain

> ⚠️ Do Part F in the same sitting. Tools gone + prompt still v7.5 = broken
> calls until the paste happens.

---

## Part C — VERIFY the two on_start hooks (5 min, expect NO changes)

Open each hook row and check every field against the table. Change nothing
unless a field actually mismatches.

### Hook #1 — lead context

| Dashboard field | Correct value | Status |
|---|---|---|
| When should this tool run? | **On start** | REQUIRED |
| Method | `GET` | verify |
| URL | `https://<tunnel>/api/tools/sarvam/lead-context` | verify |
| Query param | `phone` = **`user_phone_number`** — the PLATFORM caller-number chip (single braces), inserted via the dashboard variable picker, NOT typed as `{{...}}`. NOT the agent's `phone` output variable (empty at call start — caused 3 failed calls) | REQUIRED |
| Auth | API key → header `X-API-Key` → references the stored tool secret (`SARVAM_TOOL_SECRET`, falls back to `SARVAM_WEBHOOK_SECRET` in the backend env) | REQUIRED |
| Save reply into variables | reply field `found` → `lead_found`, `lead` → `lead_context`, `recent_messages` → `recent_messages` (whatever mapping already exists — keep it) | verify |
| Response template | leave empty | on_start hooks CANNOT use one (no LLM in the loop) |
| If it fails | leave empty | never spoken; backend never 5xxs this route |
| Max wait | ≤10 s is fine | backend answers in ≤8 s or falls back gracefully |

### Hook #2 — inventory snapshot

| Dashboard field | Correct value | Status |
|---|---|---|
| When should this tool run? | **On start** | REQUIRED |
| Method | `GET` | verify |
| URL | `https://<tunnel>/api/tools/sarvam/inventory-snapshot` | verify |
| Query params | **none** | |
| Auth | same `X-API-Key` secret as Hook #1 | REQUIRED |
| Save reply into variables | reply field `inventory_summary` → agent variable **`inventory_summary`** (exact name — the v7.6 prompt references it by name) | REQUIRED |
| Response template | leave empty | hooks can't use |
| If it fails | leave empty | |

Facts worth knowing (no action):
- Snapshot response is **markdown** now: `# INVENTORY` guard header,
  `## City (n)` sections, `- Name (Sector) — 2BHK/3BHK — 1.2–2.1 cr` bullets;
  sold-out projects show "price on request" with no configs.
- Backend caches: 5-min per-org snapshot cache, 5-min per-phone lead cache.
  Auto-invalidated on inventory edits and after each call finalizes. Test
  batches stop hammering the DB/tunnel.
- Beyond 300 projects the dump truncates with "(+N more — offer callback)".
  `available_cities` / `total_properties` in the reply stay complete.

- [ ] Hook #1 verified — all fields match
- [ ] Hook #2 verified — all fields match

---

## Part D — CREATE the output variables (~10 min)

Agent → Variables → **Output variables** tab → Add variable, one per row.
Sarvam's LLM extracts these from the conversation after every call.

> Platform note: output-variable data type is **String or Enum only** (there
> is no Number option). Budgets are Strings; the backend parses digit strings
> (and "1.5 cr" style) into numbers itself. Keep the extraction prompts asking
> for digits — that is the most reliable form.

| name | type | extraction prompt (copy-paste) | lands in CRM as |
|---|---|---|---|
| `customer_name` | String | The caller's full name as they stated it during the call. Leave empty if they never said their name. | full_name |
| `city` | String | The city the caller is looking for property in, as the caller said it (e.g. Noida, Greater Noida West). Leave empty if not mentioned. | preferred_city |
| `location` | String | Any specific area, sector or locality within the city that the caller mentioned (e.g. Sector 150). Leave empty if not mentioned. | preferred_location |
| `configuration` | String | The property type the caller wants, e.g. 2BHK, 3BHK, villa, plot, office. Leave empty if not mentioned. | configuration |
| `budget_min` | String | The lower end of the caller's budget as digits in rupees (e.g. 10000000 for 1 crore). Leave empty if not mentioned. | budget_min |
| `budget_max` | String | The upper end of the caller's budget as digits in rupees (e.g. 20000000 for 2 crore). Leave empty if not mentioned. | budget_max |
| `purpose` | String | Why the caller wants the property: "self use" if they want to live in it, "investment" if for investment or rental income. Leave empty if unclear. | purpose |
| `timeline` | String | When the caller plans to buy, in their own words (e.g. "within 1 month", "this year"). Leave empty if not mentioned. | timeline |

- [ ] all 8 created with exact names
- [ ] extraction prompts pasted

Optional extras (nice-to-have, skip if in a hurry):
- **PII flag** on `customer_name` — masks the name in logs/analytics.
- **Call goal** for analytics: create one more output variable
  `call_disposition` (Enum: `interested`, `not_interested`,
  `callback_requested`, `unreachable`; extraction prompt: "Overall outcome of
  the call: 'interested' if genuine interest, 'callback_requested' if they
  asked to be contacted later, 'not_interested' if declined, 'unreachable' if
  the call never really connected."). Then set **Successful when** =
  `call_disposition` `=` `interested`. This powers Agent Analytics success
  metrics only — the backend whitelist drops it from CRM writes, which is fine.

---

## Part E — on_end webhook: VERIFY, don't duplicate (3 min)

Your call-result webhook is **already live** — it is how transcripts reached
the CRM until now. The only new thing is that after Part D the same payload
carries `final_agent_variables`, which the existing backend pipeline writes
into the CRM lead. No new code, no new dashboard object.

Verify:
- [ ] the existing webhook/on_end config points to
      `POST https://<tunnel>/webhooks/sarvam/<SARVAM_WEBHOOK_SECRET>`
- [ ] the secret segment in the path is unchanged

Only if it is genuinely missing (it shouldn't be), create it:
Agent → Tools → New tool → name `call_result_webhook` → method `POST` → URL
above → **When should this tool run?** = `on_end` → Auth = none (secret lives
in the path) → body = the platform's default call-result event → Save.
NEVER create a second webhook if one already exists.

Optional hardening: allowlist Sarvam's documented egress IP `4.213.167.70`
at the tunnel/firewall.

---

## Part F — paste prompt v7.6 (5 min — same sitting as Part B)

1. Open `docs/sarvam-call-prompt.txt` → select all → copy.
2. Agent → Instructions → clear the ENTIRE field (no v7.5 line may survive) → paste.
3. Save. The file has no double-brace templates, so validation passes clean.
4. Greeting field (unchanged if already set):
   "नमस्ते! मैं Shubh बोल रहा हूँ, Staffbadhao Testing से। क्या आप अभी 2 मिनट बात कर सकते हैं?"
5. Voice: **MALE Hindi**.

v7.6 contains ZERO tool instructions — nothing references the deleted tools,
so the LLM will never attempt a mid-call dispatch again. It also carries a
LEAD CONTEXT section: `lead_found` = false → treat the caller as a brand-new
customer (NEVER claim a prior interaction); `lead_found` = true → use
`lead_context` / `recent_messages` naturally and don't re-ask known details.

- [ ] v7.6 pasted (full file — updated 2026-08-30, 56 lines, LEAD CONTEXT
      section visible right below GREETING)
- [ ] voice = MALE Hindi
- [ ] greeting set

---

## Part G — machine pre-flight (2 min)

```bash
./scripts/sarvam-tunnel.sh status     # start it if down; URL is static
lsof -nP -iTCP:4000 -sTCP:LISTEN      # tsx process should be listening
```

Restart the backend so the NEW code loads (markdown snapshot + both caches
shipped 2026-08-30): kill the tsx process and start it again (`npm run dev`
in `backend/`). `tsx watch` may have auto-reloaded already — when unsure,
restart anyway.

- [ ] tunnel up (URL matches what Part C hooks use)
- [ ] backend restarted on the new code

---

## Part H — test batch + success signature (~10 min)

Place 2 test calls exactly as before (dashboard test/batch):

1. **"Noida mein 3BHK chahiye, budget 2 crore"**
   Expect: names a REAL project from the list with a correct price band,
   ≤2 sentences, offers site visit / WhatsApp callback. No invented projects.
2. **"Pune mein kuch hai?"**
   Expect: "Pune mein currently kuch nahi hai — ye cities mein projects
   hain…" and lists the actual cities. No dispatch, no inventing.

Then check:

- [ ] `tail -20 backend/logs/sarvam-tool-calls.log` shows exactly ONE
      `inventory-snapshot.request` + one `lead-context.request` (or
      `lead-context.cache-hit`) per call, both `200` — and **ZERO**
      `inventory-search.*` events.
- [ ] No garbage utterances ("अरे", "है क्या तू"), no force `AGENT_ENDS`.
- [ ] CRM: after the call, the lead (existing or newly created) shows the
      captured fields (name/city/config/budget/purpose/timeline) + a call
      summary in notes.
- [ ] Fill the **Addendum 3 checkboxes** in
      `docs/sarvam-tool-failure-evidence.md` with the outcome.

If a call misbehaves: dashboard → Call Logs → open the call → Log Analyser →
click the broken turn (this view is dashboard-only, no API). With zero
mid-call tools a bad turn = prompt/context problem — first confirm
`inventory-snapshot.200` fired and `inventory_summary` actually loaded on
that call (starting vs final variables, NEW/CHANGED badges).

---

## Part I — rollback (only if something is badly broken)

1. **Prompt back to v7.5:**
   `git log --oneline -- docs/sarvam-call-prompt.txt` → find the pre-v7.6
   commit → `git show <commit>:docs/sarvam-call-prompt.txt` → paste into
   Instructions.
2. **Recreate the mid-call tools** from the archived specs:
   `docs/sarvam-dashboard-setup.md` (ARCHIVED section) and
   `docs/sarvam-tool-failure-evidence.md` — `inventory_search` with the
   single `query` param, the coverage / no_results_in / ask_for response
   contract, and the "If it fails" graceful line.
3. **Output variables can stay** — they are independent of tools and keep
   capturing leads via the on_end webhook.

Warning: mid-call dispatches died randomly inside Sarvam's harness (Addendum
4) — rollback reintroduces that failure mode. Prefer fixing forward.

---

## Appendix — which dashboard fields matter where

| Field | Mid-call tool | on_start hook | on_end hook |
|---|---|---|---|
| When should this tool run? | `run` (During conversation) | `On start` | `on_end` |
| Method + URL | required | required | required |
| Params / body | required | `phone` chip only (Hook #1) | platform default event |
| Auth | `X-API-Key` secret | `X-API-Key` secret | none (secret in path) |
| Response template | optional | **NOT available** (no LLM in hooks) | **NOT available** |
| "If it fails" line | spoken fallback | ignored | ignored |
| Max wait | ≤30 s | ≤10 s | n/a |
| Save reply into variables | optional | **REQUIRED** (the mapping) | n/a |

*End of runbook. Keep this file updated if any hook/variable ever changes.*



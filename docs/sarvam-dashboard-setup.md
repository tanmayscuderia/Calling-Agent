# Sarvam Voice Agent — Dashboard Setup Notes

> **OPERATOR notes only** — do NOT paste this file into the agent Instructions field.
> The ONLY file that goes into Agent → Instructions is `docs/sarvam-call-prompt.txt`
> (paste the whole file — it contains no double-brace templates, so a full-file
> paste passes Sarvam's validator).
>
> **Doing the dashboard change now? Follow `docs/sarvam-zero-tool-runbook.md`** —
> step-by-step checklist with every field's required value.

## CURRENT MODE: ZERO-MID-CALL-TOOL (v7.6, 2026-08-30)

The agent has **NO mid-call tools**. Everything it knows about inventory is
loaded ONCE at call start into the `inventory_summary` variable by the
on_start hook. Lead capture happens AFTER the call via output variables +
the on_end webhook.

Why: two live calls 2.5 minutes apart on the same healthy tunnel proved
mid-call dispatches die randomly inside Sarvam's harness even with our
backend fine — and when a dispatch dies, the agent says garbage
("अरे, है क्या तू") and force-ends, with no failure logged anywhere. Full
evidence: docs/sarvam-tool-failure-evidence.md (Addendum 4). The
snapshot-variable architecture removes the failing component entirely:
filtering happens in our SQL at call start; the LLM never dispatches anything.

## ⚠️ PENDING FIXES (dashboard-side)

### Fix 1 — on_end webhook result delivery — ⚠️ Body template DOES NOT interpolate
**2026-09-11 live-fire finding:** the tool's **Body** text section sends typed
`{{...}}` placeholders VERBATIM — no variable interpolation (proved on a real
call: body arrived as literal `"{{attempt_id}}", "{{status}}", …`). Only the
**Params** section binds chips to real values (same mechanism as Hook #1,
which resolved `User identifier` live).

**Working config: Params only (4 chips), Body section EMPTY:**

| Param key | Chip |
|---|---|
| `attempt_id` | Attempt ID |
| `duration` | Call length in seconds |
| `phone` | caller_phone |
| `call_transcript` | Call transcript |

Lead fields (name/city/budget/configuration/timeline) are NOT needed as
separate params — the backend parses the raw `call_transcript` into turns and
DeepSeek extracts them post-call (summary, temperature, preferences,
follow-ups). Missing `status` is inferred as `connected` when
duration/transcript prove a real call.

Backend safeguards proven live (`normalizeSarvamPayload`): literal `{{...}}`
placeholders are skipped everywhere (identity, status, lead vars) — a
misconfigured tool is audited into `sarvam_webhook_events` and acked, never
corrupts data. Numeric-string `duration` ("94") coerced. Tests:
`backend/tests/unit/sarvamWebhook.test.ts`.

### Fix 2 — Hook #1 (lead-context) phone parameter — chip renamed in current picker
The `phone=` query param resolves EMPTY on live calls → 400s.

**Pick exactly this chip: `User identifier`** — the PLATFORM's caller-number
field (`user_identifier`, "Phone number of the user in E.164 format",
populated on every attempt). The old build labelled it `user_phone_number`;
current dashboard picker shows it as **User identifier** (with
`User identifier type` = `PHONE_NUMBER` right below it).

⚠️ **THE TRAP (this is what went wrong 3 times):** the picker ALSO shows
agent output variables (`phone`, and look-alikes `caller_number` /
`caller_phone` — these sit beside hook/output vars like `user_name`,
`call_summary`, `lead_context` in the list). Output variables are EMPTY at
call start — the LLM only fills them mid-call. Pick the platform
telephony chip (`User identifier`), NOT `caller_number` / `caller_phone` /
`phone`.
Symptom of the wrong chip: our log shows `lead-context?phone=` with nothing
after the `=`, or a `lead-context.400` entry.

Steps: Hook #1 (lead-context) → Parameters → phone → delete the wrong chip →
insert `user_phone_number` via the variable picker (single braces, NOT typed
`{{...}}`) → Save.
Verify with one call: `grep lead-context backend/logs/sarvam-tool-calls.log`
must show `phone=%2B91...` (URL-encoded +91 number) and a 200.

### Backend safety net (already shipped 2026-08-30)
The webhook route no longer 400s on empty/bad bodies — it audits them into
`sarvam_webhook_events` (`processing_error` explains why) and returns 200,
and every POST is raw-logged to `backend/logs/sarvam-webhooks.log`. So a
missing Body template can no longer produce a retry storm — but you still
lose the call data until Fix 1 is done.

## PRE-FLIGHT before every test batch
- `./scripts/sarvam-tunnel.sh status` — if not running:
  `./scripts/sarvam-tunnel.sh start` (ngrok free dies on Mac restart; URL is
  static so nothing else changes).
- Backend: `lsof -nP -iTCP:4000 -sTCP:LISTEN` should show the tsx node process.
- Backend must run the NEW code — restart tsx after pulling this repo
  (markdown snapshot + caches shipped 2026-08-30).
- Success signature (`tail -20 backend/logs/sarvam-tool-calls.log`): exactly
  ONE `inventory-snapshot.request` (+ one `lead-context.request`, or its
  `lead-context.cache-hit`) per call, both 200 — and ZERO
  `inventory-search.*` events, ever. Mid-call dispatches no longer exist.

## STEP 1 — DELETE both mid-call tools (required)
- Tools → `inventory_search` → Delete. Tools → `inventory_search_backup` →
  Delete. Remove any other tool rows left on the agent.
- Do NOT touch the two on_start hooks (Step 2) — those stay exactly as they are.
- Stale tool names anywhere in the prompt make the LLM attempt deleted
  tools — that is why Step 3 (paste v7.6) must happen in the same sitting.

## STEP 2 — on_start hooks (configs unchanged, keep both)
- Hook #1 (lead context):
  `GET https://<tunnel>/api/tools/sarvam/lead-context?phone={user_phone_number}`
  - Sarvam has no literal double-brace caller-phone template: insert the
    caller-number variable CHIP from the dashboard's variable picker using
    SINGLE braces. Double-brace URLs are NOT interpolated.
- Hook #2 (inventory snapshot):
  `GET https://<tunnel>/api/tools/sarvam/inventory-snapshot` (no params)
  - "When should this tool run?" = **On start** (on_start hooks never speak,
    so no "If it fails" line is needed).
  - Save reply into variables: map reply field `inventory_summary` → agent
    variable `inventory_summary` (exact name — the prompt references it).
  - Response is MARKDOWN now: guard header, `## City (n)` sections, dash
    bullets (`- Name (Sector) — 2BHK/3BHK — 1.2–2.1 cr`), sold stock shows
    "price on request".
  - Caching: 5-min in-memory per org (snapshot) and per phone (lead context),
    cleared automatically when inventory is edited or a call result finalizes.
    Test-batch bursts stop hammering the DB and the tunnel.
  - Cap: beyond 300 projects the dump truncates with "(+N more — offer
    callback)". At real scale (100–200) this never triggers.
- Both hooks: Auth = API Key → header X-API-Key → secret = SARVAM_TOOL_SECRET
  (falls back to SARVAM_WEBHOOK_SECRET) — configure via the Auth block,
  NOT a plain header row.

## STEP 3 — paste prompt v7.6
- Agent → Instructions → paste the FULL contents of
  `docs/sarvam-call-prompt.txt` (v7.6).
- Voice: MALE Hindi. Greeting (dashboard Greeting field):
  "नमस्ते! मैं Shubh बोल रहा हूँ, Staffbadhao Testing से। क्या आप अभी 2 मिनट बात कर सकते हैं?"
- v7.6 contains ZERO tool instructions — do not keep any section from v7.5.
- v7.6 (updated 2026-08-30) also has a LEAD CONTEXT section right below
  GREETING — after pasting, confirm "## LEAD CONTEXT — NEW vs RETURNING
  CALLER" is visible there. It maps `lead_found` false → brand-new customer
  (never claim prior interaction), true → use `lead_context` /
  `recent_messages` and skip re-asking known details.

## STEP 4 — output variables + on_end hook (post-call lead capture)
- Agent → Variables → add OUTPUT variables (Sarvam extracts these at call end):
  | name | type | lands in CRM as |
  |---|---|---|
  | customer_name | string | full_name |
  | city | string | preferred_city |
  | location | string | preferred_location |
  | configuration | string | configuration |
  | budget_min | string (digits in rupees) | budget_min |
  | budget_max | string (digits in rupees) | budget_max |
  | purpose | string | purpose |
  | timeline | string | timeline |
  These names pass the backend whitelist/alias map (sanitizeAgentVariables in
  backend/src/sarvam/callResultService.ts). Unknown names are dropped
  silently — don't invent new ones without whitelisting them there.
- on_end hook: `POST https://<tunnel>/webhooks/sarvam/<SARVAM_WEBHOOK_SECRET>`
  (same secret pattern as the existing webhook config) with the platform's
  call-result event (carries final_agent_variables + interaction_transcript).
- Already-live pipeline (no new code): webhook → `process_call_result` job →
  transcript turns + LLM summary + output-variable lead enrichment written to
  the CRM lead (callResultService.processCallResultJob → finalizeCall).
  Verified in code 2026-08-30. It also clears the lead-context cache, so the
  next call sees fresh lead data.
- Optional hardening: allowlist Sarvam's documented egress IP `4.213.167.70`
  (see sarvam-voice-agents-md) at the tunnel/firewall; keep the secret in the
  webhook path.

## Test batch — success criteria (fill Addendum 3 checkboxes after this)
1. "Noida 3BHK 2 crore" → correct name + price from the list, ≤2 sentences.
2. "Pune में कुछ है?" → "not there currently, we have these cities…" — no
   inventing, no dispatch.
3. Floor plan / exact unit question → WhatsApp callback offer.
4. Logs: ONLY on_start fetches, ZERO mid-call dispatches, no garbage
   utterances ("अरे", "है क्या तू"), no force AGENT_ENDS.
5. After the call: CRM lead shows updated fields + summary in notes.
Outcome → tick the Addendum 3 result checkboxes in
docs/sarvam-tool-failure-evidence.md.

## ARCHIVED — tool era (pre-v7.6), kept for rollback only
- inventory_search + inventory_search_backup tools, the single-`query`-param
  rule, the "If it fails" graceful line, the coverage / no_results_in /
  ask_for response contract, and the old PRE-FLIGHT symptom rule ("no
  inventory-search.request during a call = tunnel down"). All superseded by
  this mode. The backend routes stay deployed (harmless, still auth'd) but
  nothing calls them mid-call anymore.

## Debugging broken calls (unchanged)
- Turn-level tool-call inputs/outputs/errors = dashboard ONLY (Call Logs →
  open the call → Log Analyser → click the broken turn → Tool Call card).
  There is NO API for that view.
- The export script auto-flags calls via the attempts API
  (`has_log_issues` + `failure_reason` on each .skip.json, counted in the
  summary). Run it, then open the flagged interaction IDs in Log Analyser
  before escalating to Sarvam.
- With no mid-call tools, a bad turn now means a prompt/context problem, not
  a dispatch problem — first check the snapshot fetched OK
  (`inventory-snapshot.200` in sarvam-tool-calls.log) and that
  `inventory_summary` actually loaded on the call.

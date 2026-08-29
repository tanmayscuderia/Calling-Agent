# Sarvam Voice Agent — Dashboard Setup Notes

> **OPERATOR notes only** — do NOT paste this file into the agent Instructions field.
> The ONLY file that goes into Agent -> Instructions is `docs/sarvam-call-prompt.txt`
> (paste the whole file — since v7.1 it contains no double-brace templates,
> so a full-file paste passes Sarvam's validator).

## Agent -> Instructions
- Paste the FULL contents of `docs/sarvam-call-prompt.txt` (v7.1+).
- Voice: MALE Hindi.
- Greeting (dashboard Greeting field, NOT inside instructions):
  "नमस्ते! मैं Shubh बोल रहा हूँ, Staffbadhao Testing से। क्या आप अभी 2 मिनट बात कर सकते हैं?"

## Inventory search tool (mid-call)
- Tool: GET https://<tunnel>/api/tools/sarvam/inventory-search
- Auth: API Key -> header X-API-Key -> secret = SARVAM_TOOL_SECRET
  (falls back to SARVAM_WEBHOOK_SECRET) — configure via the Auth block,
  NOT a plain header row.
- Param: query = agent-filled (caller's actual demand) — preferred over static
  location/budget/configuration rows. The backend parses the query natively.
- Advanced -> If it fails (set the SAME graceful line on BOTH tools — note:
  when the harness crash hits, this line does NOT fire, see
  docs/sarvam-tool-failure-evidence.md; it still covers timeouts/5xx):
  "माफ़ कीजिए, अभी system में थोड़ी दिक्कत आ रही है। मैं team से कहूँगा कि आपको WhatsApp पर options भेज दें।"
- Advanced -> Max wait: 5 seconds

## Backup tool (added 2026-08-28) — inventory_search_backup
- Tools -> Add tool -> duplicate inventory_search EXACTLY (same GET URL,
  same query param, same Auth block/API key, Max wait 5s) but name it
  inventory_search_backup and ENABLE it on the agent.
- Why: prompt v7.5 rule 11 tells the agent, on a failed call, to retry ONCE
  via the backup tool (क), then answer from the `inventory_summary` variable
  (ख), then use the graceful line and CONTINUE qualifying (ग) — and bans
  talking TO the machine ("अरे", "है क्या तू") outright.
- Its "If it fails" = the same graceful Hindi line above.

## on_start hook #1 (lead context)
- GET https://<tunnel>/api/tools/sarvam/lead-context?phone={user_phone_number} (same auth)
- **Sarvam has no literal double-brace caller-phone template.** Insert the
  caller-number variable CHIP from the dashboard's variable picker using
  SINGLE braces (the user_phone_number chip). Double-brace URLs are NOT
  interpolated.

## on_start hook #2 (inventory snapshot — REQUIRED for tool-failure resilience, 2026-08-29)
- New tool (any name, e.g. `inventory_snapshot_loader`):
  GET https://<tunnel>/api/tools/sarvam/inventory-snapshot (no params, same auth)
- **When should this tool run? = On start.** on_start hooks never speak, so
  "If it fails" is not needed here.
- **Save reply into variables:** map reply field `inventory_summary` → agent
  variable `inventory_summary` (exact name; prompt v7.5 rule 11 references it).
- Why: the snapshot is the FULL inventory list (name/city/sector/config/price,
  available units only) loaded at call start. If a mid-call dispatch dies
  (the Sarvam harness bug), rule 11(ख) makes Shubh answer from this list
  instead of saying garbage — e.g. "पुणे" is answerable with ZERO tool calls.

## Tool response contract (backend -> agent), since 2026-08-24
- `coverage` — per-city hit counts from the DB, the ONLY source of truth for
  "do we have anything in <city>?" (e.g. coverage with Noida: 3, Pune: 0)
- `no_results_in` — cities explicitly returning zero results
- `requested_cities` / `filters` — request echo only, NOT availability
- `ask_for` — returned when the query had no usable criteria; the agent asks
  the caller for location/config/budget instead of listing inventory
- `available_locations` — cities the org actually has inventory in (on count-0)

## Debugging broken calls (2026-08-28)
- Turn-level tool-call inputs/outputs/errors = dashboard ONLY (Call Logs ->
  open the call -> Log Analyser -> click the broken turn -> Tool Call card).
  There is NO API for that view.
- The export script now auto-flags calls via the attempts API
  (`has_log_issues` + `failure_reason` are attached to each .skip.json and
  counted in the summary). Run it, then open the flagged interaction IDs in
  Log Analyser for the exact error before escalating to Sarvam.

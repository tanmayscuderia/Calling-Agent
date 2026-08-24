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
- Advanced -> If it fails: "माफ़ कीजिए, अभी check नहीं कर पाई — team WhatsApp पर options भेज देगी। आपका budget कितना है?"
- Advanced -> Max wait: 10 seconds

## on_start hook (lead context)
- GET https://<tunnel>/api/tools/sarvam/lead-context?phone={user_phone_number} (same auth)
- **Sarvam has no literal double-brace caller-phone template.** Insert the
  caller-number variable CHIP from the dashboard's variable picker using
  SINGLE braces (the user_phone_number chip). Double-brace URLs are NOT
  interpolated.

## Tool response contract (backend -> agent), since 2026-08-24
- `coverage` — per-city hit counts from the DB, the ONLY source of truth for
  "do we have anything in <city>?" (e.g. coverage with Noida: 3, Pune: 0)
- `no_results_in` — cities explicitly returning zero results
- `requested_cities` / `filters` — request echo only, NOT availability
- `ask_for` — returned when the query had no usable criteria; the agent asks
  the caller for location/config/budget instead of listing inventory
- `available_locations` — cities the org actually has inventory in (on count-0)

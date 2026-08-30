# Sarvam Tool-Dispatch Failure — Evidence Pack (2026-08-28)

## Symptom
Random ~30-40% of `inventory_search` (API/HTTPS tool, GET) dispatches die
INSIDE the Sarvam platform — the HTTP request never reaches our endpoint.
When it dies:
1. The half-generated turn is spoken: "एक second, मैं check करता हूँ। अरे, है क्या तू?"
2. The tool's configured "If it fails" message NEVER plays (docs say it fires
   "on a timeout or error" — it does not)
3. The call is terminated instantly (`ended_by: AGENT_ENDS`), within ~2s —
   long before the configured Max wait of 5s

This looks like a harness/executor crash, not a timeout.

## It is NOT a per-call tool limit
Interaction `20260828/e99ee615-23:45:47-0315e5ec` made 3+ successful tool
calls in ONE call (18:15:54, 18:16:08, 18:16:28 UTC — all 200s) with zero
failures and a clean wrap-up. Other calls died on their 2nd or 3rd dispatch.
Failures are random, not count-based.

## Broken interactions (final turn = garbage + instant AGENT_ENDS)
| Interaction | UTC start | Died on | Backend log | ngrok edge |
|---|---|---|---|---|
| 20260829/e99ee615-00:14:06-da9161ed | 18:44:06 | turn 6 (Pune) — after 2 OK dispatches (18:44:16, 18:44:29) | no request | no connection |
| 20260828/e99ee615-23:52:23-d59d5a81 | 18:22:23 | turn 4 (Delhi) | no request | no connection |
| 20260828/2dbd7f07-23:51:48-35da340c | 18:21:48 | turn 20 (Noida+Delhi) — after 3 OK dispatches | no request | no connection |
| 20260828/e99ee615-23:51:48-6f7e5fdb | 18:21:48 | turn 4 (Delhi NCR) — after 1 OK dispatch (18:21:56) | no request | no connection |

## Infrastructure verified healthy at failure time
- Endpoint: `https://pumice-craving-outweigh.ngrok-free.dev` (ngrok static
  domain) → localhost:4000 Fastify. Every request that ARRIVES returns 200
  in 100-800ms (proof: `backend/logs/sarvam-tool-calls.log`).
- ngrok inspection API (`127.0.0.1:4040`) shows ZERO connections and ZERO
  errors at each failure instant — the request never left Sarvam.
- Sarvam egress IP 4.213.167.70 is not firewalled — it reaches us fine on
  the successful dispatches seconds earlier in the SAME calls.

## Addendum — dashboard Interaction Details (added 2026-08-29)
- Dashboard link: https://indus.sarvam.ai/samvaad/org/01a006da-56d5-757b-98dd-7f1621a92bd6/workspace/01a006da-56e0-7f17-8cbc-88780002f54b/app/Real-Estate-0d914ebd-1e0d/interaction/20260829/e99ee615-00:14:06-da9161ed
- Sarvam's OWN auto-generated call summary for this interaction:
  "...the agent provided options for Noida and Gurgaon but confirmed no
  availability in Pune, and the call ended abruptly with an unprofessional
  remark from the agent."
  → Sarvam's evaluation pipeline itself detects the abrupt end and the
  garbage remark — yet the attempts API reports has_log_issues=0 and
  failure_reason=NO_FAILURE_REASON for the same interaction. The executor
  does not register its own failure.
- End Reason: AGENT_ENDS | Messages: 7 | Channel: v2v websocket, inbound
- Avg agent response time 2.24s — harness healthy right up to the dead
  dispatch (turn 6, caller asked "पुणे में कुछ है?").

## Addendum 2 — dashboard transcript correlation (added 2026-08-29)
The dashboard transcript for da9161ed records only TWO [Tool] calls. The
final turn (caller: \"पुणे में कुछ है?\") shows the agent's promise line but
NO [Tool] block — Sarvam's own transcript view confirms the third dispatch
never executed. Millisecond correlation with our backend log:

| UTC time | Event | Dashboard | Our backend | ngrok edge |
|---|---|---|---|---|
| 18:44:16.189 | Tool 1 \"properties in New York or Goa\" | [Tool] recorded | GET arrived → 200 in 698ms | ✅ |
| 18:44:29.449 | Tool 2 \"properties in Noida\" | [Tool] recorded | GET arrived → 200 in 76ms | ✅ |
| ~18:44:45 | Turn: \"पुणे में कुछ है?\" → promise spoken | NO [Tool] block | nothing received | nothing |
| 18:44:58 | call end | AGENT_ENDS | — | — |

Conclusion: the LLM generated the tool-promise text, the harness crashed
during/just before the third dispatch — no request, no error, no retry, no
\"If it fails\" fallback, force AGENT_ENDS 13s later. All other dispatches in
the same call succeeded in under 700ms.

## Addendum 3 — single-string-param experiment (added 2026-08-29)
To rule out payload complexity as the trigger, the mid-call tool schema was
reduced to the MINIMUM possible: one agent-filled `query` string parameter
(all static `location` / `budget_min` / `budget_max` / `configuration` rows
deleted from both `inventory_search` and `inventory_search_backup`). Rationale:
- The same tool schema succeeded twice in the da9161ed call before the third
  dispatch died, so a strict-schema validator failure was already unlikely —
  this experiment removes any remaining doubt.
- One string param routes every search through queryParser + the hard city
  gate; the backend continues to accept structured params, so nothing breaks.
Result: ⏳ PENDING — fill in after the next test batch
(`npx tsx scripts/exportSarvamTranscripts.ts --days 1`):
- [ ] dispatch failures ceased → payload shape was a contributing factor
- [ ] dispatch failures PERSIST with a single string param → conclusively a
      Sarvam orchestrator bug, not caller-payload complexity.

## Addendum 4 — clean reproduction with infra proven healthy (added 2026-08-29)
Two calls, 2.5 minutes apart, through the SAME ngrok tunnel, SAME backend
process, SAME tool. One dispatches fine; the next dies inside Sarvam.

| UTC 2026-08-29 | Interaction | Result |
|---|---|---|
| 13:35:14 | `e99ee615-19:05:14-be95ed3d` (17s, USER_ENDS) | Dispatch arrived: `GET /api/tools/sarvam/inventory-search?query=Noida+or+Gurgaon` → **200 in 578ms, count 3** ✅ |
| 13:37:54 | `04ce7d36-19:07:54-e416ab3a` (37s, 9 msgs, **AGENT_ENDS**) | Transcript: caller "नोएडा" → agent "एक second, मैं check करता हूँ। **अरे, है क्या तू?**" → call dead. **ZERO `inventory-search.request` entries in our backend log for this call.** |

Timeline notes:
- 13:34 — tunnel was restarted and verified end-to-end (auth'd snapshot 200
  through the public URL). Backend (tsx, port 4000) continuously healthy.
- 13:37:22 — separate 11s / 1-message aborted dial (`04ce7d36-19:07:22`),
  also AGENT_ENDS, no dispatch.
- The 13:37:54 dispatch would have been a ONE-STRING query payload — so this
  reproduction also pre-empts any "payload complexity" explanation.

Attempts API for 04ce7d36 (both calls): `ended_by: AGENT_ENDS`,
`failure_reason: NO_FAILURE_REASON`, `has_log_issues: 0` — Sarvam's own
telemetry remains blind to the crash AND to the unprofessional remark, while
Sarvam's auto-eval flagged an earlier identical call ("ended abruptly with an
unprofessional remark").

Conclusion: the failure is random, infra-independent, payload-independent,
and repeats. Single root cause candidate left: Sarvam's API-tool executor /
orchestrator loop.

## Questions for Sarvam
1. Is this a known issue with the API-tool executor (dispatch silently dies,
   "If it fails" never triggers, call force-ended with AGENT_ENDS)?
2. Is there a dispatch-retry option for API tools?
3. Any recommended tool config (method/params/auth style) that avoids the
   affected path?

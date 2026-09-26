# AGENTS.md

**Agent instructions for this repo — read `CLAUDE.md` first, then `docs/RULES.md` before touching WhatsApp, Sarvam, or lead/phone code.**

Both files are the law here: every rule in them was a real bug we already shipped and fixed.

Quick gates before you call anything done:
- `cd backend && npx tsc --noEmit && npx vitest run` (370 tests, all must pass)
- Frontend: `npx tsc --noEmit` only — **never** `next build` while `next dev` is running

New features ship as **modules** (`docs/MODULES.md`) — flag-gated per org, next up: Task Management for Employees.

Deep context: `docs/ARCHITECTURE.md` · `docs/MODULES.md` · `docs/META_CLOUD_API.md` · `docs/RULES.md` · `docs/DATABASE.md` · `docs/API_REFERENCE.md`

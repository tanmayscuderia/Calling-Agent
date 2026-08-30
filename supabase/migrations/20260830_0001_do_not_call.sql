-- 20260830_0001 — Do-Not-Call registry (calling-safety guards)
-- start-real refuses to dispatch PSTN calls to numbers listed here (per org).
-- Managed via /api/calls/dnc endpoints; checked in callingGuards.isDncListed().
-- org_id is a plain uuid (matches existing tenant tables — no FK by convention).
create table if not exists do_not_call (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  phone text not null,
  reason text,
  created_at timestamptz not null default now(),
  unique (org_id, phone)
);

create index if not exists idx_do_not_call_org_phone on do_not_call (org_id, phone);

-- Defense-in-depth placeholder: backend uses the service-role key (bypasses
-- RLS), but enabling RLS now means a future anon-key access path is denied
-- by default instead of silently exposed.
alter table do_not_call enable row level security;
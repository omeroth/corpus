-- NPS survey + cadence state. Two changes:
--
-- 1. nps_state on user_progress — jsonb single-object cadence field.
--    Shape: { lastShownAt: 'YYYY-MM-DD', submittedAt: 'YYYY-MM-DD' | null }.
--    Merged prefer-newer on pull (see loadProgressFromSupabase). Server row
--    is a backup for reinstalls; local reads are authoritative on-device.
--    Additive + nullable so this migration is safe to apply before the
--    client that reads/writes it ships.
--
-- 2. nps_responses append-only table for the free-text feedback bodies.
--    RLS locked to the user's own rows in both directions. Team reads via
--    service role (SQL editor / posthog webhook / Loops export). The
--    responses live here rather than on user_progress because they are
--    event-shaped (many rows over time), not state-shaped (one row per
--    user) — putting them on user_progress would conflate the two.
alter table public.user_progress
  add column if not exists nps_state jsonb default '{}'::jsonb;

create table if not exists public.nps_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  score smallint not null check (score between 0 and 10),
  comment text,
  chapter_week_id integer,
  subject text,
  submitted_at timestamptz not null default now()
);

alter table public.nps_responses enable row level security;

create policy "insert own nps" on public.nps_responses
  for insert to authenticated with check (auth.uid() = user_id);

create policy "read own nps" on public.nps_responses
  for select to authenticated using (auth.uid() = user_id);

create index if not exists idx_nps_responses_submitted_at
  on public.nps_responses (submitted_at desc);

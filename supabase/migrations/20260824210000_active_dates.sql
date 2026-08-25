alter table public.user_progress
  add column if not exists active_dates jsonb default '[]'::jsonb;

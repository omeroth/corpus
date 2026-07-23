-- Streak repair support. Two dated-array fields synced onto user_progress.
-- No mutable counters (per architectural rule: union-merge-safe given the
-- unfixed C-3 sync race). Both fields ride the existing user_progress upsert.
--
-- streak_breaks:  each entry records a moment the streak broke, with the
--                 prior streak value so a repair knows what to restore.
--                 Union-merged by brokenAt date.
-- streak_repairs: each entry is an ISO date string on which a repair was
--                 completed. 14-day cooldown enforced by scanning the array
--                 for entries newer than (today - 14 days).

alter table public.user_progress
  add column if not exists streak_breaks jsonb default '[]'::jsonb,
  add column if not exists streak_repairs text[] default '{}';

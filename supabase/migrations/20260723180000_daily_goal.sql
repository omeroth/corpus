-- Daily goal + goal-met celebration support (Item 6). Three dated fields
-- synced onto user_progress. Union-merge-safe per the C-3 architectural
-- rule; no mutable counters that lose signal on write races.
--
-- daily_goal_history:  jsonb array of {setAt, value} entries.
--   Latest by setAt wins for display / gate; older entries preserved so a
--   later "goal changed" analysis has history.
-- completions_by_day:  jsonb map { 'YYYY-MM-DD': integer }.
--   Increments in finishDay; merged max-per-key on load. Approximates
--   the sum without double-counting when both devices have already
--   synced through the same day.
-- goal_met_history:    jsonb array of {metAt, goal, count, bonusXp}.
--   Enforces once-per-day XP-bonus grant via the metAt gate; union-dedup
--   by metAt so a sync race never grants a double bonus.

alter table public.user_progress
  add column if not exists daily_goal_history jsonb default '[]'::jsonb,
  add column if not exists completions_by_day jsonb default '{}'::jsonb,
  add column if not exists goal_met_history   jsonb default '[]'::jsonb;

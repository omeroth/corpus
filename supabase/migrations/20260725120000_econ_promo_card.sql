-- Econ bonus promo card dismissal — dated array riding the existing
-- user_progress upsert alongside daily_goal_history / streak_repairs /
-- goal_met_history. Union-merge-safe per the C-3 architectural rule;
-- entries are objects, dedup by dismissedAt.
--
-- Shape: [{ dismissedAt: 'YYYY-MM-DD' }, ...]
-- Presence + date check against BONUS_ECON_PROMO_START gates visibility
-- of the home-screen promo card. Future promos (new PROMO_START value
-- in index.html) auto-reset because old dismissedAt values won't satisfy
-- the >= check against the new window start.

alter table public.user_progress
  add column if not exists econ_promo_card_dismissed jsonb default '[]'::jsonb;

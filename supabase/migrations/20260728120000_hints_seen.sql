-- Home-screen contextual hints seen-once tracker. Rides the existing
-- user_progress upsert alongside the other dated-array fields
-- (streak_repairs, daily_goal_history, econ_promo_card_dismissed …).
-- Union-merge-safe per the C-3 architectural rule; the string id
-- itself is the dedup key. See _hasHintSeen / _markHintSeen and the
-- HOME_HINTS array in index.html.
--
-- Shape: ['streak', 'next_up', 'xp', 'level', 'chapters',
--        'carousel', 'pantheon_tab', …]

alter table public.user_progress
  add column if not exists hints_seen jsonb default '[]'::jsonb;

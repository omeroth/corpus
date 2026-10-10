-- Coach-mark seen flags. One-time intros (frames explainer, streak-tab
-- intro, etc.) each get a boolean key in this jsonb object. Local
-- (state.framesExplainerSeen, state.streakIntroSeen) wins day-to-day;
-- the server row is the reinstall / cross-device backup. On load:
-- server-true → local-true (OR union); local-true stays local-true.
-- On push: both keys serialized together on every sync so neither can
-- drift. Same shape semantics as onboarding_done / daily_reminder: a
-- backup, not an override.
--
-- Shape: { framesExplainer: boolean, streakIntro: boolean, ... }.
-- Adding a new coach-mark later is a client-side change only — the
-- jsonb object absorbs new keys without a schema touch.

alter table public.user_progress
  add column if not exists coach_marks_shown jsonb not null default '{}'::jsonb;

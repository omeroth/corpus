-- Onboarding v2 answer capture. Holds the user's picks from the
-- growth-funnel onboarding: name, age, phone hours, goal, multi-select
-- Q1/Q2, single-choice Q3, reading-frequency slider, commitment ladder,
-- and completedAt timestamp. Priming-only for now — used for analysis
-- and future personalization; not read at runtime for gating.
--
-- Shape: single jsonb object mirroring state.onbAnswers on the client:
--   {
--     name: string, age: number|null, phoneHours: number|null,
--     q1: string[], q2: string[], q3: string, readingFreq: number|null,
--     commitment: string, completedAt: 'YYYY-MM-DD' | ''
--   }
--
-- Additive + nullable — safe to apply before the client that reads
-- and writes it ships. Sync push/pull merges field-wise, preferring
-- non-empty client values (see loadProgressFromSupabase).
alter table public.user_progress
  add column if not exists onboarding_answers jsonb default '{}'::jsonb;

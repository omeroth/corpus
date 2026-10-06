-- Hour-of-day opening distribution per user. Used by _recordActiveHour
-- (one write per 'YYYY-MM-DD:HH' session slot) and consumed by
-- _pickReminderHour to personalize daily-reminder firing time.
--
-- openings_by_hour: jsonb map { '0'..'23': integer }.
--   Max-per-key on load (same approximation as completions_by_day):
--   cross-device sum is underestimated but the distribution shape (which
--   hour is modal) is preserved, which is all the picker needs.
--
-- Writer ships now; _pickReminderHour is defined but gated by
-- _REMINDER_HOUR_PERSONALIZED = false in the client. Flip the flag once
-- enough distribution data has accrued (~2 weeks) to decide a heuristic.

alter table public.user_progress
  add column if not exists openings_by_hour jsonb default '{}'::jsonb;

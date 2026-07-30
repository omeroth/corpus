-- User's chosen UI language ('he' or 'en'). Written by syncProgressToSupabase
-- alongside the other preference fields (appearance, daily_reminder). The
-- notify_loops_progress trigger's row_to_json(NEW) payload picks this up
-- automatically, so loops-progress can forward it as a `language` contact
-- property in Loops. Nullable on purpose: contacts with no language
-- selected stay null and the Edge Function omits the property rather than
-- sending an empty string (see deriveProgressProps).

alter table public.user_progress
  add column if not exists lang text;

-- Device platform for Loops segmentation. Written by syncProgressToSupabase
-- alongside the other preference fields on every app open, so the value
-- tracks the device actually in use (a user who signs in on Android and
-- later opens on iOS gets 'ios' from that point). Values are 'ios' or
-- 'android' — Capacitor.getPlatform() returns 'web' for the PWA/browser
-- surface, and the client maps 'web' to 'ios' before writing so the Loops
-- segmentation isn't split three ways with a near-empty 'web' bucket.
--
-- The notify_loops_progress trigger's row_to_json(NEW) payload picks this
-- up automatically, so loops-progress can forward it as a `platform`
-- contact property in Loops without any trigger change.
--
-- Nullable on purpose: existing rows stay null until the user next opens
-- the app and syncProgressToSupabase writes the current platform. The
-- loops-progress Edge Function omits the property when the record's
-- platform is null / missing (same treatment as `lang`) so a partial
-- sync doesn't clear a previously-set Loops value.

alter table public.user_progress
  add column if not exists platform text;

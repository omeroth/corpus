-- Mid-chapter-one paywall shown state. Tracks whether the trigger has
-- fired per subject, per dialogue. Keys shape: '{subject}-d{dialogueId}',
-- e.g. 'philosophy-d3', 'economics-d6'. Union-dedup merge on load so a
-- user who dismissed the trigger on their phone doesn't re-see it on
-- their iPad. Stored as a jsonb array (same shape as chapter_complete_shown)
-- for the same cross-device sync semantics.
--
-- Triggers: after completing ch1 dialogue 3 and ch1 dialogue 6, for users
-- without an active subscription and not in a trial. Flag flips at the
-- moment the paywall opens, not at completion time — if the paywall never
-- actually renders, the user gets another chance on the next completion.

alter table public.user_progress
  add column if not exists mid_chapter_paywall_shown jsonb default '[]'::jsonb;

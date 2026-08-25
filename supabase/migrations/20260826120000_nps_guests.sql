-- Open nps_responses to guests via a client-generated device_id.
-- Signed-in users still write user_id (existing 'insert own nps' policy
-- unchanged); guests write user_id null + device_id.
--
-- Abuse mitigation baked in:
--   * user_id and device_id can't both be null (identity_present check)
--   * comment length capped at 2000 chars (spam-body cap)
--   * anon policy requires device_id present when user_id is null
--   * insert-only — no update/delete policies for anon or authenticated
--
-- Row-level rate limiting is intentionally NOT enforced in Postgres.
-- Trigger-based rate limits burn CPU on every insert and can be worked
-- around by rotating client-generated device_ids anyway. Real rate
-- limiting (per-IP, at the network layer) requires a Supabase edge
-- function or upstream proxy — deferred until observed abuse justifies
-- it. For now: comment cap + insert-only + Supabase's built-in per-key
-- rate limits on the anon connection.

alter table public.nps_responses alter column user_id drop not null;
alter table public.nps_responses add column if not exists device_id text;

alter table public.nps_responses
  add constraint nps_responses_identity_present_ck
  check (user_id is not null or device_id is not null);

alter table public.nps_responses
  add constraint nps_responses_comment_length_ck
  check (comment is null or char_length(comment) <= 2000);

create policy "insert anon nps" on public.nps_responses
  for insert to anon
  with check (user_id is null and device_id is not null);

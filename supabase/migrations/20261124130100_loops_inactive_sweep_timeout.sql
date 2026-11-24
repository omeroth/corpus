-- Raise the pg_net client-side timeout on the daily inactive sweep
-- job. Same reasoning as 20261124130000_loops_trial_ending_sweep_
-- timeout.sql:
--   - Default net.http_post timeout is 5 seconds.
--   - loops-inactive-sweep runs a secret-fetch RPC, a user_progress
--     window query, paginated listUsers (1000/page), a Loops PATCH
--     per target with a 100ms sleep between, then a second pass
--     unconditionally refreshing timezone + utcOffset for every row
--     with timezone IS NOT NULL. Easily >> 5s at prod scale.
--   - Today's 09:00 UTC run (pg_net response id 5032) hit the 5s
--     limit per net._http_response.timed_out = true. The edge
--     function side almost certainly completed — Deno keeps running
--     after pg_net closes the tunnel — and the sends are idempotent
--     (Loops treats an identical PATCH as a no-op, re-PATCH next day
--     corrects any drops). But a silent timeout is still a
--     correctness risk as traffic grows, so bring parity with the
--     trial-ending sweep timeout.
--
-- 30 000 ms leaves generous headroom while staying well under the
-- Supabase Edge Functions per-invocation ceiling (150 s).
--
-- Replaces the command via cron.schedule (same jobname swaps the
-- command atomically). alter_job(active := true) preserves the live
-- state set in 20260922090000.
SELECT cron.alter_job(
  (SELECT cron.schedule(
    'loops-inactive-sweep-daily',
    '0 9 * * *',
    $body$
    SELECT net.http_post(
      url                 := 'https://xcoikjoatcrjqxzykwlt.supabase.co/functions/v1/loops-inactive-sweep',
      headers             := jsonb_build_object(
        'Content-Type',           'application/json',
        'X-Loops-Webhook-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'loops_webhook_secret' LIMIT 1)
      ),
      body                := '{}'::jsonb,
      timeout_milliseconds := 30000
    );
    $body$
  )),
  active := true
);

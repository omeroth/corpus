-- Raise the pg_net client-side timeout on the hourly trial-ending
-- sweep job. The default net.http_post timeout is 5 seconds; the
-- edge function's cold-start + webhook-secret RPC + candidate query
-- + PATCH/POST/stamp fanout can exceed that under real load, and
-- pg_net records the attempt as timed_out with no retry.
--
-- 30 000 ms leaves generous headroom while staying well under the
-- Supabase Edge Functions per-invocation ceiling (150 s). The actual
-- function logic still has its own per-row sleeps (100ms between
-- Loops PATCHes) so 30s accommodates ~250 PATCHes per tick before
-- it'd matter; the sweep pattern is hourly so backlogs that large
-- never accumulate.
--
-- cron.alter_job doesn't take a command-only update in older pg_cron
-- versions; re-running cron.schedule with the same jobname replaces
-- the schedule + command atomically. active state is preserved from
-- the existing job row. Guarded with alter_job(active := true) at
-- the tail so re-applies don't regress the live-prod state set in
-- 20261124120200 + the subsequent dashboard enable.
SELECT cron.alter_job(
  (SELECT cron.schedule(
    'loops-trial-ending-sweep-hourly',
    '0 * * * *',
    $body$
    SELECT net.http_post(
      url                 := 'https://xcoikjoatcrjqxzykwlt.supabase.co/functions/v1/loops-trial-ending-sweep',
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

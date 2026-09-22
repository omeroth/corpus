-- Loops inactive-sweep daily schedule
--
-- Schedules a daily pg_cron job that PATCHes the loops-inactive-sweep
-- edge function, which in turn flips inactive7d / inactive14d = true on
-- Loops for users who have crossed the corresponding thresholds. See
-- supabase/functions/loops-inactive-sweep/index.ts for the sweep logic.
--
-- Time: 09:00 UTC every day. Lands as 5am US East, 2am US West,
-- 11am Israel, 10am UK — good baseline for a marketing email to land
-- in a morning inbox regardless of timezone.
--
-- Wide-window design (7-to-60 days, not one-day-crossing): matches the
-- edge function's own window. A missed run corrects itself the next
-- day because Loops treats an identical PATCH as a no-op — no
-- re-trigger of the workflow, no over-sending. See the block comment
-- at the top of loops-inactive-sweep for the full rationale.
--
-- Auth: the scheduled body reads the same loops_webhook_secret Vault
-- entry the sibling Loops functions authenticate against. Rotating
-- that one row rotates auth for all four functions at once.
--
-- To pause without deleting: `SELECT cron.unschedule('loops-inactive-
-- sweep-daily');` — or flip the enabled bit via
-- `UPDATE cron.job SET active = false WHERE jobname = 'loops-inactive-
-- sweep-daily';`.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Idempotent: unschedule before schedule so a re-apply is a clean swap
-- rather than a duplicate job (cron.schedule doesn't ON CONFLICT).
DO $$
BEGIN
  PERFORM cron.unschedule('loops-inactive-sweep-daily');
EXCEPTION WHEN OTHERS THEN
  -- unschedule throws if the job doesn't exist yet (first-time apply);
  -- swallowing here keeps the migration re-runnable.
  NULL;
END $$;

SELECT cron.schedule(
  'loops-inactive-sweep-daily',
  '0 9 * * *',
  $body$
  SELECT net.http_post(
    url     := 'https://xcoikjoatcrjqxzykwlt.supabase.co/functions/v1/loops-inactive-sweep',
    headers := jsonb_build_object(
      'Content-Type',           'application/json',
      'X-Loops-Webhook-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'loops_webhook_secret' LIMIT 1)
    ),
    body    := '{}'::jsonb
  );
  $body$
);

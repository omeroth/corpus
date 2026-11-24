-- Loops trial-ending-sweep hourly schedule
--
-- Hourly pg_cron job that POSTs the loops-trial-ending-sweep edge
-- function, which finds trials ending 36-60h from now and fires the
-- "trial_ending" Loops event (~48h-before reminder email).
--
-- Why hourly (vs daily like loops-inactive-sweep): the window is only
-- 24h wide, centered on 48h-to-expiry. A daily job would hit each
-- trial exactly once at an unpredictable offset inside that window —
-- fine in aggregate, but means a user whose trial converts at 02:00
-- local gets the reminder anywhere from 22h to 46h before conversion
-- depending on when the job fires. Hourly lands every user in a
-- predictable 36-60h band, with the dedup column (migration
-- 20261124120100) guaranteeing one send per trial.
--
-- Auth: same loops_webhook_secret Vault entry the sibling Loops
-- functions use. One rotation covers all five sweeps / webhooks.
--
-- To pause without deleting: `SELECT cron.unschedule('loops-trial-
-- ending-sweep-hourly');` — or flip the enabled bit via
-- `UPDATE cron.job SET active = false WHERE jobname = 'loops-trial-
-- ending-sweep-hourly';`.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
BEGIN
  PERFORM cron.unschedule('loops-trial-ending-sweep-hourly');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Ships DISABLED. `cron.schedule` creates jobs with active=true by
-- default and the supabase migration role can't UPDATE cron.job
-- directly (permission denied for table job), so we chain into
-- `cron.alter_job` which goes through pg_cron's SECURITY DEFINER
-- function and does carry the needed permissions. The schedule is
-- captured, the row exists, but the dispatcher won't tick it until
-- a human flips active = true from the SQL console.
--
-- Enable after the dry-run output has been reviewed and the Loops
-- "trial_ending" workflow is wired on the Loops side:
--   SELECT cron.alter_job(
--     (SELECT jobid FROM cron.job WHERE jobname = 'loops-trial-ending-sweep-hourly'),
--     active := true
--   );
SELECT cron.alter_job(
  (SELECT cron.schedule(
    'loops-trial-ending-sweep-hourly',
    '0 * * * *',
    $body$
    SELECT net.http_post(
      url     := 'https://xcoikjoatcrjqxzykwlt.supabase.co/functions/v1/loops-trial-ending-sweep',
      headers := jsonb_build_object(
        'Content-Type',           'application/json',
        'X-Loops-Webhook-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'loops_webhook_secret' LIMIT 1)
      ),
      body    := '{}'::jsonb
    );
    $body$
  )),
  active := false
);

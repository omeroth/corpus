-- Bypass the 30s notify_loops_progress debounce when the row has
-- onboarding_done=true AND loops_onb_plan_sent_at IS NULL — i.e. the
-- Edge Function has NOT yet sent the one-shot "onboarding_completed"
-- plan email for this user.
--
-- Why: onboarding_done flips at _onbComplete() in the client, which
-- can land less than 30s after the step-37 source-tap sync that
-- stamped loops_last_synced_at. Without a bypass, the debounce
-- swallows the update and the plan email waits until the user's
-- next activity ping (possibly hours or days later). The whole
-- point of the "onboarding_completed" event is to fire immediately
-- on completion.
--
-- Safety: the bypass is gated on loops_onb_plan_sent_at IS NULL, so
-- it fires at most once per user. After the Edge Function stamps
-- the column, subsequent progress updates fall back through the
-- normal debounce path.
CREATE OR REPLACE FUNCTION public.notify_loops_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault, auth
AS $$
DECLARE
  webhook_url    text := 'https://xcoikjoatcrjqxzykwlt.supabase.co/functions/v1/loops-progress';
  webhook_secret text;
  v_email        text;
  v_bypass_debounce boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.last_active_at IS NOT DISTINCT FROM OLD.last_active_at THEN
    RETURN NEW;
  END IF;
  IF NEW.last_active_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- One-shot bypass for the onboarding plan email. See migration header.
  IF NEW.onboarding_done = true AND NEW.loops_onb_plan_sent_at IS NULL THEN
    v_bypass_debounce := true;
  END IF;

  IF NOT v_bypass_debounce
     AND NEW.loops_last_synced_at IS NOT NULL
     AND NEW.loops_last_synced_at > NOW() - INTERVAL '30 seconds' THEN
    RETURN NEW;
  END IF;

  SELECT decrypted_secret
    INTO webhook_secret
    FROM vault.decrypted_secrets
    WHERE name = 'loops_webhook_secret'
    LIMIT 1;
  IF webhook_secret IS NULL THEN
    RAISE WARNING '[notify_loops_progress] loops_webhook_secret missing from Vault; skipping';
    RETURN NEW;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id LIMIT 1;
  IF v_email IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url     := webhook_url,
    headers := jsonb_build_object(
      'Content-Type',           'application/json',
      'X-Loops-Webhook-Secret', webhook_secret
    ),
    body    := jsonb_build_object(
      'type',       TG_OP,
      'schema',     'public',
      'table',      'user_progress',
      'email',      v_email,
      'record',     row_to_json(NEW),
      'old_record', CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END
    )
  );

  UPDATE public.user_progress
     SET loops_last_synced_at = NOW()
   WHERE user_id = NEW.user_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[notify_loops_progress] failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

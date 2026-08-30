-- Subscriptions: RevenueCat-backed source of truth for paid entitlement.
--
-- The current table (id/user_id/status/current_period_end/lemon_squeezy_
-- subscription_id/created_at/updated_at) is empty in prod and predates
-- both the migrations repo and the switch to RevenueCat. Drop and
-- recreate clean rather than widening — no data at risk, no legacy
-- column to explain.
--
-- FK on user_id → auth.users(id) ON DELETE CASCADE means account
-- deletion cleans up the entitlement row automatically. Manual delete
-- calls in delete-account (edge function + client) are now redundant
-- and can be removed in a follow-up commit.
--
-- No grandfathering INSERT here — that runs later, gated on the actual
-- launch commit timestamp.

DROP TABLE IF EXISTS public.subscriptions CASCADE;

CREATE TABLE public.subscriptions (
  -- One row per user. No surrogate id; user_id IS the primary key.
  user_id                 uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Which entitlement this row grants. Single tier today ('paid'); the
  -- CHECK below widens easily if we add 'plus' or 'pro' later.
  entitlement             text NOT NULL DEFAULT 'paid',

  -- RevenueCat-sourced identifiers. Nullable for grandfathered rows,
  -- which have no store transaction.
  product_id              text,                              -- 'corpus_monthly' | 'corpus_yearly'
  platform                text,                              -- 'ios' | 'android' | 'grandfathered'
  store_transaction_id    text,                              -- original_transaction_id (iOS) / purchase_token (Android)

  -- Lifecycle. Gating check is status IN ('active','trial','grace_period').
  status                  text NOT NULL DEFAULT 'active',

  -- Access window. NULL means non-expiring (grandfathered — uses infinity).
  current_period_end      timestamptz,

  -- Non-null while the 7-day free trial is running. Powers "trial ends in N days" UI.
  trial_end               timestamptz,

  -- False when the user has canceled but the period hasn't ended yet.
  -- Powers "your subscription ends on X" UI.
  will_renew              boolean NOT NULL DEFAULT false,

  -- When the user first became paid (across restores + plan switches).
  -- RevenueCat sources this. Useful for LTV analytics and "member since" UI.
  originally_purchased_at timestamptz,

  -- Auto-touched by the trigger below. Useful for debugging webhook lag.
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- Latest RevenueCat webhook payload. THIRD-PARTY PAYMENT DATA:
  -- contains store transaction identifiers and — depending on RC's
  -- event shape — the subscriber's email. Stored indefinitely today
  -- as a debugging convenience during integration bring-up. Two things
  -- to do once the write path is stable:
  --   1. Have the webhook whitelist only the fields we actually use
  --      for debugging (event.type, event.id, entitlement_ids, product
  --      identifier, environment, timestamps) rather than persisting
  --      the full payload.
  --   2. Add a scheduled prune (e.g., pg_cron nightly) that nulls this
  --      column for rows older than 30 days, or drop the column
  --      entirely once we no longer need it.
  raw_event               jsonb,

  CONSTRAINT subscriptions_platform_check
    CHECK (platform IS NULL OR platform IN ('ios', 'android', 'grandfathered')),
  CONSTRAINT subscriptions_status_check
    CHECK (status IN ('active', 'trial', 'grace_period', 'billing_retry', 'canceled', 'expired', 'refunded')),
  CONSTRAINT subscriptions_entitlement_check
    CHECK (entitlement IN ('paid'))
);

-- Auto-touch updated_at on every UPDATE so webhook lag / write-path
-- debugging is easy from the row alone.
CREATE OR REPLACE FUNCTION public._subscriptions_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_touch_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public._subscriptions_touch_updated_at();

-- RLS. Client reads own row only. Writes come exclusively from the
-- RevenueCat webhook edge function via service_role, which bypasses RLS.
-- No INSERT/UPDATE/DELETE policies for authenticated users — webhooks
-- are the sole writer, and account-delete cleanup runs through the FK
-- CASCADE above rather than a client-issued DELETE.
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Grandfathering: give every user who existed before the paid-tier
-- launch a non-expiring 'grandfathered' entitlement so their previously
-- accessible content stays accessible when the paywall gate ships.
--
-- Cutoff: 2026-09-01 19:59:49+03:00 — the commit timestamp of 4a6a7ff
-- (mark-live tooling), the last commit before the release build carrying
-- the paywall gate. Anyone signed up strictly before this instant is
-- grandfathered; anyone signing up during or after the release rollout
-- is a fresh user and follows the normal free-tier / subscription flow.
--
-- Rows use the shape the loadSubscription reader expects for a
-- grandfathered account (see index.html loadSubscription):
--   platform                = 'grandfathered'     — flips state.grandfathered = true
--   status                  = 'active'            — passes the goodStatus check
--   current_period_end      = 'infinity'          — non-expiring; the JS reader
--                                                   also has an explicit
--                                                   state.grandfathered fallback
--   originally_purchased_at = auth.users.created_at
--                                                — useful for "member since"
--                                                   analytics; harmless if unread
--   entitlement             = 'paid'              — the sole tier today
--   product_id, store_transaction_id, trial_end, will_renew, raw_event
--                                                = default (NULL / false) —
--                                                   there is no store txn
--
-- Idempotency: subscriptions was DROP+CREATE'd in
-- 20260830120000_subscriptions.sql and is empty in prod, so this
-- migration INSERTs cleanly. The ON CONFLICT (user_id) DO NOTHING
-- clause is defensive against re-runs — e.g. resetting a staging DB
-- from this migration set with fixture data pre-loaded, or accidentally
-- re-applying the migration after a real user's RC webhook already
-- wrote their row. Grandfathered rows would then simply not overwrite
-- real subscription state.
--
-- WARNING: this migration MUST run against prod before either App Store
-- or Play review begins on any build containing the paywall gate. If
-- the build ships first, every pre-paywall user loses access to
-- chapter 2+ content they previously had free.

INSERT INTO public.subscriptions
  (user_id, entitlement, platform, status,
   current_period_end, originally_purchased_at)
SELECT
  id,
  'paid',
  'grandfathered',
  'active',
  'infinity'::timestamptz,
  created_at
FROM auth.users
WHERE created_at < '2026-09-01T19:59:49+03:00'::timestamptz
ON CONFLICT (user_id) DO NOTHING;

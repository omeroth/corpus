-- Reverses 20260901170000_grandfathering.sql. Post-launch product
-- decision: nobody keeps free access under the paywall, including the
-- pre-launch cohort of 122 users the launch migration granted.
--
-- Deletes every subscriptions row created by the launch INSERT
-- (identified by platform = 'grandfathered'). Expected row count at
-- migration authoring time: 122. The RAISE NOTICE below emits the
-- actual count at apply time as a checkpoint — if the number looks
-- wrong, abort the push before the DELETE runs.
--
-- Client-side impact: loadSubscription sees no subscriptions row for
-- these users → state.grandfathered stays false → canAccessWeek falls
-- through to the normal paywall path. The still-accessible surface is
-- chapter 1 (free tier) plus any chapter with a started day (the
-- started-this-chapter clause in canAccessWeek). No client code
-- change is required — state.grandfathered simply never becomes true
-- for anyone in this cohort again.
--
-- Scope note: admin-granted PROMOTIONAL / TEMPORARY_ENTITLEMENT_GRANT
-- transactions from the RC webhook still land as platform='grandfathered'
-- (see supabase/functions/revenuecat-webhook/index.ts around lines 101
-- and 206). That's a separate mechanism — deliberate per-user comps
-- issued from the RC dashboard for support cases — and is intentionally
-- left intact by this migration. Only the launch-day cohort is removed.

DO $$
DECLARE _n int;
BEGIN
  SELECT count(*) INTO _n FROM public.subscriptions WHERE platform = 'grandfathered';
  RAISE NOTICE 'remove_grandfathering: deleting % row(s) (expected 122)', _n;
END $$;

DELETE FROM public.subscriptions WHERE platform = 'grandfathered';

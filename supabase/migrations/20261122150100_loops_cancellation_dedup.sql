-- subscriptions.loops_trial_cancelled_sent_at — timestamp of the most
--   recent "trial_cancelled" Loops event fired for this user. NULL
--   means never sent. revenuecat-webhook refuses to fire the event
--   again if the stored value is within the last 30 days.
-- subscriptions.loops_subscription_cancelled_sent_at — same shape for
--   "subscription_cancelled".
--
-- Why 30 days: a user can uncancel then re-cancel within a billing
-- cycle. Without dedup each re-cancel would re-send the email, which
-- reads as a mis-wired automation. The 30-day window is a safe cap
-- for the typical trial length + a normal billing period.
--
-- Why two separate columns (vs a single "last_loops_cancel_event_at"
-- + an event-name column): a user could legitimately go through BOTH
-- events in one 30-day window (cancel a trial, then re-subscribe,
-- then cancel the paid sub). Separate columns let each event's dedup
-- fire independently.
alter table public.subscriptions
  add column if not exists loops_trial_cancelled_sent_at timestamptz;
alter table public.subscriptions
  add column if not exists loops_subscription_cancelled_sent_at timestamptz;

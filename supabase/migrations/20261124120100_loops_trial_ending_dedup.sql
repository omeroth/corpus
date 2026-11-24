-- subscriptions.loops_trial_ending_sent_at — timestamp stamped by
-- loops-trial-ending-sweep after it successfully fires the Loops
-- "trial_ending" event (the reminder email sent ~48h before a free
-- trial converts to paid). NULL means "never sent".
--
-- Why a dedup column (vs trusting Loops' own event throttling): the
-- sweep runs every hour and the candidate window is 36-60h-to-expiry
-- (24h of overlap with itself). Without a per-row stamp, each
-- qualifying trial would re-enter the candidate set every hour until
-- the trial_end moved outside the window, and we'd fire the event 24
-- times per user. Loops' workflow dedup saves the user from 24
-- emails but we'd still PATCH the contact 24 times, breaking the
-- dedup-count metric that tells us the sweep is working.
--
-- Stamped AFTER /events/send returns 2xx. A failure leaves the stamp
-- null and the next sweep retries, same pattern as the two
-- cancellation dedup columns (see 20261122150100_loops_cancellation_
-- dedup.sql). No upper limit on retry attempts at the stamp layer —
-- the candidate window narrowing past 36h is the natural stop.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS loops_trial_ending_sent_at timestamptz;

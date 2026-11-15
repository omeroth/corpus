#!/usr/bin/env node
/**
 * loops-reengage-3d.mjs
 * Daily job: find users who JUST crossed 3 days of inactivity in PostHog
 * and fire a Loops event ("inactive3d") so a Loops workflow sends the win-back email.
 */

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return def;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : true;
};

const DRY = args.includes("--dry-run");
const DAYS = Number(flag("days", 3));
const WINDOW = Number(flag("window", 1));
const MIN_EVENTS = Number(flag("min-events", 3));
const EVENT_NAME = String(flag("event-name", "inactive3d"));
const LOOKBACK = Number(flag("lookback", 45));

const PH_KEY = process.env.POSTHOG_API_KEY;
const PH_PROJECT = process.env.POSTHOG_PROJECT;
const PH_HOST = (process.env.POSTHOG_HOST || "https://us.posthog.com").replace(/\/$/, "");
const LOOPS_KEY = process.env.LOOPS_API_KEY;

if (!PH_KEY || !PH_PROJECT) {
  console.error("Missing POSTHOG_API_KEY or POSTHOG_PROJECT");
  process.exit(1);
}
if (!DRY && !LOOPS_KEY) {
  console.error("Missing LOOPS_API_KEY (or pass --dry-run)");
  process.exit(1);
}

const hogql = `
SELECT
  person.properties.email AS email,
  max(timestamp) AS last_seen,
  count() AS lifetime_events
FROM events
WHERE timestamp > now() - INTERVAL ${LOOKBACK} DAY
  AND person.properties.email != ''
  AND person.properties.email IS NOT NULL
GROUP BY email
HAVING last_seen < now() - INTERVAL ${DAYS} DAY
   AND last_seen >= now() - INTERVAL ${DAYS + WINDOW} DAY
   AND lifetime_events >= ${MIN_EVENTS}
ORDER BY last_seen DESC
`.trim();

async function queryPostHog() {
  const res = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PH_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query: hogql } }),
  });
  if (!res.ok) throw new Error(`PostHog ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.results || []).map((r) => ({ email: r[0], lastSeen: r[1], events: r[2] }));
}

async function fireLoopsEvent(email) {
  const res = await fetch("https://app.loops.so/api/v1/events/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOOPS_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, eventName: EVENT_NAME }),
  });
  if (!res.ok) throw new Error(`Loops ${res.status}: ${await res.text()}`);
  return res.json();
}

(async () => {
  console.log(`Scanning PostHog: inactive ${DAYS}-${DAYS + WINDOW}d, >=${MIN_EVENTS} events, lookback ${LOOKBACK}d`);
  const users = await queryPostHog();
  console.log(`Matched ${users.length} user(s).`);
  let sent = 0, failed = 0;
  for (const u of users) {
    if (DRY) { console.log(`DRY  ${u.email}  last_seen=${u.lastSeen}  events=${u.events}`); continue; }
    try { await fireLoopsEvent(u.email); sent++; console.log(`SENT ${EVENT_NAME} -> ${u.email}`); }
    catch (e) { failed++; console.error(`FAIL ${u.email}: ${e.message}`); }
  }
  if (!DRY) console.log(`Done. sent=${sent} failed=${failed}`);
})().catch((e) => { console.error(e); process.exit(1); });

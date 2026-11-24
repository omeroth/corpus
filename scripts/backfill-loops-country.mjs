#!/usr/bin/env node
// One-shot: resolve a `country` (ISO-3166-1 alpha-2) for every user,
// cache it on user_progress.country, and PATCH it as the `country`
// property on their Loops contact.
//
// Cascade per user, first match wins; the source is reported in the
// dry-run output:
//   1. PostHog person.properties.$geoip_country_code         → "posthog"
//   2. PostHog person.properties.$initial_geoip_country_code → "posthog"
//   3. user_progress.timezone (static IANA-zone → country map)→ "timezone"
//   4. user_progress.lang = 'he'                             → "lang"
//   5. unresolved                                            → "none"
//
// Dry-run (default): read PostHog + compute cascade for every user,
// print per-source + per-country tallies, touch NOTHING. No emails,
// no ids, no country-per-user list.
//
// Live run (--live): same scan, then (a) UPDATE user_progress.country
// with the resolved value (sticky cache for loops-progress) and (b)
// PATCH /contacts/update on Loops with { email, country }. Users
// whose cascade resolves to "none" are skipped on both legs — we
// never PATCH null (Loops would clear). Loops' /contacts/update is
// idempotent, so re-runs are no-ops.
//
// Usage:
//   /tmp/_audit_keys should carry POSTHOG_PERSONAL_API_KEY on its
//   own line (optionally prefixed with "POSTHOG_PERSONAL_API_KEY=").
//   The script reads it, never prints it, never writes it anywhere.
//
//   export SUPABASE_URL='https://xcoikjoatcrjqxzykwlt.supabase.co'
//   export SUPABASE_SERVICE_ROLE_KEY='…'
//   export LOOPS_API_KEY='…'                     # live only; dry skips
//   node scripts/backfill-loops-country.mjs      # dry
//   node scripts/backfill-loops-country.mjs --live

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, '').trim();
  }
}
loadDotEnv();

// Read a named key from /tmp/_audit_keys. Each line is either
// `KEY=value` or a bare value (treated as the first-match for whichever
// name the caller requests, kept for the previous single-key file
// shape). Comments (#) and quotes stripped. Never printed.
function readAuditKey(name) {
  const keyFile = '/tmp/_audit_keys';
  if (!fs.existsSync(keyFile)) return null;
  let bareFallback = null;
  for (const raw of fs.readFileSync(keyFile, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const kv = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (kv) {
      if (kv[1] === name) return kv[2].replace(/^["']|["']$/g, '').trim();
      continue;
    }
    if (!bareFallback) bareFallback = line.replace(/^["']|["']$/g, '').trim();
  }
  return bareFallback;
}

const SUPABASE_URL              = process.env.SUPABASE_URL
                                || 'https://xcoikjoatcrjqxzykwlt.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
                                || readAuditKey('SUPABASE_SERVICE_ROLE_KEY');
const LOOPS_API_KEY             = process.env.LOOPS_API_KEY
                                || readAuditKey('LOOPS_API_KEY');
const POSTHOG_PERSONAL_API_KEY  = readAuditKey('POSTHOG_PERSONAL_API_KEY');
const LIVE                      = process.argv.includes('--live');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[backfill-country] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!POSTHOG_PERSONAL_API_KEY) {
  console.error('[backfill-country] /tmp/_audit_keys missing or empty — write POSTHOG_PERSONAL_API_KEY there first');
  process.exit(1);
}
if (LIVE && !LOOPS_API_KEY) {
  console.error('[backfill-country] --live requires LOOPS_API_KEY (dry-run does not)');
  process.exit(1);
}

const POSTHOG_HOST       = 'https://us.posthog.com';
const POSTHOG_PROJECT_ID = 388655;   // same value delete-account uses

const admin = {
  apikey:        SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
};

// ── Static IANA timezone → country map ───────────────────────────────
// Only unambiguous zones. Anything missing falls through to step 4/5
// of the cascade. Keep in lockstep with the same table in
// supabase/functions/loops-progress/index.ts.
const TZ_COUNTRY = {
  // Asia
  'Asia/Jerusalem': 'IL',
  'Asia/Tel_Aviv':  'IL',
  'Asia/Tokyo':     'JP',
  'Asia/Seoul':     'KR',
  'Asia/Shanghai':  'CN',
  'Asia/Hong_Kong': 'HK',
  'Asia/Singapore': 'SG',
  'Asia/Bangkok':   'TH',
  'Asia/Jakarta':   'ID',
  'Asia/Kolkata':   'IN',
  'Asia/Calcutta':  'IN',
  'Asia/Karachi':   'PK',
  'Asia/Dhaka':     'BD',
  'Asia/Manila':    'PH',
  'Asia/Ho_Chi_Minh': 'VN',
  'Asia/Taipei':    'TW',
  'Asia/Kuala_Lumpur': 'MY',
  'Asia/Dubai':     'AE',
  'Asia/Riyadh':    'SA',
  'Asia/Qatar':     'QA',
  'Asia/Kuwait':    'KW',
  'Asia/Tehran':    'IR',
  // Europe
  'Europe/London':     'GB',
  'Europe/Berlin':     'DE',
  'Europe/Paris':      'FR',
  'Europe/Madrid':     'ES',
  'Europe/Rome':       'IT',
  'Europe/Amsterdam':  'NL',
  'Europe/Zurich':     'CH',
  'Europe/Vienna':     'AT',
  'Europe/Brussels':   'BE',
  'Europe/Stockholm':  'SE',
  'Europe/Copenhagen': 'DK',
  'Europe/Helsinki':   'FI',
  'Europe/Oslo':       'NO',
  'Europe/Warsaw':     'PL',
  'Europe/Prague':     'CZ',
  'Europe/Budapest':   'HU',
  'Europe/Dublin':     'IE',
  'Europe/Lisbon':     'PT',
  'Europe/Athens':     'GR',
  'Europe/Moscow':     'RU',
  'Europe/Istanbul':   'TR',
  'Europe/Kiev':       'UA',
  'Europe/Kyiv':       'UA',
  'Europe/Bucharest':  'RO',
  'Europe/Sofia':      'BG',
  // Africa
  'Africa/Johannesburg': 'ZA',
  'Africa/Cairo':        'EG',
  'Africa/Lagos':        'NG',
  'Africa/Nairobi':      'KE',
  'Africa/Casablanca':   'MA',
  'Africa/Algiers':      'DZ',
  'Africa/Tunis':        'TN',
  'Africa/Accra':        'GH',
  // Americas — US
  'America/New_York':    'US',
  'America/Chicago':     'US',
  'America/Denver':      'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix':     'US',
  'America/Anchorage':   'US',
  'America/Detroit':     'US',
  'America/Indianapolis':'US',
  'America/Indiana/Indianapolis':'US',
  'Pacific/Honolulu':    'US',
  // Americas — CA
  'America/Toronto':     'CA',
  'America/Vancouver':   'CA',
  'America/Montreal':    'CA',
  'America/Edmonton':    'CA',
  'America/Winnipeg':    'CA',
  'America/Halifax':     'CA',
  // Americas — LatAm
  'America/Mexico_City': 'MX',
  'America/Sao_Paulo':   'BR',
  'America/Buenos_Aires':'AR',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Santiago':    'CL',
  'America/Bogota':      'CO',
  'America/Lima':        'PE',
  'America/Caracas':     'VE',
  // Oceania
  'Australia/Sydney':    'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane':  'AU',
  'Australia/Perth':     'AU',
  'Australia/Adelaide':  'AU',
  'Australia/Darwin':    'AU',
  'Australia/Hobart':    'AU',
  'Pacific/Auckland':    'NZ',
};

function countryFromTimezone(tz) {
  if (!tz) return null;
  return TZ_COUNTRY[tz] || null;
}
function countryFromLang(lang) {
  return lang === 'he' ? 'IL' : null;
}
function normalizeCountry(code) {
  if (typeof code !== 'string') return null;
  const c = code.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) ? c : null;
}
function resolveCountry({ posthogProps, timezone, lang }) {
  if (posthogProps) {
    const a = normalizeCountry(posthogProps.$geoip_country_code);
    if (a) return { country: a, source: 'posthog' };
    const b = normalizeCountry(posthogProps.$initial_geoip_country_code);
    if (b) return { country: b, source: 'posthog' };
  }
  const tz = normalizeCountry(countryFromTimezone(timezone));
  if (tz) return { country: tz, source: 'timezone' };
  const lg = normalizeCountry(countryFromLang(lang));
  if (lg) return { country: lg, source: 'lang' };
  return { country: null, source: 'none' };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── PostHog person lookup ────────────────────────────────────────────
async function fetchPosthogPersonProps(userId) {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/persons/?distinct_id=${encodeURIComponent(userId)}`;
  let attempt = 0;
  while (attempt < 2) {
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}` },
      });
      if (res.ok) {
        const body = await res.json();
        const person = body?.results?.[0];
        if (!person) return { notFound: true };
        return { notFound: false, properties: person.properties || {} };
      }
      if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
        await sleep(1500); attempt += 1; continue;
      }
      return { error: `ph ${res.status}` };
    } catch (e) {
      if (attempt === 0) { await sleep(1500); attempt += 1; continue; }
      return { error: String(e).slice(0, 120) };
    }
  }
  return { error: 'retries exhausted' };
}

// ── Load user_progress + emails ──────────────────────────────────────
async function loadUserProgress() {
  // Dry-run tolerates a missing `country` column (migration not yet
  // applied) so the first scan can happen before the schema change
  // lands. If the column exists it's picked up; otherwise the
  // fast-path in the loop is simply never triggered.
  const base = 'user_id,timezone,lang';
  async function tryCols(cols) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_progress?select=${cols}`, { headers: admin });
    if (!res.ok) throw new Error(`user_progress fetch ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return await res.json();
  }
  try { return await tryCols(base + ',country'); }
  catch (_) { return await tryCols(base); }
}
async function loadEmails() {
  const emailById = new Map();
  const PER_PAGE = 1000;
  for (let page = 1; ; page += 1) {
    const url = `${SUPABASE_URL}/auth/v1/admin/users?per_page=${PER_PAGE}&page=${page}`;
    const res = await fetch(url, { headers: admin });
    if (!res.ok) throw new Error(`admin/users ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = await res.json();
    const batch = body.users || [];
    for (const u of batch) { if (u.id && u.email) emailById.set(u.id, u.email); }
    if (batch.length < PER_PAGE) break;
  }
  return emailById;
}

// ── Loops PATCH + Supabase UPDATE (live only) ────────────────────────
const LOOPS_UPDATE_URL = 'https://app.loops.so/api/v1/contacts/update';

async function loopsPatch(email, country) {
  let attempt = 0;
  while (attempt < 2) {
    try {
      const res = await fetch(LOOPS_UPDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${LOOPS_API_KEY}` },
        body: JSON.stringify({ email, country }),
      });
      if (res.ok) return { ok: true };
      if (attempt === 0 && (res.status === 429 || res.status >= 500)) { await sleep(1500); attempt += 1; continue; }
      const t = (await res.text()).slice(0, 200);
      return { ok: false, status: res.status, error: t };
    } catch (e) {
      if (attempt === 0) { await sleep(1500); attempt += 1; continue; }
      return { ok: false, status: 0, error: String(e).slice(0, 120) };
    }
  }
  return { ok: false, status: 0, error: 'retries exhausted' };
}
async function supabaseStickyWrite(userId, country) {
  const url = `${SUPABASE_URL}/rest/v1/user_progress?user_id=eq.${encodeURIComponent(userId)}`;
  const res = await fetch(url, {
    method:  'PATCH',
    headers: { ...admin, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body:    JSON.stringify({ country }),
  });
  return res.ok ? { ok: true } : { ok: false, status: res.status };
}

// ── Main ─────────────────────────────────────────────────────────────
const progressRows = await loadUserProgress();
const emailById    = await loadEmails();

const totals = {
  users:         progressRows.length,
  ph_queried:    0,
  ph_found:      0,
  ph_notfound:   0,
  ph_error:      0,
  resolved:      0,
  by_source:     { posthog: 0, timezone: 0, lang: 0, none: 0 },
  by_country:    {},   // { [alpha2]: { posthog, timezone, lang } }
  live_patched:  0,
  live_failed:   0,
  live_skipped_no_email: 0,
  live_skipped_already_cached: 0,
};

function bumpCountry(code, source) {
  if (!code) return;
  const row = totals.by_country[code] || (totals.by_country[code] = { posthog: 0, timezone: 0, lang: 0 });
  row[source] += 1;
}

let i = 0;
for (const r of progressRows) {
  i += 1;
  // Fast path: user_progress.country already cached.
  if (r.country) {
    totals.resolved += 1;
    totals.by_source.posthog += 0;   // not re-attributed; counted as "already cached"
    totals.live_skipped_already_cached += (LIVE ? 1 : 0);
    const normalized = normalizeCountry(r.country);
    if (normalized) {
      const row = totals.by_country[normalized] || (totals.by_country[normalized] = { posthog: 0, timezone: 0, lang: 0, cached: 0 });
      row.cached = (row.cached || 0) + 1;
    }
    continue;
  }
  // Otherwise: run the cascade.
  const ph = await fetchPosthogPersonProps(r.user_id);
  totals.ph_queried += 1;
  let posthogProps = null;
  if (ph.notFound)     totals.ph_notfound += 1;
  else if (ph.error)   totals.ph_error    += 1;
  else { totals.ph_found += 1; posthogProps = ph.properties; }

  const resolved = resolveCountry({
    posthogProps,
    timezone: r.timezone || null,
    lang:     r.lang     || null,
  });
  totals.by_source[resolved.source] += 1;
  if (resolved.country) totals.resolved += 1;
  bumpCountry(resolved.country, resolved.source);

  // Live writes
  if (LIVE && resolved.country) {
    const email = emailById.get(r.user_id);
    if (!email) { totals.live_skipped_no_email += 1; }
    else {
      const p = await loopsPatch(email, resolved.country);
      if (p.ok) totals.live_patched += 1;
      else      totals.live_failed  += 1;
    }
    // Sticky cache regardless of Loops outcome; a failed Loops PATCH
    // re-tries next run but we don't want to re-fetch PH the same user.
    await supabaseStickyWrite(r.user_id, resolved.country);
  }

  // Pacing — PostHog + Loops rate limits are both generous but keep a
  // conservative ~10 req/s combined.
  await sleep(100);
  if (i % 50 === 0) console.error(`[backfill-country] progress: ${i}/${progressRows.length}`);
}

// ── Report (no emails, no ids, no per-user lines) ────────────────────
console.log(JSON.stringify({
  mode:  LIVE ? 'live' : 'dry',
  totals: {
    users_total:  totals.users,
    ph_queried:   totals.ph_queried,
    ph_found:     totals.ph_found,
    ph_notfound:  totals.ph_notfound,
    ph_error:     totals.ph_error,
    resolved:     totals.resolved,
    by_source:    totals.by_source,
  },
  live: LIVE ? {
    patched:              totals.live_patched,
    failed:               totals.live_failed,
    skipped_no_email:     totals.live_skipped_no_email,
    skipped_already_cached: totals.live_skipped_already_cached,
  } : null,
  by_country: totals.by_country,
}, null, 2));

if (!LIVE) {
  console.error('[backfill-country] dry-run complete. Re-run with --live after approval.');
  console.error('[backfill-country] remember to `rm -f /tmp/_audit_keys` when done.');
}

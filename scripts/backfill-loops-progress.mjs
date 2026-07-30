#!/usr/bin/env node
// One-time backfill: pushes existing users' progress into Loops.
//
// Reuses the exact derivation the loops-progress Edge Function does (see
// supabase/functions/loops-progress/index.ts) so values are consistent
// with what future syncs will produce. Set of properties per contact:
//   lastActiveAt, lastSubject, subjectsStarted, bonusUnlocked, chaptersCompleted
//
// Why this exists: notify_loops_progress only fires when the client writes
// to user_progress.last_active_at. Users who haven't opened the app since
// the migration landed have empty Loops fields; the win-back workflow
// can't branch on them. This script populates every existing contact in
// one batch so the workflow works for the whole audience.
//
// Usage:
//   Set env vars first (do NOT commit them):
//     export SUPABASE_URL='https://xcoikjoatcrjqxzykwlt.supabase.co'
//     export SUPABASE_SERVICE_ROLE_KEY='eyJ...'   # dashboard → Settings → API
//     export LOOPS_API_KEY='6e26...'              # dashboard → Settings → API
//   Preview first — prints what would be sent for the first 5 users:
//     node scripts/backfill-loops-progress.mjs --dry-run
//   Live run — PATCHes every contact:
//     node scripts/backfill-loops-progress.mjs
//
// Idempotent — safe to re-run; Loops /contacts/update is an upsert.
// Paces at ~10 req/s (matches Loops' documented rate ceiling). Retries
// once on 429 / 5xx. On 404 (contact missing from Loops) prints and skips
// — those users signed up before loops-signup was deployed, or their
// Loops contact was deleted; either way, worth surfacing in the report.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// -- Optional .env loader (untracked; convenience only) ----------------------
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

const SUPABASE_URL              = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const LOOPS_API_KEY             = process.env.LOOPS_API_KEY;
const DRY_RUN                   = process.argv.includes('--dry-run');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[backfill] missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!DRY_RUN && !LOOPS_API_KEY) {
  console.error('[backfill] missing LOOPS_API_KEY (required for live run; not needed for --dry-run)');
  process.exit(1);
}

// -- Derivation: byte-identical to loops-progress Edge Function --------------
function deriveProgressProps(record) {
  const completedDays        = Array.isArray(record.completed_days)        ? record.completed_days        : [];
  const chapterCompleteShown = Array.isArray(record.chapter_complete_shown) ? record.chapter_complete_shown : [];
  const hasPhilosophy = completedDays.some(k => typeof k === 'string' && k.startsWith('philosophy-'));
  const hasEconomics  = completedDays.some(k => typeof k === 'string' && k.startsWith('economics-'));
  let subjectsStarted = null;
  if (hasPhilosophy && hasEconomics) subjectsStarted = 'both';
  else if (hasPhilosophy)            subjectsStarted = 'philosophy';
  else if (hasEconomics)             subjectsStarted = 'economics';
  // language: forwarded from user_progress.lang (migration 20260730120000).
  // Kept out of the returned object when the value is null / empty so the
  // spread at the callsite (body = { email, ...props }) omits the property
  // entirely — sending "" or null would clear Loops' language field.
  const props = {
    lastActiveAt:      typeof record.last_active_at === 'string' ? record.last_active_at : null,
    // Fallback for users whose last_subject was never written (never synced
    // since the migration): if we can prove they only touched one subject,
    // infer from that; if they touched both, we can't tell without a per-day
    // timestamp, so leave null.
    lastSubject:       (typeof record.last_subject === 'string' && record.last_subject)
                    || (subjectsStarted === 'both' ? null : subjectsStarted),
    subjectsStarted,
    bonusUnlocked:     completedDays.some(k => typeof k === 'string' && k.startsWith('bonus')),
    chaptersCompleted: chapterCompleteShown.length,
  };
  if (typeof record.lang === 'string' && record.lang) props.language = record.lang;
  return props;
}

// -- Fetch: auth.users + user_progress via Supabase REST --------------------
async function fetchAllUsers() {
  const admin = {
    'apikey':        SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  };
  const users = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000&page=${page}`, { headers: admin });
    if (!res.ok) throw new Error(`auth admin users page ${page}: ${res.status} ${await res.text()}`);
    const j = await res.json();
    const list = Array.isArray(j.users) ? j.users : [];
    if (!list.length) break;
    users.push(...list);
    if (list.length < 1000) break;
    page += 1;
  }
  const progressRes = await fetch(`${SUPABASE_URL}/rest/v1/user_progress?select=user_id,last_active_at,last_subject,completed_days,chapter_complete_shown,lang`, {
    headers: admin,
  });
  if (!progressRes.ok) throw new Error(`user_progress fetch: ${progressRes.status} ${await progressRes.text()}`);
  const rows = await progressRes.json();
  const byUser = new Map();
  for (const row of rows) byUser.set(row.user_id, row);
  return users.map(u => ({ email: u.email, id: u.id, progress: byUser.get(u.id) || null }));
}

// -- Loops PATCH (retries once on transient failures) ------------------------
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function loopsUpdate(email, props) {
  const body = { email, ...props };
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await fetch('https://app.loops.so/api/v1/contacts/update', {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${LOOPS_API_KEY}`,
        },
        body: JSON.stringify(body),
      });
    } catch (e) {
      if (attempt === 0) { await sleep(1500); continue; }
      return { ok: false, status: 0, error: String(e).slice(0, 200) };
    }
    if (res.ok) return { ok: true };
    if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
      await sleep(1500);
      continue;
    }
    let text = '';
    try { text = await res.text(); } catch (_) {}
    return { ok: false, status: res.status, error: text.slice(0, 200) };
  }
  return { ok: false, status: 0, error: 'retries exhausted' };
}

// -- Main --------------------------------------------------------------------
async function main() {
  console.log(`[backfill] ${DRY_RUN ? 'DRY RUN' : 'LIVE'} — fetching users...`);
  const users = await fetchAllUsers();
  const withEmail    = users.filter(u => u.email);
  const withoutEmail = users.length - withEmail.length;
  const withProgress = withEmail.filter(u => u.progress).length;
  console.log(`[backfill] ${users.length} auth users total`);
  console.log(`[backfill]   ${withEmail.length} have an email address`);
  console.log(`[backfill]   ${withoutEmail} email-less (phone-only signups, skipped)`);
  console.log(`[backfill]   ${withProgress} have a user_progress row`);

  const targets = withEmail.map(u => ({
    email: u.email,
    id:    u.id,
    props: u.progress ? deriveProgressProps(u.progress) : {
      lastActiveAt: null, lastSubject: null, subjectsStarted: null, bonusUnlocked: false, chaptersCompleted: 0,
    },
  }));

  if (DRY_RUN) {
    console.log('\n[backfill] preview — first 5 targets that would be PATCHed to Loops:\n');
    for (const t of targets.slice(0, 5)) {
      console.log(JSON.stringify({ email: t.email, ...t.props }, null, 2));
      console.log('---');
    }
    console.log(`[backfill] would PATCH ${targets.length} contacts.`);
    console.log(`[backfill] re-run WITHOUT --dry-run to send.`);
    return;
  }

  let updated = 0, failed = 0, notFound = 0;
  const errors = [];
  const t0 = Date.now();
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const r = await loopsUpdate(t.email, t.props);
    if (r.ok) { updated++; }
    else if (r.status === 404) { notFound++; errors.push({ email: t.email, status: 404, error: 'contact not in Loops' }); }
    else { failed++; errors.push({ email: t.email, status: r.status, error: r.error }); }
    if ((i + 1) % 10 === 0 || i === targets.length - 1) {
      process.stdout.write(`\r[backfill] ${i + 1}/${targets.length} (updated=${updated} not_found=${notFound} failed=${failed})   `);
    }
    // ~10 req/s — well under Loops' documented ceiling.
    await sleep(100);
  }
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[backfill] done in ${dt}s. updated=${updated} not_found=${notFound} failed=${failed}`);
  if (errors.length) {
    console.log('[backfill] first 10 error rows:');
    for (const e of errors.slice(0, 10)) console.log(' ', JSON.stringify(e));
  }
}

main().catch(err => {
  console.error('[backfill] fatal:', err);
  process.exit(1);
});

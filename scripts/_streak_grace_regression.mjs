// Streak grace-day regression.
//
// The old streak logic in updateDailyStreak / recalculateStreak required
// every active day to be consecutive — a single missed day collapsed the
// streak to 1. A real user active 40+ days in a row with ONE missed day
// got reset to 1 in production. This test proves the new grace rule:
//
//   - A single missed day is tolerated (chain stays alive, counter keeps
//     counting).
//   - Two or more consecutive missed days break the chain.
//   - The "last active was today, yesterday, or day-before-yesterday"
//     window determines whether the chain is currently alive.
//   - activeDates is the single source of truth; lastActiveDate is
//     derivable from it and is NOT the pivot anymore.
//
// Each case freezes a mock "today" via a fake Date, seeds activeDates +
// (optionally) a persisted streak counter, calls recalculateStreak, and
// asserts the resulting state.dailyStreak.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
function startServer(root) {
  const server = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(root, p); if (!abs.startsWith(root)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(await readFile(abs));
    } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

const results = [];
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

// Each case:
//   today    — the fake "today" (YYYY-MM-DD), midday local time
//   active   — array of YYYY-MM-DD active days (sorted)
//   seed     — persisted dailyStreak value (optional; defaults to 0)
//   expect   — expected state.dailyStreak after recalculateStreak
async function runCase(name, today, active, seed, expect) {
  const r = await page.evaluate(({ todayStr, active, seed }) => {
    // Freeze "today" by patching Date. _streakDay() calls new Date() with
    // no args; override that to return a fixed midday local time of
    // todayStr. Keep Date.UTC etc. functional.
    const [y, m, d] = todayStr.split('-').map(Number);
    const fixedNow = new Date(y, m - 1, d, 12, 0, 0);  // midday local
    const Original = Date;
    function Patched(...args) {
      if (args.length === 0) return new Original(fixedNow.getTime());
      return new Original(...args);
    }
    Patched.UTC = Original.UTC;
    Patched.parse = Original.parse;
    Patched.now = () => fixedNow.getTime();
    Patched.prototype = Original.prototype;
    window.Date = Patched;
    try {
      state.activeDates = (active || []).slice();
      state.dailyStreak = seed || 0;
      state.streak = seed || 0;
      state.lastActiveDate = active && active.length ? active[active.length - 1] : '';
      state.streakBreaks = [];
      recalculateStreak();
      return {
        streak: state.dailyStreak,
        lastActive: state.lastActiveDate,
        breaks: (state.streakBreaks || []).map(b => b.brokenAt),
      };
    } finally {
      window.Date = Original;
    }
  }, { todayStr: today, active, seed });
  const pass = r.streak === expect;
  rec(name, pass, `streak=${r.streak} (expected ${expect}) lastActive=${r.lastActive} breaks=${JSON.stringify(r.breaks)}`);
  return r;
}

// Case 1 — the reported bug. User active Sep 14 → Oct 25 with only Oct 24
// missing. Should be a 41-day streak, not 1.
const sep14ToOct25MissingOct24 = (() => {
  const out = [];
  const start = new Date(2026, 8, 14);  // Sep 14, 2026
  const end = new Date(2026, 9, 25);    // Oct 25, 2026
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (s !== '2026-10-24') out.push(s);
  }
  return out;
})();
await runCase('1. 40+ days, missed 1 (reported bug): streak = 41',
  '2026-10-25', sep14ToOct25MissingOct24, 0, 41);

// Case 2 — intact chain, no gaps.
await runCase('2. 10 consecutive days ending today: streak = 10',
  '2026-10-25',
  ['2026-10-16','2026-10-17','2026-10-18','2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25'],
  0, 10);

// Case 3 — intact chain, chain ending YESTERDAY (user hasn't opened today).
await runCase('3. Last active yesterday, no gaps: streak = 10',
  '2026-10-25',
  ['2026-10-15','2026-10-16','2026-10-17','2026-10-18','2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24'],
  0, 10);

// Case 4 — chain ending DAY BEFORE YESTERDAY (grace in use: yesterday missed).
await runCase('4. Last active DBY, user hasn\'t done yesterday or today — alive via grace: streak = 10',
  '2026-10-25',
  ['2026-10-14','2026-10-15','2026-10-16','2026-10-17','2026-10-18','2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23'],
  0, 10);

// Case 5 — 2 consecutive missed days before today → broken.
await runCase('5. Last active 3+ days ago (2 consecutive misses): streak = 0',
  '2026-10-25',
  ['2026-10-15','2026-10-16','2026-10-17','2026-10-18','2026-10-19','2026-10-20','2026-10-21','2026-10-22'],
  25, 0);

// Case 6 — single gap in middle: tolerated.
await runCase('6. Days 1-20, miss 21, active 22 — today = 22: streak = 21',
  '2026-10-22',
  (() => {
    const out = [];
    for (let d = 1; d <= 20; d++) out.push(`2026-10-${String(d).padStart(2,'0')}`);
    out.push('2026-10-22');
    return out;
  })(),
  0, 21);

// Case 7 — 2 consecutive misses in the middle: chain truncates at the break.
await runCase('7. Days 1-20, miss 21+22, active 23 — today = 23: streak = 1',
  '2026-10-23',
  (() => {
    const out = [];
    for (let d = 1; d <= 20; d++) out.push(`2026-10-${String(d).padStart(2,'0')}`);
    out.push('2026-10-23');
    return out;
  })(),
  25, 1);

// Case 8 — multiple single-day gaps, no 2+ consecutive misses.
await runCase('8. "4 days/week" cadence Oct 1-25 (every M/W/F/Sa): streak = count-in-chain',
  '2026-10-25',
  // Oct 1 (Thu), 3 (Sat), 5 (Mon), 7 (Wed), ... — Mon/Wed/Fri/Sat-ish
  // Simpler: alternating active/miss. Every other day = 1-day gap between pairs = GAP=2 which is allowed.
  ['2026-10-01','2026-10-03','2026-10-05','2026-10-07','2026-10-09','2026-10-11','2026-10-13','2026-10-15','2026-10-17','2026-10-19','2026-10-21','2026-10-23','2026-10-25'],
  0, 13);

// Case 9 — empty activeDates: streak = 0.
await runCase('9. Empty activeDates: streak = 0', '2026-10-25', [], 10, 0);

// Case 10 — persisted higher than derived on alive chain: max(persisted, derived) wins.
await runCase('10. Max-with-persisted on alive chain', '2026-10-25',
  ['2026-10-23','2026-10-24','2026-10-25'],
  50, 50);

// Case 11 — persisted higher than derived on BROKEN chain: derived (0) wins outright.
await runCase('11. Broken chain: derived 0 wins over stale-high persisted',
  '2026-10-25',
  ['2026-10-10','2026-10-11','2026-10-12'],
  50, 0);

// Case 12 — exactly 2 missed days then active today = chain restarts.
await runCase('12. Miss 2 days, active today → chain restarts at today',
  '2026-10-25',
  ['2026-10-22','2026-10-25'],
  10, 1);

// Case 13 — updateDailyStreak completion path uses the grace: user with 40-day
// chain-via-grace who completes today sees 41 (not reset to 1).
const r13 = await page.evaluate(({ todayStr, active }) => {
  const [y, m, d] = todayStr.split('-').map(Number);
  const fixedNow = new Date(y, m - 1, d, 12, 0, 0);
  const Original = Date;
  function Patched(...args) { return args.length === 0 ? new Original(fixedNow.getTime()) : new Original(...args); }
  Patched.UTC = Original.UTC; Patched.parse = Original.parse; Patched.now = () => fixedNow.getTime(); Patched.prototype = Original.prototype;
  window.Date = Patched;
  try {
    state.activeDates = active.slice();
    state.dailyStreak = 0;
    state.lastActiveDate = active[active.length - 1];
    state.streakBreaks = [];
    updateDailyStreak();
    return { streak: state.dailyStreak, lastActive: state.lastActiveDate, hasToday: state.activeDates.includes(todayStr) };
  } finally { window.Date = Original; }
}, { todayStr: '2026-10-25', active: sep14ToOct25MissingOct24.slice(0, -1) });  // all days up to Oct 23 (missing Oct 24 AND Oct 25)
rec('13. updateDailyStreak completion → grace absorbs yesterday miss, streak = 41 not 1',
  r13.streak === 41 && r13.hasToday && r13.lastActive === '2026-10-25',
  JSON.stringify(r13));

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

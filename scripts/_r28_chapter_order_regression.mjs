// Round 28 item 2 regression — chapter order must hold for everyone.
// Dev-premium bypasses the paywall only, never the chapter order.
//
// Scenarios:
//   1. Fresh user (no dev-premium, no isPaid) — only Ch1 open.
//   2. Dev-premium flag set — only Ch1 open (round 28 removed the
//      _buildWeekLockMap bypass; dev-premium is paywall-only now).
//   3. Fresh user + Ch1 completed — Ch2 opens, Ch3 still locked.
//
// Reads _buildWeekLockMap output + .week-item.locked class on
// rendered home chapter cards. Runs on 393×852 EN.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
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

const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function run(label, { devPremium, completedCh1, partialCh3 }) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((opts) => {
    const { dev, c1, p3 } = opts;
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    if (dev) {
      // _isDevPremium requires both the premium flag AND the debug
      // flag (or _corpus_dev_test) — see _isDevPremium at ~41515.
      localStorage.setItem('_corpus_dev_premium', '1');
      localStorage.setItem('_corpus_debug', '1');
    }
    const cd = {};
    if (c1) {
      for (let d = 1; d <= 7; d++) cd[`philosophy-1-${d}`] = true;
    }
    if (p3) {
      // Seed a single completed day in Ch3 — simulates the grandfather
      // case where a user has already started/partly completed Ch3 under
      // the pre-28 "every chapter open" state (round 12-27 dev-premium
      // bypass OR a legacy build that didn't enforce the lock).
      cd['philosophy-3-1'] = true;
    }
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:cd, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy: true, economics: true, psychology: true }, dailyStreak:0, xp:0, currentScreen:'home', isPaid:false }));
  }, { dev: devPremium, c1: completedCh1, p3: !!partialCh3 });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.waitForTimeout(500);
  const info = await page.evaluate(() => {
    const chapters = (typeof getW === 'function') ? getW().filter(w => w && !w.isBonus) : [];
    const lockMap = (typeof _buildWeekLockMap === 'function') ? _buildWeekLockMap(chapters) : null;
    const devPremium = (typeof _isDevPremium === 'function') ? _isDevPremium() : false;
    const open = {};
    for (const w of chapters.slice(0, 5)) {
      open[w.id] = lockMap ? !!lockMap[w.id] : null;
    }
    return { devPremium, open };
  });
  console.log(`  [${label}] devPremium=${info.devPremium} open=${JSON.stringify(info.open)}`);
  // Chapter 1 is always open
  rec(`${label}: Ch1 open`, info.open[1] === true);
  if (completedCh1) {
    rec(`${label}: Ch2 open (Ch1 completed)`, info.open[2] === true);
  } else {
    rec(`${label}: Ch2 locked (Ch1 not completed)`, info.open[2] === false);
  }
  if (partialCh3) {
    // Grandfather case: Ch3 has at least one completed day. Stays open
    // even though Ch1 + Ch2 are not completed. User keeps access to
    // content they've already started.
    rec(`${label}: Ch3 open (has progress, grandfather clause)`, info.open[3] === true);
  } else {
    rec(`${label}: Ch3 locked`, info.open[3] === false);
  }
  await ctx.close();
}

await run('fresh user, no dev-premium', { devPremium: false, completedCh1: false });
await run('fresh user, dev-premium ON', { devPremium: true, completedCh1: false });
await run('Ch1 completed, no dev-premium', { devPremium: false, completedCh1: true });
await run('Ch1 completed, dev-premium ON', { devPremium: true, completedCh1: true });
// Grandfather case: user has partial Ch3 progress (seeded under pre-28
// state where every chapter was open). Round 28 _buildWeekLockMap must
// keep Ch3 open so the user doesn't lose access to content they've
// already started.
await run('grandfather: partial Ch3, no Ch1', { devPremium: false, completedCh1: false, partialCh3: true });
await run('grandfather: partial Ch3, Ch1 done', { devPremium: false, completedCh1: true, partialCh3: true });

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

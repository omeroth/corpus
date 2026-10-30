// R40 A1 — native debug-build flag gating.
//
// Two runs over the same page:
//   (1) Without window.__CORPUS_DEBUG_BUILD + all three localStorage debug
//       flags set. Simulates a user who guessed/set the localStorage keys
//       on a Release build (via a stolen Web Inspector session elsewhere,
//       or an exported localStorage dump). Every window.__corpus* /
//       window._replay* helper must be undefined after boot and
//       _isDevPremium() must return false, so chapters/paywall behave as
//       non-subscriber.
//   (2) With window.__CORPUS_DEBUG_BUILD = true set at document start
//       (what the iOS WKUserScript + Android JS bridge do under #if DEBUG
//       / BuildConfig.DEBUG). All helpers must be defined. _isDevPremium
//       still requires the localStorage flags on top, so set them.
//
// Pure assertion script — no screenshots. Fast.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.json':'application/json; charset=utf-8' };
function srv(root) {
  const s = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p==='/'||p==='') p='/index.html';
      const abs = join(root, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => s.listen(0, '127.0.0.1', () => r({ s, port: s.address().port })));
}
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(n, p, note='') { results.push({ n, p, note }); console.log((p?'[PASS] ':'[FAIL] ')+n+(note?' — '+note:'')); }

const HELPERS = [
  '_replayWalkthrough',
  '_replayOwlBeat',
  '_replayStreakIntroBeat',
  '_replayCh6Gift',
  '__corpusDevPremium',
  '__corpusCardDiag',
  '__corpusPreviewReveal',
  '__corpusShowPopup',
  // R41 Finding 10 — test harness helpers.
  '__corpusTestProfile',
  '__corpusTestRestore',
  '__corpusClock',
  // R41 E — simulator tour harness.
  '__corpusTour',
];

async function boot(opts) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(({ nativeFlag }) => {
    try { localStorage.clear(); } catch (_) {}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    // The three localStorage flags that previously opened the dev-premium
    // path. Set them in BOTH runs — the point of A1 is that they are no
    // longer sufficient on their own.
    localStorage.setItem('_corpus_debug', '1');
    localStorage.setItem('_corpus_dev_test', '1');
    localStorage.setItem('_corpus_dev_premium', '1');
    localStorage.setItem('corpus_state', JSON.stringify({
      v: 3, subject: 'philosophy', lang: 'en',
      completedDays: {}, framesExplainerSeen: true, streakIntroSeen: true,
      currentScreen: 'home', isPaid: false,
    }));
    if (nativeFlag) {
      // Mirrors the iOS WKUserScript injected at atDocumentStart under
      // #if DEBUG. On Android, the normalization script near the top of
      // index.html's <script> block reads the JavascriptInterface and
      // sets this flag; here we set it directly for parity.
      window.__CORPUS_DEBUG_BUILD = true;
    }
  }, opts);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  return { ctx, page };
}

// --- Run 1: Release-shaped — no native flag, all localStorage flags set.
{
  const { ctx, page } = await boot({ nativeFlag: false });
  const probe = await page.evaluate((helpers) => {
    const r = { flag: window.__CORPUS_DEBUG_BUILD, helpers: {} };
    for (const h of helpers) r.helpers[h] = typeof window[h];
    r.isDevPremium = (typeof _isDevPremium === 'function') ? _isDevPremium() : null;
    r.isUserPaidOrTrialNow = (typeof _isUserPaidOrTrialNow === 'function') ? _isUserPaidOrTrialNow() : null;
    r.canAccessCh5 = (typeof canAccessWeek === 'function') ? canAccessWeek('philosophy', 5) : null;
    return r;
  }, HELPERS);
  rec('release: __CORPUS_DEBUG_BUILD is NOT true', probe.flag !== true, `flag=${probe.flag}`);
  for (const h of HELPERS) {
    rec(`release: window.${h} is undefined`, probe.helpers[h] === 'undefined', `typeof=${probe.helpers[h]}`);
  }
  rec('release: _isDevPremium() returns false despite all localStorage flags', probe.isDevPremium === false, `got=${probe.isDevPremium}`);
  rec('release: _isUserPaidOrTrialNow() returns false (non-subscriber)', probe.isUserPaidOrTrialNow === false, `got=${probe.isUserPaidOrTrialNow}`);
  rec('release: canAccessWeek(philosophy, 5) returns false (ch5 paywalled)', probe.canAccessCh5 === false, `got=${probe.canAccessCh5}`);
  await ctx.close();
}

// --- Run 2: Debug-shaped — native flag set, same localStorage flags.
{
  const { ctx, page } = await boot({ nativeFlag: true });
  const probe = await page.evaluate((helpers) => {
    const r = { flag: window.__CORPUS_DEBUG_BUILD, helpers: {} };
    for (const h of helpers) r.helpers[h] = typeof window[h];
    r.isDevPremium = (typeof _isDevPremium === 'function') ? _isDevPremium() : null;
    r.isUserPaidOrTrialNow = (typeof _isUserPaidOrTrialNow === 'function') ? _isUserPaidOrTrialNow() : null;
    return r;
  }, HELPERS);
  rec('debug: __CORPUS_DEBUG_BUILD === true', probe.flag === true, `flag=${probe.flag}`);
  for (const h of HELPERS) {
    rec(`debug: window.${h} is a function`, probe.helpers[h] === 'function', `typeof=${probe.helpers[h]}`);
  }
  rec('debug: _isDevPremium() returns true (localStorage flags + native flag)', probe.isDevPremium === true, `got=${probe.isDevPremium}`);
  rec('debug: _isUserPaidOrTrialNow() returns true (dev-premium path)', probe.isUserPaidOrTrialNow === true, `got=${probe.isUserPaidOrTrialNow}`);
  await ctx.close();
}

await browser.close(); app.s.close();
const pass = results.filter(r => r.p).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

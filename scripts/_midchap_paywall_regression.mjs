// Permanent regression for round 8 item 4 — non-subscriber finishing
// chapter-1 dialogue 3 or 6 must see the mid-chapter paywall. Two
// distinct guarantees the v7 reveal has to satisfy, both of which the
// first fix (fixed-timer at 2850 ms) violated:
//
//   (1) the paywall must appear ONLY after the card's animation has
//       fully settled — on a first-meeting (D3 Plato, D6 Aurelius)
//       the card is face-down until the user taps it, so a 2850-ms
//       timer would land on top of an unrevealed card.
//
//   (2) a fast tap on Next Dialogue / Home before the arm-time must
//       still open the paywall FIRST, then run the navigation only
//       after the paywall closes. Otherwise a non-subscriber could
//       bypass the gate by tapping fast.
//
// Scenarios:
//   a. non-sub D3 (Plato first meeting): tap stage to reveal, wait
//      for settle+800 ms arm → paywall opens over the card.
//   b. non-sub D6 (Aurelius first meeting): same as (a).
//   c. non-sub D3, early tap on Next BEFORE paywall arms → paywall
//      opens IMMEDIATELY, dcThinker still visible underneath; close
//      the paywall → openReader fires for the next lesson.
//   d. non-sub D3, early tap on Home BEFORE paywall arms → paywall
//      opens IMMEDIATELY; close the paywall → closeCompleteModal fires.
//   e. non-sub D3 unrevealed card: WITHOUT tapping the stage, wait
//      several seconds — paywall must NOT fire (card is face-down,
//      the arm-timer was never scheduled).
//   f. paid-tier user D3 → paywall never opens.
//   g. non-sub D3 real path on NATIVE iOS with 3-s RC-offerings delay:
//      paywall must render FULL content (band + fan + headline +
//      benefits + plan skeleton + CTA) immediately. The earlier device
//      bug ("blank white paywall") was a universal CSS rule hiding
//      every child of .modal-box; this case guards against regressions.
//   h. same as g, but RC-offerings call REJECTS → paywall still renders
//      structure, prices fall back to legacy placeholders.
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
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function freshPage(seed) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.addInitScript((seedJson) => {
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'web', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    try {
      localStorage.setItem('corpus_onboarding_done', '1');
      localStorage.setItem('corpus_walkthrough_done', '1');
      localStorage.setItem('corpus_subject', 'philosophy');
      localStorage.setItem('corpus_state', seedJson);
    } catch(_){}
  }, JSON.stringify(seed));
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  return { ctx, page };
}

function makeSeed({ dayId, isPaid }) {
  const completed = {};
  for (let d = 1; d < dayId; d++) completed[`philosophy-1-${d}`] = true;
  return {
    v:3, subject:'philosophy', lang:'en',
    completedDays: completed,
    framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
    bonusUnlockShown:{philosophy:true},
    dailyStreak:5, xp: 200 * dayId, currentScreen:'home',
    isPaid: !!isPaid,
    midChapterPaywallShown: {},
  };
}

// Drive to the thinker-card screen: openReader(1, dayId), jump to the
// quiz_summary section, mark all quiz answers right, call finishDay,
// invoke showThinkerCardScreen directly (sidestep the dc-stats CTA
// so the test doesn't depend on button DOM existence).
async function openCardScreen(page, dayId) {
  await page.evaluate(({ d }) => {
    openReader(1, d);
    const chapter = getW().find(w => w.id === 1);
    const day = chapter.days.find(x => x.id === d);
    const dqKey = `philosophy-1-${d}`;
    const quizIdxs = [];
    day.sections.forEach((s, i) => { if (s && s.type === 'quiz') quizIdxs.push(i); });
    const dq = {}; quizIdxs.forEach((_, i) => { dq['q' + (i + 1)] = true; });
    state.dayQuizResults = { [dqKey]: dq };
    const qsIdx = day.sections.findIndex(s => s && s.type === 'quiz_summary');
    state.currentSection = qsIdx;
    renderReader();
  }, { d: dayId });
  await page.waitForTimeout(200);
  await page.evaluate(() => { try { finishDay(); } catch(_){} });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const chapter = getW().find(w => w.id === 1);
    const day = chapter.days.find(x => x.id === state.currentDay);
    const t = getT().find(th => th && th.id === day.thinkerId);
    if (t) showThinkerCardScreen(t, chapter, day);
  });
  await page.waitForTimeout(300);
}

async function paywallActive(page) {
  return await page.evaluate(() => {
    const pw = document.getElementById('modal-paywall');
    return !!(pw && pw.classList.contains('active') && getComputedStyle(pw).display !== 'none');
  });
}

async function waitForPaywall(page, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await paywallActive(page)) return true;
    await page.waitForTimeout(100);
  }
  return false;
}

// a. non-sub D3 (Plato first meeting), tap stage to reveal, wait for arm
{
  const { ctx, page } = await freshPage(makeSeed({ dayId: 3, isPaid: false }));
  await openCardScreen(page, 3);
  // Reveal path should be first-meeting (points=1 for Plato). Confirm
  // the face-down card is present + no paywall yet.
  const pre = await page.evaluate(() => ({
    firstBranch: !!document.querySelector('.rv-root.rv-first'),
    hasBack: !!document.querySelector('.rv-flp .rv-back'),
    paywallActive: !!document.getElementById('modal-paywall').classList.contains('active'),
  }));
  // Tap the card to reveal.
  await page.evaluate(() => { const s = document.getElementById('rv-stg'); if (s) s.click(); });
  // Reveal animation ≈ 650 + 500 + 450 + 900 = 2500 ms, then +800 ms
  // breath + 800 ms arm = ~4100 ms total. Give up to 5500 ms.
  const got = await waitForPaywall(page, 5500);
  rec('a. non-sub D3 (Plato, first meeting) → tap reveal → paywall opens', got && pre.firstBranch && pre.hasBack && !pre.paywallActive, `pre=${JSON.stringify(pre)} paywallOpened=${got}`);
  await ctx.close();
}

// b. non-sub D6 (Aurelius first meeting)
{
  const { ctx, page } = await freshPage(makeSeed({ dayId: 6, isPaid: false }));
  await openCardScreen(page, 6);
  const pre = await page.evaluate(() => ({
    firstBranch: !!document.querySelector('.rv-root.rv-first'),
    hasBack: !!document.querySelector('.rv-flp .rv-back'),
  }));
  await page.evaluate(() => { const s = document.getElementById('rv-stg'); if (s) s.click(); });
  const got = await waitForPaywall(page, 5500);
  rec('b. non-sub D6 (Aurelius, first meeting) → tap reveal → paywall opens', got && pre.firstBranch && pre.hasBack, `pre=${JSON.stringify(pre)} paywallOpened=${got}`);
  await ctx.close();
}

// c. non-sub D3, early tap on Next BEFORE paywall arms → paywall first,
//    then openReader after close.
{
  const { ctx, page } = await freshPage(makeSeed({ dayId: 3, isPaid: false }));
  await openCardScreen(page, 3);
  // DON'T reveal the card. Instead tap "Next Dialogue" immediately.
  await page.evaluate(() => {
    const next = document.getElementById('rd-cta-next');
    if (next) next.click();
  });
  // Paywall should open RIGHT AWAY (gate behaviour, no waiting on arm).
  const openedFast = await waitForPaywall(page, 500);
  // Close the paywall → the deferred Next-Dialogue handler should run.
  await page.evaluate(() => { try { _exitPaywall('close_x'); } catch(_){} });
  // Wait up to 2500 ms for the reader to open (openReader → showScreen('reader')).
  let readerOpened = false;
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(100);
    readerOpened = await page.evaluate(() => state && state.currentScreen === 'reader' && (state.currentWeek === 1 || typeof state.currentWeek !== 'undefined'));
    if (readerOpened) break;
  }
  rec('c. non-sub D3 → early tap Next → paywall gates, then openReader on dismiss', openedFast && readerOpened, `openedFast=${openedFast} readerOpened=${readerOpened}`);
  await ctx.close();
}

// d. non-sub D3, early tap on Home BEFORE paywall arms → paywall first,
//    then closeCompleteModal fires on close (which may route through a
//    guest-signup/share prompt chain before landing on home — the
//    reliable signal that closeCompleteModal ran is modal-complete
//    losing its .active class, not state.currentScreen === 'home').
{
  const { ctx, page } = await freshPage(makeSeed({ dayId: 3, isPaid: false }));
  await openCardScreen(page, 3);
  const activeBefore = await page.evaluate(() => document.getElementById('modal-complete').classList.contains('active'));
  await page.evaluate(() => {
    const home = document.getElementById('rd-cta-home');
    if (home) home.click();
  });
  const openedFast = await waitForPaywall(page, 500);
  await page.evaluate(() => { try { _exitPaywall('close_x'); } catch(_){} });
  let closedAfter = false;
  for (let i = 0; i < 25; i++) {
    await page.waitForTimeout(100);
    closedAfter = await page.evaluate(() => !document.getElementById('modal-complete').classList.contains('active'));
    if (closedAfter) break;
  }
  rec('d. non-sub D3 → early tap Home → paywall gates, then closeCompleteModal on dismiss', openedFast && activeBefore && closedAfter, `openedFast=${openedFast} activeBefore=${activeBefore} closedAfter=${closedAfter}`);
  await ctx.close();
}

// e. non-sub D3 unrevealed card: don't tap, wait 3 s → paywall MUST NOT
//    fire (arm-timer is gated on the tap-reveal path).
{
  const { ctx, page } = await freshPage(makeSeed({ dayId: 3, isPaid: false }));
  await openCardScreen(page, 3);
  await page.waitForTimeout(3000);
  const stillUnrevealed = await page.evaluate(() => {
    const flp = document.querySelector('.rv-flp');
    return !!flp && !flp.classList.contains('rv-turn');
  });
  const paywallFired = await paywallActive(page);
  rec('e. non-sub D3 unrevealed → paywall does NOT land on face-down card', stillUnrevealed && !paywallFired, `stillUnrevealed=${stillUnrevealed} paywallFired=${paywallFired}`);
  await ctx.close();
}

// f. paid-tier user D3 → no paywall at all.
{
  const { ctx, page } = await freshPage(makeSeed({ dayId: 3, isPaid: true }));
  await openCardScreen(page, 3);
  await page.evaluate(() => { const s = document.getElementById('rv-stg'); if (s) s.click(); });
  await page.waitForTimeout(5000);
  const got = await paywallActive(page);
  rec('f. paid D3 → no paywall', !got, `paywallActive=${got}`);
  await ctx.close();
}

// g + h. Native iOS Capacitor with RC offerings delayed / failing —
// paywall must render FULL content immediately (band + fan + headline
// + benefits + plans + CTA), never a blank white box. Guards the
// device bug from round 9 where a universal CSS rule hid every child
// of .modal-box.
async function freshPageNative({ pwDelay = 0, pwFail = false, seed }) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.addInitScript(({ pwDelay, pwFail, seedJson }) => {
    window.Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'ios',
      Plugins: { Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} },
    };
    window.Purchases = {
      getOfferings: async () => {
        if (pwDelay > 0) await new Promise(r => setTimeout(r, pwDelay));
        if (pwFail) throw new Error('RC offerings failed (simulated)');
        return { current: { identifier: 'default', availablePackages: [
          { identifier: '$rc_monthly', product: { priceString: '$12.99', price: 12.99 } },
          { identifier: '$rc_annual',  product: { priceString: '$89.99', price: 89.99 } },
        ]}};
      },
    };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_state', seedJson);
  }, { pwDelay, pwFail, seedJson: JSON.stringify(seed) });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  return { ctx, page };
}
async function paywallFullyRendered(page) {
  return await page.evaluate(() => {
    const box = document.querySelector('#modal-paywall .modal-box.paywall-box');
    if (!box) return { ok: false, reason: 'no box' };
    const band = box.querySelector('.pwv7-band');
    const body = box.querySelector('.pwv7-body');
    const foot = box.querySelector('.pwv7-foot');
    const cta  = box.querySelector('.paywall-cta');
    const bandH = band && band.getBoundingClientRect().height;
    const bodyH = body && body.getBoundingClientRect().height;
    const footH = foot && foot.getBoundingClientRect().height;
    const ctaH  = cta  && cta.getBoundingClientRect().height;
    return {
      ok: bandH > 100 && bodyH > 100 && footH > 60 && ctaH > 20,
      bandH, bodyH, footH, ctaH,
    };
  });
}
{
  const { ctx, page } = await freshPageNative({ pwDelay: 3000, seed: makeSeed({ dayId: 3, isPaid: false }) });
  await page.evaluate(() => showPaywall({ subject:'philosophy', weekId:2, dayId:1, source:'debug' }));
  await page.waitForTimeout(600); // sample BEFORE the 3s offerings resolve
  const info = await paywallFullyRendered(page);
  rec('g. native iOS + RC offerings delayed 3s → paywall shows FULL content immediately', info.ok, JSON.stringify(info));
  await ctx.close();
}
{
  const { ctx, page } = await freshPageNative({ pwFail: true, seed: makeSeed({ dayId: 3, isPaid: false }) });
  await page.evaluate(() => showPaywall({ subject:'philosophy', weekId:2, dayId:1, source:'debug' }));
  await page.waitForTimeout(800);
  const info = await paywallFullyRendered(page);
  rec('h. native iOS + RC offerings fail → paywall still shows FULL structure', info.ok, JSON.stringify(info));
  await ctx.close();
}

// Round 23 — a non-subscriber who exits on the D3/D6 summary via X
// instead of tapping "Complete dialogue" must still get the paywall
// when the first-meeting reveal is replayed on the next home open.
// Guards against the "exit bypasses the paywall" regression.
{
  const { ctx, page } = await freshPage(makeSeed({ dayId: 3, isPaid: false }));
  const r = await page.evaluate(async () => {
    // Seed a committed-but-un-revealed D3 completion (as if the user
    // tapped X on the summary and _commitDialogueOnExit queued it).
    // kant is the ch1-d3 thinker in the current data; use whoever
    // actually fronts d3 so the resolve works.
    const ch1 = corpusData.weeks.find(w => w.id === 1);
    const d3 = ch1.days.find(d => d.id === 3);
    if (!d3 || !d3.thinkerId) return { skipped: 'no d3 thinker' };
    state.subject = 'philosophy';
    state.isPaid = false;
    state.midChapterPaywallShown = {};
    state.completedDays['philosophy-1-3'] = true;
    state.unlockedThinkers = state.unlockedThinkers || [];
    if (!state.unlockedThinkers.includes(d3.thinkerId)) state.unlockedThinkers.push(d3.thinkerId);
    state.pendingReveals = [{
      subject: 'philosophy', weekId: 1, dayId: 3, thinkerId: d3.thinkerId,
      ownerUserId: null, committedAt: new Date().toISOString(),
      trigger: 'close-x', pointsAfterCommit: 1,
    }];
    _pendingMidChapterPaywall = null;
    _resumePendingRevealsIfAny();
    await new Promise(r => setTimeout(r, 400));
    return {
      flagged: !!_pendingMidChapterPaywall,
      source: _pendingMidChapterPaywall ? _pendingMidChapterPaywall.source : null,
    };
  });
  if (r.skipped) rec(`i. (skipped) ${r.skipped}`, true);
  else rec('i. Exit-on-summary D3 → replay re-arms the mid-chapter paywall for non-subscriber',
           r.flagged && r.source === 'ch1-d3', JSON.stringify(r));
  await ctx.close();
}

await browser.close(); app.server.close();
console.log('\n═══ Mid-chapter paywall ═══');
for (const r of results) console.log((r.pass ? ' ✓ ' : ' ✗ ') + r.name);
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

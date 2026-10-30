// Round 21 item 4 — first-meeting thinker card reveal gates the
// Next Dialogue / Share / Home buttons until the card is flipped.
// Before reveal:
//   - buttons have pointer-events: none + opacity 0.4 + aria-disabled
//   - hint "Tap the card to reveal" is visible
// After reveal:
//   - buttons are enabled
//   - hint is faded out
//   - a light haptic fires (observed via the _haptic call site; here
//     we assert the state change rather than the haptic itself)
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

async function openCtx(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const st = { v:3, subject:'philosophy', lang:l, completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true };
    localStorage.setItem('corpus_state', JSON.stringify(st));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.waitForTimeout(400);
  return { ctx, page };
}

async function openFirstMeeting(page, thinkerId = 'socrates') {
  // Open the v7 thinker reveal in first-meeting state via the debug helper.
  // _debugThinkerReveal(id, 1) triggers the first-meeting branch; the
  // round-19 fix ensures on-reader-v7 scope is set so _renderV7ThinkerReveal
  // runs instead of legacy.
  await page.evaluate((id) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    if (typeof _debugThinkerReveal === 'function') {
      _debugThinkerReveal(id, 1);
    } else {
      // Fallback: assemble inputs by hand.
      const t = THINKERS.find(x => x.id === id);
      state._debugThinkerPoints = { [id]: 1 };
      showThinkerCardScreen(t, { id: 0, title: 'debug' }, { id: 0, title: 'debug' });
    }
  }, thinkerId);
  await page.waitForTimeout(900);
}

const results = [];
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

// Case A — before reveal: CTA is gated (opacity 0.4, pointer-events none, aria-disabled)
{
  const { ctx, page } = await openCtx('en');
  await openFirstMeeting(page);
  const before = await page.evaluate(() => {
    const cta = document.querySelector('.rd-cta');
    const next = document.getElementById('rd-cta-next');
    const share = document.getElementById('rd-cta-share');
    const home = document.getElementById('rd-cta-home');
    const rvTap = document.getElementById('rv-tap');
    // Round 22 — the hint under the card is the single hint; the
    // above-buttons hint was removed because it created a two-hint
    // layout with a big empty band between them.
    const aboveHint = document.getElementById('rd-cta-hint');
    return {
      hasGated: cta ? cta.classList.contains('rv-cta-gated') : null,
      hasAboveHint: !!aboveHint,
      rvTapText: rvTap ? rvTap.textContent : null,
      rvTapDisplay: rvTap ? getComputedStyle(rvTap).display : null,
      nextOpacity: next ? getComputedStyle(next).opacity : null,
      nextPtrEvents: next ? getComputedStyle(next).pointerEvents : null,
      nextAriaDis: next ? next.getAttribute('aria-disabled') : null,
      shareAriaDis: share ? share.getAttribute('aria-disabled') : null,
      homeAriaDis: home ? home.getAttribute('aria-disabled') : null,
    };
  });
  const gatePass = before.hasGated === true
    && before.hasAboveHint === false
    && before.rvTapText === 'Tap to reveal'
    && before.rvTapDisplay !== 'none'
    && parseFloat(before.nextOpacity) < 0.5
    && before.nextPtrEvents === 'none'
    && before.nextAriaDis === 'true'
    && before.shareAriaDis === 'true'
    && before.homeAriaDis === 'true';
  rec('A. Pre-reveal: CTA gated, single rv-tap hint shown, buttons disabled, no above-hint', gatePass, JSON.stringify(before));

  // Try tapping Next before reveal — section should not advance / no handler fire.
  // We can't easily assert "handler not fired" without a stub; assert that
  // the pointer-events: none means the click isn't dispatched at the DOM level.
  const clickReached = await page.evaluate(() => {
    let fired = false;
    const next = document.getElementById('rd-cta-next');
    const old = next.onclick;
    next.onclick = () => { fired = true; };
    // Use touchscreen.tap-equivalent: dispatch a touchstart+touchend.
    const r = next.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const el = document.elementFromPoint(x, y);
    next.onclick = old;
    return { fired, elAtPoint: el ? el.id || el.className : null };
  });
  // elementFromPoint should NOT return the button because pointer-events: none
  rec('A. Pre-reveal: elementFromPoint over Next does not land on the button',
      clickReached.elAtPoint !== 'rd-cta-next', JSON.stringify(clickReached));
  await ctx.close();
}

// Case B — tap the stage to reveal, then CTAs enable + rv-tap hint hides
{
  const { ctx, page } = await openCtx('en');
  await openFirstMeeting(page);
  await page.evaluate(() => {
    const stg = document.getElementById('rv-stg');
    if (stg && stg.onclick) stg.onclick();
  });
  await page.waitForTimeout(1800);
  const after = await page.evaluate(() => {
    const cta = document.querySelector('.rd-cta');
    const next = document.getElementById('rd-cta-next');
    const rvTap = document.getElementById('rv-tap');
    const root = document.querySelector('#dc-thinker-screen .rv-root');
    return {
      hasRevealed: cta ? cta.classList.contains('rv-cta-revealed') : null,
      hasGated: cta ? cta.classList.contains('rv-cta-gated') : null,
      rvDone: root ? root.classList.contains('rv-done') : null,
      // Round 24 — rv-tap uses `visibility: hidden` post-reveal (was
      // `display: none`) so the stage's leftover height stays constant
      // and the card doesn't shift width through the flip.
      rvTapVisibility: rvTap ? getComputedStyle(rvTap).visibility : null,
      nextOpacity: next ? getComputedStyle(next).opacity : null,
      nextPtrEvents: next ? getComputedStyle(next).pointerEvents : null,
      nextAriaDis: next ? next.getAttribute('aria-disabled') : null,
    };
  });
  const okB = after.hasRevealed === true
    && after.hasGated === false
    && after.rvDone === true
    && after.rvTapVisibility === 'hidden'
    && parseFloat(after.nextOpacity) > 0.9
    && after.nextPtrEvents === 'auto'
    && after.nextAriaDis === null;
  rec('B. Post-reveal: CTA ungated, rv-tap hidden (visibility), buttons enabled', okB, JSON.stringify(after));
  await ctx.close();
}

// Case C — HE: rv-tap hint uses the Hebrew copy
{
  const { ctx, page } = await openCtx('he');
  await openFirstMeeting(page);
  const info = await page.evaluate(() => {
    const t = document.getElementById('rv-tap');
    const aboveHint = document.getElementById('rd-cta-hint');
    return { rvTapText: t ? t.textContent : null, hasAboveHint: !!aboveHint };
  });
  rec('C. HE: rv-tap = "הקישו לחשיפה", no above-buttons hint',
      info.rvTapText === 'הקישו לחשיפה' && !info.hasAboveHint, JSON.stringify(info));
  await ctx.close();
}

// Case D — met-again branch (points > 1) still gates the CTAs until the
// settle moment, then ungates. R27 extended the gate from first-meeting
// only to ALL reveal branches (first-meeting, point-drop plain, frame
// upgrade) so no one blows past the orb landing or the frame arrival on
// a fast tap. The gate is removed when the sequence settles — for a non-
// boundary point-drop (p=5), that is the orb-landed moment inside the
// nested setTimeout chain of _rvV7FlyOrb (600 + 900 + 700 + ... ms;
// empirically within ~3.5 s). The 3500 ms safety-net at
// index.html:48027 is the hard upper bound. Previously this case
// asserted "no gate" for met-again, which was true before R27 and has
// been wrong since. EN + HE screenshots captured for the record.
import { mkdir } from 'node:fs/promises';
const OUT = '/Users/omeroth/CORPUS/design-ref/r40b-met-again';
await mkdir(OUT, { recursive: true });
for (const lang of ['en', 'he']) {
  const { ctx, page } = await openCtx(lang);
  await page.evaluate(() => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    if (typeof _debugThinkerReveal === 'function') {
      _debugThinkerReveal('socrates', 5);
    }
  });
  // Sample at mount: gate must be present + buttons disabled.
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/${lang}-mount.png`, fullPage: false });
  const atMount = await page.evaluate(() => {
    const cta = document.querySelector('.rd-cta');
    const next = document.getElementById('rd-cta-next');
    return {
      hasGated: cta ? cta.classList.contains('rv-cta-gated') : null,
      nextAriaDis: next ? next.getAttribute('aria-disabled') : null,
      nextOpacity: next ? getComputedStyle(next).opacity : null,
    };
  });
  const gatePass = atMount.hasGated === true
    && atMount.nextAriaDis === 'true'
    && parseFloat(atMount.nextOpacity) < 0.5;
  rec(`D.${lang}. Met-again at mount: gate present, buttons disabled (R27 rule — all branches gate)`,
      gatePass, JSON.stringify(atMount));

  // Settle: the orb-land timer chain + ungate must have fired. The
  // 3500 ms safety-net is the hard upper bound. Wait past it, then
  // assert ungated.
  await page.waitForTimeout(3800);
  await page.screenshot({ path: `${OUT}/${lang}-settled.png`, fullPage: false });
  const atSettle = await page.evaluate(() => {
    const cta = document.querySelector('.rd-cta');
    const hint = document.getElementById('rd-cta-hint');
    const next = document.getElementById('rd-cta-next');
    return {
      hasGated: cta ? cta.classList.contains('rv-cta-gated') : null,
      hasRevealed: cta ? cta.classList.contains('rv-cta-revealed') : null,
      hasHint: !!hint,
      nextAriaDis: next ? next.getAttribute('aria-disabled') : null,
      nextOpacity: next ? getComputedStyle(next).opacity : null,
    };
  });
  const ungatePass = atSettle.hasGated === false
    && atSettle.hasRevealed === true
    && !atSettle.hasHint
    && atSettle.nextAriaDis === null
    && parseFloat(atSettle.nextOpacity) > 0.9;
  rec(`D.${lang}. Met-again after settle: ungated, no above-hint, buttons enabled`,
      ungatePass, JSON.stringify(atSettle));
  await ctx.close();
}

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

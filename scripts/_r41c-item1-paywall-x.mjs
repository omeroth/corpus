// R41 C' Finding 1 — paywall X leaves a torn reader state.
//
// Playwright missed this on-device bug because the earlier auto-next
// test (_r39-part2 R41 branch) stopped at "paywall is shown" without
// closing it or inspecting what sits under it. Here we close the X
// and assert that:
//   (a) #screen-reader is NOT left .active with legacy chrome
//       (reader-topbar + reader-progress + section-dots visible).
//   (b) The user ends up on #screen-home.active.
//   (c) The pre-R41 broken state is detectable so this test would
//       have failed before the fix.
//
// Reproduce via git-stash of index.html is out of scope here (we're
// already past the fix); instead we both assert the fixed behaviour
// AND verify the structural shape used by the fix (the `_exitPaywall`
// guard reads `screen-reader.active && !reader-v7 && body !on-reader-v7`).
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r41c-item1-paywall-x';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function srv(root) { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass?'[PASS] ':'[FAIL] ')+name+(note?'  — '+note:'')); }

async function run(lang, label, triggerPaywall, expectsTorn) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    try { localStorage.clear(); } catch (_) {}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    // ch1 all complete, not paid — the exact state of a free user
    // tapping Next Dialogue at the end of ch1 who then meets the
    // paywall for ch2.
    const cd = {};
    for (const d of [1,2,3,4,5,6,7]) cd['philosophy-1-' + d] = true;
    localStorage.setItem('corpus_state', JSON.stringify({
      v: 3, subject: 'philosophy', lang: l, completedDays: cd,
      framesExplainerSeen: true, streakIntroSeen: true,
      currentScreen: 'home', isPaid: false, grandfathered: false,
    }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

  // Reproduce the state the user hit: reader+modal-complete scope got
  // torn down (closeCompleteModal → _exitAllScopes) and the paywall
  // was opened from inside the completion continuation. We can't
  // easily simulate the whole dialogue finish headlessly, so simulate
  // the pre-paywall torn state directly, then open paywall and X.
  await triggerPaywall(page);
  await page.waitForTimeout(600);

  // Assert paywall is open.
  const paywallOpen = await page.evaluate(() => !!document.querySelector('#modal-paywall.active'));
  rec(`${label}: paywall open after trigger`, paywallOpen);
  if (!paywallOpen) { await ctx.close(); return; }

  // Snapshot the torn state the X guard is designed to catch.
  const beforeX = await page.evaluate(() => {
    const sr = document.getElementById('screen-reader');
    return {
      srActive: !!(sr && sr.classList.contains('active')),
      srV7:     !!(sr && sr.classList.contains('reader-v7')),
      bodyV7:   document.body.classList.contains('on-reader-v7'),
    };
  });
  if (expectsTorn) {
    rec(`${label}: torn state present at paywall open (screen-reader.active && !reader-v7 && !on-reader-v7)`,
        beforeX.srActive && !beforeX.srV7 && !beforeX.bodyV7,
        JSON.stringify(beforeX));
  } else {
    rec(`${label}: no torn state (home-origin paywall, reader not .active)`,
        !beforeX.srActive, JSON.stringify(beforeX));
  }

  await page.screenshot({ path: `${OUT}/${lang}-${label.replace(/\s+/g,'_')}-paywall.png`, fullPage: false });

  // Tap X on the paywall.
  await page.evaluate(() => {
    const x = document.querySelector('#modal-paywall .paywall-close');
    if (x) x.click();
  });
  await page.waitForTimeout(500);

  // After X: paywall is gone AND we should be on home (not torn reader).
  const afterX = await page.evaluate(() => {
    const sr = document.getElementById('screen-reader');
    const sh = document.getElementById('screen-home');
    const pw = document.getElementById('modal-paywall');
    return {
      paywallActive: !!(pw && pw.classList.contains('active')),
      srActive: !!(sr && sr.classList.contains('active')),
      shActive: !!(sh && sh.classList.contains('active')),
      currentScreen: (typeof state !== 'undefined' && state) ? state.currentScreen : null,
    };
  });
  rec(`${label}: paywall dismissed after X`, afterX.paywallActive === false, JSON.stringify(afterX));
  rec(`${label}: landed on home (not torn reader)`,
      afterX.shActive === true && afterX.srActive === false,
      JSON.stringify(afterX));

  await page.screenshot({ path: `${OUT}/${lang}-${label.replace(/\s+/g,'_')}-after-x.png`, fullPage: false });
  await ctx.close();
}

for (const lang of ['en', 'he']) {
  // Case 1: chapter-complete-continue path (goToNextLesson's continuation).
  // Simulate the torn state (closeCompleteModal already ran) + open the
  // paywall with the matching source.
  await run(lang, 'end-of-chapter next-dialogue', async (p) => {
    await p.evaluate(() => {
      // Mimic what closeCompleteModal → _exitAllScopes did before showPaywall.
      const sr = document.getElementById('screen-reader');
      if (sr) { sr.classList.add('active'); sr.classList.remove('reader-v7'); }
      document.body.classList.remove('on-reader-v7', 'reader-editorial');
      // Hide all other screens so the test env matches the real flow where
      // _exitAllScopes left screen-reader as the top .active screen.
      document.querySelectorAll('.screen').forEach(s => { if (s.id !== 'screen-reader') s.classList.remove('active'); });
      showPaywall({
        subject: 'philosophy', weekId: 2, dayId: 1,
        source: 'chapter-complete-continue', entry: 'reveal_next',
      });
    });
  }, true);

  // Case 2: lesson-tap paywall (user on home taps a locked chapter 2 card).
  // No torn reader state here; X should just stay on home.
  await run(lang, 'home chapter-lock tap', async (p) => {
    await p.evaluate(() => {
      showPaywall({ subject: 'philosophy', weekId: 2, dayId: 1, source: 'chapter-lock-tap', entry: 'home_card' });
    });
  }, false);
}

await browser.close(); app.s.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

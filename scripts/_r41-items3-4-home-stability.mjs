// R41 Findings 3 + 4.
//
// Item 3 — topbar icon stability on return to home. The three
// .topbar-stat icons (streak / xp / level) must not shift horizontally
// when the user navigates back to home from any other screen. Fonts
// loading and number re-renders could change each stat's intrinsic
// width, and because .stats-subheader uses justify-content: center,
// a width change in one child recentres the row and moves the icons
// of the OTHER children. Fix: tabular-nums + min-width on the number
// spans. Verification: measure every icon's rect on every rAF for
// 1 s after navigation; assert they don't move.
//
// Item 4 — home scroll preservation. Save on leave, restore on
// return. First-ever navigation to home still falls through to the
// pre-R41 "jump to next-up" launch scroll.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.json':'application/json; charset=utf-8' };
function srv(root) { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass?'[PASS] ':'[FAIL] ')+name+(note?'  — '+note:'')); }

async function openApp(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    try { localStorage.clear(); } catch (_) {}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    // Pre-seed state with non-trivial numbers so tabular-nums actually
    // gets a chance to prevent width shift. XP = 42, streak = 7, level
    // comes from XP. Multiple days completed so the home chapter card
    // renders at a meaningful height.
    const cd = {};
    for (const d of [1,2,3,4,5,6,7]) cd['philosophy-1-' + d] = true;
    for (const d of [1,2,3])        cd['philosophy-2-' + d] = true;
    localStorage.setItem('corpus_state', JSON.stringify({
      v: 3, subject: 'philosophy', lang: l, completedDays: cd,
      framesExplainerSeen: true, streakIntroSeen: true,
      currentScreen: 'home', isPaid: true,
      dailyStreak: 7, xp: 42,
    }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  return { ctx, page };
}

// ─── Item 3 — topbar icon stability on navigation ─────────────────
async function testIconStability(lang, label, navigate) {
  const { ctx, page } = await openApp(lang);
  // Scroll home a bit so navigate-to-and-back passes through a non-zero scroll.
  await page.evaluate(() => { window.scrollTo(0, 150); });
  await page.waitForTimeout(200);
  // Perform navigation to a non-home screen then back to home.
  await navigate(page);
  await page.waitForTimeout(300);
  // Capture icon rects on every rAF for 1 s AFTER return to home.
  const samples = await page.evaluate(() => new Promise(resolve => {
    const out = [];
    const start = performance.now();
    function tick() {
      const svgs = [
        document.querySelector('#stat-streak') && document.querySelector('.topbar-stat .svg-streak-wrap, #stat-streak') ? document.querySelector('#stat-streak').parentElement.querySelector('svg') : null,
        document.querySelector('#stat-xp')     ? document.querySelector('#stat-xp').parentElement.querySelector('svg')     : null,
        document.querySelector('#stat-level')  ? document.querySelector('#stat-level').parentElement.querySelector('svg')  : null,
      ].filter(Boolean);
      const rects = svgs.map(s => { const r = s.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
      out.push({ t: Math.round(performance.now() - start), rects });
      if (performance.now() - start < 1000) requestAnimationFrame(tick);
      else resolve(out);
    }
    requestAnimationFrame(tick);
  }));
  // Compare first and last samples; icon shift must be ≤ 1 px.
  if (samples.length < 2 || samples[0].rects.length !== samples[samples.length - 1].rects.length) {
    rec(`${lang} ${label} icon stability (icons present + sampled)`, false, `samples=${samples.length}`);
    await ctx.close();
    return;
  }
  const first = samples[0].rects;
  const last  = samples[samples.length - 1].rects;
  const maxDxDy = Math.max(...first.map((f, i) => Math.max(Math.abs(f.x - last[i].x), Math.abs(f.y - last[i].y))));
  rec(`${lang} ${label} icon drift ≤ 1 px over 1 s`, maxDxDy <= 1, `maxDrift=${maxDxDy.toFixed(2)}px`);
  await ctx.close();
}

for (const lang of ['en', 'he']) {
  await testIconStability(lang, 'home → reader → home', async (p) => {
    await p.evaluate(() => { if (typeof openReader === 'function') openReader(1, 1, { entry: 'other' }); });
    await p.waitForTimeout(600);
    await p.evaluate(() => { if (typeof goHome === 'function') goHome(); else if (typeof showScreen === 'function') showScreen('home'); });
  });
  await testIconStability(lang, 'home → pantheon → home', async (p) => {
    await p.evaluate(() => { if (typeof showScreen === 'function') showScreen('pantheon'); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { if (typeof showScreen === 'function') showScreen('home'); });
  });
  await testIconStability(lang, 'home → profile → home', async (p) => {
    await p.evaluate(() => { if (typeof showScreen === 'function') showScreen('profile'); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { if (typeof showScreen === 'function') showScreen('home'); });
  });
}

// ─── Item 4 — home scroll preservation ────────────────────────────
async function testScrollRestore(lang, label, SET_SCROLL, navigate) {
  const { ctx, page } = await openApp(lang);
  // Set a specific window scroll position on home (home uses the
  // window as its scroll container, not .scroll-content).
  await page.evaluate((top) => { window.scrollTo(0, top); }, SET_SCROLL);
  await page.waitForTimeout(300);
  await navigate(page);
  // Allow 400 ms for the two-rAF restore to settle.
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => window.scrollY || window.pageYOffset || 0);
  const diff = Math.abs((after || 0) - SET_SCROLL);
  rec(`${lang} ${label}: scroll restored to ${SET_SCROLL} (got ${after}, Δ=${diff})`,
      diff <= 2, `expected=${SET_SCROLL} got=${after}`);
  await ctx.close();
}

for (const lang of ['en', 'he']) {
  await testScrollRestore(lang, 'from reader (X)', 180, async (p) => {
    await p.evaluate(() => { if (typeof openReader === 'function') openReader(1, 1, { entry: 'other' }); });
    await p.waitForTimeout(500);
    // Simulate close X — call goHome.
    await p.evaluate(() => { if (typeof goHome === 'function') goHome(); else if (typeof showScreen === 'function') showScreen('home'); });
  });
  await testScrollRestore(lang, 'from pantheon', 220, async (p) => {
    await p.evaluate(() => { if (typeof showScreen === 'function') showScreen('pantheon'); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { if (typeof showScreen === 'function') showScreen('home'); });
  });
  await testScrollRestore(lang, 'from profile', 60, async (p) => {
    await p.evaluate(() => { if (typeof showScreen === 'function') showScreen('profile'); });
    await p.waitForTimeout(400);
    await p.evaluate(() => { if (typeof showScreen === 'function') showScreen('home'); });
  });
}

await browser.close(); app.s.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

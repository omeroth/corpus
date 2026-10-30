// Regression: during the point drop in the first-meeting thinker-card
// screen, the main card's bounding rect must stay constant. We sample
// .rv-flp.getBoundingClientRect() every ~50ms from just before the
// user taps "reveal" through to the point-landing animation completing
// (~1800ms after reveal). The test asserts that the card's left/top
// deviate by at most 1px across all samples (sub-pixel float only).
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
  localStorage.setItem('_corpus_debug', '1');
  localStorage.setItem('_corpus_dev_premium', '1');
  const s = { v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true };
  localStorage.setItem('corpus_state', JSON.stringify(s));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.waitForTimeout(1500);

// Launch the first-meeting reveal screen directly by invoking the renderer.
// Mark the thinker's first dialogue completed so thinkerPoints('socrates')
// returns 1, which _renderV7ThinkerReveal uses to pick the first-meeting
// (rv-first / .rv-flp) branch rather than later-meeting (rv-pc).
await page.evaluate(() => {
  document.body.classList.add('on-reader-v7');
  // modal-complete hosts #dc-thinker-screen — needs to be .active for
  // children to compute layout size.
  const mc = document.getElementById('modal-complete');
  if (mc) {
    mc.classList.add('active');
    mc.style.display = 'flex';
    mc.style.position = 'fixed';
    mc.style.inset = '0';
    mc.style.zIndex = '2000';
  }
  const dc = document.getElementById('dc-thinker-screen');
  if (dc) {
    dc.style.display = 'flex';
    dc.style.width = '100%';
    dc.style.minHeight = '100vh';
    dc.classList.add('rv-v7');
  }
  if (typeof state !== 'undefined') {
    state.completedDays = state.completedDays || {};
    state.completedDays['philosophy-1-1'] = true;
  }
  const t = (typeof getT === 'function') ? getT().find(x => x && x.id === 'socrates') : { id:'socrates', name:'Socrates', image:'./images/socrates.webp' };
  if (typeof _renderV7ThinkerReveal === 'function') {
    _renderV7ThinkerReveal(t, 1, 1, null);
  }
});
await page.waitForTimeout(1500);

// Confirm the card is mounted and visible
const mounted = await page.evaluate(() => {
  const el = document.querySelector('.rv-flp');
  const dc = document.getElementById('dc-thinker-screen');
  return {
    hasEl: !!el,
    elBox: el ? el.getBoundingClientRect() : null,
    dcBox: dc ? dc.getBoundingClientRect() : null,
    dcDisplay: dc ? getComputedStyle(dc).display : null,
    dcStyle: dc ? dc.getAttribute('style') : null,
    html: el ? el.outerHTML.slice(0, 200) : null,
  };
});
console.log('mounted:', JSON.stringify(mounted, null, 2));
if (!mounted.hasEl) {
  console.log('[FAIL] .rv-flp not mounted — reveal screen did not initialize');
  await browser.close(); app.server.close();
  process.exit(1);
}

// Pause the card's hover animation so we only measure drop-caused drift.
await page.evaluate(() => {
  const flp = document.querySelector('.rv-flp');
  if (flp) flp.style.animation = 'none';
});

// Tap the "reveal" overlay to start the reveal → point-drop sequence.
await page.evaluate(() => {
  const tap = document.querySelector('#rv-tap');
  const flp = document.querySelector('#rv-flp');
  (tap || flp)?.click();
});

// Sample .rv-flp.getBoundingClientRect() every 50ms for 2500ms,
// capturing BEFORE / DURING / AFTER the point drop.
const samples = [];
const start = Date.now();
while (Date.now() - start < 2800) {
  const r = await page.evaluate(() => {
    const el = document.querySelector('.rv-flp');
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { t: Math.round(performance.now()), x: b.x, y: b.y, w: b.width, h: b.height };
  });
  if (r) samples.push(r);
  await page.waitForTimeout(50);
}

await browser.close(); app.server.close();

// Normalize to the first sample so we measure drift, not absolute position.
const base = samples[0];
let maxDx = 0, maxDy = 0, maxDw = 0, maxDh = 0;
for (const s of samples) {
  maxDx = Math.max(maxDx, Math.abs(s.x - base.x));
  maxDy = Math.max(maxDy, Math.abs(s.y - base.y));
  maxDw = Math.max(maxDw, Math.abs(s.w - base.w));
  maxDh = Math.max(maxDh, Math.abs(s.h - base.h));
}

console.log(`samples=${samples.length} maxDx=${maxDx.toFixed(2)} maxDy=${maxDy.toFixed(2)} maxDw=${maxDw.toFixed(2)} maxDh=${maxDh.toFixed(2)}`);
console.log('first=', JSON.stringify(base));
console.log('last =', JSON.stringify(samples[samples.length - 1]));

// Tolerance: 1px drift allowed for sub-pixel float.
const pass = maxDx <= 1 && maxDy <= 1 && maxDw <= 1 && maxDh <= 1;
console.log(pass
  ? '\n✓ PASS — card bounding rect stays constant during point drop'
  : '\n✗ FAIL — card moved mid-drop (max dx=' + maxDx + ' dy=' + maxDy + ' dw=' + maxDw + ' dh=' + maxDh + ')');
process.exit(pass ? 0 : 1);

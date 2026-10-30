// Reproduce device-like failure conditions for the home-tap →
// popover regression. Playwright base, plus:
//   - CPU throttling 4× via CDP
//   - Image decode delay (route handler adds 500 ms per <img> fetch)
//   - Larger simulated state (more completed days = deeper home +
//     later ResizeObserver traffic + more thinker PNGs to decode)
//   - Tap TIMING: fires taps at 300 ms, 900 ms, 1500 ms after screen
//     mount — the window where _hvAwaitLayoutSettled is pending on
//     slow devices.
//   - Resume case: visibilitychange hidden → visible, then tap.
//
// Each case: PASS = popover opens with the correct lesson title +
// correct btn kind for the tapped node AND stays open 500 ms later.
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

// Build a "dense" state resembling a real returning user: chapter 1
// fully complete, chapter 2 half complete, chapter 3 one lesson, etc.
// More completed days + more unlocked thinker PNGs below the fold.
function denseState() {
  const completed = {};
  for (let d = 1; d <= 7; d++) completed[`philosophy-1-${d}`] = true;
  for (let d = 1; d <= 4; d++) completed[`philosophy-2-${d}`] = true;
  completed['philosophy-3-1'] = true;
  return { v:3, subject:'philosophy', lang:'en',
    completedDays: completed,
    framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
    bonusUnlockShown:{philosophy:true},
    dailyStreak:12, xp:980, currentScreen:'home',
    thinkerPointsMap:{ socrates:3, plato:2, aristotle:1, aurelius:1, descartes:1 },
  };
}

async function freshPage(opts) {
  opts = opts || {};
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  // Image decode delay (device condition).
  if (opts.slowImages) {
    await page.route(/\.(webp|png|jpg|jpeg|svg)$/, async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.continue();
    });
  }
  // State seed.
  await page.addInitScript((seed) => {
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'web', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    try {
      localStorage.setItem('corpus_onboarding_done', '1');
      localStorage.setItem('corpus_walkthrough_done', '1');
      localStorage.setItem('corpus_subject', 'philosophy');
      localStorage.setItem('corpus_state', JSON.stringify(seed));
    } catch(_){}
  }, opts.state || denseState());
  // CPU throttle (device condition).
  if (opts.cpuThrottle) {
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: opts.cpuThrottle });
  }
  const nav = page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'commit' });
  await nav;
  return { ctx, page };
}

async function tapNode(page, selector) {
  const h = await page.evaluateHandle((sel) => {
    const el = document.querySelector(sel)?.closest('.hv-node');
    if (el) el.scrollIntoView({ block: 'center' });
    return el;
  }, selector);
  const el = h.asElement();
  if (!el) return false;
  // Wait a frame so scrollIntoView settles.
  await page.waitForTimeout(60);
  const box = await el.boundingBox();
  if (!box) return false;
  await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
  return true;
}
async function popState(page) {
  return page.evaluate(() => {
    const pop = document.getElementById('hv-popover');
    if (!pop) return { open: false };
    const title = (pop.querySelector('.hv-pop-title')||{}).textContent || '';
    const sub = (pop.querySelector('.hv-pop-sub')||{}).textContent || '';
    const btn = pop.querySelector('.hv-pop-btn');
    const btnKind = btn ? (btn.className.match(/hv-pop-btn-(\w+)/)||[])[1] : '';
    return {
      open: pop.style.display === 'block' && getComputedStyle(pop).display !== 'none',
      title, sub, btnKind,
    };
  });
}

const results = [];
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

// ──────────────────────────────────────────────
// Device case 1: dense state + CPU 4× + slow images + tap at 300 ms
// (while _hvAwaitLayoutSettled is still pending on fonts/images)
// ──────────────────────────────────────────────
{
  const { ctx, page } = await freshPage({ cpuThrottle: 4, slowImages: true });
  // Wait only for the first paint of home, NOT for the launch popover.
  await page.waitForSelector('.lesson-circle', { timeout: 15000 });
  await page.waitForTimeout(300);
  // Tap any completed node EARLY (settle still pending).
  const tapped = await tapNode(page, '.lesson-circle.completed');
  // Sample every 150ms for 2 seconds to see WHEN popover opens / closes
  const samples = [];
  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(150);
    const s = await popState(page);
    samples.push({ t: (i+1)*150, open: s.open, title: s.title && s.title.slice(0,30), kind: s.btnKind });
  }
  const p = await popState(page);
  const everOpen = samples.some(s => s.open);
  const openAtEnd = p.open;
  const pass = tapped && openAtEnd && p.btnKind === 'review';
  rec('1: 4× CPU + slow img + 300 ms tap of completed', pass, `tapped=${tapped} openAtEnd=${openAtEnd} everOpen=${everOpen}\n  samples: ${samples.map(s => `${s.t}:${s.open ? ('open['+s.kind+']/'+s.title) : 'closed'}`).join(' | ')}`);
  await ctx.close();
}

// ──────────────────────────────────────────────
// Device case 2: tap next-up at 900 ms (mid-settle)
// ──────────────────────────────────────────────
{
  const { ctx, page } = await freshPage({ cpuThrottle: 4, slowImages: true });
  await page.waitForSelector('.lesson-circle.next-up', { timeout: 15000 });
  await page.waitForTimeout(900);
  const tapped = await tapNode(page, '.lesson-circle.next-up');
  await page.waitForTimeout(700);
  const p = await popState(page);
  await page.waitForTimeout(500);
  const p2 = await popState(page);
  const pass = tapped && p.open && p2.open && p.btnKind === 'start';
  rec('2: 4× CPU + slow img + 900 ms tap of next-up', pass, `tapped=${tapped} first=${JSON.stringify(p)} after500=${JSON.stringify(p2)}`);
  await ctx.close();
}

// ──────────────────────────────────────────────
// Device case 3: launch popover opens → tap DIFFERENT node → switches
// (dense state means launch popover may open before tap on slow sim)
// ──────────────────────────────────────────────
{
  const { ctx, page } = await freshPage({ cpuThrottle: 4, slowImages: true });
  await page.waitForSelector('.lesson-circle.next-up', { timeout: 15000 });
  await page.waitForTimeout(2500);
  const before = await popState(page);
  const tapped = await tapNode(page, '.lesson-circle.completed');
  await page.waitForTimeout(500);
  const after = await popState(page);
  const switched = tapped && after.open && after.title && after.title !== before.title;
  rec('3: launch popover open → tap other node → switches', switched, `tapped=${tapped} before=${JSON.stringify(before)} after=${JSON.stringify(after)}`);
  await ctx.close();
}

// ──────────────────────────────────────────────
// Device case 4: resume from background (visibilitychange) + tap
// ──────────────────────────────────────────────
{
  const { ctx, page } = await freshPage({ cpuThrottle: 4, slowImages: true });
  await page.waitForSelector('.lesson-circle', { timeout: 15000 });
  await page.waitForTimeout(2500);
  // Simulate background → foreground.
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  // Tap a completed node.
  const tapped = await tapNode(page, '.lesson-circle.completed');
  await page.waitForTimeout(700);
  const p = await popState(page);
  const pass = tapped && p.open && p.btnKind === 'review';
  rec('4: resume (visibilitychange) + tap completed', pass, `tapped=${tapped} ${JSON.stringify(p)}`);
  await ctx.close();
}

// ──────────────────────────────────────────────
// Device case 5: tap during the first 100 ms (BEFORE _hvAwaitLayoutSettled
// starts). The dense state should mean home is painting mid-tap.
// ──────────────────────────────────────────────
{
  const { ctx, page } = await freshPage({ cpuThrottle: 4, slowImages: true });
  // Wait only for any lesson-circle to exist, not fully paint.
  await page.waitForSelector('.lesson-circle.next-up', { timeout: 15000 });
  await page.waitForTimeout(50);
  const tapped = await tapNode(page, '.lesson-circle.next-up');
  await page.waitForTimeout(1200);
  const p = await popState(page);
  const pass = tapped && p.open;
  rec('5: tap 50 ms after .lesson-circle appears (mid-paint)', pass, `tapped=${tapped} ${JSON.stringify(p)}`);
  await ctx.close();
}

// ──────────────────────────────────────────────
// Device case 6: double tap — user taps once, nothing visually happens
// (slow device), taps again. Must not require two taps.
// ──────────────────────────────────────────────
{
  const { ctx, page } = await freshPage({ cpuThrottle: 4, slowImages: true });
  await page.waitForSelector('.lesson-circle.next-up', { timeout: 15000 });
  await page.waitForTimeout(500);
  // Instrument to count node onclick invocations.
  await page.evaluate(() => {
    window.__nodeClicks = 0;
    const nodes = document.querySelectorAll('.hv-node');
    for (const n of nodes) {
      const orig = n.onclick;
      n.onclick = (e) => { window.__nodeClicks++; return orig && orig.call(n, e); };
    }
  });
  await tapNode(page, '.lesson-circle.next-up');
  await page.waitForTimeout(50);
  const afterFirst = await popState(page);
  const clicksAfterFirst = await page.evaluate(() => window.__nodeClicks);
  rec('6a: single tap registers node.onclick', clicksAfterFirst >= 1, `clicks=${clicksAfterFirst} pop=${JSON.stringify(afterFirst)}`);
  await page.waitForTimeout(500);
  const afterSettle = await popState(page);
  rec('6b: single tap opens popover (after 550 ms)', afterSettle.open, `${JSON.stringify(afterSettle)}`);
  await ctx.close();
}

await browser.close(); app.server.close();

console.log('\n═══ Home-tap DEVICE regression ═══');
for (const r of results) console.log((r.pass ? ' ✓ ' : ' ✗ ') + r.name);
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

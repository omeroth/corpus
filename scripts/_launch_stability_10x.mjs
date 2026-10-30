// 10 cold-launches against the live www/ bundle. For each: wait until
// the launch jump has settled, then read:
//   - final scrollTop of document.scrollingElement
//   - next-up node getBoundingClientRect().top
//   - viewport height
//   - whether the node is centred (|top - innerHeight * 0.45| < 20)
//   - number of distinct scrollTop writes observed in the first 4 s
//     (instrumented via Object.defineProperty override)
// Reports a table.
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
for (let i = 0; i < 10; i++) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'web', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    try {
      localStorage.setItem('corpus_onboarding_done', '1');
      localStorage.setItem('corpus_walkthrough_done', '1');
      localStorage.setItem('corpus_subject', 'philosophy');
      const s = { v:3, subject:'philosophy', lang:'en', completedDays:{'philosophy-1-2':true}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true}, dailyStreak:5, xp:120, currentScreen:'home' };
      localStorage.setItem('corpus_state', JSON.stringify(s));
    } catch(_){}
    // Instrument scrollTop setter to count distinct writes.
    window.__scrollWrites = [];
    const se = document.scrollingElement || document.documentElement;
    // Can't easily patch scrollTop; use a scroll event listener instead.
    const trackedY = () => (document.scrollingElement||document.documentElement).scrollTop;
    const t0 = performance.now();
    let lastY = -1;
    const onScr = () => {
      const y = trackedY();
      if (Math.abs(y - lastY) > 1) {
        window.__scrollWrites.push({ t: Math.round(performance.now()-t0), y: Math.round(y) });
        lastY = y;
      }
    };
    document.addEventListener('scroll', onScr, { passive: true });
    window.addEventListener('scroll', onScr, { passive: true });
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 10000 });
  // Give the launch jump its settle window (fonts + images + rAFs + the
  // scroll + popover).
  await page.waitForTimeout(2500);
  const res = await page.evaluate(() => {
    const se = document.scrollingElement || document.documentElement;
    const node = document.querySelector('.lesson-circle.next-up')?.closest('.hv-node');
    const r = node ? node.getBoundingClientRect() : null;
    const target = innerHeight * 0.45;
    const centred = r ? (Math.abs(r.top - target) < 20) : false;
    const pop = document.getElementById('hv-popover');
    return {
      scrollTop: Math.round(se.scrollTop),
      scrollHeight: se.scrollHeight,
      viewportH: innerHeight,
      nodeTop: r ? Math.round(r.top) : null,
      targetY: Math.round(target),
      deltaFromCentre: r ? Math.round(r.top - target) : null,
      centred,
      popDisplay: pop ? pop.style.display : null,
      scrollWriteCount: (window.__scrollWrites||[]).length,
      scrollWrites: (window.__scrollWrites||[]).slice(0, 10),
    };
  });
  results.push({ run: i+1, ...res });
  console.log(`[${i+1}] scrollTop=${res.scrollTop} nodeTop=${res.nodeTop} delta=${res.deltaFromCentre} centred=${res.centred} pop=${res.popDisplay} writes=${res.scrollWriteCount}`);
  await ctx.close();
}
await browser.close(); app.server.close();
const centreOk = results.filter(r => r.centred).length;
console.log(`\nSummary: ${centreOk}/10 centred within 20 px; popover block in ${results.filter(r=>r.popDisplay==='block').length}/10`);

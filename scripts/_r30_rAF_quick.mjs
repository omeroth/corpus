// Quick rAF stability on 393×852 EN p=3 only (mid-round rule).
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
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.addStyleTag({ content: `body.on-reader-v7 #dc-thinker-screen.rv-v7 .rv-pc { animation: none !important; }` });

const samples = await page.evaluate(async () => {
  document.body.classList.add('on-reader-v7');
  document.body.classList.add('reader-editorial');
  _debugThinkerReveal('socrates', 3);
  const out = [];
  const start = performance.now();
  return new Promise((resolve) => {
    function frame() {
      const img = document.querySelector('#dc-thinker-screen .rv-pc .rv-art img:not(.rv-frame), #dc-thinker-screen .rv-pc .rv-face img:not(.rv-frame)');
      const elapsed = performance.now() - start;
      const framed = !!document.querySelector('.rv-root.rv-framed');
      const focus = !!document.querySelector('.rv-root.rv-focus');
      if (img) {
        const r = img.getBoundingClientRect();
        out.push({ t: Math.round(elapsed), framed, focus, x: r.left, y: r.top, w: r.width, h: r.height });
      }
      if (elapsed > 8000) return resolve(out);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
});
// Find stable reference (first 4-sample window all within 1px of each other).
let refIdx = -1;
for (let i = 0; i < samples.length - 3; i++) {
  const s0 = samples[i];
  if ([1,2,3].every(k => {
    const sk = samples[i+k];
    return Math.abs(sk.x - s0.x) <= 1 && Math.abs(sk.y - s0.y) <= 1 && Math.abs(sk.w - s0.w) <= 1 && Math.abs(sk.h - s0.h) <= 1;
  })) { refIdx = i; break; }
}
if (refIdx < 0) { console.log('no stable reference'); process.exit(1); }
const ref = samples[refIdx];
console.log('ref @', ref.t, 'ms =', ref.x, ref.y, ref.w, 'x', ref.h);
console.log(samples.length, 'total samples');
let maxDy = 0, maxTs = 0;
const jumps = [];
for (let i = refIdx + 1; i < samples.length; i++) {
  const s = samples[i];
  const dy = Math.abs(s.y - ref.y);
  if (dy > 1) {
    jumps.push({ t: s.t, dy: dy.toFixed(1), y: s.y, framed: s.framed, focus: s.focus });
  }
  if (dy > maxDy) { maxDy = dy; maxTs = s.t; }
}
console.log('max dy:', maxDy.toFixed(1), 'px @', maxTs, 'ms');
console.log('frames with dy > 1px:', jumps.length);
console.log('first 10 jumps:', jumps.slice(0, 10));

await browser.close();
app.server.close();

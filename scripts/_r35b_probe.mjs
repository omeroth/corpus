// R35b — focused WebKit 393 EN probe for p=2/3/6.
// Records art.x on every rAF for 8 s after mount; prints min/max/range
// and every change > 0.3 px with its timestamp. Also records a video
// of ONE p=3 run so we can see the wobble.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round35b';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function startServer(root) {
  const server = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(root, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await webkit.launch({ headless: true });

async function probe(points, { record = false } = {}) {
  const ctxOpts = { viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  if (record) ctxOpts.recordVideo = { dir: OUT, size: { width: 393, height: 852 } };
  const ctx = await browser.newContext(ctxOpts);
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
  const samples = await page.evaluate(async (p) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', p);
    const out = [];
    const start = performance.now();
    return new Promise((resolve) => {
      function frame() {
        const img = document.querySelector('#dc-thinker-screen .rv-pc .rv-art img:not(.rv-frame), #dc-thinker-screen .rv-pc .rv-face img:not(.rv-frame), #dc-thinker-screen .rv-flp .rv-art img:not(.rv-frame)');
        const elapsed = performance.now() - start;
        if (img) {
          const r = img.getBoundingClientRect();
          out.push({ t: Math.round(elapsed), x: r.left });
        }
        if (elapsed > 8000) { resolve(out); return; }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
  }, points);
  const videoPath = record ? await page.video().path() : null;
  await ctx.close();
  // Analysis
  if (samples.length < 10) { console.log(`p=${points}: too few samples (${samples.length})`); return; }
  const xs = samples.map(s => s.x);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  console.log(`\n=== p=${points} (${samples.length} rAF samples over 8s) ===`);
  console.log(`  xmin=${xmin.toFixed(3)}  xmax=${xmax.toFixed(3)}  range=${(xmax-xmin).toFixed(3)}px`);
  // Changes > 0.3 px between consecutive samples
  let last = samples[0].x;
  const jumps = [];
  for (let i = 1; i < samples.length; i++) {
    const dx = samples[i].x - last;
    if (Math.abs(dx) > 0.3) {
      jumps.push({ t: samples[i].t, from: last, to: samples[i].x, dx });
      last = samples[i].x;
    }
  }
  console.log(`  ${jumps.length} change(s) > 0.3 px:`);
  for (const j of jumps) {
    console.log(`    t=${String(j.t).padStart(5)}ms  ${j.from.toFixed(3)} → ${j.to.toFixed(3)}  (dx=${j.dx > 0 ? '+' : ''}${j.dx.toFixed(3)})`);
  }
  if (videoPath) console.log(`  video → ${videoPath}`);
}

await probe(2);
await probe(3, { record: true });
await probe(6);

await browser.close(); app.server.close();

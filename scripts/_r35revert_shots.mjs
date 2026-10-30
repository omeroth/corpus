// R35 revert — screenshot the legacy v7 reveal screen with the
// canvas-based card at 393 EN for point (p=2), bronze upgrade
// settled (p=3), first-meeting (p=1). Also assert the composed-card
// canvas rect is constant through 8s.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/r35revert';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function srv(root) { const s = createServer(async(req,res) => { try { let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/'||p==='') p='/index.html'; const abs = join(root,p); res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'}); res.end(await readFile(abs)); } catch(e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
async function shoot(label, points, settleMs) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('_corpus_debug', '1');
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true }));
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.evaluate((p) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', p);
  }, points);
  // Wait for the composed canvas to appear.
  await page.waitForSelector('#dc-thinker-screen canvas.rv-bmp-canvas', { timeout: 8000 });
  // Settle through sequence.
  await page.waitForTimeout(settleMs);
  // Sample canvas rect every rAF for 2s.
  const stab = await page.evaluate(() => {
    const canvas = document.querySelector('#dc-thinker-screen canvas.rv-bmp-canvas');
    if (!canvas) return { skip: true };
    const rects = [];
    return new Promise(res => {
      const start = performance.now();
      function f() {
        const r = canvas.getBoundingClientRect();
        rects.push({ t: Math.round(performance.now() - start), x: r.left, y: r.top, w: r.width, h: r.height });
        if (rects.length > 120) return res(rects);
        requestAnimationFrame(f);
      }
      requestAnimationFrame(f);
    });
  });
  const xs = stab.map(s => s.x), ws = stab.map(s => s.w);
  const xrng = Math.max(...xs) - Math.min(...xs);
  const wrng = Math.max(...ws) - Math.min(...ws);
  console.log(`${label}: canvas x=${xs[0].toFixed(2)} w=${ws[0].toFixed(2)}  x range=${xrng.toFixed(2)}px w range=${wrng.toFixed(2)}px`);
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: false });
  await ctx.close();
}
await shoot('point-393-en', 2, 2000);
await shoot('bronze-settled-393-en', 3, 5500);
await shoot('first-393-en', 1, 1500);
await browser.close(); app.s.close();
console.log('shots →', OUT);

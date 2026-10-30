// R35i — force the stage to be visibly off-centre (padding-left: 26 px)
// so if any JS/CSS tries to centre the card during the celebration,
// the motion is reproducible. Bronze upgrade on WebKit DPR 3, 393 EN.
// Samples composed <img.rv-bmp> rect every rAF for the full sequence.
// Pass criterion: zero change in x > 0.5 px after the stage settles.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round35i';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function srv(root) { const s = createServer(async(req,res) => { try { let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/'||p==='') p='/index.html'; const abs = join(root,p); res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'}); res.end(await readFile(abs)); } catch(e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
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
// Force the stage asymmetric so the on-device "shift right" vector reproduces here.
await page.addStyleTag({ content: `
  body.on-reader-v7 #dc-thinker-screen.rv-v7 .rv-stage {
    padding-left: 26px !important;
    width: auto !important;
    max-width: 310px !important;
  }
` });
const samples = await page.evaluate(async () => {
  document.body.classList.add('on-reader-v7');
  document.body.classList.add('reader-editorial');
  _debugThinkerReveal('socrates', 3);
  const out = [];
  const start = performance.now();
  return new Promise((resolve) => {
    function frame() {
      const bmp = document.querySelector('#dc-thinker-screen img.rv-bmp.rv-bmp-a') || document.querySelector('#dc-thinker-screen img.rv-bmp');
      const stg = document.querySelector('#dc-thinker-screen .rv-stage');
      const pc  = document.querySelector('#dc-thinker-screen .rv-pc');
      const elapsed = performance.now() - start;
      if (bmp && stg && pc) {
        const br = bmp.getBoundingClientRect();
        out.push({
          t: Math.round(elapsed),
          bmpX: br.left,
          bmpY: br.top,
          bmpW: br.width,
          bmpH: br.height,
          pcTf: getComputedStyle(pc).transform,
          stgTf: getComputedStyle(stg).transform,
        });
      }
      if (elapsed > 9000) { resolve(out); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
});

console.log(`== ${samples.length} rAF samples ==`);
const xs = samples.map(s => s.bmpX);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const ws = samples.map(s => s.bmpW);
const wmin = Math.min(...ws), wmax = Math.max(...ws);
console.log(`bmp x range: ${xmin.toFixed(2)} → ${xmax.toFixed(2)}  (Δ ${(xmax-xmin).toFixed(2)}px)`);
console.log(`bmp w range: ${wmin.toFixed(2)} → ${wmax.toFixed(2)}  (Δ ${(wmax-wmin).toFixed(2)}px)`);
// Every change > 0.5 px.
let last = samples[0];
const jumps = [];
for (let i = 1; i < samples.length; i++) {
  const s = samples[i];
  const dx = Math.abs(s.bmpX - last.bmpX);
  const dw = Math.abs(s.bmpW - last.bmpW);
  if (dx > 0.5 || dw > 0.5) {
    jumps.push({ t: s.t, dx: dx.toFixed(2), dw: dw.toFixed(2), x: s.bmpX.toFixed(2), w: s.bmpW.toFixed(2), pcTf: s.pcTf, stgTf: s.stgTf });
    last = s;
  }
}
console.log(`${jumps.length} rect changes > 0.5 px:`);
jumps.slice(0, 10).forEach(j => console.log(`  t=${String(j.t).padStart(5)}ms  x=${j.x} (Δ${j.dx})  w=${j.w} (Δ${j.dw})  pc.tf=${j.pcTf.slice(0,30)}  stg.tf=${j.stgTf.slice(0,30)}`));
console.log(jumps.length === 0 ? '[PASS] zero rect changes > 0.5 px even with asymmetric stage padding' : `[FAIL] ${jumps.length} rect changes`);

await browser.close(); app.s.close();

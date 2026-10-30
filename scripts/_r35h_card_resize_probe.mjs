// R35h — targeted probe for the on-device card-resize jump at
// celebration start. Measures the composed <img.rv-bmp> rect + the
// .rv-stage transform matrix EVERY rAF during the full bronze
// upgrade (p=3), with celebration enabled, in WebKit at DPR 3.
// Reports every width or height change > 0.5 px and the class list
// on .rv-root at that moment, so we can correlate size changes with
// class toggles.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round35h';
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
      const root = document.querySelector('#dc-thinker-screen .rv-root');
      const elapsed = performance.now() - start;
      if (bmp && stg && pc) {
        const br = bmp.getBoundingClientRect();
        const sr = stg.getBoundingClientRect();
        const pr = pc.getBoundingClientRect();
        out.push({
          t: Math.round(elapsed),
          bmp: { x: br.left, y: br.top, w: br.width, h: br.height },
          pc:  { x: pr.left, y: pr.top, w: pr.width, h: pr.height, tf: getComputedStyle(pc).transform },
          stg: { x: sr.left, y: sr.top, w: sr.width, h: sr.height, tf: getComputedStyle(stg).transform },
          rootCls: root ? root.className : '',
        });
      }
      if (elapsed > 9000) { resolve(out); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
});

// Print every bmp/pc/stg size change > 0.5 px plus the root class at that moment.
console.log(`== ${samples.length} rAF samples captured ==`);
let last = null;
let changes = 0;
for (const s of samples) {
  if (!last) { last = s; continue; }
  const dwBmp = Math.abs(s.bmp.w - last.bmp.w);
  const dhBmp = Math.abs(s.bmp.h - last.bmp.h);
  const dwPc  = Math.abs(s.pc.w  - last.pc.w);
  const dhPc  = Math.abs(s.pc.h  - last.pc.h);
  const dwStg = Math.abs(s.stg.w - last.stg.w);
  const dhStg = Math.abs(s.stg.h - last.stg.h);
  const clsChanged = s.rootCls !== last.rootCls;
  if (dwBmp > 0.5 || dhBmp > 0.5 || dwPc > 0.5 || dhPc > 0.5 || dwStg > 0.5 || dhStg > 0.5 || clsChanged) {
    changes++;
    console.log(`t=${String(s.t).padStart(5)}ms`);
    if (dwBmp > 0.5 || dhBmp > 0.5) console.log(`   BMP: ${last.bmp.w.toFixed(1)}×${last.bmp.h.toFixed(1)} → ${s.bmp.w.toFixed(1)}×${s.bmp.h.toFixed(1)} (Δ ${dwBmp.toFixed(2)}×${dhBmp.toFixed(2)})`);
    if (dwPc > 0.5 || dhPc > 0.5)   console.log(`   PC:  ${last.pc.w.toFixed(1)}×${last.pc.h.toFixed(1)} → ${s.pc.w.toFixed(1)}×${s.pc.h.toFixed(1)} (Δ ${dwPc.toFixed(2)}×${dhPc.toFixed(2)})`);
    if (dwStg > 0.5 || dhStg > 0.5) console.log(`   STG: ${last.stg.w.toFixed(1)}×${last.stg.h.toFixed(1)} → ${s.stg.w.toFixed(1)}×${s.stg.h.toFixed(1)} (Δ ${dwStg.toFixed(2)}×${dhStg.toFixed(2)})`);
    if (clsChanged) console.log(`   CLS: "${last.rootCls}" → "${s.rootCls}"`);
    last = s;
  }
}
if (changes === 0) console.log('[PASS] no size change > 0.5 px across the whole sequence');
else console.log(`\n[OBSERVED] ${changes} rect / class changes above threshold`);

const first = samples[0], mid = samples[Math.floor(samples.length / 2)], tail = samples[samples.length - 1];
console.log(`\nStart  @${first.t}ms: BMP ${first.bmp.w.toFixed(1)}×${first.bmp.h.toFixed(1)} x=${first.bmp.x.toFixed(2)}`);
console.log(`Mid    @${mid.t}ms:   BMP ${mid.bmp.w.toFixed(1)}×${mid.bmp.h.toFixed(1)} x=${mid.bmp.x.toFixed(2)}`);
console.log(`End    @${tail.t}ms:  BMP ${tail.bmp.w.toFixed(1)}×${tail.bmp.h.toFixed(1)} x=${tail.bmp.x.toFixed(2)}`);
await browser.close(); app.s.close();

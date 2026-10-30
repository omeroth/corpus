// R35g — device-equivalent probe. During the bronze upgrade on 393
// EN, rAF-sample EVERY <img> whose src references the thinker's art,
// plus EVERY element with position: fixed covering the viewport.
// Report:
//   • per-img rect series (min/max x,y + each change > 0.3 px)
//   • per-fixed-element rect series (same)
//   • the overlay's own paint box
// Catches the "card copy on a full-screen overlay" bug the earlier
// .rv-art-only probe missed.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round35g';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function srv(root) { const s = createServer(async(req,res) => { try { let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/'||p==='') p='/index.html'; const abs = join(root,p); res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'}); res.end(await readFile(abs)); } catch(e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, recordVideo: { dir: OUT, size: { width: 393, height: 852 } } });
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
  _debugThinkerReveal('socrates', 3);  // bronze upgrade (plain → bronze)
  const out = [];
  const start = performance.now();
  return new Promise((resolve) => {
    function frame() {
      const t = Math.round(performance.now() - start);
      // Every <img> in the document whose src contains "socrates" OR
      // "reveal_bronze" OR is a blob (composed bitmap) — all variants
      // of the thinker-art-containing imgs.
      const imgs = Array.from(document.querySelectorAll('img'));
      const matching = imgs.filter(img => {
        const s = (img.src || '').toLowerCase();
        return s.includes('socrates') || s.includes('reveal_') || s.startsWith('blob:');
      });
      // Every element with computed position: fixed that covers > 50 %
      // of the viewport (a candidate full-screen overlay).
      const fixed = [];
      const all = document.querySelectorAll('body *');
      const vw = window.innerWidth, vh = window.innerHeight;
      all.forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed') return;
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const r = el.getBoundingClientRect();
        if (r.width * r.height < vw * vh * 0.5) return;
        fixed.push({ tag: el.tagName, cls: el.className, zIndex: cs.zIndex, filter: cs.filter, opacity: cs.opacity, rect: { x: r.left, y: r.top, w: r.width, h: r.height } });
      });
      const imgData = matching.map((img, i) => {
        const r = img.getBoundingClientRect();
        return { i, cls: img.className, src: img.src.slice(-40), rect: { x: r.left, y: r.top, w: r.width, h: r.height } };
      });
      out.push({ t, imgs: imgData, fixed });
      if (t > 9000) { resolve(out); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
});

// Analyse: for each img that appears across samples (keyed by className + src tail),
// compute the min/max x and each > 0.3 px x change.
const byKey = new Map();
samples.forEach(s => s.imgs.forEach(im => {
  const k = im.cls + '|' + im.src;
  if (!byKey.has(k)) byKey.set(k, []);
  byKey.get(k).push({ t: s.t, ...im.rect });
}));
console.log(`== IMG PROBE: ${byKey.size} distinct img key(s) seen across ${samples.length} rAF frames ==`);
for (const [key, series] of byKey) {
  const xs = series.map(s => s.x);
  const xmin = Math.min(...xs), xmax = Math.max(...xs);
  const jumps = [];
  for (let i = 1; i < series.length; i++) {
    if (Math.abs(series[i].x - series[i-1].x) > 0.3) jumps.push({ t: series[i].t, from: series[i-1].x.toFixed(2), to: series[i].x.toFixed(2) });
  }
  console.log(`  [${series.length} frames]  ${key}`);
  console.log(`    x: ${xmin.toFixed(2)} → ${xmax.toFixed(2)}  range=${(xmax-xmin).toFixed(2)}px  jumps=${jumps.length}`);
  if (jumps.length) {
    jumps.slice(0, 6).forEach(j => console.log(`      t=${String(j.t).padStart(5)}ms  ${j.from} → ${j.to}`));
    if (jumps.length > 6) console.log(`      ... +${jumps.length - 6} more`);
  }
}

const fixedByCls = new Map();
samples.forEach(s => s.fixed.forEach(f => {
  const k = f.cls || f.tag;
  if (!fixedByCls.has(k)) fixedByCls.set(k, []);
  fixedByCls.get(k).push({ t: s.t, ...f.rect, filter: f.filter, opacity: f.opacity });
}));
console.log(`\n== FIXED FULL-SCREEN ELEMENT PROBE: ${fixedByCls.size} distinct ==`);
for (const [cls, series] of fixedByCls) {
  console.log(`  [${series.length} frames]  ${cls}`);
  const first = series[0], last = series[series.length - 1];
  console.log(`    first: t=${first.t}ms  rect=(${first.x.toFixed(0)},${first.y.toFixed(0)}, ${first.w.toFixed(0)}×${first.h.toFixed(0)})  filter=${first.filter}  opacity=${first.opacity}`);
  console.log(`    last:  t=${last.t}ms   rect=(${last.x.toFixed(0)},${last.y.toFixed(0)}, ${last.w.toFixed(0)}×${last.h.toFixed(0)})  filter=${last.filter}  opacity=${last.opacity}`);
}

const videoPath = await page.video().path();
await ctx.close(); await browser.close(); app.s.close();
console.log(`\nvideo → ${videoPath}`);

import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round35j';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function srv(root) { const s = createServer(async(req,res) => { try { let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/'||p==='') p='/index.html'; const abs = join(root,p); res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'}); res.end(await readFile(abs)); } catch(e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
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
await page.evaluate(() => {
  document.body.classList.add('on-reader-v7');
  document.body.classList.add('reader-editorial');
  _debugThinkerReveal('socrates', 3);
});
// Mid-celebration: after rv-focus + fbg mounts + rays spin a bit, before flash.
await page.waitForSelector('.rv-fbg.rv-on', { timeout: 10000 });
await page.waitForTimeout(1500);  // let rays rotate
await page.screenshot({ path: join(OUT, 'bronze-mid-celebration-393-en.png'), fullPage: false });
console.log('shot →', join(OUT, 'bronze-mid-celebration-393-en.png'));
// Also sample canvas rect during celebration.
const stab = await page.evaluate(() => {
  const canvas = document.querySelector('canvas.rv-bmp-canvas');
  if (!canvas) return { skip: true };
  const rects = [];
  return new Promise(res => {
    const start = performance.now();
    function f() {
      const r = canvas.getBoundingClientRect();
      rects.push({ t: Math.round(performance.now() - start), x: r.left, w: r.width });
      if (rects.length > 180) return res(rects);
      requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  });
});
const xs = stab.map(s => s.x), ws = stab.map(s => s.w);
console.log(`canvas during celebration: x=${xs[0].toFixed(2)} w=${ws[0].toFixed(2)} x range=${(Math.max(...xs)-Math.min(...xs)).toFixed(2)} w range=${(Math.max(...ws)-Math.min(...ws)).toFixed(2)}`);
await browser.close(); app.s.close();

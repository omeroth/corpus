import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round32';
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
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
async function newCtx(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:{}, _debugThinkerPoints:{socrates:1}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true,economics:true,psychology:true}, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  return { ctx, page };
}
// Point drop onto plain (0 → 1, so unframed card on reveal)
{
  const { ctx, page } = await newCtx('en');
  await page.evaluate(() => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', 3);
  });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${OUT}/reveal-bronze-after-393-en.png`, fullPage: false });
  // Inspect the .rv-pc and children
  const info = await page.evaluate(() => {
    const pc = document.querySelector('.rv-pc');
    if (!pc) return { error: 'no .rv-pc' };
    const face = pc.querySelector('.rv-face');
    const art = pc.querySelector('.rv-art');
    const img = pc.querySelector('.rv-art img');
    const d = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { tag:el.tagName, cls:el.className, rect:`${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`, bg:cs.backgroundColor, bi:cs.backgroundImage.slice(0,40), border:cs.border, boxShadow:cs.boxShadow.slice(0,80), position:cs.position }; };
    return { pcTier: pc.className, pc: d(pc), face: d(face), art: d(art), img: d(img) };
  });
  console.log(JSON.stringify(info, null, 2));
  await ctx.close();
}
await browser.close(); app.server.close();

// 27 — inspect .rv-pc / .rv-face / .rv-art / img computed style on
// the point-drop reveal in plain tier (p=2).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function startServer(root) {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(root, p); if (!abs.startsWith(root)) { res.writeHead(403); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
async function dump(points, label) {
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
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.addStyleTag({ content: `body.on-reader-v7 #dc-thinker-screen.rv-v7 .rv-pc { animation: none !important; }` });
  await page.waitForTimeout(200);
  await page.evaluate((p) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', p);
  }, points);
  await page.waitForTimeout(points === 2 ? 2500 : 7000);
  const info = await page.evaluate(() => {
    const pc = document.querySelector('.rv-pc');
    const face = document.querySelector('.rv-pc .rv-face');
    const art = document.querySelector('.rv-pc .rv-art');
    const img = document.querySelector('.rv-pc .rv-art img, .rv-pc .rv-face img:not(.rv-frame)');
    const pcCS = pc ? getComputedStyle(pc) : null;
    const faceCS = face ? getComputedStyle(face) : null;
    const artCS = art ? getComputedStyle(art) : null;
    const pcRect = pc ? pc.getBoundingClientRect() : null;
    const faceRect = face ? face.getBoundingClientRect() : null;
    const artRect = art ? art.getBoundingClientRect() : null;
    const imgRect = img ? img.getBoundingClientRect() : null;
    return {
      tierCls: pc ? pc.className : '',
      pcAspect: pcCS ? pcCS.aspectRatio : null,
      pcWidth: pcCS ? pcCS.width : null,
      pcRect: pcRect ? Math.round(pcRect.width) + 'x' + Math.round(pcRect.height) : null,
      faceCS: faceCS ? ('pos=' + faceCS.position + ' inset=' + faceCS.insetBlockStart + '/' + faceCS.insetInlineEnd + '/' + faceCS.insetBlockEnd + '/' + faceCS.insetInlineStart) : null,
      faceRect: faceRect ? Math.round(faceRect.width) + 'x' + Math.round(faceRect.height) : null,
      artCS: artCS ? ('aspect=' + artCS.aspectRatio) : null,
      artRect: artRect ? Math.round(artRect.width) + 'x' + Math.round(artRect.height) : null,
      imgRect: imgRect ? Math.round(imgRect.width) + 'x' + Math.round(imgRect.height) : null,
    };
  });
  console.log(`\n=== ${label} ===`);
  console.log(JSON.stringify(info, null, 2));
  await ctx.close();
}

await dump(2, 'plain (p=2, non-boundary) — DEFAULT 15Pro 393x852');
await dump(3, 'framed (p=3, post-boundary bronze)');
await dump(6, 'at p=6 (bronze→silver boundary)');
await browser.close();
app.server.close();

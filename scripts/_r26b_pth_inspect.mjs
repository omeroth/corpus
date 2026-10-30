// 26b — inspect what tier classes + framed state the Pantheon cards
// actually have on page. Dumps 20 cell tier/framed/img attrs.
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
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  const cd = {};
  for (let c = 1; c <= 2; c++) for (let d = 1; d <= 7; d++) cd[`philosophy-${c}-${d}`] = true;
  const _debugPts = { socrates:1, plato:3, aristotle:6, 'marcus-aurelius':9, kant:12, descartes:2, nietzsche:4, 'bertrand-russell':5 };
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:cd, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy: true, economics: true, psychology: true }, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-pantheon') && getComputedStyle(document.getElementById('screen-pantheon')).display !== 'none', { timeout: 15000 }).catch(()=>{});
await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
await page.waitForTimeout(600);
const dump = await page.evaluate(() => {
  const flag = typeof HV_PANTHEON_FRAME_PNGS !== 'undefined' ? HV_PANTHEON_FRAME_PNGS : 'MISSING';
  // Dump computed style of the first .pth-art img on screen + the
  // framed face's border/padding (suspect for the 81 vs 87 img width
  // discrepancy on framed cards).
  const anyArt = document.querySelector('.pth-cell .pth-face.pth-front > img.pth-art');
  const computedArt = anyArt ? (function() {
    const cs = getComputedStyle(anyArt);
    return `aspect-ratio=${cs.aspectRatio} width=${cs.width} height=${cs.height} object-fit=${cs.objectFit} position=${cs.position} top=${cs.top}`;
  })() : 'no-art';
  const framedFace = document.querySelector('.pth-cell.framed .pth-face.pth-front');
  const framedInfo = framedFace ? (function() {
    const cs = getComputedStyle(framedFace);
    const r = framedFace.getBoundingClientRect();
    return `rect=${Math.round(r.width)}x${Math.round(r.height)} border=${cs.borderWidth} padding=${cs.padding} boxSizing=${cs.boxSizing}`;
  })() : 'no-framed';
  const cells = Array.from(document.querySelectorAll('.pth-cell'));
  const info = cells.slice(0, 20).map(c => {
    const label = c.querySelector('.pth-slot')?.getAttribute('aria-label') || c.getAttribute('data-subject');
    const img = c.querySelector('img.pth-frame');
    const art = c.querySelector('img.pth-art');
    const face = c.querySelector('.pth-face.pth-front');
    const faceRect = face ? face.getBoundingClientRect() : null;
    const slot = c.querySelector('.pth-slot');
    const slotRect = slot ? slot.getBoundingClientRect() : null;
    return {
      cls: c.className,
      label: label ? label.slice(0, 48) : '',
      frame: img ? 'yes:' + img.getAttribute('src').split('/').pop() : 'none',
      art: art ? `nat=${art.naturalWidth}x${art.naturalHeight} rect=${Math.round(art.getBoundingClientRect().width)}x${Math.round(art.getBoundingClientRect().height)}` : 'no-img',
      face: faceRect ? `${Math.round(faceRect.width)}x${Math.round(faceRect.height)}` : 'no-face',
      slot: slotRect ? `${Math.round(slotRect.width)}x${Math.round(slotRect.height)}` : 'no-slot',
    };
  });
  return { flag, cells: cells.length, info, computedArt, framedInfo };
});
console.log('HV_PANTHEON_FRAME_PNGS =', dump.flag);
console.log('total cells =', dump.cells);
console.log('IMG computed:', dump.computedArt);
console.log('FRAMED face:', dump.framedInfo);
for (const c of dump.info) console.log(JSON.stringify(c));
await ctx.close();
await browser.close(); app.server.close();

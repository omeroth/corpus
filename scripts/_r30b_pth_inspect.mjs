// R30b item 1 — inspect bronze Pantheon cell DOM + computed style.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const server = (() => {
  const s = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(WWW, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  return s;
})();
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
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
  const _debugPts = { socrates: 3 };  // bronze
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy:true, economics:true, psychology:true }, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-pantheon') && getComputedStyle(document.getElementById('screen-pantheon')).display !== 'none', { timeout: 15000 }).catch(()=>{});
await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
await page.waitForTimeout(600);

const info = await page.evaluate(() => {
  const cell = Array.from(document.querySelectorAll('.pth-cell.framed')).find(c => c.querySelector('img.pth-art'));
  if (!cell) return { error: 'no framed cell' };
  const face = cell.querySelector('.pth-face.pth-front');
  const img = cell.querySelector('img.pth-art');
  const mb = cell.querySelector('.corpus-mb');
  const studs = cell.querySelectorAll('.mb-stud');
  const top = cell.querySelector('.mb-top');
  const dump = (el) => {
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      cls: el.className,
      directChildren: Array.from(el.children).map(c => c.tagName.toLowerCase() + '.' + c.className.split(' ').slice(0, 3).join('.')),
      rect: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`,
      pad: cs.padding,
      bg: cs.backgroundImage.slice(0, 80),
      position: cs.position,
      bw: cs.getPropertyValue('--bw'),
      st: cs.getPropertyValue('--st'),
      m: cs.getPropertyValue('--m').slice(0, 60),
      e: cs.getPropertyValue('--e'),
    };
  };
  return {
    tierCls: cell.className,
    cell: dump(cell),
    face: dump(face),
    mb: dump(mb),
    mbIsFace: mb === face,
    img: img ? { parent: img.parentElement.tagName + '.' + img.parentElement.className, parentIsMb: img.parentElement.classList.contains('corpus-mb') } : null,
    studCount: studs.length,
    studs: Array.from(studs).map(s => ({
      cls: s.className,
      parent: s.parentElement.tagName + '.' + s.parentElement.className.split(' ').slice(0, 3).join('.'),
      rect: (() => { const r = s.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`; })(),
    })),
    top: top ? {
      parent: top.parentElement.tagName + '.' + top.parentElement.className.split(' ').slice(0, 3).join('.'),
      rect: (() => { const r = top.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`; })(),
    } : null,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
server.close();

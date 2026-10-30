// R34 item 1 — capture Pantheon with scrolled view showing Smith/Marx/Sen.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round34';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function startServer(root) { const server = createServer(async (req, res) => { try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html'; const abs = join(root, p); res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' }); res.end(await readFile(abs)); } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port }))); }
const app = await startServer(WWW);
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
  const _debugPts = { socrates:3, plato:6, russell:9, wittgenstein:12, aurelius:1, aristotle:2, foucault:3, kant:6, mill:9 };
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true,economics:true,psychology:true}, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
await page.waitForTimeout(400);
// Scroll to the economics section
await page.evaluate(() => {
  const h = Array.from(document.querySelectorAll('.pth-sec-head, .pth-section-header, h2, h3')).find(el => /economics|כלכלה/i.test(el.textContent || ''));
  if (h) h.scrollIntoView({ block: 'center' });
  else { const grids = document.querySelectorAll('.pth-grid'); if (grids.length > 1) grids[1].scrollIntoView({ block: 'center' }); }
});
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/pantheon-phil-v2-before-393-en.png`, fullPage: false });
// Also dump geometry of a framed cell
const info = await page.evaluate(() => {
  const cell = Array.from(document.querySelectorAll('.pth-cell.unlocked.framed')).find(c => c.querySelector('img.pth-art'));
  if (!cell) return { error: 'no framed cell' };
  const dump = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { rect: `${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}×${Math.round(r.height)}`, overflow: cs.overflow, clipPath: cs.clipPath }; };
  return {
    cell: dump(cell),
    slot: dump(cell.querySelector('.pth-slot')),
    face: dump(cell.querySelector('.pth-face.pth-front')),
    art: dump(cell.querySelector('img.pth-art')),
    overlay: dump(cell.querySelector('.corpus-frame-overlay')),
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close(); app.server.close();

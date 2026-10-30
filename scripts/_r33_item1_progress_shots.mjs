// R33 item 1 — capture plain-tier reveal mid-animation at 0 / 25 / 50 /
// 75 / 100% of the point-drop sequence. Look for any white rectangle,
// lavender border, dark bottom bar or purple glow around the art.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round33';
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
const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, _debugThinkerPoints:{socrates:2}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true,economics:true,psychology:true}, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
// Point drop: 1 → 2 (plain → plain, met-again, triggers .rv-glowup pulse).
await page.evaluate(() => {
  document.body.classList.add('on-reader-v7');
  document.body.classList.add('reader-editorial');
  _debugThinkerReveal('socrates', 2);
});
// Point drop total sequence (orb drop) is ~1700ms. Sample at offsets
// from when .rv-glowup first appears on .rv-pc so we actually land
// inside the shadow pulse (not before it).
const t0Start = Date.now();
// Wait for glowup to arm (orb lands ~900ms into the sequence).
await page.waitForFunction(() => {
  const pc = document.querySelector('.rv-pc');
  return pc && pc.classList.contains('rv-glowup');
}, { timeout: 5000 });
const glowStart = Date.now();
// rd-gu animation is 1000ms. Sample at 0, 250, 500, 750, 1000ms after start.
const stamps = [0, 250, 500, 750, 999];
for (const t of stamps) {
  const wait = (glowStart + t) - Date.now();
  if (wait > 0) await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/revealdrop-pct${Math.round(t/10)}-393-en.png`, fullPage: false });
}
// Final settled frame after the pulse ends.
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/revealdrop-settled-393-en.png`, fullPage: false });
await browser.close(); app.server.close();
console.log('shots → ' + OUT + '/revealdrop-pct*-393-en.png');

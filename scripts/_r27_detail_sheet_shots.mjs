// Round 27 — detail-sheet shots: open the Pantheon unlocked sheet on
// each tier (plain, bronze, silver, gold, diamond) on 393x852 EN+HE
// + 375x667 SE for one plain + one framed.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round27';
await mkdir(OUT, { recursive: true });
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

async function shot(w, h, lang, thinkerId, tier) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const cd = {}; for (let c = 1; c <= 2; c++) for (let d = 1; d <= 7; d++) cd[`philosophy-${c}-${d}`] = true;
    const _debugPts = { socrates:1, plato:3, aristotle:6, aurelius:9, kant:12 };
    const bus = { philosophy: true, economics: true, psychology: true };
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:cd, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:bus, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-pantheon') && getComputedStyle(document.getElementById('screen-pantheon')).display !== 'none', { timeout: 15000 }).catch(()=>{});
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(400);
  await page.evaluate((id) => { try { openPantheonUnlockedSheet(id, 'philosophy'); } catch(_){} }, thinkerId);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/detail-${tier}-${w}x${h}-${lang}.png`, fullPage: false });
  await ctx.close();
}

const PICKS = [
  ['socrates', 'plain'],
  ['plato', 'bronze'],
  ['aristotle', 'silver'],
  ['aurelius', 'gold'],
  ['kant', 'diamond'],
];

for (const [id, tier] of PICKS) {
  for (const lang of ['en', 'he']) {
    await shot(393, 852, lang, id, tier);
  }
}
// SE size — one plain + one framed
await shot(375, 667, 'en', 'socrates', 'plain');
await shot(375, 667, 'en', 'plato', 'bronze');
await shot(375, 667, 'he', 'aristotle', 'silver');

await browser.close(); app.server.close();
console.log(`shots → ${OUT}/detail-*.png`);

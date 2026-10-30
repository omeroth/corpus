// R30b item 4 — Pantheon (bronze/silver/gold/diamond side by side) +
// detail bronze + reveal bronze on 393×852 EN. Compare with mockup.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round30b';
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
async function newCtx() {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    const _debugPts = { socrates:3, plato:6, russell:9, wittgenstein:12, aurelius:1, aristotle:2 };
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy:true, economics:true, psychology:true }, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  return { ctx, page };
}

// 1. Pantheon: 4 tiers side-by-side
{
  const { ctx, page } = await newCtx();
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/pantheon-4tier-393-en.png`, fullPage: false });
  await ctx.close();
}

// 2. Detail bronze
{
  const { ctx, page } = await newCtx();
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(400);
  await page.evaluate(() => { try { openPantheonUnlockedSheet('socrates', 'philosophy'); } catch(_){} });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/detail-bronze-393-en.png`, fullPage: false });
  await ctx.close();
}

// 3. Reveal bronze
{
  const { ctx, page } = await newCtx();
  await page.evaluate(() => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', 3);
  });
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${OUT}/reveal-bronze-393-en.png`, fullPage: false });
  await ctx.close();
}

await browser.close(); app.server.close();
console.log(`shots → ${OUT}/*.png`);

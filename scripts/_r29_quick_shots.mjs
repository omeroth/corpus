// R29 quick-check — 393×852 EN+HE screenshots of the three main
// framed surfaces (Pantheon, reveal boundary, detail). No full
// matrix — the slow _r2x suites run at round's end.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round29';
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

async function openCtx(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const cd = {}; for (let c = 1; c <= 2; c++) for (let d = 1; d <= 7; d++) cd[`philosophy-${c}-${d}`] = true;
    const _debugPts = { socrates:12, plato:9, russell:12, wittgenstein:1, aurelius:6, aristotle:3, kant:3, mill:2, nietzsche:4, descartes:5 };
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:cd, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy:true, economics:true, psychology:true }, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  return { ctx, page };
}

for (const lang of ['en', 'he']) {
  // Pantheon
  {
    const { ctx, page } = await openCtx(lang);
    await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/pantheon-393x852-${lang}.png`, fullPage: false });
    await ctx.close();
  }
  // Reveal — bronze boundary (p=3) settled
  {
    const { ctx, page } = await openCtx(lang);
    await page.evaluate(() => {
      document.body.classList.add('on-reader-v7');
      document.body.classList.add('reader-editorial');
      _debugThinkerReveal('socrates', 3);
    });
    await page.waitForTimeout(6500);
    await page.screenshot({ path: `${OUT}/reveal-bronze-393x852-${lang}.png`, fullPage: false });
    await ctx.close();
  }
  // Detail — bronze
  {
    const { ctx, page } = await openCtx(lang);
    await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
    await page.waitForTimeout(400);
    await page.evaluate(() => { try { openPantheonUnlockedSheet('plato', 'philosophy'); } catch(_){} });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/detail-bronze-393x852-${lang}.png`, fullPage: false });
    await ctx.close();
  }
}

await browser.close();
app.server.close();
console.log(`shots → ${OUT}/{pantheon,reveal-bronze,detail-bronze}-393x852-{en,he}.png`);

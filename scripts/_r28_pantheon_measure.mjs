// 28 — measure Pantheon cell width on SE + 393.
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
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });

async function measure(w, h, label) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    const _debugPts = { socrates:12, plato:9, russell:12, wittgenstein:1, aurelius:6, aristotle:3 };
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy: true, economics: true, psychology: true }, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-pantheon') && getComputedStyle(document.getElementById('screen-pantheon')).display !== 'none', { timeout: 15000 }).catch(()=>{});
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('#pantheon-container .pth-cell')).slice(0, 6);
    return cells.map(c => {
      const r = c.getBoundingClientRect();
      const slot = c.querySelector('.pth-slot');
      const sr = slot ? slot.getBoundingClientRect() : null;
      return {
        tier: c.className.match(/tier-\w+/)?.[0] || 'unknown',
        cellW: Math.round(r.width),
        cellH: Math.round(r.height),
        slotW: sr ? Math.round(sr.width) : null,
        slotH: sr ? Math.round(sr.height) : null,
      };
    });
  });
  console.log(`[${label}]`);
  for (const c of info) console.log(`  ${c.tier.padEnd(14)} cell=${c.cellW}x${c.cellH}  slot=${c.slotW}x${c.slotH}`);
  await ctx.close();
}

await measure(375, 667, 'SE 375x667');
await measure(393, 852, '15Pro 393x852');

await browser.close();
app.server.close();

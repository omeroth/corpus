// Round 26 — one pantheon screenshot on 393×852 EN with a mix of
// tiers (plain, bronze, silver, gold) so the plate under each card
// is visible in the capture.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round26';
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

async function shot(w, h, lang, name) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    // Mix of completed days across chapters to seed a few thinkers at
    // bronze, silver, gold and diamond. completedDays keys look like
    // "<weekId>-<dayId>"; the exact combinations depend on content,
    // but seeding ch1 d1..d6 and ch2 d1..d3 generally lights up two
    // thinkers at distinct tiers.
    const cd = {};
    // dayKey format = "<subject>-<weekId>-<dayId>". Keep a thin set
    // so the Pantheon shows a mix of plain + locked, then override
    // specific thinkers to specific tiers via _debugThinkerPoints
    // so a single shot carries plain / bronze / silver / gold /
    // diamond cards side-by-side.
    for (let c = 1; c <= 2; c++) {
      for (let d = 1; d <= 7; d++) cd[`philosophy-${c}-${d}`] = true;
    }
    // _debugThinkerPoints: thinkerPoints() returns the override when
    // present. Lets us hit every tier boundary without authoring 12+
    // dialogue completions per thinker.
    // Round 27 verification — stack row 1 with the two biggest frame
    // crests (diamond fan + gold shell) so we can confirm the 14px
    // .pth-cell padding-top keeps the top ornaments clear on SE and
    // 393. Row 1 at 3 cols = socrates / plato / russell per
    // CAROUSEL_ORDER.philosophy.
    const _debugPts = {
      'socrates':  12,  // row 1 col 1 — diamond (fan crest)
      'plato':      9,  // row 1 col 2 — gold (shell crest)
      'russell':   12,  // row 1 col 3 — diamond (fan crest)
      'wittgenstein': 1, // row 2 col 1 — plain
      'aurelius':   6,  // row 2 col 2 — silver (gem crest)
      'aristotle':  3,  // row 2 col 3 — bronze (laurel crest)
      'kant':       3,  // bronze
      'mill':       2,  // plain
      'nietzsche':  4,  // bronze
      'descartes':  5,  // bronze
      'hume':       0,  // locked
      'popper':     0,  // locked
    };
    // All chapter bonuses marked as already shown so the pantheon
    // isn't blocked by a Bonus Unlocked overlay on first paint.
    const bus = { philosophy: true, economics: true, psychology: true };
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:cd, _debugThinkerPoints: _debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:bus, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-pantheon') && getComputedStyle(document.getElementById('screen-pantheon')).display !== 'none', { timeout: 15000 }).catch(()=>{});
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(600);
  // Scroll down a bit to catch cards past the hero.
  await page.evaluate(() => window.scrollTo(0, 160));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/pantheon-${w}x${h}-${lang}.png`, fullPage: false });
  // Full-page capture to show locked cards further down.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/pantheon-${w}x${h}-${lang}-full.png`, fullPage: true });
  await ctx.close();
}

for (const [w, h] of [[375, 667], [393, 852]]) {
  for (const lang of ['en', 'he']) {
    await shot(w, h, lang, `${w}x${h}`);
  }
}
await browser.close(); app.server.close();
console.log(`shots → ${OUT}/pantheon-*.png`);

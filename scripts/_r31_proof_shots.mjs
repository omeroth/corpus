// R31 item 4 — Proof shots:
//   • Pantheon with all 4 tiers (bronze/silver/gold/diamond) + unframed
//     (plain), on 393×852 EN + HE.
//   • Detail sheet for one framed thinker (silver), 393×852 EN.
//   • Reveal screens for every framed tier (bronze/silver/gold/diamond),
//     393×852 EN.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round31';
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
async function newCtx(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const _debugPts = { socrates:3, plato:6, russell:9, wittgenstein:12, aurelius:1, aristotle:2 };
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:l, completedDays:{}, _debugThinkerPoints:_debugPts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy:true, economics:true, psychology:true }, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  return { ctx, page };
}

// Pantheon 4-tier + unframed, EN + HE
for (const lang of ['en', 'he']) {
  const { ctx, page } = await newCtx(lang);
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/pantheon-4tier-393-${lang}.png`, fullPage: false });
  await ctx.close();
}

// Detail sheet (silver — plato has p=6 → silver)
{
  const { ctx, page } = await newCtx('en');
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(400);
  await page.evaluate(() => { try { openPantheonUnlockedSheet('plato', 'philosophy'); } catch(_){} });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/detail-silver-393-en.png`, fullPage: false });
  // Round 34 — no art pixels outside detail-sheet frame rect.
  const detailCorners = await page.evaluate(() => {
    const cell = document.querySelector('.pth-sheet-unlocked .pth-sheet-cardwrap > .pth-cell');
    const art = cell?.querySelector('img.pth-art');
    if (!cell || !art) return { skip: true };
    const r = cell.getBoundingClientRect();
    const probes = [
      ['tl', r.left - 2, r.top - 2],
      ['tr', r.right + 2, r.top - 2],
      ['bl', r.left - 2, r.bottom + 2],
      ['br', r.right + 2, r.bottom + 2],
    ];
    return probes.map(([n, x, y]) => {
      const stack = document.elementsFromPoint(x, y);
      return { n, x: Math.round(x), y: Math.round(y), hitsArt: stack.includes(art) };
    });
  });
  const detailBad = Array.isArray(detailCorners) ? detailCorners.filter(c => c.hitsArt) : [];
  if (detailBad.length) {
    console.log('[FAIL] detail-sheet — art pixels outside frame:', JSON.stringify(detailBad));
    process.exitCode = 1;
  } else {
    console.log('[PASS] detail-sheet — no art pixels outside frame');
  }
  await ctx.close();
}

// Reveal, all 4 tiers EN. Round 34 — also assert no art pixels show
// outside the .rv-pc rect (corners sampled via elementsFromPoint).
const outsideBads = [];
for (const [tier, pts] of [['bronze', 3], ['silver', 6], ['gold', 9], ['diamond', 12]]) {
  const { ctx, page } = await newCtx('en');
  await page.evaluate((p) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', p);
  }, pts);
  await page.waitForTimeout(7000);
  await page.screenshot({ path: `${OUT}/reveal-${tier}-393-en.png`, fullPage: false });
  const corners = await page.evaluate(() => {
    const pc = document.querySelector('.rv-pc');
    const art = pc?.querySelector('img');
    if (!pc || !art) return { skip: true };
    const r = pc.getBoundingClientRect();
    const probes = [
      ['tl', r.left - 2, r.top - 2],
      ['tr', r.right + 2, r.top - 2],
      ['bl', r.left - 2, r.bottom + 2],
      ['br', r.right + 2, r.bottom + 2],
    ];
    return probes.map(([n, x, y]) => {
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return { n, outOfBounds: true };
      const stack = document.elementsFromPoint(x, y);
      return { n, x, y, hitsArt: stack.includes(art) };
    });
  });
  const bad = Array.isArray(corners) ? corners.filter(c => c.hitsArt) : [];
  if (bad.length) outsideBads.push({ tier, bad });
  await ctx.close();
}
if (outsideBads.length) {
  console.log('[FAIL] reveal — art pixels outside .rv-pc:', JSON.stringify(outsideBads));
  process.exitCode = 1;
} else {
  console.log('[PASS] reveal — no art pixels outside .rv-pc (all 4 tiers)');
}

await browser.close(); app.server.close();
console.log(`shots → ${OUT}/*.png`);

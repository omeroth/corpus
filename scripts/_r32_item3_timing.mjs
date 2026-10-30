// R32 item 3 — tap→hidden timing for pth-sheet-locked vs pth-sheet-unlocked.
// Also assert that the Got-it close fires _haptic('nav') (via spy).
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
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
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, _debugThinkerPoints:{socrates:3, confucius:0}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true,economics:true,psychology:true}, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(400);
  // Install haptic spy.
  await page.evaluate(() => {
    window.__hapticLog = [];
    const orig = window._haptic;
    window._haptic = function (kind) {
      window.__hapticLog.push({ kind, t: performance.now() });
      try { return orig && orig(kind); } catch (_) {}
    };
  });
  return { ctx, page };
}
async function timeSheet(page, which) {
  const opened = await page.evaluate((w) => {
    window.__hapticLog = [];
    const id = w === 'locked' ? 'kahneman' : 'socrates';
    try {
      if (w === 'locked') openPantheonLockedSheet(id, 'philosophy');
      else openPantheonUnlockedSheet(id, 'philosophy');
    } catch (e) { return { ok: false, err: String(e) }; }
    const sheet = document.getElementById(w === 'locked' ? 'pth-locked-sheet' : 'pth-unlocked-sheet');
    return { ok: !!sheet, open: sheet && sheet.classList.contains('open') };
  }, which);
  if (!opened.ok || !opened.open) throw new Error(`sheet ${which} did not open: ${JSON.stringify(opened)}`);
  await page.waitForTimeout(600);  // settle slide-up
  const info = await page.evaluate((w) => {
    const sheetId = w === 'locked' ? 'pth-locked-sheet' : 'pth-unlocked-sheet';
    const ctaId   = w === 'locked' ? 'pth-locked-cta'   : 'pth-unlocked-cta';
    const sheet = document.getElementById(sheetId);
    const cta = document.getElementById(ctaId);
    const t0 = performance.now();
    // Round 32 — dispatch pointerdown + pointerup to exercise the
    // fast-tap path (not the slow synthesized click). Falls back to
    // .click() when pointer events aren't available.
    if ('onpointerup' in window) {
      cta.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
      cta.dispatchEvent(new PointerEvent('pointerup',   { bubbles: true, pointerType: 'touch' }));
    } else {
      cta.click();
    }
    return new Promise((resolve) => {
      const check = () => {
        if (!sheet.classList.contains('open') && getComputedStyle(sheet).visibility === 'hidden') {
          resolve({ ms: performance.now() - t0, haptics: window.__hapticLog.slice() });
        } else if (performance.now() - t0 > 1500) {
          resolve({ ms: performance.now() - t0, timeout: true, haptics: window.__hapticLog.slice() });
        } else {
          requestAnimationFrame(check);
        }
      };
      requestAnimationFrame(check);
    });
  }, which);
  return info;
}
const { ctx, page } = await newCtx();
const lk = await timeSheet(page, 'locked');
const ul = await timeSheet(page, 'unlocked');
console.log('locked   tap→hidden:', lk.ms.toFixed(0) + 'ms', 'haptics:', JSON.stringify(lk.haptics.map(h => h.kind)));
console.log('unlocked tap→hidden:', ul.ms.toFixed(0) + 'ms', 'haptics:', JSON.stringify(ul.haptics.map(h => h.kind)));
const budget = lk.ms + 50;
const pass = ul.ms <= budget && ul.haptics.some(h => h.kind === 'nav');
console.log(pass ? '[PASS]' : '[FAIL]', `unlocked ≤ locked + 50ms (${budget.toFixed(0)}ms) AND haptic 'nav' fired on close`);
await ctx.close(); await browser.close(); app.server.close();
process.exit(pass ? 0 : 1);

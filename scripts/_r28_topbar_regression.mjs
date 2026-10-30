// Round 28 item 3 regression — the stats topbar must sit at the
// safe-area top on every tab after:
//   • fresh load
//   • scroll (inside Profile, Home, Pantheon)
//   • mid-scroll tab switch
//   • return from background (simulated via document visibility)
//   • open + close a drawer / sheet
// Measures .hv-topbar getBoundingClientRect().top on each tab after
// each action. Must equal 0 (±1 px tolerance for sub-pixel) because
// position: fixed + top: 0.
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
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream', 'Cache-Control':'no-store' });
      res.end(await readFile(abs));
    } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); }
  });
  return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });

const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

async function newPage() {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{ philosophy: true, economics: true, psychology: true }, dailyStreak:5, xp:120, currentScreen:'home', isPaid:true }));
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 0px; --safe-bottom: 34px; }` });
  return { ctx, page };
}

async function barTop(page, screen) {
  await page.evaluate((s) => { try { showScreen(s); } catch(_){} }, screen);
  await page.waitForTimeout(250);
  return page.evaluate((s) => {
    const bar = document.querySelector('#screen-' + s + ' .hv-topbar');
    if (!bar) return { none: true };
    const r = bar.getBoundingClientRect();
    return { top: r.top, pos: getComputedStyle(bar).position };
  }, screen);
}

async function tabCheck(label, action) {
  const { ctx, page } = await newPage();
  if (action) await action(page);
  for (const screen of ['home', 'pantheon', 'profile', 'streak']) {
    const info = await barTop(page, screen);
    if (info.none) { rec(`${label}: ${screen} — bar present`, false, 'no .hv-topbar in screen'); continue; }
    const pass = Math.abs(info.top) <= 1 && info.pos === 'fixed';
    rec(`${label}: ${screen} — bar at viewport top (±1px, position:fixed)`, pass, `top=${info.top.toFixed(1)} pos=${info.pos}`);
  }
  await ctx.close();
}

await tabCheck('fresh load', null);

await tabCheck('after scrolling profile 400px, then checking all tabs', async (page) => {
  await page.evaluate(() => { try { showScreen('profile'); } catch(_){} });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const s = document.getElementById('screen-profile');
    const sc = s && s.querySelector('.scroll-content');
    if (sc) sc.scrollTop = 400;
    else if (s) s.scrollTop = 400;
    window.scrollTo(0, 400);
  });
  await page.waitForTimeout(300);
});

await tabCheck('mid-scroll tab switch (home scrolled, then → profile → back)', async (page) => {
  await page.evaluate(() => { try { showScreen('home'); } catch(_){} });
  await page.waitForTimeout(200);
  await page.evaluate(() => window.scrollTo(0, 400));
  await page.waitForTimeout(100);
  await page.evaluate(() => { try { showScreen('profile'); } catch(_){} });
  await page.waitForTimeout(200);
  await page.evaluate(() => { try { showScreen('home'); } catch(_){} });
  await page.waitForTimeout(200);
});

await tabCheck('after document visibility change (simulated background return)', async (page) => {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(300);
});

await tabCheck('after opening + closing the subject drawer', async (page) => {
  await page.evaluate(() => { try { showScreen('home'); } catch(_){} });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    try { if (typeof openSubjectDrawer === 'function') openSubjectDrawer(); } catch(_){}
    try { if (typeof toggleSubjectDrawer === 'function') toggleSubjectDrawer(); } catch(_){}
  });
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    document.body.classList.remove('drawer-open');
    try { if (typeof closeSubjectDrawer === 'function') closeSubjectDrawer(); } catch(_){}
  });
  await page.waitForTimeout(300);
});

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

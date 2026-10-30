// 28 item 3 — repro the stuck-top-bar bug. Open Profile, scroll,
// check if .hv-topbar's getBoundingClientRect().top equals 0 on
// every tab, after scrolling + tab-switching + background return.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const server = (() => {
  const s = createServer(async (req, res) => {
    try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html';
      const abs = join(WWW, p);
      res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' });
      res.end(await readFile(abs));
    } catch (e) { if (!res.headersSent) res.writeHead(404); res.end(); }
  });
  return s;
})();
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
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
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'profile', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

async function sampleTopbar(screen, label) {
  await page.evaluate((s) => { try { showScreen(s); } catch(_){} }, screen);
  await page.waitForTimeout(300);
  const info = await page.evaluate((s) => {
    const screenEl = document.getElementById('screen-' + s);
    const bar = screenEl ? screenEl.querySelector('.hv-topbar') : null;
    if (!bar) return { bar: 'no-bar', screen: s, display: screenEl ? getComputedStyle(screenEl).display : 'no-screen' };
    const r = bar.getBoundingClientRect();
    const parent = bar.parentElement;
    const parentCS = parent ? getComputedStyle(parent) : null;
    const screenCS = screenEl ? getComputedStyle(screenEl) : null;
    return {
      screen: s,
      barTop: r.top,
      barLeft: r.left,
      position: getComputedStyle(bar).position,
      scrollY: window.scrollY,
      screenOverflow: screenCS ? screenCS.overflowY : null,
      screenTransform: screenCS ? screenCS.transform : null,
      parentId: parent ? parent.id : null,
      parentOverflow: parentCS ? parentCS.overflowY : null,
      parentTransform: parentCS ? parentCS.transform : null,
    };
  }, screen);
  console.log(`[${label}] ${JSON.stringify(info)}`);
  return info;
}

// 1. fresh load on profile
console.log('--- fresh profile load ---');
await sampleTopbar('profile', 'profile fresh');

// 2. scroll inside the profile scroll container
console.log('--- after scroll ---');
await page.evaluate(() => {
  const s = document.getElementById('screen-profile');
  if (s) s.scrollTop = 400;
  window.scrollTo(0, 400);
});
await page.waitForTimeout(300);
await sampleTopbar('profile', 'profile scrolled 400');

// 3. switch to home mid-scroll
console.log('--- switch to home ---');
await sampleTopbar('home', 'home');

// 4. back to profile — scrolled state restored?
console.log('--- back to profile ---');
await sampleTopbar('profile', 'profile return');

// 5. open + close a sheet (level-up or similar)
console.log('--- after opening + closing a modal/drawer ---');
await page.evaluate(() => {
  try {
    if (typeof openSubjectDrawer === 'function') openSubjectDrawer();
    else if (typeof toggleDrawer === 'function') toggleDrawer();
  } catch(_){}
});
await page.waitForTimeout(300);
await page.evaluate(() => {
  try {
    document.body.classList.remove('drawer-open');
    const d = document.querySelector('.menu-drawer');
    if (d) d.classList.remove('open');
  } catch(_){}
});
await page.waitForTimeout(300);
await sampleTopbar('profile', 'profile after drawer');

await browser.close(); server.close();

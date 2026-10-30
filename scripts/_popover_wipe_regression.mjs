// Permanent regression: "tap next-up node doesn't open popover" after
// a late renderHome() wipes #home-levels.
//
// Mechanism: on cold-start, launch popover auto-opens → _hvOpenPopover
// moves the #hv-popover element INTO a chapter's .hv-path (a descendant
// of #home-levels). Then, after gotrue's INITIAL_SESSION lands,
// _markAuthResolved() fires another renderHome() → `hl.innerHTML = ''`
// wipes everything, INCLUDING the moved popover. Any subsequent user
// tap goes through _hvOpenPopover, which does
//   const pop = document.getElementById('hv-popover');
//   if (!pop) return;
// — silent early-return. No popover shows up on tap.
//
// Fix: renderHome calls _hvClosePopover() before the wipe, which moves
// the popover back to #screen-home so the wipe doesn't destroy it.
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

const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('[PAGE ERROR]', e.message));

await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('_corpus_debug', '1');
  localStorage.setItem('_corpus_dev_premium', '1');
  const completed = {};
  for (let d = 1; d <= 8; d++) completed['philosophy-1-' + d] = true;
  for (let d = 1; d <= 8; d++) completed['philosophy-3-' + d] = true;
  const s = { v:3, subject:'philosophy', lang:'en', completedDays: completed,
    framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
    bonusUnlockShown:{philosophy:true}, dailyStreak:5, xp:420, currentScreen:'home',
    isPaid: true };
  localStorage.setItem('corpus_state', JSON.stringify(s));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

// Wait for launch popover to be auto-opened by _hvJumpToNextUp.
await page.waitForFunction(() => {
  const pop = document.getElementById('hv-popover');
  return pop && pop.style.display === 'block' && pop.querySelector('.hv-pop-btn');
}, { timeout: 5000 });

// Confirm the popover was moved into a .hv-path
const beforeRender = await page.evaluate(() => {
  const pop = document.getElementById('hv-popover');
  const parent = pop?.parentElement;
  return {
    popExists: !!pop,
    display: pop?.style.display,
    parent: parent?.className || parent?.id,
    insideHomeLevels: !!document.getElementById('home-levels')?.contains(pop),
  };
});
console.log('BEFORE renderHome fire:', JSON.stringify(beforeRender));

// Simulate the auth-resolve renderHome
await page.evaluate(() => { try { renderHome(); } catch(e) { console.log('renderHome err:', e.message); } });

const afterRender = await page.evaluate(() => {
  const pop = document.getElementById('hv-popover');
  return {
    popExists: !!pop,
    parent: pop?.parentElement?.className || pop?.parentElement?.id,
    insideHomeLevels: !!document.getElementById('home-levels')?.contains(pop),
  };
});
console.log('AFTER renderHome:', JSON.stringify(afterRender));

// Now simulate a user tap on a lesson node like the device.
await page.waitForTimeout(300);
const tapResult = await page.evaluate(async () => {
  const bub = document.querySelector('.hv-startbub');
  const node = bub?.closest('.hv-node');
  if (!node) return { error: 'no startbub (no real next-up)' };
  node.scrollIntoView({ block: 'center' });
  await new Promise(r => setTimeout(r, 100));
  const r = node.getBoundingClientRect();
  const x = r.left + r.width/2, y = r.top + r.height/2;
  const target = node.querySelector('svg') || node;
  const touch = new Touch({ identifier: 1, target, clientX: x, clientY: y, pageX: x, pageY: y });
  const ts = new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [touch], targetTouches: [touch], changedTouches: [touch] });
  const te = new TouchEvent('touchend',   { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [touch] });
  const cl = new MouseEvent('click',      { bubbles: true, cancelable: true, clientX: x, clientY: y });
  target.dispatchEvent(ts);
  target.dispatchEvent(te);
  target.dispatchEvent(cl);
  await new Promise(r => setTimeout(r, 500));
  const pop = document.getElementById('hv-popover');
  return {
    popExists: !!pop,
    display: pop?.style.display,
    titleText: pop?.querySelector('.hv-pop-title')?.textContent,
    btnPresent: !!pop?.querySelector('.hv-pop-btn'),
    parent: pop?.parentElement?.className || pop?.parentElement?.id,
  };
});
console.log('AFTER user tap:', JSON.stringify(tapResult));

const pass = tapResult.display === 'block' && tapResult.btnPresent;
console.log(pass ? '\n✓ REPRO PASS — popover opens' : '\n✗ REPRO FAILURE — popover DID NOT open after renderHome wiped it');

await browser.close(); app.server.close();
process.exit(pass ? 0 : 1);

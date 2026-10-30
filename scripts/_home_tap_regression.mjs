// Permanent regression test for home-node tap → popover.
// iPhone viewport, touch emulation, REAL touch taps via
// page.touchscreen.tap (NOT .click()).
//
// Cases:
//   a. cold launch, wait 3 s, tap a non-next-up COMPLETED node → popover opens
//   b. tap the next-up node → popover opens
//   c. launch popover already open, tap a different node → popover switches
//      to the tapped node in ONE tap
//   d. scroll home, tap a node → popover opens
//   e. tap START inside popover → thinker-intro opens and stays open 3 s
//   f. X back to home, tap a node again → popover opens
//
// Prints PASS/FAIL per case.
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

async function freshPage() {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'web', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    try {
      localStorage.setItem('corpus_onboarding_done', '1');
      localStorage.setItem('corpus_walkthrough_done', '1');
      localStorage.setItem('corpus_subject', 'philosophy');
      // Completed days 1 and 2 of chapter 1, so lesson 3 is next-up
      // and lessons 1 and 2 exist as COMPLETED non-next-up targets.
      const s = { v:3, subject:'philosophy', lang:'en',
        completedDays:{'philosophy-1-1':true,'philosophy-1-2':true},
        framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
        bonusUnlockShown:{philosophy:true},
        dailyStreak:5, xp:120, currentScreen:'home' };
      localStorage.setItem('corpus_state', JSON.stringify(s));
    } catch(_){}
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 10000 });
  return { ctx, page };
}

async function tapCentre(page, selector) {
  const el = await page.$(selector);
  if (!el) throw new Error('no element ' + selector);
  const box = await el.boundingBox();
  if (!box) throw new Error('no box for ' + selector);
  await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
}
async function popOpen(page) {
  return page.evaluate(() => {
    const pop = document.getElementById('hv-popover');
    if (!pop) return { open: false };
    const cs = getComputedStyle(pop);
    const btn = pop.querySelector('.hv-pop-btn');
    return {
      open: pop.style.display === 'block' && cs.display !== 'none',
      title: (pop.querySelector('.hv-pop-title')||{}).textContent,
      sub:   (pop.querySelector('.hv-pop-sub')||{}).textContent,
      hasBtn: !!btn,
    };
  });
}

const results = [];
function record(name, pass, note) {
  results.push({ name, pass, note });
  console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : ''));
}

// Shared helpers
async function waitHomeReady(page, ms) {
  await page.waitForFunction(() => document.querySelector('.lesson-circle'), { timeout: 5000 });
  await page.waitForTimeout(ms || 500);
}

// Case A: cold launch, wait 3 s, tap a COMPLETED node → popover opens
{
  const { ctx, page } = await freshPage();
  await waitHomeReady(page, 3000);
  // Dismiss any launch popover first so the test exercises the clean tap.
  await page.evaluate(() => { const pop = document.getElementById('hv-popover'); if (pop) pop.style.display = 'none'; });
  // Grab the first completed node (checkmark circle).
  const doneSel = '.lesson-circle.completed';
  const hasDone = await page.$(doneSel);
  if (!hasDone) { record('A: completed node tap', false, 'no .lesson-circle.completed in DOM'); await ctx.close(); }
  else {
    // Scroll node into view before tap so touchscreen coords are valid.
    await page.evaluate((sel) => { const el = document.querySelector(sel); if (el) el.scrollIntoView({ block: 'center' }); }, doneSel);
    await page.waitForTimeout(300);
    // Tap the .hv-node that contains the completed circle.
    const nodeHandle = await page.evaluateHandle(() => document.querySelector('.lesson-circle.completed')?.closest('.hv-node'));
    const nodeEl = nodeHandle.asElement();
    if (nodeEl) {
      const box = await nodeEl.boundingBox();
      if (box) await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
    }
    await page.waitForTimeout(400);
    const p = await popOpen(page);
    record('A: completed node tap → popover opens', p.open && p.hasBtn, `title="${p.title}" sub="${p.sub}" open=${p.open}`);
    await ctx.close();
  }
}

// Case B: tap the next-up node
{
  const { ctx, page } = await freshPage();
  await waitHomeReady(page, 3000);
  await page.evaluate(() => { const pop = document.getElementById('hv-popover'); if (pop) pop.style.display = 'none'; });
  const nodeHandle = await page.evaluateHandle(() => document.querySelector('.lesson-circle.next-up')?.closest('.hv-node'));
  const nodeEl = nodeHandle.asElement();
  if (!nodeEl) { record('B: next-up tap', false, 'no next-up'); await ctx.close(); }
  else {
    await page.evaluate(() => { const n = document.querySelector('.lesson-circle.next-up')?.closest('.hv-node'); if (n) n.scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(300);
    const box = await nodeEl.boundingBox();
    await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
    await page.waitForTimeout(400);
    const p = await popOpen(page);
    record('B: next-up tap → popover opens', p.open && p.hasBtn, `title="${p.title}" open=${p.open}`);
    await ctx.close();
  }
}

// Case C: launch popover open, tap DIFFERENT node → one-tap switch
{
  const { ctx, page } = await freshPage();
  await waitHomeReady(page, 3000);
  const beforeTitle = await page.evaluate(() => (document.querySelector('.hv-pop-title')||{}).textContent);
  const targetSel = '.lesson-circle.completed';
  const nodeHandle = await page.evaluateHandle(() => document.querySelector('.lesson-circle.completed')?.closest('.hv-node'));
  const nodeEl = nodeHandle.asElement();
  if (!nodeEl) { record('C: launch pop + tap different', false, 'no completed node'); await ctx.close(); }
  else {
    await page.evaluate(() => { const n = document.querySelector('.lesson-circle.completed')?.closest('.hv-node'); if (n) n.scrollIntoView({ block: 'center' }); });
    await page.waitForTimeout(300);
    const box = await nodeEl.boundingBox();
    await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
    await page.waitForTimeout(400);
    const afterTitle = await page.evaluate(() => (document.querySelector('.hv-pop-title')||{}).textContent);
    const p = await popOpen(page);
    const switched = p.open && afterTitle && afterTitle !== beforeTitle;
    record('C: launch pop + tap different → switches in one tap', switched, `before="${beforeTitle}" after="${afterTitle}" open=${p.open}`);
    await ctx.close();
  }
}

// Case D: scroll, then tap a node
{
  const { ctx, page } = await freshPage();
  await waitHomeReady(page, 3000);
  await page.evaluate(() => { const pop = document.getElementById('hv-popover'); if (pop) pop.style.display = 'none'; });
  // Scroll user action.
  await page.touchscreen.tap(200, 400);
  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(300);
  const nodeHandle = await page.evaluateHandle(() => {
    const list = Array.from(document.querySelectorAll('.hv-node'));
    const vis = list.find(n => { const r = n.getBoundingClientRect(); return r.top > 100 && r.bottom < innerHeight - 100; });
    return vis;
  });
  const nodeEl = nodeHandle.asElement();
  if (!nodeEl) { record('D: scrolled tap', false, 'no visible node after scroll'); await ctx.close(); }
  else {
    const box = await nodeEl.boundingBox();
    await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
    await page.waitForTimeout(400);
    const p = await popOpen(page);
    record('D: scroll then tap → popover opens', p.open && p.hasBtn, `open=${p.open}`);
    await ctx.close();
  }
}

// Case E: tap START inside popover → intro opens 3 s
{
  const { ctx, page } = await freshPage();
  await waitHomeReady(page, 3000);
  // Launch popover should already be open; locate START.
  const btnHandle = await page.$('#hv-popover .hv-pop-btn');
  if (!btnHandle) { record('E: Start tap → intro opens', false, 'no popover btn'); await ctx.close(); }
  else {
    const box = await btnHandle.boundingBox();
    await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
    await page.waitForTimeout(300);
    const introActive = await page.evaluate(() => document.getElementById('thinker-intro')?.classList.contains('active'));
    await page.waitForTimeout(3000);
    const introStillActive = await page.evaluate(() => document.getElementById('thinker-intro')?.classList.contains('active'));
    const scr = await page.evaluate(() => state.currentScreen);
    record('E: Start tap → intro stays open 3 s', introActive && introStillActive && scr === 'reader', `active-at-300ms=${introActive} active-at-3300ms=${introStillActive} scr=${scr}`);
    await ctx.close();
  }
}

// Case F: X back to home, tap a node again
{
  const { ctx, page } = await freshPage();
  await waitHomeReady(page, 3000);
  const btnHandle = await page.$('#hv-popover .hv-pop-btn');
  if (!btnHandle) { record('F: X back then tap', false, 'no popover btn to enter'); await ctx.close(); }
  else {
    const box = await btnHandle.boundingBox();
    await page.touchscreen.tap(box.x + box.width/2, box.y + box.height/2);
    await page.waitForTimeout(500);
    // Tap the intro X to go home — rdi-x is at top-start.
    const xHandle = await page.$('#thinker-intro.active .rdi-x');
    if (!xHandle) { record('F: X back then tap', false, 'no intro X'); await ctx.close(); }
    else {
      const xb = await xHandle.boundingBox();
      await page.touchscreen.tap(xb.x + xb.width/2, xb.y + xb.height/2);
      await page.waitForTimeout(700);
      const scr = await page.evaluate(() => state.currentScreen);
      if (scr !== 'home') { record('F: X back then tap', false, `scr after X = ${scr}`); await ctx.close(); }
      else {
        // Now tap a node again.
        const nodeHandle = await page.evaluateHandle(() => document.querySelector('.lesson-circle.completed, .lesson-circle.next-up')?.closest('.hv-node'));
        const nodeEl = nodeHandle.asElement();
        await page.evaluate(() => { const n = document.querySelector('.lesson-circle.completed, .lesson-circle.next-up')?.closest('.hv-node'); if (n) n.scrollIntoView({ block: 'center' }); });
        await page.waitForTimeout(300);
        const nbox = await nodeEl.boundingBox();
        await page.touchscreen.tap(nbox.x + nbox.width/2, nbox.y + nbox.height/2);
        await page.waitForTimeout(400);
        const p = await popOpen(page);
        record('F: X back then tap node → popover opens', p.open && p.hasBtn, `open=${p.open}`);
        await ctx.close();
      }
    }
  }
}

await browser.close(); app.server.close();

console.log('\n═══ Home-tap regression ═══');
for (const r of results) console.log((r.pass ? ' ✓ ' : ' ✗ ') + r.name);
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

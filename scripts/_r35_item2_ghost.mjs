// R35 item 2 — tapping "Got it" / backdrop / Share / swipe on a v7
// sheet must NOT send the user to a different screen via ghost click.
// Simulates a real touchscreen.tap over the CTA which fires the full
// pointerdown → pointerup → click synthesis chain; asserts the current
// screen (per state.currentScreen) is still 'pantheon' after 600 ms.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function startServer(root) { const server = createServer(async (req, res) => { try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html'; const abs = join(root, p); res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' }); res.end(await readFile(abs)); } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port }))); }
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
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, _debugThinkerPoints:{socrates:3,kahneman:0}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true,economics:true,psychology:true}, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(300);
  return { ctx, page };
}
async function checkTap(label, openFn, tapFn) {
  const { ctx, page } = await newPage();
  const opened = await page.evaluate(openFn);
  if (!opened) { rec(label, false, 'sheet failed to open'); await ctx.close(); return; }
  await page.waitForTimeout(400);
  await tapFn(page);
  await page.waitForTimeout(600);
  const screen = await page.evaluate(() => state && state.currentScreen);
  const pass = screen === 'pantheon';
  rec(label, pass, `currentScreen=${screen}`);
  await ctx.close();
}
// Unlocked sheet — Got it
await checkTap('unlocked: Got-it tap stays on Pantheon', () => {
  openPantheonUnlockedSheet('socrates', 'philosophy');
  return !!document.getElementById('pth-unlocked-sheet');
}, async (page) => {
  const box = await page.evaluate(() => { const el = document.getElementById('pth-unlocked-cta'); const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; });
  await page.touchscreen.tap(box.x, box.y);
});
// Unlocked sheet — Share
await checkTap('unlocked: Share tap stays on Pantheon', () => {
  openPantheonUnlockedSheet('socrates', 'philosophy');
  return !!document.getElementById('pth-unlocked-sheet');
}, async (page) => {
  // Install a stub to prevent native share from erroring.
  await page.evaluate(() => { window.shareThinker = () => {}; });
  const box = await page.evaluate(() => { const el = document.getElementById('pth-unlocked-share'); const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; });
  await page.touchscreen.tap(box.x, box.y);
});
// Unlocked sheet — backdrop tap
await checkTap('unlocked: backdrop tap stays on Pantheon', () => {
  openPantheonUnlockedSheet('socrates', 'philosophy');
  return !!document.getElementById('pth-unlocked-sheet');
}, async (page) => {
  const box = await page.evaluate(() => { const el = document.getElementById('pth-unlocked-backdrop'); const r = el.getBoundingClientRect(); return { x: r.left + 50, y: r.top + 100 }; });
  await page.touchscreen.tap(box.x, box.y);
});
// Locked sheet — Got it
await checkTap('locked: Got-it tap stays on Pantheon', () => {
  openPantheonLockedSheet('kahneman', 'philosophy');
  return !!document.getElementById('pth-locked-sheet');
}, async (page) => {
  const box = await page.evaluate(() => { const el = document.getElementById('pth-locked-cta'); const r = el.getBoundingClientRect(); return { x: r.left + r.width/2, y: r.top + r.height/2 }; });
  await page.touchscreen.tap(box.x, box.y);
});
await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

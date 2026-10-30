// R41 D follow-up — verify TEST pill removed, console log still fires,
// test-profile behaviour (sync paused via __CORPUS_TEST_PROFILE_ACTIVE
// flag + zeroed state) still works.
import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
const srv = (root) => new Promise(r => { const s = createServer(async(req,res)=>{try{let p=decodeURIComponent(req.url.split('?')[0]);if(p==='/'||p==='')p='/index.html';const abs=join(root,p);res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'});res.end(await readFile(abs));}catch(e){if(!res.headersSent)res.writeHead(404);res.end();}}); s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port})); });
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass?'[PASS] ':'[FAIL] ')+name+(note?'  — '+note:'')); }

const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const consoleLines = [];
page.on('console', m => consoleLines.push(m.text()));

// Simulate a Debug build and a snapshot already present (= profile active across reloads).
await page.addInitScript(() => {
  window.__CORPUS_DEBUG_BUILD = true;
  try { localStorage.clear(); } catch (_) {}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  // Pretend fresh-free was already loaded (snapshot present → active state across reloads).
  localStorage.setItem('__corpusTestSnapshot_v1', JSON.stringify({ state: null, subject: null, lang: null }));
  localStorage.setItem('corpus_state', JSON.stringify({
    v: 3, subject: 'philosophy', lang: 'en',
    completedDays: {}, isPaid: false,
    xp: 0, dailyStreak: 0, unlockedThinkers: [],
    framesExplainerSeen: true, streakIntroSeen: true, currentScreen: 'home',
  }));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
await page.waitForTimeout(500);

// 1. No corpus-test-pill in DOM.
const pillPresent = await page.evaluate(() => !!document.getElementById('corpus-test-pill'));
rec('TEST pill is NOT mounted anywhere', !pillPresent);

// 2. _mountTestPill function removed.
const mountFnExists = await page.evaluate(() => typeof _mountTestPill !== 'undefined');
rec('_mountTestPill is removed', !mountFnExists);

// 3. Console log fired on boot.
const sawLog = consoleLines.some(l => /\[TEST PROFILE: /.test(l) && /sync paused/.test(l));
rec('[TEST PROFILE: X] sync paused log fires once on boot', sawLog, consoleLines.filter(l => l.includes('TEST PROFILE')).join(' | '));

// 4. __CORPUS_TEST_PROFILE_ACTIVE still set (so sync is still blocked).
const flag = await page.evaluate(() => window.__CORPUS_TEST_PROFILE_ACTIVE);
rec('__CORPUS_TEST_PROFILE_ACTIVE flag still restored on boot', !!flag, 'flag=' + flag);

// 5. Top-bar shows zeros (test-profile own values).
const stats = await page.evaluate(() => ({
  streak: document.getElementById('stat-streak')?.textContent,
  xp:     document.getElementById('stat-xp')?.textContent,
  level:  document.getElementById('stat-level')?.textContent,
}));
rec('topbar shows 0 streak', stats.streak === '0', JSON.stringify(stats));
rec('topbar shows 0 xp',     stats.xp === '0', JSON.stringify(stats));

// 6. __corpusTestProfile call: does NOT mount a pill, DOES log.
consoleLines.length = 0;
await page.evaluate(() => { window.__corpusTestProfile('ch1-done-free'); });
await page.waitForTimeout(200);
const stillNoPill = await page.evaluate(() => !!document.getElementById('corpus-test-pill'));
rec('__corpusTestProfile call does not mount a pill', !stillNoPill);
const sawLoadLog = consoleLines.some(l => /__corpusTestProfile.*loaded.*ch1-done-free/.test(l));
rec('__corpusTestProfile logs the load', sawLoadLog, consoleLines.filter(l => l.includes('__corpusTestProfile')).join(' | '));

await ctx.close();
await browser.close(); app.s.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

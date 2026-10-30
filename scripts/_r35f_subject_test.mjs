import { webkit } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function srv(root) { const s = createServer(async(req,res) => { try { let p=decodeURIComponent(req.url.split('?')[0]); if(p==='/'||p==='') p='/index.html'; const abs = join(root,p); res.writeHead(200,{'Content-Type':MIME[extname(abs)]||'application/octet-stream'}); res.end(await readFile(abs)); } catch(e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r=>s.listen(0,'127.0.0.1',()=>r({s,port:s.address().port}))); }
const app = await srv(WWW);
const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport:{width:393,height:852}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done', '1');
  localStorage.setItem('corpus_walkthrough_done', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  localStorage.setItem('_corpus_debug', '1');
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true,economics:true,psychology:true}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true }));
});
await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });

// Scenario: start philosophy → preview Smith (economics) → preview Socrates (philosophy, should be philosophy NOT economics).
const seq = async () => {
  const steps = [];
  const sub0 = await page.evaluate(() => state.subject);
  steps.push({ at: 'init', subject: sub0 });
  // Preview Smith, don't close.
  await page.evaluate(() => __corpusPreviewReveal('smith', 3, { kind: 'frame' }));
  await page.waitForTimeout(1500);
  const sub1 = await page.evaluate(() => state.subject);
  steps.push({ at: 'after smith preview', subject: sub1 });
  // Now preview Socrates WITHOUT closing — the new call should restore to philosophy first, then switch to philosophy (same).
  await page.evaluate(() => __corpusPreviewReveal('socrates', 3, { kind: 'frame' }));
  await page.waitForTimeout(1500);
  const sub2 = await page.evaluate(() => state.subject);
  steps.push({ at: 'after socrates preview (should be philosophy)', subject: sub2 });
  return steps;
};
const steps = await seq();
console.log(JSON.stringify(steps, null, 2));
const pass = steps[0].subject === 'philosophy'
  && steps[1].subject === 'economics'
  && steps[2].subject === 'philosophy';
console.log(pass ? '[PASS] subject-leak chain OK' : '[FAIL] subject leaked');
await browser.close(); app.s.close();

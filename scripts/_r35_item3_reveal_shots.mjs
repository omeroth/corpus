// R35 item 3 — reveal first-meeting shot per subject to show plate colour.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round35';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
function startServer(root) { const server = createServer(async (req, res) => { try { let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/' || p === '') p = '/index.html'; const abs = join(root, p); res.writeHead(200, { 'Content-Type': MIME[extname(abs)] || 'application/octet-stream' }); res.end(await readFile(abs)); } catch (e) { if(!res.headersSent) res.writeHead(404); res.end(); } }); return new Promise(r => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port }))); }
const app = await startServer(WWW);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
async function cap(subject, thinkerId, pts) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(({ s, tid, p }) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', s);
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('_corpus_debug', '1');
    const _dp = {}; _dp[tid] = p;
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:s, lang:'en', completedDays:{}, _debugThinkerPoints:_dp, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true,economics:true,psychology:true}, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  }, { s: subject, tid: thinkerId, p: pts });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.evaluate((tid) => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal(tid, 2);
  }, thinkerId);
  await page.waitForTimeout(5000);
  await page.screenshot({ path: `${OUT}/reveal-plain-${subject}-393-en.png`, fullPage: false });
  await ctx.close();
}
await cap('psychology', 'kahneman', 2);
await cap('economics',  'smith',    2);
await cap('philosophy', 'socrates', 2);
await browser.close(); app.server.close();
console.log(`shots → ${OUT}/reveal-plain-*-393-en.png`);

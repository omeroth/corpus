// R35 item 3 — psychology + economics Pantheon with unframed cards,
// and reveal p=1 (first meeting plain tier) for each subject.
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
async function cap(subject, lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(({ s, l }) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', s);
    localStorage.setItem('corpus_lang', l);
    localStorage.setItem('_corpus_dev_premium', '1');
    const pts = {};
    // Give the first thinker of each subject 1 point (unframed/plain).
    if (s === 'psychology') { pts.kahneman = 1; pts.libet = 2; }
    else if (s === 'economics') { pts.smith = 1; pts.marx = 2; }
    else { pts.aurelius = 1; pts.aristotle = 2; }
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:s, lang:l, completedDays:{}, _debugThinkerPoints:pts, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{philosophy:true,economics:true,psychology:true}, dailyStreak:0, xp:0, currentScreen:'pantheon', isPaid:true }));
  }, { s: subject, l: lang });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.evaluate(() => { try { showScreen('pantheon'); renderPantheon(); } catch(_){} });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/pantheon-${subject}-393-${lang}.png`, fullPage: false });
  // Also sample the plate CSS variables of the first .tier-plain plate.
  const vars = await page.evaluate(() => {
    const plate = document.querySelector('.thinker-plate.tier-plain');
    if (!plate) return null;
    const cs = getComputedStyle(plate);
    return { d: cs.getPropertyValue('--d').trim(), p1: cs.getPropertyValue('--p1').trim(), p2: cs.getPropertyValue('--p2').trim(), e: cs.getPropertyValue('--e').trim() };
  });
  console.log(`${subject} plain plate vars: ${JSON.stringify(vars)}`);
  await ctx.close();
}
await cap('psychology', 'en');
await cap('economics', 'en');
await cap('philosophy', 'en');
await browser.close(); app.server.close();
console.log(`shots → ${OUT}/pantheon-*-393-en.png`);

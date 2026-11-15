// Economics end-of-subject verification — home shows chapters 1-7 +
// bonuses, no ch8 "Economics and the Future" / "כלכלה ועתיד" / coming-
// soon card. EN + HE snapshots at 393x852.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/scripts/econ7-end-shots';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml', '.jpg':'image/jpeg' };
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

async function runCase({ lang }) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((args) => {
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_lang', args.lang);
    localStorage.setItem('corpus_subject', 'economics');
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
    // Mark every day of every economics chapter + bonuses as completed
    // so the "finished all economics" state is active and the last
    // dialogue of ch7 can be reached without a reader step.
    const cd = {};
    const pre = 'economics-';
    for (let w = 1; w <= 7; w++) for (let d = 1; d <= 7; d++) cd[pre + w + '-' + d] = true;
    for (let d = 1; d <= 5; d++) cd[pre + 'bonusEcon1-' + d] = true;
    for (let d = 1; d <= 5; d++) cd[pre + 'bonusEcon2-' + d] = true;
    localStorage.setItem('corpus_state', JSON.stringify({
      v: 3, subject:'economics', lang: args.lang, completedDays: cd,
      dailyStreak: 10, xp: 2000, activeDates: ['2026-11-14'],
      framesExplainerSeen: true, framesOwlBeatSeen: true, streakIntroSeen: true,
      bonusUnlockShown: { economics: true },
      currentScreen: 'home',
    }));
  }, { lang });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil:'load' });
  await page.waitForTimeout(600);
  await page.evaluate(() => { try{renderHome();}catch(_){} try{showScreen('home');}catch(_){} });
  await page.waitForTimeout(400);
  const scan = await page.evaluate(() => {
    const titles = Array.from(document.querySelectorAll('.level-title')).map(n => (n.textContent || '').trim());
    // Scope ch8/coming-soon match to the home chapter column, not
    // full body.textContent — hidden overlays (chapter-complete,
    // generic subject-lock sheet) also carry these strings but
    // aren't visible to the user on the home screen.
    const homeScope = document.getElementById('screen-home') || document.body;
    const homeText = Array.from(homeScope.querySelectorAll('.level-card, .week-container')).map(n => n.textContent || '').join(' ');
    const anyCh8 = homeText.match(/Economics and the Future|כלכלה ועתיד|COMING SOON|בקרוב/i);
    // Chapter-complete overlay carries "Continue to Next Chapter";
    // only count it as a regression if the overlay is actually active.
    const overlay = document.getElementById('chapter-complete-overlay');
    const overlayActive = overlay && (overlay.classList.contains('active') || getComputedStyle(overlay).display !== 'none');
    const continueBtn = document.getElementById('chapter-continue-btn');
    const continueBtnVisible = continueBtn && overlayActive && getComputedStyle(continueBtn).display !== 'none';
    return { titles, titleCount: titles.length, anyCh8Match: anyCh8 ? anyCh8[0] : null, overlayActive: !!overlayActive, continueBtnVisible: !!continueBtnVisible };
  });
  await page.screenshot({ path: join(OUT, `econ-home-${lang}.png`), fullPage: true });
  console.log(`[${lang}]`, JSON.stringify(scan));
  const noCh8 = !scan.anyCh8Match;
  const noContinueTease = !scan.continueBtnVisible;
  console.log(`${noCh8 && noContinueTease ? 'PASS' : 'FAIL'} ${lang}: noCh8=${noCh8} noContinueTease=${noContinueTease}`);
  await ctx.close();
  return noCh8 && noContinueTease;
}

const results = [];
results.push(await runCase({ lang: 'en' }));
results.push(await runCase({ lang: 'he' }));

await browser.close();
app.server.close();
const allPass = results.every(Boolean);
console.log(allPass ? 'ALL PASS' : 'FAIL');
process.exit(allPass ? 0 : 1);

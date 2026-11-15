// Screenshots for the "end philosophy at chapter 7" edits:
//   1. ch7 day 7 depth section (EN + HE) — the new closing paragraph.
//   2. Home in philosophy with all chapters finished (EN + HE) — confirm
//      no chapter 8 card, bubble shows "You finished everything!".
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/scripts/phil7-end-shots';
await mkdir(OUT, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.svg':'image/svg+xml' };
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

async function boot(lang, seedState) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((args) => {
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_lang', args.lang);
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
    if (args.seedState) localStorage.setItem('corpus_state', JSON.stringify(args.seedState));
  }, { lang, seedState });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  return { ctx, page };
}

// 1) ch7 day 7 depth section
for (const lang of ['en', 'he']) {
  const { ctx, page } = await boot(lang);
  await page.evaluate((lang) => {
    try { setAppLang(lang); } catch(_){}
    state.currentWeek = 7;
    state.currentDay = 7;
    state.currentSection = 3;  // 0:idea, 1:source, 2:explanation, 3:depth
    try { showScreen('reader'); } catch(_){}
    try { renderReader(); } catch(e){ console.error(e); }
  }, lang);
  await page.waitForTimeout(400);
  const path = join(OUT, `ch7-d7-depth-${lang}.png`);
  await page.screenshot({ path });
  console.log('wrote', path);
  await ctx.close();
}

// 2) Home in philosophy with all chapters finished.
// Build a completedDays object marking every day in every non-empty week.
function buildCompletedState(lang) {
  // We can't import the content module here, so just enumerate the days
  // we know ship: weeks 1,2,3,4,5,7 have 7 days (id 1..7); week 6 has 8;
  // bonus2 has 6 days (ids 0..5).
  const completedDays = {};
  const put = (wk, days) => { for (const d of days) completedDays[`philosophy-${wk}-${d}`] = true; };
  put(1, [1,2,3,4,5,6,7]);
  put(2, [1,2,3,4,5,6,7]);
  put(3, [1,2,3,4,5,6,7]);
  put(4, [1,2,3,4,5,6,7]);
  put(5, [1,2,3,4,5,6,7]);
  put(6, [1,2,3,4,5,6,7,8]);
  put(7, [1,2,3,4,5,6,7]);
  put('bonus2', [0,1,2,3,4,5]);
  return {
    v: 3, lang, subject: 'philosophy',
    completedDays,
    dailyStreak: 7, xp: 2500,
    activeDates: ['2026-11-01','2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07'],
    framesExplainerSeen: true, framesOwlBeatSeen: true, streakIntroSeen: true,
    bonusUnlockShown: { philosophy: true },
    currentScreen: 'home',
  };
}
for (const lang of ['en', 'he']) {
  const { ctx, page } = await boot(lang, buildCompletedState(lang));
  await page.evaluate(() => {
    try { renderHome(); } catch(_){}
    try { showScreen('home'); } catch(_){}
  });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => {
    const hv = document.querySelector('#screen-home');
    // Scrape rendered chapter eyebrows + titles from the home view.
    const cards = Array.from(document.querySelectorAll('.level-card, .hv-chapter-card, .hv-chapter'));
    const titles = Array.from(document.querySelectorAll('.lv-title, .hv-chapter-title, .week-title, .level-card .lc-title, .lc-title'))
      .map(e => e.textContent.trim()).filter(Boolean);
    const bubbles = Array.from(document.querySelectorAll('.hv-bubble, .hv-thinker-bubble, .hv-bubble-text, [data-hv-bubble]'))
      .map(e => e.textContent.trim()).filter(Boolean);
    const anyCh8 = (document.body.textContent || '').match(/Philosophy of Science|פילוסופיה של המדע|COMING SOON|בקרוב/i);
    return { titleCount: titles.length, titles, bubbles, anyCh8MatchStr: anyCh8 ? anyCh8[0] : null };
  });
  console.log('[home ' + lang + ']', JSON.stringify(info));
  const path = join(OUT, `home-all-done-${lang}.png`);
  // Scroll to bottom to make sure the last chapter card (ch7) is shown.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path, fullPage: true });
  console.log('wrote', path);
  await ctx.close();
}

await browser.close();
app.server.close();

// Round 24 device-size proof shots.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/design-ref/round24';
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

async function openCtx(w, h, lang, ts) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(({l, ts}) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    if (ts) localStorage.setItem('corpus_text_size', String(ts));
    const st = { v:3, subject:'philosophy', lang:l, completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true };
    localStorage.setItem('corpus_state', JSON.stringify(st));
  }, {l: lang, ts});
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.waitForTimeout(300);
  return { ctx, page };
}

async function shotQuiz(label, w, h, lang, ts, qLong) {
  const { ctx, page } = await openCtx(w, h, lang, ts);
  await page.evaluate((long) => {
    openReader(1, 1);
    const intro = document.getElementById('thinker-intro');
    if (intro) intro.style.display = 'none';
    const sections = ((getW().find(w=>w.id===state.currentWeek)||{}).days.find(d=>d.id===state.currentDay)||{}).sections;
    const quizIdx = sections.findIndex(s => s && s.type === 'quiz');
    state.currentSection = quizIdx;
    renderReader();
    if (long) {
      const q = document.querySelector('.rd-qq .rd-gb');
      if (q) q.textContent = 'This is a deliberately long quiz question that spans multiple lines so the bubble grows significantly taller than the character and we can prove the tail still points at the mouth.';
    }
  }, qLong);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: false });
  await ctx.close();
}

async function shotFirst(label, w, h, lang) {
  const { ctx, page } = await openCtx(w, h, lang, null);
  await page.evaluate(() => {
    document.body.classList.add('on-reader-v7');
    document.body.classList.add('reader-editorial');
    _debugThinkerReveal('socrates', 1);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/${label}-pre.png`, fullPage: false });
  await page.evaluate(() => { const s = document.getElementById('rv-stg'); if (s && s.onclick) s.onclick(); });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/${label}-post.png`, fullPage: false });
  await ctx.close();
}

// Quiz tail — short + long, EN + HE, SE + 393 + 430
for (const [w, h, name] of [[375, 667, 'se'], [393, 852, '393'], [430, 932, '430']]) {
  for (const lang of ['en', 'he']) {
    await shotQuiz(`quiz-${name}-${lang}-short`, w, h, lang, null, false);
    await shotQuiz(`quiz-${name}-${lang}-long`, w, h, lang, null, true);
  }
}
// Quiz 145% font scale
await shotQuiz('quiz-393-en-145', 393, 852, 'en', 145, false);
await shotQuiz('quiz-393-he-145', 393, 852, 'he', 145, false);

// First meeting — SE + 393 + 430, EN + HE, pre + post
for (const [w, h, name] of [[375, 667, 'se'], [393, 852, '393'], [430, 932, '430']]) {
  for (const lang of ['en', 'he']) {
    await shotFirst(`first-${name}-${lang}`, w, h, lang);
  }
}

await browser.close(); app.server.close();
console.log(`shots → ${OUT}/`);

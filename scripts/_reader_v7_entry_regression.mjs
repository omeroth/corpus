// Permanent regression for round 8 item 3 — every reader-open path must
// land in v7 scope (body.on-reader-v7 + #screen-reader.reader-v7), and
// the quiz_summary sub-headline for chapter-summary dialogues (no
// thinker) must NOT read "Every question about , answered right."
//
// Covers:
//   a. openReader(1, 1) → v7 scope set
//   b. handleHeroContinue (mid-dialogue resume via "Continue" card) →
//      v7 scope set [REGRESSION — the earlier version bypassed openReader
//      and skipped the on-reader-v7 class, rendering the legacy chrome]
//   c. quiz_summary with a thinker → copy includes the thinker name
//   d. quiz_summary with chapter-summary day (thinkerId: null) → copy
//      falls back to the "this round" phrasing, not an empty slot
//
// Each case passes/fails independently.
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

const results = [];
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

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
      // Non-subscriber state. completedDays covers 1-1 → 1-6 so dialogue
      // 7 is the next-up and matches the "finishing last dialogue of
      // chapter 1" scenario.
      const s = { v:3, subject:'philosophy', lang:'en',
        completedDays:{
          'philosophy-1-1':true,'philosophy-1-2':true,'philosophy-1-3':true,
          'philosophy-1-4':true,'philosophy-1-5':true,'philosophy-1-6':true,
        },
        framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
        bonusUnlockShown:{philosophy:true},
        dailyStreak:5, xp:420, currentScreen:'home',
        isPaid:false };
      localStorage.setItem('corpus_state', JSON.stringify(s));
    } catch(_){}
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  return { ctx, page };
}

// a. openReader → v7 scope
{
  const { ctx, page } = await freshPage();
  await page.evaluate(() => { openReader(1, 1); });
  await page.waitForTimeout(400);
  const scope = await page.evaluate(() => ({
    body: document.body.classList.contains('on-reader-v7'),
    sr: document.getElementById('screen-reader').classList.contains('reader-v7'),
    hasRdTop: !!document.querySelector('.rd-top'),
  }));
  rec('a. openReader → v7 scope + rd-top chrome', scope.body && scope.sr && scope.hasRdTop, JSON.stringify(scope));
  await ctx.close();
}

// b. handleHeroContinue → v7 scope (regression — was bypassing openReader)
{
  const { ctx, page } = await freshPage();
  const scope = await page.evaluate(() => {
    state.lastSection = { week: 1, day: 7, section: 3 };
    const btn = document.getElementById('btn-hero-continue') || (() => {
      const b = document.createElement('button'); b.id = 'btn-hero-continue';
      document.body.appendChild(b); return b;
    })();
    btn._nextWeek = 1; btn._nextDay = 7;
    handleHeroContinue();
    return {
      body: document.body.classList.contains('on-reader-v7'),
      sr: document.getElementById('screen-reader').classList.contains('reader-v7'),
      editorial: document.body.classList.contains('reader-editorial'),
    };
  });
  await page.waitForTimeout(400);
  const chrome = await page.evaluate(() => ({ hasRdTop: !!document.querySelector('.rd-top'), hasRdPhase: !!document.querySelector('.rd-phase') }));
  rec('b. handleHeroContinue (mid-dialogue resume) → v7 scope', scope.body && scope.sr && scope.editorial && chrome.hasRdTop, JSON.stringify({ ...scope, ...chrome }));
  await ctx.close();
}

// c. quiz_summary with real thinker → copy includes name
{
  const { ctx, page } = await freshPage();
  const sl = await page.evaluate(() => {
    // Jump to day 1 (Socrates), scroll to quiz_summary, mark all 3 right.
    openReader(1, 1);
    const chapter = getW().find(w => w.id === 1);
    const day = chapter.days.find(d => d.id === 1);
    const qsIdx = day.sections.findIndex(s => s && s.type === 'quiz_summary');
    state.currentSection = qsIdx;
    const dqKey = `philosophy-1-1`;
    state.dayQuizResults = { [dqKey]: { q1: true, q2: true, q3: true } };
    renderReader();
    const sl = document.querySelector('.qs-sl');
    return sl ? sl.textContent : null;
  });
  rec('c. quiz_summary (Socrates) copy mentions name', !!sl && sl.includes('Socrates'), `sl="${sl}"`);
  await ctx.close();
}

// d. quiz_summary with chapter-summary day (null thinker) → fallback copy, no empty slot
{
  const { ctx, page } = await freshPage();
  const result = await page.evaluate(() => {
    openReader(1, 7);
    const chapter = getW().find(w => w.id === 1);
    const day = chapter.days.find(d => d.id === 7);
    const qsIdx = day.sections.findIndex(s => s && s.type === 'quiz_summary');
    state.currentSection = qsIdx;
    const dqKey = `philosophy-1-7`;
    state.dayQuizResults = { [dqKey]: { q1: true, q2: true, q3: true } };
    renderReader();
    const sl = document.querySelector('.qs-sl');
    return { sl: sl ? sl.textContent : null, thinkerId: day.thinkerId };
  });
  const text = result.sl || '';
  const hasEmptyAbout = /about\s*,/i.test(text) || /על\s*נענו/.test(text);
  const hasFallbackPhrase = text.includes('this round') || text.includes('בסבב הזה');
  rec('d. chapter-summary quiz_summary falls back (no empty "about ,")', !hasEmptyAbout && hasFallbackPhrase, `thinkerId=${result.thinkerId} sl="${text}"`);
  await ctx.close();
}

await browser.close(); app.server.close();
console.log('\n═══ Reader v7 entry ═══');
for (const r of results) console.log((r.pass ? ' ✓ ' : ' ✗ ') + r.name);
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

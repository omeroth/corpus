// Round 21 — proves the footer Back button responds to REAL touch events
// (not just .click() which bypasses pointer-events hit testing).
//
// Round 20 regression used Playwright's .click() API which calls the
// handler directly and bypasses pointer-events: none on the parent
// #reader-btn-bar. On device, taps on the Back button were silently
// swallowed by the parent's pointer-events: none because Back lacked
// the pointer-events: auto override Continue has.
//
// This regression uses page.touchscreen.tap(x, y) which goes through
// the full hit-testing pipeline, so pointer-events: none would block
// it just like on device.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
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

async function openCtx(lang) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((l) => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1');
    localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', l);
    const st = { v:3, subject:'philosophy', lang:l, completedDays:{},
      framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true,
      bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true };
    localStorage.setItem('corpus_state', JSON.stringify(st));
  }, lang);
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.waitForTimeout(300);
  return { ctx, page };
}

async function navigate(page, sectionIdx) {
  await page.evaluate((idx) => {
    openReader(1, 1);
    const intro = document.getElementById('thinker-intro');
    if (intro) intro.style.display = 'none';
    state.currentSection = idx;
    renderReader();
  }, sectionIdx);
  await page.waitForTimeout(500);
}

async function tapBack(page) {
  // Tap the center of the Back button via real touch events (not .click).
  const rect = await page.evaluate(() => {
    const b = document.getElementById('reader-section-back-btn');
    return b ? b.getBoundingClientRect().toJSON() : null;
  });
  if (!rect) return false;
  const x = Math.round(rect.left + rect.width / 2);
  const y = Math.round(rect.top + rect.height / 2);
  await page.touchscreen.tap(x, y);
  await page.waitForTimeout(500);
  return true;
}

const results = [];
function rec(name, pass, note) { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

// Case A — reading section N > 0, touch Back → section N-1 (EN)
{
  const { ctx, page } = await openCtx('en');
  await navigate(page, 3);
  const before = await page.evaluate(() => state.currentSection);
  const ok = await tapBack(page);
  const after = await page.evaluate(() => state.currentSection);
  rec('A1. EN reading section 3 → tap Back (touch) → section 2',
      ok && before === 3 && after === 2, `before=${before} after=${after} tapped=${ok}`);
  await ctx.close();
}

// Case B — RTL reading section N > 0, touch Back → section N-1 (HE)
{
  const { ctx, page } = await openCtx('he');
  await navigate(page, 3);
  const before = await page.evaluate(() => state.currentSection);
  await tapBack(page);
  const after = await page.evaluate(() => state.currentSection);
  rec('A2. HE reading section 3 → tap Back (touch) → section 2',
      before === 3 && after === 2, `before=${before} after=${after}`);
  await ctx.close();
}

// Case C — quiz section before answering → tap Back → prev section
{
  const { ctx, page } = await openCtx('en');
  const quizIdx = await page.evaluate(() => {
    openReader(1, 1);
    const intro = document.getElementById('thinker-intro');
    if (intro) intro.style.display = 'none';
    const sections = ((getW().find(w=>w.id===state.currentWeek)||{}).days.find(d=>d.id===state.currentDay)||{}).sections;
    return sections.findIndex(s => s && s.type === 'quiz');
  });
  await page.evaluate((idx) => { state.currentSection = idx; renderReader(); }, quizIdx);
  await page.waitForTimeout(500);
  const before = await page.evaluate(() => state.currentSection);
  await tapBack(page);
  const after = await page.evaluate(() => state.currentSection);
  rec(`B1. EN quiz section ${quizIdx} unanswered → tap Back → section ${quizIdx - 1}`,
      before === quizIdx && after === quizIdx - 1, `before=${before} after=${after}`);
  await ctx.close();
}

// Case D — answered quiz questions stay LOCKED after a Back-and-forward round-trip
// (the round 18 guarantee: readerGoBack preserves quizAnswered).
{
  const { ctx, page } = await openCtx('en');
  const quizIdx = await page.evaluate(() => {
    openReader(1, 1);
    const intro = document.getElementById('thinker-intro');
    if (intro) intro.style.display = 'none';
    const sections = ((getW().find(w=>w.id===state.currentWeek)||{}).days.find(d=>d.id===state.currentDay)||{}).sections;
    return sections.findIndex(s => s && s.type === 'quiz');
  });
  await page.evaluate((idx) => {
    state.currentSection = idx;
    // Simulate an answered question by seeding quizAnswered + quizAttempts.
    state.quizAnswered = { [idx]: true };
    state.quizAttempts = { [idx]: 1 };
    renderReader();
  }, quizIdx);
  await page.waitForTimeout(400);
  await tapBack(page);  // back to reading section before quiz
  await page.evaluate((idx) => { state.currentSection = idx; renderReader(); }, quizIdx);  // forward to quiz
  await page.waitForTimeout(300);
  const stillAnswered = await page.evaluate((idx) => {
    return !!(state.quizAnswered && state.quizAnswered[idx]);
  }, quizIdx);
  rec('C1. Answered quiz stays locked after Back → forward round-trip',
      stillAnswered, `quizAnswered[${quizIdx}]=${stillAnswered}`);
  await ctx.close();
}

// Case E — pointer-events: auto on Back (the root-cause fix). Assert the
// computed value on device-equivalent viewport so a regression that
// re-breaks this (e.g. an editorial CSS cleanup) fails loudly.
{
  const { ctx, page } = await openCtx('en');
  await navigate(page, 2);
  const peBack = await page.evaluate(() => {
    const b = document.getElementById('reader-section-back-btn');
    return b ? getComputedStyle(b).pointerEvents : null;
  });
  rec('D1. Computed pointer-events on Back is "auto" (root-cause guard)',
      peBack === 'auto', `pointer-events=${peBack}`);
  await ctx.close();
}

// Case F — quiz_summary section hides the Back button + Continue is full width.
{
  const { ctx, page } = await openCtx('en');
  const summaryIdx = await page.evaluate(() => {
    openReader(1, 1);
    const intro = document.getElementById('thinker-intro');
    if (intro) intro.style.display = 'none';
    const sections = ((getW().find(w=>w.id===state.currentWeek)||{}).days.find(d=>d.id===state.currentDay)||{}).sections;
    return sections.findIndex(s => s && s.type === 'quiz_summary');
  });
  if (summaryIdx < 0) {
    rec('E1. (skipped) no quiz_summary section in dialogue 1-1', true);
  } else {
    await page.evaluate((idx) => { state.currentSection = idx; renderReader(); }, summaryIdx);
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const back = document.getElementById('reader-section-back-btn');
      const next = document.getElementById('reader-next-btn');
      return {
        hasBack: !!back,
        nextWidth: next ? next.getBoundingClientRect().width : 0,
      };
    });
    rec('E1. Summary hides Back, Continue is full-width',
        !info.hasBack && info.nextWidth > 300, JSON.stringify(info));
  }
  await ctx.close();
}

// Case G — summary content isn't clipped behind the footer (Try again +
// XP chip visible). Simulate a NOT-perfect score so the Try again button
// appears, measure its bottom vs the footer's top.
{
  const { ctx, page } = await openCtx('en');
  const summaryIdx = await page.evaluate(() => {
    openReader(1, 1);
    const intro = document.getElementById('thinker-intro');
    if (intro) intro.style.display = 'none';
    const sections = ((getW().find(w=>w.id===state.currentWeek)||{}).days.find(d=>d.id===state.currentDay)||{}).sections;
    return sections.findIndex(s => s && s.type === 'quiz_summary');
  });
  if (summaryIdx < 0) {
    rec('F1. (skipped) no quiz_summary section', true);
  } else {
    await page.evaluate((idx) => {
      // Seed a 1/3 score so the retry button renders.
      const key = `${state.subject}-${state.currentWeek}-${state.currentDay}`;
      state.dayQuizResults = { [key]: { 0: true, 1: false, 2: false } };
      state.currentSection = idx;
      renderReader();
    }, summaryIdx);
    await page.waitForTimeout(900);
    // Scroll content into view so the retry button sits visually above the footer.
    await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); });
    await page.waitForTimeout(200);
    const geom = await page.evaluate(() => {
      const retry = document.querySelector('.qs-retry');
      const xp = document.querySelector('.qs-xp');
      const foot = document.getElementById('reader-btn-bar');
      return {
        retry: retry ? retry.getBoundingClientRect().toJSON() : null,
        xp: xp ? xp.getBoundingClientRect().toJSON() : null,
        foot: foot ? foot.getBoundingClientRect().toJSON() : null,
      };
    });
    const retryVisible = geom.retry && geom.foot && geom.retry.bottom <= geom.foot.top + 1;
    const xpVisible = geom.xp && geom.foot && geom.xp.bottom <= geom.foot.top + 1;
    rec('F1. Summary Try again + XP chip clear the footer top',
        retryVisible && xpVisible,
        `retry.bottom=${geom.retry && Math.round(geom.retry.bottom)} xp.bottom=${geom.xp && Math.round(geom.xp.bottom)} foot.top=${geom.foot && Math.round(geom.foot.top)}`);
  }
  await ctx.close();
}

// Case H — iPhone SE (375×667). Smaller viewport, make sure Back + Continue
// still fit on one line (no wrap, both at min-height 54).
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform:()=>true, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}})}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done', '1'); localStorage.setItem('corpus_walkthrough_done', '1');
    localStorage.setItem('corpus_subject', 'philosophy'); localStorage.setItem('corpus_lang', 'en');
    const st = { v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, framesOwlBeatSeen:true, streakIntroSeen:true, bonusUnlockShown:{}, dailyStreak:0, xp:0, currentScreen:'home', isPaid:true };
    localStorage.setItem('corpus_state', JSON.stringify(st));
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.waitForTimeout(300);
  await navigate(page, 2);
  const sz = await page.evaluate(() => {
    const back = document.getElementById('reader-section-back-btn');
    const next = document.getElementById('reader-next-btn');
    if (!back || !next) return null;
    const bRect = back.getBoundingClientRect();
    const nRect = next.getBoundingClientRect();
    const bHeight = Math.round(bRect.height);
    const nHeight = Math.round(nRect.height);
    const backNowrap = getComputedStyle(back).whiteSpace;
    const nextNowrap = getComputedStyle(next).whiteSpace;
    return { bHeight, nHeight, backNowrap, nextNowrap, backW: Math.round(bRect.width), nextW: Math.round(nRect.width) };
  });
  rec('G1. SE EN: Back + Continue same height, both nowrap',
      sz && sz.bHeight === sz.nHeight && sz.backNowrap === 'nowrap' && sz.nextNowrap === 'nowrap',
      JSON.stringify(sz));
  await ctx.close();
}

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

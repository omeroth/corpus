// Round 24 item 1 — the thinker + bubble tail must always point at the
// character's mouth/head (top 15-50% of the character box), whatever the
// question length or text size, in EN and HE. Covers the three places
// that use this pattern:
//   .rd-qq  (quiz question in the reader)
//   .rd-guide (reading-section intro bubble)
//   .rp-qrow (streak repair question — same visual pattern)
//
// Measurement: the tail's visible centre Y vs the character's bounding
// box. Tail Y = (bubble::before centre). Pass if tail centre sits in the
// top 15-50% of the character's rect.
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

async function openCtx(w, h, lang, textScale) {
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
  }, { l: lang, ts: textScale });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForFunction(() => document.getElementById('screen-home') && getComputedStyle(document.getElementById('screen-home')).display !== 'none', { timeout: 15000 });
  await page.addStyleTag({ content: `:root { --safe-top: 59px; --safe-bottom: 34px; }` });
  await page.waitForTimeout(300);
  return { ctx, page };
}

// Returns { imgRect, tailCenter, tailBand: top/bottom fraction of char box }
async function measureQuizRow(page, questionOverride) {
  return page.evaluate((qOverride) => {
    openReader(1, 1);
    const intro = document.getElementById('thinker-intro');
    if (intro) intro.style.display = 'none';
    const sections = ((getW().find(w=>w.id===state.currentWeek)||{}).days.find(d=>d.id===state.currentDay)||{}).sections;
    const quizIdx = sections.findIndex(s => s && s.type === 'quiz');
    state.currentSection = quizIdx;
    renderReader();
    // Override question text for the "long" case.
    if (qOverride) {
      const q = document.querySelector('.rd-qq .rd-gb');
      if (q) q.textContent = qOverride;
    }
  }, questionOverride).then(() => page.waitForTimeout(500)).then(() => page.evaluate(() => {
    const row = document.querySelector('.rd-qq');
    const img = row && row.querySelector('img');
    const bubble = row && row.querySelector('.rd-gb');
    if (!row || !img || !bubble) return null;
    const imgR = img.getBoundingClientRect();
    const bubR = bubble.getBoundingClientRect();
    // Measure the tail: use ::before pseudo-element position via inset.
    // We can't getBoundingClientRect on a pseudo-element directly; compute
    // from CSS top + size.
    const before = getComputedStyle(bubble, '::before');
    const tailTopPx = parseFloat(before.top) || 0;      // CSS 'top'
    const tailH = parseFloat(before.height) || 0;
    // Tail centre Y in viewport coords: bubble.top + tailTopPx + tailH/2
    // (minus translate, if any — our rule drops translateY, so pure).
    const tailCY = bubR.top + tailTopPx + tailH / 2;
    const charTop = imgR.top;
    const charBot = imgR.bottom;
    const frac = (tailCY - charTop) / (charBot - charTop);
    return {
      imgRect: { top: imgR.top, bottom: imgR.bottom, height: imgR.height },
      bubbleRect: { top: bubR.top, height: bubR.height },
      tailY: tailCY,
      fraction: frac,
    };
  }));
}

const results = [];
function rec(name, pass, note='') { results.push({ name, pass, note }); console.log((pass ? '[PASS] ' : '[FAIL] ') + name + (note ? '  — ' + note : '')); }

const LONG_Q = 'This is a deliberately long quiz question that spans multiple lines so the bubble grows significantly taller than the character and we can prove the tail still points at the mouth rather than drifting down the bubble as it used to.';

async function run(lang, ts, label) {
  const { ctx, page } = await openCtx(393, 852, lang, ts);
  // Short question (default)
  const shortM = await measureQuizRow(page, null);
  const shortOK = shortM && shortM.fraction >= 0.15 && shortM.fraction <= 0.50;
  rec(`${label} short Q tail in character head/mouth band`,
      shortOK, shortM ? `frac=${shortM.fraction.toFixed(2)} tailY=${Math.round(shortM.tailY)} charY=[${Math.round(shortM.imgRect.top)}, ${Math.round(shortM.imgRect.bottom)}]` : 'no row');
  await ctx.close();

  const ctx2 = await openCtx(393, 852, lang, ts);
  const longM = await measureQuizRow(ctx2.page, LONG_Q);
  const longOK = longM && longM.fraction >= 0.15 && longM.fraction <= 0.50;
  rec(`${label} long Q tail stays in character head/mouth band`,
      longOK, longM ? `frac=${longM.fraction.toFixed(2)} tailY=${Math.round(longM.tailY)} charY=[${Math.round(longM.imgRect.top)}, ${Math.round(longM.imgRect.bottom)}] bubbleH=${Math.round(longM.bubbleRect.height)}` : 'no row');
  await ctx2.ctx.close();
}

// EN + HE × normal (100%) + max (145%)
await run('en', null, '1a. EN @ 100%');
await run('he', null, '1b. HE @ 100%');
await run('en', 145, '1c. EN @ 145%');
await run('he', 145, '1d. HE @ 145%');

// Item 2 — font size ratio at 100% and 145%
{
  const { ctx, page } = await openCtx(393, 852, 'en', null);
  await measureQuizRow(page, null);
  const sizes100 = await page.evaluate(() => {
    const q = document.querySelector('.rd-qq .rd-gb');
    const o = document.querySelector('.quiz-option');
    return { q: parseFloat(getComputedStyle(q).fontSize), o: parseFloat(getComputedStyle(o).fontSize) };
  });
  rec(`2a. @ 100%: question (${sizes100.q.toFixed(1)}px) >= option (${sizes100.o.toFixed(1)}px)`,
      sizes100.q >= sizes100.o, JSON.stringify(sizes100));
  await ctx.close();
}
{
  const { ctx, page } = await openCtx(393, 852, 'en', 145);
  await measureQuizRow(page, null);
  const sizes145 = await page.evaluate(() => {
    const q = document.querySelector('.rd-qq .rd-gb');
    const o = document.querySelector('.quiz-option');
    return { q: parseFloat(getComputedStyle(q).fontSize), o: parseFloat(getComputedStyle(o).fontSize) };
  });
  rec(`2b. @ 145%: question (${sizes145.q.toFixed(1)}px) >= option (${sizes145.o.toFixed(1)}px)`,
      sizes145.q >= sizes145.o, JSON.stringify(sizes145));
  await ctx.close();
}

// Items I changed for item 1 — list them explicitly in the output so the
// summary can be audited.
console.log('\n═══ Thinker + bubble patterns updated ═══');
console.log('  .rd-qq       — quiz question row (reader)');
console.log('  .rd-guide    — reading section intro row (reader)');
console.log('  .rp-qrow     — streak repair question row (modal)');

await browser.close(); app.server.close();
const pass = results.filter(r => r.pass).length;
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);

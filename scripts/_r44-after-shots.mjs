// R44 after shots — screenshot every scene called out in the round.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/r44';
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

async function seed(lang) {
  await page.evaluate((lang) => {
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_onboarding_done','1');
    localStorage.setItem('corpus_walkthrough_done','1');
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang', lang);
    localStorage.setItem('corpus_appearance','light');
    localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang, completedDays:{}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:true, dailyStreak:1, longestStreak:1 }));
    try { loadState(); setAppLang(lang); showScreen('home'); } catch(_){}
    document.documentElement.classList.remove('dark');
    window.__CORPUS_DEBUG_BUILD = true;
    window._rvV8_ENABLED = false;
    document.querySelectorAll('.modal-overlay.active, .onb-screen.onb-active').forEach(m => { m.classList.remove('active','onb-active'); });
    document.querySelectorAll('.modal-overlay, .onb-screen').forEach(m => { m.style.display=''; });
  }, lang);
  await sleep(600);
}

// 1. Hebrew home
await seed('he');
await sleep(400);
const heFonts = await page.evaluate(() => {
  const el = document.createElement('span');
  el.innerHTML = '<span dir="rtl">שלום עולם</span>';
  el.style.cssText='position:absolute;left:-9999px;font-size:30px;';
  document.body.appendChild(el);
  const ff = getComputedStyle(el.firstChild).fontFamily;
  el.remove();
  return { probe: ff, bodyFF: getComputedStyle(document.body).fontFamily };
});
console.log('HE FONTS:', JSON.stringify(heFonts));
execSync(`adb exec-out screencap -p > ${OUT}/01-after-home-he.png`);

// 2. Chapter cards (gift pill)
await seed('en');
await sleep(500);
execSync(`adb exec-out screencap -p > ${OUT}/02-after-home-en-gift.png`);

// 3. First-meeting reveal (socrates p=1)
await seed('en');
await page.evaluate(() => { try { __corpusPreviewReveal('socrates', 1, { kind:'first' }); } catch(_){} });
await sleep(2500);
// Tap the stage to trigger reveal
await page.evaluate(() => { const s = document.getElementById('rv-stg'); if (s) s.click(); });
await sleep(2500);
const firstM = await page.evaluate(() => {
  const flp = document.querySelector('.rv-flp');
  const pill = document.querySelector('.rv-pill');
  const root = document.querySelector('.rv-root');
  const rect = el => el ? el.getBoundingClientRect() : null;
  const fr = rect(flp), pr = rect(pill);
  return {
    rootClasses: root ? root.className : null,
    flpClasses: flp ? flp.className : null,
    flpTransform: flp ? getComputedStyle(flp).transform : null,
    flpTurnActive: flp ? flp.classList.contains('rv-turn') : null,
    rvDone: root ? root.classList.contains('rv-done') : null,
    gap: fr && pr ? Math.round(pr.top - fr.bottom) : null,
    flpH: fr ? Math.round(fr.height) : null,
  };
});
console.log('FIRST-MEETING:', JSON.stringify(firstM));
execSync(`adb exec-out screencap -p > ${OUT}/03-after-first-meeting.png`);

// 4. Met-again (sanity: still 16 gap)
await seed('en');
await page.evaluate(() => { try { __corpusPreviewReveal('socrates', 2, { kind:'point' }); } catch(_){} });
await sleep(4200);
const mag = await page.evaluate(() => {
  const pc = document.querySelector('.rv-pc');
  const pl = document.querySelector('.thinker-plate');
  const body = document.querySelector('.rv-body');
  const r = el => el ? el.getBoundingClientRect() : null;
  const a = r(pc), b = r(pl);
  return {
    gap: a && b ? Math.round(b.top - a.bottom) : null,
    bodyMarginTop: body ? body.style.marginTop : null,
    pcInlineW: pc ? pc.style.width : null,
    viewportH: window.innerHeight,
    pcH: a ? Math.round(a.height) : null,
    pcB: a ? Math.round(a.bottom) : null,
    plT: b ? Math.round(b.top) : null,
  };
});
console.log('MET-AGAIN GAP:', mag);
execSync(`adb exec-out screencap -p > ${OUT}/04-after-met-again.png`);

// 5. Onboarding how-it-works
await page.evaluate(() => {
  try { localStorage.removeItem('corpus_onboarding_done'); localStorage.removeItem('corpus_walkthrough_done'); } catch(_){}
  const step = document.getElementById('onb-v2-how-it-works');
  if (step) {
    document.querySelectorAll('.onb-screen.onb-active').forEach(s => s.classList.remove('onb-active'));
    step.classList.add('onb-active');
    step.style.display = '';
  }
});
await sleep(800);
execSync(`adb exec-out screencap -p > ${OUT}/05-after-how-it-works.png`);

// 6. Onboarding signup (confirm Apple hidden)
await page.evaluate(() => {
  const step = document.getElementById('onb-signup');
  if (step) {
    document.querySelectorAll('.onb-screen.onb-active').forEach(s => s.classList.remove('onb-active'));
    step.classList.add('onb-active');
    step.style.display = '';
  }
});
await sleep(500);
execSync(`adb exec-out screencap -p > ${OUT}/06-after-onb-signup.png`);

await browser.close();
console.log('Shots saved to', OUT);

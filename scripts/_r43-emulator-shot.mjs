// R43 — screenshot __corpusPreviewReveal('socrates', 2, {kind:'point'})
// on the live Android emulator for the quick-fix proof.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/r43-reveal-fit';
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

await page.evaluate(() => {
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done','1');
  localStorage.setItem('corpus_walkthrough_done','1');
  localStorage.setItem('corpus_subject','philosophy');
  localStorage.setItem('corpus_lang','en');
  localStorage.setItem('corpus_appearance','light');
  localStorage.setItem('corpus_state', JSON.stringify({
    v:3, subject:'philosophy', lang:'en', completedDays:{},
    framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home',
    isPaid:true, dailyStreak:1, longestStreak:1,
  }));
  try { loadState(); setAppLang('en'); showScreen('home'); } catch(_){}
  document.documentElement.classList.remove('dark');
  window._rvV8_ENABLED = false;
  window.__CORPUS_DEBUG_BUILD = true;
});

await sleep(500);
await page.evaluate(() => { try { __corpusPreviewReveal('socrates', 2, { kind:'point' }); } catch(_){} });
await sleep(4500);

const measure = await page.evaluate(() => {
  const dc = document.getElementById('dc-thinker-screen');
  const mc = document.getElementById('modal-complete');
  const rect = el => el ? (() => { const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) }; })() : null;
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    mcActive: mc && mc.classList.contains('active'),
    dcDisplay: dc && dc.style.display,
    hasRoot: !!dc.querySelector('.rv-root'),
    debugFlag: window.__CORPUS_DEBUG_BUILD,
    previewFn: typeof window.__corpusPreviewReveal,
    card: rect(dc.querySelector('.rv-pc')),
    plate: rect(dc.querySelector('.thinker-plate')),
    cta: rect(dc.querySelector('.rd-cta')),
    gap: (() => { const c = dc.querySelector('.rv-pc'); const p = dc.querySelector('.thinker-plate'); return c && p ? Math.round(p.getBoundingClientRect().top - c.getBoundingClientRect().bottom) : null; })(),
  };
});
console.log('EMULATOR MEASURE:', JSON.stringify(measure, null, 2));
execSync(`adb exec-out screencap -p > ${OUT}/emulator-socrates-2-point.png`, { stdio: 'ignore' });
console.log(`Screenshot: ${OUT}/emulator-socrates-2-point.png`);
await browser.close();

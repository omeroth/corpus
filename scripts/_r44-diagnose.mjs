// R44 diagnose — on the live emulator, measure Hebrew/English font
// resolution, emoji rendering, Apple button state, how-it-works image
// sizes. One pass, no fixes.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/r44';
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

// Clean state → home
await page.evaluate(() => {
  try { localStorage.clear(); } catch(_){}
  localStorage.setItem('corpus_onboarding_done','1');
  localStorage.setItem('corpus_walkthrough_done','1');
  localStorage.setItem('corpus_subject','philosophy');
  localStorage.setItem('corpus_lang','en');
  localStorage.setItem('corpus_appearance','light');
  localStorage.setItem('corpus_state', JSON.stringify({ v:3, subject:'philosophy', lang:'en', completedDays:{}, framesExplainerSeen:true, streakIntroSeen:true, currentScreen:'home', isPaid:true }));
  try { loadState(); setAppLang('en'); showScreen('home'); } catch(_){}
  window.__CORPUS_DEBUG_BUILD = true;
});
await sleep(500);

// ── 1. Fonts
const fonts = await page.evaluate(async () => {
  const probe = (text, lang) => {
    const el = document.createElement('span');
    el.textContent = text;
    el.style.cssText = 'position:absolute;left:-9999px;font-size:20px;font-weight:800;';
    el.lang = lang;
    document.body.appendChild(el);
    const cs = getComputedStyle(el);
    const ff = cs.fontFamily;
    el.remove();
    return ff;
  };
  const faces = [];
  try {
    for (const f of document.fonts) {
      faces.push({ family: f.family, status: f.status, weight: f.weight, display: f.display });
    }
  } catch (_) {}
  return {
    bodyFF: getComputedStyle(document.body).fontFamily,
    htmlLangHe: (() => { document.documentElement.lang = 'he'; const ff = getComputedStyle(document.body).fontFamily; document.documentElement.lang = 'en'; return ff; })(),
    probeHe: probe('שלום', 'he'),
    probeEn: probe('Hello', 'en'),
    docFontsReady: document.fonts.status,
    faceCount: faces.length,
    byFamily: (() => { const m = {}; for (const f of faces) { m[f.family] = (m[f.family]||[]).concat([`${f.weight}:${f.status}`]); } return m; })(),
    probeHebrewRtl: (() => { const el = document.createElement('span'); el.innerHTML = '<span dir="rtl">שלום עולם</span>'; el.style.cssText='position:absolute;left:-9999px;font-size:30px;'; document.body.appendChild(el); const inner = el.firstChild; const ff = getComputedStyle(inner).fontFamily; el.remove(); return ff; })(),
  };
});
console.log('FONTS:\n', JSON.stringify(fonts, null, 2));
execSync(`adb exec-out screencap -p > ${OUT}/00-home.png`, { stdio: 'ignore' });

// ── 2. Apple buttons state
const apple = await page.evaluate(() => {
  const ids = ['guest-signup-apple-btn', 'onb-signup-apple-btn', 'signin-required-apple-btn'];
  const result = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) { result[id] = 'MISSING'; return; }
    const cs = getComputedStyle(el);
    const parent = el.closest('.auth-btn-apple') || el;
    const pcs = getComputedStyle(parent);
    result[id] = { display: cs.display, parentDisplay: pcs.display, hasAppleClass: el.classList.contains('auth-btn-apple') };
  });
  return result;
});
console.log('APPLE BTNS:\n', JSON.stringify(apple, null, 2));

// ── 3. How-it-works onboarding step
await page.evaluate(() => {
  try { localStorage.removeItem('corpus_onboarding_done'); localStorage.removeItem('corpus_walkthrough_done'); } catch(_){}
  // Try opening the step directly
  try { if (window._onbShowStep) _onbShowStep(); } catch(_){}
  try { if (window.startOnboardingNew) startOnboardingNew(); } catch(_){}
});
await sleep(1500);
// Walk to how-it-works step
const howItWorks = await page.evaluate(async () => {
  // find and show the how-it-works screen if present
  const step = document.getElementById('onb-v2-how-it-works');
  if (!step) return { present: false };
  document.querySelectorAll('.onb-screen.onb-active').forEach(s => { s.classList.remove('onb-active'); });
  step.classList.add('onb-active');
  step.style.display = '';
  await new Promise(r => setTimeout(r, 500));
  const imgs = Array.from(step.querySelectorAll('img')).map(img => ({
    src: img.src.split('/').slice(-2).join('/'),
    natW: img.naturalWidth, natH: img.naturalHeight,
    rW: Math.round(img.getBoundingClientRect().width),
    rH: Math.round(img.getBoundingClientRect().height),
    ofit: getComputedStyle(img).objectFit,
    opacity: getComputedStyle(img).opacity,
  }));
  return { present: true, imgs };
});
console.log('HOW-IT-WORKS:\n', JSON.stringify(howItWorks, null, 2));
execSync(`adb exec-out screencap -p > ${OUT}/01-how-it-works-android.png`, { stdio: 'ignore' });

await browser.close();

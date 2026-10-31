// R44b verify — bell step + Apple-hidden check.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const OUT = '/Users/omeroth/Desktop/r44b';
mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const browser = await chromium.connectOverCDP('http://localhost:9222');
const page = browser.contexts()[0].pages()[0];

async function seedOnboarding(lang) {
  await page.evaluate((lang) => {
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject','philosophy');
    localStorage.setItem('corpus_lang', lang);
    localStorage.setItem('corpus_appearance','light');
    try { setAppLang(lang); } catch(_){}
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('platform-android');
    document.querySelectorAll('.modal-overlay.active, .onb-screen.onb-active').forEach(m => m.classList.remove('active','onb-active'));
    document.querySelectorAll('.modal-overlay, .onb-screen').forEach(m => { m.style.display=''; });
  }, lang);
  await sleep(400);
}

async function showStep(id) {
  await page.evaluate((id) => {
    document.querySelectorAll('.onb-screen.onb-active').forEach(s => s.classList.remove('onb-active'));
    const s = document.getElementById(id);
    if (s) { s.classList.add('onb-active'); s.style.display = ''; }
  }, id);
  await sleep(500);
}

// 1. Reminder promise step EN
await seedOnboarding('en');
await showStep('onb-v2-reminder-promise');
await page.evaluate(() => { try { _onbV2PrepareReminderPromise && _onbV2PrepareReminderPromise(); } catch(_){} });
await sleep(600);
const bellInfo = await page.evaluate(() => {
  const bell = document.querySelector('.onb-v7-rp-bell svg');
  if (!bell) return null;
  const use = bell.querySelector('use');
  return { viewBox: bell.getAttribute('viewBox'), hasUse: !!use, href: use ? use.getAttribute('href') : null };
});
console.log('BELL (EN):', JSON.stringify(bellInfo));
execSync(`adb exec-out screencap -p > ${OUT}/01-bell-en.png`);

// 2. Reminder promise HE
await seedOnboarding('he');
await showStep('onb-v2-reminder-promise');
await page.evaluate(() => { try { _onbV2PrepareReminderPromise && _onbV2PrepareReminderPromise(); } catch(_){} });
await sleep(600);
execSync(`adb exec-out screencap -p > ${OUT}/02-bell-he.png`);

// 3. Apple hidden audit
const apple = await page.evaluate(() => {
  const ids = ['auth-apple-btn', 'guest-signup-apple-btn', 'onb-signup-apple-btn', 'signin-required-apple-btn'];
  const result = {};
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) { result[id] = 'MISSING'; return; }
    const cs = getComputedStyle(el);
    // Also walk up to confirm no parent is hiding
    result[id] = { display: cs.display, visibility: cs.visibility };
  });
  // Also test dynamic selectors
  result['[data-act=apple]'] = Array.from(document.querySelectorAll('[data-act="apple"]')).map(el => ({ display: getComputedStyle(el).display }));
  result['html.platform-android'] = document.documentElement.classList.contains('platform-android');
  return result;
});
console.log('APPLE AUDIT:', JSON.stringify(apple, null, 2));

// 4. Auth screen screenshot (expose auth screen then show)
await page.evaluate(() => { try { showScreen('auth'); } catch(_){} });
await sleep(600);
execSync(`adb exec-out screencap -p > ${OUT}/03-auth-screen.png`);

await browser.close();

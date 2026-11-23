// Playwright screenshots for the Black Friday paywall theme.
// Captures each shell (modal + onboarding) × each subject × EN/HE at
// iPhone 14 (390×844) with the BF theme forced via a synthetic RC
// offering + dev override.
//
// 3 subjects × 2 langs × 2 shells = 12 BF shots + 2 default-theme
// control shots for comparison. Written to /tmp/bf-shots/.
import { createRequire } from 'node:module';
const require = createRequire('/Users/omeroth/CORPUS/');
const { chromium } = require('playwright');
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const OUT = '/tmp/bf-shots';
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const INDEX_URL = pathToFileURL('/Users/omeroth/CORPUS/index.html').href;

// Synthetic prices — 50% off a $89.99 yearly to match the mockup.
const SYNTHETIC_BF = {
  identifier: 'black_friday',
  metadata: { theme: 'black_friday', ends_at: '2026-12-01T07:59:00Z' },
  availablePackages: [
    { identifier: '$rc_annual', packageType: 'ANNUAL',
      product: { identifier: 'corpus_yearly_bf', priceString: '$44.99', price: 44.99, currencyCode: 'USD' } },
    { identifier: '$rc_monthly', packageType: 'MONTHLY',
      product: { identifier: 'corpus_monthly', priceString: '$12.99', price: 12.99, currencyCode: 'USD' } },
  ],
};
const SYNTHETIC_STD = {
  identifier: 'standard',
  availablePackages: [
    { identifier: '$rc_annual', packageType: 'ANNUAL',
      product: { identifier: 'corpus_yearly', priceString: '$89.99', price: 89.99, currencyCode: 'USD' } },
    { identifier: '$rc_monthly', packageType: 'MONTHLY',
      product: { identifier: 'corpus_monthly', priceString: '$12.99', price: 12.99, currencyCode: 'USD' } },
  ],
};

async function prime(page, { lang, subject, bfOn }) {
  // Inject dev gates BEFORE page loads so _isDevPremium / _isBlackFridayActive
  // see them. We set __CORPUS_DEBUG_BUILD via a script tag and the
  // localStorage flags via addInitScript.
  await page.addInitScript(({ lang, subject, bfOn }) => {
    window.__CORPUS_DEBUG_BUILD = true;
    localStorage.setItem('_corpus_debug', '1');
    localStorage.setItem('corpus_subject', subject);
    localStorage.setItem('corpus_lang', lang);
    if (bfOn) localStorage.setItem('_corpus_bf_force', '1');
  }, { lang, subject, bfOn });
}

async function openModalPaywall(page, { subject, lang, bfOn }) {
  // Wait for app shell + install synthetic offerings into the globals
  // the paywall reads. Then call showPaywall directly.
  await page.evaluate(({ subject, lang, bf, std, bfOn }) => {
    window.state = window.state || {};
    state.subject = subject;
    state.lang    = lang;
    if (typeof setAppLang === 'function') try { setAppLang(lang); } catch (_) {}
    if (typeof applyTheme === 'function') try { applyTheme(subject); } catch (_) {}
    // Install offerings
    // Seed module-scope offering globals via the debug hook.
    window.__corpusSetOfferingsForDev({
      black_friday: bfOn ? bf : null,
      standard:     std,
      trial:        bfOn ? bf : std,   // current = bf when sale on
    });
  }, { subject, lang, bf: SYNTHETIC_BF, std: SYNTHETIC_STD, bfOn });

  await page.evaluate(({ subject }) => {
    showPaywall({ subject, weekId: 2, dayId: 1, source: 'screenshot' });
  }, { subject });
  await page.waitForTimeout(400);
}

async function openOnbPaywall(page, { subject, lang, bfOn }) {
  await page.evaluate(({ subject, lang, bf, std, bfOn }) => {
    window.state = window.state || {};
    state.subject = subject;
    state.lang    = lang;
    if (typeof setAppLang === 'function') try { setAppLang(lang); } catch (_) {}
    if (typeof applyTheme === 'function') try { applyTheme(subject); } catch (_) {}
    window.__corpusSetOfferingsForDev({
      black_friday: bfOn ? bf : null,
      standard:     std,
      trial:        bfOn ? bf : std,
    });
    // Mount onboarding paywall shell manually.
    const shell = document.getElementById('onb-v2-paywall');
    document.querySelectorAll('.onb-screen').forEach(s => { s.style.display = 'none'; s.classList.remove('onb-active'); });
    shell.style.display = '';
    shell.classList.add('onb-active');
    _paywallActiveRoot = shell;
    _paywallMode = 'onboarding';
    _activePaywallSource = 'onboarding';
    _renderPaywall();
  }, { subject, lang, bf: SYNTHETIC_BF, std: SYNTHETIC_STD, bfOn });
  await page.waitForTimeout(400);
}

const SUBJECTS = ['philosophy', 'economics', 'psychology'];
const LANGS    = ['en', 'he'];
const SHELLS   = ['modal', 'onboarding'];

const browser = await chromium.launch();

// ── BF ON — all 12 combos ───────────────────────────────────────
for (const subject of SUBJECTS) {
  for (const lang of LANGS) {
    for (const shell of SHELLS) {
      const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
      const page = await ctx.newPage();
      await prime(page, { lang, subject, bfOn: true });
      await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200); // boot + splash
      if (shell === 'modal') await openModalPaywall(page, { subject, lang, bfOn: true });
      else                   await openOnbPaywall(page, { subject, lang, bfOn: true });
      const name = `bf_${shell}_${subject}_${lang}.png`;
      await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
      console.log('✓', name);
      await ctx.close();
    }
  }
}

// ── Default theme — 2 control shots (philosophy, EN/HE, modal) ──
for (const lang of LANGS) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await prime(page, { lang, subject: 'philosophy', bfOn: false });
  await page.goto(INDEX_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  await openModalPaywall(page, { subject: 'philosophy', lang, bfOn: false });
  const name = `default_modal_philosophy_${lang}.png`;
  await page.screenshot({ path: `${OUT}/${name}`, fullPage: false });
  console.log('✓', name);
  await ctx.close();
}

await browser.close();
console.log('\nAll shots in', OUT);

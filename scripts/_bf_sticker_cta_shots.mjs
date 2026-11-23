// BF sticker position + monthly-CTA shots.
// Modal BF paywall + trial-flow step 35 BF, all 3 subjects, EN + HE,
// yearly selected. Plus one monthly-selected shot per shell to verify
// the CTA swaps to CONTINUE.
import { createRequire } from 'node:module';
const require = createRequire('/Users/omeroth/CORPUS/');
const { chromium } = require('playwright');
import { mkdirSync, existsSync } from 'node:fs';

const OUT = process.env.HOME + '/Desktop/pw3-shots';
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const BF = {
  identifier: 'black_friday',
  metadata: { theme: 'black_friday', ends_at: '2026-12-01T07:59:00Z' },
  availablePackages: [
    { identifier: '$rc_annual',      packageType: 'ANNUAL',  product: { identifier: 'corpus_yearly_bf_trial', priceString: '$44.99', price: 44.99, currencyCode: 'USD' } },
    { identifier: '$rc_monthly',     packageType: 'MONTHLY', product: { identifier: 'corpus_monthly',          priceString: '$12.99', price: 12.99, currencyCode: 'USD' } },
    { identifier: 'bf_annual_paid',  packageType: 'ANNUAL',  product: { identifier: 'corpus_yearly_bf',        priceString: '$44.99', price: 44.99, currencyCode: 'USD' } },
    { identifier: 'bf_monthly_paid', packageType: 'MONTHLY', product: { identifier: 'corpus_monthly_standard', priceString: '$12.99', price: 12.99, currencyCode: 'USD' } },
  ],
};

async function shoot({ shell, subject, lang, selected, name }) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(({ lang, subject }) => {
    window.__CORPUS_DEBUG_BUILD = true;
    localStorage.setItem('_corpus_debug', '1');
    localStorage.setItem('corpus_subject', subject);
    localStorage.setItem('corpus_lang', lang);
    localStorage.setItem('_corpus_bf_force', '1');
  }, { lang, subject });
  await page.goto('file:///Users/omeroth/CORPUS/index.html');
  await page.waitForTimeout(1200);
  await page.evaluate(({ subject, lang, bf, shell, selected }) => {
    state.subject = subject; state.lang = lang;
    if (typeof setAppLang === 'function') try { setAppLang(lang); } catch(_){}
    if (typeof applyTheme === 'function') try { applyTheme(subject); } catch(_){}
    const std = { identifier: 'standard', availablePackages: [
      { identifier: '$rc_annual',  packageType: 'ANNUAL',  product: { identifier: 'corpus_yearly',  priceString: '$89.99', price: 89.99, currencyCode: 'USD' } },
      { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'corpus_monthly', priceString: '$12.99', price: 12.99, currencyCode: 'USD' } },
    ]};
    __corpusSetOfferingsForDev({ black_friday: bf, standard: std, trial: bf });
    _onbTrialEligibility = 'ineligible';
    _bfTrialEligibility  = 'ineligible';
    _paywallSelectedPkg  = selected;
    document.querySelectorAll('.onb-screen').forEach(s => { s.style.display = 'none'; s.classList.remove('onb-active'); });
    const mp = document.getElementById('modal-paywall');
    if (mp) { mp.classList.remove('active'); mp.style.display = 'none'; }
    if (shell === 'trial') {
      const el = document.getElementById('onb-v2-paywall');
      el.style.display = ''; el.classList.add('onb-active');
      _paywallActiveRoot = el; _paywallMode = 'onboarding'; _activePaywallSource = 'onboarding';
      _renderPaywall();
    } else {
      // Modal BF paywall.
      const el = document.getElementById('modal-paywall');
      el.classList.add('active'); el.style.display = '';
      _paywallActiveRoot = el; _paywallMode = 'modal'; _activePaywallSource = 'modal';
      _renderPaywall();
    }
  }, { subject, lang, bf: BF, shell, selected });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log('✓', name);
  await b.close();
}

const SUBJECTS = ['philosophy', 'economics', 'psychology'];

// Yearly selected — matrix of 3 subjects × 2 langs × 2 shells.
for (const subject of SUBJECTS) {
  for (const lang of ['en', 'he']) {
    for (const shell of ['modal', 'trial']) {
      await shoot({
        shell, subject, lang, selected: 'yearly',
        name: `bf_${shell}_${subject}_${lang}_yearly`,
      });
    }
  }
}
// Monthly selected — 1 per shell (philosophy EN), both shells.
for (const shell of ['modal', 'trial']) {
  await shoot({
    shell, subject: 'philosophy', lang: 'en', selected: 'monthly',
    name: `bf_${shell}_philosophy_en_monthly`,
  });
}
console.log('\n→ ' + OUT);

// Regression: BF sticker does not overlap the chibi's head (top 45%
// of the chibi box) and overlaps the chibi's horizontal width by at
// most 15%. Checked on modal BF paywall + trial-flow step 35 BF, all
// three subjects, EN + HE. Also asserts that Monthly-selected swaps
// the CTA away from "CLAIM {pct}% OFF" in both shells + the sheet.
import { createRequire } from 'node:module';
const require = createRequire('/Users/omeroth/CORPUS/');
const { chromium } = require('playwright');

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
const STD = { identifier: 'standard', availablePackages: [
  { identifier: '$rc_annual',  packageType: 'ANNUAL',  product: { identifier: 'corpus_yearly',  priceString: '$89.99', price: 89.99, currencyCode: 'USD' } },
  { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'corpus_monthly', priceString: '$12.99', price: 12.99, currencyCode: 'USD' } },
]};

const assert = (label, ok) => console.log((ok ? '✓' : '✗') + ' ' + label);
let anyFail = false;
const check = (label, ok) => { if (!ok) anyFail = true; assert(label, ok); };

const b = await chromium.launch();

for (const shell of ['modal', 'trial']) {
  for (const subject of ['philosophy', 'economics', 'psychology']) {
    for (const lang of ['en', 'he']) {
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
      await page.waitForTimeout(1000);
      const geo = await page.evaluate(({ shell, subject, lang, bf, std }) => {
        state.subject = subject; state.lang = lang;
        if (typeof setAppLang === 'function') try { setAppLang(lang); } catch(_){}
        if (typeof applyTheme === 'function') try { applyTheme(subject); } catch(_){}
        __corpusSetOfferingsForDev({ black_friday: bf, standard: std, trial: bf });
        _onbTrialEligibility = 'ineligible';
        _bfTrialEligibility  = 'ineligible';
        _paywallSelectedPkg  = 'yearly';
        document.querySelectorAll('.onb-screen').forEach(s => { s.style.display = 'none'; s.classList.remove('onb-active'); });
        const mp = document.getElementById('modal-paywall');
        if (mp) { mp.classList.remove('active'); mp.style.display = 'none'; }
        if (shell === 'trial') {
          const el = document.getElementById('onb-v2-paywall');
          el.style.display = ''; el.classList.add('onb-active');
          _paywallActiveRoot = el; _paywallMode = 'onboarding'; _activePaywallSource = 'onboarding';
          _renderPaywall();
        } else {
          const el = document.getElementById('modal-paywall');
          el.classList.add('active'); el.style.display = '';
          _paywallActiveRoot = el; _paywallMode = 'modal'; _activePaywallSource = 'modal';
          _renderPaywall();
        }
        const root = _paywallActiveRoot;
        const chibiSel   = shell === 'trial' ? '.pw-trial-chibi'   : '.paywall-bf-chibi';
        const stickerSel = shell === 'trial' ? '.pw-trial-sticker' : '.paywall-bf-sticker:not(.paywall-bf-sticker-inline)';
        const chibi   = root.querySelector(chibiSel);
        const sticker = root.querySelector(stickerSel);
        const cr = chibi.getBoundingClientRect();
        const sr = sticker.getBoundingClientRect();
        const chibiHeadBottom = cr.top + cr.height * 0.45;
        const overlapX = Math.max(0, Math.min(cr.right, sr.right) - Math.max(cr.left, sr.left));
        const overlapY = Math.max(0, Math.min(cr.bottom, sr.bottom) - Math.max(cr.top, sr.top));
        return {
          chibiTop: cr.top, chibiBottom: cr.bottom, chibiLeft: cr.left, chibiRight: cr.right, chibiWidth: cr.width,
          stickerTop: sr.top, stickerBottom: sr.bottom, stickerLeft: sr.left, stickerRight: sr.right, stickerWidth: sr.width,
          overlapX, overlapY, chibiHeadBottom,
        };
      }, { shell, subject, lang, bf: BF, std: STD });

      const headRule   = geo.stickerTop >= geo.chibiHeadBottom;
      const overlapRule = geo.overlapX <= geo.chibiWidth * 0.15 + 0.5;
      if (!headRule || !overlapRule) {
        console.log(`  debug ${shell}/${subject}/${lang}:`, JSON.stringify(geo));
      }
      check(`${shell}/${subject}/${lang} — sticker clears head (top 45%)`, headRule);
      check(`${shell}/${subject}/${lang} — horizontal overlap ≤ 15% of chibi width (${geo.overlapX.toFixed(1)}px / ${(geo.chibiWidth*0.15).toFixed(1)}px)`, overlapRule);
      // Mirror: in HE, sticker's right edge should be beyond chibi's right edge.
      if (lang === 'he') {
        check(`${shell}/${subject}/${lang} — RTL mirror: sticker extends past chibi right`, geo.stickerRight >= geo.chibiRight - 1);
      } else {
        check(`${shell}/${subject}/${lang} — LTR: sticker extends past chibi left`, geo.stickerLeft <= geo.chibiLeft + 1);
      }
      await ctx.close();
    }
  }
}

// CTA copy: Monthly-selected swaps away from "CLAIM X% OFF".
console.log('\n--- Monthly-selected CTA copy ---');
for (const shell of ['modal', 'trial']) {
  for (const lang of ['en', 'he']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.addInitScript(({ lang }) => {
      window.__CORPUS_DEBUG_BUILD = true;
      localStorage.setItem('_corpus_debug', '1');
      localStorage.setItem('corpus_subject', 'philosophy');
      localStorage.setItem('corpus_lang', lang);
      localStorage.setItem('_corpus_bf_force', '1');
    }, { lang });
    await page.goto('file:///Users/omeroth/CORPUS/index.html');
    await page.waitForTimeout(1000);
    const copy = await page.evaluate(({ shell, lang, bf, std }) => {
      state.subject = 'philosophy'; state.lang = lang;
      if (typeof setAppLang === 'function') try { setAppLang(lang); } catch(_){}
      if (typeof applyTheme === 'function') try { applyTheme('philosophy'); } catch(_){}
      __corpusSetOfferingsForDev({ black_friday: bf, standard: std, trial: bf });
      _onbTrialEligibility = 'ineligible';
      _bfTrialEligibility  = 'ineligible';
      document.querySelectorAll('.onb-screen').forEach(s => { s.style.display = 'none'; s.classList.remove('onb-active'); });
      const mp = document.getElementById('modal-paywall');
      if (mp) { mp.classList.remove('active'); mp.style.display = 'none'; }
      if (shell === 'trial') {
        const el = document.getElementById('onb-v2-paywall');
        el.style.display = ''; el.classList.add('onb-active');
        _paywallActiveRoot = el; _paywallMode = 'onboarding'; _activePaywallSource = 'onboarding';
      } else {
        const el = document.getElementById('modal-paywall');
        el.classList.add('active'); el.style.display = '';
        _paywallActiveRoot = el; _paywallMode = 'modal'; _activePaywallSource = 'modal';
      }
      _paywallSelectedPkg = 'yearly';
      _renderPaywall();
      const ctaSel = shell === 'trial' ? '.pw-trial-cta' : '.paywall-bf-cta';
      const yearlyCta = _paywallActiveRoot.querySelector(ctaSel).textContent.trim();
      _selectPaywallPackage('monthly');
      const monthlyMain = _paywallActiveRoot.querySelector(ctaSel).textContent.trim();
      // The .pw-plans-sheet lives inside the onboarding paywall only;
      // the modal shell has no bottom sheet.
      let monthlySheet = null, yearlySheet = null;
      if (shell === 'trial') {
        _openPaywallPlansSheet();
        _selectPaywallPackage('monthly');
        monthlySheet = _paywallActiveRoot.querySelector('.pw-plans-cta').textContent.trim();
        _selectPaywallPackage('yearly');
        yearlySheet = _paywallActiveRoot.querySelector('.pw-plans-cta').textContent.trim();
      }
      return { yearlyCta, monthlyMain, monthlySheet, yearlySheet };
    }, { shell, lang, bf: BF, std: STD });

    console.log(JSON.stringify({ shell, lang, ...copy }, null, 2));
    const expectClaim = lang === 'en' ? /claim\s+\d+%\s*off/i : /\d+%\s*הנחה/;
    const expectContinue = lang === 'en' ? /continue/i : /להמשיך/;
    check(`${shell}/${lang} — yearly: has claim/discount`, expectClaim.test(copy.yearlyCta));
    check(`${shell}/${lang} — monthly (main): no claim/discount`, !expectClaim.test(copy.monthlyMain));
    check(`${shell}/${lang} — monthly (main): is CONTINUE`, expectContinue.test(copy.monthlyMain));
    if (shell === 'trial') {
      check(`${shell}/${lang} — monthly (sheet): no claim/discount`, !expectClaim.test(copy.monthlySheet));
      check(`${shell}/${lang} — yearly (sheet): has claim/discount`, expectClaim.test(copy.yearlySheet));
    }
    await ctx.close();
  }
}

await b.close();
console.log(anyFail ? '\nFAIL' : '\nALL PASS');
process.exit(anyFail ? 1 : 0);

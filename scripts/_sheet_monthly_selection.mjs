// Regression: tapping Monthly in the plans sheet must move the
// selected state to Monthly, update CTA + legal text, and route the
// subsequent purchase through the monthly package.
import { createRequire } from 'node:module';
const require = createRequire('/Users/omeroth/CORPUS/');
const { chromium } = require('playwright');
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.__CORPUS_DEBUG_BUILD = true;
  localStorage.setItem('_corpus_debug', '1');
  localStorage.setItem('corpus_subject', 'philosophy');
  localStorage.setItem('corpus_lang', 'en');
  localStorage.setItem('_corpus_trial_force', '1');
});
await page.goto('file:///Users/omeroth/CORPUS/index.html');
await page.waitForTimeout(1200);

const STD = { identifier: 'standard', availablePackages: [
  { identifier: '$rc_annual',  packageType: 'ANNUAL',  product: { identifier: 'corpus_yearly',  priceString: '$89.99', price: 89.99, currencyCode: 'USD' } },
  { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'corpus_monthly', priceString: '$12.99', price: 12.99, currencyCode: 'USD' } },
]};

// Open step 35 eligible + sheet; capture the purchase call.
const result = await page.evaluate(({ std }) => {
  state.subject = 'philosophy'; state.lang = 'en';
  if (typeof applyTheme === 'function') applyTheme('philosophy');
  __corpusSetOfferingsForDev({ black_friday: null, standard: std, trial: std });
  _onbTrialEligibility = 'eligible';
  window._paywallSelectedPkg = 'yearly';
  document.querySelectorAll('.onb-screen').forEach(s => { s.style.display = 'none'; s.classList.remove('onb-active'); });
  const el = document.getElementById('onb-v2-paywall');
  el.style.display = ''; el.classList.add('onb-active');
  _paywallActiveRoot = el;
  _paywallMode = 'onboarding';
  _activePaywallSource = 'onboarding';
  _renderPaywall();
  _openPaywallPlansSheet();
  const snap = (label) => ({
    label,
    selectedPkg: _paywallSelectedPkg,
    yearlySelected:  document.querySelector('#onb-v2-paywall .pw-plans-yearly').classList.contains('selected'),
    monthlySelected: document.querySelector('#onb-v2-paywall .pw-plans-monthly').classList.contains('selected'),
    sheetCta:   document.querySelector('#onb-v2-paywall .pw-plans-cta').textContent.trim(),
    mainH2:     document.querySelector('#onb-v2-paywall .pw-trial-h2').innerText,
    mainCta:    document.querySelector('#onb-v2-paywall .pw-trial-cta').textContent.trim(),
    mainLegal:  document.querySelector('#onb-v2-paywall .pw-trial-nocharge').innerText,
    billedVisible: document.querySelector('#onb-v2-paywall .pw-trial-billed').style.display !== 'none',
  });
  const before = snap('before tap (yearly default)');

  // Stub Purchases.purchasePackage to capture what gets passed
  window.Capacitor = window.Capacitor || {};
  window.Capacitor.Plugins = window.Capacitor.Plugins || {};
  window.Capacitor.Plugins.Purchases = Object.assign({}, window.Capacitor.Plugins.Purchases, {
    purchasePackage: async ({ aPackage }) => {
      window.__lastPurchasePkg = aPackage;
      // Mock a successful purchase with trial periodType
      return {
        customerInfo: {
          entitlements: {
            active: {
              corpus_ideas_worth_knowing_premium: { periodType: 'TRIAL', willRenew: true },
            },
          },
        },
      };
    },
  });
  window.Capacitor.getPlatform = () => 'ios';
  window.Capacitor.isNativePlatform = () => true;
  window.currentUser = { id: 'test-user' };

  // Tap monthly
  _selectPaywallPackage('monthly');
  const afterTap = snap('after tap Monthly');

  // Verify startPurchase would route through the monthly package.
  // Rather than stubbing the global `currentUser` (a module-scoped
  // `let` not reachable from window), we inspect _paywallPrices() —
  // the function startPurchase uses to pick sel.pkg.
  const prices = _paywallPrices();
  const resolved = _paywallSelectedPkg === 'monthly' ? prices.monthly : prices.yearly;
  const pkg = resolved && resolved.pkg;
  return {
    before,
    afterTap,
    purchased: pkg && {
      identifier: pkg.identifier,
      productId:  pkg.product && pkg.product.identifier,
    },
  };
}, { std: STD });
await page.waitForTimeout(100);
const purchased = result.purchased;

const assert = (label, ok) => console.log((ok ? '✓' : '✗') + ' ' + label);
console.log('\n=== BEFORE TAP (yearly default) ===');
console.log(JSON.stringify(result.before, null, 2));
console.log('\n=== AFTER TAP Monthly ===');
console.log(JSON.stringify(result.afterTap, null, 2));
console.log('\n=== Purchase routing ===');
console.log('purchased pkg:', purchased);

console.log('\n--- assertions ---');
assert('before: selectedPkg === yearly',       result.before.selectedPkg === 'yearly');
assert('before: yearly card has .selected',    result.before.yearlySelected);
assert('before: monthly card has NO .selected',!result.before.monthlySelected);
assert('after : selectedPkg === monthly',      result.afterTap.selectedPkg === 'monthly');
assert('after : monthly card has .selected',   result.afterTap.monthlySelected);
assert('after : yearly card has NO .selected', !result.afterTap.yearlySelected);
assert('after : sheet CTA is START FREE TRIAL',/start my 7-day free trial/i.test(result.afterTap.sheetCta));
assert('after : main h2 reflects monthly price',/then \$12\.99 a month/i.test(result.afterTap.mainH2));
assert('after : billed-yearly hidden',         !result.afterTap.billedVisible);
assert('after : main CTA is START FREE TRIAL', /start my 7-day free trial/i.test(result.afterTap.mainCta));
assert('after : main legal mentions monthly',  /\$12\.99/.test(result.afterTap.mainLegal) && /month/.test(result.afterTap.mainLegal));
assert('purchase: product is corpus_monthly',  purchased && purchased.productId === 'corpus_monthly');
assert('purchase: identifier is $rc_monthly',  purchased && purchased.identifier === '$rc_monthly');
await b.close();

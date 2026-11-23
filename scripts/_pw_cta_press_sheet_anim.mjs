// Regression: 3D press feedback on the two paywall CTAs, purchasing-
// busy state (disabled + spinner + viewall locked), and the plans
// sheet open/close animation end-states.
import { createRequire } from 'node:module';
const require = createRequire('/Users/omeroth/CORPUS/');
const { chromium } = require('playwright');

const STD = { identifier: 'standard', availablePackages: [
  { identifier: '$rc_annual',  packageType: 'ANNUAL',  product: { identifier: 'corpus_yearly',  priceString: '$89.99', price: 89.99, currencyCode: 'USD' } },
  { identifier: '$rc_monthly', packageType: 'MONTHLY', product: { identifier: 'corpus_monthly', priceString: '$12.99', price: 12.99, currencyCode: 'USD' } },
]};

const assert = (label, ok) => console.log((ok ? '✓' : '✗') + ' ' + label);
let anyFail = false;
const check = (label, ok) => { if (!ok) anyFail = true; assert(label, ok); };

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

// Mount step 35 eligible.
await page.evaluate(({ std }) => {
  state.subject = 'philosophy'; state.lang = 'en';
  if (typeof applyTheme === 'function') applyTheme('philosophy');
  __corpusSetOfferingsForDev({ black_friday: null, standard: std, trial: std });
  _onbTrialEligibility = 'eligible';
  _bfTrialEligibility  = 'eligible';
  document.querySelectorAll('.onb-screen').forEach(s => { s.style.display = 'none'; s.classList.remove('onb-active'); });
  const el = document.getElementById('onb-v2-paywall');
  el.style.display = ''; el.classList.add('onb-active');
  _paywallActiveRoot = el; _paywallMode = 'onboarding'; _activePaywallSource = 'onboarding';
  _renderPaywall();
}, { std: STD });
await page.waitForTimeout(100);

// ─── 1. CTA .pressed toggle on touchstart / touchend ───
console.log('\n--- CTA pressed-class toggle ---');
const pressBeforeAfter = await page.evaluate(async () => {
  const cta = document.querySelector('#onb-v2-paywall .pw-trial-cta');
  const beforePress = cta.classList.contains('pressed');
  cta.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [], changedTouches: [], targetTouches: [] }));
  const duringPress = cta.classList.contains('pressed');
  cta.dispatchEvent(new TouchEvent('touchend',   { bubbles: true, touches: [], changedTouches: [], targetTouches: [] }));
  const afterPress = cta.classList.contains('pressed');
  return { beforePress, duringPress, afterPress };
});
check('main CTA: no .pressed at rest',          !pressBeforeAfter.beforePress);
check('main CTA: .pressed during touchstart',    pressBeforeAfter.duringPress);
check('main CTA: .pressed removed on touchend', !pressBeforeAfter.afterPress);

// ─── 2. Pressed CSS: translateY(3px) + reduced shadow ───
console.log('\n--- CTA pressed computed styles ---');
const pressedStyles = await page.evaluate(async () => {
  const cta = document.querySelector('#onb-v2-paywall .pw-trial-cta');
  const rest = { transform: getComputedStyle(cta).transform, boxShadow: getComputedStyle(cta).boxShadow };
  cta.classList.add('pressed');
  // Wait past the 80ms transition before reading computed styles.
  await new Promise(r => setTimeout(r, 150));
  const pressed = { transform: getComputedStyle(cta).transform, boxShadow: getComputedStyle(cta).boxShadow };
  cta.classList.remove('pressed');
  return { rest, pressed };
});
check('rest: no translateY (none or matrix(1,0,0,1,0,0))',
  pressedStyles.rest.transform === 'none' || pressedStyles.rest.transform === 'matrix(1, 0, 0, 1, 0, 0)');
check('pressed: translateY(3px)',
  /matrix\(1, 0, 0, 1, 0, 3\)/.test(pressedStyles.pressed.transform));
check('rest: shadow 4px',   /0px 4px 0px/.test(pressedStyles.rest.boxShadow));
check('pressed: shadow 1px',/0px 1px 0px/.test(pressedStyles.pressed.boxShadow));

// ─── 3. Purchasing state: CTA + sheet CTA + viewall disabled ───
console.log('\n--- purchasing busy state ---');
const busyState = await page.evaluate(async () => {
  _openPaywallPlansSheet();
  _paywallPurchasing = true;
  _renderPaywall();
  await new Promise(r => setTimeout(r, 160));
  const mainCta  = document.querySelector('#onb-v2-paywall .pw-trial-cta');
  const sheetCta = document.querySelector('#onb-v2-paywall .pw-plans-cta');
  const viewAll  = document.querySelector('#onb-v2-paywall .pw-trial-viewall');
  return {
    mainDisabled: mainCta.disabled,
    mainBusy:     mainCta.classList.contains('pw-busy'),
    mainOpacity:  parseFloat(getComputedStyle(mainCta).opacity),
    sheetDisabled: sheetCta.disabled,
    sheetBusy:     sheetCta.classList.contains('pw-busy'),
    sheetOpacity:  parseFloat(getComputedStyle(sheetCta).opacity),
    viewAllDisabled: viewAll.disabled,
    viewAllBusy:     viewAll.classList.contains('pw-busy'),
    // :disabled pointer-events via computed style
    mainPointer:  getComputedStyle(mainCta).pointerEvents,
    viewAllPointer: getComputedStyle(viewAll).pointerEvents,
  };
});
check('main CTA disabled while purchasing',   busyState.mainDisabled);
check('main CTA has .pw-busy',                 busyState.mainBusy);
check('main CTA opacity 0.7',                  Math.abs(busyState.mainOpacity - 0.7) < 0.01);
check('main CTA pointer-events: none',         busyState.mainPointer === 'none');
check('sheet CTA disabled while purchasing',   busyState.sheetDisabled);
check('sheet CTA has .pw-busy',                busyState.sheetBusy);
check('sheet CTA opacity 0.7',                 Math.abs(busyState.sheetOpacity - 0.7) < 0.01);
check('viewall disabled while purchasing',     busyState.viewAllDisabled);
check('viewall has .pw-busy',                  busyState.viewAllBusy);
check('viewall pointer-events: none',          busyState.viewAllPointer === 'none');

// Reset purchasing and verify everything is restored.
const restored = await page.evaluate(async () => {
  _paywallPurchasing = false;
  _renderPaywall();
  _renderPaywallPlansSheet();
  await new Promise(r => setTimeout(r, 160));
  const mainCta  = document.querySelector('#onb-v2-paywall .pw-trial-cta');
  const sheetCta = document.querySelector('#onb-v2-paywall .pw-plans-cta');
  const viewAll  = document.querySelector('#onb-v2-paywall .pw-trial-viewall');
  return {
    mainDisabled: mainCta.disabled, mainBusy: mainCta.classList.contains('pw-busy'),
    sheetDisabled: sheetCta.disabled, sheetBusy: sheetCta.classList.contains('pw-busy'),
    viewAllDisabled: viewAll.disabled, viewAllBusy: viewAll.classList.contains('pw-busy'),
    mainOpacity: parseFloat(getComputedStyle(mainCta).opacity),
  };
});
check('main CTA restored (not disabled, not busy, opacity 1)',
  !restored.mainDisabled && !restored.mainBusy && Math.abs(restored.mainOpacity - 1) < 0.01);
check('sheet CTA restored', !restored.sheetDisabled && !restored.sheetBusy);
check('viewall restored',   !restored.viewAllDisabled && !restored.viewAllBusy);

// ─── 4. Sheet open/close end states ───
console.log('\n--- sheet open/close ---');
await page.evaluate(() => _closePaywallPlansSheet());
await page.waitForTimeout(400);
const closedPre = await page.evaluate(() => {
  const s = document.querySelector('#onb-v2-paywall .pw-plans-sheet');
  return {
    mounted: s.classList.contains('pw-plans-mounted'),
    open:    s.classList.contains('pw-plans-open'),
    closing: s.classList.contains('pw-plans-closing'),
    ariaHidden: s.getAttribute('aria-hidden'),
    display: getComputedStyle(s).display,
  };
});
check('closed: not mounted', !closedPre.mounted);
check('closed: not open',    !closedPre.open);
check('closed: display:none', closedPre.display === 'none');
check('closed: aria-hidden=true', closedPre.ariaHidden === 'true');

await page.evaluate(() => _openPaywallPlansSheet());
// Allow one frame for the class flip + 420ms for the transition.
await page.waitForTimeout(500);
const opened = await page.evaluate(() => {
  const s = document.querySelector('#onb-v2-paywall .pw-plans-sheet');
  const dlg = s.querySelector('.pw-plans-dialog');
  const bd  = s.querySelector('.pw-plans-backdrop');
  return {
    mounted: s.classList.contains('pw-plans-mounted'),
    open:    s.classList.contains('pw-plans-open'),
    closing: s.classList.contains('pw-plans-closing'),
    ariaHidden: s.getAttribute('aria-hidden'),
    dialogTransform: getComputedStyle(dlg).transform,
    backdropOpacity: parseFloat(getComputedStyle(bd).opacity),
    display: getComputedStyle(s).display,
  };
});
check('open: .pw-plans-mounted',  opened.mounted);
check('open: .pw-plans-open',     opened.open);
check('open: not closing',       !opened.closing);
check('open: aria-hidden=false',  opened.ariaHidden === 'false');
check('open: dialog translateY 0',
  opened.dialogTransform === 'none' || opened.dialogTransform === 'matrix(1, 0, 0, 1, 0, 0)');
check('open: backdrop opacity 1', Math.abs(opened.backdropOpacity - 1) < 0.05);
check('open: display:block',      opened.display === 'block');

// Close and verify closing state, then cleaned up.
await page.evaluate(() => _closePaywallPlansSheet());
await page.waitForTimeout(10);
const closing = await page.evaluate(() => {
  const s = document.querySelector('#onb-v2-paywall .pw-plans-sheet');
  return {
    open:    s.classList.contains('pw-plans-open'),
    closing: s.classList.contains('pw-plans-closing'),
    mounted: s.classList.contains('pw-plans-mounted'),
  };
});
check('closing: .pw-plans-closing on',     closing.closing);
check('closing: .pw-plans-open removed',  !closing.open);
check('closing: still mounted mid-anim',   closing.mounted);

await page.waitForTimeout(350);
const finalClosed = await page.evaluate(() => {
  const s = document.querySelector('#onb-v2-paywall .pw-plans-sheet');
  return {
    mounted: s.classList.contains('pw-plans-mounted'),
    closing: s.classList.contains('pw-plans-closing'),
    display: getComputedStyle(s).display,
  };
});
check('finished-close: not mounted',  !finalClosed.mounted);
check('finished-close: not closing',  !finalClosed.closing);
check('finished-close: display:none', finalClosed.display === 'none');

// ─── 5. Swipe-down-to-dismiss simulation ───
console.log('\n--- swipe-to-dismiss ---');
await page.evaluate(() => _openPaywallPlansSheet());
await page.waitForTimeout(450);
const swiped = await page.evaluate(() => {
  const dlg = document.querySelector('#onb-v2-paywall .pw-plans-dialog');
  const dispatch = (type, y) => {
    const t = { clientY: y, clientX: 50 };
    // Our handler reads e.touches[0] on start/move, e.changedTouches[0]
    // on end. Chromium's TouchEvent constructor requires real Touch
    // instances; use a plain Event with the shapes attached.
    const ev = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'touches',        { value: type === 'touchend' ? [] : [t] });
    Object.defineProperty(ev, 'targetTouches',  { value: type === 'touchend' ? [] : [t] });
    Object.defineProperty(ev, 'changedTouches', { value: [t] });
    dlg.dispatchEvent(ev);
  };
  dispatch('touchstart', 100);
  dispatch('touchmove',  400);
  const midTransform = dlg.style.transform;
  // Large drop (300px) + fast time passes threshold → close.
  dispatch('touchend',   400);
  return { midTransform };
});
check('swipe mid: dialog transform follows finger', /translateY\(300px\)/.test(swiped.midTransform));
await page.waitForTimeout(350);
const afterSwipe = await page.evaluate(() => {
  const s = document.querySelector('#onb-v2-paywall .pw-plans-sheet');
  return {
    mounted: s.classList.contains('pw-plans-mounted'),
    open:    s.classList.contains('pw-plans-open'),
  };
});
check('swipe end past threshold → closed', !afterSwipe.mounted && !afterSwipe.open);

// Spring-back case: small drop (<30% height, slow) → stays open.
await page.evaluate(() => _openPaywallPlansSheet());
await page.waitForTimeout(450);
const spring = await page.evaluate(async () => {
  const dlg = document.querySelector('#onb-v2-paywall .pw-plans-dialog');
  const dispatch = (type, y) => {
    const t = { clientY: y, clientX: 50 };
    // Our handler reads e.touches[0] on start/move, e.changedTouches[0]
    // on end. Chromium's TouchEvent constructor requires real Touch
    // instances; use a plain Event with the shapes attached.
    const ev = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(ev, 'touches',        { value: type === 'touchend' ? [] : [t] });
    Object.defineProperty(ev, 'targetTouches',  { value: type === 'touchend' ? [] : [t] });
    Object.defineProperty(ev, 'changedTouches', { value: [t] });
    dlg.dispatchEvent(ev);
  };
  dispatch('touchstart', 100);
  dispatch('touchmove',  140);
  await new Promise(r => setTimeout(r, 200));
  dispatch('touchend',   140);
  await new Promise(r => setTimeout(r, 100));
  const s = document.querySelector('#onb-v2-paywall .pw-plans-sheet');
  return {
    inlineTransform: dlg.style.transform,
    open: s.classList.contains('pw-plans-open'),
  };
});
check('spring-back: inline transform cleared', spring.inlineTransform === '');
check('spring-back: sheet still open',          spring.open);

await b.close();
console.log(anyFail ? '\nFAIL' : '\nALL PASS');
process.exit(anyFail ? 1 : 0);

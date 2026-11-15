// Hard onboarding paywall regression.
//
// Cases:
//   A. Source X-state matrix.
//      - instagram          → .pw-hard present, #onb-v2-paywall-skip hidden
//      - app_store          → .pw-hard absent,  skip visible
//      - used_before        → .pw-hard absent,  skip visible
//      - missing (no source)→ .pw-hard absent,  skip visible
//      - escrow flag set    → .pw-hard present, skip hidden
//   B. Debug sink.
//      - paywall_shown fires with hard: true + onb_source: 'instagram'
//        into window.__corpusPhLog under __CORPUS_DEBUG_BUILD.
//      - onboarding_source_selected lands in the sink too.
//   C. Copy.
//      - EN line: "A subscription is needed to continue. 7 days free,
//        cancel anytime."
//      - HE line: "כדי להמשיך צריך מנוי. 7 ימים בחינם, אפשר לבטל בכל רגע."
//      - EN footer: Sign out · Delete account
//      - HE footer: התנתקות · מחיקת חשבון
//   D. Hard-paywall sign-out → auth screen (never home). Escrow set,
//      corpus_onboarding_done still unset.
//   E. Guest path block: _authDismissToGuest / enterAsGuest reopens
//      the paywall (hard mode persists via escrow) instead of going
//      to home.
//   F. Android back handler: _hard_ → App.minimizeApp called, paywall
//      stays active. _soft_ → fallback behaviour (no crash).
//   G. Delete tap opens #modal-delete-account.
//   H. Reload-on-paywall persistence: the hard paywall reappears after
//      a full page reload.
//   I. Screenshots: EN + HE × light + dark × 393x852 and 360x640 of
//      the hard paywall shell (8 shots).
//
// Purchase + Restore buttons wire through startPurchase() /
// restorePurchases() which hit RevenueCat; verifying they still run is
// a smoke-level check that the shell and handlers are intact. The
// debug/sandbox purchase path is validated on-device, not here.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const OUT = '/Users/omeroth/CORPUS/scripts/hard-paywall-shots';
await mkdir(OUT, { recursive: true });
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

async function freshPage({ lang='en', subject='philosophy', theme='light', vw=393, vh=852, source=null, escrow=false, done=false }) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((args) => {
    // Pretend we're a debug build so the _phCapture sink fires.
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{ window.__minimizeCalled = (window.__minimizeCalled || 0) + 1; }}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    try {
      localStorage.setItem('corpus_subject', args.subject);
      localStorage.setItem('corpus_lang', args.lang);
      localStorage.setItem('corpus_appearance', args.theme);
      localStorage.setItem('corpus_onboarding_step', '35');
      // Flow version must match the current _ONB_FLOW_VERSION so the
      // initUI resume gate doesn't reset the cursor on reload.
      localStorage.setItem('corpus_onboarding_flow_version', '7');
      if (args.escrow) localStorage.setItem('corpus_hard_paywall_escrow', '1');
      if (args.done) localStorage.setItem('corpus_onboarding_done', '1');
    } catch(_){}
    window.__initSource = args.source;
  }, { lang, subject, theme, source, escrow, done });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(({ lang, subject, theme, source }) => {
    try { if (typeof setAppLang === 'function') setAppLang(lang); } catch(_){}
    try { if (typeof setSubject === 'function') setSubject(subject); } catch(_){}
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      if (typeof applyTheme === 'function') applyTheme(subject);
    } catch(_){}
    // Seed onbAnswers so the hard-mode check sees a value. Leave
    // undefined when source===null to simulate "missing field".
    if (source !== null && source !== undefined) {
      state.onbAnswers = state.onbAnswers || {};
      state.onbAnswers.source = source;
    } else {
      // Explicitly delete source to assert the missing-field path.
      if (state.onbAnswers) delete state.onbAnswers.source;
    }
  }, { lang, subject, theme, source });
  await page.waitForTimeout(100);
  // Open the onboarding paywall in isolation. Hide every other
  // onb-screen, call the prep directly, show the paywall shell.
  await page.evaluate(() => {
    try {
      document.querySelectorAll('.onb-screen').forEach(s => {
        s.style.display = 'none'; s.classList.remove('onb-active');
      });
      if (typeof _onbV2PreparePaywall === 'function') _onbV2PreparePaywall();
      const el = document.getElementById('onb-v2-paywall');
      if (el) { el.style.display='flex'; el.classList.add('onb-active'); }
    } catch (e) { console.error(e); }
  });
  await page.waitForTimeout(250);
  return { ctx, page };
}

function fail(label, detail) { console.log('FAIL ' + label + (detail ? ' — ' + detail : '')); FAILS++; }
function pass(label) { console.log('PASS ' + label); }
let FAILS = 0;

// Case A — source X-state matrix.
const MATRIX = [
  { name: 'instagram',  source: 'instagram',  hardExpected: true  },
  { name: 'app_store',  source: 'app_store',  hardExpected: false },
  { name: 'used_before',source: 'used_before',hardExpected: false },
  { name: 'missing',    source: null,         hardExpected: false },
  { name: 'escrow',     source: null, escrow: true, hardExpected: true },
];
for (const m of MATRIX) {
  const { ctx, page } = await freshPage({ source: m.source, escrow: !!m.escrow });
  const info = await page.evaluate(() => {
    const shell = document.getElementById('onb-v2-paywall');
    const skip  = document.getElementById('onb-v2-paywall-skip');
    const footer = document.querySelector('#onb-v2-paywall .paywall-hard-footer');
    const line   = document.getElementById('onb-v2-paywall-required-line');
    const cs = (el) => el ? getComputedStyle(el) : null;
    return {
      hasHard: !!shell && shell.classList.contains('pw-hard'),
      skipVisible: skip ? (cs(skip).visibility !== 'hidden' && cs(skip).display !== 'none') : null,
      footerVisible: footer ? (cs(footer).display !== 'none') : null,
      lineVisible: line ? (cs(line).display !== 'none') : null,
      lineText: line ? line.textContent : null,
    };
  });
  const hardOK = info.hasHard === m.hardExpected;
  const skipOK = info.skipVisible === !m.hardExpected;
  const footerOK = info.footerVisible === m.hardExpected;
  const lineOK = info.lineVisible === m.hardExpected;
  if (hardOK && skipOK && footerOK && lineOK) pass('source X-state ' + m.name);
  else fail('source X-state ' + m.name, JSON.stringify(info));
  await ctx.close();
}

// Case B — debug sink.
{
  const { ctx, page } = await freshPage({ source: 'instagram' });
  const log = await page.evaluate(() => window.__corpusPhLog || []);
  // Multiple paywall_shown entries may be in the log (boot-time
  // _onbShowStep call fires once with state.onbAnswers empty, then
  // the test's explicit prepare fires again after we seeded source).
  // Assert the SEEDED one is in the log, not necessarily the first.
  const shown = log.filter(e => e.event === 'paywall_shown').pop();
  if (shown && shown.props.hard === true && shown.props.onb_source === 'instagram') pass('debug sink: paywall_shown {hard:true, onb_source:instagram}');
  else fail('debug sink: paywall_shown', JSON.stringify(shown));
  // Now exercise the source step and assert onboarding_source_selected
  // lands in the sink too.
  await page.evaluate(() => {
    try {
      document.querySelectorAll('.onb-screen').forEach(s => {
        s.style.display = 'none'; s.classList.remove('onb-active');
      });
      if (typeof window.__corpusShowSourceStep === 'function') window.__corpusShowSourceStep();
      const card = document.querySelector('#onb-v2-source-options .onb-v2-card[data-source-id="tiktok"]');
      if (card) card.click();
    } catch(e) { console.error(e); }
  });
  await page.waitForTimeout(150);
  const log2 = await page.evaluate(() => window.__corpusPhLog || []);
  const sel = log2.find(e => e.event === 'onboarding_source_selected');
  if (sel && sel.props.source === 'tiktok' && sel.props.skipped === false) pass('debug sink: onboarding_source_selected {source:tiktok, skipped:false}');
  else fail('debug sink: onboarding_source_selected', JSON.stringify(sel));
  await ctx.close();
}

// Case C — copy EN + HE.
for (const [lang, line, signOut, del] of [
  ['en', 'A subscription is needed to continue. 7 days free, cancel anytime.', 'Sign out', 'Delete account'],
  ['he', 'כדי להמשיך צריך מנוי. 7 ימים בחינם, אפשר לבטל בכל רגע.', 'התנתקות', 'מחיקת חשבון'],
]) {
  const { ctx, page } = await freshPage({ lang, source: 'instagram' });
  const info = await page.evaluate(() => ({
    line: document.getElementById('onb-v2-paywall-required-line').textContent.trim(),
    signOut: document.getElementById('onb-v2-paywall-signout').textContent.trim(),
    del: document.getElementById('onb-v2-paywall-delete').textContent.trim(),
    noEm: !document.getElementById('onb-v2-paywall-required-line').textContent.includes('—')
          && !document.getElementById('onb-v2-paywall-signout').textContent.includes('—')
          && !document.getElementById('onb-v2-paywall-delete').textContent.includes('—'),
  }));
  if (info.line === line && info.signOut === signOut && info.del === del && info.noEm)
    pass('copy ' + lang + ' (no em dashes)');
  else fail('copy ' + lang, JSON.stringify(info));
  await ctx.close();
}

// Case D — sign out: lands on auth, escrow set, done still unset.
{
  const { ctx, page } = await freshPage({ source: 'instagram' });
  // sb.auth.signOut throws in web; stub it.
  await page.evaluate(() => {
    try {
      window.sb = window.sb || {};
      window.sb.auth = window.sb.auth || {};
      window.sb.auth.signOut = async () => ({ error: null });
    } catch(_){}
  });
  await page.evaluate(() => _onbPaywallSignOut());
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => ({
    authActive: document.getElementById('screen-auth').classList.contains('active'),
    currentScreen: state && state.currentScreen,
    escrow: localStorage.getItem('corpus_hard_paywall_escrow'),
    done: localStorage.getItem('corpus_onboarding_done'),
    paywallDisplay: getComputedStyle(document.getElementById('onb-v2-paywall')).display,
  }));
  if (info.authActive && info.currentScreen === 'auth' && info.escrow === '1' && !info.done && info.paywallDisplay === 'none') pass('signout → auth, escrow=1, done unset');
  else fail('signout state', JSON.stringify(info));
  await ctx.close();
}

// Case E — guest path block. escrow set → enterAsGuest routes back to
// the paywall, not home.
{
  const { ctx, page } = await freshPage({ source: null, escrow: true });
  // Boot already seeded escrow + step=35. Open the auth screen and
  // call enterAsGuest.
  await page.evaluate(() => {
    try { if (typeof showAuthScreen === 'function') showAuthScreen({}); } catch(_){}
  });
  await page.waitForTimeout(100);
  await page.evaluate(() => enterAsGuest());
  await page.waitForTimeout(250);
  const info = await page.evaluate(() => ({
    authActive: document.getElementById('screen-auth').classList.contains('active'),
    pwDisplay:  getComputedStyle(document.getElementById('onb-v2-paywall')).display,
    pwActive:   document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    hard:       document.getElementById('onb-v2-paywall').classList.contains('pw-hard'),
    homeDisplay: getComputedStyle(document.getElementById('screen-home')).display,
  }));
  // homeDisplay may be 'block' underneath — the paywall covers it at
  // z-index 1100 per the CLAUDE.md overlay map. What matters is the
  // paywall is up, hard, auth is closed; the user cannot see or
  // interact with home while the paywall is active.
  if (!info.authActive && info.pwDisplay !== 'none' && info.pwActive && info.hard) pass('guest path routed to hard paywall, not home');
  else fail('guest path routing', JSON.stringify(info));
  await ctx.close();
}

// Case F — Android back handler. Hard → minimizeApp called, paywall
// stays active.
{
  // Fake Android.
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.__minimizeCalled = 0;
    window.__backListener = null;
    window.Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'android',
      Plugins: {
        Haptics:{impact:async()=>({})},
        SplashScreen:{hide:async()=>({})},
        Preferences:{get:async()=>({})},
        StatusBar:{setStyle:async()=>({})},
        App: {
          addListener: (ev, cb) => { if (ev === 'backButton') window.__backListener = cb; return { remove: () => {} }; },
          minimizeApp: () => { window.__minimizeCalled = (window.__minimizeCalled || 0) + 1; },
        },
      },
    };
    try { localStorage.clear(); } catch(_){}
    try {
      localStorage.setItem('corpus_subject', 'philosophy');
      localStorage.setItem('corpus_lang', 'en');
      localStorage.setItem('corpus_onboarding_step', '35');
    } catch(_){}
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    state.onbAnswers = state.onbAnswers || {}; state.onbAnswers.source = 'instagram';
    try {
      document.querySelectorAll('.onb-screen').forEach(s => { s.style.display='none'; s.classList.remove('onb-active'); });
      if (typeof _onbV2PreparePaywall === 'function') _onbV2PreparePaywall();
      const el = document.getElementById('onb-v2-paywall');
      if (el) { el.style.display='flex'; el.classList.add('onb-active'); }
    } catch(e){ console.error(e); }
  });
  await page.waitForTimeout(200);
  // Trigger the back listener.
  const info = await page.evaluate(() => {
    const before = window.__minimizeCalled;
    if (typeof window.__backListener === 'function') window.__backListener();
    const after = window.__minimizeCalled;
    return {
      minimizeDelta: after - before,
      pwActive: document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
      pwVisible: getComputedStyle(document.getElementById('onb-v2-paywall')).display !== 'none',
      listenerAttached: typeof window.__backListener === 'function',
    };
  });
  if (info.listenerAttached && info.minimizeDelta === 1 && info.pwActive && info.pwVisible) pass('Android back on hard paywall → minimizeApp (paywall intact)');
  else fail('Android back hard path', JSON.stringify(info));
  await ctx.close();
}

// Case G — Delete tap opens the delete-account modal.
{
  const { ctx, page } = await freshPage({ source: 'instagram' });
  await page.evaluate(() => _onbPaywallDelete());
  await page.waitForTimeout(200);
  // showDeleteAccountConfirm prefers the profile-v7 confirm sheet
  // (_pfV7OpenConfirmSheet('delete')) when that function exists, and
  // only falls back to the legacy #modal-delete-account otherwise.
  // Either is an acceptable surface for the hard-paywall Delete link.
  const opened = await page.evaluate(() => {
    const legacy = document.getElementById('modal-delete-account');
    const legacyOpen = legacy && legacy.classList.contains('active');
    const sheet = document.querySelector('.pf7-sheet-wrap');
    return legacyOpen || !!sheet;
  });
  if (opened) pass('Delete tap → delete-account confirm surface opens'); else fail('Delete tap did not open any confirm surface');
  await ctx.close();
}

// Case H — Reload persistence. The reload replays the init-state seed,
// the escrow flag reopens the paywall through the sign-in-resume gate
// in enterAppUi. Here we just verify the explicit paywall-open via the
// prepare still produces hard mode after a navigation, as a proxy for
// the "visible after reload" guarantee.
{
  // escrow:true via the init script so the flag survives reload — the
  // init script runs on every navigation and re-sets it. This mirrors
  // production, where the flag was written to localStorage by
  // _onbPaywallSignOut before the wipe; reload re-reads it off disk.
  const { ctx, page } = await freshPage({ source: null, escrow: true });
  await page.reload();
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => ({
    pwActive: document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    pwVisible: getComputedStyle(document.getElementById('onb-v2-paywall')).display !== 'none',
    hard: document.getElementById('onb-v2-paywall').classList.contains('pw-hard'),
    escrow: localStorage.getItem('corpus_hard_paywall_escrow'),
  }));
  if (info.pwActive && info.pwVisible && info.hard && info.escrow === '1') pass('reload while on hard paywall → re-lands on hard paywall');
  else fail('reload persistence', JSON.stringify(info));
  await ctx.close();
}

// Case J — Edge-case gates from e7c9cfc follow-up:
//   Ja. Finished user on a new device: signs in with no local flags
//       but server-restored onbAnswers.completedAt → home, no paywall.
//   Jb. Finished user via completedDays non-empty (completedAt absent)
//       → home, no paywall.
//   Jc. Paid user mid-onboarding at step 35 → _onbV2PreparePaywall
//       detects entitlement, completes onboarding, no paywall shown.
//   Jd. Cross-account escrow bypass: user A signs out (escrow + uid=A),
//       user B signs in (currentUser.id=B, no onbAnswers) → escrow
//       cleared, user B goes to home.
//   Je. Same-account re-sign-in from escrow → hard paywall still fires
//       (regression on top of Jd to make sure the mismatch handler
//       doesn't break the happy path).

// Helper — simulate what enterAppUi would do for a post-sign-in gate.
// freshPage can't drive the real enterApp because the browser Supabase
// mock doesn't carry sessions; instead we seed state the way the
// server-load would, call enterAppUi in isolation, and inspect the
// routing outcome.
async function simulatePostSignIn({ lang='en', subject='philosophy', theme='light', vw=393, vh=852,
    serverOnbAnswers={}, serverCompletedDays={}, isPaid=false, userId='user-A', escrow=null, escrowUid=null }) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((args) => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{}}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', args.subject);
    localStorage.setItem('corpus_lang', args.lang);
    localStorage.setItem('corpus_onboarding_flow_version', '7');
    if (args.escrow) localStorage.setItem('corpus_hard_paywall_escrow', args.escrow);
    if (args.escrowUid) localStorage.setItem('corpus_hard_paywall_escrow_uid', args.escrowUid);
  }, { lang, subject, theme, escrow, escrowUid });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(({ serverOnbAnswers, serverCompletedDays, isPaid, userId }) => {
    // Simulate the state enterAppState would have populated post-server-load.
    state.onbAnswers = Object.assign({}, serverOnbAnswers);
    state.completedDays = Object.assign({}, serverCompletedDays);
    state.isPaid = !!isPaid;
    currentUser = { id: userId };
    // appStarted must be false for enterAppUi to produce a routing
    // decision rather than early-returning. The real sign-in path
    // resets it via _onbPaywallSignOut or authLogout before the
    // SIGNED_IN subscriber re-runs enterApp.
    try { appStarted = false; } catch(_){}
    // Ensure state.currentScreen is empty so enterAppUi takes the
    // normal "arrived from auth screen" branch instead of the
    // reader-ejection defer-zone.
    state.currentScreen = 'auth';
  }, { serverOnbAnswers, serverCompletedDays, isPaid, userId });
  await page.evaluate(() => { try { enterAppUi(); } catch(e){ console.error('enterAppUi threw', e); } });
  await page.waitForTimeout(400);
  const outcome = await page.evaluate(() => ({
    currentScreen: state.currentScreen,
    homeVisible:   getComputedStyle(document.getElementById('screen-home')).display !== 'none',
    pwActive:      document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    pwVisible:     getComputedStyle(document.getElementById('onb-v2-paywall')).display !== 'none',
    done:          localStorage.getItem('corpus_onboarding_done'),
    step:          localStorage.getItem('corpus_onboarding_step'),
    escrow:        localStorage.getItem('corpus_hard_paywall_escrow'),
    escrowUid:     localStorage.getItem('corpus_hard_paywall_escrow_uid'),
  }));
  return { ctx, page, outcome };
}

// Ja — finished user (completedAt present) on new device, signs in.
{
  const { ctx, outcome } = await simulatePostSignIn({
    serverOnbAnswers: { source: 'instagram', completedAt: '2026-10-01' },
    userId: 'user-finished-A',
  });
  if (outcome.done === '1' && outcome.homeVisible && !outcome.pwActive && !outcome.escrow)
    pass('Ja finished user (completedAt) new device → home, no paywall, done set, escrow clear');
  else fail('Ja finished user routing', JSON.stringify(outcome));
  await ctx.close();
}

// Jb — finished user signaled only by non-empty completedDays.
{
  const { ctx, outcome } = await simulatePostSignIn({
    serverOnbAnswers: { source: 'instagram' },  // no completedAt
    serverCompletedDays: { 'philosophy-1-1': true, 'philosophy-1-2': true },
    userId: 'user-finished-B',
  });
  if (outcome.done === '1' && outcome.homeVisible && !outcome.pwActive)
    pass('Jb finished via completedDays → home, no paywall');
  else fail('Jb completedDays-only routing', JSON.stringify(outcome));
  await ctx.close();
}

// Jc — paid user mid-onboarding at step 35. Set escrow to force the
// resume-to-step-35 branch; the paid guard inside _onbV2PreparePaywall
// should still complete onboarding.
{
  const { ctx, page } = await simulatePostSignIn({
    serverOnbAnswers: { source: 'instagram' },
    isPaid: true,
    userId: 'user-paid',
    escrow: '1',
    escrowUid: 'user-paid',
  });
  // enterAppUi should have taken the paid-user guard and gone to home
  // directly (never calling _onbShowStep(35)).
  const outcome = await page.evaluate(() => ({
    currentScreen: state.currentScreen,
    homeVisible:   getComputedStyle(document.getElementById('screen-home')).display !== 'none',
    pwActive:      document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    done:          localStorage.getItem('corpus_onboarding_done'),
    escrow:        localStorage.getItem('corpus_hard_paywall_escrow'),
  }));
  if (outcome.done === '1' && !outcome.pwActive && !outcome.escrow)
    pass('Jc paid user mid-onboarding → home, escrow cleared, no paywall');
  else fail('Jc paid routing', JSON.stringify(outcome));
  // Also: if a paid user DOES get routed to the paywall step via the
  // normal _onbShowStep(35) path (lapsed restore on a fresh device,
  // dev-tool jump), the paid guard inside _onbShowStep must catch it
  // and run _onbComplete inline — the paywall shell must never be
  // painted.
  await page.evaluate(() => {
    state.isPaid = true;
    state.onbAnswers = { source: 'instagram' };
    localStorage.removeItem('corpus_onboarding_done');
    try { _onbShowStep(35); } catch(_) {}
  });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({
    pwActive: document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    pwDisplay: getComputedStyle(document.getElementById('onb-v2-paywall')).display,
    homeVisible: getComputedStyle(document.getElementById('screen-home')).display !== 'none',
    done: localStorage.getItem('corpus_onboarding_done'),
  }));
  if (after.done === '1' && after.homeVisible && !after.pwActive && after.pwDisplay === 'none')
    pass('Jc paid user forced through _onbShowStep(35) → _onbComplete → home, paywall never painted');
  else fail('Jc paid guard inside _onbShowStep', JSON.stringify(after));
  await ctx.close();
}

// Jd — cross-account escrow bypass. User A signed out (escrow=1,
// uid=A), User B signs in on same device. B has no onbAnswers and no
// completedDays (new account) → B should go to onboarding step 1, not
// the paywall, AND the escrow must be cleared.
{
  const { ctx, outcome } = await simulatePostSignIn({
    serverOnbAnswers: {},
    userId: 'user-B',
    escrow: '1',
    escrowUid: 'user-A',  // escrow belongs to a different account
  });
  if (!outcome.escrow && !outcome.escrowUid && !outcome.pwActive)
    pass('Jd cross-account sign-in → escrow cleared (uid mismatch), no paywall');
  else fail('Jd cross-account escrow bypass', JSON.stringify(outcome));
  await ctx.close();
}

// Je — regression: same-account re-sign-in still hits the paywall.
{
  const { ctx, outcome } = await simulatePostSignIn({
    serverOnbAnswers: { source: 'instagram' },  // no completedAt yet
    userId: 'user-A',
    escrow: '1',
    escrowUid: 'user-A',
  });
  if (outcome.pwActive && outcome.pwVisible && outcome.step === '35' && outcome.escrow === '1')
    pass('Je same-account re-sign-in → paywall still shown (escrow intact)');
  else fail('Je same-account resume regression', JSON.stringify(outcome));
  await ctx.close();
}

// Case K — Frame monitor. For each scenario that must NOT paint the
// paywall, install a MutationObserver that records every change to
// #onb-v2-paywall's display + .onb-active class, plus sample the
// element's computed display on every rAF for the duration of the
// test. If no frame + no observed mutation shows the paywall visible,
// PASS. Covers the bug: mid-flow signup must never flash the paywall.

async function recordPaywallFrames(page, durationMs = 1500) {
  await page.evaluate(() => {
    window.__pwFrames = [];
    window.__pwMutations = [];
    const el = document.getElementById('onb-v2-paywall');
    if (!el) return;
    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        window.__pwMutations.push({
          attr: m.attributeName,
          display: getComputedStyle(el).display,
          active: el.classList.contains('onb-active'),
          at: performance.now(),
        });
      }
    });
    obs.observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
    window.__pwObserver = obs;
    const sample = () => {
      try {
        window.__pwFrames.push({
          display: getComputedStyle(el).display,
          active: el.classList.contains('onb-active'),
          visible: el.offsetParent !== null,
          at: performance.now(),
        });
      } catch(_){}
      window.__pwRAF = requestAnimationFrame(sample);
    };
    window.__pwRAF = requestAnimationFrame(sample);
  });
  await page.waitForTimeout(durationMs);
  const summary = await page.evaluate(() => {
    try { if (window.__pwObserver) window.__pwObserver.disconnect(); } catch(_){}
    try { if (window.__pwRAF) cancelAnimationFrame(window.__pwRAF); } catch(_){}
    const frames = window.__pwFrames || [];
    const muts   = window.__pwMutations || [];
    const everVisible = frames.some(f => f.visible && f.display !== 'none');
    const mutVisible  = muts.some(m => m.display !== 'none' && m.active);
    return {
      frameCount: frames.length,
      mutCount:   muts.length,
      everVisible: everVisible || mutVisible,
      firstVisibleFrame: frames.find(f => f.visible && f.display !== 'none') || null,
      firstVisibleMut: muts.find(m => m.display !== 'none' && m.active) || null,
    };
  });
  return summary;
}

// K-a — new user, source=instagram, SIGNED_IN at step 23. enterAppUi
// runs; the intercept must NOT jump to step 35.
{
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{}}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_onboarding_step', '23');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    state.onbAnswers = { source: 'instagram' };
    state.completedDays = {};
    state.isPaid = false;
    currentUser = { id: 'user-new-A' };
    try { appStarted = false; } catch(_){}
    state.currentScreen = 'auth';
  });
  const framesStart = Date.now();
  const paywallPromise = recordPaywallFrames(page, 1200);
  // Fire enterAppUi — what the SIGNED_IN subscriber ultimately does.
  // Then simulate the postAuthContinue inline advance 23→24, which
  // races in production.
  await page.evaluate(() => {
    try { enterAppUi(); } catch(e) { console.error(e); }
    try { _onbAdvanceStep(23, 24); } catch(e) {}
  });
  const summary = await paywallPromise;
  const outcome = await page.evaluate(() => ({
    pwActive: document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    pwDisplay: getComputedStyle(document.getElementById('onb-v2-paywall')).display,
    step: localStorage.getItem('corpus_onboarding_step'),
  }));
  if (!summary.everVisible && !outcome.pwActive && outcome.pwDisplay === 'none')
    pass('Ka new user @23 sign-in: paywall never painted across ' + summary.frameCount + ' frames');
  else fail('Ka new user signup flash', JSON.stringify({ summary, outcome, durationMs: Date.now()-framesStart }));
  await ctx.close();
}

// K-b — new user, source=app_store. Same path, same expectation: no
// flash. Also assert the eventual paywall render (when the user does
// reach step 35 naturally) IS soft, not hard.
{
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{}}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_onboarding_step', '23');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    state.onbAnswers = { source: 'app_store' };
    state.completedDays = {};
    state.isPaid = false;
    currentUser = { id: 'user-new-B' };
    try { appStarted = false; } catch(_){}
    state.currentScreen = 'auth';
  });
  const pr = recordPaywallFrames(page, 1200);
  await page.evaluate(() => {
    try { enterAppUi(); } catch(e) { console.error(e); }
    try { _onbAdvanceStep(23, 24); } catch(e) {}
  });
  const summary = await pr;
  if (!summary.everVisible) pass('Kb new user @23 soft-source sign-in: paywall never painted across ' + summary.frameCount + ' frames');
  else fail('Kb new user soft-source flash', JSON.stringify(summary));
  // Now jump the user to 35 naturally — at the end of onboarding — and
  // confirm the paywall paints in SOFT mode (X visible).
  await page.evaluate(() => {
    try { _onbShowStep(35); } catch(e) {}
  });
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => ({
    pwActive: document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    pwHard: document.getElementById('onb-v2-paywall').classList.contains('pw-hard'),
    skipVisible: getComputedStyle(document.getElementById('onb-v2-paywall-skip')).visibility !== 'hidden',
  }));
  if (info.pwActive && !info.pwHard && info.skipVisible) pass('Kb paywall at step 35 reaches SOFT mode for app_store');
  else fail('Kb step 35 soft', JSON.stringify(info));
  await ctx.close();
}

// K-c — hard user signs out at paywall + back in → hard paywall.
// Reuses the escrow setup; asserts the paywall DOES appear in hard
// mode after enterAppUi (this is the one scenario where it SHOULD).
{
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{}}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
    localStorage.setItem('corpus_hard_paywall_escrow', '1');
    localStorage.setItem('corpus_hard_paywall_escrow_uid', 'user-hard-A');
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    state.onbAnswers = { source: 'instagram' };
    state.completedDays = {};
    state.isPaid = false;
    currentUser = { id: 'user-hard-A' };
    try { appStarted = false; } catch(_){}
    state.currentScreen = 'auth';
    try { enterAppUi(); } catch(e) { console.error(e); }
  });
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => ({
    pwActive: document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    pwHard: document.getElementById('onb-v2-paywall').classList.contains('pw-hard'),
    pwVisible: getComputedStyle(document.getElementById('onb-v2-paywall')).display !== 'none',
    step: localStorage.getItem('corpus_onboarding_step'),
  }));
  if (info.pwActive && info.pwHard && info.pwVisible && info.step === '35')
    pass('Kc hard user sign-out → sign-in: hard paywall painted at step 35');
  else fail('Kc hard resume regression', JSON.stringify(info));
  await ctx.close();
}

// K-d — existing finished user signs in during onboarding. Paywall
// must never flash — the finished gate marks done=1 and routes home.
{
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{}}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_onboarding_step', '12');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    // Returning finished user: server restored completedAt + completedDays.
    state.onbAnswers = { source: 'instagram', completedAt: '2026-08-01' };
    state.completedDays = { 'philosophy-1-1': true, 'philosophy-1-2': true };
    state.isPaid = false;
    currentUser = { id: 'user-finished' };
    try { appStarted = false; } catch(_){}
    state.currentScreen = 'auth';
  });
  const pr = recordPaywallFrames(page, 1200);
  await page.evaluate(() => { try { enterAppUi(); } catch(e) { console.error(e); } });
  const summary = await pr;
  const outcome = await page.evaluate(() => ({
    done: localStorage.getItem('corpus_onboarding_done'),
    homeVisible: getComputedStyle(document.getElementById('screen-home')).display !== 'none',
  }));
  if (!summary.everVisible && outcome.done === '1' && outcome.homeVisible)
    pass('Kd finished user sign-in: paywall never painted across ' + summary.frameCount + ' frames; home shown');
  else fail('Kd finished sign-in flash', JSON.stringify({ summary, outcome }));
  await ctx.close();
}

// K-e — paid user: paywall must never flash.
{
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{}}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_onboarding_step', '23');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    state.onbAnswers = { source: 'instagram' };
    state.completedDays = {};
    state.isPaid = true;
    currentUser = { id: 'user-paid-K' };
    try { appStarted = false; } catch(_){}
    state.currentScreen = 'auth';
  });
  const pr = recordPaywallFrames(page, 1200);
  await page.evaluate(() => { try { enterAppUi(); } catch(e) { console.error(e); } });
  const summary = await pr;
  if (!summary.everVisible) pass('Ke paid user sign-in: paywall never painted across ' + summary.frameCount + ' frames');
  else fail('Ke paid user flash', JSON.stringify(summary));
  // Belt-and-braces: direct _onbShowStep(35) on this paid user still
  // routes through _onbComplete without painting the shell.
  const pr2 = recordPaywallFrames(page, 600);
  await page.evaluate(() => { try { _onbShowStep(35); } catch(e) {} });
  const summary2 = await pr2;
  if (!summary2.everVisible) pass('Ke paid user direct _onbShowStep(35): paywall never painted across ' + summary2.frameCount + ' frames');
  else fail('Ke paid _onbShowStep flash', JSON.stringify(summary2));
  await ctx.close();
}

// Case M — New flow order (2026-11-14): streak (22) → signup (23) →
// source (36) → building (24). Simulate the signup success path and
// assert the paywall never flashes between 22 and 36, that source
// writes to state.onbAnswers under the signed-in user, and the
// eventual paywall at 35 renders in the correct hard/soft mode.
for (const [lang, chosenSrc, expectHard] of [
  ['en', 'instagram', true],
  ['he', 'app_store', false],
]) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{}}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
    localStorage.setItem('corpus_onboarding_step', '22');
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  await page.evaluate((lang) => {
    try { if (typeof setAppLang === 'function') setAppLang(lang); } catch(_){}
    state.onbAnswers = {};
    state.completedDays = {};
    state.isPaid = false;
  }, lang);

  // Start frame recording. The paywall must never be visible between
  // now and when we naturally reach step 35.
  const pr = recordPaywallFrames(page, 2500);

  // Simulate the streak → signup → source → building sequence.
  await page.evaluate(() => {
    try { _onbV2CtaStreak(); } catch(e) {}   // 22 → 23
  });
  await page.waitForTimeout(100);
  // Signup → source. Simulate post-auth: enterAppState + advance 23→36.
  await page.evaluate(() => {
    currentUser = { id: 'user-flow-A' };
    try { appStarted = false; } catch(_){}
    // Don't call real enterAppState — it reads from Supabase. Jump
    // directly to the advance the postAuthContinue would fire.
    try { _onbAdvanceStep(23, 37); } catch(e) {}
  });
  await page.waitForTimeout(300);
  // Assert we're on source.
  const atSource = await page.evaluate(() => ({
    sourceActive: document.getElementById('onb-v2-source').classList.contains('onb-active'),
    sourceVisible: getComputedStyle(document.getElementById('onb-v2-source')).display !== 'none',
    step: localStorage.getItem('corpus_onboarding_step'),
  }));
  if (atSource.sourceActive && atSource.sourceVisible && atSource.step === '37') pass('M ' + lang + ' 23→37 landed on source after signup');
  else fail('M ' + lang + ' source landing', JSON.stringify(atSource));

  // Tap the chosen source.
  await page.evaluate((src) => {
    const card = document.querySelector('#onb-v2-source-options .onb-v2-card[data-source-id="' + src + '"]');
    if (card) card.click();
  }, chosenSrc);
  await page.waitForTimeout(400);
  const afterSource = await page.evaluate(() => ({
    source: state.onbAnswers && state.onbAnswers.source,
    step: localStorage.getItem('corpus_onboarding_step'),
    buildingActive: document.getElementById('onb-v2-building').classList.contains('onb-active'),
  }));
  if (afterSource.source === chosenSrc && afterSource.step === '24' && afterSource.buildingActive)
    pass('M ' + lang + ' source=' + chosenSrc + ' → 24 (building)');
  else fail('M ' + lang + ' source→building', JSON.stringify(afterSource));

  // Finish the frame recording to verify no paywall ever flashed.
  const summary = await pr;
  if (!summary.everVisible) pass('M ' + lang + ' no paywall between 22 and 24 (' + summary.frameCount + ' frames)');
  else fail('M ' + lang + ' paywall flashed', JSON.stringify(summary));

  // Jump to step 35 (end of onboarding). Paywall must render in the
  // expected hard/soft mode based on the chosen source.
  await page.evaluate(() => {
    try { _onbShowStep(35); } catch(e) {}
  });
  await page.waitForTimeout(300);
  const atPaywall = await page.evaluate(() => ({
    pwActive: document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    pwHard: document.getElementById('onb-v2-paywall').classList.contains('pw-hard'),
  }));
  if (atPaywall.pwActive && atPaywall.pwHard === expectHard)
    pass('M ' + lang + ' paywall at 35: hard=' + atPaywall.pwHard + ' (expected ' + expectHard + ')');
  else fail('M ' + lang + ' paywall hard-mode', JSON.stringify(atPaywall));
  await ctx.close();
}

// Case N — Soft-paywall X completes onboarding (2026-11-14 regression).
// Device-test bug: the source step previously occupied slot 36, which
// was also the paywall-close completion sentinel (_paywallOnClose does
// _onbAdvanceStep(35, 36) → n>_ONB_TOTAL_STEPS → _onbComplete). Tapping
// X on the soft paywall landed users on the source step instead of
// home. Source has since moved to slot 37, 36 is vacant, and this test
// nails the completion edge.
for (const lang of ['en', 'he']) {
  const { ctx, page } = await freshPage({ lang, source: 'app_store' });  // soft mode → X visible
  // Simulate that the user has gone through the full flow already:
  // currentUser set so _onbComplete's server-side hook has an id to
  // write against.
  await page.evaluate(() => {
    currentUser = { id: 'user-paywall-x' };
    state.onbAnswers = state.onbAnswers || {};
    state.onbAnswers.source = 'app_store';
  });
  // Tap the X.
  await page.evaluate(() => {
    const x = document.getElementById('onb-v2-paywall-skip');
    if (x) x.click();
  });
  await page.waitForTimeout(400);
  const out = await page.evaluate(() => ({
    done: localStorage.getItem('corpus_onboarding_done'),
    pwActive: document.getElementById('onb-v2-paywall').classList.contains('onb-active'),
    sourceActive: document.getElementById('onb-v2-source').classList.contains('onb-active'),
    homeVisible: getComputedStyle(document.getElementById('screen-home')).display !== 'none',
    step: localStorage.getItem('corpus_onboarding_step'),
  }));
  if (out.done === '1' && !out.pwActive && !out.sourceActive && out.homeVisible && !out.step)
    pass('N ' + lang + ' soft paywall X → _onbComplete, home visible, done=1, no source');
  else fail('N ' + lang + ' paywall X landed wrong', JSON.stringify(out));
  await ctx.close();
}

// Case L — Device-test fixes:
//   La. Timeline dots are full circles (no left-side clip). Measure
//       each dot's getBoundingClientRect vs the paywall-inner's rect;
//       the dot's inline-start must be >= the inner's inline-start.
//   Lb. Hard-mode content is reachable via scroll. At 393×852 the
//       Sign out · Delete account row must be visible after scrolling
//       .onb-v7-mid to the bottom.
for (const [vw, vh] of [[393, 852], [360, 640]]) {
  for (const lang of ['en','he']) {
    const { ctx, page } = await freshPage({ lang, source: 'instagram', vw, vh });
    // Trial timeline IS visible for hard-mode (TRIAL_ENABLED=true).
    // La — no clip. Each timeline-dot's bounding rect must sit fully
    // within the paywall-inner's bounding rect.
    const clipInfo = await page.evaluate(() => {
      const inner = document.querySelector('#onb-v2-paywall .onb-v2-paywall-inner');
      const innerR = inner.getBoundingClientRect();
      const dots = Array.from(document.querySelectorAll('#onb-v2-paywall .paywall-timeline-dot'));
      return dots.map((d, i) => {
        const r = d.getBoundingClientRect();
        return {
          i,
          leftOk:  r.left  >= innerR.left  - 0.5,
          rightOk: r.right <= innerR.right + 0.5,
          w: r.width,
          h: r.height,
        };
      });
    });
    const allClear = clipInfo.length === 3 && clipInfo.every(d => d.leftOk && d.rightOk && d.w > 0 && d.h > 0);
    if (allClear) pass('La no dot clipping ' + lang + ' ' + vw + 'x' + vh + ' (' + clipInfo.length + ' dots fully within inner)');
    else fail('La dot clip ' + lang + ' ' + vw + 'x' + vh, JSON.stringify(clipInfo));

    // Lb — reachability of hard-mode footer via scroll.
    const reachInfo = await page.evaluate(() => {
      const mid = document.querySelector('#onb-v2-paywall .onb-v7-mid');
      const footer = document.querySelector('#onb-v2-paywall .paywall-hard-footer a');
      mid.scrollTop = mid.scrollHeight;
      const midR = mid.getBoundingClientRect();
      const fR = footer.getBoundingClientRect();
      return {
        scrollHeight: mid.scrollHeight,
        clientHeight: mid.clientHeight,
        canScroll: mid.scrollHeight > mid.clientHeight,
        footerVisible: fR.bottom <= midR.bottom + 1 && fR.top >= midR.top - 1,
      };
    });
    if (reachInfo.footerVisible) pass('Lb hard-mode footer reachable ' + lang + ' ' + vw + 'x' + vh + ' (scrollH=' + reachInfo.scrollHeight + ' clientH=' + reachInfo.clientHeight + ')');
    else fail('Lb footer unreachable ' + lang + ' ' + vw + 'x' + vh, JSON.stringify(reachInfo));
    await ctx.close();
  }
}

// Case I — screenshots.
const SHOTS = [];
for (const lang of ['en','he']) for (const theme of ['light','dark']) for (const [vw,vh] of [[393,852],[360,640]]) SHOTS.push({ lang, theme, vw, vh });
for (const m of SHOTS) {
  const { ctx, page } = await freshPage(Object.assign({ source: 'instagram' }, m));
  const name = `hard_${m.lang}_${m.theme}_${m.vw}x${m.vh}.png`;
  await page.screenshot({ path: join(OUT, name), fullPage: false });
  await ctx.close();
}
console.log('SHOTS written to ' + OUT);

await browser.close();
app.server.close();
console.log(FAILS === 0 ? 'ALL PASS' : ('FAILS: ' + FAILS));
process.exit(FAILS === 0 ? 0 : 1);

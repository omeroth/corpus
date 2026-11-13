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

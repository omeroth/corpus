// Relaunch regression — brand-new user killed at onboarding paywall
// (step 35). Verifies that, on next launch, enterAppUi does not render
// home anywhere in the pipeline:
//   • #screen-home must not carry the `.active` class
//   • state.currentScreen must not be 'home'
//   • renderHome() must never be invoked
//   • showScreen('home') must never be invoked
//   • per animation frame (rAF loop), no frame may show
//     paywall-inactive-while-home-active
//
// Covers hard (source=instagram) and soft (source=app_store) modes.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
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

async function runCase({ label, source }) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  // Seed the brand-new-user-at-paywall state BEFORE page load, and
  // install per-frame recorders + spies on renderHome / showScreen
  // BEFORE any app code runs.
  await page.addInitScript((args) => {
    window.__CORPUS_DEBUG_BUILD = true;
    window.Capacitor = { isNativePlatform:()=>false, getPlatform:()=>'ios', Plugins:{ Haptics:{impact:async()=>({})}, SplashScreen:{hide:async()=>({})}, App:{addListener:()=>({remove:()=>{}}), minimizeApp:()=>{}}, Preferences:{get:async()=>({})}, StatusBar:{setStyle:async()=>({})} } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_onboarding_step', '35');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
    localStorage.setItem('corpus_state', JSON.stringify({
      v: 3,
      lang: 'en',
      subject: 'philosophy',
      currentScreen: 'auth',
      completedDays: {},
      onbAnswers: { source: args.source },
    }));
    window.__renderHomeCalls = 0;
    window.__showScreenCalls = [];
    window.__frames = [];
    // Install spies as soon as the globals exist. We re-patch on a
    // microtask + rAF cycle to catch any reassignment during script
    // evaluation.
    const installSpies = () => {
      if (typeof window.renderHome === 'function' && !window.renderHome.__spied) {
        const orig = window.renderHome;
        const spied = function (...a) { window.__renderHomeCalls++; return orig.apply(this, a); };
        spied.__spied = true;
        window.renderHome = spied;
      }
      if (typeof window.showScreen === 'function' && !window.showScreen.__spied) {
        const orig = window.showScreen;
        const spied = function (id, ...rest) { window.__showScreenCalls.push(id); return orig.call(this, id, ...rest); };
        spied.__spied = true;
        window.showScreen = spied;
      }
    };
    // Poll during initial script evaluation (functions declared top-
    // level attach to window late). Once seen, keep polling for ~2s
    // so we survive subsequent script-tag registrations.
    const t0 = Date.now();
    const poll = () => { installSpies(); if (Date.now() - t0 < 3000) setTimeout(poll, 10); };
    poll();
    // Per-frame recorder — runs from DOMContentLoaded onward.
    document.addEventListener('DOMContentLoaded', () => {
      const tick = () => {
        const sh = document.getElementById('screen-home');
        const pw = document.getElementById('onb-v2-paywall');
        window.__frames.push({
          t: Date.now(),
          homeActive: !!(sh && sh.classList.contains('active')),
          paywallActive: !!(pw && pw.classList.contains('onb-active') && getComputedStyle(pw).display !== 'none'),
          currentScreen: (typeof state !== 'undefined' && state) ? state.currentScreen : null,
        });
        if (window.__frames.length < 180) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { source });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(100);
  // Fake a signed-in user + run enterAppUi exactly as the Supabase
  // auth handler would.
  await page.evaluate(() => {
    try { window.currentUser = { id: 'test-user-uid-fixed' }; } catch(_) {}
    try { if (typeof enterAppUi === 'function') enterAppUi(); } catch (e) { window.__err = String(e); }
  });
  // Let the rAF recorder collect ~1.5s of frames.
  await page.waitForTimeout(1600);

  const result = await page.evaluate(() => {
    const paywall = document.getElementById('onb-v2-paywall');
    const screenHome = document.getElementById('screen-home');
    const skipBtn = document.getElementById('onb-v2-paywall-skip');
    return {
      paywallActive: !!(paywall && paywall.classList.contains('onb-active') && getComputedStyle(paywall).display !== 'none'),
      homeActiveFinal: !!(screenHome && screenHome.classList.contains('active')),
      hardClass: !!(paywall && paywall.classList.contains('pw-hard')),
      skipHidden: !!(skipBtn && getComputedStyle(skipBtn).visibility === 'hidden'),
      currentScreen: (typeof state !== 'undefined' && state && state.currentScreen) || null,
      done: localStorage.getItem('corpus_onboarding_done'),
      renderHomeCalls: window.__renderHomeCalls,
      showScreenCalls: window.__showScreenCalls.slice(),
      frames: window.__frames,
      err: window.__err || null,
    };
  });

  // Frame analysis — scan from the moment the paywall becomes active
  // onward. Early frames before initUI's _onbShowStep runs are
  // expected to have homeActive=true (initial HTML). After that point,
  // homeActive must stay false for every frame.
  let firstPaywallFrame = -1;
  for (let i = 0; i < result.frames.length; i++) {
    if (result.frames[i].paywallActive) { firstPaywallFrame = i; break; }
  }
  const framesAfterPaywall = firstPaywallFrame >= 0 ? result.frames.slice(firstPaywallFrame) : [];
  const badFrames = framesAfterPaywall.filter(f => f.homeActive || f.currentScreen === 'home');

  const paywallOK      = result.paywallActive;
  const homeFinalOK    = !result.homeActiveFinal;
  const currentOK      = result.currentScreen !== 'home';
  const doneOK         = !result.done;
  const noRenderHome   = result.renderHomeCalls === 0;
  const noShowHome     = !result.showScreenCalls.includes('home');
  const noBadFrames    = badFrames.length === 0;
  const modeOK = (source === 'instagram') ? (result.hardClass && result.skipHidden)
              : (!result.hardClass && !result.skipHidden);
  const pass = paywallOK && homeFinalOK && currentOK && doneOK && noRenderHome && noShowHome && noBadFrames && modeOK;

  const summary = {
    paywallOK, homeFinalOK, currentOK, doneOK, noRenderHome, noShowHome,
    noBadFrames, modeOK,
    renderHomeCalls: result.renderHomeCalls,
    showScreenCalls: result.showScreenCalls,
    totalFrames: result.frames.length,
    firstPaywallFrame,
    framesAfterPaywall: framesAfterPaywall.length,
    badFrames: badFrames.slice(0, 3),
    currentScreen: result.currentScreen,
  };
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label} ${JSON.stringify(summary)}`);
  await ctx.close();
  return pass;
}

const results = [];
results.push(await runCase({ label: 'relaunch @35 hard (source=instagram)', source: 'instagram' }));
results.push(await runCase({ label: 'relaunch @35 soft (source=app_store)', source: 'app_store' }));

await browser.close();
app.server.close();

const allPass = results.every(Boolean);
console.log(allPass ? 'ALL PASS' : 'FAIL');
process.exit(allPass ? 0 : 1);

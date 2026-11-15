// Widget-step determinism regression (2026-11-14).
//
// Companion to _r41h-item-widget-step.mjs. Verifies:
//   1. Five consecutive fresh runs on an iOS-mock device where the
//      widget is not installed → all five SHOW the step (no coin-flip
//      based on plugin cold-start timing).
//   2. Same mock reporting installed=true → SKIP.
//   3. Same mock reporting supported=false → SHOW (we default to show
//      on unsupported-plugin signals to never trap the user; the
//      actual OS-level "widgets disabled" case is non-iOS which is
//      handled by the platform gate instead).
//   4. Plugin that never resolves → SHOW after the 1 s deterministic
//      timeout (not a flaky race against 500 ms).
//   5. Plugin that throws → SHOW on error.
//   6. Decision persists within one onboarding run: once decided
//      ('show'), a re-entry reuses the same decision without another
//      plugin call. Second plugin call attempts must count 0.
//   7. __corpusResetOnboarding clears the decision so the next entry
//      re-evaluates (replay semantics).
//
// The bug this guards against: pre-fix, the step was sometimes shown
// and sometimes skipped on device depending on whether
// Capacitor.Plugins.CorpusWidgetBridge had finished bootstrapping by
// the moment _onbV2PrepareWidget fired. The 500 ms timeout vs cold-
// start plugin init was the race.
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const WWW = '/Users/omeroth/CORPUS/www';
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp' };
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

function fail(label, detail) { console.log('FAIL ' + label + (detail ? ' — ' + detail : '')); FAILS++; }
function pass(label) { console.log('PASS ' + label); }
let FAILS = 0;

async function openFresh({ installed = false, supported = true, pluginBehavior = 'resolve', latencyMs = 50 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript((args) => {
    window.__pluginCallCount = 0;
    const mkBridge = () => ({
      isWidgetInstalled: async () => {
        window.__pluginCallCount++;
        if (args.pluginBehavior === 'throw') {
          throw new Error('plugin threw');
        }
        if (args.pluginBehavior === 'never') {
          await new Promise(() => {}); // hangs forever
        }
        await new Promise(r => setTimeout(r, args.latencyMs));
        return { installed: args.installed, supported: args.supported };
      },
    });
    window.Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => 'ios',
      Plugins: {
        Haptics: { impact: async () => ({}) },
        SplashScreen: { hide: async () => ({}) },
        App: { addListener: () => ({ remove: () => {} }) },
        Preferences: { get: async () => ({}) },
        StatusBar: { setStyle: async () => ({}) },
        CorpusWidgetBridge: mkBridge(),
      },
    };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_onboarding_step', '30');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
  }, { installed, supported, pluginBehavior, latencyMs });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  return { ctx, page };
}

async function enterStep31(page, waitMs = 1400) {
  await page.evaluate(() => { _onbShowStep(31); });
  await page.waitForTimeout(waitMs);
  return page.evaluate(() => ({
    step: localStorage.getItem('corpus_onboarding_step'),
    widgetVisible: (() => { const el = document.getElementById('onb-v2-widget'); return el && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'; })(),
    widgetActive: document.getElementById('onb-v2-widget').classList.contains('onb-active'),
    decision: localStorage.getItem('corpus_onboarding_widget_decision'),
    pluginCalls: window.__pluginCallCount || 0,
  }));
}

// 1. Five consecutive fresh runs with installed=false and typical
//    plugin latency → every run SHOWS.
let shownCount = 0;
for (let i = 0; i < 5; i++) {
  const { ctx, page } = await openFresh({ installed: false, latencyMs: 80 });
  const out = await enterStep31(page);
  if (out.widgetVisible && out.widgetActive && out.step === '31' && out.decision === 'show') shownCount++;
  await ctx.close();
}
if (shownCount === 5) pass('5/5 fresh runs with installed=false → step SHOWN');
else fail('fresh-run determinism', 'only ' + shownCount + '/5 runs showed the step');

// 2. installed=true → SKIP.
{
  const { ctx, page } = await openFresh({ installed: true });
  const out = await enterStep31(page);
  if (out.step === '32' && !out.widgetActive && out.decision === 'skip') pass('installed=true → step SKIPPED, cursor=32');
  else fail('installed=true', JSON.stringify(out));
  await ctx.close();
}

// 3. supported=false → SHOW (default to show on any uncertainty signal).
{
  const { ctx, page } = await openFresh({ installed: false, supported: false });
  const out = await enterStep31(page);
  if (out.widgetVisible && out.decision === 'show') pass('supported=false (plugin-level) → step SHOWN');
  else fail('supported=false', JSON.stringify(out));
  await ctx.close();
}

// 4. Plugin never resolves → SHOW after the 1 s timeout.
{
  const { ctx, page } = await openFresh({ pluginBehavior: 'never' });
  // Give the plugin 1.3 s (longer than the 1 s timeout) to prove the
  // timeout path runs.
  const out = await enterStep31(page, 1400);
  if (out.widgetVisible && out.decision === 'show') pass('plugin never resolves → step SHOWN via 1s timeout');
  else fail('timeout path', JSON.stringify(out));
  await ctx.close();
}

// 5. Plugin throws → SHOW on error.
{
  const { ctx, page } = await openFresh({ pluginBehavior: 'throw' });
  const out = await enterStep31(page);
  if (out.widgetVisible && out.decision === 'show') pass('plugin throws → step SHOWN');
  else fail('error path', JSON.stringify(out));
  await ctx.close();
}

// 6. Decision persists within one onboarding run — re-enter step 31
//    and assert the plugin is NOT called a second time.
{
  const { ctx, page } = await openFresh({ installed: false });
  const first = await enterStep31(page);
  const firstCalls = first.pluginCalls;
  // Simulate a back-forward: _onbShowStep(31) again.
  await page.evaluate(() => { _onbShowStep(31); });
  await page.waitForTimeout(200);
  const second = await page.evaluate(() => ({
    pluginCalls: window.__pluginCallCount || 0,
    decision: localStorage.getItem('corpus_onboarding_widget_decision'),
    widgetVisible: (() => { const el = document.getElementById('onb-v2-widget'); return el && getComputedStyle(el).display !== 'none'; })(),
  }));
  if (second.pluginCalls === firstCalls && second.decision === 'show')
    pass('decision persists: 2nd entry reuses "show" (plugin called ' + firstCalls + 'x, not again)');
  else fail('decision persistence', JSON.stringify({ first, second }));
  await ctx.close();
}

// 7. __corpusResetOnboarding clears the decision.
{
  const { ctx, page } = await openFresh({ installed: true });
  await enterStep31(page);
  const before = await page.evaluate(() => localStorage.getItem('corpus_onboarding_widget_decision'));
  await page.evaluate(() => window.__corpusResetOnboarding());
  const after = await page.evaluate(() => localStorage.getItem('corpus_onboarding_widget_decision'));
  if (before === 'skip' && after === null) pass('__corpusResetOnboarding clears widget decision (was ' + before + ', now null)');
  else fail('reset helper', JSON.stringify({ before, after }));
  await ctx.close();
}

// 8. Non-iOS → SKIP.
{
  const ctx = await browser.newContext({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.Capacitor = { isNativePlatform: () => false, getPlatform: () => 'web', Plugins: { Haptics: { impact: async () => ({}) }, SplashScreen: { hide: async () => ({}) }, App: { addListener: () => ({ remove: () => {} }) }, Preferences: { get: async () => ({}) }, StatusBar: { setStyle: async () => ({}) } } };
    try { localStorage.clear(); } catch(_){}
    localStorage.setItem('corpus_subject', 'philosophy');
    localStorage.setItem('corpus_lang', 'en');
    localStorage.setItem('corpus_onboarding_step', '30');
    localStorage.setItem('corpus_onboarding_flow_version', '7');
  });
  await page.goto(`http://127.0.0.1:${app.port}/index.html`, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const out = await enterStep31(page);
  if (out.step === '32' && !out.widgetActive && out.decision === 'skip') pass('non-iOS → step SKIPPED, cursor=32');
  else fail('non-iOS skip', JSON.stringify(out));
  await ctx.close();
}

await browser.close();
app.server.close();
console.log(FAILS === 0 ? 'ALL PASS' : ('FAILS: ' + FAILS));
process.exit(FAILS === 0 ? 0 : 1);
